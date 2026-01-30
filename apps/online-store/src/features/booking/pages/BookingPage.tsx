'use client';

import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { Progress } from '@/components/ui/progress';
import { ServiceSelection } from './ServiceSelection';
import { StaffSelection } from './StaffSelection';
import { TimeSelection } from './TimeSelection';
import { CustomerInfo } from './CustomerInfo';
import { BookingReview } from './BookingReview';
import { BookingConfirmation } from './BookingConfirmation';
import { selectCurrentStep } from '../redux/bookingSelectors';
import { bookingThunks } from '../services/bookingService';

const STEPS = [
  { key: 'services', label: 'Services', component: ServiceSelection },
  { key: 'staff', label: 'Staff', component: StaffSelection },
  { key: 'datetime', label: 'Date & Time', component: TimeSelection },
  { key: 'customer', label: 'Contact', component: CustomerInfo },
  { key: 'review', label: 'Review', component: BookingReview },
  { key: 'confirmed', label: 'Confirmed', component: BookingConfirmation },
];

export const BookingPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentStep = useAppSelector(selectCurrentStep);

  // Load initial data on mount
  useEffect(() => {
    dispatch(bookingThunks.loadInitialData() as any);
  }, [dispatch]);

  const currentStepIndex = STEPS.findIndex(step => step.key === currentStep);
  const CurrentStepComponent = STEPS[currentStepIndex]?.component;
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  // Don't show progress bar on confirmation page
  const showProgress = currentStep !== 'confirmed';

  return (
    <div className="min-h-screen bg-background">
      {/* Progress Bar */}
      {showProgress && (
        <div className="sticky top-0 z-50 bg-background border-b">
          <div className="container mx-auto px-4 py-4">
            {/* Step Labels */}
            <div className="flex justify-between mb-2">
              {STEPS.slice(0, -1).map((step, index) => (
                <div
                  key={step.key}
                  className={`text-xs sm:text-sm font-medium ${
                    index <= currentStepIndex
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">{index + 1}</span>
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      )}

      {/* Current Step Content */}
      <div className="pb-24">
        {CurrentStepComponent ? (
          <CurrentStepComponent />
        ) : (
          <div className="container mx-auto px-4 py-8 text-center">
            <p className="text-muted-foreground">Invalid step</p>
          </div>
        )}
      </div>
    </div>
  );
};
