import { User } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import { BookingFormData } from '@/types/booking';
import { GroupStaffAssignment } from './GroupStaffAssignment';
import { useAvailability } from '@/hooks/useAvailability';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

interface SpecialistSectionProps {
  formData: Partial<BookingFormData>;
  updateFormData: (data: Partial<BookingFormData>) => void;
}

export const SpecialistSection = ({ formData, updateFormData }: SpecialistSectionProps) => {
  const { getAvailableStaff } = useAvailability();
  const staff = getAvailableStaff();
  
  const selectedStaffId = formData.staff?.id || 'any';
  const completedLabel = formData.staff?.name || 'Any Available';

  if (formData.isGroup) {
    return (
      <CollapsibleSection
        title="Choose Specialists"
        step="3"
        icon={<User className="h-5 w-5" />}
        defaultExpanded={false}
        isComplete={true}
        completedLabel="Auto-assigned"
      >
        <GroupStaffAssignment
          formData={formData}
          updateFormData={updateFormData}
        />
      </CollapsibleSection>
    );
  }

  return (
    <CollapsibleSection
      title="Choose Specialist"
      step="3"
      icon={<User className="h-5 w-5" />}
      defaultExpanded={false}
      isComplete={true}
      completedLabel={completedLabel}
    >
      <div className="space-y-4">
        <RadioGroup
          value={selectedStaffId}
          onValueChange={(value) => {
            if (value === 'any') {
              updateFormData({ staff: undefined });
            } else {
              const selectedStaff = staff.find(s => s.id === value);
              if (selectedStaff) {
                updateFormData({ staff: selectedStaff });
              }
            }
          }}
        >
          <Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-3">
              <RadioGroupItem value="any" id="any" />
              <Label htmlFor="any" className="flex-1 cursor-pointer">
                <div className="font-semibold">Any Available</div>
                <div className="text-sm text-muted-foreground">
                  Get the first available specialist (Recommended)
                </div>
              </Label>
              <Badge variant="secondary">Fastest</Badge>
            </div>
          </Card>

          <div className="grid sm:grid-cols-2 gap-3">
            {staff.slice(0, 4).map((member) => (
              <Card
                key={member.id}
                className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <RadioGroupItem value={member.id} id={member.id} className="mt-1" />
                  <Label htmlFor={member.id} className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{member.name}</div>
                        <div className="text-xs text-muted-foreground">{member.title}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1 text-yellow-600">
                        <Star className="h-3 w-3 fill-current" />
                        <span>{member.rating}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Available
                      </Badge>
                    </div>
                  </Label>
                </div>
              </Card>
            ))}
          </div>
        </RadioGroup>
      </div>
    </CollapsibleSection>
  );
};
