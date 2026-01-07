import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { BookingSummary } from '../components/BookingSummary';
import { previousStep } from '../redux/bookingSlice';
import {
  selectBookingSummary,
  selectLoading,
  selectError,
} from '../redux/bookingSelectors';
import { bookingThunks } from '../services/bookingService';
import type { CreateBookingRequest } from '../types/booking.types';

export const BookingReview: React.FC = () => {
  const dispatch = useAppDispatch();
  
  const summary = useAppSelector(selectBookingSummary);
  const loading = useAppSelector(selectLoading);
  const error = useAppSelector(selectError);
  
  const [submitting, setSubmitting] = useState(false);

  const handleBack = () => {
    dispatch(previousStep());
  };

  const handleConfirm = async () => {
    if (!summary.customer || !summary.staff || !summary.date || !summary.time) {
      return;
    }

    setSubmitting(true);

    try {
      const request: CreateBookingRequest = {
        customer: summary.customer,
        services: summary.services.map(service => ({
          serviceId: service.id,
          addOnIds: service.selectedAddOns?.map(a => a.id),
          answers: service.answers,
        })),
        staffId: summary.staff.id,
        date: summary.date,
        time: summary.time,
        notes: summary.notes,
      };

      await dispatch(bookingThunks.submitBooking(request) as any);
      
      // Success - will navigate to confirmation via Redux state change
    } catch (err) {
      console.error('Booking failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={submitting}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Contact Info
        </Button>

        <h1 className="text-3xl font-bold mb-2">Review Your Booking</h1>
        <p className="text-muted-foreground">
          Please review your appointment details before confirming
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Booking Summary */}
      <div className="mb-8">
        <BookingSummary
          services={summary.services}
          staff={summary.staff}
          customer={summary.customer}
          date={summary.date}
          time={summary.time}
          notes={summary.notes}
          totalPrice={summary.totalPrice}
          totalDuration={summary.totalDuration}
        />
      </div>

      {/* Terms and Conditions */}
      <div className="mb-6 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
        <p className="mb-2">
          By confirming this booking, you agree to our cancellation policy:
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Cancellations must be made at least 24 hours in advance</li>
          <li>Late cancellations may incur a fee</li>
          <li>Please arrive 10 minutes before your appointment</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={submitting}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <Button
          onClick={handleConfirm}
          disabled={submitting}
          size="lg"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Confirming...
            </>
          ) : (
            'Confirm Booking'
          )}
        </Button>
      </div>
    </div>
  );
};
