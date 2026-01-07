import { useState } from 'react';
import { Star, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface Review {
  id: string;
  customerId: string;
  customerName: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  verified: boolean;
  helpful: number;
}

interface ReviewsSectionProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

export const ReviewsSection = ({ reviews, averageRating, totalReviews }: ReviewsSectionProps) => {
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'rating'>('recent');

  const ratingDistribution = [5, 4, 3, 2, 1].map(stars => {
    const count = reviews.filter(r => r.rating === stars).length;
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
    return { stars, count, percentage };
  });

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === 'recent') return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortBy === 'helpful') return b.helpful - a.helpful;
    if (sortBy === 'rating') return b.rating - a.rating;
    return 0;
  });

  return (
    <div className="space-y-8">
      {/* Rating Overview */}
      <div className="grid md:grid-cols-2 gap-8 pb-8 border-b">
        <div className="text-center md:text-left">
          <div className="text-5xl font-bold mb-2">{averageRating.toFixed(1)}</div>
          <div className="flex items-center justify-center md:justify-start gap-1 mb-2">
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                className={`h-5 w-5 ${
                  star <= averageRating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'
                }`}
              />
            ))}
          </div>
          <p className="text-muted-foreground">Based on {totalReviews} reviews</p>
        </div>

        <div className="space-y-2">
          {ratingDistribution.map(({ stars, count, percentage }) => (
            <div key={stars} className="flex items-center gap-3">
              <span className="text-sm w-12">{stars} star</span>
              <Progress value={percentage} className="flex-1 h-2" />
              <span className="text-sm text-muted-foreground w-8">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={sortBy === 'recent' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortBy('recent')}
        >
          Most Recent
        </Button>
        <Button
          variant={sortBy === 'helpful' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortBy('helpful')}
        >
          Most Helpful
        </Button>
        <Button
          variant={sortBy === 'rating' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortBy('rating')}
        >
          Highest Rating
        </Button>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {sortedReviews.map(review => (
          <div key={review.id} className="border-b pb-6 last:border-0">
            <div className="flex items-start gap-4">
              <Avatar>
                <AvatarFallback>{review.customerName.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{review.customerName}</span>
                      {review.verified && (
                        <Badge variant="secondary" className="text-xs">Verified Purchase</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(review.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-1">{review.title}</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">{review.comment}</p>
                </div>

                <Button variant="ghost" size="sm" className="gap-2">
                  <ThumbsUp className="h-4 w-4" />
                  Helpful ({review.helpful})
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
