import { Service } from '@/types/catalog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, TrendingUp } from 'lucide-react';

interface FeaturedServicesProps {
  services: Service[];
  onSelectService: (service: Service) => void;
}

export const FeaturedServices = ({ services, onSelectService }: FeaturedServicesProps) => {
  const featuredServices = services.filter(s => s.featured).slice(0, 3);

  if (featuredServices.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[hsl(var(--orange))] to-[hsl(var(--orange-dark))] bg-clip-text text-transparent">
          Featured Services
        </h2>
        <p className="text-muted-foreground">
          Our most popular treatments - loved by clients
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuredServices.map((service) => (
          <Card
            key={service.id}
            className="group overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 border-transparent hover:border-[hsl(var(--orange))]"
          >
            <div className="relative h-64 overflow-hidden">
              <img
                src={service.imageUrl || '/placeholder.svg'}
                alt={service.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              
              {service.badge && (
                <Badge 
                  className="absolute top-4 right-4 bg-[hsl(var(--orange))] text-white border-0 font-bold px-3 py-1"
                >
                  {service.badge}
                </Badge>
              )}

              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl font-bold mb-2">{service.name}</h3>
                <p className="text-sm text-white/90 line-clamp-2 mb-3">
                  {service.description}
                </p>

                <div className="flex items-center gap-4 text-sm mb-4">
                  {service.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{service.rating}</span>
                      <span className="text-white/70">({service.reviewCount})</span>
                    </div>
                  )}
                  {service.bookingCount && (
                    <div className="flex items-center gap-1 text-white/90">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm">{service.bookingCount} booked</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {service.compareAtPrice && (
                        <span className="text-white/60 line-through text-lg">
                          ${service.compareAtPrice}
                        </span>
                      )}
                      <span className="text-3xl font-bold">
                        ${service.basePrice}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-white/80 text-sm mt-1">
                      <Clock className="h-3 w-3" />
                      <span>{service.duration} min</span>
                    </div>
                  </div>
                  
                  <Button
                    variant="orange"
                    size="lg"
                    onClick={() => onSelectService(service)}
                    className="shadow-lg"
                  >
                    Book Now
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};
