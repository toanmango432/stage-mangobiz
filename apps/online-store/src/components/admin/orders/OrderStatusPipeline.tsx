import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Order {
  id: string;
  customerName: string;
  orderDate: string;
  total: number;
  status: string;
}

interface OrderStatusPipelineProps {
  orders: Order[];
  onOrderClick: (order: Order) => void;
  onStatusChange: (orderId: string, newStatus: string) => void;
}

export function OrderStatusPipeline({ orders, onOrderClick, onStatusChange }: OrderStatusPipelineProps) {
  const columns = [
    { id: "pending", title: "Pending", variant: "secondary" as const },
    { id: "processing", title: "Processing", variant: "outline" as const },
    { id: "shipped", title: "Shipped", variant: "default" as const },
    { id: "delivered", title: "Delivered", variant: "default" as const },
  ];

  const getOrdersByStatus = (status: string) => {
    return orders.filter((order) => order.status === status);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {columns.map((column) => {
        const columnOrders = getOrdersByStatus(column.id);
        return (
          <div key={column.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{column.title}</h3>
              <Badge variant={column.variant}>{columnOrders.length}</Badge>
            </div>
            <div className="space-y-2">
              {columnOrders.map((order) => (
                <Card
                  key={order.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onOrderClick(order)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{order.id}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <p className="text-sm font-medium">{order.customerName}</p>
                    <p className="text-lg font-bold">${order.total.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order.orderDate), 'MMM dd, HH:mm')}
                    </p>
                  </CardContent>
                </Card>
              ))}
              {columnOrders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No orders
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
