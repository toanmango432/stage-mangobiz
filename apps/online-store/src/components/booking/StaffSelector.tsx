import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookingFormData } from '@/types/booking';
import { useAvailability } from '@/hooks/useAvailability';
import { cn } from '@/lib/utils';
import { Star, Award, Clock } from 'lucide-react';

interface StaffSelectorProps {
  formData: Partial<BookingFormData>;
  updateFormData: (data: Partial<BookingFormData>) => void;
  onNext: () => void;
}

export const StaffSelector = ({ formData, updateFormData, onNext }: StaffSelectorProps) => {
  const serviceDuration = formData.service?.duration || 60;
  const { getAvailableStaff, getAvailability } = useAvailability(serviceDuration);
  const availableStaff = getAvailableStaff();
  
  const [selectedStaffId, setSelectedStaffId] = useState<string | undefined>(
    formData.staff?.id
  );

  // Get availability for selected date
  const selectedDateAvailability = formData.date 
    ? getAvailability(new Date(formData.date))
    : null;

  // Check staff availability for selected time
  const getStaffAvailability = (staffId: string) => {
    if (!selectedDateAvailability || !formData.time) return 'available';
    
    const timeSlot = selectedDateAvailability.timeSlots.find(
      slot => slot.time === formData.time
    );
    
    if (!timeSlot) return 'unavailable';
    
    const isAvailable = timeSlot.staffAvailable.includes(staffId);
    const availableCount = timeSlot.staffAvailable.length;
    
    if (!isAvailable) return 'fully-booked';
    if (availableCount <= 2) return 'limited';
    return 'available';
  };

  const handleStaffSelect = (staffId: string | undefined) => {
    setSelectedStaffId(staffId);
    const staff = availableStaff.find(s => s.id === staffId);
    updateFormData({ staff });
  };

  const handleContinue = () => {
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Choose Your Specialist</h3>
        <p className="text-sm text-muted-foreground">
          Select a preferred staff member or let us choose the best available for you
        </p>
      </div>

      <Card
        className={cn(
          'cursor-pointer transition-all hover:shadow-card',
          selectedStaffId === undefined && 'ring-2 ring-primary'
        )}
        onClick={() => handleStaffSelect(undefined)}
      >
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-hero flex items-center justify-center">
              <Award className="h-8 w-8 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">No Preference</h4>
              <p className="text-sm text-muted-foreground">
                We'll match you with the best available specialist
              </p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  Recommended
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {availableStaff.map((staff) => {
          const availability = getStaffAvailability(staff.id);
          const isFullyBooked = availability === 'fully-booked';
          
          return (
            <Card
              key={staff.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-card',
                selectedStaffId === staff.id && 'ring-2 ring-primary',
                isFullyBooked && 'opacity-60'
              )}
              onClick={() => !isFullyBooked && handleStaffSelect(staff.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-hero flex items-center justify-center text-primary-foreground font-semibold text-xl">
                    {staff.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{staff.name}</h4>
                          {availability === 'limited' && (
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Limited slots
                            </Badge>
                          )}
                          {isFullyBooked && (
                            <Badge variant="secondary" className="text-xs">
                              Fully booked
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{staff.title}</p>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-primary text-primary" />
                        <span className="font-medium">{staff.rating}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {staff.specialties.map((specialty) => (
                        <span
                          key={specialty}
                          className="text-xs bg-accent/10 text-accent px-2 py-1 rounded"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleContinue} size="lg">
          Continue
        </Button>
      </div>
    </div>
  );
};
