/**
 * Generate Connect Token Edge Function
 *
 * Generates signed JWT tokens for Mango Connect SDK authentication.
 * The Connect SDK uses these tokens to authenticate with Biz's data.
 *
 * Endpoint:
 * - POST /generate-connect-token - Generate a new token for Connect SDK
 *
 * Request Body:
 * - storeId: string - Store ID
 * - tenantId: string - Tenant ID
 * - memberId: string - Member ID
 * - memberEmail: string - Member email
 * - memberName: string - Member display name
 * - role: string - Member role
 * - permissions: string[] - Member permissions
 *
 * Response:
 * - token: string - JWT token for Connect SDK
 * - expiresAt: number - Unix timestamp when token expires
 *
 * Deploy: supabase functions deploy generate-connect-token
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ==================== TYPES ====================

interface GenerateTokenRequest {
  storeId: string;
  tenantId: string;
  memberId: string;
  memberEmail: string;
  memberName: string;
  role: string;
  permissions: string[];
}

interface ConnectTokenPayload {
  sub: string; // memberId
  storeId: string;
  tenantId: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  iss: string;
  aud: string;
  iat: number;
  exp: number;
}

// ==================== CONSTANTS ====================

const TOKEN_EXPIRY_SECONDS = 3600; // 1 hour
const ISSUER = 'mango-biz';
const AUDIENCE = 'mango-connect';

// ==================== CORS HEADERS ====================

/**
 * Get allowed origins for CORS
 * In production, restrict to known domains
 */
function getAllowedOrigin(requestOrigin: string | null): string {
  const allowedOrigins = [
    'https://app.mango.ai',
    'https://pos.mango.ai',
    'https://staging.mango.ai',
  ];

  // Allow localhost in development
  if (requestOrigin?.startsWith('http://localhost:')) {
    return requestOrigin;
  }

  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }

  // Default to first allowed origin (won't match if request is from unknown origin)
  return allowedOrigins[0];
}

function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(requestOrigin),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// ==================== CRYPTO HELPERS ====================

/**
 * Base64url encode a string (URL-safe base64)
 */
function base64urlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Encode a string to base64url
 */
function stringToBase64url(str: string): string {
  const encoder = new TextEncoder();
  return base64urlEncode(encoder.encode(str));
}

/**
 * Generate HMAC-SHA256 signature for JWT
 */
async function generateSignature(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  return base64urlEncode(new Uint8Array(signature));
}

/**
 * Generate a signed JWT token
 */
async function generateJWT(payload: ConnectTokenPayload, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };

  const headerEncoded = stringToBase64url(JSON.stringify(header));
  const payloadEncoded = stringToBase64url(JSON.stringify(payload));
  const dataToSign = `${headerEncoded}.${payloadEncoded}`;

  const signature = await generateSignature(dataToSign, secret);

  return `${dataToSign}.${signature}`;
}

// ==================== RESPONSE HELPERS ====================

function jsonResponse(data: unknown, corsHeaders: Record<string, string>, status = 200): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// ==================== VALIDATION ====================

const MAX_STRING_LENGTH = 255;
const MAX_PERMISSION_COUNT = 50;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidString(value: unknown, maxLength = MAX_STRING_LENGTH): boolean {
  return typeof value === 'string' && value.length > 0 && value.length <= maxLength;
}

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= MAX_STRING_LENGTH;
}

function validateRequest(body: GenerateTokenRequest): string | null {
  const stringFields: Array<[string, unknown]> = [
    ['storeId', body.storeId],
    ['tenantId', body.tenantId],
    ['memberId', body.memberId],
    ['memberName', body.memberName],
    ['role', body.role],
  ];

  for (const [field, value] of stringFields) {
    if (!isValidString(value)) {
      return `${field} is required and must be a string (max ${MAX_STRING_LENGTH} chars)`;
    }
  }

  if (!isValidString(body.memberEmail) || !isValidEmail(body.memberEmail)) {
    return 'memberEmail is required and must be a valid email address';
  }

  if (!Array.isArray(body.permissions)) {
    return 'permissions is required and must be an array';
  }
  if (body.permissions.length > MAX_PERMISSION_COUNT) {
    return `permissions array cannot exceed ${MAX_PERMISSION_COUNT} items`;
  }
  if (!body.permissions.every(p => isValidString(p, 100))) {
    return 'Each permission must be a non-empty string (max 100 chars)';
  }

  return null;
}

// ==================== AUTH VERIFICATION ====================

async function verifySupabaseAuth(authHeader: string | null): Promise<{ valid: boolean; error?: string }> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Authorization header with Bearer token is required' };
  }

  const token = authHeader.replace('Bearer ', '');

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[generate-connect-token] Missing Supabase environment variables');
    return { valid: false, error: 'Server configuration error' };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    console.error('[generate-connect-token] Auth verification failed:', error?.message);
    return { valid: false, error: 'Invalid or expired token' };
  }

  return { valid: true };
}

// ==================== MAIN HANDLER ====================

serve(async (req: Request) => {
  // Get dynamic CORS headers based on request origin
  const requestOrigin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(requestOrigin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, corsHeaders, 405);
  }

  try {
    // Verify Supabase auth token
    const authHeader = req.headers.get('Authorization');
    const authResult = await verifySupabaseAuth(authHeader);

    if (!authResult.valid) {
      return jsonResponse({ error: authResult.error }, corsHeaders, 401);
    }

    // Parse and validate request body
    let body: GenerateTokenRequest;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, corsHeaders, 400);
    }

    const validationError = validateRequest(body);
    if (validationError) {
      return jsonResponse({ error: validationError }, corsHeaders, 400);
    }

    // Get JWT secret
    const jwtSecret = Deno.env.get('MANGO_CONNECT_JWT_SECRET');
    if (!jwtSecret) {
      console.error('[generate-connect-token] MANGO_CONNECT_JWT_SECRET not configured');
      return jsonResponse({ error: 'Server configuration error' }, corsHeaders, 500);
    }

    // Build token payload
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + TOKEN_EXPIRY_SECONDS;

    const payload: ConnectTokenPayload = {
      sub: body.memberId,
      storeId: body.storeId,
      tenantId: body.tenantId,
      email: body.memberEmail,
      name: body.memberName,
      role: body.role,
      permissions: body.permissions,
      iss: ISSUER,
      aud: AUDIENCE,
      iat: now,
      exp: expiresAt,
    };

    // Generate token
    const token = await generateJWT(payload, jwtSecret);

    return jsonResponse({
      token,
      expiresAt,
    }, corsHeaders);

  } catch (error) {
    console.error('[generate-connect-token] Error:', error);
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Internal server error',
    }, corsHeaders, 500);
  }
});
