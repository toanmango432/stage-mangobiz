import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, DollarSign, Plus, Star, TrendingUp } from 'lucide-react';
import { getServicePlaceholder } from '@/lib/images';

interface ServiceSubcategoryAccordionProps {
  subcategories: any[];
  allServices: any[];
  selectedServiceId?: string;
  onSelectService: (service: any) => void;
}

export const ServiceSubcategoryAccordion = ({ 
  subcategories, 
  allServices, 
  selectedServiceId, 
  onSelectService 
}: ServiceSubcategoryAccordionProps) => {
  // Mock popularity data - in real app, this would come from backend
  const getPopularityScore = (serviceId: string) => {
    const popularServices = ['6', '12', '22', '28']; // Gel Manicure, Spa Manicure, Luxury Spa Pedicure, etc.
    return popularServices.includes(serviceId) ? 4.8 : 4.5;
  };

  const isPopular = (serviceId: string) => {
    const popularServices = ['6', '12', '22', '28'];
    return popularServices.includes(serviceId);
  };

  return (
    <Accordion type="multiple" defaultValue={[subcategories[0]?.id]} className="w-full space-y-4">
      {subcategories.map(subcategory => {
        const services = allServices.filter(service => 
          subcategory.services.includes(service.id)
        );

        return (
          <AccordionItem 
            key={subcategory.id} 
            value={subcategory.id}
            className="border rounded-xl px-6 bg-card"
          >
            <AccordionTrigger className="hover:no-underline py-5">
              <div className="flex justify-between items-center w-full pr-4">
                <span className="text-lg font-bold">{subcategory.name}</span>
                <Badge variant="secondary" className="ml-2">
                  {services.length} services
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-6">
              <div className="space-y-4 mt-2">
                {services.map(service => {
                  const isSelected = selectedServiceId === service.id;
                  const popularity = getPopularityScore(service.id);
                  const showPopularBadge = isPopular(service.id);

                  return (
                    <div 
                      key={service.id}
                      className={`
                        group relative flex gap-4 p-5 rounded-xl border-2 transition-all duration-200
                        ${isSelected 
                          ? 'border-primary bg-primary/5 shadow-md' 
                          : 'border-border hover:border-primary/50 hover:shadow-lg cursor-pointer'
                        }
                      `}
                      onClick={() => onSelectService(service)}
                    >
                      {/* Service Image */}
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden shrink-0">
                        <img
                          src={service.image || getServicePlaceholder(service.name, service.category)}
                          alt={service.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        {showPopularBadge && (
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-amber-500 text-white text-xs px-2 py-0.5">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Popular
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Service Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="text-lg font-bold mb-1">{service.name}</h4>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center text-amber-500">
                                <Star className="h-4 w-4 fill-current" />
                                <span className="text-sm font-medium ml-1">{popularity}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                ({Math.floor(Math.random() * 200 + 50)} bookings)
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                          {service.description}
                        </p>

                        {/* Service Info */}
                        <div className="flex items-center gap-6 mb-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{service.duration} minutes</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-muted-foreground" />
                            <span className="text-2xl font-bold text-primary">${service.basePrice}</span>
                          </div>
                        </div>

                        {/* Add-ons Preview */}
                        {service.addOns && service.addOns.length > 0 && (
                          <div className="mb-4">
                            <div className="text-xs font-medium text-muted-foreground mb-2">Popular Add-ons:</div>
                            <div className="flex flex-wrap gap-2">
                              {service.addOns.slice(0, 3).map((addon: any) => (
                                <Badge 
                                  key={addon.id} 
                                  variant="outline" 
                                  className="text-xs"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  {addon.name} +${addon.price}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action Button */}
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectService(service);
                          }}
                          className={isSelected ? 'w-full sm:w-auto' : 'w-full sm:w-auto'}
                          variant={isSelected ? 'default' : 'outline'}
                        >
                          {isSelected ? 'Selected' : 'Select Service'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};
