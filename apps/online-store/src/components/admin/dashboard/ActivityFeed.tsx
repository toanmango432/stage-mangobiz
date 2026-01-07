import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ShoppingCart, User, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getOrders } from "@/lib/mockData";

export const ActivityFeed = () => {
  const recentOrders = getOrders()
    .filter(order => order.orderDate) // Filter out orders without dates
    .sort((a, b) => {
      const dateA = new Date(a.orderDate);
      const dateB = new Date(b.orderDate);
      // Handle invalid dates
      if (isNaN(dateA.getTime())) return 1;
      if (isNaN(dateB.getTime())) return -1;
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 10);

  const getActivityIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Calendar className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <ShoppingCart className="h-4 w-4 text-orange-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <User className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: 'default',
      pending: 'secondary',
      cancelled: 'destructive',
      processing: 'outline',
    };
    return variants[status] || 'secondary';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentOrders.map((order) => (
            <div key={order.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
              <div className="mt-1">{getActivityIcon(order.status)}</div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">
                  {order.customerName} placed order {order.id}
                </p>
                <p className="text-xs text-muted-foreground">
                  ${order.total.toFixed(2)} • {order.items.length} item(s)
                </p>
                <p className="text-xs text-muted-foreground">
                  {(() => {
                    const date = new Date(order.orderDate);
                    return isNaN(date.getTime()) 
                      ? 'Date unavailable' 
                      : formatDistanceToNow(date, { addSuffix: true });
                  })()}
                </p>
              </div>
              <Badge variant={getStatusBadge(order.status)}>
                {order.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
