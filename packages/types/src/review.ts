/**
 * Review & Reputation Types
 * PRD Reference: PRD-API-Specifications.md Section 4.15
 *
 * Reviews, ratings, and reputation management including
 * internal reviews and external platform sync.
 */

import type { BaseSyncableEntity } from './common';

// ============================================
// ENUMS AND TYPE UNIONS
// ============================================

/** Source of the review */
export type ReviewSource = 'internal' | 'google' | 'yelp' | 'facebook';

/** Reputation trend */
export type ReputationTrend = 'improving' | 'stable' | 'declining';

// ============================================
// REVIEW ENTITY
// ============================================

/**
 * A client review for a salon or staff member.
 * Extends BaseSyncableEntity for offline-first sync support.
 */
export interface Review extends BaseSyncableEntity {
  /** Client who left the review */
  clientId: string;

  /** Client name (denormalized) */
  clientName?: string;

  /** Client photo URL (denormalized) */
  clientPhotoUrl?: string;

  /** Associated appointment (optional) */
  appointmentId?: string;

  /** Staff member reviewed (optional, for staff-specific reviews) */
  staffId?: string;

  /** Staff name (denormalized) */
  staffName?: string;

  /** Source platform */
  source: ReviewSource;

  /** External ID (for synced reviews) */
  externalId?: string;

  /** Rating (1-5 stars) */
  rating: number;

  /** Review title (optional) */
  title?: string;

  /** Review content */
  content: string;

  /** Attached photos */
  photos?: string[];

  /** Business response */
  response?: string;

  /** When response was posted */
  respondedAt?: string;

  /** Who responded */
  respondedBy?: string;

  /** Whether review is publicly visible */
  isPublic: boolean;

  /** Whether review is verified (client actually visited) */
  isVerified?: boolean;

  /** Services received (for context) */
  serviceIds?: string[];

  /** Service names (denormalized) */
  serviceNames?: string[];

  /** Whether review has been flagged */
  isFlagged?: boolean;

  /** Flag reason */
  flagReason?: string;

  /** External URL (for synced reviews) */
  externalUrl?: string;
}

// ============================================
// REVIEW REQUEST
// ============================================

/**
 * A request sent to a client asking for a review.
 */
export interface ReviewRequest extends BaseSyncableEntity {
  /** Client ID */
  clientId: string;

  /** Client name (denormalized) */
  clientName?: string;

  /** Associated appointment */
  appointmentId: string;

  /** Staff who provided service */
  staffId?: string;

  /** When request was sent */
  sentAt: string;

  /** How it was sent */
  sentVia: 'email' | 'sms' | 'push';

  /** Whether client has responded */
  hasResponded: boolean;

  /** Created review ID (if responded) */
  reviewId?: string;

  /** When client responded */
  respondedAt?: string;

  /** Number of reminder sent */
  reminderCount: number;

  /** Last reminder sent at */
  lastReminderAt?: string;
}

// ============================================
// REPUTATION SUMMARY
// ============================================

/**
 * Aggregate reputation metrics.
 */
export interface ReputationSummary {
  /** Overall average rating (1-5) */
  averageRating: number;

  /** Total number of reviews */
  totalReviews: number;

  /** Distribution of ratings: { 5: 45, 4: 20, 3: 10, 2: 3, 1: 2 } */
  ratingDistribution: Record<number, number>;

  /** Recent trend direction */
  recentTrend: ReputationTrend;

  /** Percentage of reviews with responses */
  responseRate: number;

  /** Average response time in hours */
  averageResponseTime?: number;

  /** Breakdown by source */
  bySource: {
    source: ReviewSource;
    avgRating: number;
    count: number;
  }[];

  /** Breakdown by staff */
  byStaff: {
    staffId: string;
    staffName: string;
    avgRating: number;
    count: number;
  }[];

  /** Period for these stats */
  periodStart?: string;
  periodEnd?: string;
}

// ============================================
// NPS (NET PROMOTER SCORE)
// ============================================

/**
 * NPS response from a client.
 */
export interface NPSResponse extends BaseSyncableEntity {
  /** Client ID */
  clientId: string;

  /** NPS score (0-10) */
  score: number;

  /** Category based on score */
  category: 'detractor' | 'passive' | 'promoter';

  /** Optional feedback */
  feedback?: string;

  /** Associated appointment */
  appointmentId?: string;
}

/**
 * NPS summary metrics.
 */
export interface NPSSummary {
  /** Overall NPS score (-100 to 100) */
  score: number;

  /** Total responses */
  totalResponses: number;

  /** Breakdown by category */
  promoters: number;
  passives: number;
  detractors: number;

  /** Percentages */
  promoterPercent: number;
  passivePercent: number;
  detractorPercent: number;

  /** Trend vs previous period */
  trend?: number;

  /** Period for these stats */
  periodStart?: string;
  periodEnd?: string;
}

// ============================================
// REVIEW SETTINGS
// ============================================

/**
 * Review and reputation settings.
 */
export interface ReviewSettings {
  /** Auto-send review requests after appointments */
  autoRequestReviews: boolean;

  /** Hours after appointment to send request */
  requestDelayHours: number;

  /** Send reminders for non-responses */
  sendReminders: boolean;

  /** Days between reminders */
  reminderIntervalDays: number;

  /** Maximum reminders to send */
  maxReminders: number;

  /** Minimum rating to show publicly */
  minPublicRating?: number;

  /** Require approval before publishing */
  requireApproval: boolean;

  /** Enable NPS surveys */
  npsEnabled: boolean;

  /** NPS survey frequency (days between surveys per client) */
  npsSurveyFrequency: number;

  /** External platform sync settings */
  syncGoogle: boolean;
  syncYelp: boolean;
  syncFacebook: boolean;

  /** Alert threshold for low ratings */
  lowRatingAlertThreshold: number;

  /** Who to alert for low ratings */
  lowRatingAlertEmails?: string[];
}

// ============================================
// INPUT TYPES
// ============================================

/**
 * Input for submitting a review.
 */
export interface SubmitReviewInput {
  clientId: string;
  appointmentId?: string;
  staffId?: string;
  rating: number;
  title?: string;
  content: string;
  photos?: string[];
}

/**
 * Input for responding to a review.
 */
export interface RespondToReviewInput {
  reviewId: string;
  response: string;
  respondedBy: string;
}

/**
 * Input for sending a review request.
 */
export interface SendReviewRequestInput {
  clientId: string;
  appointmentId: string;
  staffId?: string;
  sendVia: 'email' | 'sms' | 'push';
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Gets star rating display.
 */
export function getStarDisplay(rating: number): string {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return '★'.repeat(fullStars) + (hasHalf ? '½' : '') + '☆'.repeat(emptyStars);
}

/**
 * Gets rating color.
 */
export function getRatingColor(rating: number): string {
  if (rating >= 4.5) return 'text-emerald-600';
  if (rating >= 4.0) return 'text-green-600';
  if (rating >= 3.5) return 'text-lime-600';
  if (rating >= 3.0) return 'text-amber-600';
  if (rating >= 2.0) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Calculates NPS score from responses.
 */
export function calculateNPS(
  responses: { score: number }[]
): { score: number; promoters: number; passives: number; detractors: number } {
  if (responses.length === 0) {
    return { score: 0, promoters: 0, passives: 0, detractors: 0 };
  }

  let promoters = 0;
  let passives = 0;
  let detractors = 0;

  for (const response of responses) {
    if (response.score >= 9) promoters++;
    else if (response.score >= 7) passives++;
    else detractors++;
  }

  const total = responses.length;
  const score = Math.round(((promoters - detractors) / total) * 100);

  return { score, promoters, passives, detractors };
}

/**
 * Gets NPS category from score.
 */
export function getNPSCategory(score: number): 'detractor' | 'passive' | 'promoter' {
  if (score >= 9) return 'promoter';
  if (score >= 7) return 'passive';
  return 'detractor';
}

/**
 * Gets reputation trend display.
 */
export function getTrendDisplay(trend: ReputationTrend): {
  label: string;
  icon: string;
  color: string;
} {
  switch (trend) {
    case 'improving':
      return { label: 'Improving', icon: '↑', color: 'text-emerald-600' };
    case 'stable':
      return { label: 'Stable', icon: '→', color: 'text-gray-600' };
    case 'declining':
      return { label: 'Declining', icon: '↓', color: 'text-red-600' };
    default:
      return { label: 'Unknown', icon: '-', color: 'text-gray-400' };
  }
}

/**
 * Creates default review settings.
 */
export function createDefaultReviewSettings(): ReviewSettings {
  return {
    autoRequestReviews: true,
    requestDelayHours: 2,
    sendReminders: true,
    reminderIntervalDays: 3,
    maxReminders: 2,
    requireApproval: false,
    npsEnabled: true,
    npsSurveyFrequency: 90,
    syncGoogle: false,
    syncYelp: false,
    syncFacebook: false,
    lowRatingAlertThreshold: 3,
  };
}

/**
 * Formats time since review.
 */
export function formatTimeSince(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}
