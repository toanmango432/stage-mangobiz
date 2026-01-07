/**
 * Services Edge Function
 *
 * API Gateway for service operations (read-only).
 * Provides RESTful endpoints for querying salon services.
 *
 * Endpoints:
 * - GET    /services?store_id=xxx                      - List all services
 * - GET    /services/:id                               - Get single service
 * - GET    /services/category/:category?store_id=xxx   - Get services by category
 * - GET    /services/active?store_id=xxx               - Get active services only
 *
 * Deploy: supabase functions deploy services
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ==================== TYPES ====================

interface ServiceRow {
  id: string;
  store_id: string;
  name: string;
  category: string | null;
  duration: number;
  price: number;
  is_active: boolean;
  sync_status: string;
  sync_version: number;
  created_at: string;
  updated_at: string;
}

interface Service {
  id: string;
  storeId: string;
  name: string;
  category?: string;
  duration: number;
  price: number;
  isActive: boolean;
  syncVersion: number;
  createdAt: string;
  updatedAt: string;
}

// ==================== CORS HEADERS ====================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-store-id',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

// ==================== TYPE CONVERTERS ====================

function toService(row: ServiceRow): Service {
  return {
    id: row.id,
    storeId: row.store_id,
    name: row.name,
    category: row.category || undefined,
    duration: row.duration,
    price: row.price,
    isActive: row.is_active,
    syncVersion: row.sync_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function getStoreId(req: Request, url: URL): string | null {
  const queryStoreId = url.searchParams.get('store_id');
  if (queryStoreId) return queryStoreId;

  const headerStoreId = req.headers.get('X-Store-ID');
  if (headerStoreId) return headerStoreId;

  return null;
}

function extractIdFromPath(path: string): string | null {
  const match = path.match(/^\/([a-f0-9-]{36})/i);
  return match ? match[1] : null;
}

// ==================== HANDLERS ====================

async function handleList(
  supabase: SupabaseClient,
  storeId: string,
  url: URL
): Promise<Response> {
  const updatedSince = url.searchParams.get('updated_since');
  const includeInactive = url.searchParams.get('include_inactive') === 'true';
  const limit = parseInt(url.searchParams.get('limit') || '200');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  let query = supabase
    .from('services')
    .select('*', { count: 'exact' })
    .eq('store_id', storeId)
    .order('category', { ascending: true })
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1);

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  if (updatedSince) {
    query = query.gte('updated_at', updatedSince);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[services] List error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  const services = (data || []).map(toService);

  // Group by category for convenience
  const categories: Record<string, Service[]> = {};
  for (const service of services) {
    const cat = service.category || 'Uncategorized';
    if (!categories[cat]) {
      categories[cat] = [];
    }
    categories[cat].push(service);
  }

  return jsonResponse({
    data: services,
    categories,
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

async function handleGet(supabase: SupabaseClient, serviceId: string): Promise<Response> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', serviceId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return jsonResponse({ error: 'Service not found' }, 404);
    }
    console.error('[services] Get error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({
    data: toService(data),
    timestamp: new Date().toISOString(),
  });
}

async function handleGetByCategory(
  supabase: SupabaseClient,
  storeId: string,
  category: string
): Promise<Response> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('store_id', storeId)
    .eq('category', category)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('[services] Get by category error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({
    data: (data || []).map(toService),
    category,
    timestamp: new Date().toISOString(),
  });
}

async function handleGetActive(supabase: SupabaseClient, storeId: string): Promise<Response> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('store_id', storeId)
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('[services] Get active error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  const services = (data || []).map(toService);

  // Group by category
  const categories: Record<string, Service[]> = {};
  for (const service of services) {
    const cat = service.category || 'Uncategorized';
    if (!categories[cat]) {
      categories[cat] = [];
    }
    categories[cat].push(service);
  }

  return jsonResponse({
    data: services,
    categories,
    timestamp: new Date().toISOString(),
  });
}

async function handleGetCategories(
  supabase: SupabaseClient,
  storeId: string
): Promise<Response> {
  const { data, error } = await supabase
    .from('services')
    .select('category')
    .eq('store_id', storeId)
    .eq('is_active', true);

  if (error) {
    console.error('[services] Get categories error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  // Get unique categories
  const categoriesSet = new Set<string>();
  for (const row of data || []) {
    if (row.category) {
      categoriesSet.add(row.category);
    }
  }

  const categories = Array.from(categoriesSet).sort();

  return jsonResponse({
    data: categories,
    timestamp: new Date().toISOString(),
  });
}

// ==================== MAIN HANDLER ====================

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow GET requests for this read-only endpoint
  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed. This is a read-only endpoint.' }, 405);
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/services/, '') || '/';

  try {
    const supabase = getSupabaseClient();

    // Route: GET /services/active
    if (path.startsWith('/active')) {
      const storeId = getStoreId(req, url);
      if (!storeId) {
        return jsonResponse({ error: 'store_id is required' }, 400);
      }
      return handleGetActive(supabase, storeId);
    }

    // Route: GET /services/categories
    if (path.startsWith('/categories')) {
      const storeId = getStoreId(req, url);
      if (!storeId) {
        return jsonResponse({ error: 'store_id is required' }, 400);
      }
      return handleGetCategories(supabase, storeId);
    }

    // Route: GET /services/category/:category
    if (path.startsWith('/category/')) {
      const category = decodeURIComponent(path.replace('/category/', '').split('/')[0]);
      if (!category) {
        return jsonResponse({ error: 'Category is required' }, 400);
      }
      const storeId = getStoreId(req, url);
      if (!storeId) {
        return jsonResponse({ error: 'store_id is required' }, 400);
      }
      return handleGetByCategory(supabase, storeId, category);
    }

    // Route: GET /services/:id
    if (path !== '/' && path !== '') {
      const serviceId = extractIdFromPath(path);
      if (!serviceId) {
        return jsonResponse({ error: 'Invalid service ID' }, 400);
      }
      return handleGet(supabase, serviceId);
    }

    // Route: GET /services (list)
    const storeId = getStoreId(req, url);
    if (!storeId) {
      return jsonResponse({ error: 'store_id is required' }, 400);
    }
    return handleList(supabase, storeId, url);
  } catch (error) {
    console.error('[services] Error:', error);
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      500
    );
  }
});
