import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  Users, 
  Calendar, 
  Star, 
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CartItem, Assignment, Staff, TimeSlot } from './types';
import { DateTimePicker } from './DateTimePicker';
import { useStore } from '@/hooks/useStore';
import { useStaff } from '@/hooks/queries';
import { StaffSelector } from './StaffSelector';
import { StickyActionBar } from './StickyActionBar';

interface StaffTimePickerProps {
  cartItems: CartItem[];
  onAssignments: (assignments: Assignment[]) => void;
  onBack: () => void;
  onContinue: () => void;
}

type BookingMode = 'together' | 'stagger' | 'custom';

export const StaffTimePicker: React.FC<StaffTimePickerProps> = ({
  cartItems,
  onAssignments,
  onBack,
  onContinue,
}) => {
  const { storeId } = useStore();
  const { data: staffData, isLoading: loading } = useStaff(storeId);

  const [selectedMode, setSelectedMode] = useState<BookingMode>('together');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const isGroupBooking = cartItems.length > 1;

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

  // Generate time slots for the selected date
  const generateTimeSlots = (date: Date): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 9;
    const endHour = 18;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        // More realistic availability - less likely during lunch and end of day
        const hourNum = parseInt(time.split(':')[0]);
        let availability = Math.random() > 0.2;
        
        // Lunch time (12-2) less available
        if (hourNum >= 12 && hourNum < 14) {
          availability = Math.random() > 0.5;
        }
        // End of day less available
        if (hourNum >= 16) {
          availability = Math.random() > 0.4;
        }
        
        slots.push({
          time,
          available: availability,
          staffId: availability ? staff[Math.floor(Math.random() * staff.length)]?.id : undefined,
        });
      }
    }
    return slots;
  };

  // Group time slots by time of day
  const groupTimeSlots = (slots: TimeSlot[]) => {
    return {
      morning: slots.filter(slot => {
        const hour = parseInt(slot.time.split(':')[0]);
        return hour >= 9 && hour < 12;
      }),
      afternoon: slots.filter(slot => {
        const hour = parseInt(slot.time.split(':')[0]);
        return hour >= 12 && hour < 17;
      }),
      evening: slots.filter(slot => {
        const hour = parseInt(slot.time.split(':')[0]);
        return hour >= 17 && hour < 18;
      }),
    };
  };

  const timeSlots = generateTimeSlots(selectedDate);
  const groupedSlots = groupTimeSlots(timeSlots);


  const handleAssignment = (cartItemId: string, staffId: string, time: string) => {
    const cartItem = cartItems.find(item => item.id === cartItemId);
    if (!cartItem) return;

    const newAssignment: Assignment = {
      cartItemId,
      staffId,
      date: selectedDate.toISOString().split('T')[0],
      time,
      duration: cartItem.service.duration,
    };

    setAssignments(prev => {
      const filtered = prev.filter(a => a.cartItemId !== cartItemId);
      return [...filtered, newAssignment];
    });
  };

  const handleContinue = () => {
    onAssignments(assignments);
    onContinue();
  };

  const isAssignmentComplete = assignments.length === cartItems.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Finding available times...</p>
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
              <h1 className="text-2xl font-bold">Choose Staff & Time</h1>
              <p className="text-muted-foreground">
                {isGroupBooking ? 'Coordinate your group booking' : 'Select your preferred time'}
              </p>
            </div>
            <Button onClick={onBack} variant="outline" size="sm">
              Edit Services
            </Button>
          </div>
        </div>
      </div>

          <div className="max-w-4xl mx-auto px-4 py-6">
            {/* Date Selection */}
            <div className="mb-8">
              <DateTimePicker
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
              />
            </div>

            {/* Booking Mode Selection (for groups) */}
            {isGroupBooking && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                How would you like to book?
              </h2>
              
              <RadioGroup value={selectedMode} onValueChange={(value) => setSelectedMode(value as BookingMode)}>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="together" id="together" className="mt-1" />
                    <Label htmlFor="together" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Book Together</div>
                          <div className="text-sm text-muted-foreground">
                            Same time, adjacent chairs - perfect for groups
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          <Zap className="h-3 w-3 mr-1" />
                          Recommended
                        </Badge>
                      </div>
                    </Label>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="stagger" id="stagger" className="mt-1" />
                    <Label htmlFor="stagger" className="flex-1 cursor-pointer">
                      <div>
                        <div className="font-medium">Staggered Times</div>
                        <div className="text-sm text-muted-foreground">
                          Offset appointments by service duration
                        </div>
                      </div>
                    </Label>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="custom" id="custom" className="mt-1" />
                    <Label htmlFor="custom" className="flex-1 cursor-pointer">
                      <div>
                        <div className="font-medium">Custom Times</div>
                        <div className="text-sm text-muted-foreground">
                          Choose individual times for each service
                        </div>
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        )}


        {/* Individual Service Assignments */}
        <div className="space-y-6">
          {cartItems.map((item, index) => {
            const currentAssignment = assignments.find(a => a.cartItemId === item.id);
            
            return (
              <ServiceAssignmentCard
                key={item.id}
                item={item}
                index={index}
                staff={staff}
                timeSlots={timeSlots}
                currentAssignment={currentAssignment}
                onAssignment={(staffId, time) => handleAssignment(item.id, staffId, time)}
                isGroupBooking={isGroupBooking}
                selectedMode={selectedMode}
              />
            );
          })}
        </div>

      {/* Sticky Action Bar */}
      <StickyActionBar
        onAction={handleContinue}
        actionText={isAssignmentComplete ? "Continue to Confirmation" : "Complete all assignments to continue"}
        disabled={!isAssignmentComplete}
      />
      </div>
    </div>
  );
};

// Service Assignment Card Component
const ServiceAssignmentCard: React.FC<{
  item: CartItem;
  index: number;
  staff: Staff[];
  timeSlots: TimeSlot[];
  currentAssignment?: Assignment;
  onAssignment: (staffId: string, time: string) => void;
  isGroupBooking: boolean;
  selectedMode: BookingMode;
}> = ({
  item,
  index,
  staff,
  timeSlots,
  currentAssignment,
  onAssignment,
  isGroupBooking,
  selectedMode,
}) => {
  // Group time slots by time of day
  const groupedSlots = {
    morning: timeSlots.filter(slot => {
      const hour = parseInt(slot.time.split(':')[0]);
      return hour >= 9 && hour < 12;
    }),
    afternoon: timeSlots.filter(slot => {
      const hour = parseInt(slot.time.split(':')[0]);
      return hour >= 12 && hour < 17;
    }),
    evening: timeSlots.filter(slot => {
      const hour = parseInt(slot.time.split(':')[0]);
      return hour >= 17 && hour < 18;
    }),
  };
  const [selectedStaff, setSelectedStaff] = useState<string>(currentAssignment?.staffId || '');
  const [selectedTime, setSelectedTime] = useState<string>(currentAssignment?.time || '');

  const handleStaffSelect = (staffId: string) => {
    setSelectedStaff(staffId);
    if (selectedTime) {
      onAssignment(staffId, selectedTime);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    if (selectedStaff) {
      onAssignment(selectedStaff, time);
    }
  };

  return (
    <Card className={cn(
      "transition-all duration-200",
      currentAssignment ? "border-green-200 bg-green-50/30" : "border-border"
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Service {index + 1}
              </span>
              {currentAssignment && (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
            </div>
            <h3 className="font-semibold text-lg">{item.service.name}</h3>
            <p className="text-sm text-muted-foreground">for {item.assignedTo}</p>
          </div>
          
          <div className="text-right">
            <div className="font-semibold text-primary">${item.service.price}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {item.service.duration} min
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Staff Selection */}
          <div>
            <StaffSelector
              staff={staff}
              selectedStaff={selectedStaff}
              onStaffSelect={handleStaffSelect}
              serviceCategory={item.service.category}
              isMultipleServices={false}
            />
          </div>

          {/* Time Selection */}
          <div>
            <h4 className="font-medium mb-3">Choose Time</h4>
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {/* Morning Slots */}
              {groupedSlots.morning.filter(slot => slot.available).length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-muted-foreground mb-2">Morning (9 AM - 12 PM)</h5>
                  <div className="grid grid-cols-3 gap-2">
                    {groupedSlots.morning.filter(slot => slot.available).slice(0, 6).map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => handleTimeSelect(slot.time)}
                        className={cn(
                          "p-2 text-sm rounded-lg border transition-all duration-200",
                          selectedTime === slot.time
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:border-primary/50 hover:bg-primary/5"
                        )}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Afternoon Slots */}
              {groupedSlots.afternoon.filter(slot => slot.available).length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-muted-foreground mb-2">Afternoon (12 PM - 5 PM)</h5>
                  <div className="grid grid-cols-3 gap-2">
                    {groupedSlots.afternoon.filter(slot => slot.available).slice(0, 6).map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => handleTimeSelect(slot.time)}
                        className={cn(
                          "p-2 text-sm rounded-lg border transition-all duration-200",
                          selectedTime === slot.time
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:border-primary/50 hover:bg-primary/5"
                        )}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Evening Slots */}
              {groupedSlots.evening.filter(slot => slot.available).length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-muted-foreground mb-2">Evening (5 PM - 6 PM)</h5>
                  <div className="grid grid-cols-3 gap-2">
                    {groupedSlots.evening.filter(slot => slot.available).slice(0, 6).map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => handleTimeSelect(slot.time)}
                        className={cn(
                          "p-2 text-sm rounded-lg border transition-all duration-200",
                          selectedTime === slot.time
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:border-primary/50 hover:bg-primary/5"
                        )}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
