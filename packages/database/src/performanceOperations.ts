/**
 * Performance Operations
 * Aggregates real data from transactions, tickets, and appointments
 * to calculate staff performance metrics.
 * 
 * NOTE: This module requires a Supabase client connection.
 * The implementations below are stubs that return empty data.
 * Replace with actual Supabase client when available.
 */

export type PerformancePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface PerformanceMetrics {
  periodType: PerformancePeriod;
  periodStart: string;
  periodEnd: string;
  totalRevenue: number;
  serviceRevenue: number;
  productRevenue: number;
  tipRevenue: number;
  servicesCompleted: number;
  averageTicket: number;
  utilizationRate: number;
  totalClients: number;
  newClients: number;
  returningClients: number;
  rebookingRate: number;
  retailSales: number;
  retailUnits: number;
  retailAttachRate: number;
  averageRating: number;
  totalReviews: number;
  fiveStarReviews: number;
}

export type AchievementType =
  | 'top_performer'
  | 'new_client_champion'
  | 'rebooking_master'
  | 'perfect_rating'
  | 'goal_crusher'
  | 'retail_star'
  | 'service_speed'
  | 'consistency'
  | 'milestone';

export interface Achievement {
  id: string;
  type: AchievementType;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
  period?: string;
  value?: number;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  recentTrend: 'improving' | 'declining' | 'stable';
  categoryAverages?: {
    quality: number;
    communication: number;
    timeliness: number;
    value: number;
  };
}

export interface StaffReview {
  id: string;
  staffId: string;
  clientId: string;
  clientName: string;
  ticketId?: string;
  serviceDate: string;
  rating: number;
  comment?: string;
  categories?: Array<{
    category: 'quality' | 'communication' | 'timeliness' | 'value';
    rating: number;
  }>;
  createdAt: string;
  response?: {
    text: string;
    respondedAt: string;
    respondedBy: string;
  };
  isPublic: boolean;
}

interface DateRange {
  start: Date;
  end: Date;
}

export function getDateRange(period: PerformancePeriod, referenceDate: Date = new Date()): DateRange {
  const start = new Date(referenceDate);
  const end = new Date(referenceDate);

  switch (period) {
    case 'daily':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'weekly':
      const dayOfWeek = start.getDay();
      start.setDate(start.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    case 'monthly':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'yearly':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
}

function createEmptyMetrics(period: PerformancePeriod, start: Date, end: Date): PerformanceMetrics {
  return {
    periodType: period,
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
    totalRevenue: 0,
    serviceRevenue: 0,
    productRevenue: 0,
    tipRevenue: 0,
    servicesCompleted: 0,
    averageTicket: 0,
    utilizationRate: 0,
    totalClients: 0,
    newClients: 0,
    returningClients: 0,
    rebookingRate: 0,
    retailSales: 0,
    retailUnits: 0,
    retailAttachRate: 0,
    averageRating: 0,
    totalReviews: 0,
    fiveStarReviews: 0,
  };
}

export async function getStaffPerformanceMetrics(
  _storeId: string,
  _staffId: string,
  period: PerformancePeriod,
  referenceDate: Date = new Date()
): Promise<PerformanceMetrics> {
  const { start, end } = getDateRange(period, referenceDate);
  return createEmptyMetrics(period, start, end);
}

export async function getStaffAchievements(
  _storeId: string,
  _staffId: string
): Promise<Achievement[]> {
  return [];
}

export async function getStaffReviewSummary(
  _staffId: string
): Promise<ReviewSummary> {
  return {
    averageRating: 0,
    totalReviews: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    recentTrend: 'stable',
  };
}

export async function getStaffReviews(
  _staffId: string,
  _limit: number = 10
): Promise<StaffReview[]> {
  return [];
}

export const performanceDB = {
  getStaffPerformanceMetrics,
  getStaffAchievements,
  getStaffReviewSummary,
  getStaffReviews,
  getDateRange,
};

export default performanceDB;
