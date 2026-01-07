/**
 * Transactions Edge Function
 *
 * API Gateway for transaction CRUD operations.
 * Provides RESTful endpoints for managing payment transactions.
 *
 * Endpoints:
 * - GET    /transactions?store_id=xxx&date=yyyy-mm-dd  - List transactions by date
 * - GET    /transactions/:id                           - Get single transaction
 * - POST   /transactions                               - Create transaction
 * - GET    /transactions/ticket/:ticketId              - Get transactions by ticket
 * - GET    /transactions/summary?store_id=xxx&date=yyyy-mm-dd - Get daily summary
 *
 * Deploy: supabase functions deploy transactions
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ==================== TYPES ====================

interface TransactionRow {
  id: string;
  store_id: string;
  ticket_id: string | null;
  client_id: string | null;
  type: string;
  payment_method: string;
  amount: number;
  tip: number;
  total: number;
  status: string;
  sync_status: string;
  sync_version: number;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: string;
  storeId: string;
  ticketId?: string;
  clientId?: string;
  type: string;
  paymentMethod: string;
  amount: number;
  tip: number;
  total: number;
  status: string;
  syncVersion: number;
  createdAt: string;
  updatedAt: string;
}

interface CreateTransactionRequest {
  storeId: string;
  ticketId?: string;
  clientId?: string;
  type: string;
  paymentMethod: string;
  amount: number;
  tip?: number;
  total: number;
  status?: string;
}

interface DailySummary {
  date: string;
  totalTransactions: number;
  totalAmount: number;
  totalTip: number;
  totalRevenue: number;
  byPaymentMethod: Record<string, { count: number; amount: number }>;
  byType: Record<string, { count: number; amount: number }>;
}

// ==================== CORS HEADERS ====================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-store-id',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// ==================== TYPE CONVERTERS ====================

function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    storeId: row.store_id,
    ticketId: row.ticket_id || undefined,
    clientId: row.client_id || undefined,
    type: row.type,
    paymentMethod: row.payment_method,
    amount: row.amount,
    tip: row.tip,
    total: row.total,
    status: row.status,
    syncVersion: row.sync_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toTransactionRow(
  txn: CreateTransactionRequest,
  isCreate = false
): Record<string, unknown> {
  const row: Record<string, unknown> = {
    store_id: txn.storeId,
    ticket_id: txn.ticketId || null,
    client_id: txn.clientId || null,
    type: txn.type,
    payment_method: txn.paymentMethod,
    amount: txn.amount,
    tip: txn.tip ?? 0,
    total: txn.total,
    status: txn.status || 'completed',
    updated_at: new Date().toISOString(),
  };

  if (isCreate) {
    row.created_at = new Date().toISOString();
    row.sync_status = 'synced';
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
    .from('transactions')
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
    console.error('[transactions] List error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  const transactions = (data || []).map(toTransaction);

  return jsonResponse({
    data: transactions,
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

async function handleGet(supabase: SupabaseClient, transactionId: string): Promise<Response> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return jsonResponse({ error: 'Transaction not found' }, 404);
    }
    console.error('[transactions] Get error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({
    data: toTransaction(data),
    timestamp: new Date().toISOString(),
  });
}

async function handleCreate(
  supabase: SupabaseClient,
  body: CreateTransactionRequest
): Promise<Response> {
  if (!body.storeId || !body.type || !body.paymentMethod) {
    return jsonResponse(
      {
        error: 'Missing required fields: storeId, type, paymentMethod',
      },
      400
    );
  }

  const id = crypto.randomUUID();

  const row = {
    id,
    ...toTransactionRow(body, true),
  };

  const { data, error } = await supabase.from('transactions').insert(row).select().single();

  if (error) {
    console.error('[transactions] Create error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse(
    {
      data: toTransaction(data),
      id,
      timestamp: new Date().toISOString(),
    },
    201
  );
}

async function handleGetByTicket(
  supabase: SupabaseClient,
  ticketId: string
): Promise<Response> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[transactions] Get by ticket error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({
    data: (data || []).map(toTransaction),
    timestamp: new Date().toISOString(),
  });
}

async function handleSummary(
  supabase: SupabaseClient,
  storeId: string,
  date: string
): Promise<Response> {
  const { start, end } = getDateBounds(date);

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('store_id', storeId)
    .eq('status', 'completed')
    .gte('created_at', start)
    .lte('created_at', end);

  if (error) {
    console.error('[transactions] Summary error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  const transactions = data || [];

  // Calculate summary
  const byPaymentMethod: Record<string, { count: number; amount: number }> = {};
  const byType: Record<string, { count: number; amount: number }> = {};

  let totalAmount = 0;
  let totalTip = 0;
  let totalRevenue = 0;

  for (const txn of transactions) {
    totalAmount += txn.amount;
    totalTip += txn.tip;
    totalRevenue += txn.total;

    // By payment method
    if (!byPaymentMethod[txn.payment_method]) {
      byPaymentMethod[txn.payment_method] = { count: 0, amount: 0 };
    }
    byPaymentMethod[txn.payment_method].count++;
    byPaymentMethod[txn.payment_method].amount += txn.total;

    // By type
    if (!byType[txn.type]) {
      byType[txn.type] = { count: 0, amount: 0 };
    }
    byType[txn.type].count++;
    byType[txn.type].amount += txn.total;
  }

  const summary: DailySummary = {
    date,
    totalTransactions: transactions.length,
    totalAmount,
    totalTip,
    totalRevenue,
    byPaymentMethod,
    byType,
  };

  return jsonResponse({
    data: summary,
    timestamp: new Date().toISOString(),
  });
}

// ==================== MAIN HANDLER ====================

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/transactions/, '') || '/';

  try {
    const supabase = getSupabaseClient();

    // Route: GET /transactions/summary
    if (req.method === 'GET' && path.startsWith('/summary')) {
      const storeId = getStoreId(req, url);
      if (!storeId) {
        return jsonResponse({ error: 'store_id is required' }, 400);
      }
      const date = url.searchParams.get('date');
      if (!date) {
        return jsonResponse({ error: 'date is required' }, 400);
      }
      return handleSummary(supabase, storeId, date);
    }

    // Route: GET /transactions/ticket/:ticketId
    if (req.method === 'GET' && path.startsWith('/ticket/')) {
      const ticketId = path.replace('/ticket/', '').split('/')[0];
      if (!ticketId) {
        return jsonResponse({ error: 'Ticket ID is required' }, 400);
      }
      return handleGetByTicket(supabase, ticketId);
    }

    // Route: GET /transactions/:id
    if (req.method === 'GET' && path !== '/' && path !== '') {
      const transactionId = extractIdFromPath(path);
      if (!transactionId) {
        return jsonResponse({ error: 'Invalid transaction ID' }, 400);
      }
      return handleGet(supabase, transactionId);
    }

    // Route: GET /transactions (list)
    if (req.method === 'GET') {
      const storeId = getStoreId(req, url);
      if (!storeId) {
        return jsonResponse({ error: 'store_id is required' }, 400);
      }
      return handleList(supabase, storeId, url);
    }

    // Route: POST /transactions
    if (req.method === 'POST') {
      const body: CreateTransactionRequest = await req.json();
      return handleCreate(supabase, body);
    }

    return jsonResponse({ error: 'Not found', path }, 404);
  } catch (error) {
    console.error('[transactions] Error:', error);
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      500
    );
  }
});
