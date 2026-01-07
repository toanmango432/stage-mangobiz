import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BookingFormData } from '@/types/booking';
import { format } from 'date-fns';

interface BookingSummarySectionProps {
  formData: Partial<BookingFormData>;
  groupSize?: number;
  onBookNow: () => void;
}

export const BookingSummarySection = ({ 
  formData,
  groupSize = 1,
  onBookNow 
}: BookingSummarySectionProps) => {
  if (!formData.service || !formData.date || !formData.time) return null;

  const calculateTotal = () => {
    let total = formData.service?.price || 0;
    
    // Multiply by group size for group bookings
    if (groupSize > 1) {
      total *= groupSize;
    }
    
    // Add service question modifiers
    if (formData.serviceQuestions) {
      Object.values(formData.serviceQuestions).forEach((answer: any) => {
        total += (answer.priceModifier || 0) * groupSize;
      });
    }
    
    // Add add-ons
    formData.addOns?.forEach(addon => {
      total += addon.price * groupSize;
    });
    
    return total;
  };

  const total = calculateTotal();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl pb-32 lg:pb-8">
      <Card className="p-4 sm:p-6 bg-primary/5 border-primary/20">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex-1 space-y-4 w-full">
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold text-sm sm:text-base">SERVICES</span>
              <span className="font-semibold text-sm sm:text-base">AMOUNT</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="font-medium text-sm sm:text-base">{formData.service.name}</div>
                  {groupSize > 1 && (
                    <div className="text-xs sm:text-sm text-primary font-medium">
                      Group of {groupSize} people
                    </div>
                  )}
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    {formData.staff?.name || 'Any Technician'}
                  </div>
                  {formData.date && formData.time && (
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      {format(new Date(formData.date), 'EEE, MMM d yyyy')} at {formData.time}
                    </div>
                  )}
                </div>
                <div className="font-medium text-sm sm:text-base shrink-0">
                  ${typeof formData.service.price === 'number' ? (formData.service.price * groupSize).toFixed(2) : '0.00'}
                </div>
              </div>

              {formData.serviceQuestions && Object.entries(formData.serviceQuestions).map(([qId, answer]: [string, any]) => (
                answer.priceModifier > 0 && (
                  <div key={qId} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{answer.answer}</span>
                    <span>+${answer.priceModifier}</span>
                  </div>
                )
              ))}

              {formData.addOns?.map((addon) => (
                <div key={addon.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{addon.name}</span>
                  <span>+${addon.price}</span>
                </div>
              ))}

              <div className="flex justify-between font-bold pt-2 border-t">
                <span>TOTAL</span>
                <span>${typeof total === 'number' ? total.toFixed(2) : '0.00'}</span>
              </div>
            </div>
          </div>

          <Button 
            size="lg"
            onClick={onBookNow}
            className="hidden lg:flex w-full lg:w-auto lg:min-w-[200px]"
          >
            BOOK NOW
          </Button>
        </div>
      </Card>

      <div className="mt-6 space-y-4 text-sm">
        <p className="text-muted-foreground italic">
          * This service requires a credit card on file. If you cannot make your appointment, please let us know at least 4 hours in advance.
        </p>

        <Card className="p-4 bg-background">
          <h3 className="font-semibold mb-2">Cancellation Policy</h3>
          <p className="text-muted-foreground text-xs leading-relaxed">
            We understand that sometimes plans change. If you need to cancel or reschedule, please do so at least 4 hours before your appointment. 
            Cancellations made less than 4 hours before the appointment may be subject to a 50% cancellation fee. 
            No-shows will be charged the full service amount. For more details, visit our <a href="/faq" className="underline">FAQ</a>.
          </p>
        </Card>
      </div>
    </div>
  );
};
