/**
 * Process Data Deletion Edge Function
 *
 * GDPR/CCPA compliant data deletion function.
 * Anonymizes client PII while preserving transaction history for accounting.
 *
 * IMPORTANT: This action is IRREVERSIBLE.
 *
 * Endpoint:
 * - POST /process-data-deletion - Anonymize client PII
 *
 * Request body:
 * {
 *   clientId: string       - Required: The client's UUID
 *   storeId: string        - Required: The store's UUID
 *   performedBy: string    - Required: UUID of the staff member performing deletion
 *   performedByName?: string - Optional: Name of the staff member
 *   requestId?: string     - Optional: data_request ID to update status
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   message: string
 *   anonymizedFields: string[]
 *   clearedFields: string[]
 *   preservedData: string[]
 * }
 *
 * Deploy: supabase functions deploy process-data-deletion
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ==================== TYPES ====================

interface DeletionRequest {
  clientId: string;
  storeId: string;
  performedBy: string;
  performedByName?: string;
  requestId?: string;
}

interface DeletionResult {
  success: boolean;
  message: string;
  anonymizedFields: string[];
  clearedFields: string[];
  preservedData: string[];
  timestamp: string;
}

// ==================== CORS HEADERS ====================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-store-id',
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

// ==================== MAIN HANDLER ====================

async function handleDeletion(
  supabase: SupabaseClient,
  request: DeletionRequest
): Promise<Response> {
  const { clientId, storeId, performedBy, performedByName, requestId } = request;

  // Validate required fields
  if (!clientId || !storeId || !performedBy) {
    return jsonResponse({
      error: 'clientId, storeId, and performedBy are required',
    }, 400);
  }

  console.log(`[process-data-deletion] Starting deletion for client ${clientId} in store ${storeId} by ${performedBy}`);

  try {
    // 1. Verify client exists and belongs to store
    const { data: existingClient, error: fetchError } = await supabase
      .from('clients')
      .select('id, first_name, last_name, email, phone')
      .eq('id', clientId)
      .eq('store_id', storeId)
      .single();

    if (fetchError || !existingClient) {
      console.error('[process-data-deletion] Client not found:', fetchError);
      return jsonResponse({ error: 'Client not found' }, 404);
    }

    // 2. Define what gets anonymized vs cleared vs preserved
    const anonymizedFields = [
      'first_name',
      'last_name',
      'email',
      'phone',
      'nickname',
      'display_name',
    ];

    const clearedFields = [
      'address',
      'emergency_contacts',
      'staff_alert',
      'notes',
      'hair_profile',
      'skin_profile',
      'nail_profile',
      'medical_info',
      'preferences',
      'avatar',
      'birthday',
      'anniversary',
      'referred_by_client_id',
      'referred_by_client_name',
      'source_details',
    ];

    const preservedData = [
      'id',
      'store_id',
      'loyalty_info (points preserved)',
      'visit_summary (counts preserved)',
      'membership (status preserved)',
      'created_at',
      'is_blocked',
      'is_vip',
    ];

    // 3. Build anonymized data update
    const anonymizedUpdate: Record<string, unknown> = {
      // Anonymize PII
      first_name: 'DELETED',
      last_name: 'DELETED',
      email: `deleted_${clientId}@removed.local`,
      phone: '0000000000',
      nickname: null,
      display_name: 'DELETED USER',

      // Clear sensitive data (set to null)
      address: null,
      emergency_contacts: null,
      staff_alert: null,
      notes: null,
      hair_profile: null,
      skin_profile: null,
      nail_profile: null,
      medical_info: null,
      preferences: null,
      avatar: null,
      birthday: null,
      anniversary: null,
      referred_by_client_id: null,
      referred_by_client_name: null,
      source_details: null,

      // Communication preferences - disable all
      communication_preferences: {
        allowEmail: false,
        allowSms: false,
        allowPhone: false,
        allowMarketing: false,
        appointmentReminders: false,
        birthdayGreetings: false,
        promotionalOffers: false,
        newsletterSubscribed: false,
        doNotContact: true,
      },

      // Set GDPR fields
      data_deletion_requested_at: new Date().toISOString(),
      consent_marketing: false,
      consent_marketing_at: new Date().toISOString(),
      consent_data_processing: false,
      consent_data_processing_at: new Date().toISOString(),

      // Update timestamp
      updated_at: new Date().toISOString(),
    };

    // 4. Update client with anonymized data
    const { error: updateError } = await supabase
      .from('clients')
      .update(anonymizedUpdate)
      .eq('id', clientId)
      .eq('store_id', storeId);

    if (updateError) {
      console.error('[process-data-deletion] Error updating client:', updateError);
      return jsonResponse({
        error: 'Failed to anonymize client data',
        details: updateError.message,
      }, 500);
    }

    console.log(`[process-data-deletion] Client ${clientId} PII anonymized successfully`);

    // 5. Log deletion action to data_retention_logs
    const allAffectedFields = [...anonymizedFields, ...clearedFields];

    const { error: logError } = await supabase.from('data_retention_logs').insert({
      client_id: clientId,
      store_id: storeId,
      action: 'data_deleted',
      fields_affected: allAffectedFields,
      performed_by: performedBy,
      performed_by_name: performedByName || null,
      performed_at: new Date().toISOString(),
    });

    if (logError) {
      console.error('[process-data-deletion] Error logging deletion action:', logError);
      // Continue anyway - deletion is more important than logging
    } else {
      console.log(`[process-data-deletion] Deletion logged to data_retention_logs`);
    }

    // 6. Update data request status if requestId provided
    if (requestId) {
      const { error: requestUpdateError } = await supabase
        .from('client_data_requests')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
          processed_by: performedBy,
        })
        .eq('id', requestId);

      if (requestUpdateError) {
        console.error('[process-data-deletion] Error updating request status:', requestUpdateError);
      } else {
        console.log(`[process-data-deletion] Data request ${requestId} marked as completed`);
      }
    }

    // 7. Anonymize client name in related records (appointments, tickets)
    // Note: We keep the records but anonymize the client_name field
    const anonymizedName = 'DELETED USER';

    // Update appointments
    const { error: appointmentsError } = await supabase
      .from('appointments')
      .update({
        client_name: anonymizedName,
        notes: null,
        updated_at: new Date().toISOString(),
      })
      .eq('client_id', clientId)
      .eq('store_id', storeId);

    if (appointmentsError) {
      console.error('[process-data-deletion] Error anonymizing appointments:', appointmentsError);
    }

    // Update tickets
    const { error: ticketsError } = await supabase
      .from('tickets')
      .update({
        client_name: anonymizedName,
        notes: null,
        updated_at: new Date().toISOString(),
      })
      .eq('client_id', clientId)
      .eq('store_id', storeId);

    if (ticketsError) {
      console.error('[process-data-deletion] Error anonymizing tickets:', ticketsError);
    }

    // 8. Delete form responses (contain PII like signatures)
    const { error: formsError } = await supabase
      .from('client_form_responses')
      .delete()
      .eq('client_id', clientId);

    if (formsError) {
      console.error('[process-data-deletion] Error deleting form responses:', formsError);
    }

    // 9. Delete client notes
    const { error: notesError } = await supabase
      .from('client_notes')
      .delete()
      .eq('client_id', clientId);

    if (notesError) {
      console.error('[process-data-deletion] Error deleting client notes:', notesError);
    }

    console.log(`[process-data-deletion] Deletion completed for client ${clientId}`);

    const result: DeletionResult = {
      success: true,
      message: 'Client data has been anonymized per GDPR/CCPA requirements. Transaction history has been preserved for accounting purposes.',
      anonymizedFields,
      clearedFields,
      preservedData,
      timestamp: new Date().toISOString(),
    };

    return jsonResponse(result);

  } catch (error) {
    console.error('[process-data-deletion] Unexpected error:', error);
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Failed to process data deletion',
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
    const body: DeletionRequest = await req.json();

    return await handleDeletion(supabase, body);
  } catch (error) {
    console.error('[process-data-deletion] Error parsing request:', error);
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Invalid request body',
    }, 400);
  }
});
