import { BookingFormData, Staff } from '@/types/booking';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, UserCircle } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

interface SpecialistStepProps {
  formData: Partial<BookingFormData>;
  updateFormData: (data: Partial<BookingFormData>) => void;
  onContinue: () => void;
}

// Mock staff data - in real app, this would be filtered by availability
const mockStaff: Staff[] = [
  {
    id: 'staff-1',
    name: 'Sarah Johnson',
    title: 'Senior Nail Technician',
    photo: undefined,
    rating: 4.9,
    specialties: ['Gel Extensions', 'Nail Art', 'Luxury Manicures'],
    workingHours: {},
    daysOff: [],
  },
  {
    id: 'staff-2',
    name: 'Emily Chen',
    title: 'Lead Nail Artist',
    photo: undefined,
    rating: 4.8,
    specialties: ['Acrylic Nails', 'Nail Art', 'Classic Manicures'],
    workingHours: {},
    daysOff: [],
  },
  {
    id: 'staff-3',
    name: 'Jessica Martinez',
    title: 'Nail & Beauty Specialist',
    photo: undefined,
    rating: 5.0,
    specialties: ['Pedicures', 'Gel Polish', 'Waxing'],
    workingHours: {},
    daysOff: [],
  },
];

export const SpecialistStep = ({ formData, updateFormData, onContinue }: SpecialistStepProps) => {
  const [selectedStaffId, setSelectedStaffId] = useState<string | undefined>(
    formData.staff?.id || 'any'
  );

  const handleContinue = () => {
    if (selectedStaffId === 'any') {
      updateFormData({ staff: undefined });
    } else {
      const staff = mockStaff.find(s => s.id === selectedStaffId);
      if (staff) {
        updateFormData({ staff });
      }
    }
    onContinue();
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Choose Your Specialist</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Select a specific specialist or let us assign the best available expert for you.
        </p>

        <RadioGroup value={selectedStaffId} onValueChange={setSelectedStaffId}>
          {/* Any Available Option */}
          <Card className="p-4 mb-3 cursor-pointer hover:border-primary transition-colors">
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="any" id="any" />
              <Label htmlFor="any" className="flex-1 cursor-pointer flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <UserCircle className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Any Available Specialist</div>
                  <div className="text-sm text-muted-foreground">
                    We'll assign the best expert for you
                  </div>
                </div>
                <Badge variant="secondary">Recommended</Badge>
              </Label>
            </div>
          </Card>

          {/* Staff List */}
          {mockStaff.map((staff) => (
            <Card
              key={staff.id}
              className="p-4 mb-3 cursor-pointer hover:border-primary transition-colors"
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value={staff.id} id={staff.id} />
                <Label htmlFor={staff.id} className="flex-1 cursor-pointer flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={staff.photo} />
                    <AvatarFallback>{staff.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{staff.name}</div>
                    <div className="text-sm text-muted-foreground">{staff.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {staff.rating}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {staff.specialties.slice(0, 2).join(', ')}
                      </div>
                    </div>
                  </div>
                </Label>
              </div>
            </Card>
          ))}
        </RadioGroup>
      </Card>

      <div className="flex gap-3">
        <Button
          variant="outline"
          size="lg"
          className="flex-1"
          onClick={onContinue}
        >
          Skip This Step
        </Button>
        <Button
          size="lg"
          className="flex-1"
          onClick={handleContinue}
        >
          Continue →
        </Button>
      </div>
    </div>
  );
};
