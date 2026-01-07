import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { ReviewUI } from "@/types/store";
import { getReviews } from "@/lib/api/store";

interface ReviewsStripProps {
  serviceId?: string;
  staffId?: string;
  limit?: number;
  className?: string;
}

export function ReviewsStrip({ serviceId, staffId, limit = 6, className = "" }: ReviewsStripProps) {
  const [reviews, setReviews] = useState<ReviewUI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await getReviews({ serviceId, staffId, limit });
      setReviews(data.reviews);
      setLoading(false);
    };

    fetchData();
  }, [serviceId, staffId, limit]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i}
        className={`h-3 w-3 ${i < rating ? 'fill-primary text-primary' : 'text-muted'}`}
        aria-hidden="true"
      />
    ));
  };

  if (loading) {
    return (
      <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 space-y-3">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
              <div className="h-12 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return null;
  }

  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm truncate">{review.clientName}</h3>
                  {review.verified && (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(review.dateISO).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <div className="flex gap-0.5" role="img" aria-label={`Rated ${review.rating} out of 5 stars`}>
                {renderStars(review.rating)}
              </div>
            </div>
            
            {review.serviceName && (
              <Badge variant="outline" className="text-xs">{review.serviceName}</Badge>
            )}
            
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {review.comment}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
