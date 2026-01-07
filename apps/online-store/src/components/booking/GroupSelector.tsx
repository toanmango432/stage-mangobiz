import { useState } from 'react';
import { BookingFormData, GroupMember } from '@/types/booking';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PersonCard } from './PersonCard';
import { SchedulingPreferenceSelector } from './SchedulingPreference';
import { ServicePickerModal } from './ServicePickerModal';

interface GroupSelectorProps {
  formData: Partial<BookingFormData>;
  updateFormData: (data: Partial<BookingFormData>) => void;
}

export const GroupSelector = ({ formData, updateFormData }: GroupSelectorProps) => {
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [selectedMemberIndex, setSelectedMemberIndex] = useState<number | null>(null);

  const handleBookingTypeChange = (value: string) => {
    const isGroup = value === 'group';
    updateFormData({ 
      isGroup,
      groupChoiceMade: true,
      groupSetupComplete: isGroup ? true : false, // Auto-proceed for both types
      groupSize: isGroup ? 2 : undefined,
      members: isGroup ? generateEmptyMembers(2) : [],
      schedulingPreference: isGroup ? 'back-to-back' : undefined,
    });
  };

  const handleGroupSizeChange = (size: number) => {
    const currentMembers = formData.members || [];
    
    // Add or remove members
    if (size > currentMembers.length) {
      const newMembers = [...currentMembers];
      for (let i = currentMembers.length; i < size; i++) {
        newMembers.push({
          id: `member-${Date.now()}-${i}`,
          addOns: [],
        } as GroupMember);
      }
      updateFormData({ groupSize: size, members: newMembers });
    } else {
      updateFormData({ groupSize: size, members: currentMembers.slice(0, size) });
    }
  };

  const handleSchedulingPreferenceChange = (preference: any) => {
    updateFormData({ schedulingPreference: preference });
  };

  const handleMemberUpdate = (index: number, updates: Partial<GroupMember>) => {
    const updatedMembers = [...(formData.members || [])];
    updatedMembers[index] = { ...updatedMembers[index], ...updates };
    updateFormData({ members: updatedMembers });
  };

  const handleSelectServiceForMember = (index: number) => {
    setSelectedMemberIndex(index);
    setServiceModalOpen(true);
  };

  const handleServiceSelected = (service: any) => {
    if (selectedMemberIndex !== null) {
      handleMemberUpdate(selectedMemberIndex, { service });
    }
  };

  const generateEmptyMembers = (size: number): GroupMember[] => {
    return Array.from({ length: size }, (_, i) => ({
      id: `member-${Date.now()}-${i}`,
      addOns: [],
    } as GroupMember));
  };

  const isGroup = formData.isGroup || false;
  const groupSize = formData.groupSize || 2;
  const members = formData.members || [];
  
  // Track service selection progress for groups
  const servicesSelected = members.filter(m => !!m.service).length;

  return (
    <div className="py-12">
      <div className="container max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6 text-foreground">Who's Booking?</h2>
        <Card className="p-6 shadow-sm">
          <div className="space-y-6">
            <RadioGroup value={isGroup ? 'group' : 'solo'} onValueChange={handleBookingTypeChange}>
              <div className="flex items-start space-x-3 p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-colors cursor-pointer">
                <RadioGroupItem value="solo" id="solo" className="mt-1" />
                <Label htmlFor="solo" className="flex-1 cursor-pointer">
                  <div className="font-semibold text-foreground">Just Me</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Book a single appointment
                  </div>
                </Label>
              </div>

              <div className="flex items-start space-x-3 p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-colors cursor-pointer">
                <RadioGroupItem value="group" id="group" className="mt-1" />
                <Label htmlFor="group" className="flex-1 cursor-pointer">
                  <div className="font-semibold text-foreground">Group Booking</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Book for multiple people at once
                  </div>
                </Label>
              </div>
            </RadioGroup>

            {isGroup && (
              <div className="space-y-6 pt-4 border-t border-border">
                <div>
                  <Label htmlFor="groupSize" className="text-sm font-medium">
                    Number of People
                  </Label>
                  <Select value={groupSize.toString()} onValueChange={(val) => handleGroupSizeChange(parseInt(val))}>
                    <SelectTrigger id="groupSize" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size} people
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <SchedulingPreferenceSelector
                  preference={formData.schedulingPreference || 'back-to-back'}
                  onChange={handleSchedulingPreferenceChange}
                />

                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    People in Your Group
                  </Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Add names now or select services in the next step
                  </p>
                  <div className="space-y-3">
                    {members.map((member, i) => (
                      <PersonCard
                        key={member.id}
                        member={member}
                        index={i}
                        onUpdate={(updates) => handleMemberUpdate(i, updates)}
                        onSelectService={() => handleSelectServiceForMember(i)}
                      />
                    ))}
                  </div>
                  {servicesSelected > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {servicesSelected} of {members.length} services selected
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      <ServicePickerModal
        open={serviceModalOpen}
        onOpenChange={setServiceModalOpen}
        onSelectService={handleServiceSelected}
        currentService={
          selectedMemberIndex !== null && formData.members?.[selectedMemberIndex]?.service
            ? formData.members[selectedMemberIndex].service
            : undefined
        }
      />
    </div>
  );
};
