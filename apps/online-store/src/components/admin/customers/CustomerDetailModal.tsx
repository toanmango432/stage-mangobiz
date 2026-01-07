import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, Phone, Calendar, DollarSign, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { Customer } from "@/lib/mockData";

interface CustomerDetailModalProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendMessage: (customer: Customer) => void;
}

export function CustomerDetailModal({ customer, open, onOpenChange, onSendMessage }: CustomerDetailModalProps) {
  if (!customer) return null;

  const initials = `${customer.firstName[0]}${customer.lastName[0]}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold">
                  {customer.firstName} {customer.lastName}
                </h2>
                {customer.membershipStatus && (
                  <Badge variant="default">{customer.membershipStatus}</Badge>
                )}
              </div>
            </div>
            <Button onClick={() => onSendMessage(customer)} className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Send Message
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Contact Information</h3>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4" />
                    {customer.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4" />
                    {customer.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    Joined {format(new Date(customer.joinDate), 'MMM dd, yyyy')}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Customer Metrics</h3>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Bookings:</span>
                    <span className="font-medium">{customer.bookingsCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Spent:</span>
                    <span className="font-medium flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {customer.totalSpent.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Loyalty Points:</span>
                    <span className="font-medium">250 pts</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bookings">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No bookings found
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No orders found
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Service Preferences</h3>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">No preferences recorded</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Notes</h3>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">No notes added</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
