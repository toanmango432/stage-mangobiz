import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  CreditCard, 
  DollarSign, 
  Shield, 
  CheckCircle, 
  Gift, 
  AlertCircle,
  Apple,
  Smartphone,
  Lock,
  Clock,
  Percent
} from 'lucide-react';

interface DepositPaymentFlowProps {
  formData: any;
  updateFormData: (data: any) => void;
  onComplete: () => void;
}

export const DepositPaymentFlow = ({
  formData,
  updateFormData,
  onComplete,
}: DepositPaymentFlowProps) => {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple' | 'google'>('card');
  const [cardInfo, setCardInfo] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: '',
    zipCode: '',
  });
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [saveCard, setSaveCard] = useState(false);

  // Calculate pricing
  const calculatePricing = () => {
    let serviceTotal = 0;
    let depositAmount = 0;
    let discountAmount = 0;
    let finalTotal = 0;

    if (formData.isGroup && formData.members) {
      serviceTotal = formData.members.reduce((total: number, member: any) => 
        total + (member.service?.price || 0), 0
      );
    } else {
      serviceTotal = formData.service?.price || 0;
    }

    // Apply promo discount
    if (appliedPromo) {
      if (appliedPromo.type === 'percentage') {
        discountAmount = serviceTotal * (appliedPromo.value / 100);
      } else {
        discountAmount = appliedPromo.value;
      }
    }

    const discountedTotal = serviceTotal - discountAmount;
    depositAmount = Math.round(discountedTotal * 0.2); // 20% deposit
    finalTotal = depositAmount;

    return {
      serviceTotal,
      discountAmount,
      discountedTotal,
      depositAmount,
      finalTotal,
      remainingBalance: discountedTotal - depositAmount,
    };
  };

  const pricing = calculatePricing();

  const handleCardChange = (field: string, value: string) => {
    setCardInfo(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePromoCode = () => {
    // Mock promo codes
    const promoCodes: Record<string, any> = {
      'WELCOME10': { type: 'percentage', value: 10, description: '10% off your first visit' },
      'SAVE20': { type: 'fixed', value: 20, description: '$20 off your service' },
      'GROUP15': { type: 'percentage', value: 15, description: '15% off group bookings' },
    };

    const promo = promoCodes[promoCode.toUpperCase()];
    if (promo) {
      setAppliedPromo(promo);
    } else {
      setAppliedPromo(null);
    }
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    updateFormData({
      payment: {
        method: paymentMethod,
        cardInfo: paymentMethod === 'card' ? cardInfo : null,
        depositAmount: pricing.depositAmount,
        totalAmount: pricing.finalTotal,
        promoCode: appliedPromo ? promoCode : null,
        discountAmount: pricing.discountAmount,
        saveCard,
        processedAt: new Date().toISOString(),
      }
    });
    
    setIsProcessing(false);
    onComplete();
  };

  const validatePayment = () => {
    if (paymentMethod === 'card') {
      return cardInfo.number.length >= 16 && 
             cardInfo.expiry.length >= 5 && 
             cardInfo.cvv.length >= 3 && 
             cardInfo.name.length > 0;
    }
    return true; // Apple Pay / Google Pay don't need validation
  };

  const canProceed = validatePayment();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Payment & Deposit</h2>
        <p className="text-muted-foreground">
          Secure your appointment with a deposit. Remaining balance due at your appointment.
        </p>
      </div>

      {/* Pricing Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Service Total</span>
            <span className="font-medium">${pricing.serviceTotal.toFixed(2)}</span>
          </div>
          
          {pricing.discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span className="flex items-center gap-1">
                <Percent className="h-4 w-4" />
                Discount ({appliedPromo?.description})
              </span>
              <span>-${pricing.discountAmount.toFixed(2)}</span>
            </div>
          )}
          
          <Separator />
          
          <div className="flex justify-between">
            <span>After Discount</span>
            <span className="font-medium">${pricing.discountedTotal.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between">
            <span>Deposit Required (20%)</span>
            <span className="font-semibold text-primary">${pricing.depositAmount.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between text-muted-foreground">
            <span>Due at Appointment</span>
            <span>${pricing.remainingBalance.toFixed(2)}</span>
          </div>
          
          <Separator />
          
          <div className="flex justify-between text-lg font-bold">
            <span>Total Today</span>
            <span className="text-primary">${pricing.finalTotal.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Promo Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Promo Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter promo code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="flex-1"
            />
            <Button 
              variant="outline" 
              onClick={handlePromoCode}
              disabled={!promoCode.trim()}
            >
              Apply
            </Button>
          </div>
          {appliedPromo && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">{appliedPromo.description}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Payment Method Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              variant={paymentMethod === 'card' ? 'default' : 'outline'}
              className="h-16 flex flex-col items-center gap-2"
              onClick={() => setPaymentMethod('card')}
            >
              <CreditCard className="h-6 w-6" />
              <span className="text-sm">Credit Card</span>
            </Button>
            
            <Button
              variant={paymentMethod === 'apple' ? 'default' : 'outline'}
              className="h-16 flex flex-col items-center gap-2"
              onClick={() => setPaymentMethod('apple')}
            >
              <Apple className="h-6 w-6" />
              <span className="text-sm">Apple Pay</span>
            </Button>
            
            <Button
              variant={paymentMethod === 'google' ? 'default' : 'outline'}
              className="h-16 flex flex-col items-center gap-2"
              onClick={() => setPaymentMethod('google')}
            >
              <Smartphone className="h-6 w-6" />
              <span className="text-sm">Google Pay</span>
            </Button>
          </div>

          {/* Card Details */}
          {paymentMethod === 'card' && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={cardInfo.number}
                  onChange={(e) => handleCardChange('number', e.target.value.replace(/\D/g, ''))}
                  maxLength={16}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    value={cardInfo.expiry}
                    onChange={(e) => handleCardChange('expiry', e.target.value)}
                    maxLength={5}
                  />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={cardInfo.cvv}
                    onChange={(e) => handleCardChange('cvv', e.target.value.replace(/\D/g, ''))}
                    maxLength={4}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="cardName">Name on Card</Label>
                <Input
                  id="cardName"
                  placeholder="John Doe"
                  value={cardInfo.name}
                  onChange={(e) => handleCardChange('name', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  placeholder="12345"
                  value={cardInfo.zipCode}
                  onChange={(e) => handleCardChange('zipCode', e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="saveCard"
                  checked={saveCard}
                  onChange={(e) => setSaveCard(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="saveCard" className="text-sm">
                  Save card for future bookings
                </Label>
              </div>
            </div>
          )}

          {/* Apple Pay / Google Pay */}
          {(paymentMethod === 'apple' || paymentMethod === 'google') && (
            <div className="pt-4 border-t text-center">
              <div className="p-6 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">
                  {paymentMethod === 'apple' ? 'Apple Pay' : 'Google Pay'} will open when you proceed
                </div>
                <div className="text-xs text-muted-foreground">
                  Your payment information is secure and encrypted
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security & Trust */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Secure Payment</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span>SSL Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>PCI Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Instant Confirmation</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handlePayment}
          disabled={!canProceed || isProcessing}
          className="px-8"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Pay ${pricing.finalTotal.toFixed(2)} Deposit
            </>
          )}
        </Button>
      </div>

      {/* Important Notice */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-orange-800 mb-1">Important:</p>
              <p className="text-orange-700">
                Your deposit secures your appointment time. The remaining balance of ${pricing.remainingBalance.toFixed(2)} 
                is due at your appointment. Cancellation policies apply to the deposit amount.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};



