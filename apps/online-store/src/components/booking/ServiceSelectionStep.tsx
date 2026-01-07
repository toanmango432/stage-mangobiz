import { BookingFormData, AddOn } from '@/types/booking';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Users, Clock, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { ServicePickerModal } from './ServicePickerModal';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';

interface ServiceSelectionStepProps {
  formData: Partial<BookingFormData>;
  updateFormData: (data: Partial<BookingFormData>) => void;
  onContinue: () => void;
}

const mockAddOns: AddOn[] = [
  { id: 'addon-1', name: 'Hot Stone Massage', description: 'Relaxing heated stones', duration: 15, price: 20 },
  { id: 'addon-2', name: 'Paraffin Treatment', description: 'Moisturizing wax treatment', duration: 10, price: 15 },
  { id: 'addon-3', name: 'Callus Removal', description: 'Extra smoothing treatment', duration: 10, price: 12 },
  { id: 'addon-4', name: 'French Tips', description: 'Classic french manicure', duration: 5, price: 10 },
];

export const ServiceSelectionStep = ({ formData, updateFormData, onContinue }: ServiceSelectionStepProps) => {
  const [showServicePicker, setShowServicePicker] = useState(false);

  const handleRemoveService = () => {
    updateFormData({ service: undefined });
  };

  const handleToggleAddOn = (addon: AddOn) => {
    const currentAddOns = formData.addOns || [];
    const exists = currentAddOns.find(a => a.id === addon.id);
    
    if (exists) {
      updateFormData({ addOns: currentAddOns.filter(a => a.id !== addon.id) });
    } else {
      updateFormData({ addOns: [...currentAddOns, addon] });
    }
  };

  const handleGroupChange = (value: string) => {
    if (value === 'single') {
      updateFormData({ isGroup: false, groupSize: undefined, schedulingPreference: undefined });
    } else {
      updateFormData({ isGroup: true, groupSize: 2 });
    }
  };

  const calculateTotals = () => {
    const servicePrice = formData.service?.price || 0;
    const serviceDuration = formData.service?.duration || 0;
    const addOnsPrice = (formData.addOns || []).reduce((sum, addon) => sum + addon.price, 0);
    const addOnsDuration = (formData.addOns || []).reduce((sum, addon) => sum + addon.duration, 0);
    
    const multiplier = formData.isGroup && formData.groupSize ? formData.groupSize : 1;
    
    return {
      totalPrice: (servicePrice + addOnsPrice) * multiplier,
      totalDuration: serviceDuration + addOnsDuration,
      perPersonPrice: servicePrice + addOnsPrice,
    };
  };

  const { totalPrice, totalDuration, perPersonPrice } = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Selected Service */}
      {formData.service && (
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">{formData.service.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{formData.service.description}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formData.service.duration} min
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  ${formData.service.price}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveService}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Add More Services */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Enhance Your Experience</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {mockAddOns.map((addon) => {
            const isSelected = formData.addOns?.some(a => a.id === addon.id);
            return (
              <Card
                key={addon.id}
                className={`p-4 cursor-pointer transition-all hover:border-primary ${
                  isSelected ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => handleToggleAddOn(addon)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{addon.name}</h4>
                    <p className="text-xs text-muted-foreground">{addon.description}</p>
                  </div>
                  {isSelected && (
                    <Badge variant="default" className="ml-2">Added</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>+{addon.duration} min</span>
                  <span className="font-medium">+${addon.price}</span>
                </div>
              </Card>
            );
          })}
        </div>
        <Button
          variant="outline"
          onClick={() => setShowServicePicker(true)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Browse All Services
        </Button>
      </div>

      {/* Group Booking */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Who's Booking?</h3>
        <RadioGroup
          value={formData.isGroup ? 'group' : 'single'}
          onValueChange={handleGroupChange}
          className="space-y-3"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="single" id="single" />
            <Label htmlFor="single" className="cursor-pointer">Just me</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="group" id="group" />
            <Label htmlFor="group" className="cursor-pointer flex items-center gap-2">
              <Users className="h-4 w-4" />
              Multiple people
            </Label>
          </div>
        </RadioGroup>

        {formData.isGroup && (
          <div className="mt-4 pl-6 space-y-3">
            <div>
              <Label htmlFor="groupSize" className="text-sm">How many people?</Label>
              <Input
                id="groupSize"
                type="number"
                min="2"
                max="10"
                value={formData.groupSize || 2}
                onChange={(e) => updateFormData({ groupSize: parseInt(e.target.value) })}
                className="mt-1"
              />
            </div>
          </div>
        )}
      </Card>

      {/* Summary & Continue */}
      <Card className="p-6 bg-muted/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-muted-foreground">Total Duration</div>
            <div className="text-xl font-semibold">{totalDuration} minutes</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Total Price</div>
            <div className="text-xl font-semibold">${totalPrice.toFixed(2)}</div>
            {formData.isGroup && formData.groupSize && formData.groupSize > 1 && (
              <div className="text-xs text-muted-foreground mt-1">
                ${perPersonPrice.toFixed(2)} per person × {formData.groupSize}
              </div>
            )}
          </div>
        </div>
        <Button
          size="lg"
          className="w-full"
          onClick={onContinue}
          disabled={!formData.service}
        >
          Continue to Date & Time →
        </Button>
      </Card>

      <ServicePickerModal
        open={showServicePicker}
        onOpenChange={setShowServicePicker}
        onSelectService={(service) => {
          // Could be used to add additional services
          setShowServicePicker(false);
        }}
      />
    </div>
  );
};
