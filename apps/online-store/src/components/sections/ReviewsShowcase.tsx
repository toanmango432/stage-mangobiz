import { useState, useEffect } from 'react';
import { Star, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { getReviews } from '@/lib/api/store';
import type { ReviewUI } from '@/types/store';

interface ReviewsShowcaseProps {
  title?: string;
  limit?: number;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );
}

export function ReviewsShowcase({
  title = "What Our Clients Say",
  limit = 12
}: ReviewsShowcaseProps) {
  const [reviews, setReviews] = useState<ReviewUI[]>([]);
  const [aggregate, setAggregate] = useState({ count: 0, avg: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await getReviews({ limit });
        setReviews(response.reviews);
        setAggregate(response.aggregate);
      } catch (error) {
        console.error('Failed to load reviews:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [limit]);

  if (isLoading) {
    return (
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <p className="text-muted-foreground">Loading reviews...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold text-center mb-4">{title}</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Don't just take our word for it - hear from our satisfied clients
        </p>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {reviews.map((review) => (
              <CarouselItem key={review.id} className="md:basis-1/2 lg:basis-1/3">
                <Card className="h-full">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-semibold text-lg">{review.clientName}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(review.dateISO).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <StarRating rating={review.rating} />
                    </div>

                    <p className="text-muted-foreground mb-4 flex-grow leading-relaxed">
                      "{review.comment}"
                    </p>

                    <div className="flex items-center gap-2 mt-auto pt-4 border-t">
                      {review.serviceName && (
                        <Badge variant="secondary" className="text-xs">
                          {review.serviceName}
                        </Badge>
                      )}
                      {review.verified && (
                        <div className="flex items-center gap-1 text-xs text-primary ml-auto">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Verified</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            ⭐ {aggregate.avg.toFixed(1)}/5 average rating from {aggregate.count}+ reviews
          </p>
        </div>
      </div>
    </section>
  );
}
