'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Booking } from '@/types/booking';
import { Search, Edit, Trash2, CheckCircle, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const BookingsList = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = () => {
    // Mock bookings data
    const mockBookings: Booking[] = [];
    setBookings(mockBookings);
  };

  const filteredBookings = bookings
    .filter((booking) => {
      const matchesSearch =
        booking.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

  const handleStatusChange = (booking: Booking, newStatus: Booking['status']) => {
    const updated = { ...booking, status: newStatus };
    setBookings(prev => prev.map(b => b.id === booking.id ? updated : b));
    toast.success(`Booking ${newStatus}`);
  };

  const handleDelete = (booking: Booking) => {
    if (confirm('Are you sure you want to delete this booking?')) {
      setBookings(prev => prev.filter(b => b.id !== booking.id));
      toast.success('Booking deleted');
    }
  };

  const handleSaveNotes = () => {
    if (selectedBooking) {
      setBookings(prev => prev.map(b => b.id === selectedBooking.id ? selectedBooking : b));
      toast.success('Notes saved');
      setIsEditOpen(false);
    }
  };

  const statusColors = {
    confirmed: 'bg-primary/10 text-primary',
    pending: 'bg-yellow-500/10 text-yellow-700',
    completed: 'bg-green-500/10 text-green-700',
    cancelled: 'bg-destructive/10 text-destructive',
    'no-show': 'bg-gray-500/10 text-gray-700',
  };

  const paymentStatusColors = {
    paid: 'bg-green-500/10 text-green-700',
    'deposit-paid': 'bg-blue-500/10 text-blue-700',
    unpaid: 'bg-yellow-500/10 text-yellow-700',
    refunded: 'bg-gray-500/10 text-gray-700',
  };

  return (
    <Card>
      <CardContent className="p-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or booking number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="no-show">No-show</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-2">No bookings found</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Bookings will appear here once customers book appointments'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">
                      {booking.bookingNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{booking.client.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.client.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{booking.service.name}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {format(parseISO(booking.dateTime), 'MMM d, yyyy')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(booking.dateTime), 'h:mm a')}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {booking.staff?.name || 'Not assigned'}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(statusColors[booking.status])}>
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(paymentStatusColors[booking.paymentStatus])}>
                        {booking.paymentStatus.replace('-', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${booking.totalAmount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setIsEditOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {booking.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStatusChange(booking, 'confirmed')}
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        {booking.status === 'confirmed' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStatusChange(booking, 'completed')}
                          >
                            <Clock className="h-4 w-4 text-blue-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(booking)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Booking - {selectedBooking?.bookingNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Status</Label>
              <Select
                value={selectedBooking?.status}
                onValueChange={(value) =>
                  setSelectedBooking(prev => prev ? { ...prev, status: value as Booking['status'] } : null)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no-show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Payment Status</Label>
              <Select
                value={selectedBooking?.paymentStatus}
                onValueChange={(value) =>
                  setSelectedBooking(prev => prev ? { ...prev, paymentStatus: value as Booking['paymentStatus'] } : null)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="deposit-paid">Deposit Paid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Internal Notes</Label>
              <Textarea
                value={selectedBooking?.internalNotes || ''}
                onChange={(e) =>
                  setSelectedBooking(prev => prev ? { ...prev, internalNotes: e.target.value } : null)
                }
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNotes}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
