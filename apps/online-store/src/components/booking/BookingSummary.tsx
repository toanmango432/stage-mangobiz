import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { BookingFormData, Booking } from '@/types/booking';
import { format, parse, addMinutes, subMinutes } from 'date-fns';
import { Calendar, Clock, User, Mail, Phone, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { ConflictModal } from './ConflictModal';
import { slotHolds } from '@/lib/utils/slotHolds';
import { useAvailability } from '@/hooks/useAvailability';
import { saveBooking, generateBookingNumber } from '@/lib/storage/bookingStorage';
import { checkConflict, findAlternativeTimes, calculateEndTime } from '@/lib/utils/bookingConflicts';
import { sendBookingConfirmation } from '@/lib/notifications/bookingEmails';

interface BookingSummaryProps {
  formData: Partial<BookingFormData>;
  updateFormData: (data: Partial<BookingFormData>) => void;
  onConfirm: () => void;
}

export const BookingSummary = ({ formData, updateFormData, onConfirm }: BookingSummaryProps) => {
  const { getAvailability } = useAvailability();
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [alternativeTimes, setAlternativeTimes] = useState<any[]>([]);

  const handleConfirm = () => {
    if (!formData.agreedToPolicies) {
      toast.error('Please agree to the cancellation policy');
      return;
    }

    if (!formData.date || !formData.time || !formData.service || !formData.client) {
      toast.error('Missing required information');
      return;
    }

    const addOnsDuration = formData.addOns?.reduce((sum, addon) => sum + addon.duration, 0) || 0;
    const totalDuration = formData.service.duration + addOnsDuration;

    const hasConflict = checkConflict(formData.date, formData.time, totalDuration, formData.staff?.id);

    if (hasConflict) {
      const alternatives = findAlternativeTimes(formData.date, formData.time, formData.service.duration, addOnsDuration, 6);
      setAlternativeTimes(alternatives);
      setShowConflictModal(true);
      return;
    }

    try {
      const bookingDateTime = parse(`${formData.date} ${formData.time}`, 'yyyy-MM-dd hh:mm a', new Date());
      const endTimeStr = calculateEndTime(formData.time, formData.service.duration, addOnsDuration);

      const booking: Booking = {
        id: `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        bookingNumber: generateBookingNumber(),
        client: formData.client,
        service: formData.service,
        addOns: formData.addOns || [],
        dateTime: bookingDateTime.toISOString(),
        endTime: parse(`${formData.date} ${endTimeStr}`, 'yyyy-MM-dd hh:mm a', new Date()).toISOString(),
        staff: formData.staff,
        status: 'confirmed',
        paymentStatus: 'unpaid',
        totalAmount: total,
        depositAmount: formData.service.price * 0.2,
        specialRequests: formData.specialRequests,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      saveBooking(booking);
      localStorage.setItem('latest-booking', JSON.stringify(booking));
      sendBookingConfirmation(booking);

      const holdId = localStorage.getItem('current-hold-id');
      if (holdId) {
        slotHolds.release(holdId);
        localStorage.removeItem('current-hold-id');
      }

      toast.success(`Booking ${booking.bookingNumber} confirmed!`);
      onConfirm();
    } catch (error) {
      console.error('Error saving booking:', error);
      toast.error('Failed to save booking. Please try again.');
    }
  };

  const handleSelectAlternative = (time: string) => {
    updateFormData({ time });
    setShowConflictModal(false);
    toast.success('Time updated successfully');
  };

  const handleCancelConflict = () => {
    setShowConflictModal(false);
  };

  const totalDuration = 
    (formData.service?.duration || 0) + 
    (formData.addOns?.reduce((sum, addon) => sum + addon.duration, 0) || 0);
  
  const subtotal = 
    (formData.service?.price || 0) + 
    (formData.addOns?.reduce((sum, addon) => sum + addon.price, 0) || 0);
  
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Review Your Booking</h3>
        <p className="text-sm text-muted-foreground">
          Please review your appointment details before confirming
        </p>
      </div>

      <Card className="bg-gradient-card">
        <CardContent className="p-6 space-y-4">
          {/* Service */}
          <div>
            <h4 className="font-semibold text-lg mb-1">{formData.service?.name}</h4>
            <p className="text-sm text-muted-foreground">{formData.service?.description}</p>
          </div>

          <Separator />

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">
                  {formData.date && format(new Date(formData.date), 'EEEE, MMM d, yyyy')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-medium">{formData.time}</p>
              </div>
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Duration</p>
              <p className="font-medium">{totalDuration} minutes</p>
            </div>
          </div>

          {/* Staff */}
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Specialist</p>
              <p className="font-medium">
                {formData.staff?.name || 'No Preference (Best Available)'}
              </p>
            </div>
          </div>

          {/* Add-ons */}
          {formData.addOns && formData.addOns.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-2">Add-ons</p>
                <ul className="space-y-1">
                  {formData.addOns.map((addon) => (
                    <li key={addon.id} className="flex justify-between text-sm">
                      <span>{addon.name}</span>
                      <span className="font-medium">+${addon.price}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* Special Requests */}
          {formData.specialRequests && (
            <>
              <Separator />
              <div className="flex items-start gap-2">
                <MessageSquare className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Special Requests</p>
                  <p className="text-sm">{formData.specialRequests}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Client Details */}
      <Card>
        <CardContent className="p-6 space-y-3">
          <h4 className="font-semibold">Contact Information</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{formData.client?.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{formData.client?.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{formData.client?.phone}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardContent className="p-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax (10%)</span>
            <span className="font-medium">${tax.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">${total.toFixed(2)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Payment will be collected at the salon
          </p>
        </CardContent>
      </Card>

      {/* Policies */}
      <div className="space-y-3">
        <div className="flex items-start space-x-2">
          <Checkbox
            id="policy"
            checked={formData.agreedToPolicies}
            onCheckedChange={(checked) => 
              updateFormData({ agreedToPolicies: checked as boolean })
            }
          />
          <Label
            htmlFor="policy"
            className="text-sm leading-relaxed cursor-pointer"
          >
            I agree to the cancellation policy. Free cancellation up to 24 hours before the appointment.
            Cancellations within 24 hours may incur a fee.
          </Label>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button
          onClick={handleConfirm}
          size="lg"
          disabled={!formData.agreedToPolicies}
        >
          Confirm Booking
        </Button>
      </div>

      <ConflictModal
        open={showConflictModal}
        onOpenChange={setShowConflictModal}
        selectedDate={formData.date}
        selectedTime={formData.time}
        alternativeTimes={alternativeTimes}
        onSelectAlternative={handleSelectAlternative}
        onCancel={handleCancelConflict}
      />
    </div>
  );
};
