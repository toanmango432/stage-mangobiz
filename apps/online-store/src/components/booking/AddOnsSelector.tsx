import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { BookingFormData, AddOn } from '@/types/booking';
import { cn } from '@/lib/utils';
import { Plus, Sparkles, Clock } from 'lucide-react';

interface AddOnsSelectorProps {
  formData: Partial<BookingFormData>;
  updateFormData: (data: Partial<BookingFormData>) => void;
  onNext: () => void;
}

// Mock add-ons data
const mockAddOns: AddOn[] = [
  {
    id: 'addon-1',
    name: 'Gel Removal',
    description: 'Professional removal of existing gel polish',
    duration: 15,
    price: 15,
    icon: 'sparkles',
  },
  {
    id: 'addon-2',
    name: 'Nail Art Design',
    description: 'Custom nail art on selected nails',
    duration: 15,
    price: 20,
    icon: 'sparkles',
  },
  {
    id: 'addon-3',
    name: 'Extended Massage',
    description: 'Add 10 minutes of relaxing hand massage',
    duration: 10,
    price: 10,
    icon: 'sparkles',
  },
  {
    id: 'addon-4',
    name: 'Cuticle Treatment',
    description: 'Intensive cuticle care and conditioning',
    duration: 10,
    price: 12,
    icon: 'sparkles',
  },
  {
    id: 'addon-5',
    name: 'Paraffin Wax Treatment',
    description: 'Moisturizing paraffin wax therapy',
    duration: 20,
    price: 18,
    icon: 'sparkles',
  },
];

export const AddOnsSelector = ({ formData, updateFormData, onNext }: AddOnsSelectorProps) => {
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>(formData.addOns || []);

  const handleToggleAddOn = (addOn: AddOn) => {
    const isSelected = selectedAddOns.some(a => a.id === addOn.id);
    const newAddOns = isSelected
      ? selectedAddOns.filter(a => a.id !== addOn.id)
      : [...selectedAddOns, addOn];
    
    setSelectedAddOns(newAddOns);
    updateFormData({ addOns: newAddOns });
  };

  const totalAdditionalCost = selectedAddOns.reduce((sum, addon) => sum + addon.price, 0);
  const totalAdditionalTime = selectedAddOns.reduce((sum, addon) => sum + addon.duration, 0);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Enhance Your Experience</h3>
        <p className="text-sm text-muted-foreground">
          Add extra services to make your appointment even more special
        </p>
      </div>

      <div className="space-y-3">
        {mockAddOns.map((addOn) => {
          const isSelected = selectedAddOns.some(a => a.id === addOn.id);
          
          return (
            <Card
              key={addOn.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-card',
                isSelected && 'ring-2 ring-primary bg-primary/5'
              )}
              onClick={() => handleToggleAddOn(addOn)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggleAddOn(addOn)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          {addOn.name}
                          <Plus className="h-4 w-4 text-primary" />
                        </h4>
                        <p className="text-sm text-muted-foreground">{addOn.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="font-semibold text-primary">+${addOn.price}</span>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        +{addOn.duration} min
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedAddOns.length > 0 && (
        <Card className="bg-gradient-card border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Additional Services</p>
                <p className="font-semibold">
                  {selectedAddOns.length} add-on{selectedAddOns.length !== 1 ? 's' : ''} selected
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Extra Time & Cost</p>
                <p className="font-semibold text-primary">
                  +${totalAdditionalCost} (+{totalAdditionalTime} min)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center pt-4 border-t">
        <Button variant="ghost" onClick={onNext}>
          Skip Add-ons
        </Button>
        <Button onClick={onNext} size="lg">
          Continue
        </Button>
      </div>
    </div>
  );
};
