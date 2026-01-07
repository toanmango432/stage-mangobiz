import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ReservationTimer } from '@/components/booking/ReservationTimer';
import { PolicyAgreement } from '@/components/booking/PolicyAgreement';
import { BillingAddressForm } from '@/components/booking/BillingAddressForm';
import { MockPaymentForm } from '@/components/booking/MockPaymentForm';
import { mockBookingApi } from '@/lib/api/mockBooking';
import { slotHolds } from '@/lib/utils/slotHolds';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/hooks/useStore';
import { useCreateBooking } from '@/hooks/queries';
import { Loader2 } from 'lucide-react';

type Stage = 'policy' | 'address' | 'payment';

export default function BookingConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingData = location.state?.bookingData;

  const { user, isAuthenticated, clientAuth } = useAuth();
  const { storeId } = useStore();
  const createBookingMutation = useCreateBooking(storeId);

  const [stage, setStage] = useState<Stage>('policy');
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [preferences, setPreferences] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [billingAddress, setBillingAddress] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [holdId] = useState(() => {
    if (bookingData?.date && bookingData?.time) {
      return slotHolds.create(bookingData.date, bookingData.time, bookingData.service.id).holdId;
    }
    return null;
  });

  useEffect(() => {
    if (!bookingData) {
      navigate('/book/flow');
    }
  }, [bookingData, navigate]);

  const handleExpire = () => {
    toast({ title: 'Reservation expired', description: 'Please start over', variant: 'destructive' });
    navigate('/book/flow');
  };

  const handleConfirmBooking = () => {
    if (!policyAccepted) {
      toast({ title: 'Please accept the policy', variant: 'destructive' });
      return;
    }
    setStage('address');
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
  };

  const handleAddressSubmit = (address: any) => {
    setBillingAddress(address);
    setStage('payment');
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
  };

  const handlePaymentSuccess = async (paymentMethodId: string) => {
    if (!bookingData) return;

    setIsSubmitting(true);

    try {
      // Try to create booking in Supabase first
      const bookingResult = await createBookingMutation.mutateAsync({
        serviceId: bookingData.service.id,
        staffId: bookingData.staff?.id !== 'any' ? bookingData.staff?.id : null,
        requestedDate: bookingData.date,
        requestedTime: bookingData.time,
        clientId: clientAuth?.client_id || null,
        guestName: !isAuthenticated ? billingAddress?.fullName : null,
        guestEmail: !isAuthenticated ? billingAddress?.email : null,
        guestPhone: !isAuthenticated ? billingAddress?.phone : null,
        notes: preferences || null,
      });

      // Navigate to success page with booking data
      navigate('/book/success', {
        state: {
          booking: {
            id: bookingResult.id,
            service: bookingData.service,
            staff: bookingData.staff,
            date: bookingData.date,
            time: bookingData.time,
            status: bookingResult.status,
            confirmationNumber: bookingResult.id.slice(0, 8).toUpperCase(),
          },
        },
      });
    } catch (error: any) {
      console.error('Booking creation failed:', error);

      // Fallback to mock API if Supabase fails
      try {
        const result = await mockBookingApi.createBooking({
          userId: user?.id || 'guest',
          serviceIds: [bookingData.service.id],
          staffId: bookingData.staff?.id || 'any',
          date: bookingData.date,
          time: bookingData.time,
          preferences,
          promoCode,
          paymentMethodId,
          billingAddress,
          policyAcceptedAt: new Date().toISOString(),
          holdId: holdId || undefined,
        });

        if (result.success && result.booking) {
          navigate('/book/success', { state: { booking: result.booking } });
        } else {
          toast({
            title: 'Booking failed',
            description: 'Please try again or contact support.',
            variant: 'destructive',
          });
        }
      } catch (mockError) {
        toast({
          title: 'Booking failed',
          description: error.message || 'Please try again or contact support.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!bookingData) return null;

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      {holdId && <ReservationTimer holdId={holdId} onExpire={handleExpire} />}

      <div className="mx-auto max-w-4xl space-y-6 mt-4">
        <h1 className="text-2xl font-bold">Confirm Your Booking</h1>

        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div className="font-semibold">
            Beverly Hills, Beverly Hills | {bookingData.date && format(new Date(bookingData.date), 'EEE, MMM d yyyy')} {bookingData.time}
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">SERVICES</th>
                <th className="text-left py-2">DETAILS</th>
                <th className="text-right py-2">PRICE</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-4">{bookingData.service?.name}</td>
                <td className="py-4">{bookingData.staff?.name || 'Any Technician'}</td>
                <td className="text-right py-4">${bookingData.service?.price}</td>
              </tr>
              {bookingData.addOns?.map((addon: any) => (
                <tr key={addon.id}>
                  <td className="py-2 text-muted-foreground">+ {addon.name}</td>
                  <td className="py-2"></td>
                  <td className="text-right py-2 text-muted-foreground">${addon.price}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <Textarea
            placeholder="Have any other preferences that we should know about?"
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            rows={3}
          />

          <div className="flex gap-2">
            <Input placeholder="Promo code" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
            <Button variant="outline">APPLY</Button>
          </div>

          <div className="text-right font-bold">
            Total: ${(
              (bookingData.service?.price || 0) +
              (bookingData.addOns?.reduce((sum: number, a: any) => sum + a.price, 0) || 0)
            ).toFixed(2)}
          </div>
        </div>

        <PolicyAgreement checked={policyAccepted} onCheckedChange={setPolicyAccepted} />

        <div className="flex gap-4">
          <Button variant="outline" onClick={() => navigate('/book/flow')} className="flex-1">
            Cancel Appointment
          </Button>
          <Button
            onClick={handleConfirmBooking}
            disabled={!policyAccepted || stage !== 'policy'}
            className="flex-1"
          >
            Confirm Booking
          </Button>
        </div>

        {stage !== 'policy' && (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-bold mb-4">Billing Address</h2>
            {stage === 'address' && <BillingAddressForm onSubmit={handleAddressSubmit} />}
            {stage === 'payment' && billingAddress && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {billingAddress.address1}, {billingAddress.city}, {billingAddress.state} {billingAddress.zipCode}
                </div>
                <h2 className="text-xl font-bold">Payment Information</h2>
                {isSubmitting ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-3">Creating your booking...</span>
                  </div>
                ) : (
                  <MockPaymentForm
                    userId={user?.id || 'guest'}
                    billingAddress={billingAddress}
                    onSuccess={handlePaymentSuccess}
                    onDiscard={() => navigate('/book/flow')}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
