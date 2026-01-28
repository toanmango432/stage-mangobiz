import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// ============================================================================
// Validation Schemas
// ============================================================================

const BookingIdSchema = z.string().uuid();

const UpdateBookingSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no_show']).optional(),
  staffId: z.string().uuid().optional(),
  requestedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format').optional(),
  requestedTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM format').optional(),
  notes: z.string().max(500).optional(),
});

// ============================================================================
// GET /api/bookings/[id] — Get a single booking
// ============================================================================

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idParsed = BookingIdSchema.safeParse(id);

    if (!idParsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid booking ID format — must be a UUID',
          },
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Require authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    const { data: booking, error } = await supabase
      .from('online_bookings')
      .select('*')
      .eq('id', idParsed.data)
      .single();

    if (error || !booking) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Booking not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: booking, success: true });
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
// PATCH /api/bookings/[id] — Update a booking
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idParsed = BookingIdSchema.safeParse(id);

    if (!idParsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid booking ID format — must be a UUID',
          },
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = UpdateBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid update data',
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    // Require at least one field to update
    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'At least one field must be provided for update',
          },
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Require authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    // Build update object with snake_case keys for Supabase
    const { status, staffId, requestedDate, requestedTime, notes } = parsed.data;
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (status !== undefined) {
      updateData.status = status;
      // Set confirmed_at and confirmed_by when confirming
      if (status === 'confirmed') {
        updateData.confirmed_at = new Date().toISOString();
        updateData.confirmed_by = user.id;
      }
    }
    if (staffId !== undefined) updateData.staff_id = staffId;
    if (requestedDate !== undefined) updateData.requested_date = requestedDate;
    if (requestedTime !== undefined) updateData.requested_time = requestedTime;
    if (notes !== undefined) updateData.notes = notes;

    const { data: booking, error } = await supabase
      .from('online_bookings')
      .update(updateData)
      .eq('id', idParsed.data)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          error: {
            code: 'UPDATE_FAILED',
            message: 'Failed to update booking',
            details: { supabaseError: error.message },
          },
        },
        { status: 500 }
      );
    }

    if (!booking) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Booking not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: booking, success: true });
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
