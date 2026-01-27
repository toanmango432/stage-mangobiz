import React from 'react';
import { useNavigate } from '@/lib/navigation';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Calendar, Clock, User, Mail, Phone, Home } from 'lucide-react';
import { resetBooking } from '../redux/bookingSlice';
import { selectBookingSummary } from '../redux/bookingSelectors';
import { TimeUtils } from '../utils/timeUtils';

export const BookingConfirmation: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const summary = useAppSelector(selectBookingSummary);

  const handleNewBooking = () => {
    dispatch(resetBooking());
    navigate('/booking');
  };

  const handleGoHome = () => {
    dispatch(resetBooking());
    navigate('/');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Success Icon */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
        <p className="text-muted-foreground">
          Your appointment has been successfully scheduled
        </p>
      </div>

      {/* Confirmation Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Appointment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date & Time */}
          {summary.date && summary.time && (
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">
                  {TimeUtils.formatDate(summary.date, 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {summary.time} - {TimeUtils.calculateEndTime(summary.time, summary.totalDuration)}
                </p>
              </div>
            </div>
          )}

          {/* Duration */}
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Duration</p>
              <p className="text-sm text-muted-foreground">
                {TimeUtils.formatDuration(summary.totalDuration)}
              </p>
            </div>
          </div>

          {/* Staff */}
          {summary.staff && (
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Staff Member</p>
                <p className="text-sm text-muted-foreground">
                  {summary.staff.firstName} {summary.staff.lastName}
                </p>
              </div>
            </div>
          )}

          {/* Services */}
          <div className="pt-4 border-t">
            <p className="font-medium mb-2">Services</p>
            <div className="space-y-2">
              {summary.services.map((service) => (
                <div key={service.id} className="flex justify-between text-sm">
                  <span>{service.title}</span>
                  <span className="text-muted-foreground">
                    ${service.price.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="pt-4 border-t">
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>${summary.totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      {summary.customer && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <span>
                {summary.customer.firstName} {summary.customer.lastName}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <span>{summary.customer.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <span>{summary.customer.phone}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Email Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-900">
          <strong>Confirmation email sent!</strong> We've sent a confirmation email to{' '}
          {summary.customer?.email}. Please check your inbox for appointment details.
        </p>
      </div>

      {/* Important Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Important Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Please arrive 10 minutes before your scheduled appointment</p>
          <p>• Cancellations must be made at least 24 hours in advance</p>
          <p>• Late arrivals may result in shortened service time</p>
          <p>• If you need to reschedule, please contact us as soon as possible</p>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={handleNewBooking}
          variant="outline"
          className="flex-1"
        >
          Book Another Appointment
        </Button>
        <Button
          onClick={handleGoHome}
          className="flex-1"
        >
          <Home className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </div>
    </div>
  );
};
