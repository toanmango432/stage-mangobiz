import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Check } from 'lucide-react';
import { AddOn } from '@/types/booking';

interface ServiceSuggestionsProps {
  currentService?: {
    id: string;
    name: string;
  };
  selectedAddOns: AddOn[];
  onAddOnToggle: (addOn: AddOn) => void;
  isGroup?: boolean;
}

// Mock add-ons data
const mockAddOns: AddOn[] = [
  {
    id: 'addon-1',
    name: 'Gel Polish',
    description: 'Long-lasting gel polish application',
    duration: 15,
    price: 20,
    icon: '💅',
  },
  {
    id: 'addon-2',
    name: 'Paraffin Wax Treatment',
    description: 'Moisturizing paraffin wax for hands',
    duration: 10,
    price: 15,
    icon: '✨',
  },
  {
    id: 'addon-3',
    name: 'Nail Art',
    description: 'Custom nail art design',
    duration: 20,
    price: 25,
    icon: '🎨',
  },
  {
    id: 'addon-4',
    name: 'Callus Treatment',
    description: 'Extra callus removal and smoothing',
    duration: 10,
    price: 12,
    icon: '🦶',
  },
];

export const ServiceSuggestions = ({
  currentService,
  selectedAddOns,
  onAddOnToggle,
  isGroup,
}: ServiceSuggestionsProps) => {
  const isSelected = (addOn: AddOn) => selectedAddOns.some(a => a.id === addOn.id);

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-3">Popular Add-ons</h4>
        <div className="grid sm:grid-cols-2 gap-3">
          {mockAddOns.map((addOn) => {
            const selected = isSelected(addOn);
            
            return (
              <Card
                key={addOn.id}
                className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => onAddOnToggle(addOn)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{addOn.icon}</span>
                      <h5 className="font-medium text-sm">{addOn.name}</h5>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {addOn.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        +{addOn.duration} min
                      </Badge>
                      <span>${addOn.price}</span>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant={selected ? 'default' : 'outline'}
                    className="shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddOnToggle(addOn);
                    }}
                  >
                    {selected ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {isGroup && selectedAddOns.length > 0 && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> Add-ons will be applied to all members of your group. 
            You can customize individual services in the group section above.
          </p>
        </div>
      )}
    </div>
  );
};
