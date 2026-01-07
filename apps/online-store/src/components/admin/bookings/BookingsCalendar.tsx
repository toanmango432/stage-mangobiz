import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Booking } from '@/types/booking';
import { format, parseISO, isSameDay, addMonths, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const BookingsCalendar = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    // Mock bookings data
    const mockBookings: Booking[] = [];
    setBookings(mockBookings);
  }, []);

  const bookingsForSelectedDate = selectedDate
    ? bookings.filter((booking) => {
        const bookingDate = parseISO(booking.dateTime);
        return isSameDay(bookingDate, selectedDate);
      })
    : [];

  const getBookingsForDate = (date: Date) => {
    return bookings.filter((booking) => {
      const bookingDate = parseISO(booking.dateTime);
      return isSameDay(bookingDate, date);
    });
  };

  const statusColors = {
    confirmed: 'bg-primary',
    pending: 'bg-yellow-500',
    completed: 'bg-green-500',
    cancelled: 'bg-destructive',
    'no-show': 'bg-gray-500',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Appointment Calendar</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            className="rounded-lg border"
            modifiers={{
              booked: (date) => getBookingsForDate(date).length > 0,
            }}
            modifiersClassNames={{
              booked: 'bg-primary/10 font-semibold',
            }}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span>Confirmed</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <span>Cancelled</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate ? format(selectedDate, 'EEEE, MMM d') : 'Select a date'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bookingsForSelectedDate.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No bookings for this day</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookingsForSelectedDate
                .sort((a, b) => 
                  parseISO(a.dateTime).getTime() - parseISO(b.dateTime).getTime()
                )
                .map((booking) => (
                  <div
                    key={booking.id}
                    className="p-3 rounded-lg border bg-card hover:shadow-card transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold">{booking.service.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(booking.dateTime), 'h:mm a')}
                        </p>
                      </div>
                      <Badge
                        className={cn(
                          'text-xs',
                          statusColors[booking.status],
                          'text-white'
                        )}
                      >
                        {booking.status}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">
                        Client: {booking.client.name}
                      </p>
                      {booking.staff && (
                        <p className="text-muted-foreground">
                          Staff: {booking.staff.name}
                        </p>
                      )}
                      <p className="font-semibold text-primary">
                        ${booking.totalAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
