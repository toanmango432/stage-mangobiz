/**
 * Validate Booking Edge Function
 *
 * Centralized booking validation including:
 * - Client blocked status
 * - Patch test requirements (service-level)
 * - Patch test expiration (client-level)
 *
 * Endpoint:
 * - POST /validate-booking
 *
 * Request body:
 * - clientId: string - Client ID to validate
 * - serviceId: string - Service being booked
 * - appointmentDate?: string - Optional appointment date (ISO format)
 * - storeId?: string - Optional store context
 *
 * Response:
 * - { valid: true } - Booking can proceed
 * - { valid: false, reason: string, message: string, canOverride?: boolean }
 *
 * Reasons:
 * - client_blocked: Client is blocked from booking
 * - patch_test_required: Service requires patch test, client has none
 * - patch_test_expired: Client's patch test for this service has expired
 *
 * Deploy: supabase functions deploy validate-booking
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ==================== TYPES ====================

interface ValidateBookingRequest {
  clientId: string;
  serviceId: string;
  appointmentDate?: string;
  storeId?: string;
}

interface ValidationResponse {
  valid: boolean;
  reason?: 'client_blocked' | 'patch_test_required' | 'patch_test_expired';
  message?: string;
  canOverride?: boolean;
}

interface ClientRecord {
  id: string;
  is_blocked: boolean;
  block_reason?: string;
}

interface ServiceRecord {
  id: string;
  name: string;
  requires_patch_test?: boolean;
}

interface PatchTestRecord {
  id: string;
  client_id: string;
  service_id: string;
  result: string;
  expires_at: string;
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
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// ==================== VALIDATION LOGIC ====================

async function validateBooking(
  supabase: SupabaseClient,
  request: ValidateBookingRequest
): Promise<ValidationResponse> {
  const { clientId, serviceId, appointmentDate } = request;

  // Validate required parameters
  if (!clientId) {
    return {
      valid: false,
      reason: 'client_blocked',
      message: 'Client ID is required',
      canOverride: false,
    };
  }

  if (!serviceId) {
    return {
      valid: false,
      reason: 'patch_test_required',
      message: 'Service ID is required',
      canOverride: false,
    };
  }

  // 1. Check if client exists and is blocked
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, is_blocked, block_reason')
    .eq('id', clientId)
    .maybeSingle<ClientRecord>();

  if (clientError) {
    console.error('[validate-booking] Client query error:', clientError);
    // Fail open - allow booking on error
    return { valid: true };
  }

  if (!client) {
    // Client not found - could be a new client
    // Continue with validation (no block check needed)
  } else if (client.is_blocked) {
    return {
      valid: false,
      reason: 'client_blocked',
      message: 'Unable to book at this time. Please contact the salon.',
      canOverride: true, // Staff can override blocks
    };
  }

  // 2. Check if service requires patch test
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('id, name, requires_patch_test')
    .eq('id', serviceId)
    .maybeSingle<ServiceRecord>();

  if (serviceError) {
    console.error('[validate-booking] Service query error:', serviceError);
    // Fail open - allow booking on error
    return { valid: true };
  }

  if (!service) {
    // Service not found - allow booking (might be offline-only service)
    return { valid: true };
  }

  // Check if service requires patch test
  // Note: requires_patch_test column may not exist yet - handle gracefully
  const requiresPatchTest = service.requires_patch_test === true;

  if (!requiresPatchTest) {
    // Service doesn't require patch test - valid
    return { valid: true };
  }

  // 3. Service requires patch test - check if client has a valid one
  // Note: patch_tests table may not exist in Supabase yet
  // For now, try to query it and handle the error gracefully
  try {
    const now = appointmentDate || new Date().toISOString();

    const { data: patchTests, error: patchTestError } = await supabase
      .from('patch_tests')
      .select('id, client_id, service_id, result, expires_at')
      .eq('client_id', clientId)
      .eq('service_id', serviceId)
      .eq('result', 'pass')
      .gte('expires_at', now)
      .order('expires_at', { ascending: false })
      .limit(1);

    if (patchTestError) {
      // Table might not exist - log and allow booking
      console.warn('[validate-booking] Patch test query error (table may not exist):', patchTestError);
      // For services that require patch test but table doesn't exist,
      // return a patch_test_required warning that can be overridden
      return {
        valid: false,
        reason: 'patch_test_required',
        message: `Patch test required for ${service.name}. No patch test records available.`,
        canOverride: true,
      };
    }

    if (!patchTests || patchTests.length === 0) {
      // Check if there's an expired patch test
      const { data: expiredTests } = await supabase
        .from('patch_tests')
        .select('id, expires_at')
        .eq('client_id', clientId)
        .eq('service_id', serviceId)
        .eq('result', 'pass')
        .lt('expires_at', now)
        .order('expires_at', { ascending: false })
        .limit(1);

      if (expiredTests && expiredTests.length > 0) {
        return {
          valid: false,
          reason: 'patch_test_expired',
          message: `Patch test for ${service.name} has expired. A new patch test is required.`,
          canOverride: true,
        };
      }

      // No patch test found at all
      return {
        valid: false,
        reason: 'patch_test_required',
        message: `Patch test required for ${service.name}. Please perform a patch test first.`,
        canOverride: true,
      };
    }

    // Valid patch test exists
    return { valid: true };
  } catch (error) {
    // Unexpected error - log and allow booking
    console.error('[validate-booking] Unexpected error checking patch tests:', error);
    return { valid: true };
  }
}

// ==================== SERVE ====================

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const body: ValidateBookingRequest = await req.json();
    const supabase = getSupabaseClient();

    const result = await validateBooking(supabase, body);

    return jsonResponse(result);
  } catch (error) {
    console.error('[validate-booking] Error:', error);
    // On error, allow booking rather than blocking legitimate customers
    return jsonResponse({ valid: true });
  }
});
