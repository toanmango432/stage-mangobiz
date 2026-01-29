/**
 * Get Business Hours Edge Function
 *
 * Returns store business hours including weekly schedule, special hours, and holiday closures.
 * Designed for client-facing applications (Online Store, booking widgets).
 *
 * Endpoint:
 * - GET /get-business-hours?store_id=xxx
 * - GET /get-business-hours?store_id=xxx&date=2025-01-28  (optional: specific date check)
 *
 * Response:
 * {
 *   weeklySchedule: {
 *     monday: { isOpen: true, openTime: "09:00", closeTime: "19:00" },
 *     ...
 *   },
 *   specialHours: [
 *     { date: "2025-12-24", isOpen: true, openTime: "09:00", closeTime: "14:00", reason: "Christmas Eve" }
 *   ],
 *   closedPeriods: [
 *     { startDate: "2025-12-25", endDate: "2025-12-26", reason: "Christmas Holiday" }
 *   ],
 *   timezone: "America/Chicago",
 *   todayStatus?: { ... } // If date param provided
 * }
 *
 * Cache: 1 hour (business hours rarely change)
 *
 * Deploy: supabase functions deploy get-business-hours
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ==================== TYPES ====================

interface DayHours {
  isOpen: boolean;
  openTime?: string; // HH:mm format (24-hour)
  closeTime?: string; // HH:mm format (24-hour)
}

interface WeeklySchedule {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

interface SpecialHours {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
  reason?: string;
}

interface ClosedPeriod {
  id: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  reason: string;
}

interface TodayStatus {
  date: string;
  dayOfWeek: string;
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
  isSpecialHours: boolean;
  isHolidayClosure: boolean;
  reason?: string;
}

interface BusinessHoursResponse {
  storeId: string;
  weeklySchedule: WeeklySchedule;
  specialHours: SpecialHours[];
  closedPeriods: ClosedPeriod[];
  timezone: string;
  todayStatus?: TodayStatus;
  timestamp: string;
}

interface StoreSettings {
  operatingHours?: WeeklySchedule;
  specialHours?: SpecialHours[];
  closedPeriods?: ClosedPeriod[];
  timezone?: string;
}

// ==================== CORS HEADERS ====================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-store-id',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

// ==================== CACHE HEADERS ====================

// Cache for 1 hour - business hours rarely change
const cacheHeaders = {
  'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
};

// ==================== DEFAULT VALUES ====================

const DEFAULT_OPERATING_HOURS: WeeklySchedule = {
  monday: { isOpen: true, openTime: '09:00', closeTime: '19:00' },
  tuesday: { isOpen: true, openTime: '09:00', closeTime: '19:00' },
  wednesday: { isOpen: true, openTime: '09:00', closeTime: '19:00' },
  thursday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
  friday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
  saturday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
  sunday: { isOpen: false },
};

const DEFAULT_TIMEZONE = 'America/Chicago';

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
    headers: {
      ...corsHeaders,
      ...cacheHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function errorResponse(message: string, status = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache', // Don't cache errors
    },
  });
}

function getStoreId(req: Request, url: URL): string | null {
  const queryStoreId = url.searchParams.get('store_id');
  if (queryStoreId) return queryStoreId;

  const headerStoreId = req.headers.get('X-Store-ID');
  if (headerStoreId) return headerStoreId;

  return null;
}

function getDayOfWeek(date: Date): keyof WeeklySchedule {
  const days: (keyof WeeklySchedule)[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  return days[date.getDay()];
}

function formatDayOfWeek(day: keyof WeeklySchedule): string {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

function isDateInClosedPeriod(date: string, closedPeriods: ClosedPeriod[]): ClosedPeriod | null {
  for (const period of closedPeriods) {
    if (date >= period.startDate && date <= period.endDate) {
      return period;
    }
  }
  return null;
}

function getSpecialHoursForDate(date: string, specialHours: SpecialHours[]): SpecialHours | null {
  return specialHours.find((sh) => sh.date === date) || null;
}

function calculateTodayStatus(
  date: Date,
  weeklySchedule: WeeklySchedule,
  specialHours: SpecialHours[],
  closedPeriods: ClosedPeriod[]
): TodayStatus {
  const dateStr = date.toISOString().split('T')[0];
  const dayOfWeek = getDayOfWeek(date);
  const regularHours = weeklySchedule[dayOfWeek];

  // Check for holiday closures first
  const closedPeriod = isDateInClosedPeriod(dateStr, closedPeriods);
  if (closedPeriod) {
    return {
      date: dateStr,
      dayOfWeek: formatDayOfWeek(dayOfWeek),
      isOpen: false,
      isSpecialHours: false,
      isHolidayClosure: true,
      reason: closedPeriod.reason,
    };
  }

  // Check for special hours
  const special = getSpecialHoursForDate(dateStr, specialHours);
  if (special) {
    return {
      date: dateStr,
      dayOfWeek: formatDayOfWeek(dayOfWeek),
      isOpen: special.isOpen,
      openTime: special.openTime,
      closeTime: special.closeTime,
      isSpecialHours: true,
      isHolidayClosure: false,
      reason: special.reason,
    };
  }

  // Use regular hours
  return {
    date: dateStr,
    dayOfWeek: formatDayOfWeek(dayOfWeek),
    isOpen: regularHours.isOpen,
    openTime: regularHours.openTime,
    closeTime: regularHours.closeTime,
    isSpecialHours: false,
    isHolidayClosure: false,
  };
}

function parseSettings(settings: unknown): StoreSettings {
  if (!settings || typeof settings !== 'object') {
    return {};
  }

  const s = settings as Record<string, unknown>;

  return {
    operatingHours: s.operatingHours as WeeklySchedule | undefined,
    specialHours: s.specialHours as SpecialHours[] | undefined,
    closedPeriods: s.closedPeriods as ClosedPeriod[] | undefined,
    timezone: s.timezone as string | undefined,
  };
}

// ==================== MAIN HANDLER ====================

async function getBusinessHours(
  supabase: SupabaseClient,
  storeId: string,
  dateParam?: string
): Promise<BusinessHoursResponse> {
  // Query store settings
  const { data: store, error } = await supabase
    .from('stores')
    .select('id, settings, name')
    .eq('id', storeId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Store not found');
    }
    console.error('[get-business-hours] Query error:', error);
    throw new Error('Failed to fetch store settings');
  }

  // Parse settings
  const settings = parseSettings(store.settings);

  // Use store settings or defaults
  const weeklySchedule = settings.operatingHours || DEFAULT_OPERATING_HOURS;
  const specialHours = settings.specialHours || [];
  const closedPeriods = settings.closedPeriods || [];
  const timezone = settings.timezone || DEFAULT_TIMEZONE;

  // Filter special hours and closed periods to only show upcoming/current ones
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const ninetyDaysFromNow = new Date(now);
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
  const ninetyDaysFromNowStr = ninetyDaysFromNow.toISOString().split('T')[0];

  // Filter special hours to relevant window
  const relevantSpecialHours = specialHours.filter(
    (sh) => sh.date >= thirtyDaysAgoStr && sh.date <= ninetyDaysFromNowStr
  );

  // Filter closed periods to relevant window
  const relevantClosedPeriods = closedPeriods.filter(
    (cp) => cp.endDate >= thirtyDaysAgoStr && cp.startDate <= ninetyDaysFromNowStr
  );

  // Build response
  const response: BusinessHoursResponse = {
    storeId,
    weeklySchedule,
    specialHours: relevantSpecialHours,
    closedPeriods: relevantClosedPeriods,
    timezone,
    timestamp: new Date().toISOString(),
  };

  // Calculate today status if date provided or by default
  if (dateParam) {
    // Use provided date
    const date = new Date(dateParam);
    if (!isNaN(date.getTime())) {
      response.todayStatus = calculateTodayStatus(
        date,
        weeklySchedule,
        specialHours,
        closedPeriods
      );
    }
  } else {
    // Default to today
    response.todayStatus = calculateTodayStatus(
      now,
      weeklySchedule,
      specialHours,
      closedPeriods
    );
  }

  return response;
}

// ==================== SERVE ====================

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only accept GET
  if (req.method !== 'GET') {
    return errorResponse('Method not allowed. Use GET.', 405);
  }

  const url = new URL(req.url);

  try {
    const storeId = getStoreId(req, url);
    if (!storeId) {
      return errorResponse('store_id is required', 400);
    }

    // Validate UUID format
    const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
    if (!uuidRegex.test(storeId)) {
      return errorResponse('Invalid store_id format', 400);
    }

    const supabase = getSupabaseClient();
    const dateParam = url.searchParams.get('date') || undefined;

    const result = await getBusinessHours(supabase, storeId, dateParam);

    return jsonResponse(result);
  } catch (error) {
    console.error('[get-business-hours] Error:', error);

    if (error instanceof Error) {
      if (error.message === 'Store not found') {
        return errorResponse('Store not found', 404);
      }
      return errorResponse(error.message, 500);
    }

    return errorResponse('Internal server error', 500);
  }
});
