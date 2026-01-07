import { useEffect, useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Filter } from "lucide-react";
import { aggregateRatingSchema, injectSchema } from "@/lib/seoSchema";
import { trackEvent } from "@/lib/analytics";
import { ReviewUI } from "@/types/store";
import { getReviews, getReviewServices, getReviewStaff } from "@/lib/api/store";

const trackNavClick = (page: string) => trackEvent({ event: 'nav_info_click', page });

export default function Reviews() {
  const [reviews, setReviews] = useState<ReviewUI[]>([]);
  const [aggregate, setAggregate] = useState({ count: 0, avg: 0 });
  const [loading, setLoading] = useState(true);
  const [nextOffset, setNextOffset] = useState<number | undefined>();
  
  // Filters
  const [minRating, setMinRating] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const [services, setServices] = useState<Array<{ id: string; name: string }>>([]);
  const [staff, setStaff] = useState<Array<{ id: string; name: string }>>([]);

  // Fetch filter options
  useEffect(() => {
    const fetchFilters = async () => {
      const [servicesData, staffData] = await Promise.all([
        getReviewServices(),
        getReviewStaff()
      ]);
      setServices(servicesData);
      setStaff(staffData);
    };
    
    fetchFilters();
    trackNavClick('Reviews');
  }, []);

  // Fetch reviews when filters change
  useEffect(() => {
    fetchReviews(true);
  }, [minRating, selectedService, selectedStaff]);

  // Inject structured data for SEO
  useEffect(() => {
    if (aggregate.count > 0) {
      const cleanup = injectSchema(aggregateRatingSchema(aggregate, 'Mango Nail & Beauty Salon'));
      return cleanup;
    }
  }, [aggregate]);

  const fetchReviews = async (reset: boolean = false) => {
    setLoading(true);
    
    const filters: any = { 
      limit: 10,
      offset: reset ? 0 : nextOffset || 0
    };
    
    if (minRating !== 'all') {
      filters.minRating = parseInt(minRating);
    }
    if (selectedService !== 'all') {
      filters.serviceId = selectedService;
    }
    if (selectedStaff !== 'all') {
      filters.staffId = selectedStaff;
    }

    const data = await getReviews(filters);
    
    if (reset) {
      setReviews(data.reviews);
    } else {
      setReviews(prev => [...prev, ...data.reviews]);
    }
    
    setAggregate(data.aggregate);
    setNextOffset(data.nextOffset);
    setLoading(false);
  };

  const handleLoadMore = () => {
    if (nextOffset !== undefined) {
      fetchReviews(false);
    }
  };


  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i}
        className={`h-4 w-4 ${i < rating ? 'fill-primary text-primary' : 'text-muted'}`}
        aria-hidden="true"
      />
    ));
  };

  const hasFilters = services.length > 0 || staff.length > 0;

  return (
    <>
      <SEOHead 
        title="Reviews — Mango Nail & Beauty Salon"
        description={`Read ${aggregate.count} verified customer reviews. Average rating: ${aggregate.avg}/5 stars. See what our clients say about our services.`}
        canonical="/info/reviews"
      />
      
      <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold">Customer Reviews</h1>
              <p className="text-xl text-muted-foreground">
                See what our clients are saying
              </p>
            </div>

            {aggregate.count > 0 && (
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
                <CardContent className="p-8 text-center space-y-2">
                  <div className="flex justify-center gap-1" role="img" aria-label={`Average rating ${aggregate.avg.toFixed(1)} out of 5 stars`}>
                    {renderStars(Math.round(aggregate.avg))}
                  </div>
                  <div className="text-4xl font-bold">{aggregate.avg.toFixed(1)}</div>
                  <div className="text-muted-foreground">
                    Based on {aggregate.count}+ verified reviews
                  </div>
                </CardContent>
              </Card>
            )}

            {hasFilters && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Filter by:</span>
                    </div>
                    
                    <Select value={minRating} onValueChange={setMinRating}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="All ratings" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All ratings</SelectItem>
                        <SelectItem value="5">5 stars</SelectItem>
                        <SelectItem value="4">4+ stars</SelectItem>
                        <SelectItem value="3">3+ stars</SelectItem>
                      </SelectContent>
                    </Select>

                    {services.length > 0 && (
                      <Select value={selectedService} onValueChange={setSelectedService}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="All services" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All services</SelectItem>
                          {services.map(service => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {staff.length > 0 && (
                      <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="All staff" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All staff</SelectItem>
                          {staff.map(member => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : reviews.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No reviews found</h3>
                  <p className="text-muted-foreground">
                    {minRating !== 'all' || selectedService !== 'all' || selectedStaff !== 'all' 
                      ? 'Try adjusting your filters to see more reviews.'
                      : 'Be the first to share your experience!'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{review.clientName}</h3>
                            {review.verified && (
                              <Badge variant="secondary" className="text-xs">
                                Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(review.dateISO).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                        <div className="flex gap-1" role="img" aria-label={`Rated ${review.rating} out of 5 stars`}>
                          {renderStars(review.rating)}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {review.serviceName && (
                          <Badge variant="outline">{review.serviceName}</Badge>
                        )}
                        {review.staffName && (
                          <Badge variant="secondary" className="text-xs">
                            {review.staffName}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-muted-foreground leading-relaxed">
                        {review.comment}
                      </p>
                    </CardContent>
                  </Card>
                ))}

                {nextOffset !== undefined && (
                  <div className="flex justify-center pt-4">
                    <Button 
                      variant="outline" 
                      onClick={handleLoadMore}
                      disabled={loading}
                    >
                      {loading ? 'Loading...' : 'Load More Reviews'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
      </div>
    </>
  );
}
