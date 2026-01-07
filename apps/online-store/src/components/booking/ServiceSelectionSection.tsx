import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Plus, X, Loader2, AlertCircle } from 'lucide-react';
import { BookingFormData } from '@/types/booking';
import { useState } from 'react';
import { ServicePickerModal } from './ServicePickerModal';
import { ServiceCategoryTabs } from './ServiceCategoryTabs';
import { useStore } from '@/hooks/useStore';
import { useServicesByCategory, useServiceCategories } from '@/hooks/queries';
import { serviceCategories as mockCategories, generateMockServices } from '@/lib/mockData';

interface ServiceSelectionSectionProps {
  formData: Partial<BookingFormData>;
  updateFormData: (data: Partial<BookingFormData>) => void;
}

export const ServiceSelectionSection = ({ formData, updateFormData }: ServiceSelectionSectionProps) => {
  const [showServicePicker, setShowServicePicker] = useState(false);
  const { storeId } = useStore();

  // Fetch services from Supabase with fallback to mock data
  const {
    data: servicesByCategory,
    isLoading,
    error,
    isError,
  } = useServicesByCategory(storeId);

  const {
    data: categories,
    isLoading: categoriesLoading,
  } = useServiceCategories(storeId);

  const selectedService = formData.service;
  const selectedAddOns = formData.addOns || [];

  // Build service categories structure for the tabs component
  const serviceCategoryData = categories?.map(cat => ({
    id: cat.id,
    name: cat.name,
    description: cat.description || '',
  })) || mockCategories;

  // Flatten services for use in components
  const allServices = servicesByCategory?.flatMap(cat =>
    cat.services.map(service => ({
      id: service.id,
      name: service.name,
      description: service.description || '',
      duration: service.duration,
      price: service.price,
      basePrice: service.price, // Legacy field compatibility
      category: service.categoryName || 'Other',
      categoryId: service.categoryId,
    }))
  ) || [];

  // Fallback to mock data if no real data
  const displayServices = allServices.length > 0
    ? allServices
    : generateMockServices();

  const handleRemoveAddOn = (addOnId: string) => {
    updateFormData({
      addOns: selectedAddOns.filter(addon => addon.id !== addOnId),
    });
  };

  const handleRemovePrimaryService = () => {
    // If there are add-ons, promote the first one to primary service
    if (selectedAddOns.length > 0) {
      updateFormData({
        service: selectedAddOns[0],
        addOns: selectedAddOns.slice(1),
      });
    } else {
      // No add-ons, clear service and reset flow
      updateFormData({
        service: undefined,
        groupChoiceMade: false,
        isGroup: false,
        groupSize: undefined,
        questionsAnswered: false,
        readyForTechnician: false,
        staff: undefined,
        readyForDateTime: false,
        date: undefined,
        time: undefined,
      });
    }
  };

  // Show loading state
  if (isLoading || categoriesLoading) {
    return (
      <div className="py-8">
        <div className="container max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Select a Service</h2>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading services...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show error state with fallback
  if (isError && displayServices.length === 0) {
    return (
      <div className="py-8">
        <div className="container max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Select a Service</h2>
          <Card className="p-6">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              <p>Unable to load services from server. Showing sample services.</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="container max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6 text-foreground">Select a Service</h2>

        {selectedService ? (
          <div className="space-y-6">
            {/* Selected Service Card */}
            <Card className="overflow-hidden shadow-md border-2 border-primary/20 bg-primary/5">
              <div className="p-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                      <h3 className="font-bold text-lg text-foreground">
                        {selectedService.name}
                      </h3>
                    </div>
                    {selectedService.description && (
                      <p className="text-sm text-muted-foreground ml-8">{selectedService.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        ${typeof selectedService.price === 'number' ? selectedService.price.toFixed(2) : '0.00'}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {typeof selectedService.duration === 'number' ? selectedService.duration : 0} min
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemovePrimaryService}
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                      title="Remove service"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Additional Services List */}
            {selectedAddOns.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">Additional Services</h3>
                {selectedAddOns.map((addon) => (
                  <Card key={addon.id} className="overflow-hidden shadow-sm border border-border">
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-base text-foreground">
                            {addon.name}
                          </h4>
                          {addon.description && (
                            <p className="text-sm text-muted-foreground mt-1">{addon.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary">
                              ${typeof addon.price === 'number' ? addon.price.toFixed(2) : '0.00'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {typeof addon.duration === 'number' ? addon.duration : 0} min
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveAddOn(addon.id)}
                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Add Another Service Button */}
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowServicePicker(true)}
              className="w-full h-12 text-sm font-semibold hover:bg-primary/5 hover:border-primary/50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Service
            </Button>
          </div>
        ) : (
          <ServiceCategoryTabs
            formData={formData}
            updateFormData={updateFormData}
            serviceCategories={serviceCategoryData}
            allServices={displayServices}
            // No onServiceSelect prop - uses inline mode
          />
        )}

        <ServicePickerModal
          open={showServicePicker}
          onOpenChange={setShowServicePicker}
          onSelectService={(service) => {
            // Add to addOns array instead of replacing primary service
            updateFormData({
              addOns: [...selectedAddOns, service]
            });
            setShowServicePicker(false);
          }}
        />
      </div>
    </div>
  );
};
