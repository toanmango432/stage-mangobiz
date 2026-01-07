import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { BookingFormData } from '@/types/booking';
import { Calendar, Clock, MapPin, User, Phone, Mail, DollarSign, FileText, Download, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface BookingDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingFormData;
  onAddToCalendar?: () => void;
}

export const BookingDetailsModal = ({ open, onOpenChange, booking, onAddToCalendar }: BookingDetailsModalProps) => {
  const handleShare = () => {
    const shareText = `Booking at Mango Beauty Salon\n${booking.service?.name}\n${booking.date ? format(new Date(booking.date), 'MMM d, yyyy') : ''} at ${booking.time}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Booking Confirmation',
        text: shareText,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
      toast({
        title: 'Copied to clipboard',
        description: 'Booking details copied to clipboard',
      });
    }
  };

  const handleDownloadReceipt = () => {
    toast({
      title: 'Receipt downloaded',
      description: 'Your receipt has been downloaded',
    });
  };

  const totalAmount = (booking.service?.price || 0) + 
    (booking.addOns?.reduce((sum, addon) => sum + addon.price, 0) || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle>Booking Details</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Confirmation #{booking.service?.id || 'N/A'}
              </p>
            </div>
            <Badge>Confirmed</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Service Information */}
          <div>
            <h3 className="font-semibold mb-3">Service</h3>
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium text-lg">{booking.service?.name}</p>
              {booking.service?.description && (
                <p className="text-sm text-muted-foreground mt-1">{booking.service.description}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {booking.service?.duration} min
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  ${booking.service?.price.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div>
            <h3 className="font-semibold mb-3">Appointment Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {booking.date && format(new Date(booking.date), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="font-medium">{booking.time}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Staff */}
          {booking.staff && (
            <div>
              <h3 className="font-semibold mb-3">Your Stylist</h3>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{booking.staff.name}</p>
                  <p className="text-sm text-muted-foreground">{booking.staff.title}</p>
                </div>
              </div>
            </div>
          )}

          {/* Add-ons */}
          {booking.addOns && booking.addOns.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Add-ons</h3>
              <div className="space-y-2">
                {booking.addOns.map((addon, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="font-medium">{addon.name}</span>
                    <span className="text-muted-foreground">${addon.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Client Information */}
          <div>
            <h3 className="font-semibold mb-3">Contact Information</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{booking.client.name}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{booking.client.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{booking.client.phone}</span>
              </div>
            </div>
          </div>

          {/* Special Requests */}
          {booking.specialRequests && (
            <div>
              <h3 className="font-semibold mb-3">Special Requests</h3>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">{booking.specialRequests}</p>
              </div>
            </div>
          )}

          <Separator />

          {/* Payment Summary */}
          <div>
            <h3 className="font-semibold mb-3">Payment Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Service</span>
                <span>${booking.service?.price.toFixed(2)}</span>
              </div>
              {booking.addOns && booking.addOns.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Add-ons</span>
                  <span>${booking.addOns.reduce((sum, addon) => sum + addon.price, 0).toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-primary">${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Cancellation Policy */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">Cancellation Policy</p>
                <p className="text-blue-800 dark:text-blue-200">
                  Free cancellation up to 24 hours before your appointment. 
                  Late cancellations may incur a fee.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={onAddToCalendar}>
              <Calendar className="h-4 w-4 mr-2" />
              Add to Calendar
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" onClick={handleDownloadReceipt} className="col-span-2">
              <Download className="h-4 w-4 mr-2" />
              Download Receipt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
