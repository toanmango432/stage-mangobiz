import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CheckoutFormData } from "@/types/order";
import { useCart } from "@/contexts/CartContext";

interface OrderReviewProps {
  formData: CheckoutFormData;
  onUpdate: (data: Partial<CheckoutFormData>) => void;
}

export const OrderReview = ({ formData, onUpdate }: OrderReviewProps) => {
  const { items, getCartTotal } = useCart();
  const summary = getCartTotal();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Review Your Order</h2>

      {/* Order Items */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Order Items</h3>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  {item.quantity && item.quantity > 1 && (
                    <p className="text-muted-foreground">Qty: {item.quantity}</p>
                  )}
                </div>
                <span className="font-medium">
                  ${(item.price * (item.quantity || 1)).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact & Shipping */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Contact</h3>
            <p className="text-sm">{formData.email}</p>
            <p className="text-sm">{formData.phone}</p>
          </div>

          <Separator />

          {formData.shippingAddress && (
            <div>
              <h3 className="font-semibold mb-2">Shipping Address</h3>
              <p className="text-sm">
                {formData.shippingAddress.fullName}<br />
                {formData.shippingAddress.addressLine1}<br />
                {formData.shippingAddress.addressLine2 && (
                  <>{formData.shippingAddress.addressLine2}<br /></>
                )}
                {formData.shippingAddress.city}, {formData.shippingAddress.state} {formData.shippingAddress.zipCode}<br />
                {formData.shippingAddress.country}
              </p>
            </div>
          )}

          {formData.pickupLocation && (
            <div>
              <h3 className="font-semibold mb-2">Pickup</h3>
              <p className="text-sm">{formData.pickupLocation}</p>
              {formData.pickupTime && (
                <p className="text-sm">Time: {formData.pickupTime}</p>
              )}
            </div>
          )}

          <Separator />

          <div>
            <h3 className="font-semibold mb-2">Payment Method</h3>
            <p className="text-sm">
              Card ending in {formData.paymentMethod?.cardNumber?.slice(-4) || '****'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card>
        <CardContent className="p-6 space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${summary.subtotal.toFixed(2)}</span>
          </div>
          {summary.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-${summary.discount.toFixed(2)}</span>
            </div>
          )}
          {summary.shipping > 0 && (
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>${summary.shipping.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Tax</span>
            <span>${summary.tax.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">${summary.total.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Terms */}
      <div className="space-y-3">
        <div className="flex items-start space-x-2">
          <Checkbox
            id="terms"
            checked={formData.agreeToTerms}
            onCheckedChange={(checked) => onUpdate({ agreeToTerms: checked as boolean })}
            required
          />
          <Label htmlFor="terms" className="text-sm font-normal cursor-pointer leading-tight">
            I agree to the Terms and Conditions and understand the cancellation policy
          </Label>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox
            id="privacy"
            checked={formData.agreeToPrivacy}
            onCheckedChange={(checked) => onUpdate({ agreeToPrivacy: checked as boolean })}
            required
          />
          <Label htmlFor="privacy" className="text-sm font-normal cursor-pointer leading-tight">
            I agree to the Privacy Policy
          </Label>
        </div>
      </div>
    </div>
  );
};
