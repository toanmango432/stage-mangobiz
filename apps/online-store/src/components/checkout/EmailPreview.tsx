import { Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Order } from '@/types/order';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EmailPreviewProps {
  order: Order;
}

export const EmailPreview = ({ order }: EmailPreviewProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Mail className="h-4 w-4" />
          Preview Confirmation Email
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Order Confirmation Email Preview</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh]">
          <div className="space-y-6 p-6 bg-muted rounded-lg">
            {/* Email Header */}
            <div className="text-center pb-6 border-b">
              <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2">
                Mango Salon
              </h1>
              <p className="text-sm text-muted-foreground">Thank you for your order!</p>
            </div>

            {/* Order Info */}
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">Order Confirmation</h2>
                <p className="text-sm text-muted-foreground">
                  Hi there, we've received your order and it's being processed.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-card rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Order Number</p>
                  <p className="font-semibold">{order.orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-semibold">
                    {new Date(order.date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3">
                <h3 className="font-semibold">Order Items</h3>
                {order.items.map(item => (
                  <div key={item.id} className="flex justify-between p-3 bg-card rounded-lg">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity || 1}</p>
                    </div>
                    <p className="font-semibold">
                      ${(item.price * (item.quantity || 1)).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="space-y-2 p-4 bg-card rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>${order.shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary">${order.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Shipping Address */}
              {order.shippingAddress && (
                <div className="p-4 bg-card rounded-lg">
                  <h3 className="font-semibold mb-2">Shipping Address</h3>
                  <p className="text-sm">{order.shippingAddress.fullName}</p>
                  <p className="text-sm">{order.shippingAddress.addressLine1}</p>
                  {order.shippingAddress.addressLine2 && (
                    <p className="text-sm">{order.shippingAddress.addressLine2}</p>
                  )}
                  <p className="text-sm">
                    {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                    {order.shippingAddress.zipCode}
                  </p>
                  <p className="text-sm">{order.shippingAddress.country}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-6 border-t text-center text-sm text-muted-foreground">
              <p>Questions? Contact us at support@mangosalon.com</p>
              <p className="mt-2">© 2025 Mango Salon. All rights reserved.</p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
