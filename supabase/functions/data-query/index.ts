/**
 * Data Query Edge Function
 *
 * Secure API Gateway for all data queries with store_id validation.
 * Uses service_role key to bypass RLS and validates store_id server-side.
 *
 * This replaces direct ANON_KEY queries from the frontend for security.
 *
 * Supported entities: clients, staff, services, appointments, tickets, transactions
 *
 * Deploy: supabase functions deploy data-query
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ==================== TYPES ====================

type EntityType = 'clients' | 'staff' | 'services' | 'appointments' | 'tickets' | 'transactions';

interface QueryRequest {
  storeId: string;
  entity: EntityType;
  operation: 'getAll' | 'getById' | 'getByDate' | 'search' | 'getActive' | 'getByStatus';
  params?: {
    id?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    searchTerm?: string;
    limit?: number;
    offset?: number;
  };
}

interface QueryResponse {
  success: boolean;
  data?: unknown[];
  error?: string;
  count?: number;
}

// ==================== CORS HEADERS ====================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-store-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ==================== VALIDATION ====================

function validateStoreId(storeId: string): boolean {
  // UUID v4 format validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(storeId);
}

function validateEntity(entity: string): entity is EntityType {
  return ['clients', 'staff', 'services', 'appointments', 'tickets', 'transactions'].includes(entity);
}

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
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: QueryRequest = await req.json();
    const { storeId, entity, operation, params = {} } = body;

    // Validate required fields
    if (!storeId || !entity || !operation) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: storeId, entity, operation' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate store_id format
    if (!validateStoreId(storeId)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid store_id format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate entity type
    if (!validateEntity(entity)) {
      return new Response(
        JSON.stringify({ success: false, error: `Invalid entity: ${entity}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Verify store exists and is active
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, status')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      return new Response(
        JSON.stringify({ success: false, error: 'Store not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (store.status === 'suspended') {
      return new Response(
        JSON.stringify({ success: false, error: 'Store is suspended' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Execute query based on operation
    const result = await executeQuery(supabase, entity, operation, storeId, params);

    return new Response(
      JSON.stringify(result),
      { status: result.success ? 200 : 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[data-query] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ==================== QUERY EXECUTION ====================

async function executeQuery(
  supabase: ReturnType<typeof createClient>,
  entity: EntityType,
  operation: string,
  storeId: string,
  params: QueryRequest['params']
): Promise<QueryResponse> {
  const { id, date, startDate, endDate, status, searchTerm, limit = 1000, offset = 0 } = params || {};

  try {
    let query = supabase.from(entity).select('*', { count: 'exact' });

    // ALWAYS filter by store_id for security
    query = query.eq('store_id', storeId);

    switch (operation) {
      case 'getAll':
        // Just the store_id filter is enough
        break;

      case 'getById':
        if (!id) {
          return { success: false, error: 'Missing id parameter' };
        }
        query = query.eq('id', id);
        break;

      case 'getByDate':
        if (entity === 'appointments') {
          if (date) {
            // Single date - appointments that span this date
            const startOfDay = `${date}T00:00:00`;
            const endOfDay = `${date}T23:59:59`;
            query = query
              .gte('scheduled_start_time', startOfDay)
              .lte('scheduled_start_time', endOfDay);
          } else if (startDate && endDate) {
            query = query
              .gte('scheduled_start_time', `${startDate}T00:00:00`)
              .lte('scheduled_start_time', `${endDate}T23:59:59`);
          }
        } else if (entity === 'tickets' || entity === 'transactions') {
          if (date) {
            const startOfDay = `${date}T00:00:00`;
            const endOfDay = `${date}T23:59:59`;
            query = query
              .gte('created_at', startOfDay)
              .lte('created_at', endOfDay);
          } else if (startDate && endDate) {
            query = query
              .gte('created_at', `${startDate}T00:00:00`)
              .lte('created_at', `${endDate}T23:59:59`);
          }
        }
        break;

      case 'search':
        if (!searchTerm) {
          return { success: false, error: 'Missing searchTerm parameter' };
        }
        if (entity === 'clients') {
          // Search by name or phone
          query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
        } else if (entity === 'staff') {
          query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
        } else if (entity === 'services') {
          query = query.or(`name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
        }
        break;

      case 'getActive':
        if (entity === 'staff' || entity === 'services') {
          query = query.eq('is_active', true);
        } else if (entity === 'clients') {
          query = query.eq('is_blocked', false);
        }
        break;

      case 'getByStatus':
        if (!status) {
          return { success: false, error: 'Missing status parameter' };
        }
        query = query.eq('status', status);
        break;

      default:
        return { success: false, error: `Unknown operation: ${operation}` };
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error(`[data-query] Query error for ${entity}:`, error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: data || [],
      count: count || 0,
    };

  } catch (error) {
    console.error(`[data-query] Execution error for ${entity}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Query execution failed',
    };
  }
}
