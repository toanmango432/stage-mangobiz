import React, { useState, useEffect } from 'react';
import type { ClientReview } from '@/types';
import { clientReviewsDB } from '@/db/database';
import { Card, Button, Textarea } from './SharedComponents';

interface ClientReviewsCardProps {
  clientId: string;
  averageRating?: number;
  totalReviews?: number;
  onRequestReview?: () => void;
}

const PLATFORM_LABELS: Record<ClientReview['platform'], { label: string; color: string }> = {
  internal: { label: 'Internal', color: 'bg-gray-100 text-gray-700' },
  google: { label: 'Google', color: 'bg-blue-100 text-blue-700' },
  yelp: { label: 'Yelp', color: 'bg-red-100 text-red-700' },
  facebook: { label: 'Facebook', color: 'bg-indigo-100 text-indigo-700' },
};

export const ClientReviewsCard: React.FC<ClientReviewsCardProps> = ({
  clientId,
  averageRating = 0,
  totalReviews = 0,
  onRequestReview,
}) => {
  const [reviews, setReviews] = useState<ClientReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    const loadReviews = async () => {
      try {
        setLoading(true);
        const clientReviews = await clientReviewsDB.getByClientId(clientId);
        setReviews(clientReviews);
      } catch (error) {
        console.error('Failed to load reviews:', error);
      } finally {
        setLoading(false);
      }
    };
    loadReviews();
  }, [clientId]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleSendReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    try {
      await clientReviewsDB.update(reviewId, {
        staffResponse: replyText.trim(),
        respondedAt: new Date().toISOString(),
      });
      setReviews(prev => prev.map(r =>
        r.id === reviewId
          ? { ...r, staffResponse: replyText.trim(), respondedAt: new Date().toISOString() }
          : r
      ));
      setReplyText('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Failed to save reply:', error);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-500';
    if (rating >= 3.5) return 'text-yellow-500';
    if (rating >= 2.5) return 'text-orange-500';
    return 'text-red-500';
  };

  const getRatingDistribution = () => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      const rounded = Math.round(r.rating) as 1 | 2 | 3 | 4 | 5;
      if (rounded >= 1 && rounded <= 5) {
        dist[rounded]++;
      }
    });
    return dist;
  };

  const distribution = getRatingDistribution();
  const maxCount = Math.max(...Object.values(distribution), 1);

  return (
    <Card
      title="Reviews & Feedback"
      description="Client's reviews across platforms"
      actions={
        onRequestReview && (
          <Button variant="outline" size="sm" onClick={onRequestReview}>
            <RequestIcon className="w-4 h-4" />
            Request Review
          </Button>
        )
      }
    >
      {/* Rating Summary */}
      <div className="flex items-start gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className={`text-5xl font-bold ${getRatingColor(averageRating)}`}>
            {averageRating > 0 ? averageRating.toFixed(1) : '-'}
          </p>
          <div className="flex items-center justify-center gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon
                key={star}
                filled={star <= Math.round(averageRating)}
                className={`w-4 h-4 ${star <= Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">{totalReviews} reviews</p>
        </div>

        {/* Rating Distribution */}
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-3">{rating}</span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all"
                  style={{ width: `${(distribution[rating as keyof typeof distribution] / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-6">
                {distribution[rating as keyof typeof distribution]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="py-8 text-center">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <StarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No reviews yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Reviews will appear here when received
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const platform = PLATFORM_LABELS[review.platform];

            return (
              <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                {/* Review Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                          key={star}
                          filled={star <= review.rating}
                          className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${platform.color}`}>
                      {platform.label}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{formatDate(review.createdAt)}</span>
                </div>

                {/* Review Comment */}
                {review.comment && (
                  <p className="text-sm text-gray-700 mb-3">{review.comment}</p>
                )}

                {/* Staff Response */}
                {review.staffResponse ? (
                  <div className="mt-3 p-3 bg-cyan-50 rounded-lg border-l-4 border-cyan-500">
                    <div className="flex items-center gap-2 mb-1">
                      <ReplyIcon className="w-4 h-4 text-cyan-600" />
                      <span className="text-xs font-medium text-cyan-700">Staff Response</span>
                      {review.respondedAt && (
                        <span className="text-xs text-gray-500">
                          {formatDate(review.respondedAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">{review.staffResponse}</p>
                  </div>
                ) : replyingTo === review.id ? (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      value={replyText}
                      onChange={setReplyText}
                      placeholder="Write your response..."
                      rows={2}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setReplyingTo(null); setReplyText(''); }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSendReply(review.id)}
                        disabled={!replyText.trim()}
                      >
                        Send Reply
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setReplyingTo(review.id)}
                    className="mt-2 text-sm text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
                  >
                    <ReplyIcon className="w-4 h-4" />
                    Reply
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Request Review Prompt */}
      {reviews.length > 0 && reviews.length < 5 && onRequestReview && (
        <div className="mt-4 p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-cyan-800">Encourage More Reviews</p>
              <p className="text-xs text-cyan-600 mt-1">
                Send a friendly reminder to leave a review
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={onRequestReview}>
              Send Request
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

// Icons
const StarIcon: React.FC<{ className?: string; filled?: boolean }> = ({ className, filled }) => (
  <svg className={className} fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const RequestIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const ReplyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
  </svg>
);

export default ClientReviewsCard;
