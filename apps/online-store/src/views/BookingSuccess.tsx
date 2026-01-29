import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Calendar, Clock, User, MapPin, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { BookingStatusBadge, BookingStatus } from '@/components/booking/BookingStatusBadge';
import { useBooking } from '@/hooks/queries';
import { useStore } from '@/hooks/useStore';
import { useRealtime } from '@/providers/RealtimeProvider';
import { toast } from '@/hooks/use-toast';

export default function BookingSuccess() {
  const router = useRouter();
  const { storeId } = useStore();
  const { isConnected, status: realtimeStatus } = useRealtime();

  // Get booking from navigation state (passed after creation)
  const [initialBooking] = useState(() => {
    // TODO: getNavigationState was removed during Next.js migration - retrieve booking data via query params or context
    return null as any;
  });
  const bookingId = initialBooking?.id;

  // Fetch latest booking data from database
  const { data: liveBooking, isLoading, refetch } = useBooking(storeId, bookingId);

  // Use live data if available, fall back to initial data
  const booking = useMemo(() => {
    if (liveBooking) {
      return {
        id: liveBooking.id,
        confirmationNumber: liveBooking.id.slice(0, 8).toUpperCase(),
        service: {
          name: initialBooking?.service?.name || 'Service',
          price: initialBooking?.service?.price || 0,
        },
        staff: initialBooking?.staff,
        date: liveBooking.requestedDate,
        time: liveBooking.requestedTime,
        status: liveBooking.status as BookingStatus,
      };
    }
    return initialBooking;
  }, [liveBooking, initialBooking]);

  // Redirect if no booking data
  useEffect(() => {
    if (!initialBooking && !bookingId) {
      router.push('/');
    }
  }, [initialBooking, bookingId, router]);

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    refetch();
    toast({
      title: 'Refreshing...',
      description: 'Getting latest booking status',
    });
  }, [refetch]);

  if (!booking) return null;

  // Format date and time for display
  const formattedDate = booking.date
    ? format(parseISO(booking.date), 'EEEE, MMMM d, yyyy')
    : 'Date not available';

  const formattedTime = booking.time || 'Time not available';

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <Card className="max-w-2xl w-full p-8 space-y-6">
        {/* Success Icon */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold">Booking Submitted!</h1>
          <p className="text-muted-foreground mt-2">
            Your appointment request has been received.
          </p>
        </div>

        {/* Status Badge with Realtime Indicator */}
        <div className="flex items-center justify-center gap-3">
          <BookingStatusBadge status={booking.status || 'pending'} size="lg" />
          {isConnected && (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live
            </span>
          )}
          {!isConnected && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Refresh
            </Button>
          )}
        </div>

        {/* Booking Details */}
        <div className="bg-muted rounded-lg p-6 space-y-4">
          {/* Confirmation Number */}
          <div className="text-center pb-4 border-b border-border">
            <span className="text-sm text-muted-foreground">Confirmation Number</span>
            <p className="text-2xl font-bold font-mono tracking-wider">
              {booking.confirmationNumber || booking.id?.slice(0, 8).toUpperCase()}
            </p>
          </div>

          {/* Service */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <span className="text-sm text-muted-foreground">Service</span>
              <p className="font-semibold">{booking.service?.name}</p>
              {booking.service?.price && (
                <p className="text-sm text-muted-foreground">${booking.service.price.toFixed(2)}</p>
              )}
            </div>
          </div>

          {/* Date */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <span className="text-sm text-muted-foreground">Date</span>
              <p className="font-semibold">{formattedDate}</p>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <span className="text-sm text-muted-foreground">Time</span>
              <p className="font-semibold">{formattedTime}</p>
            </div>
          </div>

          {/* Staff (if assigned) */}
          {booking.staff && booking.staff.name !== 'Next Available' && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <span className="text-sm text-muted-foreground">Technician</span>
                <p className="font-semibold">{booking.staff.name}</p>
              </div>
            </div>
          )}

          {/* Location */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <span className="text-sm text-muted-foreground">Location</span>
              <p className="font-semibold">Beverly Hills Salon</p>
              <p className="text-sm text-muted-foreground">123 Main Street, Beverly Hills, CA 90210</p>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {booking.status === 'pending' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
            <p className="text-amber-800">
              The salon will confirm your appointment shortly. You'll receive a notification when confirmed.
            </p>
          </div>
        )}

        {booking.status === 'confirmed' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-800">
              Your appointment is confirmed! We look forward to seeing you.
            </p>
          </div>
        )}

        {/* Demo Mode Indicator */}
        {typeof __MODE__ !== 'undefined' && __MODE__ === 'standalone' && (
          <p className="text-sm text-yellow-600 text-center font-medium">
            Demo confirmation only - No actual appointment was booked
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button onClick={() => router.push('/account')} className="flex-1">
            View My Bookings
          </Button>
          <Button onClick={() => router.push('/')} variant="outline" className="flex-1">
            Back to Home
          </Button>
        </div>
      </Card>
    </div>
  );
}
