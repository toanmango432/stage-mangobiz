/**
 * Get Availability Edge Function
 *
 * Real-time availability API for booking calendar.
 * Returns available time slots for a service within a date range.
 *
 * Endpoint:
 * - GET /get-availability?storeId=xxx&serviceId=xxx&startDate=yyyy-mm-dd&endDate=yyyy-mm-dd&staffId=xxx
 *
 * Query Parameters:
 * - storeId: string (required) - Store UUID
 * - serviceId: string (required) - Service UUID
 * - staffId: string (optional) - Filter by specific staff member
 * - startDate: string (required) - Start date in YYYY-MM-DD format
 * - endDate: string (required) - End date in YYYY-MM-DD format
 *
 * Response:
 * {
 *   availability: [{
 *     date: "2024-01-15",
 *     dayOfWeek: 1,
 *     slots: [{
 *       startTime: "09:00",
 *       endTime: "10:00",
 *       staffId: "uuid",
 *       staffName: "John Doe",
 *       available: true
 *     }]
 *   }],
 *   service: { id, name, duration, price },
 *   dateRange: { start, end },
 *   generatedAt: "2024-01-15T10:00:00Z"
 * }
 *
 * Considerations:
 * - Store business hours (via staff schedules)
 * - Staff working hours and availability
 * - Staff breaks (from timesheets)
 * - Existing bookings (appointments + online_bookings)
 * - Service duration
 * - Buffer time between appointments (from staff settings)
 * - Multiple staff capability for same service
 *
 * Deploy: supabase functions deploy get-availability
 *
 * ClickUp Task: https://app.clickup.com/t/86dzgw4y7
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ==================== TYPES ====================

interface StaffScheduleEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface StaffServiceAssignment {
  serviceId: string;
  canPerform: boolean;
  customDuration?: number;
}

interface OnlineBookingSettings {
  isBookableOnline: boolean;
  showOnWebsite: boolean;
  acceptNewClients: boolean;
  autoAcceptBookings: boolean;
  maxAdvanceBookingDays: number;
  bufferBetweenAppointments: number;
}

interface StaffMember {
  id: string;
  name: string;
  schedule: StaffScheduleEntry[];
  serviceAssignments: StaffServiceAssignment[];
  onlineBookingSettings: OnlineBookingSettings;
  isActive: boolean;
}

interface ServiceInfo {
  id: string;
  name: string;
  duration: number;
  price: number;
  category?: string;
}

interface BookingConflict {
  staffId: string;
  startTime: Date;
  endTime: Date;
}

interface BreakEntry {
  startTime: string;
  endTime: string;
}

interface StaffBreak {
  staffId: string;
  breaks: BreakEntry[];
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  staffId: string;
  staffName: string;
  available: boolean;
}

interface DayAvailability {
  date: string;
  dayOfWeek: number;
  slots: TimeSlot[];
}

interface AvailabilityResponse {
  availability: DayAvailability[];
  service: ServiceInfo;
  dateRange: {
    start: string;
    end: string;
  };
  generatedAt: string;
}

// ==================== CORS HEADERS ====================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

/**
 * Parse time string (HH:MM) to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string (HH:MM)
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Parse ISO datetime to minutes since midnight (for a specific date)
 */
function datetimeToMinutes(datetime: string, targetDate: string): number | null {
  const date = new Date(datetime);
  const dateStr = date.toISOString().split('T')[0];

  // Only return minutes if the datetime is on the target date
  if (dateStr !== targetDate) {
    return null;
  }

  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

/**
 * Check if two time ranges overlap
 */
function rangesOverlap(
  start1: number,
  end1: number,
  start2: number,
  end2: number
): boolean {
  return start1 < end2 && end1 > start2;
}

/**
 * Generate date range between start and end (inclusive)
 */
function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Parse staff schedule from JSON
 */
function parseStaffSchedule(scheduleJson: unknown): StaffScheduleEntry[] {
  if (!scheduleJson || !Array.isArray(scheduleJson)) {
    return [];
  }

  return scheduleJson.map((item) => {
    const entry = item as Record<string, unknown>;
    return {
      dayOfWeek: Number(entry.dayOfWeek ?? entry.day_of_week ?? 0),
      startTime: String(entry.startTime ?? entry.start_time ?? '09:00'),
      endTime: String(entry.endTime ?? entry.end_time ?? '17:00'),
      isAvailable: Boolean(entry.isAvailable ?? entry.is_available ?? true),
    };
  });
}

/**
 * Parse service assignments from JSON
 */
function parseServiceAssignments(assignmentsJson: unknown): StaffServiceAssignment[] {
  if (!assignmentsJson || !Array.isArray(assignmentsJson)) {
    return [];
  }

  return assignmentsJson.map((item) => {
    const assignment = item as Record<string, unknown>;
    return {
      serviceId: String(assignment.serviceId ?? assignment.service_id ?? ''),
      canPerform: Boolean(assignment.canPerform ?? assignment.can_perform ?? true),
      customDuration: assignment.customDuration
        ? Number(assignment.customDuration)
        : undefined,
    };
  });
}

/**
 * Parse online booking settings from JSON
 */
function parseOnlineBookingSettings(settingsJson: unknown): OnlineBookingSettings {
  const defaults: OnlineBookingSettings = {
    isBookableOnline: true,
    showOnWebsite: true,
    acceptNewClients: true,
    autoAcceptBookings: true,
    maxAdvanceBookingDays: 60,
    bufferBetweenAppointments: 0,
  };

  if (!settingsJson || typeof settingsJson !== 'object') {
    return defaults;
  }

  const settings = settingsJson as Record<string, unknown>;
  return {
    isBookableOnline: Boolean(
      settings.isBookableOnline ?? settings.is_bookable_online ?? defaults.isBookableOnline
    ),
    showOnWebsite: Boolean(
      settings.showOnWebsite ?? settings.show_on_website ?? defaults.showOnWebsite
    ),
    acceptNewClients: Boolean(
      settings.acceptNewClients ?? settings.accept_new_clients ?? defaults.acceptNewClients
    ),
    autoAcceptBookings: Boolean(
      settings.autoAcceptBookings ?? settings.auto_accept_bookings ?? defaults.autoAcceptBookings
    ),
    maxAdvanceBookingDays: Number(
      settings.maxAdvanceBookingDays ?? settings.max_advance_booking_days ?? defaults.maxAdvanceBookingDays
    ),
    bufferBetweenAppointments: Number(
      settings.bufferBetweenAppointments ?? settings.buffer_between_appointments ?? defaults.bufferBetweenAppointments
    ),
  };
}

/**
 * Parse breaks from timesheet JSON
 */
function parseBreaks(breaksJson: unknown): BreakEntry[] {
  if (!breaksJson || !Array.isArray(breaksJson)) {
    return [];
  }

  return breaksJson.map((item) => {
    const brk = item as Record<string, unknown>;
    return {
      startTime: String(brk.startTime ?? brk.start_time ?? ''),
      endTime: String(brk.endTime ?? brk.end_time ?? ''),
    };
  });
}

// ==================== DATA FETCHING ====================

/**
 * Fetch service details
 */
async function fetchService(
  supabase: SupabaseClient,
  serviceId: string
): Promise<ServiceInfo | null> {
  const { data, error } = await supabase
    .from('services')
    .select('id, name, duration, price, category')
    .eq('id', serviceId)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    console.error('[get-availability] Service fetch error:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    duration: data.duration,
    price: data.price,
    category: data.category || undefined,
  };
}

/**
 * Fetch staff members who can perform the service
 */
async function fetchEligibleStaff(
  supabase: SupabaseClient,
  storeId: string,
  serviceId: string,
  staffId?: string
): Promise<StaffMember[]> {
  let query = supabase
    .from('staff')
    .select('id, name, schedule, service_assignments, online_booking_settings, is_active')
    .eq('store_id', storeId)
    .eq('is_active', true);

  // Filter by specific staff if provided
  if (staffId) {
    query = query.eq('id', staffId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[get-availability] Staff fetch error:', error);
    return [];
  }

  // Filter staff who can perform the service and are bookable online
  return (data || [])
    .map((row) => ({
      id: row.id,
      name: row.name,
      schedule: parseStaffSchedule(row.schedule),
      serviceAssignments: parseServiceAssignments(row.service_assignments),
      onlineBookingSettings: parseOnlineBookingSettings(row.online_booking_settings),
      isActive: row.is_active,
    }))
    .filter((staff) => {
      // Must be bookable online
      if (!staff.onlineBookingSettings.isBookableOnline) {
        return false;
      }

      // Check if staff can perform the service
      // If no service assignments, assume they can do all services
      if (staff.serviceAssignments.length === 0) {
        return true;
      }

      const assignment = staff.serviceAssignments.find(
        (a) => a.serviceId === serviceId
      );
      return assignment?.canPerform !== false;
    });
}

/**
 * Fetch existing bookings (appointments + online_bookings) for conflict detection
 */
async function fetchBookingConflicts(
  supabase: SupabaseClient,
  storeId: string,
  staffIds: string[],
  startDate: string,
  endDate: string
): Promise<BookingConflict[]> {
  const conflicts: BookingConflict[] = [];

  // Fetch confirmed appointments
  const { data: appointments, error: aptError } = await supabase
    .from('appointments')
    .select('staff_id, scheduled_start_time, scheduled_end_time, services')
    .eq('store_id', storeId)
    .in('staff_id', staffIds)
    .gte('scheduled_start_time', `${startDate}T00:00:00Z`)
    .lte('scheduled_start_time', `${endDate}T23:59:59Z`)
    .in('status', ['scheduled', 'confirmed', 'checked_in', 'in_progress']);

  if (aptError) {
    console.error('[get-availability] Appointments fetch error:', aptError);
  } else if (appointments) {
    for (const apt of appointments) {
      // Also check services array for staff IDs (multi-staff appointments)
      const servicesArray = apt.services as Array<{ staffId?: string }> | null;
      const staffIdsInApt = new Set<string>();

      if (apt.staff_id) {
        staffIdsInApt.add(apt.staff_id);
      }

      if (servicesArray) {
        for (const svc of servicesArray) {
          if (svc.staffId && staffIds.includes(svc.staffId)) {
            staffIdsInApt.add(svc.staffId);
          }
        }
      }

      for (const sid of staffIdsInApt) {
        conflicts.push({
          staffId: sid,
          startTime: new Date(apt.scheduled_start_time),
          endTime: new Date(apt.scheduled_end_time),
        });
      }
    }
  }

  // Fetch pending/confirmed online bookings
  const { data: onlineBookings, error: obError } = await supabase
    .from('online_bookings')
    .select('staff_id, requested_date, requested_time, duration_minutes')
    .eq('store_id', storeId)
    .in('staff_id', staffIds)
    .gte('requested_date', startDate)
    .lte('requested_date', endDate)
    .in('status', ['pending', 'confirmed']);

  if (obError) {
    console.error('[get-availability] Online bookings fetch error:', obError);
  } else if (onlineBookings) {
    for (const ob of onlineBookings) {
      if (!ob.staff_id) continue;

      const startDateTime = new Date(`${ob.requested_date}T${ob.requested_time}Z`);
      const endDateTime = new Date(
        startDateTime.getTime() + ob.duration_minutes * 60 * 1000
      );

      conflicts.push({
        staffId: ob.staff_id,
        startTime: startDateTime,
        endTime: endDateTime,
      });
    }
  }

  return conflicts;
}

/**
 * Fetch staff breaks from timesheets
 */
async function fetchStaffBreaks(
  supabase: SupabaseClient,
  storeId: string,
  staffIds: string[],
  startDate: string,
  endDate: string
): Promise<Map<string, Map<string, BreakEntry[]>>> {
  // Map: staffId -> date -> breaks[]
  const breaksMap = new Map<string, Map<string, BreakEntry[]>>();

  const { data, error } = await supabase
    .from('timesheets')
    .select('staff_id, date, breaks')
    .eq('store_id', storeId)
    .in('staff_id', staffIds)
    .gte('date', startDate)
    .lte('date', endDate);

  if (error) {
    console.error('[get-availability] Timesheets fetch error:', error);
    return breaksMap;
  }

  for (const row of data || []) {
    const staffId = row.staff_id;
    const date = row.date;
    const breaks = parseBreaks(row.breaks);

    if (!breaksMap.has(staffId)) {
      breaksMap.set(staffId, new Map());
    }
    breaksMap.get(staffId)!.set(date, breaks);
  }

  return breaksMap;
}

// ==================== AVAILABILITY CALCULATION ====================

/**
 * Generate available time slots for a staff member on a specific date
 */
function generateStaffSlots(
  staff: StaffMember,
  service: ServiceInfo,
  date: string,
  conflicts: BookingConflict[],
  breaks: BreakEntry[],
  slotIntervalMinutes: number = 15
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const dayOfWeek = new Date(date).getDay();

  // Get staff schedule for this day
  const scheduleEntry = staff.schedule.find((s) => s.dayOfWeek === dayOfWeek);
  if (!scheduleEntry || !scheduleEntry.isAvailable) {
    return slots;
  }

  const workStartMinutes = timeToMinutes(scheduleEntry.startTime);
  const workEndMinutes = timeToMinutes(scheduleEntry.endTime);

  // Get service duration (use custom duration if defined)
  let serviceDuration = service.duration;
  const serviceAssignment = staff.serviceAssignments.find(
    (a) => a.serviceId === service.id
  );
  if (serviceAssignment?.customDuration) {
    serviceDuration = serviceAssignment.customDuration;
  }

  // Get buffer time
  const bufferMinutes = staff.onlineBookingSettings.bufferBetweenAppointments || 0;

  // Get conflicts for this staff member on this date
  const staffConflicts = conflicts
    .filter((c) => c.staffId === staff.id)
    .map((c) => {
      // Convert to minutes since midnight for this date
      const startMinutes = datetimeToMinutes(c.startTime.toISOString(), date);
      const endMinutes = datetimeToMinutes(c.endTime.toISOString(), date);
      return { start: startMinutes, end: endMinutes };
    })
    .filter((c) => c.start !== null && c.end !== null) as {
    start: number;
    end: number;
  }[];

  // Convert breaks to minutes
  const breakRanges = breaks
    .filter((b) => b.startTime && b.endTime)
    .map((b) => ({
      start: timeToMinutes(b.startTime),
      end: timeToMinutes(b.endTime),
    }));

  // Generate slots at intervals
  for (
    let slotStart = workStartMinutes;
    slotStart + serviceDuration <= workEndMinutes;
    slotStart += slotIntervalMinutes
  ) {
    const slotEnd = slotStart + serviceDuration;

    // Check if slot conflicts with any booking (including buffer)
    const hasBookingConflict = staffConflicts.some((conflict) =>
      rangesOverlap(
        slotStart - bufferMinutes,
        slotEnd + bufferMinutes,
        conflict.start,
        conflict.end
      )
    );

    // Check if slot conflicts with any break
    const hasBreakConflict = breakRanges.some((brk) =>
      rangesOverlap(slotStart, slotEnd, brk.start, brk.end)
    );

    const available = !hasBookingConflict && !hasBreakConflict;

    slots.push({
      startTime: minutesToTime(slotStart),
      endTime: minutesToTime(slotEnd),
      staffId: staff.id,
      staffName: staff.name,
      available,
    });
  }

  return slots;
}

/**
 * Calculate availability for all dates in range
 */
async function calculateAvailability(
  supabase: SupabaseClient,
  storeId: string,
  serviceId: string,
  startDate: string,
  endDate: string,
  staffId?: string
): Promise<AvailabilityResponse | null> {
  // Fetch service details
  const service = await fetchService(supabase, serviceId);
  if (!service) {
    return null;
  }

  // Fetch eligible staff
  const eligibleStaff = await fetchEligibleStaff(
    supabase,
    storeId,
    serviceId,
    staffId
  );

  if (eligibleStaff.length === 0) {
    // Return empty availability if no staff can perform the service
    return {
      availability: [],
      service,
      dateRange: { start: startDate, end: endDate },
      generatedAt: new Date().toISOString(),
    };
  }

  const staffIds = eligibleStaff.map((s) => s.id);

  // Fetch booking conflicts
  const conflicts = await fetchBookingConflicts(
    supabase,
    storeId,
    staffIds,
    startDate,
    endDate
  );

  // Fetch staff breaks
  const breaksMap = await fetchStaffBreaks(
    supabase,
    storeId,
    staffIds,
    startDate,
    endDate
  );

  // Generate availability for each date
  const dates = getDateRange(startDate, endDate);
  const availability: DayAvailability[] = [];

  for (const date of dates) {
    const dayOfWeek = new Date(date).getDay();
    const allSlots: TimeSlot[] = [];

    for (const staff of eligibleStaff) {
      // Get breaks for this staff on this date
      const staffBreaks = breaksMap.get(staff.id)?.get(date) || [];

      const staffSlots = generateStaffSlots(
        staff,
        service,
        date,
        conflicts,
        staffBreaks
      );

      allSlots.push(...staffSlots);
    }

    // Sort slots by time, then by staff name
    allSlots.sort((a, b) => {
      const timeCompare = a.startTime.localeCompare(b.startTime);
      if (timeCompare !== 0) return timeCompare;
      return a.staffName.localeCompare(b.staffName);
    });

    availability.push({
      date,
      dayOfWeek,
      slots: allSlots,
    });
  }

  return {
    availability,
    service,
    dateRange: { start: startDate, end: endDate },
    generatedAt: new Date().toISOString(),
  };
}

// ==================== MAIN HANDLER ====================

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only accept GET requests
  if (req.method !== 'GET') {
    return errorResponse('Method not allowed. Use GET.', 405);
  }

  try {
    const url = new URL(req.url);

    // Extract query parameters
    const storeId = url.searchParams.get('storeId') || url.searchParams.get('store_id');
    const serviceId = url.searchParams.get('serviceId') || url.searchParams.get('service_id');
    const staffId = url.searchParams.get('staffId') || url.searchParams.get('staff_id');
    const startDate = url.searchParams.get('startDate') || url.searchParams.get('start_date');
    const endDate = url.searchParams.get('endDate') || url.searchParams.get('end_date');

    // Validate required parameters
    if (!storeId) {
      return errorResponse('Missing required parameter: storeId');
    }
    if (!serviceId) {
      return errorResponse('Missing required parameter: serviceId');
    }
    if (!startDate) {
      return errorResponse('Missing required parameter: startDate (YYYY-MM-DD)');
    }
    if (!endDate) {
      return errorResponse('Missing required parameter: endDate (YYYY-MM-DD)');
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return errorResponse('Invalid date format. Use YYYY-MM-DD.');
    }

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      return errorResponse('startDate must be before or equal to endDate');
    }

    // Limit date range to 31 days to prevent excessive queries
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 31) {
      return errorResponse('Date range cannot exceed 31 days');
    }

    // Don't allow queries in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) {
      return errorResponse('startDate cannot be in the past');
    }

    const supabase = getSupabaseClient();

    // Calculate availability
    const result = await calculateAvailability(
      supabase,
      storeId,
      serviceId,
      startDate,
      endDate,
      staffId || undefined
    );

    if (!result) {
      return errorResponse('Service not found or inactive', 404);
    }

    return jsonResponse(result);
  } catch (error) {
    console.error('[get-availability] Error:', error);
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      500
    );
  }
});
