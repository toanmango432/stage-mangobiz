import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ServiceMenuGrid } from './ServiceMenuGrid';
import { BookingFormData } from '@/types/booking';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Heart, Star, Flower2 } from 'lucide-react';

interface ServiceCategoryTabsProps {
  formData: Partial<BookingFormData>;
  updateFormData: (data: Partial<BookingFormData>) => void;
  serviceCategories: any[];
  allServices: any[];
  onServiceSelect?: (service: any) => void;
}

const categoryIcons: Record<string, any> = {
  'manicure-classic': Sparkles,
  'manicure-gel': Heart,
  'manicure-specialty': Star,
  'pedicures': Flower2,
};


export const ServiceCategoryTabs = ({ 
  formData, 
  updateFormData, 
  serviceCategories,
  allServices,
  onServiceSelect
}: ServiceCategoryTabsProps) => {
  return (
    <Tabs defaultValue="manicure-classic" className="w-full">
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-8">
        <TabsList className="w-full inline-flex min-w-full lg:grid lg:grid-cols-4 h-auto p-1.5 bg-gradient-to-r from-[hsl(var(--orange))]/10 via-muted/20 to-[hsl(var(--orange))]/10 gap-2 rounded-xl shadow-sm">
          {serviceCategories.map(category => {
            const Icon = categoryIcons[category.id] || Sparkles;
            const categoryServices = category.subcategories?.flatMap((sub: any) => 
              allServices.filter((s: any) => sub.services.includes(s.id))
            ) || [];
            
            return (
              <TabsTrigger 
                key={category.id} 
                value={category.id}
                className="group relative data-[state=active]:bg-gradient-to-br data-[state=active]:from-[hsl(var(--orange))] data-[state=active]:to-[hsl(var(--orange-dark))] data-[state=active]:text-white data-[state=active]:shadow-lg py-3 px-4 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 transition-all hover:scale-105"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{category.name}</span>
                  <Badge 
                    variant="secondary" 
                    className="ml-1 text-xs group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white"
                  >
                    {categoryServices.length}
                  </Badge>
                </div>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>
      
      {serviceCategories.map(category => (
        <TabsContent key={category.id} value={category.id} className="mt-6 space-y-6">
          {category.subcategories.map((subcategory: any) => {
            const subcategoryServices = allServices.filter((service: any) => 
              subcategory.services.includes(service.id)
            );
            
            const avgPrice = subcategoryServices.length > 0
              ? Math.round(subcategoryServices.reduce((sum: number, s: any) => sum + s.basePrice, 0) / subcategoryServices.length)
              : 0;
            
            const minDuration = subcategoryServices.length > 0
              ? Math.min(...subcategoryServices.map((s: any) => s.duration))
              : 0;
            
            const maxDuration = subcategoryServices.length > 0
              ? Math.max(...subcategoryServices.map((s: any) => s.duration))
              : 0;

            const hasPopular = subcategoryServices.some((s: any) => s.badge === 'POPULAR');
            
            return (
              <Accordion 
                key={subcategory.id} 
                type="single" 
                collapsible 
                defaultValue={subcategory.id}
                className="bg-gradient-to-br from-[hsl(var(--orange))]/5 via-background to-[hsl(var(--orange))]/5 rounded-xl shadow-sm border-2 border-[hsl(var(--orange))]/10"
              >
                <AccordionItem value={subcategory.id} className="border-0">
                  <AccordionTrigger className="px-6 py-5 hover:no-underline group">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-left uppercase tracking-wide mb-1 group-hover:text-[hsl(var(--orange))] transition-colors">
                            {subcategory.name}
                          </h3>
                          <p className="text-sm text-muted-foreground font-normal normal-case tracking-normal">
                            {subcategoryServices.length} service{subcategoryServices.length !== 1 ? 's' : ''} • From ${avgPrice} • {minDuration}-{maxDuration} min
                          </p>
                        </div>
                        {hasPopular && (
                          <Badge className="bg-[hsl(var(--orange))] text-white border-0 font-bold">
                            POPULAR
                          </Badge>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <ServiceMenuGrid
                      services={subcategoryServices}
                      selectedServiceId={formData.service?.id}
                      onSelectService={(service) => {
                        const validatedService = {
                          id: service.id,
                          name: service.name || 'Unknown Service',
                          description: service.description || '',
                          duration: typeof service.duration === 'number' ? service.duration : 30,
                          price: service.basePrice,
                        };
                        
                        if (onServiceSelect) {
                          // Navigation mode - use callback
                          onServiceSelect(validatedService);
                        } else {
                          // Inline mode - only update service and addOns
                          // Let useBookingFlow handle resetting progression
                          updateFormData({ 
                            service: validatedService,
                            addOns: [],
                          });
                        }
                      }}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            );
          })}
        </TabsContent>
      ))}
    </Tabs>
  );
};
