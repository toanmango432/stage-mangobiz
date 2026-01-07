/**
 * Tickets Edge Function
 *
 * API Gateway for ticket CRUD operations.
 * Provides RESTful endpoints for managing salon tickets/sales.
 *
 * Endpoints:
 * - GET    /tickets?store_id=xxx&date=yyyy-mm-dd  - List tickets by date
 * - GET    /tickets/:id                           - Get single ticket
 * - POST   /tickets                               - Create ticket
 * - PUT    /tickets/:id                           - Update ticket
 * - DELETE /tickets/:id                           - Delete ticket
 * - GET    /tickets/open?store_id=xxx             - Get open tickets
 * - POST   /tickets/:id/complete                  - Complete ticket
 * - POST   /tickets/:id/void                      - Void ticket
 *
 * Deploy: supabase functions deploy tickets
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ==================== TYPES ====================

interface TicketRow {
  id: string;
  store_id: string;
  appointment_id: string | null;
  client_id: string | null;
  client_name: string;
  services: unknown;
  products: unknown;
  status: string;
  subtotal: number;
  discount: number;
  tax: number;
  tip: number;
  total: number;
  payments: unknown;
  sync_status: string;
  sync_version: number;
  created_at: string;
  updated_at: string;
}

interface TicketService {
  serviceId: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  price: number;
  duration: number;
  commission?: number;
  status?: string;
}

interface TicketProduct {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

interface Payment {
  id: string;
  method: string;
  cardType?: string;
  cardLast4?: string;
  amount: number;
  tip: number;
  total: number;
  transactionId?: string;
  processedAt: string;
  status?: string;
}

interface Ticket {
  id: string;
  storeId: string;
  appointmentId?: string;
  clientId: string;
  clientName: string;
  services: TicketService[];
  products: TicketProduct[];
  status: string;
  subtotal: number;
  discount: number;
  tax: number;
  tip: number;
  total: number;
  payments: Payment[];
  syncVersion: number;
  createdAt: string;
  updatedAt: string;
}

interface CreateTicketRequest {
  storeId: string;
  appointmentId?: string;
  clientId?: string;
  clientName: string;
  services?: TicketService[];
  products?: TicketProduct[];
  subtotal?: number;
  discount?: number;
  tax?: number;
  tip?: number;
  total?: number;
}

interface UpdateTicketRequest {
  clientId?: string;
  clientName?: string;
  services?: TicketService[];
  products?: TicketProduct[];
  status?: string;
  subtotal?: number;
  discount?: number;
  tax?: number;
  tip?: number;
  total?: number;
  payments?: Payment[];
}

// ==================== CORS HEADERS ====================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-store-id',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// ==================== TYPE CONVERTERS ====================

function parseServices(json: unknown): TicketService[] {
  if (!json || !Array.isArray(json)) return [];

  return json.map((item) => {
    const s = item as Record<string, unknown>;
    return {
      serviceId: String(s.serviceId ?? s.service_id ?? ''),
      serviceName: String(s.serviceName ?? s.service_name ?? s.name ?? ''),
      staffId: String(s.staffId ?? s.staff_id ?? ''),
      staffName: String(s.staffName ?? s.staff_name ?? ''),
      price: Number(s.price ?? 0),
      duration: Number(s.duration ?? 0),
      commission: Number(s.commission ?? 0),
      status: String(s.status ?? 'not_started'),
    };
  });
}

function parseProducts(json: unknown): TicketProduct[] {
  if (!json || !Array.isArray(json)) return [];

  return json.map((item) => {
    const p = item as Record<string, unknown>;
    return {
      productId: String(p.productId ?? p.product_id ?? ''),
      productName: String(p.productName ?? p.product_name ?? p.name ?? ''),
      quantity: Number(p.quantity ?? 1),
      price: Number(p.price ?? p.unitPrice ?? p.unit_price ?? 0),
      total: Number(p.total ?? 0),
    };
  });
}

function parsePayments(json: unknown): Payment[] {
  if (!json || !Array.isArray(json)) return [];

  return json.map((item) => {
    const p = item as Record<string, unknown>;
    return {
      id: String(p.id ?? ''),
      method: String(p.method ?? p.payment_method ?? ''),
      cardType: (p.cardType ?? p.card_type) as string | undefined,
      cardLast4: (p.cardLast4 ?? p.card_last4) as string | undefined,
      amount: Number(p.amount ?? 0),
      tip: Number(p.tip ?? 0),
      total: Number(p.total ?? 0),
      transactionId: (p.transactionId ?? p.transaction_id) as string | undefined,
      processedAt: String(p.processedAt ?? p.processed_at ?? ''),
      status: p.status as string | undefined,
    };
  });
}

function serializeServices(services: TicketService[]): unknown[] {
  return services.map((s) => ({
    serviceId: s.serviceId,
    serviceName: s.serviceName,
    staffId: s.staffId,
    staffName: s.staffName,
    price: s.price,
    duration: s.duration,
    commission: s.commission,
    status: s.status,
  }));
}

function serializeProducts(products: TicketProduct[]): unknown[] {
  return products.map((p) => ({
    productId: p.productId,
    productName: p.productName,
    quantity: p.quantity,
    price: p.price,
    total: p.total,
  }));
}

function serializePayments(payments: Payment[]): unknown[] {
  return payments.map((p) => ({
    id: p.id,
    method: p.method,
    cardType: p.cardType,
    cardLast4: p.cardLast4,
    amount: p.amount,
    tip: p.tip,
    total: p.total,
    transactionId: p.transactionId,
    processedAt: p.processedAt,
    status: p.status,
  }));
}

function toTicket(row: TicketRow): Ticket {
  return {
    id: row.id,
    storeId: row.store_id,
    appointmentId: row.appointment_id || undefined,
    clientId: row.client_id || '',
    clientName: row.client_name,
    services: parseServices(row.services),
    products: parseProducts(row.products),
    status: row.status,
    subtotal: row.subtotal,
    discount: row.discount,
    tax: row.tax,
    tip: row.tip,
    total: row.total,
    payments: parsePayments(row.payments),
    syncVersion: row.sync_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toTicketRow(
  ticket: CreateTicketRequest | UpdateTicketRequest,
  isCreate = false
): Record<string, unknown> {
  const row: Record<string, unknown> = {};

  if ('storeId' in ticket && ticket.storeId) row.store_id = ticket.storeId;
  if ('appointmentId' in ticket) row.appointment_id = ticket.appointmentId || null;
  if ('clientId' in ticket) row.client_id = ticket.clientId || null;
  if ('clientName' in ticket && ticket.clientName !== undefined) row.client_name = ticket.clientName;
  if ('services' in ticket && ticket.services) row.services = serializeServices(ticket.services);
  if ('products' in ticket && ticket.products) row.products = serializeProducts(ticket.products);
  if ('status' in ticket && ticket.status) row.status = ticket.status;
  if ('subtotal' in ticket && ticket.subtotal !== undefined) row.subtotal = ticket.subtotal;
  if ('discount' in ticket && ticket.discount !== undefined) row.discount = ticket.discount;
  if ('tax' in ticket && ticket.tax !== undefined) row.tax = ticket.tax;
  if ('tip' in ticket && ticket.tip !== undefined) row.tip = ticket.tip;
  if ('total' in ticket && ticket.total !== undefined) row.total = ticket.total;
  if ('payments' in ticket && ticket.payments) row.payments = serializePayments(ticket.payments);

  row.updated_at = new Date().toISOString();

  if (isCreate) {
    row.created_at = new Date().toISOString();
    row.sync_status = 'synced';
    row.sync_version = 1;
    row.status = row.status || 'open';
    row.services = row.services || [];
    row.products = row.products || [];
    row.payments = row.payments || [];
    row.subtotal = row.subtotal ?? 0;
    row.discount = row.discount ?? 0;
    row.tax = row.tax ?? 0;
    row.tip = row.tip ?? 0;
    row.total = row.total ?? 0;
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

function getDateBounds(dateStr: string): { start: string; end: string } {
  const date = new Date(dateStr);
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

// ==================== HANDLERS ====================

async function handleList(
  supabase: SupabaseClient,
  storeId: string,
  url: URL
): Promise<Response> {
  const date = url.searchParams.get('date');
  const updatedSince = url.searchParams.get('updated_since');
  const limit = parseInt(url.searchParams.get('limit') || '100');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  let query = supabase
    .from('tickets')
    .select('*', { count: 'exact' })
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (date) {
    const { start, end } = getDateBounds(date);
    query = query.gte('created_at', start).lte('created_at', end);
  }

  if (updatedSince) {
    query = query.gte('updated_at', updatedSince);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[tickets] List error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  const tickets = (data || []).map(toTicket);

  return jsonResponse({
    data: tickets,
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

async function handleGet(supabase: SupabaseClient, ticketId: string): Promise<Response> {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', ticketId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return jsonResponse({ error: 'Ticket not found' }, 404);
    }
    console.error('[tickets] Get error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({
    data: toTicket(data),
    timestamp: new Date().toISOString(),
  });
}

async function handleCreate(
  supabase: SupabaseClient,
  body: CreateTicketRequest
): Promise<Response> {
  if (!body.storeId || !body.clientName) {
    return jsonResponse(
      {
        error: 'Missing required fields: storeId, clientName',
      },
      400
    );
  }

  const id = crypto.randomUUID();

  const row = {
    id,
    ...toTicketRow(body, true),
  };

  const { data, error } = await supabase.from('tickets').insert(row).select().single();

  if (error) {
    console.error('[tickets] Create error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse(
    {
      data: toTicket(data),
      id,
      timestamp: new Date().toISOString(),
    },
    201
  );
}

async function handleUpdate(
  supabase: SupabaseClient,
  ticketId: string,
  body: UpdateTicketRequest
): Promise<Response> {
  const { data: existing, error: fetchError } = await supabase
    .from('tickets')
    .select('id, sync_version')
    .eq('id', ticketId)
    .single();

  if (fetchError || !existing) {
    return jsonResponse({ error: 'Ticket not found' }, 404);
  }

  const row = {
    ...toTicketRow(body),
    sync_version: (existing.sync_version || 0) + 1,
  };

  const { data, error } = await supabase
    .from('tickets')
    .update(row)
    .eq('id', ticketId)
    .select()
    .single();

  if (error) {
    console.error('[tickets] Update error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({
    data: toTicket(data),
    timestamp: new Date().toISOString(),
  });
}

async function handleDelete(supabase: SupabaseClient, ticketId: string): Promise<Response> {
  const { error } = await supabase.from('tickets').delete().eq('id', ticketId);

  if (error) {
    console.error('[tickets] Delete error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({
    success: true,
    id: ticketId,
    timestamp: new Date().toISOString(),
  });
}

async function handleGetOpen(supabase: SupabaseClient, storeId: string): Promise<Response> {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('store_id', storeId)
    .in('status', ['open', 'pending', 'in_progress'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[tickets] Get open error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({
    data: (data || []).map(toTicket),
    timestamp: new Date().toISOString(),
  });
}

async function handleComplete(supabase: SupabaseClient, ticketId: string): Promise<Response> {
  const { data: existing, error: fetchError } = await supabase
    .from('tickets')
    .select('id, sync_version, status')
    .eq('id', ticketId)
    .single();

  if (fetchError || !existing) {
    return jsonResponse({ error: 'Ticket not found' }, 404);
  }

  if (existing.status === 'completed' || existing.status === 'voided') {
    return jsonResponse(
      { error: `Cannot complete ticket with status: ${existing.status}` },
      400
    );
  }

  const { data, error } = await supabase
    .from('tickets')
    .update({
      status: 'completed',
      sync_version: (existing.sync_version || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ticketId)
    .select()
    .single();

  if (error) {
    console.error('[tickets] Complete error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({
    data: toTicket(data),
    timestamp: new Date().toISOString(),
  });
}

async function handleVoid(supabase: SupabaseClient, ticketId: string): Promise<Response> {
  const { data: existing, error: fetchError } = await supabase
    .from('tickets')
    .select('id, sync_version, status')
    .eq('id', ticketId)
    .single();

  if (fetchError || !existing) {
    return jsonResponse({ error: 'Ticket not found' }, 404);
  }

  if (existing.status === 'voided') {
    return jsonResponse({ error: 'Ticket is already voided' }, 400);
  }

  const { data, error } = await supabase
    .from('tickets')
    .update({
      status: 'voided',
      sync_version: (existing.sync_version || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ticketId)
    .select()
    .single();

  if (error) {
    console.error('[tickets] Void error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({
    data: toTicket(data),
    timestamp: new Date().toISOString(),
  });
}

// ==================== MAIN HANDLER ====================

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/tickets/, '') || '/';

  try {
    const supabase = getSupabaseClient();

    // Route: GET /tickets/open
    if (req.method === 'GET' && path.startsWith('/open')) {
      const storeId = getStoreId(req, url);
      if (!storeId) {
        return jsonResponse({ error: 'store_id is required' }, 400);
      }
      return handleGetOpen(supabase, storeId);
    }

    // Route: POST /tickets/:id/complete
    if (req.method === 'POST' && path.includes('/complete')) {
      const ticketId = extractIdFromPath(path);
      if (!ticketId) {
        return jsonResponse({ error: 'Ticket ID is required' }, 400);
      }
      return handleComplete(supabase, ticketId);
    }

    // Route: POST /tickets/:id/void
    if (req.method === 'POST' && path.includes('/void')) {
      const ticketId = extractIdFromPath(path);
      if (!ticketId) {
        return jsonResponse({ error: 'Ticket ID is required' }, 400);
      }
      return handleVoid(supabase, ticketId);
    }

    // Route: GET /tickets/:id
    if (req.method === 'GET' && path !== '/' && path !== '') {
      const ticketId = extractIdFromPath(path);
      if (!ticketId) {
        return jsonResponse({ error: 'Invalid ticket ID' }, 400);
      }
      return handleGet(supabase, ticketId);
    }

    // Route: GET /tickets (list)
    if (req.method === 'GET') {
      const storeId = getStoreId(req, url);
      if (!storeId) {
        return jsonResponse({ error: 'store_id is required' }, 400);
      }
      return handleList(supabase, storeId, url);
    }

    // Route: POST /tickets
    if (req.method === 'POST') {
      const body: CreateTicketRequest = await req.json();
      return handleCreate(supabase, body);
    }

    // Route: PUT /tickets/:id
    if (req.method === 'PUT') {
      const ticketId = extractIdFromPath(path);
      if (!ticketId) {
        return jsonResponse({ error: 'Ticket ID is required' }, 400);
      }
      const body: UpdateTicketRequest = await req.json();
      return handleUpdate(supabase, ticketId, body);
    }

    // Route: DELETE /tickets/:id
    if (req.method === 'DELETE') {
      const ticketId = extractIdFromPath(path);
      if (!ticketId) {
        return jsonResponse({ error: 'Ticket ID is required' }, 400);
      }
      return handleDelete(supabase, ticketId);
    }

    return jsonResponse({ error: 'Not found', path }, 404);
  } catch (error) {
    console.error('[tickets] Error:', error);
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      500
    );
  }
});
