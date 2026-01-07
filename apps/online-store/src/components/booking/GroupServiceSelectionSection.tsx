import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookingFormData } from '@/types/booking';
import { PersonCard } from './PersonCard';
import { ServicePickerModal } from './ServicePickerModal';

interface GroupServiceSelectionSectionProps {
  formData: Partial<BookingFormData>;
  updateFormData: (data: Partial<BookingFormData>) => void;
}

export const GroupServiceSelectionSection = ({ formData, updateFormData }: GroupServiceSelectionSectionProps) => {
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedMemberIndex, setSelectedMemberIndex] = useState<number | null>(null);

  const members = formData.members || [];
  const servicesSelected = members.filter(m => !!m.service).length;
  const allServicesSelected = members.length > 0 && members.every(m => !!m.service);

  const handleSelectServiceForMember = (index: number) => {
    setSelectedMemberIndex(index);
    setShowServiceModal(true);
  };

  const handleServiceSelected = (service: any) => {
    if (selectedMemberIndex !== null && members[selectedMemberIndex]) {
      const updatedMembers = [...members];
      updatedMembers[selectedMemberIndex] = {
        ...updatedMembers[selectedMemberIndex],
        service: service,
      };
      updateFormData({ members: updatedMembers });
    }
    setShowServiceModal(false);
    setSelectedMemberIndex(null);
  };

  const handleMemberUpdate = (index: number, updates: any) => {
    const updatedMembers = [...members];
    updatedMembers[index] = { ...updatedMembers[index], ...updates };
    updateFormData({ members: updatedMembers });
  };

  const handleContinue = () => {
    if (allServicesSelected) {
      updateFormData({ questionsAnswered: true, readyForTechnician: true });
    }
  };

  return (
    <div className="py-12">
      <div className="container max-w-6xl mx-auto px-4">
        <Card className="p-8 shadow-lg">
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2 text-foreground">
                Select Services for Each Person
              </h2>
              <p className="text-muted-foreground">
                Choose a service for each member of your group
              </p>
            </div>

            {/* Progress Indicator */}
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm font-semibold text-primary">
                  {servicesSelected} of {members.length} services selected
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(servicesSelected / members.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Person Cards */}
            <div className="space-y-4">
              {members.map((member, index) => (
                <PersonCard
                  key={member.id}
                  member={member}
                  index={index}
                  onUpdate={(updates) => handleMemberUpdate(index, updates)}
                  onSelectService={() => handleSelectServiceForMember(index)}
                />
              ))}
            </div>

            {/* Validation Message */}
            {!allServicesSelected && servicesSelected > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Please select a service for all {members.length} members before continuing
                </p>
              </div>
            )}

            {/* Continue Button */}
            <div className="pt-4">
              <Button 
                size="lg"
                className="w-full h-12 text-base font-semibold"
                onClick={handleContinue}
                disabled={!allServicesSelected}
              >
                Continue to Questions
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Service Picker Modal */}
      <ServicePickerModal
        open={showServiceModal}
        onOpenChange={(open) => {
          setShowServiceModal(open);
          if (!open) setSelectedMemberIndex(null);
        }}
        onSelectService={handleServiceSelected}
      />
    </div>
  );
};
