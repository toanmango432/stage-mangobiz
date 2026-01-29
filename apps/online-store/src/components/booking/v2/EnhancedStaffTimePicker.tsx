// CORRECT Booking Flow: Staff FIRST → Then Date/Time based on staff availability
// This replaces the old StaffTimePicker with proper flow

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  Users, 
  CheckCircle,
  ArrowLeft,
  User,
  Calendar as CalendarIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CartItem, Assignment, Staff } from './types';
import { StaffSelector } from './StaffSelector';
import { StickyActionBar } from './StickyActionBar';
import { Calendar7Day } from '../enhanced/Calendar7Day';
import { GroupedTimeSlots } from '../enhanced/GroupedTimeSlots';
import { BookingTimeUtils } from '../enhanced/timeUtils';
import { useStore } from '@/hooks/useStore';
import { useStaff } from '@/hooks/queries';

interface EnhancedStaffTimePickerProps {
  cartItems: CartItem[];
  onAssignments: (assignments: Assignment[]) => void;
  onBack: () => void;
  onContinue: () => void;
}

interface TimeSlot {
  time: string;
  available: boolean;
  staffCount?: number;
}

export const EnhancedStaffTimePicker: React.FC<EnhancedStaffTimePickerProps> = ({
  cartItems,
  onAssignments,
  onBack,
  onContinue,
}) => {
  const { storeId } = useStore();
  const { data: staffData, isLoading: loading } = useStaff(storeId);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0);

  // Current service being assigned
  const currentItem = cartItems[currentServiceIndex];
  const currentAssignment = assignments.find(a => a.cartItemId === currentItem?.id);

  // Transform staff data from Supabase to component format
  const staff: Staff[] = useMemo(() => {
    if (!staffData) return [];
    return staffData.map(member => ({
      id: member.id,
      name: member.fullName,
      role: member.title || '',
      rating: 5,
      services: member.specialties || [],
      avatar: member.avatarUrl || '',
      availability: {} as Record<string, { start: string; end: string }[]>,
    }));
  }, [staffData]);

  // Handle staff selection
  const handleStaffSelect = (staffId: string) => {
    const newAssignment: Assignment = {
      ...currentAssignment,
      cartItemId: currentItem.id,
      staffId,
      date: currentAssignment?.date || '',
      time: currentAssignment?.time || '',
      duration: currentItem.service.duration,
    };

    setAssignments(prev => {
      const filtered = prev.filter(a => a.cartItemId !== currentItem.id);
      return [...filtered, newAssignment];
    });
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    const dateStr = BookingTimeUtils.toISODate(date);
    
    setAssignments(prev => {
      const current = prev.find(a => a.cartItemId === currentItem.id);
      if (!current) return prev;

      const filtered = prev.filter(a => a.cartItemId !== currentItem.id);
      return [...filtered, { ...current, date: dateStr }];
    });
  };

  // Handle time selection
  const handleTimeSelect = (time: string) => {
    const updatedAssignments = (() => {
      const current = assignments.find(a => a.cartItemId === currentItem.id);
      if (!current) return assignments;

      const filtered = assignments.filter(a => a.cartItemId !== currentItem.id);
      return [...filtered, { ...current, time }];
    })();

    setAssignments(updatedAssignments);

    // Check if this is the last service and all are now complete
    const isLastService = currentServiceIndex === cartItems.length - 1;
    const allComplete = updatedAssignments.length === cartItems.length &&
                       updatedAssignments.every(a => a.staffId && a.date && a.time);

    if (isLastService && allComplete) {
      // All services assigned, jump directly to phone verification
      setTimeout(() => {
        onAssignments(updatedAssignments);
        onContinue();
      }, 300); // Small delay for UX
    }
  };

  // Generate time slots for selected staff and date
  const generateTimeSlots = (): TimeSlot[] => {
    if (!currentAssignment?.staffId || !currentAssignment?.date) {
      return [];
    }

    // TODO: Replace with actual API call based on staff and date
    const slots = BookingTimeUtils.generateTimeSlots('9:00 AM', '7:00 PM', 30);
    
    return slots.map(time => ({
      time,
      available: Math.random() > 0.3, // Mock availability
      staffCount: Math.floor(Math.random() * 3) + 1,
    }));
  };

  const timeSlots = generateTimeSlots();

  // Check if current assignment is complete
  const isCurrentComplete = currentAssignment?.staffId && currentAssignment?.date && currentAssignment?.time;

  // Handle next/continue
  const handleNext = () => {
    if (currentServiceIndex < cartItems.length - 1) {
      setCurrentServiceIndex(prev => prev + 1);
    } else {
      // All services assigned
      onAssignments(assignments);
      onContinue();
    }
  };

  // Handle previous
  const handlePrevious = () => {
    if (currentServiceIndex > 0) {
      setCurrentServiceIndex(prev => prev - 1);
    } else {
      onBack();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading staff...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Book Your Appointment</h1>
              <p className="text-muted-foreground">
                Service {currentServiceIndex + 1} of {cartItems.length}
              </p>
            </div>
            <Button onClick={onBack} variant="outline" size="sm">
              Edit Services
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Current Service Card */}
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{currentItem.service.name}</span>
              {isCurrentComplete && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">Duration:</span>
                <Badge variant="secondary">
                  {BookingTimeUtils.formatDuration(currentItem.service.duration)}
                </Badge>
              </div>
              <div className="font-semibold text-lg">
                ${currentItem.service.price.toFixed(2)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 1: Select Staff */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                currentAssignment?.staffId ? "bg-green-500 text-white" : "bg-primary text-primary-foreground"
              )}>
                {currentAssignment?.staffId ? <CheckCircle className="h-4 w-4" /> : "1"}
              </div>
              <span>Select Staff Member</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StaffSelector
              staff={staff}
              selectedStaff={currentAssignment?.staffId || ''}
              onStaffSelect={handleStaffSelect}
              serviceCategory={currentItem.service.category}
              isMultipleServices={false}
            />
          </CardContent>
        </Card>

        {/* Step 2: Select Date (only after staff selected) */}
        {currentAssignment?.staffId && (
          <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                  currentAssignment?.date ? "bg-green-500 text-white" : "bg-primary text-primary-foreground"
                )}>
                  {currentAssignment?.date ? <CheckCircle className="h-4 w-4" /> : "2"}
                </div>
                <span>Select Date</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar7Day
                selectedDate={currentAssignment.date ? new Date(currentAssignment.date) : null}
                onDateSelect={handleDateSelect}
                offDays={[]} // TODO: Load from API
                staffOffDays={[]} // TODO: Load staff-specific off days
              />
            </CardContent>
          </Card>
        )}

        {/* Step 3: Select Time (only after date selected) */}
        {currentAssignment?.staffId && currentAssignment?.date && (
          <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                  currentAssignment?.time ? "bg-green-500 text-white" : "bg-primary text-primary-foreground"
                )}>
                  {currentAssignment?.time ? <CheckCircle className="h-4 w-4" /> : "3"}
                </div>
                <span>Select Time</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GroupedTimeSlots
                timeSlots={timeSlots}
                selectedTime={currentAssignment.time || null}
                onTimeSelect={handleTimeSelect}
                loading={false}
                showBestTime={true}
              />
            </CardContent>
          </Card>
        )}

        {/* Progress Summary */}
        {cartItems.length > 1 && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Overall Progress</span>
                  <span className="text-muted-foreground">
                    {assignments.filter(a => a.staffId && a.date && a.time).length} of {cartItems.length} complete
                  </span>
                </div>
                <div className="flex gap-2">
                  {cartItems.map((item, index) => {
                    const assignment = assignments.find(a => a.cartItemId === item.id);
                    const isComplete = assignment?.staffId && assignment?.date && assignment?.time;
                    const isCurrent = index === currentServiceIndex;

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "flex-1 h-2 rounded-full transition-all",
                          isComplete && "bg-green-500",
                          isCurrent && !isComplete && "bg-primary",
                          !isCurrent && !isComplete && "bg-muted"
                        )}
                      />
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {currentServiceIndex === 0 ? 'Back to Cart' : 'Previous Service'}
          </Button>

          <Button
            onClick={handleNext}
            disabled={!isCurrentComplete}
            className="flex items-center gap-2"
          >
            {currentServiceIndex < cartItems.length - 1 ? 'Next Service' : 'Continue to Review'}
            <CheckCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
