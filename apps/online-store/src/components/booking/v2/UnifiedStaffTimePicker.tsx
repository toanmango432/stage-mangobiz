// Option A: Same staff/date for ALL services, sequential booking
// Industry standard approach (Fresha, Zenoti, Booksy)

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, Calendar as CalendarIcon, ArrowLeft, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CartItem, Assignment, Staff } from './types';
import { StaffSelector } from './StaffSelector';
import { Calendar7Day } from '../enhanced/Calendar7Day';
import { GroupedTimeSlots } from '../enhanced/GroupedTimeSlots';
import { BookingTimeUtils } from '../enhanced/timeUtils';
import { BookingSummaryFooter } from './BookingSummaryFooter';
import { useStore } from '@/hooks/useStore';
import { useStaff } from '@/hooks/queries';

interface UnifiedStaffTimePickerProps {
  cartItems: CartItem[];
  assignments: Assignment[];
  onAssignments: (assignments: Assignment[]) => void;
  onBack: () => void;
  onContinue: () => void;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

export const UnifiedStaffTimePicker: React.FC<UnifiedStaffTimePickerProps> = ({
  cartItems,
  assignments,
  onAssignments,
  onBack,
  onContinue,
}) => {
  const { storeId } = useStore();
  const { data: staffData, isLoading: loading } = useStaff(storeId);

  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Refs for auto-scrolling
  const staffSectionRef = useRef<HTMLDivElement>(null);
  const dateSectionRef = useRef<HTMLDivElement>(null);
  const timeSectionRef = useRef<HTMLDivElement>(null);

  // Calculate total duration for all services
  const totalDuration = cartItems.reduce((sum, item) => sum + item.service.duration, 0);

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

  // Reset state when assignments are cleared (e.g., when editing staff)
  useEffect(() => {
    if (assignments.length === 0) {
      setSelectedStaffId('');
      setSelectedDate('');
      setSelectedTime('');
    }
  }, [assignments]);

  // Handle staff selection
  const handleStaffSelect = (staffId: string) => {
    setSelectedStaffId(staffId);
    setSelectedTime(''); // Reset time when changing staff
    
    // Auto-select today's date
    const today = new Date();
    const todayISO = BookingTimeUtils.toISODate(today);
    setSelectedDate(todayISO);
    
    // Immediately create partial assignments with staff info
    const partialAssignments: Assignment[] = cartItems.map(item => ({
      cartItemId: item.id,
      staffId: staffId,
      staffName: staff.find(s => s.id === staffId)?.name || '',
      date: '', // Will be set later
      time: '', // Will be set later
      duration: item.service.duration,
    }));
    
    // Send partial assignments so parent can show staff summary
    onAssignments(partialAssignments);
    
    // Auto-scroll to time section after short delay (since date is pre-selected)
    setTimeout(() => {
      timeSectionRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center'
      });
    }, 600);
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(BookingTimeUtils.toISODate(date));
    setSelectedTime(''); // Reset time when date changes
    
    // Auto-scroll to time section (within same card) after date is selected
    setTimeout(() => {
      timeSectionRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }, 400);
  };

  // Handle time selection
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  // Handle continue button click
  const handleContinueClick = () => {
    if (!selectedStaffId || !selectedDate || !selectedTime) return;

    try {
      // Create assignments for all services sequentially
      const assignments: Assignment[] = [];
      let currentTime = selectedTime;

      cartItems.forEach((item, index) => {
        const selectedStaff = staff.find(s => s.id === selectedStaffId);
        
        assignments.push({
          cartItemId: item.id,
          staffId: selectedStaffId,
          staffName: selectedStaff?.name || 'Any Available',
          date: selectedDate,
          time: currentTime,
          duration: item.service.duration,
        });

        // Calculate next service start time
        if (index < cartItems.length - 1) {
          try {
            // Simple time addition (e.g., "2:00 PM" + 60 mins = "3:00 PM")
            const parts = currentTime.split(' ');
            if (parts.length !== 2) throw new Error('Invalid time format');
            
            const [timeStr, period] = parts;
            const timeParts = timeStr.split(':');
            if (timeParts.length !== 2) throw new Error('Invalid time format');
            
            const hours = parseInt(timeParts[0]);
            const minutes = parseInt(timeParts[1]);
            
            let totalMinutes = (hours % 12) * 60 + minutes + item.service.duration;
            if (period === 'PM' && hours !== 12) totalMinutes += 12 * 60;
            
            const newHours = Math.floor(totalMinutes / 60) % 24;
            const newMinutes = totalMinutes % 60;
            const displayHours = newHours === 0 ? 12 : newHours > 12 ? newHours - 12 : newHours;
            const newPeriod = newHours >= 12 ? 'PM' : 'AM';
            currentTime = `${displayHours}:${newMinutes.toString().padStart(2, '0')} ${newPeriod}`;
          } catch (err) {
            console.error('Error calculating next time:', err);
            // Fallback: use same time
          }
        }
      });

      // Send assignments and continue to phone verification
      onAssignments(assignments);
      onContinue();
    } catch (error) {
      console.error('Error in handleContinueClick:', error);
    }
  };

  // Generate time slots
  const generateTimeSlots = (): TimeSlot[] => {
    if (!selectedStaffId || !selectedDate) {
      return [];
    }

    const slots = BookingTimeUtils.generateTimeSlots('9:00 AM', '7:00 PM', 30);
    
    return slots.map(time => ({
      time,
      available: Math.random() > 0.2, // Mock availability
    }));
  };

  const timeSlots = generateTimeSlots();
  const selectedStaff = staff.find(s => s.id === selectedStaffId);

  // Get dynamic title based on current state
  const getDynamicTitle = () => {
    if (!selectedStaffId) return 'Pick Your Specialist';
    if (!selectedDate) return 'Select a Time';
    if (!selectedTime) return 'Choose Your Slot';
    return 'Almost There!';
  };

  const getDynamicSubtitle = () => {
    if (!selectedStaffId) return 'Choose who you\'d like to book with';
    if (!selectedDate) return 'When would you like to come in?';
    if (!selectedTime) return 'Pick a time that works for you';
    return 'Review your appointment details';
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

  // Create current assignments for summary
  const currentAssignments: Assignment[] = selectedStaffId && selectedDate && selectedTime
    ? cartItems.map(item => ({
        cartItemId: item.id,
        staffId: selectedStaffId,
        staffName: selectedStaff?.name || 'Any Available',
        date: selectedDate,
        time: selectedTime,
        duration: item.service.duration,
      }))
    : [];

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Step 1: Select Staff - Hide after selection */}
        {!selectedStaffId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold bg-primary text-primary-foreground">
                  1
                </div>
                Select Staff Member
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StaffSelector
                staff={staff}
                selectedStaff={selectedStaffId}
                onStaffSelect={handleStaffSelect}
              />
            </CardContent>
          </Card>
        )}

        {/* Step 2: Select Date & Time (Combined) - Show after staff selected */}
        {selectedStaffId && (
          <Card ref={dateSectionRef} className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                  (selectedDate && selectedTime) ? "bg-green-500 text-white" : "bg-primary text-primary-foreground"
                )}>
                  {(selectedDate && selectedTime) ? <CheckCircle className="h-5 w-5" /> : "2"}
                </div>
                Select Date & Time
              </CardTitle>
              {selectedStaff && (
                <p className="text-sm text-muted-foreground">
                  Booking with {selectedStaff.name}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date Selection */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Choose a Date
                </h3>
                <Calendar7Day
                  selectedDate={selectedDate ? new Date(selectedDate) : undefined}
                  onDateSelect={handleDateSelect}
                />
              </div>

              {/* Prompt when no date selected */}
              {!selectedDate && (
                <div className="text-center py-8 px-4 bg-muted/30 rounded-lg border border-dashed">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Select a date above to view available times
                  </p>
                </div>
              )}

              {/* Time Selection - Shows after date is selected */}
              {selectedDate && (
                <div ref={timeSectionRef} className="animate-fade-in">
                  <Separator className="my-4" />
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Choose a Time
                    {selectedDate && (
                      <span className="text-muted-foreground font-normal">
                        on {BookingTimeUtils.formatDate(new Date(selectedDate))}
                      </span>
                    )}
                  </h3>
                  
                  <GroupedTimeSlots
                    timeSlots={timeSlots}
                    selectedTime={selectedTime}
                    onTimeSelect={handleTimeSelect}
                  />
                  
                  {/* Continue Button - Shows after time is selected */}
                  {selectedTime && timeSlots.length > 0 && (
                    <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                      <Button 
                        onClick={handleContinueClick}
                        size="lg"
                        className="w-full h-12 text-base font-semibold"
                      >
                        Continue to Phone Verification
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sticky Summary Footer */}
      <BookingSummaryFooter 
        cartItems={cartItems}
        assignments={currentAssignments}
      />
    </div>
  );
};
