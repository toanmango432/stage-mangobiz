/**
 * Appointments Edge Function
 *
 * API Gateway for appointment CRUD operations.
 * Provides RESTful endpoints for managing salon appointments.
 *
 * Endpoints:
 * - GET    /appointments?store_id=xxx&date=yyyy-mm-dd    - List appointments by date
 * - GET    /appointments/:id                             - Get single appointment
 * - POST   /appointments                                 - Create appointment
 * - PUT    /appointments/:id                             - Update appointment
 * - DELETE /appointments/:id                             - Delete appointment
 * - GET    /appointments/staff/:staffId?store_id=xxx&date=yyyy-mm-dd - Get by staff
 * - POST   /appointments/:id/check-in                    - Check-in appointment
 * - GET    /appointments/upcoming?store_id=xxx           - Get upcoming appointments
 *
 * Deploy: supabase functions deploy appointments
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ==================== TYPES ====================

interface AppointmentRow {
  id: string;
  store_id: string;
  client_id: string | null;
  client_name: string;
  staff_id: string | null;
  services: unknown;
  status: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  notes: string | null;
  sync_status: string;
  sync_version: number;
  created_at: string;
  updated_at: string;
}

interface AppointmentService {
  serviceId: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  duration: number;
  price: number;
}

interface Appointment {
  id: string;
  storeId: string;
  clientId: string | null;
  clientName: string;
  staffId: string | null;
  services: AppointmentService[];
  status: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  notes?: string;
  syncStatus: string;
  syncVersion: number;
  createdAt: string;
  updatedAt: string;
}

interface CreateAppointmentRequest {
  storeId: string;
  clientId?: string;
  clientName: string;
  staffId?: string;
  services: AppointmentService[];
  scheduledStartTime: string;
  scheduledEndTime?: string;
  notes?: string;
}

interface UpdateAppointmentRequest {
  clientId?: string;
  clientName?: string;
  staffId?: string;
  services?: AppointmentService[];
  status?: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  notes?: string;
}

// ==================== CORS HEADERS ====================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-store-id',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// ==================== TYPE CONVERTERS ====================

function parseServices(json: unknown): AppointmentService[] {
  if (!json) return [];
  try {
    const services = Array.isArray(json) ? json : [];
    return services.map((s) => {
      const service = s as Record<string, unknown>;
      return {
        serviceId: String(service.serviceId || service.service_id || ''),
        serviceName: String(service.serviceName || service.service_name || ''),
        staffId: String(service.staffId || service.staff_id || ''),
        staffName: String(service.staffName || service.staff_name || ''),
        duration: Number(service.duration || 0),
        price: Number(service.price || 0),
      };
    });
  } catch {
    return [];
  }
}

function serializeServices(services: AppointmentService[]): unknown {
  return services.map((s) => ({
    serviceId: s.serviceId,
    serviceName: s.serviceName,
    staffId: s.staffId,
    staffName: s.staffName,
    duration: s.duration,
    price: s.price,
  }));
}

function toAppointment(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    storeId: row.store_id,
    clientId: row.client_id,
    clientName: row.client_name,
    staffId: row.staff_id,
    services: parseServices(row.services),
    status: row.status,
    scheduledStartTime: row.scheduled_start_time,
    scheduledEndTime: row.scheduled_end_time,
    notes: row.notes || undefined,
    syncStatus: row.sync_status,
    syncVersion: row.sync_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toAppointmentRow(
  appt: CreateAppointmentRequest | UpdateAppointmentRequest,
  isCreate = false
): Partial<AppointmentRow> {
  const row: Partial<AppointmentRow> = {};

  if ('storeId' in appt && appt.storeId) row.store_id = appt.storeId;
  if ('clientId' in appt) row.client_id = appt.clientId || null;
  if ('clientName' in appt && appt.clientName !== undefined) row.client_name = appt.clientName;
  if ('staffId' in appt) row.staff_id = appt.staffId || null;
  if ('services' in appt && appt.services) row.services = serializeServices(appt.services);
  if ('status' in appt && appt.status) row.status = appt.status;
  if ('scheduledStartTime' in appt && appt.scheduledStartTime) {
    row.scheduled_start_time = appt.scheduledStartTime;
  }
  if ('scheduledEndTime' in appt && appt.scheduledEndTime) {
    row.scheduled_end_time = appt.scheduledEndTime;
  }
  if ('notes' in appt) row.notes = appt.notes || null;

  row.updated_at = new Date().toISOString();

  if (isCreate) {
    row.created_at = new Date().toISOString();
    row.sync_status = 'synced';
    row.sync_version = 1;
    row.status = row.status || 'scheduled';
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
    .from('appointments')
    .select('*', { count: 'exact' })
    .eq('store_id', storeId)
    .order('scheduled_start_time', { ascending: true })
    .range(offset, offset + limit - 1);

  // Filter by date if provided
  if (date) {
    const { start, end } = getDateBounds(date);
    query = query.gte('scheduled_start_time', start).lte('scheduled_start_time', end);
  }

  // Filter by updated_since for sync/polling
  if (updatedSince) {
    query = query.gte('updated_at', updatedSince);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[appointments] List error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  const appointments = (data || []).map(toAppointment);

  return jsonResponse({
    data: appointments,
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

async function handleGet(supabase: SupabaseClient, appointmentId: string): Promise<Response> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', appointmentId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return jsonResponse({ error: 'Appointment not found' }, 404);
    }
    console.error('[appointments] Get error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({
    data: toAppointment(data),
    timestamp: new Date().toISOString(),
  });
}

async function handleCreate(
  supabase: SupabaseClient,
  body: CreateAppointmentRequest
): Promise<Response> {
  // Validate required fields
  if (!body.storeId || !body.clientName || !body.scheduledStartTime) {
    return jsonResponse(
      {
        error: 'Missing required fields: storeId, clientName, scheduledStartTime',
      },
      400
    );
  }

  // Calculate end time if not provided
  let endTime = body.scheduledEndTime;
  if (!endTime && body.services && body.services.length > 0) {
    const totalDuration = body.services.reduce((sum, s) => sum + (s.duration || 0), 0);
    const startDate = new Date(body.scheduledStartTime);
    endTime = new Date(startDate.getTime() + totalDuration * 60000).toISOString();
  } else if (!endTime) {
    // Default 30 minutes if no services
    const startDate = new Date(body.scheduledStartTime);
    endTime = new Date(startDate.getTime() + 30 * 60000).toISOString();
  }

  const id = crypto.randomUUID();

  const row = {
    id,
    ...toAppointmentRow({ ...body, scheduledEndTime: endTime }, true),
  };

  const { data, error } = await supabase.from('appointments').insert(row).select().single();

  if (error) {
    console.error('[appointments] Create error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse(
    {
      data: toAppointment(data),
      id,
      timestamp: new Date().toISOString(),
    },
    201
  );
}

async function handleUpdate(
  supabase: SupabaseClient,
  appointmentId: string,
  body: UpdateAppointmentRequest
): Promise<Response> {
  // Check if appointment exists
  const { data: existing, error: fetchError } = await supabase
    .from('appointments')
    .select('id, sync_version')
    .eq('id', appointmentId)
    .single();

  if (fetchError || !existing) {
    return jsonResponse({ error: 'Appointment not found' }, 404);
  }

  const row = {
    ...toAppointmentRow(body),
    sync_version: (existing.sync_version || 0) + 1,
  };

  const { data, error } = await supabase
    .from('appointments')
    .update(row)
    .eq('id', appointmentId)
    .select()
    .single();

  if (error) {
    console.error('[appointments] Update error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({
    data: toAppointment(data),
    timestamp: new Date().toISOString(),
  });
}

async function handleDelete(supabase: SupabaseClient, appointmentId: string): Promise<Response> {
  const { error } = await supabase.from('appointments').delete().eq('id', appointmentId);

  if (error) {
    console.error('[appointments] Delete error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({
    success: true,
    id: appointmentId,
    timestamp: new Date().toISOString(),
  });
}

async function handleGetByStaff(
  supabase: SupabaseClient,
  storeId: string,
  staffId: string,
  date: string | null
): Promise<Response> {
  let query = supabase
    .from('appointments')
    .select('*')
    .eq('store_id', storeId)
    .eq('staff_id', staffId)
    .order('scheduled_start_time', { ascending: true });

  if (date) {
    const { start, end } = getDateBounds(date);
    query = query.gte('scheduled_start_time', start).lte('scheduled_start_time', end);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[appointments] Get by staff error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({
    data: (data || []).map(toAppointment),
    timestamp: new Date().toISOString(),
  });
}

async function handleCheckIn(supabase: SupabaseClient, appointmentId: string): Promise<Response> {
  // Check if appointment exists
  const { data: existing, error: fetchError } = await supabase
    .from('appointments')
    .select('id, sync_version, status')
    .eq('id', appointmentId)
    .single();

  if (fetchError || !existing) {
    return jsonResponse({ error: 'Appointment not found' }, 404);
  }

  if (existing.status !== 'scheduled' && existing.status !== 'confirmed') {
    return jsonResponse(
      { error: `Cannot check in appointment with status: ${existing.status}` },
      400
    );
  }

  const { data, error } = await supabase
    .from('appointments')
    .update({
      status: 'checked_in',
      sync_version: (existing.sync_version || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', appointmentId)
    .select()
    .single();

  if (error) {
    console.error('[appointments] Check-in error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({
    data: toAppointment(data),
    timestamp: new Date().toISOString(),
  });
}

async function handleUpcoming(supabase: SupabaseClient, storeId: string): Promise<Response> {
  const now = new Date();

  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('store_id', storeId)
    .gte('scheduled_start_time', now.toISOString())
    .in('status', ['scheduled', 'confirmed'])
    .order('scheduled_start_time', { ascending: true })
    .limit(50);

  if (error) {
    console.error('[appointments] Upcoming error:', error);
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({
    data: (data || []).map(toAppointment),
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
  // Remove /appointments prefix to get the action path
  const path = url.pathname.replace(/^\/appointments/, '') || '/';

  try {
    const supabase = getSupabaseClient();

    // Route: GET /appointments/upcoming
    if (req.method === 'GET' && path.startsWith('/upcoming')) {
      const storeId = getStoreId(req, url);
      if (!storeId) {
        return jsonResponse({ error: 'store_id is required' }, 400);
      }
      return handleUpcoming(supabase, storeId);
    }

    // Route: GET /appointments/staff/:staffId
    if (req.method === 'GET' && path.startsWith('/staff/')) {
      const staffId = path.replace('/staff/', '').split('/')[0];
      if (!staffId) {
        return jsonResponse({ error: 'Staff ID is required' }, 400);
      }
      const storeId = getStoreId(req, url);
      if (!storeId) {
        return jsonResponse({ error: 'store_id is required' }, 400);
      }
      const date = url.searchParams.get('date');
      return handleGetByStaff(supabase, storeId, staffId, date);
    }

    // Route: POST /appointments/:id/check-in
    if (req.method === 'POST' && path.includes('/check-in')) {
      const appointmentId = extractIdFromPath(path);
      if (!appointmentId) {
        return jsonResponse({ error: 'Appointment ID is required' }, 400);
      }
      return handleCheckIn(supabase, appointmentId);
    }

    // Route: GET /appointments/:id
    if (req.method === 'GET' && path !== '/' && path !== '') {
      const appointmentId = extractIdFromPath(path);
      if (!appointmentId) {
        return jsonResponse({ error: 'Invalid appointment ID' }, 400);
      }
      return handleGet(supabase, appointmentId);
    }

    // Route: GET /appointments (list)
    if (req.method === 'GET') {
      const storeId = getStoreId(req, url);
      if (!storeId) {
        return jsonResponse({ error: 'store_id is required' }, 400);
      }
      return handleList(supabase, storeId, url);
    }

    // Route: POST /appointments
    if (req.method === 'POST') {
      const body: CreateAppointmentRequest = await req.json();
      return handleCreate(supabase, body);
    }

    // Route: PUT /appointments/:id
    if (req.method === 'PUT') {
      const appointmentId = extractIdFromPath(path);
      if (!appointmentId) {
        return jsonResponse({ error: 'Appointment ID is required' }, 400);
      }
      const body: UpdateAppointmentRequest = await req.json();
      return handleUpdate(supabase, appointmentId, body);
    }

    // Route: DELETE /appointments/:id
    if (req.method === 'DELETE') {
      const appointmentId = extractIdFromPath(path);
      if (!appointmentId) {
        return jsonResponse({ error: 'Appointment ID is required' }, 400);
      }
      return handleDelete(supabase, appointmentId);
    }

    return jsonResponse({ error: 'Not found', path }, 404);
  } catch (error) {
    console.error('[appointments] Error:', error);
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      500
    );
  }
});
