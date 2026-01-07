/**
 * Clients Edge Function
 *
 * API Gateway for client CRUD operations.
 * Provides RESTful endpoints for managing salon clients.
 *
 * Endpoints:
 * - GET    /clients?store_id=xxx           - List all clients
 * - GET    /clients/:id                    - Get single client
 * - POST   /clients                        - Create client
 * - PUT    /clients/:id                    - Update client
 * - DELETE /clients/:id                    - Delete client (soft)
 * - GET    /clients/search?store_id=xxx&q= - Search clients
 * - GET    /clients/vip?store_id=xxx       - Get VIP clients
 *
 * Deploy: supabase functions deploy clients
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ==================== TYPES ====================

interface ClientRow {
  id: string;
  store_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  source?: string;
  notes?: string;
  tags?: string[];
  preferences?: Record<string, unknown>;
  is_vip?: boolean;
  is_blocked?: boolean;
  block_reason?: string;
  loyalty_info?: Record<string, unknown>;
  visit_summary?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  sync_version?: number;
}

interface Client {
  id: string;
  storeId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  source?: string;
  notes?: string;
  tags?: string[];
  preferences?: Record<string, unknown>;
  isVip?: boolean;
  isBlocked?: boolean;
  blockReason?: string;
  loyaltyInfo?: Record<string, unknown>;
  visitSummary?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  syncVersion?: number;
}

interface CreateClientRequest {
  storeId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  source?: string;
  notes?: string;
  tags?: string[];
  preferences?: Record<string, unknown>;
}

interface UpdateClientRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  notes?: string;
  tags?: string[];
  preferences?: Record<string, unknown>;
  isVip?: boolean;
  isBlocked?: boolean;
  blockReason?: string;
}

// ==================== CORS HEADERS ====================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-store-id',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// ==================== TYPE CONVERTERS ====================

function toClient(row: ClientRow): Client {
  return {
    id: row.id,
    storeId: row.store_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    source: row.source,
    notes: row.notes,
    tags: row.tags,
    preferences: row.preferences,
    isVip: row.is_vip,
    isBlocked: row.is_blocked,
    blockReason: row.block_reason,
    loyaltyInfo: row.loyalty_info,
    visitSummary: row.visit_summary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncVersion: row.sync_version,
  };
}

function toClientRow(client: CreateClientRequest | UpdateClientRequest, isCreate = false): Partial<ClientRow> {
  const row: Partial<ClientRow> = {};

  if ('storeId' in client && client.storeId) row.store_id = client.storeId;
  if ('firstName' in client && client.firstName !== undefined) row.first_name = client.firstName;
  if ('lastName' in client && client.lastName !== undefined) row.last_name = client.lastName;
  if ('email' in client) row.email = client.email;
  if ('phone' in client) row.phone = client.phone;
  if ('dateOfBirth' in client) row.date_of_birth = client.dateOfBirth;
  if ('gender' in client) row.gender = client.gender;
  if ('source' in client) row.source = client.source;
  if ('notes' in client) row.notes = client.notes;
  if ('tags' in client) row.tags = client.tags;
  if ('preferences' in client) row.preferences = client.preferences;
  if ('isVip' in client) row.is_vip = client.isVip;
  if ('isBlocked' in client) row.is_blocked = client.isBlocked;
  if ('blockReason' in client) row.block_reason = client.blockReason;

  // Always update timestamp
  row.updated_at = new Date().toISOString();

  if (isCreate) {
    row.created_at = new Date().toISOString();
    row.sync_version = 1;
  }

  return row;
}

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

function getStoreId(req: Request, url: URL): string | null {
  // Try query param first
  const queryStoreId = url.searchParams.get('store_id');
  if (queryStoreId) return queryStoreId;

  // Try header
  const headerStoreId = req.headers.get('X-Store-ID');
  if (headerStoreId) return headerStoreId;

  return null;
}

function extractIdFromPath(path: string): string | null {
  // Match /clients/:id or /clients/:id/...
  const match = path.match(/^\/([a-f0-9-]{36})/i);
  return match ? match[1] : null;
}

// ==================== HANDLERS ====================

async function handleList(
  supabase: SupabaseClient,
  storeId: string,
  url: URL
): Promise<Response> {
  const limit = parseInt(url.searchParams.get('limit') || '100');
  const offset = parseInt(url.searchParams.get('offset') || '0');
  const updatedSince = url.searchParams.get('updated_since');
  const includeBlocked = url.searchParams.get('include_blocked') === 'true';

  let query = supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .eq('store_id', storeId)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (!includeBlocked) {
    query = query.or('is_blocked.is.null,is_blocked.eq.false');
  }

  if (updatedSince) {
    query = query.gte('updated_at', updatedSince);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[clients] List error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  const clients = (data || []).map(toClient);

  return jsonResponse({
    data: clients,
    pagination: {
      page: Math.floor(offset / limit) + 1,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      hasMore: offset + limit < (count || 0),
    },
    timestamp: new Date().toISOString(),
  });
}

async function handleGet(
  supabase: SupabaseClient,
  clientId: string
): Promise<Response> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return jsonResponse({ error: 'Client not found' }, 404);
    }
    console.error('[clients] Get error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({
    data: toClient(data),
    timestamp: new Date().toISOString(),
  });
}

async function handleCreate(
  supabase: SupabaseClient,
  body: CreateClientRequest
): Promise<Response> {
  // Validate required fields
  if (!body.storeId || !body.firstName || !body.lastName) {
    return jsonResponse({
      error: 'Missing required fields: storeId, firstName, lastName',
    }, 400);
  }

  // Generate UUID for new client
  const id = crypto.randomUUID();

  const row = {
    id,
    ...toClientRow(body, true),
  };

  const { data, error } = await supabase
    .from('clients')
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error('[clients] Create error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({
    data: toClient(data),
    id,
    timestamp: new Date().toISOString(),
  }, 201);
}

async function handleUpdate(
  supabase: SupabaseClient,
  clientId: string,
  body: UpdateClientRequest
): Promise<Response> {
  // First check if client exists
  const { data: existing, error: fetchError } = await supabase
    .from('clients')
    .select('id, sync_version')
    .eq('id', clientId)
    .single();

  if (fetchError || !existing) {
    return jsonResponse({ error: 'Client not found' }, 404);
  }

  // Increment sync version
  const row = {
    ...toClientRow(body),
    sync_version: (existing.sync_version || 0) + 1,
  };

  const { data, error } = await supabase
    .from('clients')
    .update(row)
    .eq('id', clientId)
    .select()
    .single();

  if (error) {
    console.error('[clients] Update error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({
    data: toClient(data),
    timestamp: new Date().toISOString(),
  });
}

async function handleDelete(
  supabase: SupabaseClient,
  clientId: string
): Promise<Response> {
  // Hard delete (table doesn't have soft delete columns)
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId);

  if (error) {
    console.error('[clients] Delete error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({
    success: true,
    id: clientId,
    timestamp: new Date().toISOString(),
  });
}

async function handleSearch(
  supabase: SupabaseClient,
  storeId: string,
  query: string,
  limit = 20
): Promise<Response> {
  if (!query || query.length < 2) {
    return jsonResponse({ error: 'Search query must be at least 2 characters' }, 400);
  }

  // Search by name, email, or phone
  const searchTerm = `%${query}%`;

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('store_id', storeId)
    .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`)
    .order('last_name', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[clients] Search error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({
    data: (data || []).map(toClient),
    query,
    timestamp: new Date().toISOString(),
  });
}

async function handleVip(
  supabase: SupabaseClient,
  storeId: string
): Promise<Response> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('store_id', storeId)
    .eq('is_vip', true)
    .order('last_name', { ascending: true });

  if (error) {
    console.error('[clients] VIP error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({
    data: (data || []).map(toClient),
    timestamp: new Date().toISOString(),
  });
}

// ==================== MAIN HANDLER ====================

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  // Remove /clients prefix to get the action path
  const path = url.pathname.replace(/^\/clients/, '') || '/';

  try {
    const supabase = getSupabaseClient();

    // Route: GET /clients/search
    if (req.method === 'GET' && path.startsWith('/search')) {
      const storeId = getStoreId(req, url);
      if (!storeId) {
        return jsonResponse({ error: 'store_id is required' }, 400);
      }
      const query = url.searchParams.get('q') || '';
      const limit = parseInt(url.searchParams.get('limit') || '20');
      return handleSearch(supabase, storeId, query, limit);
    }

    // Route: GET /clients/vip
    if (req.method === 'GET' && path.startsWith('/vip')) {
      const storeId = getStoreId(req, url);
      if (!storeId) {
        return jsonResponse({ error: 'store_id is required' }, 400);
      }
      return handleVip(supabase, storeId);
    }

    // Route: GET /clients/:id
    if (req.method === 'GET' && path !== '/' && path !== '') {
      const clientId = extractIdFromPath(path);
      if (!clientId) {
        return jsonResponse({ error: 'Invalid client ID' }, 400);
      }
      return handleGet(supabase, clientId);
    }

    // Route: GET /clients (list)
    if (req.method === 'GET') {
      const storeId = getStoreId(req, url);
      if (!storeId) {
        return jsonResponse({ error: 'store_id is required' }, 400);
      }
      return handleList(supabase, storeId, url);
    }

    // Route: POST /clients
    if (req.method === 'POST') {
      const body: CreateClientRequest = await req.json();
      return handleCreate(supabase, body);
    }

    // Route: PUT /clients/:id
    if (req.method === 'PUT') {
      const clientId = extractIdFromPath(path);
      if (!clientId) {
        return jsonResponse({ error: 'Client ID is required' }, 400);
      }
      const body: UpdateClientRequest = await req.json();
      return handleUpdate(supabase, clientId, body);
    }

    // Route: DELETE /clients/:id
    if (req.method === 'DELETE') {
      const clientId = extractIdFromPath(path);
      if (!clientId) {
        return jsonResponse({ error: 'Client ID is required' }, 400);
      }
      return handleDelete(supabase, clientId);
    }

    return jsonResponse({ error: 'Not found', path }, 404);

  } catch (error) {
    console.error('[clients] Error:', error);
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Internal server error',
    }, 500);
  }
});
