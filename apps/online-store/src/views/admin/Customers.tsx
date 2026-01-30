'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, UserPlus, Mail, Phone, Calendar, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { CustomerDetailModal } from "@/components/admin/customers/CustomerDetailModal";
import { QuickMessageDialog } from "@/components/admin/customers/QuickMessageDialog";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  joinDate: string;
  bookingsCount: number;
  totalSpent: number;
  membershipStatus?: 'active' | 'cancelled' | 'expired';
  preferredServices?: string[];
  notes?: string;
}

const Customers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    // Mock customer data
    const mockCustomers: Customer[] = [
      { id: 'c1', firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.j@email.com', phone: '555-0101', joinDate: '2024-01-15', bookingsCount: 8, totalSpent: 650, membershipStatus: 'active', preferredServices: [], notes: '' },
      { id: 'c2', firstName: 'Michael', lastName: 'Chen', email: 'mchen@email.com', phone: '555-0102', joinDate: '2024-02-20', bookingsCount: 5, totalSpent: 420, preferredServices: [], notes: '' },
      { id: 'c3', firstName: 'Emily', lastName: 'Rodriguez', email: 'emily.r@email.com', phone: '555-0103', joinDate: '2024-03-10', bookingsCount: 12, totalSpent: 980, membershipStatus: 'active', preferredServices: [], notes: '' }
    ];
    setCustomers(mockCustomers);
    setFilteredCustomers(mockCustomers);
  }, []);

  useEffect(() => {
    const filtered = customers.filter((customer) => {
      const query = searchQuery.toLowerCase();
      return (
        customer.firstName.toLowerCase().includes(query) ||
        customer.lastName.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.phone.includes(query)
      );
    });
    const sorted = [...filtered].sort((a, b) => 
      new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime()
    );
    setFilteredCustomers(sorted);
  }, [searchQuery, customers]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage your customer database</p>
        </div>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Customers ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow 
                      key={customer.id} 
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setDetailsOpen(true);
                      }}
                    >
                      <TableCell>
                        <div className="font-medium">
                          {customer.firstName} {customer.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">ID: {customer.id}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(customer.joinDate), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>{customer.bookingsCount}</TableCell>
                      <TableCell className="font-medium">
                        ${customer.totalSpent.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {customer.membershipStatus ? (
                          <Badge variant={customer.membershipStatus === 'active' ? 'default' : 'secondary'}>
                            {customer.membershipStatus}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">Regular</span>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setMessageOpen(true);
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CustomerDetailModal 
        customer={selectedCustomer ? {
          ...selectedCustomer,
          preferredServices: selectedCustomer.preferredServices || [],
          notes: selectedCustomer.notes || ''
        } : null}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onSendMessage={(customer) => {
          setDetailsOpen(false);
          setSelectedCustomer(customer as any);
          setMessageOpen(true);
        }}
      />

      <QuickMessageDialog 
        customer={selectedCustomer ? {
          ...selectedCustomer,
          preferredServices: selectedCustomer.preferredServices || [],
          notes: selectedCustomer.notes || ''
        } : null}
        open={messageOpen}
        onOpenChange={setMessageOpen}
      />
    </div>
  );
};

export default Customers;
