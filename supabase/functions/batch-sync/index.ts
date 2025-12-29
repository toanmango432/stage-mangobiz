/**
 * Batch Sync Edge Function
 *
 * API Gateway for syncing multiple operations in a single request.
 * Reduces connection overhead and enables server-side rate limiting.
 *
 * Benefits:
 * - Single connection per batch (vs N connections for N operations)
 * - Server-side rate limiting per store
 * - Automatic retry handling
 * - Connection pooling via Supabase infrastructure
 *
 * Deploy: supabase functions deploy batch-sync
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ==================== TYPES ====================

interface SyncOperation {
  entity: 'clients' | 'staff' | 'services' | 'appointments' | 'tickets' | 'transactions';
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityId: string;
  data: Record<string, unknown>;
  localVersion?: number;
}

interface BatchSyncRequest {
  storeId: string;
  operations: SyncOperation[];
  clientTimestamp: string;
}

interface OperationResult {
  entityId: string;
  success: boolean;
  error?: string;
  serverVersion?: number;
  conflict?: boolean;
}

interface BatchSyncResponse {
  success: boolean;
  results: OperationResult[];
  serverTimestamp: string;
  rateLimited?: boolean;
  retryAfter?: number;
}

// ==================== RATE LIMITING ====================

// In-memory rate limit tracking (resets on function cold start)
// For production, use Redis or Supabase table
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute per store

function checkRateLimit(storeId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const key = `store:${storeId}`;

  let record = rateLimitMap.get(key);

  // Reset if window expired
  if (!record || now > record.resetAt) {
    record = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateLimitMap.set(key, record);
  }

  record.count++;

  if (record.count > RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true };
}

// ==================== CORS HEADERS ====================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ==================== MAIN HANDLER ====================

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: BatchSyncRequest = await req.json();
    const { storeId, operations, clientTimestamp } = body;

    // Validate required fields
    if (!storeId || !operations || !Array.isArray(operations)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: storeId, operations' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    const rateCheck = checkRateLimit(storeId);
    if (!rateCheck.allowed) {
      const response: BatchSyncResponse = {
        success: false,
        results: [],
        serverTimestamp: new Date().toISOString(),
        rateLimited: true,
        retryAfter: rateCheck.retryAfter,
      };
      return new Response(
        JSON.stringify(response),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for full access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Process operations
    const results: OperationResult[] = [];

    for (const op of operations) {
      try {
        const result = await processOperation(supabase, storeId, op);
        results.push(result);
      } catch (error) {
        results.push({
          entityId: op.entityId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Return response
    const response: BatchSyncResponse = {
      success: results.every(r => r.success),
      results,
      serverTimestamp: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[batch-sync] Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ==================== OPERATION PROCESSING ====================

async function processOperation(
  supabase: ReturnType<typeof createClient>,
  storeId: string,
  op: SyncOperation
): Promise<OperationResult> {
  const { entity, action, entityId, data } = op;

  // Map entity names to table names (handle naming differences)
  const tableMap: Record<string, string> = {
    clients: 'clients',
    staff: 'staff',
    services: 'services',
    appointments: 'appointments',
    tickets: 'tickets',
    transactions: 'transactions',
  };

  const tableName = tableMap[entity];
  if (!tableName) {
    return { entityId, success: false, error: `Unknown entity: ${entity}` };
  }

  // Ensure store_id matches (security check)
  if (data.store_id && data.store_id !== storeId) {
    return { entityId, success: false, error: 'Store ID mismatch' };
  }

  try {
    switch (action) {
      case 'CREATE': {
        // Add store_id and timestamps
        const insertData = {
          ...data,
          id: entityId,
          store_id: storeId,
          created_at: data.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sync_version: 1,
        };

        const { error } = await supabase
          .from(tableName)
          .insert(insertData);

        if (error) {
          // Handle duplicate key (record already exists)
          if (error.code === '23505') {
            // Try to update instead
            const { error: updateError } = await supabase
              .from(tableName)
              .update({ ...data, updated_at: new Date().toISOString() })
              .eq('id', entityId)
              .eq('store_id', storeId);

            if (updateError) throw updateError;
            return { entityId, success: true, serverVersion: 1 };
          }
          throw error;
        }

        return { entityId, success: true, serverVersion: 1 };
      }

      case 'UPDATE': {
        // Get current server version for conflict detection
        const { data: existing, error: fetchError } = await supabase
          .from(tableName)
          .select('sync_version')
          .eq('id', entityId)
          .eq('store_id', storeId)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        // Check for version conflict
        const serverVersion = existing?.sync_version || 0;
        const clientVersion = op.localVersion || 0;

        if (serverVersion > clientVersion) {
          // Server has newer version - conflict
          return {
            entityId,
            success: false,
            conflict: true,
            serverVersion,
            error: 'Version conflict - server has newer data',
          };
        }

        // Perform update
        const updateData = {
          ...data,
          updated_at: new Date().toISOString(),
          sync_version: serverVersion + 1,
        };

        const { error: updateError } = await supabase
          .from(tableName)
          .update(updateData)
          .eq('id', entityId)
          .eq('store_id', storeId);

        if (updateError) throw updateError;

        return { entityId, success: true, serverVersion: serverVersion + 1 };
      }

      case 'DELETE': {
        // Soft delete - set is_deleted flag
        const { error } = await supabase
          .from(tableName)
          .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', entityId)
          .eq('store_id', storeId);

        if (error) throw error;

        return { entityId, success: true };
      }

      default:
        return { entityId, success: false, error: `Unknown action: ${action}` };
    }
  } catch (error) {
    console.error(`[batch-sync] Operation failed:`, { entity, action, entityId, error });
    return {
      entityId,
      success: false,
      error: error instanceof Error ? error.message : 'Operation failed',
    };
  }
}
