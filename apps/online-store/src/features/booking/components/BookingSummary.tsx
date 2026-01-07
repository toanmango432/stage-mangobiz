import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, User, DollarSign, MapPin } from 'lucide-react';
import type { BookingService, Staff, BookingCustomer } from '../types/booking.types';
import { TimeUtils } from '../utils/timeUtils';

interface BookingSummaryProps {
  services: BookingService[];
  staff: Staff | null;
  customer: BookingCustomer | null;
  date: string | null;
  time: string | null;
  notes?: string;
  totalPrice: number;
  totalDuration: number;
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({
  services,
  staff,
  customer,
  date,
  time,
  notes,
  totalPrice,
  totalDuration,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Services */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Badge variant="secondary">{services.length}</Badge>
            Selected Services
          </h3>
          <div className="space-y-3">
            {services.map((service) => {
              let servicePrice = service.price;
              let serviceDuration = service.duration;

              if (service.selectedAddOns && service.addOns) {
                service.selectedAddOns.forEach(selected => {
                  const addOn = service.addOns!.find(a => a.id === selected.id);
                  if (addOn) {
                    servicePrice += addOn.price * selected.quantity;
                    serviceDuration += addOn.duration * selected.quantity;
                  }
                });
              }

              return (
                <div key={service.id} className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium">{service.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {service.categoryName}
                      </p>
                    </div>
                    <p className="font-semibold">${servicePrice.toFixed(2)}</p>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {TimeUtils.formatDuration(serviceDuration)}
                  </div>

                  {service.selectedAddOns && service.selectedAddOns.length > 0 && (
                    <div className="mt-2 pl-3 border-l-2 border-primary/20">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Add-ons:
                      </p>
                      {service.selectedAddOns.map(selected => {
                        const addOn = service.addOns?.find(a => a.id === selected.id);
                        if (!addOn) return null;
                        return (
                          <p key={selected.id} className="text-xs text-muted-foreground">
                            • {addOn.title} {selected.quantity > 1 && `(x${selected.quantity})`}
                          </p>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Staff */}
        {staff && (
          <>
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <User className="h-4 w-4" />
                Staff Member
              </h3>
              <p className="text-sm">
                {staff.firstName} {staff.lastName}
                {staff.nickname && ` "${staff.nickname}"`}
              </p>
            </div>
            <Separator />
          </>
        )}

        {/* Date & Time */}
        {date && time && (
          <>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {TimeUtils.formatDate(date, 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {time} - {TimeUtils.calculateEndTime(time, totalDuration)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {TimeUtils.formatDuration(totalDuration)}
                  </p>
                </div>
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Customer */}
        {customer && (
          <>
            <div>
              <h3 className="font-semibold mb-2">Contact Information</h3>
              <div className="space-y-1 text-sm">
                <p>
                  {customer.firstName} {customer.lastName}
                </p>
                <p className="text-muted-foreground">{customer.email}</p>
                <p className="text-muted-foreground">{customer.phone}</p>
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Notes */}
        {notes && (
          <>
            <div>
              <h3 className="font-semibold mb-2">Special Requests</h3>
              <p className="text-sm text-muted-foreground">{notes}</p>
            </div>
            <Separator />
          </>
        )}

        {/* Total */}
        <div className="bg-primary/5 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total Duration</span>
            <span className="font-medium">
              {TimeUtils.formatDuration(totalDuration)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-lg">Total Price</span>
            <span className="font-bold text-2xl flex items-center gap-1">
              <DollarSign className="h-5 w-5" />
              {totalPrice.toFixed(2)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
