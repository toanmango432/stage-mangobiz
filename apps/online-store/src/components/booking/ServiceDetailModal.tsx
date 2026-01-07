import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PriceTag } from './design-system/PriceTag';
import { DurationBadge } from './design-system/DurationBadge';
import { ServiceCard } from './ServiceCard';
import { Service } from '@/types/catalog';
import { cn } from '@/lib/utils';
import { 
  Star, 
  Clock, 
  Users, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight,
  Heart,
  Share2,
  X
} from 'lucide-react';

interface ServiceDetailModalProps {
  service: Service | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookService: (service: Service) => void;
  relatedServices?: Service[];
}

export const ServiceDetailModal = ({
  service,
  open,
  onOpenChange,
  onBookService,
  relatedServices = [],
}: ServiceDetailModalProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  if (!service) return null;

  const images = [
    service.image || '/images/services/default-1.jpg',
    '/images/services/default-2.jpg',
    '/images/services/default-3.jpg',
  ];

  const handleBookService = () => {
    onBookService(service);
    onOpenChange(false);
  };

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: service.name,
          text: service.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const includedItems = [
    'Professional consultation',
    'High-quality products',
    'Sanitized tools',
    'Aftercare instructions',
    'Touch-up within 48 hours',
  ];

  const reviews = [
    {
      id: 1,
      name: 'Sarah M.',
      rating: 5,
      comment: 'Absolutely love this service! The technician was so skilled and the results exceeded my expectations.',
      date: '2 days ago',
    },
    {
      id: 2,
      name: 'Jessica L.',
      rating: 5,
      comment: 'Perfect for special occasions. Highly recommend!',
      date: '1 week ago',
    },
    {
      id: 3,
      name: 'Maria R.',
      rating: 4,
      comment: 'Great service, very professional staff.',
      date: '2 weeks ago',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <div className="flex flex-col lg:flex-row">
          {/* Image Gallery */}
          <div className="lg:w-1/2 relative">
            <div className="relative h-64 lg:h-full min-h-[400px]">
              {/* Main Image */}
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <div className="text-8xl opacity-30">💅</div>
              </div>
              
              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                    onClick={handlePreviousImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                    onClick={handleNextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}

              {/* Image Indicators */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {images.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        'w-2 h-2 rounded-full transition-colors',
                        index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      )}
                    />
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-white/20 hover:bg-white/40 text-white"
                  onClick={() => setIsFavorited(!isFavorited)}
                >
                  <Heart className={cn('h-4 w-4', isFavorited && 'fill-red-500 text-red-500')} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-white/20 hover:bg-white/40 text-white"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-white/20 hover:bg-white/40 text-white"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="lg:w-1/2 p-6">
            <DialogHeader className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle className="text-2xl font-bold">
                    {service.name}
                  </DialogTitle>
                  <p className="text-muted-foreground mt-2">
                    {service.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {service.featured && (
                    <Badge className="bg-primary text-primary-foreground">
                      Featured
                    </Badge>
                  )}
                  {service.badge && (
                    <Badge variant="outline">
                      {service.badge}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <PriceTag price={service.price} size="lg" variant="featured" />
                <DurationBadge duration={service.duration} size="md" />
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium">4.9</span>
                  <span className="text-sm text-muted-foreground">(127 reviews)</span>
                </div>
              </div>
            </DialogHeader>

            <Tabs defaultValue="overview" className="mt-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="related">Related</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* What's Included */}
                <div>
                  <h3 className="font-semibold mb-3">What's Included</h3>
                  <div className="space-y-2">
                    {includedItems.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Technician Recommendations */}
                <div>
                  <h3 className="font-semibold mb-3">Recommended Technicians</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Sarah Johnson, Maria Rodriguez, Emily Chen</span>
                  </div>
                </div>

                {/* Booking CTA */}
                <div className="pt-4 border-t">
                  <Button 
                    size="lg" 
                    className="w-full"
                    onClick={handleBookService}
                  >
                    Book This Service - ${service.price}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{review.name}</span>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                'h-4 w-4',
                                i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">{review.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="related" className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {relatedServices.slice(0, 3).map((relatedService) => (
                    <ServiceCard
                      key={relatedService.id}
                      service={relatedService}
                      layout="list"
                      onSelect={onBookService}
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
