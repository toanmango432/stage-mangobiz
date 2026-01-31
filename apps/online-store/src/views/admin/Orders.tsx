'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, FileText, Download } from "lucide-react";
import { format } from "date-fns";
import { OrderDetailsModal } from "@/components/admin/orders/OrderDetailsModal";
import { OrderStatusPipeline } from "@/components/admin/orders/OrderStatusPipeline";
import { exportToCSV } from "@/lib/utils/exportHelpers";
import { toast } from "sonner";

interface Order {
  id: string;
  customerName: string;
  orderDate: string;
  items: any[];
  total: number;
  paymentStatus: string;
  status: string;
}

const Orders = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [view, setView] = useState<"table" | "pipeline">("table");
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);

  useEffect(() => {
    // Mock orders data
    const mockOrders: Order[] = [
      { id: 'ORD-1001', customerName: 'Sarah Johnson', orderDate: '2024-10-15', items: [{ name: 'Haircut', price: 60 }], total: 60, paymentStatus: 'paid', status: 'completed' },
      { id: 'ORD-1002', customerName: 'Michael Chen', orderDate: '2024-10-16', items: [{ name: 'Color Treatment', price: 120 }], total: 120, paymentStatus: 'paid', status: 'processing' },
      { id: 'ORD-1003', customerName: 'Emily Rodriguez', orderDate: '2024-10-17', items: [{ name: 'Manicure', price: 45 }], total: 45, paymentStatus: 'paid', status: 'pending' }
    ];
    setOrders(mockOrders);
    setFilteredOrders(mockOrders);
  }, []);

  useEffect(() => {
    const filtered = orders.filter((order) => {
      const matchesSearch = 
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    const sorted = [...filtered].sort((a, b) => 
      new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
    );
    setFilteredOrders(sorted);
  }, [searchQuery, statusFilter, orders]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: 'default',
      pending: 'secondary',
      cancelled: 'destructive',
      processing: 'outline',
    };
    return variants[status] || 'secondary';
  };

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    const updatedOrders = orders.map(o => 
      o.id === orderId ? { ...o, status: newStatus } : o
    );
    localStorage.setItem('mango-orders', JSON.stringify(updatedOrders));
    toast.success("Order status updated");
  };

  const handleExportCSV = () => {
    exportToCSV(filteredOrders, 'orders-export');
    toast.success("Orders exported to CSV");
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const toggleAllOrders = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(o => o.id));
    }
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    completed: orders.filter(o => o.status === 'completed').length,
    revenue: orders.reduce((sum, o) => sum + o.total, 0),
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground">Manage all customer orders</p>
        </div>
        <Button onClick={handleExportCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.revenue.toFixed(0)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Orders</CardTitle>
            <Tabs value={view} onValueChange={(v) => setView(v as "table" | "pipeline")}>
              <TabsList>
                <TabsTrigger value="table">Table View</TabsTrigger>
                <TabsTrigger value="pipeline">Pipeline View</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order ID or customer name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedOrders.length > 0 && (
            <div className="bg-muted/50 p-4 rounded-lg mb-4 flex items-center gap-4">
              <span className="text-sm">{selectedOrders.length} orders selected</span>
              <Button variant="outline" size="sm" onClick={() => setSelectedOrders([])}>
                Clear
              </Button>
            </div>
          )}

          {view === "pipeline" ? (
            <OrderStatusPipeline 
              orders={filteredOrders}
              onOrderClick={(order) => {
                setSelectedOrder(order);
                setDetailsOpen(true);
              }}
              onStatusChange={handleStatusUpdate}
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                  <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedOrders.length === filteredOrders.length}
                        onCheckedChange={toggleAllOrders}
                      />
                    </TableHead>
                    <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Checkbox 
                          checked={selectedOrders.includes(order.id)}
                          onCheckedChange={() => toggleOrderSelection(order.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(order.orderDate), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>{order.items.length}</TableCell>
                      <TableCell className="font-medium">${order.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                          {order.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(order.status)}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            setSelectedOrder(order);
                            setDetailsOpen(true);
                          }}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          )}
        </CardContent>
      </Card>

      <OrderDetailsModal 
        order={selectedOrder}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
};

export default Orders;
