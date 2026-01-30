import { Order } from '@/types/order';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Truck, MapPin, CreditCard, Eye, RotateCcw } from 'lucide-react';
import { getOrderStatusColor, getOrderStatusText } from '@/lib/utils/orderHelpers';
import { format } from 'date-fns';

interface OrderHistoryItemProps {
  order: Order;
  onViewDetails: (order: Order) => void;
  onReorder: (order: Order) => void;
  onTrackOrder?: (order: Order) => void;
}

export const OrderHistoryItem = ({ 
  order, 
  onViewDetails, 
  onReorder,
  onTrackOrder 
}: OrderHistoryItemProps) => {
  const displayItems = order.items.slice(0, 3);
  const remainingCount = order.items.length - 3;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">Order #{order.orderNumber}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {order.date && !isNaN(new Date(order.date).getTime()) 
                ? format(new Date(order.date), 'MMM d, yyyy')
                : 'Date not available'}
            </p>
          </div>
          <Badge className={getOrderStatusColor(order.status)}>
            {getOrderStatusText(order.status)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Items Preview */}
        <div className="space-y-2">
          {displayItems.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-12 h-12 bg-muted rounded overflow-hidden shrink-0">
                {item.image && (
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.name}</p>
                <p className="text-muted-foreground">Qty: {item.quantity}</p>
              </div>
              <span className="font-medium">${(item.price * (item.quantity ?? 1)).toFixed(2)}</span>
            </div>
          ))}
          {remainingCount > 0 && (
            <p className="text-sm text-muted-foreground pl-14">
              +{remainingCount} more item{remainingCount > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Order Info */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            <span>•••• {order.paymentMethod.last4}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground justify-end">
            {order.shippingAddress ? (
              <>
                <Truck className="h-4 w-4" />
                <span>Delivery</span>
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4" />
                <span>Pickup</span>
              </>
            )}
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between pt-3 border-t">
          <span className="font-semibold">Total</span>
          <span className="text-lg font-bold text-primary">${order.total.toFixed(2)}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => onViewDetails(order)}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          {order.status === 'shipped' && order.trackingNumber && onTrackOrder && (
            <Button 
              variant="outline"
              onClick={() => onTrackOrder(order)}
            >
              <Truck className="h-4 w-4 mr-2" />
              Track
            </Button>
          )}
          {(order.status === 'delivered' || order.status === 'completed') && (
            <Button 
              variant="secondary"
              onClick={() => onReorder(order)}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reorder
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
