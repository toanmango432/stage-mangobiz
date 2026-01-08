/**
 * Staff Rating Type Adapter
 *
 * Converts between Supabase StaffRatingRow and app types.
 */

import type { StaffRatingRow, StaffRatingInsert, StaffRatingUpdate, RatingStatus, RatingSource } from '../types';

/**
 * App-side StaffRating type for staff reviews/ratings.
 */
export interface StaffRating {
  id: string;
  storeId: string;
  staffId: string;
  clientId: string | null;
  clientName: string | null;
  appointmentId: string | null;
  ticketId: string | null;
  rating: number;
  reviewText: string | null;
  isPublic: boolean;
  isVerified: boolean;
  status: RatingStatus;
  flaggedReason: string | null;
  moderatedBy: string | null;
  moderatedAt: string | null;
  moderationNotes: string | null;
  responseText: string | null;
  responseBy: string | null;
  responseAt: string | null;
  servicesPerformed: string[];
  serviceDate: string | null;
  source: RatingSource;
  createdAt: string;
  updatedAt: string;
}

/**
 * Rating aggregates for a staff member
 */
export interface StaffRatingAggregates {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}

/**
 * Convert Supabase StaffRatingRow to app StaffRating type
 */
export function toStaffRating(row: StaffRatingRow): StaffRating {
  return {
    id: row.id,
    storeId: row.store_id,
    staffId: row.staff_id,
    clientId: row.client_id,
    clientName: row.client_name,
    appointmentId: row.appointment_id,
    ticketId: row.ticket_id,
    rating: row.rating,
    reviewText: row.review_text,
    isPublic: row.is_public,
    isVerified: row.is_verified,
    status: row.status,
    flaggedReason: row.flagged_reason,
    moderatedBy: row.moderated_by,
    moderatedAt: row.moderated_at,
    moderationNotes: row.moderation_notes,
    responseText: row.response_text,
    responseBy: row.response_by,
    responseAt: row.response_at,
    servicesPerformed: row.services_performed || [],
    serviceDate: row.service_date,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convert app StaffRating to Supabase StaffRatingInsert
 */
export function toStaffRatingInsert(
  rating: Omit<StaffRating, 'id' | 'createdAt' | 'updatedAt'>,
  storeId?: string
): Omit<StaffRatingInsert, 'store_id'> & { store_id?: string } {
  return {
    store_id: storeId || rating.storeId,
    staff_id: rating.staffId,
    client_id: rating.clientId || null,
    client_name: rating.clientName || null,
    appointment_id: rating.appointmentId || null,
    ticket_id: rating.ticketId || null,
    rating: rating.rating,
    review_text: rating.reviewText || null,
    is_public: rating.isPublic ?? true,
    is_verified: rating.isVerified ?? false,
    status: rating.status || 'active',
    flagged_reason: rating.flaggedReason || null,
    moderated_by: rating.moderatedBy || null,
    moderated_at: rating.moderatedAt || null,
    moderation_notes: rating.moderationNotes || null,
    response_text: rating.responseText || null,
    response_by: rating.responseBy || null,
    response_at: rating.responseAt || null,
    services_performed: rating.servicesPerformed?.length ? rating.servicesPerformed : null,
    service_date: rating.serviceDate || null,
    source: rating.source || 'in_app',
  };
}

/**
 * Convert partial StaffRating updates to Supabase StaffRatingUpdate
 */
export function toStaffRatingUpdate(updates: Partial<StaffRating>): StaffRatingUpdate {
  const result: StaffRatingUpdate = {};

  if (updates.rating !== undefined) {
    result.rating = updates.rating;
  }
  if (updates.reviewText !== undefined) {
    result.review_text = updates.reviewText || null;
  }
  if (updates.isPublic !== undefined) {
    result.is_public = updates.isPublic;
  }
  if (updates.isVerified !== undefined) {
    result.is_verified = updates.isVerified;
  }
  if (updates.status !== undefined) {
    result.status = updates.status;
  }
  if (updates.flaggedReason !== undefined) {
    result.flagged_reason = updates.flaggedReason || null;
  }
  if (updates.moderatedBy !== undefined) {
    result.moderated_by = updates.moderatedBy || null;
  }
  if (updates.moderatedAt !== undefined) {
    result.moderated_at = updates.moderatedAt || null;
  }
  if (updates.moderationNotes !== undefined) {
    result.moderation_notes = updates.moderationNotes || null;
  }
  if (updates.responseText !== undefined) {
    result.response_text = updates.responseText || null;
  }
  if (updates.responseBy !== undefined) {
    result.response_by = updates.responseBy || null;
  }
  if (updates.responseAt !== undefined) {
    result.response_at = updates.responseAt || null;
  }
  if (updates.servicesPerformed !== undefined) {
    result.services_performed = updates.servicesPerformed?.length ? updates.servicesPerformed : null;
  }
  if (updates.serviceDate !== undefined) {
    result.service_date = updates.serviceDate || null;
  }

  return result;
}

/**
 * Convert array of StaffRatingRows to StaffRating
 */
export function toStaffRatings(rows: StaffRatingRow[]): StaffRating[] {
  return rows.map(toStaffRating);
}

/**
 * Get star display string
 */
export function getStarDisplay(rating: number): string {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return '★'.repeat(fullStars) + (hasHalf ? '½' : '') + '☆'.repeat(emptyStars);
}

/**
 * Get rating color class
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
 * Get source display info
 */
export function getSourceDisplay(source: RatingSource): { label: string; icon: string } {
  const sources: Record<RatingSource, { label: string; icon: string }> = {
    in_app: { label: 'In-App', icon: '📱' },
    online_booking: { label: 'Online Booking', icon: '🌐' },
    google: { label: 'Google', icon: '🔍' },
    yelp: { label: 'Yelp', icon: '🟡' },
    imported: { label: 'Imported', icon: '📥' },
  };
  return sources[source] || { label: source, icon: '📝' };
}

/**
 * Get status display info
 */
export function getStatusDisplay(status: RatingStatus): { label: string; color: string } {
  const statuses: Record<RatingStatus, { label: string; color: string }> = {
    active: { label: 'Active', color: 'text-emerald-600' },
    hidden: { label: 'Hidden', color: 'text-gray-500' },
    flagged: { label: 'Flagged', color: 'text-amber-600' },
    removed: { label: 'Removed', color: 'text-red-600' },
    pending_review: { label: 'Pending Review', color: 'text-blue-600' },
  };
  return statuses[status] || { label: status, color: 'text-gray-400' };
}
