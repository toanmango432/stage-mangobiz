/**
 * Staff Edge Function
 *
 * API Gateway for staff CRUD operations.
 * Provides RESTful endpoints for managing salon staff.
 *
 * Endpoints:
 * - GET    /staff?store_id=xxx              - List all staff
 * - GET    /staff/:id                       - Get single staff member
 * - POST   /staff                           - Create staff member
 * - PUT    /staff/:id                       - Update staff member
 * - DELETE /staff/:id                       - Delete staff member
 * - GET    /staff/active?store_id=xxx       - Get active (clocked-in) staff
 * - POST   /staff/:id/clock-in              - Clock in
 * - POST   /staff/:id/clock-out             - Clock out
 *
 * Deploy: supabase functions deploy staff
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ==================== TYPES ====================

interface StaffRow {
  id: string;
  store_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  is_active: boolean;
  schedule: unknown;
  role: string;
  hire_date: string | null;
  employment_type: string;
  clocked_in_at: string | null;
  current_ticket_id: string | null;
  turn_queue_position: number;
  daily_turn_count: number;
  daily_revenue: number;
  average_rating: number;
  total_reviews: number;
  service_assignments: unknown;
  sync_status: string;
  sync_version: number;
  created_at: string;
  updated_at: string;
}

interface StaffSchedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface Staff {
  id: string;
  storeId: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
  isActive: boolean;
  schedule: StaffSchedule[];
  role: string;
  hireDate?: string;
  employmentType: string;
  clockedInAt?: string;
  currentTicketId?: string;
  turnQueuePosition: number;
  dailyTurnCount: number;
  dailyRevenue: number;
  averageRating: number;
  totalReviews: number;
  serviceAssignments: unknown;
  syncVersion: number;
  createdAt: string;
  updatedAt: string;
}

interface CreateStaffRequest {
  storeId: string;
  name: string;
  email?: string;
  phone?: string;
  status?: string;
  role?: string;
  hireDate?: string;
  employmentType?: string;
  schedule?: StaffSchedule[];
}

interface UpdateStaffRequest {
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
  isActive?: boolean;
  role?: string;
  schedule?: StaffSchedule[];
  serviceAssignments?: unknown;
}

// ==================== CORS HEADERS ====================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-store-id',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// ==================== TYPE CONVERTERS ====================

function parseSchedule(json: unknown): StaffSchedule[] {
  if (!json || !Array.isArray(json)) return [];

  return json.map((item) => {
    const schedule = item as Record<string, unknown>;
    return {
      dayOfWeek: Number(schedule.dayOfWeek ?? schedule.day_of_week ?? 0),
      startTime: String(schedule.startTime ?? schedule.start_time ?? '09:00'),
      endTime: String(schedule.endTime ?? schedule.end_time ?? '17:00'),
      isAvailable: Boolean(schedule.isAvailable ?? schedule.is_available ?? true),
    };
  });
}

function serializeSchedule(schedule?: StaffSchedule[]): unknown[] | null {
  if (!schedule) return null;
  return schedule.map((s) => ({
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    endTime: s.endTime,
    isAvailable: s.isAvailable,
  }));
}

function toStaff(row: StaffRow): Staff {
  return {
    id: row.id,
    storeId: row.store_id,
    name: row.name,
    email: row.email || undefined,
    phone: row.phone || undefined,
    status: row.status,
    isActive: row.is_active,
    schedule: parseSchedule(row.schedule),
    role: row.role,
    hireDate: row.hire_date || undefined,
    employmentType: row.employment_type,
    clockedInAt: row.clocked_in_at || undefined,
    currentTicketId: row.current_ticket_id || undefined,
    turnQueuePosition: row.turn_queue_position,
    dailyTurnCount: row.daily_turn_count,
    dailyRevenue: row.daily_revenue,
    averageRating: row.average_rating,
    totalReviews: row.total_reviews,
    serviceAssignments: row.service_assignments,
    syncVersion: row.sync_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toStaffRow(
  staff: CreateStaffRequest | UpdateStaffRequest,
  isCreate = false
): Record<string, unknown> {
  const row: Record<string, unknown> = {};

  if ('storeId' in staff && staff.storeId) row.store_id = staff.storeId;
  if ('name' in staff && staff.name !== undefined) row.name = staff.name;
  if ('email' in staff) row.email = staff.email || null;
  if ('phone' in staff) row.phone = staff.phone || null;
  if ('status' in staff && staff.status) row.status = staff.status;
  if ('isActive' in staff && staff.isActive !== undefined) row.is_active = staff.isActive;
  if ('role' in staff && staff.role) row.role = staff.role;
  if ('hireDate' in staff) row.hire_date = staff.hireDate || null;
  if ('employmentType' in staff && staff.employmentType) row.employment_type = staff.employmentType;
  if ('schedule' in staff && staff.schedule) row.schedule = serializeSchedule(staff.schedule);
  if ('serviceAssignments' in staff) row.service_assignments = staff.serviceAssignments;

  row.updated_at = new Date().toISOString();

  if (isCreate) {
    row.created_at = new Date().toISOString();
    row.sync_status = 'synced';
    row.sync_version = 1;
    row.is_active = true;
    row.status = row.status || 'available';
    row.role = row.role || 'stylist';
    row.employment_type = row.employment_type || 'full-time';
    row.turn_queue_position = 0;
    row.daily_turn_count = 0;
    row.daily_revenue = 0;
    row.average_rating = 0;
    row.total_reviews = 0;
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

// ==================== HANDLERS ====================

async function handleList(
  supabase: SupabaseClient,
  storeId: string,
  url: URL
): Promise<Response> {
  const limit = parseInt(url.searchParams.get('limit') || '100');
  const offset = parseInt(url.searchParams.get('offset') || '0');
  const updatedSince = url.searchParams.get('updated_since');
  const includeInactive = url.searchParams.get('include_inactive') === 'true';

  let query = supabase
    .from('staff')
    .select('*', { count: 'exact' })
    .eq('store_id', storeId)
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
    console.error('[staff] List error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  const staffList = (data || []).map(toStaff);

  return jsonResponse({
    data: staffList,
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

async function handleGet(supabase: SupabaseClient, staffId: string): Promise<Response> {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('id', staffId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return jsonResponse({ error: 'Staff member not found' }, 404);
    }
    console.error('[staff] Get error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({
    data: toStaff(data),
    timestamp: new Date().toISOString(),
  });
}

async function handleCreate(
  supabase: SupabaseClient,
  body: CreateStaffRequest
): Promise<Response> {
  if (!body.storeId || !body.name) {
    return jsonResponse(
      {
        error: 'Missing required fields: storeId, name',
      },
      400
    );
  }

  const id = crypto.randomUUID();

  const row = {
    id,
    ...toStaffRow(body, true),
  };

  const { data, error } = await supabase.from('staff').insert(row).select().single();

  if (error) {
    console.error('[staff] Create error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse(
    {
      data: toStaff(data),
      id,
      timestamp: new Date().toISOString(),
    },
    201
  );
}

async function handleUpdate(
  supabase: SupabaseClient,
  staffId: string,
  body: UpdateStaffRequest
): Promise<Response> {
  const { data: existing, error: fetchError } = await supabase
    .from('staff')
    .select('id, sync_version')
    .eq('id', staffId)
    .single();

  if (fetchError || !existing) {
    return jsonResponse({ error: 'Staff member not found' }, 404);
  }

  const row = {
    ...toStaffRow(body),
    sync_version: (existing.sync_version || 0) + 1,
  };

  const { data, error } = await supabase
    .from('staff')
    .update(row)
    .eq('id', staffId)
    .select()
    .single();

  if (error) {
    console.error('[staff] Update error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({
    data: toStaff(data),
    timestamp: new Date().toISOString(),
  });
}

async function handleDelete(supabase: SupabaseClient, staffId: string): Promise<Response> {
  const { error } = await supabase.from('staff').delete().eq('id', staffId);

  if (error) {
    console.error('[staff] Delete error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({
    success: true,
    id: staffId,
    timestamp: new Date().toISOString(),
  });
}

async function handleGetActive(supabase: SupabaseClient, storeId: string): Promise<Response> {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('store_id', storeId)
    .eq('is_active', true)
    .not('clocked_in_at', 'is', null)
    .order('turn_queue_position', { ascending: true });

  if (error) {
    console.error('[staff] Get active error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({
    data: (data || []).map(toStaff),
    timestamp: new Date().toISOString(),
  });
}

async function handleClockIn(supabase: SupabaseClient, staffId: string): Promise<Response> {
  const { data: existing, error: fetchError } = await supabase
    .from('staff')
    .select('id, sync_version, clocked_in_at')
    .eq('id', staffId)
    .single();

  if (fetchError || !existing) {
    return jsonResponse({ error: 'Staff member not found' }, 404);
  }

  if (existing.clocked_in_at) {
    return jsonResponse({ error: 'Staff member is already clocked in' }, 400);
  }

  const { data, error } = await supabase
    .from('staff')
    .update({
      clocked_in_at: new Date().toISOString(),
      status: 'available',
      sync_version: (existing.sync_version || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', staffId)
    .select()
    .single();

  if (error) {
    console.error('[staff] Clock-in error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({
    data: toStaff(data),
    timestamp: new Date().toISOString(),
  });
}

async function handleClockOut(supabase: SupabaseClient, staffId: string): Promise<Response> {
  const { data: existing, error: fetchError } = await supabase
    .from('staff')
    .select('id, sync_version, clocked_in_at')
    .eq('id', staffId)
    .single();

  if (fetchError || !existing) {
    return jsonResponse({ error: 'Staff member not found' }, 404);
  }

  if (!existing.clocked_in_at) {
    return jsonResponse({ error: 'Staff member is not clocked in' }, 400);
  }

  const { data, error } = await supabase
    .from('staff')
    .update({
      clocked_in_at: null,
      status: 'off_duty',
      sync_version: (existing.sync_version || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', staffId)
    .select()
    .single();

  if (error) {
    console.error('[staff] Clock-out error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({
    data: toStaff(data),
    timestamp: new Date().toISOString(),
  });
}

// ==================== MAIN HANDLER ====================

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/staff/, '') || '/';

  try {
    const supabase = getSupabaseClient();

    // Route: GET /staff/active
    if (req.method === 'GET' && path.startsWith('/active')) {
      const storeId = getStoreId(req, url);
      if (!storeId) {
        return jsonResponse({ error: 'store_id is required' }, 400);
      }
      return handleGetActive(supabase, storeId);
    }

    // Route: POST /staff/:id/clock-in
    if (req.method === 'POST' && path.includes('/clock-in')) {
      const staffId = extractIdFromPath(path);
      if (!staffId) {
        return jsonResponse({ error: 'Staff ID is required' }, 400);
      }
      return handleClockIn(supabase, staffId);
    }

    // Route: POST /staff/:id/clock-out
    if (req.method === 'POST' && path.includes('/clock-out')) {
      const staffId = extractIdFromPath(path);
      if (!staffId) {
        return jsonResponse({ error: 'Staff ID is required' }, 400);
      }
      return handleClockOut(supabase, staffId);
    }

    // Route: GET /staff/:id
    if (req.method === 'GET' && path !== '/' && path !== '') {
      const staffId = extractIdFromPath(path);
      if (!staffId) {
        return jsonResponse({ error: 'Invalid staff ID' }, 400);
      }
      return handleGet(supabase, staffId);
    }

    // Route: GET /staff (list)
    if (req.method === 'GET') {
      const storeId = getStoreId(req, url);
      if (!storeId) {
        return jsonResponse({ error: 'store_id is required' }, 400);
      }
      return handleList(supabase, storeId, url);
    }

    // Route: POST /staff
    if (req.method === 'POST') {
      const body: CreateStaffRequest = await req.json();
      return handleCreate(supabase, body);
    }

    // Route: PUT /staff/:id
    if (req.method === 'PUT') {
      const staffId = extractIdFromPath(path);
      if (!staffId) {
        return jsonResponse({ error: 'Staff ID is required' }, 400);
      }
      const body: UpdateStaffRequest = await req.json();
      return handleUpdate(supabase, staffId, body);
    }

    // Route: DELETE /staff/:id
    if (req.method === 'DELETE') {
      const staffId = extractIdFromPath(path);
      if (!staffId) {
        return jsonResponse({ error: 'Staff ID is required' }, 400);
      }
      return handleDelete(supabase, staffId);
    }

    return jsonResponse({ error: 'Not found', path }, 404);
  } catch (error) {
    console.error('[staff] Error:', error);
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      500
    );
  }
});
