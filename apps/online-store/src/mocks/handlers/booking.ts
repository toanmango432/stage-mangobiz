import { http, HttpResponse } from 'msw';
import { AvailabilityResponseSchema, BookingDraftSchema, BookingConfirmationSchema } from '@/types/api/schemas';

// In-memory state for booking
const bookingState = {
  drafts: new Map<string, any>(),
  confirmations: new Map<string, any>(),
  heldSlots: new Set<string>(),
  nextBookingId: 1,
  nextDraftId: 1,
};

// Helper function to add latency and simulate errors
async function simulateLatency() {
  const latency = 100 + Math.random() * 200; // 100-300ms
  await new Promise(resolve => setTimeout(resolve, latency));
  
  // Simulate random 500 errors if MOCK_TURBULENCE is enabled
  if (__MOCK_TURBULENCE__ && Math.random() < 0.01) {
    throw new Error('Simulated server error');
  }
}

// Generate availability slots for a given date
function generateAvailabilitySlots(date: string, serviceId?: string, staffId?: string) {
  const slots = [];
  const startHour = 10; // 10 AM
  const endHour = 18; // 6 PM
  const slotDuration = 30; // 30 minutes
  
  // Get service duration if serviceId is provided
  let serviceDuration = 60; // default 60 minutes
  if (serviceId) {
    // In a real implementation, you'd fetch this from the service data
    serviceDuration = 60; // For demo purposes
  }

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += slotDuration) {
      const startTime = new Date(date);
      startTime.setHours(hour, minute, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + serviceDuration);
      
      // Skip past times
      if (startTime < new Date()) {
        continue;
      }
      
      // Skip if slot is held
      const slotId = `${date}-${hour}-${minute}`;
      if (bookingState.heldSlots.has(slotId)) {
        continue;
      }

      slots.push({
        id: slotId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        staffId: staffId || null,
        serviceId: serviceId || null,
        isAvailable: true,
        capacity: 1,
        bookedCount: 0,
      });
    }
  }

  return slots;
}

// Check if a slot is available
function isSlotAvailable(slotId: string): boolean {
  return !bookingState.heldSlots.has(slotId);
}

// Hold a slot
function holdSlot(slotId: string): boolean {
  if (bookingState.heldSlots.has(slotId)) {
    return false;
  }
  bookingState.heldSlots.add(slotId);
  return true;
}

// Release a slot
function releaseSlot(slotId: string): void {
  bookingState.heldSlots.delete(slotId);
}

export const bookingHandlers = [
  // GET /api/v1/booking/availability
  http.get('/api/v1/booking/availability', async ({ request }) => {
    await simulateLatency();
    
    const url = new URL(request.url);
    const date = url.searchParams.get('date');
    const serviceId = url.searchParams.get('serviceId') || undefined;
    const staffId = url.searchParams.get('staffId') || undefined;
    const locationId = url.searchParams.get('locationId') || '550e8400-e29b-41d4-a716-446655440000';

    if (!date) {
      return HttpResponse.json(
        { error: { code: 'MISSING_PARAMETER', message: 'Date parameter is required' } },
        { status: 400 }
      );
    }

    // Validate date format
    const requestedDate = new Date(date);
    if (isNaN(requestedDate.getTime())) {
      return HttpResponse.json(
        { error: { code: 'INVALID_DATE', message: 'Invalid date format' } },
        { status: 400 }
      );
    }

    const slots = generateAvailabilitySlots(date, serviceId, staffId);
    
    const result = {
      data: slots,
      date,
      locationId,
    };

    const validatedResult = AvailabilityResponseSchema.parse(result);
    
    return HttpResponse.json(validatedResult);
  }),

  // POST /api/v1/booking/draft
  http.post('/api/v1/booking/draft', async ({ request }) => {
    await simulateLatency();
    
    const body = await request.json() as any;
    
    // Validate required fields
    if (!body.serviceId || !body.slotId || !body.clientInfo) {
      return HttpResponse.json(
        { error: { code: 'MISSING_FIELDS', message: 'serviceId, slotId, and clientInfo are required' } },
        { status: 400 }
      );
    }

    // Check if slot is available
    if (!isSlotAvailable(body.slotId)) {
      return HttpResponse.json(
        { error: { code: 'SLOT_UNAVAILABLE', message: 'Selected time slot is no longer available' } },
        { status: 409 }
      );
    }

    // Hold the slot
    if (!holdSlot(body.slotId)) {
      return HttpResponse.json(
        { error: { code: 'SLOT_UNAVAILABLE', message: 'Failed to hold the selected time slot' } },
        { status: 409 }
      );
    }

    // Create booking draft
    const draftId = `draft-${bookingState.nextDraftId++}`;
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes to complete booking

    const draft = {
      id: draftId,
      serviceId: body.serviceId,
      staffId: body.staffId || null,
      slotId: body.slotId,
      clientInfo: body.clientInfo,
      notes: body.notes || '',
      totalPrice: body.totalPrice || 75.00, // Default price for demo
      expiresAt: expiresAt.toISOString(),
    };

    bookingState.drafts.set(draftId, draft);

    // Set timeout to release slot if not confirmed
    setTimeout(() => {
      if (bookingState.drafts.has(draftId)) {
        releaseSlot(body.slotId);
        bookingState.drafts.delete(draftId);
      }
    }, 15 * 60 * 1000); // 15 minutes

    const validatedResult = BookingDraftSchema.parse(draft);
    
    return HttpResponse.json(validatedResult);
  }),

  // GET /api/v1/booking/draft/:id
  http.get('/api/v1/booking/draft/:id', async ({ params }) => {
    await simulateLatency();
    
    const draft = bookingState.drafts.get(params.id as string);
    
    if (!draft) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Booking draft not found' } },
        { status: 404 }
      );
    }

    // Check if draft has expired
    if (new Date(draft.expiresAt) < new Date()) {
      releaseSlot(draft.slotId);
      bookingState.drafts.delete(params.id as string);
      return HttpResponse.json(
        { error: { code: 'EXPIRED', message: 'Booking draft has expired' } },
        { status: 410 }
      );
    }

    const validatedResult = BookingDraftSchema.parse(draft);
    
    return HttpResponse.json(validatedResult);
  }),

  // POST /api/v1/booking/confirm
  http.post('/api/v1/booking/confirm', async ({ request }) => {
    await simulateLatency();
    
    const body = await request.json() as any;
    
    if (!body.draftId) {
      return HttpResponse.json(
        { error: { code: 'MISSING_FIELDS', message: 'draftId is required' } },
        { status: 400 }
      );
    }

    const draft = bookingState.drafts.get(body.draftId);
    
    if (!draft) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Booking draft not found' } },
        { status: 404 }
      );
    }

    // Check if draft has expired
    if (new Date(draft.expiresAt) < new Date()) {
      releaseSlot(draft.slotId);
      bookingState.drafts.delete(body.draftId);
      return HttpResponse.json(
        { error: { code: 'EXPIRED', message: 'Booking draft has expired' } },
        { status: 410 }
      );
    }

    // Create confirmation
    const bookingId = `booking-${bookingState.nextBookingId++}`;
    const confirmationNumber = `APT-${String(bookingState.nextBookingId).padStart(6, '0')}`;

    const confirmation = {
      id: bookingId,
      confirmationNumber,
      status: 'confirmed' as const,
      booking: draft,
      createdAt: new Date().toISOString(),
    };

    bookingState.confirmations.set(bookingId, confirmation);
    bookingState.drafts.delete(body.draftId);
    // Keep the slot held for confirmed bookings

    const validatedResult = BookingConfirmationSchema.parse(confirmation);
    
    return HttpResponse.json(validatedResult);
  }),

  // GET /api/v1/booking/:id
  http.get('/api/v1/booking/:id', async ({ params }) => {
    await simulateLatency();
    
    const confirmation = bookingState.confirmations.get(params.id as string);
    
    if (!confirmation) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Booking not found' } },
        { status: 404 }
      );
    }

    const validatedResult = BookingConfirmationSchema.parse(confirmation);
    
    return HttpResponse.json(validatedResult);
  }),
];
