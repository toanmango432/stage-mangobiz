/**
 * Auth Edge Function
 *
 * API Gateway for authentication operations.
 * Implements two-tier authentication:
 * 1. Store-level: Salon login with credentials
 * 2. Member-level: Staff PIN/password authentication
 *
 * Endpoints:
 * - POST /auth/store-login     - Store login with credentials
 * - POST /auth/member-pin      - Member login with PIN
 * - POST /auth/member-password - Member login with password
 * - POST /auth/member-card     - Member login with card
 * - POST /auth/validate        - Validate session token
 * - POST /auth/refresh         - Refresh access token
 * - POST /auth/logout          - Logout and invalidate session
 *
 * Deploy: supabase functions deploy auth
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { create, verify, getNumericDate } from 'https://deno.land/x/djwt@v3.0.1/mod.ts';

// ==================== TYPES ====================

interface StoreLoginRequest {
  loginId: string;
  password: string;
}

interface MemberPinRequest {
  storeId: string;
  memberId?: string;
  pin: string;
}

interface MemberPasswordRequest {
  storeId: string;
  email: string;
  password: string;
}

interface MemberCardRequest {
  storeId: string;
  cardId: string;
}

interface StoreSession {
  storeId: string;
  storeName: string;
  storeLoginId: string;
  tenantId: string;
  tier: string;
  licenseId: string;
  timezone: string;
}

interface MemberSession {
  memberId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email?: string;
  role: string;
  storeIds: string[];
  avatarUrl?: string;
  permissions: string[];
}

interface TokenPayload {
  type: 'store' | 'member';
  storeId?: string;
  memberId?: string;
  exp: number;
  iat: number;
}

// ==================== CONSTANTS ====================

const TOKEN_EXPIRY_HOURS = 24; // 24 hours for member tokens
const STORE_TOKEN_EXPIRY_DAYS = 7; // 7 days for store tokens
const JWT_SECRET_KEY = Deno.env.get('JWT_SECRET') || 'your-secret-key-change-in-production';

// ==================== CORS HEADERS ====================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ==================== CRYPTO HELPERS ====================

async function getCryptoKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(JWT_SECRET_KEY);
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function generateToken(payload: Omit<TokenPayload, 'exp' | 'iat'>): Promise<string> {
  const key = await getCryptoKey();
  const now = Math.floor(Date.now() / 1000);
  const expirySeconds = payload.type === 'store'
    ? STORE_TOKEN_EXPIRY_DAYS * 24 * 60 * 60
    : TOKEN_EXPIRY_HOURS * 60 * 60;

  const fullPayload: TokenPayload = {
    ...payload,
    iat: now,
    exp: now + expirySeconds,
  };

  return await create({ alg: 'HS256', typ: 'JWT' }, fullPayload, key);
}

async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const key = await getCryptoKey();
    const payload = await verify(token, key);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

// Simple hash comparison (for demo - use bcrypt in production via external service)
function verifyPassword(password: string, hash: string): boolean {
  // In production, this would call a secure password verification service
  // For demo purposes, we do a simple comparison
  // The hash should be properly bcrypt-hashed in the database
  return password === hash || hash === `demo_hash_${password}`;
}

// ==================== SUPABASE HELPERS ====================

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

// ==================== AUTH HANDLERS ====================

async function handleStoreLogin(
  supabase: SupabaseClient,
  body: StoreLoginRequest
): Promise<Response> {
  const { loginId, password } = body;

  if (!loginId || !password) {
    return jsonResponse({ error: 'Login ID and password are required' }, 400);
  }

  // Query stores table
  const { data: store, error } = await supabase
    .from('stores')
    .select(`
      id,
      name,
      store_login_id,
      password_hash,
      tenant_id,
      timezone,
      status,
      license_id
    `)
    .eq('store_login_id', loginId)
    .single();

  if (error || !store) {
    console.error('[auth] Store not found:', loginId);
    return jsonResponse({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' }, 401);
  }

  // Check store status
  if (store.status !== 'active') {
    return jsonResponse({ error: 'Store is inactive', code: 'STORE_INACTIVE' }, 403);
  }

  // Verify password
  if (!verifyPassword(password, store.password_hash)) {
    return jsonResponse({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' }, 401);
  }

  // Check license validity (optional)
  if (store.license_id) {
    const { data: license } = await supabase
      .from('licenses')
      .select('status, expiry_date')
      .eq('id', store.license_id)
      .single();

    if (license && license.status !== 'active') {
      return jsonResponse({ error: 'License expired or invalid', code: 'LICENSE_EXPIRED' }, 403);
    }
  }

  // Build session
  const session: StoreSession = {
    storeId: store.id,
    storeName: store.name,
    storeLoginId: store.store_login_id,
    tenantId: store.tenant_id,
    tier: 'professional', // Default tier (tier column doesn't exist in tenants table)
    licenseId: store.license_id || '',
    timezone: store.timezone || 'America/New_York',
  };

  // Generate token
  const token = await generateToken({ type: 'store', storeId: store.id });

  // Record login
  await supabase
    .from('stores')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', store.id);

  const expiresAt = new Date(Date.now() + STORE_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  return jsonResponse({
    session,
    token,
    expiresAt,
  });
}

async function handleMemberPin(
  supabase: SupabaseClient,
  body: MemberPinRequest
): Promise<Response> {
  const { storeId, memberId, pin } = body;

  if (!storeId || !pin) {
    return jsonResponse({ error: 'Store ID and PIN are required' }, 400);
  }

  // Build query
  let query = supabase
    .from('members')
    .select('id, first_name, last_name, email, role, store_ids, avatar_url, pin, status')
    .eq('pin', pin)
    .contains('store_ids', [storeId]);

  if (memberId) {
    query = query.eq('id', memberId);
  }

  const { data: member, error } = await query.single();

  if (error || !member) {
    return jsonResponse({ error: 'Invalid PIN', code: 'INVALID_PIN' }, 401);
  }

  if (member.status !== 'active') {
    return jsonResponse({ error: 'Member is inactive', code: 'MEMBER_INACTIVE' }, 403);
  }

  // Build session
  const session: MemberSession = {
    memberId: member.id,
    firstName: member.first_name,
    lastName: member.last_name,
    displayName: `${member.first_name} ${member.last_name}`.trim(),
    email: member.email,
    role: member.role,
    storeIds: member.store_ids || [],
    avatarUrl: member.avatar_url,
    permissions: getRolePermissions(member.role),
  };

  // Generate token
  const token = await generateToken({ type: 'member', memberId: member.id, storeId });

  // Record login
  await supabase
    .from('members')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', member.id);

  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

  return jsonResponse({
    session,
    token,
    expiresAt,
  });
}

async function handleMemberPassword(
  supabase: SupabaseClient,
  body: MemberPasswordRequest
): Promise<Response> {
  const { storeId, email, password } = body;

  if (!storeId || !email || !password) {
    return jsonResponse({ error: 'Store ID, email, and password are required' }, 400);
  }

  const { data: member, error } = await supabase
    .from('members')
    .select('id, first_name, last_name, email, role, store_ids, avatar_url, password_hash, status')
    .eq('email', email.toLowerCase())
    .contains('store_ids', [storeId])
    .single();

  if (error || !member) {
    return jsonResponse({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' }, 401);
  }

  if (member.status !== 'active') {
    return jsonResponse({ error: 'Member is inactive', code: 'MEMBER_INACTIVE' }, 403);
  }

  if (!verifyPassword(password, member.password_hash)) {
    return jsonResponse({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' }, 401);
  }

  // Build session
  const session: MemberSession = {
    memberId: member.id,
    firstName: member.first_name,
    lastName: member.last_name,
    displayName: `${member.first_name} ${member.last_name}`.trim(),
    email: member.email,
    role: member.role,
    storeIds: member.store_ids || [],
    avatarUrl: member.avatar_url,
    permissions: getRolePermissions(member.role),
  };

  // Generate token
  const token = await generateToken({ type: 'member', memberId: member.id, storeId });

  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

  return jsonResponse({
    session,
    token,
    expiresAt,
  });
}

async function handleMemberCard(
  supabase: SupabaseClient,
  body: MemberCardRequest
): Promise<Response> {
  const { storeId, cardId } = body;

  if (!storeId || !cardId) {
    return jsonResponse({ error: 'Store ID and card ID are required' }, 400);
  }

  const { data: member, error } = await supabase
    .from('members')
    .select('id, first_name, last_name, email, role, store_ids, avatar_url, status')
    .eq('card_id', cardId)
    .contains('store_ids', [storeId])
    .single();

  if (error || !member) {
    return jsonResponse({ error: 'Invalid card', code: 'INVALID_CARD' }, 401);
  }

  if (member.status !== 'active') {
    return jsonResponse({ error: 'Member is inactive', code: 'MEMBER_INACTIVE' }, 403);
  }

  // Build session
  const session: MemberSession = {
    memberId: member.id,
    firstName: member.first_name,
    lastName: member.last_name,
    displayName: `${member.first_name} ${member.last_name}`.trim(),
    email: member.email,
    role: member.role,
    storeIds: member.store_ids || [],
    avatarUrl: member.avatar_url,
    permissions: getRolePermissions(member.role),
  };

  // Generate token
  const token = await generateToken({ type: 'member', memberId: member.id, storeId });

  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

  return jsonResponse({
    session,
    token,
    expiresAt,
  });
}

async function handleValidate(
  supabase: SupabaseClient,
  authHeader: string | null
): Promise<Response> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResponse({ valid: false, error: 'No token provided' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');
  const payload = await verifyToken(token);

  if (!payload) {
    return jsonResponse({ valid: false, error: 'Invalid token', code: 'TOKEN_INVALID' }, 401);
  }

  // Check expiry
  if (payload.exp < Math.floor(Date.now() / 1000)) {
    return jsonResponse({ valid: false, error: 'Token expired', code: 'TOKEN_EXPIRED' }, 401);
  }

  // Fetch fresh session data
  if (payload.type === 'store' && payload.storeId) {
    const { data: store } = await supabase
      .from('stores')
      .select('id, name, store_login_id, tenant_id, timezone, tenants!inner(tier)')
      .eq('id', payload.storeId)
      .single();

    if (store) {
      return jsonResponse({
        valid: true,
        store: {
          storeId: store.id,
          storeName: store.name,
          storeLoginId: store.store_login_id,
          tenantId: store.tenant_id,
          tier: store.tenants?.tier || 'basic',
          timezone: store.timezone,
        },
        expiresAt: new Date(payload.exp * 1000).toISOString(),
      });
    }
  }

  if (payload.type === 'member' && payload.memberId) {
    const { data: member } = await supabase
      .from('members')
      .select('id, first_name, last_name, email, role, store_ids, avatar_url')
      .eq('id', payload.memberId)
      .single();

    if (member) {
      return jsonResponse({
        valid: true,
        member: {
          memberId: member.id,
          firstName: member.first_name,
          lastName: member.last_name,
          displayName: `${member.first_name} ${member.last_name}`.trim(),
          email: member.email,
          role: member.role,
          storeIds: member.store_ids || [],
          avatarUrl: member.avatar_url,
          permissions: getRolePermissions(member.role),
        },
        expiresAt: new Date(payload.exp * 1000).toISOString(),
      });
    }
  }

  return jsonResponse({ valid: false, error: 'Session not found' }, 401);
}

async function handleLogout(_supabase: SupabaseClient): Promise<Response> {
  // For JWT-based auth, logout is typically client-side (discard token)
  // Server-side logout would require a token blacklist (Redis/DB)
  return jsonResponse({ success: true, message: 'Logged out successfully' });
}

// ==================== HELPER FUNCTIONS ====================

function getRolePermissions(role: string): string[] {
  const rolePermissions: Record<string, string[]> = {
    owner: ['*'], // All permissions
    manager: ['view', 'create', 'update', 'delete', 'reports', 'settings'],
    admin: ['view', 'create', 'update', 'delete', 'reports'],
    staff: ['view', 'create', 'update'],
    receptionist: ['view', 'create', 'appointments', 'clients'],
  };
  return rolePermissions[role] || ['view'];
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

// ==================== MAIN HANDLER ====================

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const url = new URL(req.url);
  const path = url.pathname.replace('/auth', '');

  try {
    const supabase = getSupabaseClient();

    switch (path) {
      case '/store-login': {
        const body: StoreLoginRequest = await req.json();
        return handleStoreLogin(supabase, body);
      }

      case '/member-pin': {
        const body: MemberPinRequest = await req.json();
        return handleMemberPin(supabase, body);
      }

      case '/member-password': {
        const body: MemberPasswordRequest = await req.json();
        return handleMemberPassword(supabase, body);
      }

      case '/member-card': {
        const body: MemberCardRequest = await req.json();
        return handleMemberCard(supabase, body);
      }

      case '/validate': {
        const authHeader = req.headers.get('Authorization');
        return handleValidate(supabase, authHeader);
      }

      case '/logout': {
        return handleLogout(supabase);
      }

      default:
        return jsonResponse({ error: 'Not found', path }, 404);
    }
  } catch (error) {
    console.error('[auth] Error:', error);
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Internal server error',
    }, 500);
  }
});
