import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckoutFormData, ShippingAddress } from "@/types/order";
import { useCart } from "@/contexts/CartContext";
import { ShippingMethodSelector, ShippingMethod } from "./ShippingMethodSelector";

interface ShippingFormProps {
  formData: CheckoutFormData;
  onUpdate: (data: Partial<CheckoutFormData>) => void;
}

export const ShippingForm = ({ formData, onUpdate }: ShippingFormProps) => {
  const { items } = useCart();
  const hasPhysicalItems = items.some(item => item.type === 'product');
  
  const [selectedShippingMethod, setSelectedShippingMethod] = useState('standard');
  
  const shippingMethods: ShippingMethod[] = [
    {
      id: 'standard',
      name: 'Standard Shipping',
      price: 7.99,
      estimatedDays: '5-7 business days',
      description: 'Economical shipping'
    },
    {
      id: 'express',
      name: 'Express Shipping',
      price: 12.99,
      estimatedDays: '2-3 business days',
      description: 'Faster delivery'
    },
    {
      id: 'overnight',
      name: 'Overnight Delivery',
      price: 24.99,
      estimatedDays: '1 business day',
      description: 'Next-day delivery'
    }
  ];

  if (!hasPhysicalItems) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Shipping Information</h2>
        <p className="text-muted-foreground">
          No physical items in your cart. Skip to payment.
        </p>
      </div>
    );
  }

  const updateShippingAddress = (field: keyof ShippingAddress, value: string) => {
    onUpdate({
      shippingAddress: {
        ...formData.shippingAddress,
        [field]: value,
      } as ShippingAddress,
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Shipping Information</h2>

      <RadioGroup
        value={formData.shippingType}
        onValueChange={(value) => onUpdate({ shippingType: value as 'shipping' | 'pickup' })}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="shipping" id="shipping" />
          <Label htmlFor="shipping" className="cursor-pointer">Ship to address</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="pickup" id="pickup" />
          <Label htmlFor="pickup" className="cursor-pointer">Pickup in store</Label>
        </div>
      </RadioGroup>

      {formData.shippingType === 'shipping' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={formData.shippingAddress?.fullName || ''}
              onChange={(e) => updateShippingAddress('fullName', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="addressLine1">Address Line 1 *</Label>
            <Input
              id="addressLine1"
              placeholder="Street address"
              value={formData.shippingAddress?.addressLine1 || ''}
              onChange={(e) => updateShippingAddress('addressLine1', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="addressLine2">Address Line 2</Label>
            <Input
              id="addressLine2"
              placeholder="Apartment, suite, etc. (optional)"
              value={formData.shippingAddress?.addressLine2 || ''}
              onChange={(e) => updateShippingAddress('addressLine2', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.shippingAddress?.city || ''}
                onChange={(e) => updateShippingAddress('city', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={formData.shippingAddress?.state || ''}
                onChange={(e) => updateShippingAddress('state', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="zipCode">ZIP Code *</Label>
              <Input
                id="zipCode"
                value={formData.shippingAddress?.zipCode || ''}
                onChange={(e) => updateShippingAddress('zipCode', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                value={formData.shippingAddress?.country || 'USA'}
                onChange={(e) => updateShippingAddress('country', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.shippingAddress?.phone || formData.phone}
              onChange={(e) => updateShippingAddress('phone', e.target.value)}
              required
            />
          </div>

          <ShippingMethodSelector
            methods={shippingMethods}
            selectedMethod={selectedShippingMethod}
            onMethodChange={setSelectedShippingMethod}
          />

          <div className="flex items-center space-x-2 mt-4">
            <Checkbox
              id="sameAsBilling"
              checked={formData.sameAsBilling}
              onCheckedChange={(checked) => onUpdate({ sameAsBilling: checked as boolean })}
            />
            <Label htmlFor="sameAsBilling" className="text-sm font-normal cursor-pointer">
              Billing address same as shipping
            </Label>
          </div>
        </div>
      )}

      {formData.shippingType === 'pickup' && (
        <div className="space-y-4">
          <div>
            <Label>Pickup Location</Label>
            <p className="text-sm text-muted-foreground mt-1">
              123 Main Street, Suite 100<br />
              Your City, ST 12345
            </p>
          </div>
          <div>
            <Label htmlFor="pickupTime">Preferred Pickup Time</Label>
            <Input
              id="pickupTime"
              type="datetime-local"
              value={formData.pickupTime || ''}
              onChange={(e) => onUpdate({ pickupTime: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
};
