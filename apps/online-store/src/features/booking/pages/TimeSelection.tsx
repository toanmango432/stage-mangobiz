'use client';

import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Calendar } from '../components/Calendar';
import { TimeSlots } from '../components/TimeSlots';
import {
  setSelectedDate,
  setSelectedTime,
  nextStep,
  previousStep,
} from '../redux/bookingSlice';
import {
  selectCurrentBooking,
  selectAllOffDays,
  selectAvailableTimeSlots,
  selectCanProceedToNextStep,
  selectLoading,
  selectSelectedServices,
  selectSelectedStaff,
} from '../redux/bookingSelectors';
import { bookingThunks } from '../services/bookingService';

export const TimeSelection: React.FC = () => {
  const dispatch = useAppDispatch();
  
  const currentBooking = useAppSelector(selectCurrentBooking);
  const offDays = useAppSelector(selectAllOffDays);
  const timeSlots = useAppSelector(selectAvailableTimeSlots);
  const canProceed = useAppSelector(selectCanProceedToNextStep);
  const loading = useAppSelector(selectLoading);
  const selectedServices = useAppSelector(selectSelectedServices);
  const selectedStaff = useAppSelector(selectSelectedStaff);

  // Load time slots when date is selected
  useEffect(() => {
    if (currentBooking.selectedDate && selectedServices.length > 0) {
      const serviceIds = selectedServices.map(s => s.id);
      dispatch(bookingThunks.loadTimeSlots(
        currentBooking.selectedDate,
        serviceIds,
        currentBooking.selectedStaffId || undefined
      ) as any);
    }
  }, [currentBooking.selectedDate, selectedServices, currentBooking.selectedStaffId, dispatch]);

  const handleDateSelect = (date: string) => {
    dispatch(setSelectedDate(date));
  };

  const handleTimeSelect = (time: string) => {
    dispatch(setSelectedTime(time));
  };

  const handleNext = () => {
    if (canProceed) {
      dispatch(nextStep());
    }
  };

  const handleBack = () => {
    dispatch(previousStep());
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Staff Selection
        </Button>

        <h1 className="text-3xl font-bold mb-2">Select Date & Time</h1>
        <p className="text-muted-foreground">
          Choose when you'd like your appointment
        </p>
      </div>

      {/* Booking Summary */}
      <div className="mb-8 p-4 bg-muted/50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium mb-1">Services:</p>
            <div className="text-muted-foreground">
              {selectedServices.map(s => s.title).join(', ')}
            </div>
          </div>
          {selectedStaff && (
            <div>
              <p className="font-medium mb-1">Staff:</p>
              <div className="text-muted-foreground">
                {selectedStaff.firstName} {selectedStaff.lastName}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-24">
        {/* Calendar */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Select Date</h2>
          <Calendar
            selectedDate={currentBooking.selectedDate}
            onDateSelect={handleDateSelect}
            offDays={offDays}
          />
        </div>

        {/* Time Slots */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Select Time</h2>
          {!currentBooking.selectedDate ? (
            <div className="text-center py-12 text-muted-foreground">
              Please select a date first
            </div>
          ) : (
            <TimeSlots
              timeSlots={timeSlots}
              selectedTime={currentBooking.selectedTime}
              onTimeSelect={handleTimeSelect}
              loading={loading.timeSlots}
            />
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      {canProceed && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
          <div className="container mx-auto flex justify-between items-center">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button onClick={handleNext} size="lg">
              Continue to Contact Info
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
