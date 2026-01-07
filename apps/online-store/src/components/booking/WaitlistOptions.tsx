import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sun, Sunset, Moon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WaitlistOptionsProps {
  onSelectPreference: (preference: 'any' | 'morning' | 'afternoon' | 'evening' | 'custom') => void;
  onSwitchToAvailable: () => void;
}

export const WaitlistOptions = ({ 
  onSelectPreference, 
  onSwitchToAvailable 
}: WaitlistOptionsProps) => {
  const options = [
    {
      id: 'any' as const,
      icon: Clock,
      label: 'Any',
      time: 'All day',
    },
    {
      id: 'morning' as const,
      icon: Sun,
      label: 'Morning',
      time: '9:00 AM - 12:00 PM',
    },
    {
      id: 'afternoon' as const,
      icon: Sunset,
      label: 'Afternoon',
      time: '12:00 PM - 5:00 PM',
    },
    {
      id: 'evening' as const,
      icon: Moon,
      label: 'Evening',
      time: '5:00 PM - 8:00 PM',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Join Waitlist</h3>
        <p className="text-sm text-muted-foreground">
          Select your preferred time range and we'll notify you when slots become available
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => (
          <Card
            key={option.id}
            className={cn(
              'p-4 cursor-pointer hover:border-primary transition-colors',
              'flex flex-col items-center text-center gap-2'
            )}
            onClick={() => onSelectPreference(option.id)}
          >
            <option.icon className="w-6 h-6 text-primary" />
            <div>
              <div className="font-semibold">{option.label}</div>
              <div className="text-xs text-muted-foreground">{option.time}</div>
            </div>
          </Card>
        ))}
      </div>

      <Button 
        variant="outline" 
        className="w-full mt-4"
        onClick={onSwitchToAvailable}
      >
        Switch to Available Slots
      </Button>
    </div>
  );
};
