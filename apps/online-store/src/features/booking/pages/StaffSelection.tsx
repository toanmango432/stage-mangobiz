import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { StaffCard } from '../components/StaffCard';
import {
  setSelectedStaff,
  nextStep,
  previousStep,
} from '../redux/bookingSlice';
import {
  selectStaff,
  selectCurrentBooking,
  selectSelectedServices,
  selectCanProceedToNextStep,
} from '../redux/bookingSelectors';

export const StaffSelection: React.FC = () => {
  const dispatch = useAppDispatch();
  
  const staff = useAppSelector(selectStaff);
  const currentBooking = useAppSelector(selectCurrentBooking);
  const selectedServices = useAppSelector(selectSelectedServices);
  const canProceed = useAppSelector(selectCanProceedToNextStep);

  const handleSelectStaff = (staffId: string) => {
    dispatch(setSelectedStaff(staffId));
  };

  const handleNext = () => {
    if (canProceed) {
      dispatch(nextStep());
    }
  };

  const handleBack = () => {
    dispatch(previousStep());
  };

  // Filter staff who can perform selected services
  const availableStaff = staff.filter(s => {
    // TODO: Filter based on staff specialties matching selected services
    // For now, show all available staff
    return s.isAvailable;
  });

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
          Back to Services
        </Button>

        <h1 className="text-3xl font-bold mb-2">Select Staff Member</h1>
        <p className="text-muted-foreground">
          Choose who you'd like to perform your services
        </p>
      </div>

      {/* Selected Services Summary */}
      <div className="mb-6 p-4 bg-muted/50 rounded-lg">
        <p className="text-sm font-medium mb-2">Selected Services:</p>
        <div className="flex flex-wrap gap-2">
          {selectedServices.map(service => (
            <span key={service.id} className="text-sm text-muted-foreground">
              • {service.title}
            </span>
          ))}
        </div>
      </div>

      {/* Staff Grid */}
      {availableStaff.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No staff available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
          {availableStaff.map(staffMember => (
            <StaffCard
              key={staffMember.id}
              staff={staffMember}
              isSelected={currentBooking.selectedStaffId === staffMember.id}
              onSelect={handleSelectStaff}
            />
          ))}
        </div>
      )}

      {/* Bottom Navigation */}
      {canProceed && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
          <div className="container mx-auto flex justify-between items-center">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button onClick={handleNext} size="lg">
              Continue to Date & Time
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
