import { Service } from '@/types/catalog';
import { getSimilarItems } from '@/lib/ai/recommendations';
import { Button } from '@/components/ui/button';
import { Clock, DollarSign } from 'lucide-react';
import { getServicePlaceholder } from '@/lib/images';

interface RelatedServicesProps {
  currentService: any;
  allServices: Service[];
  onSelectService: (service: any) => void;
}

export const RelatedServices = ({ currentService, allServices, onSelectService }: RelatedServicesProps) => {
  if (!currentService) return null;

  const relatedServices = getSimilarItems(currentService.id, allServices, 3);

  if (relatedServices.length === 0) return null;

  return (
    <div className="mt-12 border-t pt-8">
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">You Might Also Love</h3>
        <p className="text-muted-foreground">Complete your experience with these services</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {relatedServices.map((service) => (
          <div
            key={service.id}
            className="bg-card rounded-lg border border-border overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
          >
            <div className="relative h-32 overflow-hidden">
              <img
                src={service.image || getServicePlaceholder(service.name, service.category)}
                alt={service.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>

            <div className="p-4">
              <h4 className="font-semibold mb-2 line-clamp-1">{service.name}</h4>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{service.description}</p>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{service.duration}min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span className="font-semibold text-foreground">${service.basePrice}</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => onSelectService({
                  id: service.id,
                  name: service.name,
                  description: service.description,
                  duration: service.duration,
                  price: service.basePrice,
                })}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Add Service
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
