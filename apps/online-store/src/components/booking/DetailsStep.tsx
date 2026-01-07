import { BookingFormData } from '@/types/booking';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GuestVsMember } from './GuestVsMember';
import { useAuth } from '@/contexts/AuthContext';

interface DetailsStepProps {
  formData: Partial<BookingFormData>;
  updateFormData: (data: Partial<BookingFormData>) => void;
  onContinue: () => void;
}

export const DetailsStep = ({ formData, updateFormData, onContinue }: DetailsStepProps) => {
  const { user } = useAuth();

  const canContinue = !!(
    formData.client?.name &&
    formData.client?.email &&
    formData.client?.phone
  );

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Your Contact Information</h3>
        <GuestVsMember
          formData={formData}
          updateFormData={updateFormData}
          user={user}
        />
      </Card>

      <Button
        size="lg"
        className="w-full"
        onClick={onContinue}
        disabled={!canContinue}
      >
        Continue to Review →
      </Button>
    </div>
  );
};
