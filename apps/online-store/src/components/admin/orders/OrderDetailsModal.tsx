'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Package, MapPin, CreditCard, Calendar, Printer } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Order {
  id: string;
  customerName: string;
  orderDate: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  status: string;
  paymentStatus: string;
}

interface OrderDetailsModalProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdate: (orderId: string, status: string) => void;
}

export function OrderDetailsModal({ order, open, onOpenChange, onStatusUpdate }: OrderDetailsModalProps) {
  const [status, setStatus] = useState(order?.status || "pending");
  const [notes, setNotes] = useState("");

  if (!order) return null;

  const handleSaveStatus = () => {
    onStatusUpdate(order.id, status);
    toast.success("Order status updated");
  };

  const handlePrint = () => {
    window.print();
    toast.success("Invoice ready to print");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Order Details - {order.id}</span>
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Print Invoice
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Info */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Customer Information
            </h3>
            <div className="bg-muted/50 p-4 rounded-lg space-y-1">
              <p className="font-medium">{order.customerName}</p>
              <p className="text-sm text-muted-foreground">customer@example.com</p>
              <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="font-semibold mb-2">Order Items</h3>
            <div className="border rounded-lg divide-y">
              {order.items.map((item, idx) => (
                <div key={idx} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">${item.price.toFixed(2)}</p>
                </div>
              ))}
              <div className="p-4 flex justify-between items-center bg-muted/30">
                <p className="font-semibold">Total</p>
                <p className="text-xl font-bold">${order.total.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Information
            </h3>
            <div className="bg-muted/50 p-4 rounded-lg space-y-1">
              <div className="flex justify-between">
                <span className="text-sm">Payment Method:</span>
                <span className="text-sm font-medium">Credit Card</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Transaction ID:</span>
                <span className="text-sm font-medium">TXN-{order.id.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Status:</span>
                <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                  {order.paymentStatus}
                </Badge>
              </div>
            </div>
          </div>

          {/* Shipping Info */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Shipping Address
            </h3>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm">123 Main Street</p>
              <p className="text-sm">Apt 4B</p>
              <p className="text-sm">New York, NY 10001</p>
            </div>
          </div>

          {/* Order Timeline */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Order Timeline
            </h3>
            <div className="space-y-2">
              <div className="flex gap-2 text-sm">
                <span className="text-muted-foreground">Placed:</span>
                <span className="font-medium">{format(new Date(order.orderDate), 'MMM dd, yyyy HH:mm')}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Status Update */}
          <div>
            <h3 className="font-semibold mb-2">Update Status</h3>
            <div className="flex gap-2">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSaveStatus}>Save Status</Button>
            </div>
          </div>

          {/* Internal Notes */}
          <div>
            <h3 className="font-semibold mb-2">Internal Notes</h3>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add internal notes about this order..."
              rows={3}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
