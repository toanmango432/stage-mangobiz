import { UserCircle } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import { BookingFormData } from '@/types/booking';
import { GuestVsMember } from './GuestVsMember';
import { useAuth } from '@/contexts/AuthContext';

interface DetailsSectionProps {
  formData: Partial<BookingFormData>;
  updateFormData: (data: Partial<BookingFormData>) => void;
}

export const DetailsSection = ({ formData, updateFormData }: DetailsSectionProps) => {
  const { user } = useAuth();
  const isComplete = !!(formData.client?.name && formData.client?.email && formData.client?.phone);
  const completedLabel = isComplete ? formData.client.name : undefined;

  return (
    <CollapsibleSection
      title="Your Details"
      step="4"
      icon={<UserCircle className="h-5 w-5" />}
      defaultExpanded={!isComplete}
      isComplete={isComplete}
      completedLabel={completedLabel}
    >
      <GuestVsMember
        formData={formData}
        updateFormData={updateFormData}
        user={user}
      />
    </CollapsibleSection>
  );
};
