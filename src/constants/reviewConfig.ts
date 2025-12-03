/**
 * Review System Configuration
 * PRD Reference: 2.3.9 Reviews & Feedback
 */

import type { ClientReview } from '../types/client';

// ==================== TYPES ====================

/** Review request settings */
export interface ReviewSettings {
  /** Enable automatic review requests after checkout */
  autoRequestEnabled: boolean;
  /** Hours after checkout to send review request */
  requestDelayHours: number;
  /** Maximum requests per client per month */
  maxRequestsPerMonth: number;
  /** Minimum rating to show "Share on Google" prompt */
  minRatingForExternalShare: number;
  /** Platforms to suggest for sharing */
  externalPlatforms: ('google' | 'yelp' | 'facebook')[];
  /** Default message template */
  requestMessageTemplate: string;
  /** Subject line for email requests */
  emailSubjectTemplate: string;
  /** Enable SMS review requests */
  smsEnabled: boolean;
  /** Enable email review requests */
  emailEnabled: boolean;
  /** Reminder after X hours if not completed */
  reminderDelayHours: number;
  /** Maximum reminders to send */
  maxReminders: number;
}

/** Review request status */
export type ReviewRequestStatus = 'pending' | 'sent' | 'opened' | 'completed' | 'expired';

/** Review request record */
export interface ReviewRequest {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  appointmentId?: string;
  staffId?: string;
  staffName?: string;
  status: ReviewRequestStatus;
  sentVia: 'email' | 'sms' | 'both';
  sentAt?: string;
  openedAt?: string;
  completedAt?: string;
  reviewId?: string;  // ID of the review if completed
  reminderCount: number;
  lastReminderAt?: string;
  expiresAt: string;
  createdAt: string;
}

/** Review analytics */
export interface ReviewAnalytics {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number>;
  responseRate: number;  // % of reviews with staff response
  platformBreakdown: Record<ClientReview['platform'], number>;
  recentTrend: 'up' | 'down' | 'stable';
  requestConversionRate: number;  // % of requests that result in reviews
}

// ==================== DEFAULT SETTINGS ====================

export const DEFAULT_REVIEW_SETTINGS: ReviewSettings = {
  autoRequestEnabled: true,
  requestDelayHours: 2,  // Send 2 hours after checkout
  maxRequestsPerMonth: 2,
  minRatingForExternalShare: 4,
  externalPlatforms: ['google', 'yelp'],
  requestMessageTemplate: `Hi {clientName}!\n\nThank you for visiting {salonName} today. We hope you loved your {serviceName}!\n\nWe'd love to hear about your experience. Your feedback helps us improve and helps others discover us.\n\nTap below to leave a quick review:\n{reviewLink}\n\nThank you!\n{salonName} Team`,
  emailSubjectTemplate: 'How was your visit to {salonName}?',
  smsEnabled: true,
  emailEnabled: true,
  reminderDelayHours: 24,
  maxReminders: 1,
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Generate personalized review request message
 */
export function generateReviewMessage(
  template: string,
  data: {
    clientName: string;
    salonName: string;
    serviceName?: string;
    staffName?: string;
    reviewLink: string;
  }
): string {
  return template
    .replace(/{clientName}/g, data.clientName)
    .replace(/{salonName}/g, data.salonName)
    .replace(/{serviceName}/g, data.serviceName || 'service')
    .replace(/{staffName}/g, data.staffName || 'your stylist')
    .replace(/{reviewLink}/g, data.reviewLink);
}

/**
 * Generate review link for client
 */
export function generateReviewLink(
  requestId: string,
  baseUrl: string = 'https://review.mangospa.com'
): string {
  return `${baseUrl}/r/${requestId}`;
}

/**
 * Check if client can receive review request
 * (respects max requests per month)
 */
export function canRequestReview(
  recentRequests: ReviewRequest[],
  settings: ReviewSettings = DEFAULT_REVIEW_SETTINGS
): boolean {
  const now = new Date();
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const requestsThisMonth = recentRequests.filter(
    r => new Date(r.createdAt) > oneMonthAgo
  );

  return requestsThisMonth.length < settings.maxRequestsPerMonth;
}

/**
 * Calculate when to send review request
 */
export function calculateSendTime(
  checkoutTime: Date,
  delayHours: number = DEFAULT_REVIEW_SETTINGS.requestDelayHours
): Date {
  return new Date(checkoutTime.getTime() + delayHours * 60 * 60 * 1000);
}

/**
 * Check if review request has expired
 */
export function isRequestExpired(expiresAt: string): boolean {
  return new Date() > new Date(expiresAt);
}

/**
 * Calculate review analytics from reviews
 */
export function calculateReviewAnalytics(reviews: ClientReview[]): ReviewAnalytics {
  const totalReviews = reviews.length;

  if (totalReviews === 0) {
    return {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      responseRate: 0,
      platformBreakdown: { internal: 0, google: 0, yelp: 0, facebook: 0 },
      recentTrend: 'stable',
      requestConversionRate: 0,
    };
  }

  // Calculate average rating
  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = Math.round((totalRating / totalReviews) * 10) / 10;

  // Calculate rating distribution
  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(r => {
    const rounded = Math.round(r.rating) as 1 | 2 | 3 | 4 | 5;
    if (rounded >= 1 && rounded <= 5) {
      ratingDistribution[rounded]++;
    }
  });

  // Calculate response rate
  const reviewsWithResponse = reviews.filter(r => r.staffResponse).length;
  const responseRate = Math.round((reviewsWithResponse / totalReviews) * 100);

  // Calculate platform breakdown
  const platformBreakdown: Record<ClientReview['platform'], number> = {
    internal: 0,
    google: 0,
    yelp: 0,
    facebook: 0,
  };
  reviews.forEach(r => {
    platformBreakdown[r.platform]++;
  });

  // Calculate recent trend (last 30 days vs previous 30 days)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const recentReviews = reviews.filter(r => new Date(r.createdAt) > thirtyDaysAgo);
  const previousReviews = reviews.filter(
    r => new Date(r.createdAt) > sixtyDaysAgo && new Date(r.createdAt) <= thirtyDaysAgo
  );

  const recentAvg = recentReviews.length > 0
    ? recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length
    : 0;
  const previousAvg = previousReviews.length > 0
    ? previousReviews.reduce((sum, r) => sum + r.rating, 0) / previousReviews.length
    : 0;

  let recentTrend: 'up' | 'down' | 'stable' = 'stable';
  if (recentAvg > previousAvg + 0.3) recentTrend = 'up';
  else if (recentAvg < previousAvg - 0.3) recentTrend = 'down';

  return {
    totalReviews,
    averageRating,
    ratingDistribution,
    responseRate,
    platformBreakdown,
    recentTrend,
    requestConversionRate: 0, // Calculated separately with request data
  };
}

/**
 * Determine if review qualifies for external sharing prompt
 */
export function shouldPromptExternalShare(
  rating: number,
  settings: ReviewSettings = DEFAULT_REVIEW_SETTINGS
): boolean {
  return rating >= settings.minRatingForExternalShare;
}

/**
 * Get external review platform URL
 */
export function getExternalReviewUrl(
  platform: 'google' | 'yelp' | 'facebook',
  placeId: string
): string {
  switch (platform) {
    case 'google':
      return `https://search.google.com/local/writereview?placeid=${placeId}`;
    case 'yelp':
      return `https://www.yelp.com/writeareview/biz/${placeId}`;
    case 'facebook':
      return `https://www.facebook.com/${placeId}/reviews`;
    default:
      return '';
  }
}

/**
 * Generate star rating display
 */
export function getStarDisplay(rating: number): string {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;

  return '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars);
}

/**
 * Get rating label
 */
export function getRatingLabel(rating: number): string {
  if (rating >= 4.5) return 'Excellent';
  if (rating >= 4.0) return 'Very Good';
  if (rating >= 3.5) return 'Good';
  if (rating >= 3.0) return 'Average';
  if (rating >= 2.0) return 'Below Average';
  return 'Poor';
}

/**
 * Calculate request expiration date
 */
export function calculateExpirationDate(createdAt: Date, daysValid: number = 7): Date {
  return new Date(createdAt.getTime() + daysValid * 24 * 60 * 60 * 1000);
}
