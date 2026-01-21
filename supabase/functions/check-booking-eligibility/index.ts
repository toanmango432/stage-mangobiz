/**
 * Check Booking Eligibility Edge Function
 *
 * Validates whether a client is eligible to book appointments.
 * Used by Online Store to prevent blocked clients from booking.
 *
 * SECURITY: Never reveals blocking status or reason to the client.
 * Returns generic "Unable to book" message for blocked clients.
 *
 * Endpoint:
 * - POST /check-booking-eligibility
 *
 * Request body:
 * - clientId?: string - Direct client ID lookup
 * - email?: string - Lookup by email
 * - phone?: string - Lookup by phone
 * - storeId: string - Required for email/phone lookup
 *
 * Response:
 * - { eligible: true } - Client can book
 * - { eligible: false, message: "Unable to book at this time. Please call the salon." }
 *
 * Deploy: supabase functions deploy check-booking-eligibility
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ==================== TYPES ====================

interface CheckEligibilityRequest {
  clientId?: string;
  email?: string;
  phone?: string;
  storeId?: string;
}

interface EligibilityResponse {
  eligible: boolean;
  message?: string;
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

// Generic message to avoid revealing block status
const INELIGIBLE_MESSAGE = 'Unable to book at this time. Please call the salon.';

// ==================== MAIN HANDLER ====================

async function checkEligibility(
  supabase: SupabaseClient,
  request: CheckEligibilityRequest
): Promise<EligibilityResponse> {
  const { clientId, email, phone, storeId } = request;

  // Build query based on provided identifier
  let query = supabase
    .from('clients')
    .select('id, is_blocked');

  if (clientId) {
    // Direct ID lookup
    query = query.eq('id', clientId);
  } else if (email && storeId) {
    // Lookup by email within store
    query = query
      .eq('store_id', storeId)
      .eq('email', email.toLowerCase().trim());
  } else if (phone && storeId) {
    // Lookup by phone within store
    // Normalize phone by removing non-digits for exact match
    const normalizedPhone = phone.replace(/\D/g, '');

    // Require minimum phone length to avoid false matches
    if (normalizedPhone.length < 10) {
      // Phone number too short - allow booking (new client)
      return { eligible: true };
    }

    // Use suffix match (last 10 digits) to handle country code variations
    // This prevents partial matches while handling +1, 1, or no prefix
    const phoneSuffix = normalizedPhone.slice(-10);

    // Build a more precise query using text pattern matching
    // This matches phones ending with the last 10 digits
    query = query
      .eq('store_id', storeId)
      .like('phone', `%${phoneSuffix}`);
  } else {
    // No valid lookup criteria - allow booking (new client)
    return { eligible: true };
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error('[check-booking-eligibility] Query error:', error);
    // On error, allow booking rather than blocking legitimate customers
    return { eligible: true };
  }

  // No existing client found - eligible (new customer)
  if (!data) {
    return { eligible: true };
  }

  // Check if client is blocked
  if (data.is_blocked === true) {
    // SECURITY: Do NOT reveal that the client is blocked
    return {
      eligible: false,
      message: INELIGIBLE_MESSAGE,
    };
  }

  // Client exists and is not blocked
  return { eligible: true };
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
    const body: CheckEligibilityRequest = await req.json();
    const supabase = getSupabaseClient();

    const result = await checkEligibility(supabase, body);

    return jsonResponse(result);
  } catch (error) {
    console.error('[check-booking-eligibility] Error:', error);
    // On error, allow booking rather than blocking legitimate customers
    return jsonResponse({ eligible: true });
  }
});
