import { Calendar as CalendarIcon } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import { BookingFormData } from '@/types/booking';
import { AvailabilityCalendar } from './AvailabilityCalendar';
import { TimeSlotGrid } from './TimeSlotGrid';
import { format } from 'date-fns';

interface DateTimeSectionProps {
  formData: Partial<BookingFormData>;
  updateFormData: (data: Partial<BookingFormData>) => void;
}

export const DateTimeSection = ({ formData, updateFormData }: DateTimeSectionProps) => {
  const isComplete = !!(formData.date && formData.time);
  const completedLabel = isComplete
    ? `${format(new Date(formData.date!), 'EEE, MMM d')} at ${formData.time}`
    : undefined;

  return (
    <CollapsibleSection
      title="Select Date & Time"
      step="1"
      icon={<CalendarIcon className="h-5 w-5" />}
      defaultExpanded={!isComplete}
      isComplete={isComplete}
      completedLabel={completedLabel}
    >
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium mb-3">Choose a Date</h3>
            <AvailabilityCalendar
              selectedDate={formData.date ? new Date(formData.date) : undefined}
              onDateSelect={(date) => updateFormData({ date: format(date, 'yyyy-MM-dd') })}
              isGroup={formData.isGroup}
              groupSize={formData.groupSize}
            />
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-3">Available Times</h3>
            {formData.date ? (
              <TimeSlotGrid
                date={formData.date}
                selectedTime={formData.time}
                onTimeSelect={(time) => updateFormData({ time })}
                serviceDuration={formData.service?.duration || 30}
                isGroup={formData.isGroup}
                groupSize={formData.groupSize}
                schedulingPreference={formData.schedulingPreference}
              />
            ) : (
              <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
                Select a date to view available times
              </div>
            )}
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
};
