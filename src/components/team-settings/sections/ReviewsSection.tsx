/**
 * ReviewsSection Component - Phase 4: Staff Experience
 *
 * Displays staff reviews, ratings, and allows responding to reviews.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Star,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Search,
  ChevronDown,
  ChevronUp,
  Send,
  X,
  AlertCircle,
} from 'lucide-react';
import { Card, SectionHeader, Badge } from '../components/SharedComponents';
import type {
  StaffReview,
  ReviewSummary,
  ReviewCategory,
} from '../../../types/performance';

// ============================================
// TYPES
// ============================================

interface ReviewsSectionProps {
  memberId: string;
  memberName: string;
  storeId: string;
}

type FilterRating = 'all' | 1 | 2 | 3 | 4 | 5;
type SortOption = 'recent' | 'highest' | 'lowest';

// ============================================
// MOCK DATA
// ============================================

const generateMockReviews = (staffId: string): StaffReview[] => {
  const reviews: StaffReview[] = [
    {
      id: 'rev-1',
      staffId,
      clientId: 'client-1',
      clientName: 'Sarah M.',
      ticketId: 'ticket-1',
      serviceDate: new Date(2024, 11, 1).toISOString(),
      rating: 5,
      comment: 'Amazing experience! The haircut was exactly what I wanted. Very attentive and professional.',
      categories: [
        { category: 'quality', rating: 5 },
        { category: 'communication', rating: 5 },
        { category: 'timeliness', rating: 5 },
        { category: 'value', rating: 5 },
      ],
      createdAt: new Date(2024, 11, 1).toISOString(),
      isPublic: true,
    },
    {
      id: 'rev-2',
      staffId,
      clientId: 'client-2',
      clientName: 'Jennifer L.',
      serviceDate: new Date(2024, 10, 28).toISOString(),
      rating: 5,
      comment: 'Best colorist in town! My balayage looks incredible. Highly recommend!',
      categories: [
        { category: 'quality', rating: 5 },
        { category: 'communication', rating: 5 },
        { category: 'timeliness', rating: 4 },
        { category: 'value', rating: 5 },
      ],
      createdAt: new Date(2024, 10, 28).toISOString(),
      isPublic: true,
      response: {
        text: 'Thank you so much, Jennifer! It was a pleasure working with you. Can\'t wait to see you again!',
        respondedAt: new Date(2024, 10, 29).toISOString(),
        respondedBy: staffId,
      },
    },
    {
      id: 'rev-3',
      staffId,
      clientId: 'client-3',
      clientName: 'Mike T.',
      serviceDate: new Date(2024, 10, 25).toISOString(),
      rating: 4,
      comment: 'Great cut, just a bit longer wait than expected. But the result was worth it!',
      categories: [
        { category: 'quality', rating: 5 },
        { category: 'communication', rating: 4 },
        { category: 'timeliness', rating: 3 },
        { category: 'value', rating: 4 },
      ],
      createdAt: new Date(2024, 10, 25).toISOString(),
      isPublic: true,
    },
    {
      id: 'rev-4',
      staffId,
      clientId: 'client-4',
      clientName: 'Amanda R.',
      serviceDate: new Date(2024, 10, 20).toISOString(),
      rating: 5,
      comment: 'Love my new look! Super friendly and made great suggestions.',
      createdAt: new Date(2024, 10, 20).toISOString(),
      isPublic: true,
    },
    {
      id: 'rev-5',
      staffId,
      clientId: 'client-5',
      clientName: 'David K.',
      serviceDate: new Date(2024, 10, 15).toISOString(),
      rating: 3,
      comment: 'Good service but felt a bit rushed. The final result was okay.',
      categories: [
        { category: 'quality', rating: 3 },
        { category: 'communication', rating: 3 },
        { category: 'timeliness', rating: 4 },
        { category: 'value', rating: 3 },
      ],
      createdAt: new Date(2024, 10, 15).toISOString(),
      isPublic: true,
    },
  ];

  return reviews;
};

const generateMockSummary = (): ReviewSummary => {
  return {
    averageRating: 4.4,
    totalReviews: 47,
    distribution: { 1: 1, 2: 2, 3: 4, 4: 12, 5: 28 },
    recentTrend: 'improving',
    categoryAverages: {
      quality: 4.6,
      communication: 4.3,
      timeliness: 4.1,
      value: 4.4,
    },
  };
};

// ============================================
// STAR RATING COMPONENT
// ============================================

interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, size = 'md', showValue = false }) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClasses[size]} ${
            star <= rating
              ? 'text-amber-500 fill-amber-500'
              : 'text-gray-300'
          }`}
        />
      ))}
      {showValue && (
        <span className="text-sm font-medium text-gray-700 ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

// ============================================
// REVIEW CARD COMPONENT
// ============================================

interface ReviewCardProps {
  review: StaffReview;
  onRespond: (reviewId: string, response: string) => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, onRespond }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseText, setResponseText] = useState('');

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleSubmitResponse = () => {
    if (responseText.trim()) {
      onRespond(review.id, responseText);
      setResponseText('');
      setShowResponseForm(false);
    }
  };

  const getCategoryLabel = (category: ReviewCategory['category']) => {
    const labels: Record<ReviewCategory['category'], string> = {
      quality: 'Quality',
      communication: 'Communication',
      timeliness: 'Timeliness',
      value: 'Value',
    };
    return labels[category];
  };

  return (
    <Card className="mb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-medium">
            {review.clientName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{review.clientName}</span>
              {review.isPublic && (
                <Badge variant="info" size="sm">Public</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={review.rating} size="sm" />
              <span className="text-xs text-gray-400">
                {formatDate(review.serviceDate)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={review.rating >= 4 ? 'success' : review.rating >= 3 ? 'warning' : 'error'}
          >
            {review.rating}/5
          </Badge>
        </div>
      </div>

      {/* Review Comment */}
      {review.comment && (
        <p className="mt-3 text-gray-600 text-sm leading-relaxed">
          "{review.comment}"
        </p>
      )}

      {/* Category Ratings (Expandable) */}
      {review.categories && review.categories.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {isExpanded ? 'Hide details' : 'Show category ratings'}
          </button>

          {isExpanded && (
            <div className="mt-3 grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
              {review.categories.map((cat) => (
                <div key={cat.category} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{getCategoryLabel(cat.category)}</span>
                  <StarRating rating={cat.rating} size="sm" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Existing Response */}
      {review.response && (
        <div className="mt-4 p-3 bg-emerald-50 rounded-lg border-l-4 border-emerald-500">
          <div className="flex items-center gap-2 mb-1">
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">Your Response</span>
            <span className="text-xs text-emerald-500">
              {formatDate(review.response.respondedAt)}
            </span>
          </div>
          <p className="text-sm text-emerald-700">{review.response.text}</p>
        </div>
      )}

      {/* Response Form */}
      {!review.response && (
        <div className="mt-4">
          {showResponseForm ? (
            <div className="space-y-3">
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Write a response to this review..."
                className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                rows={3}
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setShowResponseForm(false);
                    setResponseText('');
                  }}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitResponse}
                  disabled={!responseText.trim()}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-3 h-3" />
                  Respond
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowResponseForm(true)}
              className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700"
            >
              <MessageCircle className="w-4 h-4" />
              Respond to review
            </button>
          )}
        </div>
      )}
    </Card>
  );
};

// ============================================
// RATING DISTRIBUTION COMPONENT
// ============================================

interface RatingDistributionProps {
  summary: ReviewSummary;
}

const RatingDistribution: React.FC<RatingDistributionProps> = ({ summary }) => {
  const maxCount = Math.max(...Object.values(summary.distribution));

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-gray-900">
              {summary.averageRating.toFixed(1)}
            </span>
            <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
          </div>
          <p className="text-sm text-gray-500">{summary.totalReviews} reviews</p>
        </div>
        <Badge
          variant={
            summary.recentTrend === 'improving'
              ? 'success'
              : summary.recentTrend === 'declining'
                ? 'error'
                : 'default'
          }
        >
          {summary.recentTrend === 'improving'
            ? 'Trending Up'
            : summary.recentTrend === 'declining'
              ? 'Trending Down'
              : 'Stable'}
        </Badge>
      </div>

      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((stars) => {
          const count = summary.distribution[stars as keyof typeof summary.distribution];
          const percentage = summary.totalReviews > 0 ? (count / summary.totalReviews) * 100 : 0;
          const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

          return (
            <div key={stars} className="flex items-center gap-2">
              <div className="flex items-center gap-1 w-12">
                <span className="text-sm text-gray-600">{stars}</span>
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              </div>
              <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    stars >= 4 ? 'bg-emerald-500' : stars === 3 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <span className="text-sm text-gray-500 w-16 text-right">
                {percentage.toFixed(0)}% ({count})
              </span>
            </div>
          );
        })}
      </div>

      {/* Category Averages */}
      {summary.categoryAverages && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-sm font-medium text-gray-700 mb-3">Category Breakdown</p>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(summary.categoryAverages).map(([category, rating]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{category}</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-gray-900">{rating.toFixed(1)}</span>
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

// ============================================
// MAIN REVIEWS SECTION COMPONENT
// ============================================

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  memberId,
  memberName,
}) => {
  const [filterRating, setFilterRating] = useState<FilterRating>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data (to be replaced with real data fetching)
  const reviews = useMemo(() => generateMockReviews(memberId), [memberId]);
  const summary = useMemo(() => generateMockSummary(), []);

  // Filter and sort reviews
  const filteredReviews = useMemo(() => {
    let filtered = [...reviews];

    // Filter by rating
    if (filterRating !== 'all') {
      filtered = filtered.filter((r) => r.rating === filterRating);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.clientName.toLowerCase().includes(query) ||
          r.comment?.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case 'highest':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        filtered.sort((a, b) => a.rating - b.rating);
        break;
      case 'recent':
      default:
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return filtered;
  }, [reviews, filterRating, sortBy, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const needsResponse = reviews.filter((r) => !r.response).length;
    const positiveReviews = reviews.filter((r) => r.rating >= 4).length;
    const negativeReviews = reviews.filter((r) => r.rating <= 2).length;
    return { needsResponse, positiveReviews, negativeReviews };
  }, [reviews]);

  const handleRespond = useCallback((reviewId: string, response: string) => {
    console.log('Responding to review:', reviewId, response);
    // TODO: Implement actual response submission
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        title="Reviews & Ratings"
        subtitle={`Manage ${memberName}'s client feedback`}
        icon={<Star className="w-5 h-5" />}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <div className="flex items-center justify-center gap-2">
            <ThumbsUp className="w-5 h-5 text-emerald-500" />
            <span className="text-2xl font-bold text-gray-900">{stats.positiveReviews}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Positive Reviews</p>
        </Card>
        <Card className="text-center">
          <div className="flex items-center justify-center gap-2">
            <MessageCircle className="w-5 h-5 text-amber-500" />
            <span className="text-2xl font-bold text-gray-900">{stats.needsResponse}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Needs Response</p>
        </Card>
        <Card className="text-center">
          <div className="flex items-center justify-center gap-2">
            <ThumbsDown className="w-5 h-5 text-red-500" />
            <span className="text-2xl font-bold text-gray-900">{stats.negativeReviews}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Critical Reviews</p>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rating Distribution - Sidebar */}
        <div className="lg:col-span-1">
          <RatingDistribution summary={summary} />
        </div>

        {/* Reviews List - Main Content */}
        <div className="lg:col-span-2">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            {/* Rating Filter */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {(['all', 5, 4, 3, 2, 1] as FilterRating[]).map((rating) => (
                <button
                  key={rating}
                  onClick={() => setFilterRating(rating)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                    filterRating === rating
                      ? 'bg-white text-gray-900 font-medium shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {rating === 'all' ? 'All' : `${rating}★`}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="recent">Most Recent</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
            </select>
          </div>

          {/* Reviews List */}
          {filteredReviews.length > 0 ? (
            <div>
              {filteredReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onRespond={handleRespond}
                />
              ))}
            </div>
          ) : (
            <Card>
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No reviews found</p>
                <p className="text-sm text-gray-400 mt-1">
                  {filterRating !== 'all' || searchQuery
                    ? 'Try adjusting your filters'
                    : 'Reviews will appear here once clients leave feedback'}
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewsSection;
