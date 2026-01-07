import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CreditCard } from 'lucide-react';
import { mockPaymentApi } from '@/lib/api/mockPayment';
import { toast } from '@/hooks/use-toast';

interface MockPaymentFormProps {
  userId: string;
  billingAddress: {
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  onSuccess: (paymentMethodId: string) => void;
  onDiscard: () => void;
}

export const MockPaymentForm = ({ userId, billingAddress, onSuccess, onDiscard }: MockPaymentFormProps) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [loading, setLoading] = useState(false);

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19); // Max 16 digits + 3 spaces
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + ' / ' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const handleSubmit = async () => {
    const cleanMonth = expiryMonth.split('/')[0].trim();
    const cleanYear = expiryYear || expiryMonth.split('/')[1]?.trim() || '';

    setLoading(true);
    try {
      const result = await mockPaymentApi.savePaymentMethod(
        userId,
        {
          number: cardNumber.replace(/\s/g, ''),
          expiry: `${cleanMonth}/${cleanYear}`,
          cvc,
          name: cardholderName,
        },
        billingAddress
      );

      if (result.success && result.paymentMethodId) {
        toast({ title: 'Payment method saved!', description: 'Your booking is being processed...' });
        onSuccess(result.paymentMethodId);
      } else {
        toast({ title: 'Payment failed', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error processing payment', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="card" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="card">
            <CreditCard className="mr-2 h-4 w-4" />
            Card
          </TabsTrigger>
          <TabsTrigger value="googlepay" disabled>
            Google Pay
          </TabsTrigger>
        </TabsList>

        <TabsContent value="card" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card number</Label>
            <Input
              id="cardNumber"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="1234 1234 1234 1234"
              maxLength={19}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiration date</Label>
              <Input
                id="expiry"
                value={expiryMonth}
                onChange={(e) => {
                  const formatted = formatExpiry(e.target.value);
                  setExpiryMonth(formatted);
                }}
                placeholder="MM / YY"
                maxLength={7}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvc">Security code</Label>
              <Input
                id="cvc"
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').substring(0, 4))}
                placeholder="CVC"
                maxLength={4}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardholderName">Name</Label>
            <Input
              id="cardholderName"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              placeholder="Name on card"
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-3">
        <Button 
          onClick={handleSubmit} 
          disabled={loading}
          className="flex-1"
        >
          {loading ? 'Processing...' : 'Submit'}
        </Button>
        <Button 
          onClick={onDiscard} 
          variant="outline"
          className="flex-1"
        >
          Discard
        </Button>
      </div>

      <div className="flex items-center justify-center gap-2 pt-4">
        <div className="text-xs text-muted-foreground">
          🔒 Powered by Stripe | All Major Cards are Accepted
        </div>
      </div>
    </div>
  );
};
