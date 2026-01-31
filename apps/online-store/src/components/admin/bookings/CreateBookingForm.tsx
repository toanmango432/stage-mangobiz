'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { addMinutes, format } from 'date-fns';
import { z } from 'zod';
import { Booking } from '@/types/booking';
// Removed mockData import - using local data

const bookingSchema = z.object({
  clientName: z.string().trim().min(1, 'Client name is required').max(100),
  clientEmail: z.string().trim().email('Invalid email address').max(255),
  clientPhone: z.string().trim().min(10, 'Valid phone number required').max(20),
  serviceId: z.string().min(1, 'Service is required'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  staffId: z.string().optional(),
});

interface CreateBookingFormProps {
  onClose: () => void;
}

const mockServices = [
  { id: '1', name: 'Haircut & Style', duration: 60, price: 65 },
  { id: '2', name: 'Hair Coloring', duration: 120, price: 120 },
  { id: '3', name: 'Manicure', duration: 45, price: 35 },
  { id: '4', name: 'Pedicure', duration: 60, price: 50 },
  { id: '5', name: 'Facial Treatment', duration: 75, price: 85 },
];

export const CreateBookingForm = ({ onClose }: CreateBookingFormProps) => {
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    serviceId: '',
    date: '',
    time: '',
    staffId: '',
    specialRequests: '',
    internalNotes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const staff: Array<{id: string; name: string; role?: string}> = [];
  const customers: Array<{id: string; firstName: string; lastName: string; email: string; phone: string}> = [];

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        clientName: `${customer.firstName} ${customer.lastName}`,
        clientEmail: customer.email,
        clientPhone: customer.phone,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validated = bookingSchema.parse(formData);
      
      const selectedService = mockServices.find(s => s.id === validated.serviceId);
      if (!selectedService) return;

      const selectedStaff = staff.find(s => s.id === validated.staffId);
      
      const dateTime = new Date(`${validated.date}T${validated.time}`);
      const endTime = addMinutes(dateTime, selectedService.duration);

      const newBooking: Booking = {
        id: `booking-${Date.now()}`,
        bookingNumber: `BK-2025-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
        client: {
          name: validated.clientName,
          email: validated.clientEmail,
          phone: validated.clientPhone,
        },
        service: {
          id: selectedService.id,
          name: selectedService.name,
          duration: selectedService.duration,
          price: selectedService.price,
        },
        addOns: [],
        dateTime: dateTime.toISOString(),
        endTime: endTime.toISOString(),
        staff: selectedStaff ? {
          id: selectedStaff.id,
          name: selectedStaff.name,
        } : undefined,
        status: 'confirmed',
        paymentStatus: 'unpaid',
        totalAmount: selectedService.price,
        specialRequests: formData.specialRequests,
        internalNotes: formData.internalNotes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      toast.success('Booking created successfully');
      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path) {
            newErrors[err.path[0]] = err.message;
          }
        });
        setErrors(newErrors);
        toast.error('Please fix the errors in the form');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Existing Customer</Label>
        <Select onValueChange={handleCustomerSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Select a customer (optional)" />
          </SelectTrigger>
          <SelectContent>
            {customers.slice(0, 20).map(customer => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.firstName} {customer.lastName} - {customer.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="clientName">Client Name *</Label>
          <Input
            id="clientName"
            value={formData.clientName}
            onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
            maxLength={100}
          />
          {errors.clientName && <p className="text-sm text-destructive">{errors.clientName}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientPhone">Phone *</Label>
          <Input
            id="clientPhone"
            type="tel"
            value={formData.clientPhone}
            onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
            maxLength={20}
          />
          {errors.clientPhone && <p className="text-sm text-destructive">{errors.clientPhone}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="clientEmail">Email *</Label>
        <Input
          id="clientEmail"
          type="email"
          value={formData.clientEmail}
          onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
          maxLength={255}
        />
        {errors.clientEmail && <p className="text-sm text-destructive">{errors.clientEmail}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="service">Service *</Label>
        <Select value={formData.serviceId} onValueChange={(value) => setFormData({ ...formData, serviceId: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select service" />
          </SelectTrigger>
          <SelectContent>
            {mockServices.map((service) => (
              <SelectItem key={service.id} value={service.id}>
                {service.name} - ${service.price} ({service.duration} min)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.serviceId && <p className="text-sm text-destructive">{errors.serviceId}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            min={format(new Date(), 'yyyy-MM-dd')}
          />
          {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="time">Time *</Label>
          <Input
            id="time"
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
          />
          {errors.time && <p className="text-sm text-destructive">{errors.time}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="staff">Assign Staff</Label>
        <Select value={formData.staffId} onValueChange={(value) => setFormData({ ...formData, staffId: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Any available staff" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any available staff</SelectItem>
            {staff.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name} - {member.role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="specialRequests">Special Requests</Label>
        <Textarea
          id="specialRequests"
          value={formData.specialRequests}
          onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
          placeholder="Any special requests from the client..."
          rows={3}
          maxLength={500}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="internalNotes">Internal Notes (Admin only)</Label>
        <Textarea
          id="internalNotes"
          value={formData.internalNotes}
          onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
          placeholder="Add any internal notes..."
          rows={3}
          maxLength={500}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Create Booking</Button>
      </div>
    </form>
  );
};
