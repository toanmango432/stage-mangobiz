/**
 * Identity Sync Safety Edge Function
 *
 * Fetches and merges safety data across all stores linked to a Mango identity.
 * Safety data is ALWAYS synced regardless of sharing preferences (per spec).
 *
 * Part of: Client Module Phase 5 - Multi-Store Client Sharing (Tier 1)
 * Reference: docs/architecture/MULTI_STORE_CLIENT_SPEC.md
 *
 * Endpoint:
 * - POST /identity-sync-safety - Get unified safety profile
 *
 * Request body:
 * {
 *   identityId: string - UUID of the mango_identity
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   safetyData: {
 *     allergies: string[]           - Merged allergies from all stores
 *     isBlocked: boolean            - True if blocked in ANY store
 *     blockReasons: string[]        - All block reasons across stores
 *     staffAlerts: StaffAlert[]     - All staff alerts across stores
 *     sources: {                    - Which stores contributed which data
 *       storeId: string
 *       storeName: string
 *       hasAllergies: boolean
 *       isBlocked: boolean
 *       hasStaffAlert: boolean
 *     }[]
 *   }
 * }
 *
 * Notes:
 * - This is a READ operation for display purposes
 * - Does NOT write data - just aggregates and returns
 * - Safety data is critical for client welfare
 * - Always accessible regardless of sharing_preferences
 *
 * Deploy: supabase functions deploy identity-sync-safety
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ==================== TYPES ====================

interface SyncSafetyRequest {
  identityId: string;
}

interface StaffAlert {
  message: string;
  createdAt: string;
  createdBy: string;
  createdByName?: string;
}

interface SafetyDataSource {
  storeId: string;
  storeName: string;
  hasAllergies: boolean;
  isBlocked: boolean;
  hasStaffAlert: boolean;
}

interface SafetyData {
  allergies: string[];
  isBlocked: boolean;
  blockReasons: string[];
  staffAlerts: StaffAlert[];
  sources: SafetyDataSource[];
}

interface SyncSafetyResponse {
  success: boolean;
  safetyData: SafetyData;
}

// ==================== CORS HEADERS ====================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ==================== HELPERS ====================

function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Parse allergies string into array
 * Handles various formats: comma-separated, semicolon-separated, newline-separated
 */
function parseAllergies(allergiesStr?: string): string[] {
  if (!allergiesStr) return [];

  return allergiesStr
    .split(/[,;\n]+/)
    .map(a => a.trim())
    .filter(a => a.length > 0);
}

/**
 * Merge allergies from multiple sources, removing duplicates
 */
function mergeAllergies(allergiesLists: string[][]): string[] {
  const uniqueSet = new Set<string>();

  for (const list of allergiesLists) {
    for (const allergy of list) {
      // Normalize to lowercase for deduplication
      uniqueSet.add(allergy.toLowerCase());
    }
  }

  // Return sorted array with proper casing (capitalize first letter)
  return Array.from(uniqueSet)
    .sort()
    .map(a => a.charAt(0).toUpperCase() + a.slice(1));
}

// ==================== MAIN HANDLER ====================

async function handleSyncSafety(
  supabase: SupabaseClient,
  request: SyncSafetyRequest
): Promise<Response> {
  const { identityId } = request;

  // Validate required field
  if (!identityId) {
    return jsonResponse({ error: 'identityId is required' }, 400);
  }

  console.log('[identity-sync-safety] Fetching safety data for identity:', identityId);

  try {
    // 1. Verify identity exists
    const { data: identity, error: identityError } = await supabase
      .from('mango_identities')
      .select('id')
      .eq('id', identityId)
      .single();

    if (identityError || !identity) {
      console.error('[identity-sync-safety] Identity not found:', identityError);
      return jsonResponse({ error: 'Identity not found' }, 404);
    }

    // 2. Fetch all linked stores for this identity
    const { data: linkedStores, error: linkedError } = await supabase
      .from('linked_stores')
      .select('id, store_id, store_name, local_client_id')
      .eq('mango_identity_id', identityId);

    if (linkedError) {
      console.error('[identity-sync-safety] Error fetching linked stores:', linkedError);
      return jsonResponse({ error: 'Failed to fetch linked stores' }, 500);
    }

    if (!linkedStores || linkedStores.length === 0) {
      console.log('[identity-sync-safety] No linked stores found');
      return jsonResponse({
        success: true,
        safetyData: {
          allergies: [],
          isBlocked: false,
          blockReasons: [],
          staffAlerts: [],
          sources: [],
        },
      } as SyncSafetyResponse);
    }

    console.log('[identity-sync-safety] Found', linkedStores.length, 'linked stores');

    // 3. Fetch safety data from all linked stores
    const clientIds = linkedStores.map(ls => ls.local_client_id);

    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, store_id, allergies, is_blocked, block_reason, staff_alert')
      .in('id', clientIds);

    if (clientsError) {
      console.error('[identity-sync-safety] Error fetching client data:', clientsError);
      return jsonResponse({ error: 'Failed to fetch client safety data' }, 500);
    }

    // 4. Aggregate safety data
    const allergiesLists: string[][] = [];
    let isBlockedAnywhere = false;
    const blockReasons: string[] = [];
    const staffAlerts: StaffAlert[] = [];
    const sources: SafetyDataSource[] = [];

    for (const client of clients || []) {
      const linkedStore = linkedStores.find(ls => ls.local_client_id === client.id);
      if (!linkedStore) continue;

      // Parse allergies
      const clientAllergies = parseAllergies(client.allergies);
      if (clientAllergies.length > 0) {
        allergiesLists.push(clientAllergies);
      }

      // Check if blocked
      const isBlocked = !!client.is_blocked;
      if (isBlocked) {
        isBlockedAnywhere = true;
        if (client.block_reason) {
          blockReasons.push(`${linkedStore.store_name}: ${client.block_reason}`);
        }
      }

      // Collect staff alerts
      if (client.staff_alert && typeof client.staff_alert === 'object') {
        const alert = client.staff_alert as StaffAlert;
        staffAlerts.push({
          ...alert,
          message: `[${linkedStore.store_name}] ${alert.message}`,
        });
      }

      // Track source
      sources.push({
        storeId: linkedStore.store_id,
        storeName: linkedStore.store_name,
        hasAllergies: clientAllergies.length > 0,
        isBlocked,
        hasStaffAlert: !!client.staff_alert,
      });
    }

    // 5. Merge and deduplicate data
    const mergedAllergies = mergeAllergies(allergiesLists);

    console.log('[identity-sync-safety] Safety data aggregated:', {
      allergiesCount: mergedAllergies.length,
      isBlocked: isBlockedAnywhere,
      blockReasonsCount: blockReasons.length,
      staffAlertsCount: staffAlerts.length,
      sourcesCount: sources.length,
    });

    // 6. Return unified safety profile
    return jsonResponse({
      success: true,
      safetyData: {
        allergies: mergedAllergies,
        isBlocked: isBlockedAnywhere,
        blockReasons,
        staffAlerts,
        sources,
      },
    } as SyncSafetyResponse);

  } catch (error) {
    console.error('[identity-sync-safety] Unexpected error:', error);
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Failed to sync safety data',
    }, 500);
  }
}

// ==================== SERVE ====================

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed. Use POST.' }, 405);
  }

  try {
    const supabase = getSupabaseClient();
    const body: SyncSafetyRequest = await req.json();

    return await handleSyncSafety(supabase, body);
  } catch (error) {
    console.error('[identity-sync-safety] Error parsing request:', error);
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Invalid request body',
    }, 400);
  }
});
