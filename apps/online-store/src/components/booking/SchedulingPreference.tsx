import { Clock, Calendar, Sparkles } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { SchedulingPreference } from '@/types/booking';

interface SchedulingPreferenceSelectorProps {
  preference: SchedulingPreference;
  onChange: (preference: SchedulingPreference) => void;
}

export const SchedulingPreferenceSelector = ({
  preference,
  onChange,
}: SchedulingPreferenceSelectorProps) => {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Scheduling Preference</Label>
      
      <RadioGroup value={preference} onValueChange={(v) => onChange(v as SchedulingPreference)}>
        <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
          <RadioGroupItem value="same-time" id="same-time" className="mt-1" />
          <Label htmlFor="same-time" className="flex-1 cursor-pointer">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <Clock className="h-4 w-4" />
              Same Time
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Everyone gets serviced at the same time (requires multiple specialists)
            </div>
          </Label>
        </div>

        <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
          <RadioGroupItem value="back-to-back" id="back-to-back" className="mt-1" />
          <Label htmlFor="back-to-back" className="flex-1 cursor-pointer">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <Calendar className="h-4 w-4" />
              Back-to-Back
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Appointments scheduled one after another
            </div>
          </Label>
        </div>

        <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
          <RadioGroupItem value="flexible" id="flexible" className="mt-1" />
          <Label htmlFor="flexible" className="flex-1 cursor-pointer">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <Sparkles className="h-4 w-4" />
              Flexible
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Let us find the best available times for your group
            </div>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};
