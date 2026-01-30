import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// ============================================================================
// Validation Schemas
// ============================================================================

const CreateBookingSchema = z.object({
  serviceId: z.string().uuid(),
  staffId: z.string().uuid().optional(),
  requestedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  requestedTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM format'),
  guestName: z.string().min(1).optional(),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().min(1).optional(),
  notes: z.string().max(500).optional(),
  source: z.enum(['web', 'ios', 'android', 'google', 'facebook', 'api']).default('web'),
});

const GetBookingsQuerySchema = z.object({
  storeId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no_show']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ============================================================================
// POST /api/bookings — Create a new booking
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid booking data',
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check auth — booking can be made by authenticated users or guests
    const { data: { user } } = await supabase.auth.getUser();

    const { serviceId, staffId, requestedDate, requestedTime, guestName, guestEmail, guestPhone, notes, source } = parsed.data;

    // Require either authenticated user or guest contact info
    if (!user && !guestEmail && !guestPhone) {
      return NextResponse.json(
        {
          error: {
            code: 'AUTH_REQUIRED',
            message: 'Either sign in or provide guest contact information (email or phone)',
          },
        },
        { status: 401 }
      );
    }

    // Verify service exists
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id, store_id')
      .eq('id', serviceId)
      .single();

    if (serviceError || !service) {
      return NextResponse.json(
        {
          error: {
            code: 'SERVICE_NOT_FOUND',
            message: 'The requested service does not exist',
          },
        },
        { status: 404 }
      );
    }

    // Verify staff exists and belongs to the same store (if specified)
    if (staffId) {
      const { data: staff, error: staffError } = await supabase
        .from('staff')
        .select('id, store_id')
        .eq('id', staffId)
        .eq('store_id', service.store_id)
        .single();

      if (staffError || !staff) {
        return NextResponse.json(
          {
            error: {
              code: 'STAFF_NOT_FOUND',
              message: 'The requested staff member does not exist or is not available at this location',
            },
          },
          { status: 404 }
        );
      }
    }

    // Insert booking
    const { data: booking, error: insertError } = await supabase
      .from('online_bookings')
      .insert({
        store_id: service.store_id,
        client_id: user?.id ?? null,
        service_id: serviceId,
        staff_id: staffId ?? null,
        requested_date: requestedDate,
        requested_time: requestedTime,
        status: 'pending',
        guest_name: guestName ?? null,
        guest_email: guestEmail ?? null,
        guest_phone: guestPhone ?? null,
        notes: notes ?? null,
        source,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        {
          error: {
            code: 'CREATE_FAILED',
            message: 'Failed to create booking',
            details: { supabaseError: insertError.message },
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: booking, success: true },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/bookings — List bookings (requires auth)
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Require authentication for listing bookings
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required to list bookings',
          },
        },
        { status: 401 }
      );
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = GetBookingsQuerySchema.safeParse(searchParams);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { storeId, date, status, page, limit } = parsed.data;

    // SECURITY: Verify user has access to this store (multi-tenant isolation)
    // Check if user is staff/owner of the store
    const { data: storeAccess, error: accessError } = await supabase
      .from('store_staff')
      .select('store_id, role')
      .eq('auth_user_id', user.id)
      .eq('store_id', storeId)
      .single();

    if (accessError || !storeAccess) {
      // Fallback: check if user is a client of this store
      const { data: clientAccess } = await supabase
        .from('client_auth')
        .select('store_id')
        .eq('auth_user_id', user.id)
        .eq('store_id', storeId)
        .single();

      if (!clientAccess) {
        return NextResponse.json(
          {
            error: {
              code: 'FORBIDDEN',
              message: 'You do not have access to this store',
            },
          },
          { status: 403 }
        );
      }
    }

    const offset = (page - 1) * limit;

    let query = supabase
      .from('online_bookings')
      .select('*', { count: 'exact' })
      .eq('store_id', storeId)
      .order('requested_date', { ascending: false })
      .order('requested_time', { ascending: false })
      .range(offset, offset + limit - 1);

    if (date) {
      query = query.eq('requested_date', date);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: bookings, error, count } = await query;

    if (error) {
      return NextResponse.json(
        {
          error: {
            code: 'QUERY_FAILED',
            message: 'Failed to fetch bookings',
            details: { supabaseError: error.message },
          },
        },
        { status: 500 }
      );
    }

    const total = count ?? 0;

    return NextResponse.json({
      data: bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + limit < total,
      },
      success: true,
    });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}
