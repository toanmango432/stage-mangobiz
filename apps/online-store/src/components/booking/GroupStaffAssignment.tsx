import { BookingFormData } from '@/types/booking';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface GroupStaffAssignmentProps {
  formData: Partial<BookingFormData>;
  updateFormData: (data: Partial<BookingFormData>) => void;
}

export const GroupStaffAssignment = ({
  formData,
  updateFormData,
}: GroupStaffAssignmentProps) => {
  const schedulingPreference = formData.schedulingPreference || 'same-time';
  const groupSize = formData.groupSize || 2;

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {schedulingPreference === 'same-time' ? (
            <>
              We'll automatically assign {groupSize} specialists to service your group at the same time.
              All specialists are highly trained and available at your selected time slot.
            </>
          ) : schedulingPreference === 'back-to-back' ? (
            <>
              We'll schedule your group appointments one after another with the same specialist 
              or multiple specialists based on availability.
            </>
          ) : (
            <>
              We'll find the best available times and specialists for your group based on 
              your selected date preferences.
            </>
          )}
        </AlertDescription>
      </Alert>

      <div className="text-sm text-muted-foreground">
        <p className="mb-2">
          <strong>Auto-assignment benefits:</strong>
        </p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Faster booking process</li>
          <li>Best availability options</li>
          <li>All specialists are equally qualified</li>
          <li>Flexible scheduling</li>
        </ul>
      </div>
    </div>
  );
};
