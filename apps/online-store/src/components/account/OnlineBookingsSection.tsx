/**
 * Online Bookings Section Component
 *
 * Displays user's online bookings with real-time status updates.
 * Integrates with Supabase Realtime for live booking status changes.
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, User, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { format, parseISO, isAfter, addHours } from 'date-fns';
import { BookingStatusBadge, BookingStatus } from '@/components/booking/BookingStatusBadge';
import { useClientBookings } from '@/hooks/queries';
import { useStore } from '@/hooks/useStore';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtime } from '@/providers/RealtimeProvider';
import { cn } from '@/lib/utils';

interface OnlineBooking {
  id: string;
  serviceId: string;
  staffId: string | null;
  requestedDate: string;
  requestedTime: string;
  status: string;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  notes: string | null;
  source: string;
  createdAt: string;
  confirmedAt: string | null;
}

export function OnlineBookingsSection() {
  const navigate = useNavigate();
  const { storeId } = useStore();
  const { clientAuth, isAuthenticated } = useAuth();
  const { isConnected } = useRealtime();

  // Fetch bookings for the authenticated client
  const {
    data: bookings,
    isLoading,
    isError,
    refetch,
  } = useClientBookings(storeId, clientAuth?.client_id || undefined);

  // Split into upcoming and past bookings
  const { upcomingBookings, pastBookings } = useMemo(() => {
    if (!bookings) return { upcomingBookings: [], pastBookings: [] };

    const now = new Date();
    const upcoming: OnlineBooking[] = [];
    const past: OnlineBooking[] = [];

    bookings.forEach((booking) => {
      const bookingDate = parseISO(`${booking.requestedDate}T${booking.requestedTime}`);
      // Add some buffer time for completed appointments
      const adjustedDate = addHours(bookingDate, 2);

      if (isAfter(adjustedDate, now) && booking.status !== 'cancelled' && booking.status !== 'completed') {
        upcoming.push(booking as OnlineBooking);
      } else {
        past.push(booking as OnlineBooking);
      }
    });

    // Sort upcoming by date ascending
    upcoming.sort((a, b) => {
      const dateA = parseISO(`${a.requestedDate}T${a.requestedTime}`);
      const dateB = parseISO(`${b.requestedDate}T${b.requestedTime}`);
      return dateA.getTime() - dateB.getTime();
    });

    // Sort past by date descending
    past.sort((a, b) => {
      const dateA = parseISO(`${a.requestedDate}T${a.requestedTime}`);
      const dateB = parseISO(`${b.requestedDate}T${b.requestedTime}`);
      return dateB.getTime() - dateA.getTime();
    });

    return { upcomingBookings: upcoming, pastBookings: past };
  }, [bookings]);

  // If not authenticated, prompt to sign in
  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <h3 className="text-xl font-semibold mb-4">Sign in to view your bookings</h3>
          <p className="text-muted-foreground mb-6">
            Access your appointment history and manage upcoming bookings
          </p>
          <Button onClick={() => navigate('/login')}>Sign In</Button>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your bookings...</p>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (isError) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-amber-500" />
          <p className="text-muted-foreground mb-4">Unable to load bookings</p>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Realtime Status Indicator */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Bookings</h2>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live updates
            </span>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Upcoming Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Appointments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingBookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>You don't have any upcoming appointments</p>
              <Button className="mt-4" onClick={() => navigate('/book')}>
                Book a Service
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <OnlineBookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Bookings */}
      {pastBookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-5 w-5" />
              Past Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pastBookings.slice(0, 5).map((booking) => (
                <OnlineBookingCard key={booking.id} booking={booking} compact />
              ))}
              {pastBookings.length > 5 && (
                <p className="text-center text-sm text-muted-foreground py-2">
                  Showing 5 of {pastBookings.length} past appointments
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Individual booking card with status badge
 */
function OnlineBookingCard({
  booking,
  compact = false,
}: {
  booking: OnlineBooking;
  compact?: boolean;
}) {
  const navigate = useNavigate();

  // Format date and time
  const formattedDate = format(parseISO(booking.requestedDate), 'EEE, MMM d, yyyy');
  const formattedTime = booking.requestedTime;
  const confirmationNumber = booking.id.slice(0, 8).toUpperCase();

  return (
    <div
      className={cn(
        'border rounded-lg p-4 transition-colors hover:bg-muted/50',
        compact && 'opacity-75'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Confirmation Number */}
          <p className="text-xs text-muted-foreground mb-1">
            Booking #{confirmationNumber}
          </p>

          {/* Date & Time */}
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center gap-1 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{formattedTime}</span>
            </div>
          </div>

          {/* Notes (if any) */}
          {booking.notes && !compact && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              Note: {booking.notes}
            </p>
          )}
        </div>

        {/* Status Badge */}
        <BookingStatusBadge
          status={booking.status as BookingStatus}
          size={compact ? 'sm' : 'default'}
        />
      </div>

      {/* Actions for upcoming non-compact bookings */}
      {!compact && booking.status !== 'cancelled' && booking.status !== 'completed' && (
        <div className="flex gap-2 mt-4 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/book?reschedule=${booking.id}`)}
          >
            Reschedule
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}

export default OnlineBookingsSection;
