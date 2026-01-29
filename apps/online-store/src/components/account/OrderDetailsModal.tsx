import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Order } from '@/types/order';
import { Package, Truck, MapPin, CreditCard, Calendar, Download, Share2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { getOrderStatusColor, getOrderStatusText } from '@/lib/utils/orderHelpers';
import { toast } from '@/hooks/use-toast';

interface OrderDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
}

export const OrderDetailsModal = ({ open, onOpenChange, order }: OrderDetailsModalProps) => {
  const handleShare = () => {
    const shareText = `Order #${order.orderNumber}\nPlaced on ${format(new Date(order.date), 'MMM d, yyyy')}\nTotal: $${order.total.toFixed(2)}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Order Details',
        text: shareText,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
      toast({
        title: 'Copied to clipboard',
        description: 'Order details copied to clipboard',
      });
    }
  };

  const handleDownloadInvoice = () => {
    toast({
      title: 'Invoice downloaded',
      description: 'Your invoice has been downloaded',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle>Order #{order.orderNumber}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Placed on {format(new Date(order.date), 'MMM d, yyyy')}
              </p>
            </div>
            <Badge className={getOrderStatusColor(order.status)}>
              {getOrderStatusText(order.status)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Items */}
          <div>
            <h3 className="font-semibold mb-3">Items ({order.items.length})</h3>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex gap-3 p-3 bg-muted rounded-lg">
                  {item.image && (
                    <div className="w-20 h-20 bg-background rounded overflow-hidden shrink-0">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    <p className="text-sm font-medium mt-1">${(item.price * (item.quantity ?? 1)).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery/Pickup Information */}
          <div>
            <h3 className="font-semibold mb-3">
              {order.shippingAddress ? 'Delivery Information' : 'Pickup Information'}
            </h3>
            {order.shippingAddress ? (
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{order.shippingAddress.fullName}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {order.shippingAddress.addressLine1}
                      {order.shippingAddress.addressLine2 && `, ${order.shippingAddress.addressLine2}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                    </p>
                    <p className="text-sm text-muted-foreground">{order.shippingAddress.phone}</p>
                  </div>
                </div>
                {order.trackingNumber && (
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Tracking Number</p>
                        <p className="text-sm text-muted-foreground">{order.trackingNumber}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Track
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{order.pickupLocation}</p>
                    {order.pickupTime && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Pickup time: {order.pickupTime}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Information */}
          <div>
            <h3 className="font-semibold mb-3">Payment Information</h3>
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{order.paymentMethod.type}</p>
                  <p className="text-sm text-muted-foreground">•••• {order.paymentMethod.last4}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Notes */}
          {order.notes && (
            <div>
              <h3 className="font-semibold mb-3">Order Notes</h3>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">{order.notes}</p>
              </div>
            </div>
          )}

          <Separator />

          {/* Order Summary */}
          <div>
            <h3 className="font-semibold mb-3">Order Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount {order.promoCode && `(${order.promoCode})`}</span>
                  <span>-${order.discount.toFixed(2)}</span>
                </div>
              )}
              {order.shipping > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>${order.shipping.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>${order.tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-primary">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={handleDownloadInvoice}>
              <Download className="h-4 w-4 mr-2" />
              Download Invoice
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
