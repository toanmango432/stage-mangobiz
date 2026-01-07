// Enhanced Staff Time Picker - Combines Mango + POS best features
// Features: 7-day calendar + Grouped time slots + All Mango features

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, Users, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar7Day } from './Calendar7Day';
import { GroupedTimeSlots } from './GroupedTimeSlots';
import { BookingTimeUtils } from './timeUtils';
import { CartItem, Assignment, Staff } from '../v2/types';
import { StaffSelector } from '../v2/StaffSelector';
import { StickyActionBar } from '../v2/StickyActionBar';

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
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Calculate total duration
  const totalDuration = cartItems.reduce((sum, item) => sum + (item.service.duration || 60), 0);

  // Load staff on mount
  useEffect(() => {
    // TODO: Replace with actual API call
    setTimeout(() => {
      // Mock staff data
      const mockStaff: Staff[] = [
        {
          id: '1',
          name: 'Sarah Johnson',
          avatar: '',
          specialties: ['Hair', 'Color'],
          rating: 4.9,
          availability: 'available',
        },
        {
          id: '2',
          name: 'Mike Chen',
          avatar: '',
          specialties: ['Nails', 'Spa'],
          rating: 4.8,
          availability: 'available',
        },
      ];
      setStaff(mockStaff);
      setLoading(false);
    }, 500);
  }, []);

  // Load time slots when date changes
  useEffect(() => {
    if (!selectedDate) return;

    setLoadingSlots(true);
    
    // TODO: Replace with actual API call
    setTimeout(() => {
      const slots = generateTimeSlots(selectedDate);
      setTimeSlots(slots);
      setLoadingSlots(false);
    }, 300);
  }, [selectedDate]);

  // Generate time slots (mock - replace with API)
  const generateTimeSlots = (date: Date): TimeSlot[] => {
    const slots = BookingTimeUtils.generateTimeSlots('9:00 AM', '7:00 PM', 30);
    
    return slots.map(time => ({
      time,
      available: Math.random() > 0.3, // Mock availability
      staffCount: Math.floor(Math.random() * 3) + 1, // Mock staff count
    }));
  };

  // Handle staff selection
  const handleStaffSelect = (staffId: string) => {
    // Update assignments
    const newAssignments = cartItems.map(item => ({
      serviceId: item.service.id,
      staffId,
      date: selectedDate!,
      time: selectedTime!,
    }));
    setAssignments(newAssignments);
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null); // Reset time when date changes
  };

  // Handle time selection
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  // Check if can continue
  const canContinue = selectedDate && selectedTime && assignments.length > 0;

  // Handle continue
  const handleContinue = () => {
    if (canContinue) {
      onAssignments(assignments);
      onContinue();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Select Date & Time</h2>
        <p className="text-muted-foreground">
          Choose when you'd like your appointment
        </p>
      </div>

      {/* Services Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Your Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {cartItems.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span>{item.service.name}</span>
                <Badge variant="secondary">
                  {BookingTimeUtils.formatDuration(item.service.duration || 60)}
                </Badge>
              </div>
            ))}
            <Separator className="my-2" />
            <div className="flex justify-between items-center font-semibold">
              <span>Total Duration</span>
              <span>{BookingTimeUtils.formatDuration(totalDuration)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Date Selection - 7-Day Calendar */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Select Date
          </h3>
          <Calendar7Day
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            offDays={[]} // TODO: Load from API
            staffOffDays={[]} // TODO: Load from API
          />
        </div>

        {/* Time Selection - Grouped Slots */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Select Time
          </h3>
          {!selectedDate ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Please select a date first</p>
              </CardContent>
            </Card>
          ) : (
            <GroupedTimeSlots
              timeSlots={timeSlots}
              selectedTime={selectedTime}
              onTimeSelect={handleTimeSelect}
              loading={loadingSlots}
              showBestTime={true}
            />
          )}
        </div>
      </div>

      {/* Staff Selection */}
      {selectedDate && selectedTime && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select Staff Member
          </h3>
          <StaffSelector
            staff={staff}
            selectedStaffId={assignments[0]?.staffId}
            onStaffSelect={handleStaffSelect}
          />
        </div>
      )}

      {/* Action Bar */}
      <StickyActionBar
        onBack={onBack}
        onContinue={handleContinue}
        canContinue={!!canContinue}
        continueText="Continue to Review"
      />
    </div>
  );
};
