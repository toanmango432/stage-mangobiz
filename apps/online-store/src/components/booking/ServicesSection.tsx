import { Plus } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import { BookingFormData } from '@/types/booking';
import { ServiceSuggestions } from './ServiceSuggestions';

interface ServicesSectionProps {
  formData: Partial<BookingFormData>;
  updateFormData: (data: Partial<BookingFormData>) => void;
}

export const ServicesSection = ({ formData, updateFormData }: ServicesSectionProps) => {
  const hasAddOns = formData.addOns && formData.addOns.length > 0;
  const completedLabel = hasAddOns
    ? `${formData.addOns!.length} add-on${formData.addOns!.length > 1 ? 's' : ''}`
    : 'None selected';

  return (
    <CollapsibleSection
      title="Add More Services"
      step="2"
      icon={<Plus className="h-5 w-5" />}
      defaultExpanded={false}
      isComplete={true}
      completedLabel={completedLabel}
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Save time by booking multiple services in one appointment
        </p>
        
        <ServiceSuggestions
          currentService={formData.service}
          selectedAddOns={formData.addOns || []}
          onAddOnToggle={(addOn) => {
            const current = formData.addOns || [];
            const exists = current.find(a => a.id === addOn.id);
            
            if (exists) {
              updateFormData({
                addOns: current.filter(a => a.id !== addOn.id),
              });
            } else {
              updateFormData({
                addOns: [...current, addOn],
              });
            }
          }}
          isGroup={formData.isGroup}
        />
      </div>
    </CollapsibleSection>
  );
};
