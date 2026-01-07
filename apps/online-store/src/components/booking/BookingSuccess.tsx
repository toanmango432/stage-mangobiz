import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Calendar, Share2, ArrowRight } from 'lucide-react';
import { Booking } from '@/types/booking';
import { format, parseISO } from 'date-fns';
import { AddToCalendar } from '@/components/checkout/AddToCalendar';
import { CalendarEvent } from '@/lib/utils/calendar';
import { toast } from '@/hooks/use-toast';

interface BookingSuccessProps {
  onClose: () => void;
  onBookAnother: () => void;
}

export const BookingSuccess = ({ onClose, onBookAnother }: BookingSuccessProps) => {
  const latestBooking = localStorage.getItem('latest-booking');
  if (!latestBooking) return null;

  const booking: Booking = JSON.parse(latestBooking);

  const calendarEvent: CalendarEvent = {
    title: `${booking.service.name} Appointment`,
    description: `Service: ${booking.service.name}\n${
      booking.staff ? `Specialist: ${booking.staff.name}\n` : ''
    }${
      booking.addOns.length > 0
        ? `Add-ons: ${booking.addOns.map(a => a.name).join(', ')}\n`
        : ''
    }${booking.specialRequests ? `\nSpecial Requests: ${booking.specialRequests}` : ''}`,
    location: 'Mango Salon, 123 Beauty Street',
    startDate: parseISO(booking.dateTime),
    endDate: parseISO(booking.endTime),
  };

  const handleShare = async () => {
    const shareData = {
      title: 'My Mango Salon Booking',
      text: `Booking #: ${booking.bookingNumber}\nService: ${booking.service.name}\nDate: ${format(
        parseISO(booking.dateTime),
        'MMMM d, yyyy'
      )}\nTime: ${format(parseISO(booking.dateTime), 'h:mm a')}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast({ title: 'Shared!', description: 'Booking details shared' });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(shareData.text);
      toast({ title: 'Copied!', description: 'Booking details copied to clipboard' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Booking Confirmed!</h2>
        <p className="text-muted-foreground">
          We've sent a confirmation email to {booking.client.email}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Booking Reference: <span className="font-semibold">{booking.bookingNumber}</span>
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">{booking.service.name}</h3>
              <p className="text-sm text-muted-foreground">
                {booking.service.duration} minutes • ${booking.service.price}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">
                {format(parseISO(booking.dateTime), 'EEEE, MMMM d, yyyy')}
              </h4>
              <p className="text-sm text-muted-foreground">
                {format(parseISO(booking.dateTime), 'h:mm a')}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between">
              <span className="font-semibold">Total:</span>
              <span className="text-2xl font-bold">${booking.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <AddToCalendar event={calendarEvent} />
        <Button variant="outline" className="w-full" onClick={handleShare}>
          <Share2 className="h-4 w-4 mr-2" />
          Share Booking
        </Button>
        <Button className="w-full" onClick={onBookAnother}>
          Book Another Service
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        <Button variant="ghost" className="w-full" onClick={onClose}>
          View My Bookings
        </Button>
      </div>
    </div>
  );
};
