import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckoutFormData, PaymentMethod } from "@/types/order";
import { CreditCard, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AlternativePayments } from "./AlternativePayments";
import { toast } from "sonner";

interface PaymentFormProps {
  formData: CheckoutFormData;
  onUpdate: (data: Partial<CheckoutFormData>) => void;
}

export const PaymentForm = ({ formData, onUpdate }: PaymentFormProps) => {
  const updatePaymentMethod = (field: keyof PaymentMethod, value: string) => {
    onUpdate({
      paymentMethod: {
        ...formData.paymentMethod,
        [field]: value,
      } as PaymentMethod,
    });
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    return v;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Payment Method</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          <span>Your payment information is secure and encrypted</span>
        </div>
      </div>

      <Card className="border-2">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-primary" />
            <span className="font-semibold">Credit or Debit Card</span>
          </div>

          <div>
            <Label htmlFor="cardHolderName">Cardholder Name *</Label>
            <Input
              id="cardHolderName"
              placeholder="John Doe"
              value={formData.paymentMethod?.cardHolderName || ''}
              onChange={(e) => updatePaymentMethod('cardHolderName', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="cardNumber">Card Number *</Label>
            <Input
              id="cardNumber"
              placeholder="1234 5678 9012 3456"
              value={formData.paymentMethod?.cardNumber || ''}
              onChange={(e) => {
                const formatted = formatCardNumber(e.target.value);
                updatePaymentMethod('cardNumber', formatted);
              }}
              maxLength={19}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expiryDate">Expiry Date *</Label>
              <Input
                id="expiryDate"
                placeholder="MM/YY"
                value={formData.paymentMethod?.expiryDate || ''}
                onChange={(e) => {
                  const formatted = formatExpiry(e.target.value);
                  updatePaymentMethod('expiryDate', formatted);
                }}
                maxLength={5}
                required
              />
            </div>
            <div>
              <Label htmlFor="cvv">CVV *</Label>
              <Input
                id="cvv"
                placeholder="123"
                type="password"
                value={formData.paymentMethod?.cvv || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  updatePaymentMethod('cvv', value);
                }}
                maxLength={4}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Accepted:</span>
        <Badge variant="outline" className="gap-1">
          <CreditCard className="h-3 w-3" /> Visa
        </Badge>
        <Badge variant="outline" className="gap-1">
          <CreditCard className="h-3 w-3" /> Mastercard
        </Badge>
        <Badge variant="outline" className="gap-1">
          <CreditCard className="h-3 w-3" /> Amex
        </Badge>
      </div>

      <AlternativePayments
        onPaymentSelect={(method) => {
          toast.info(`${method} payment selected (demo only)`);
        }}
      />

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4 border-t">
        <Lock className="h-3 w-3" />
        <span>Your payment information is encrypted and secure</span>
      </div>
    </div>
  );
};
