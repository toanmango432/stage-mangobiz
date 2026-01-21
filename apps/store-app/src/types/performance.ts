/**
 * Performance Types - Phase 4: Staff Experience
 *
 * Provides types for staff performance tracking, goals, metrics,
 * achievements, and reviews.
 *
 * @see docs/product/PRD-Team-Module.md Section 6.9
 */

// ============================================
// PERFORMANCE PERIODS
// ============================================

/**
 * Time period for performance metrics.
 */
export type PerformancePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

// ============================================
// PERFORMANCE GOALS
// ============================================

/**
 * Performance goals set for a staff member.
 * All values are optional - only set goals that apply.
 */
export interface PerformanceGoals {
  // Revenue Goals
  dailyRevenueTarget?: number;
  weeklyRevenueTarget?: number;
  monthlyRevenueTarget?: number;

  // Service Goals
  dailyServicesTarget?: number;
  weeklyServicesTarget?: number;
  averageTicketTarget?: number;

  // Client Goals
  newClientTarget?: number;          // Per month
  rebookingRateTarget?: number;      // Percentage (0-100)
  clientRetentionTarget?: number;    // Percentage (0-100)

  // Product/Retail Goals
  retailSalesTarget?: number;        // Monthly
  retailAttachRateTarget?: number;   // Percentage of tickets with retail

  // Quality Goals
  ratingTarget?: number;             // Minimum star rating (1-5)
}

// ============================================
// PERFORMANCE METRICS
// ============================================

/**
 * Actual performance metrics for a given period.
 */
export interface PerformanceMetrics {
  // Period info
  periodType: PerformancePeriod;
  periodStart: string;
  periodEnd: string;

  // Revenue Metrics
  totalRevenue: number;
  serviceRevenue: number;
  productRevenue: number;
  tipRevenue: number;

  // Service Metrics
  servicesCompleted: number;
  averageTicket: number;
  utilizationRate: number;           // Percentage (0-100)

  // Client Metrics
  totalClients: number;
  newClients: number;
  returningClients: number;
  rebookingRate: number;             // Percentage (0-100)

  // Product Metrics
  retailSales: number;
  retailUnits: number;
  retailAttachRate: number;          // Percentage (0-100)

  // Rating Metrics
  averageRating: number;             // 1-5 scale
  totalReviews: number;
  fiveStarReviews: number;
}

/**
 * Performance summary combining goals and metrics.
 */
export interface PerformanceSummary {
  staffId: string;
  staffName: string;
  period: PerformancePeriod;
  periodLabel: string;
  goals: PerformanceGoals;
  metrics: PerformanceMetrics;
  achievements: Achievement[];
}

// ============================================
// GOAL PROGRESS
// ============================================

/**
 * Progress toward a specific goal.
 */
export interface GoalProgress {
  goalName: string;
  goalKey: keyof PerformanceGoals;
  target: number;
  actual: number;
  percentage: number;                // 0-100+
  trend: 'up' | 'down' | 'stable';
  previousValue?: number;
  unit: 'currency' | 'count' | 'percentage' | 'rating';
  isOnTrack: boolean;
}

// ============================================
// ACHIEVEMENTS & BADGES
// ============================================

/**
 * Achievement badge types.
 */
export type AchievementType =
  | 'top_performer'      // Highest revenue in period
  | 'new_client_champion' // Most new clients
  | 'rebooking_master'   // Highest rebook rate
  | 'perfect_rating'     // 5.0 rating with 10+ reviews
  | 'goal_crusher'       // Hit all monthly goals
  | 'retail_star'        // Highest retail attach rate
  | 'service_speed'      // Most services completed
  | 'consistency'        // On-time for X days
  | 'milestone';         // Revenue/service milestones

/**
 * Achievement badge earned by staff.
 */
export interface Achievement {
  id: string;
  type: AchievementType;
  name: string;
  description: string;
  icon: string;                      // Emoji or icon name
  earnedAt: string;
  period?: string;                   // e.g., "December 2024"
  value?: number;                    // The metric value that earned it
}

/**
 * Achievement definition (unlockable).
 */
export interface AchievementDefinition {
  type: AchievementType;
  name: string;
  description: string;
  icon: string;
  criteria: string;
  reward?: string;
}

/**
 * Progress toward unlocking an achievement.
 */
export interface AchievementProgress {
  definition: AchievementDefinition;
  currentValue: number;
  targetValue: number;
  percentage: number;
  isUnlocked: boolean;
}

// ============================================
// STAFF REVIEWS
// ============================================

/**
 * Review left by a client for a staff member.
 */
export interface StaffReview {
  id: string;
  staffId: string;
  clientId: string;
  clientName: string;
  ticketId?: string;
  serviceDate: string;
  rating: number;                    // 1-5 stars
  comment?: string;
  categories?: ReviewCategory[];     // Optional category ratings
  createdAt: string;
  response?: ReviewResponse;
  isPublic: boolean;
}

/**
 * Category-specific rating within a review.
 */
export interface ReviewCategory {
  category: 'quality' | 'communication' | 'timeliness' | 'value';
  rating: number;                    // 1-5 stars
}

/**
 * Staff response to a review.
 */
export interface ReviewResponse {
  text: string;
  respondedAt: string;
  respondedBy: string;
}

/**
 * Review statistics summary.
 */
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

// ============================================
// PORTFOLIO
// ============================================

/**
 * Portfolio item (work sample).
 */
export interface PortfolioItem {
  id: string;
  staffId: string;
  storeId?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  title?: string;
  description?: string;
  serviceId?: string;
  serviceName?: string;
  tags: string[];
  isFeatured: boolean;
  isBeforeAfter: boolean;
  beforeImageUrl?: string;
  createdAt: string;
  likes?: number;
}

// ============================================
// FACTORY FUNCTIONS
// ============================================

/**
 * Creates empty performance goals.
 */
export function createEmptyGoals(): PerformanceGoals {
  return {};
}

/**
 * Creates empty performance metrics.
 */
export function createEmptyMetrics(period: PerformancePeriod, start: string, end: string): PerformanceMetrics {
  return {
    periodType: period,
    periodStart: start,
    periodEnd: end,
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

/**
 * Achievement definitions for the system.
 */
export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    type: 'top_performer',
    name: 'Top Performer',
    description: 'Highest revenue in the month',
    icon: '🌟',
    criteria: 'Earn the most revenue among all staff in a calendar month',
    reward: 'Featured on booking page',
  },
  {
    type: 'new_client_champion',
    name: 'New Client Champion',
    description: 'Brought in the most new clients',
    icon: '🆕',
    criteria: 'Serve the most new clients in a calendar month',
    reward: 'Bonus incentive',
  },
  {
    type: 'rebooking_master',
    name: 'Rebooking Master',
    description: 'Highest rebooking rate',
    icon: '📅',
    criteria: 'Achieve 80%+ rebooking rate for the month',
    reward: 'Recognition',
  },
  {
    type: 'perfect_rating',
    name: 'Perfect Rating',
    description: 'Maintained a 5.0 star rating',
    icon: '💯',
    criteria: 'Maintain 5.0 rating with at least 10 reviews',
    reward: 'Badge on profile',
  },
  {
    type: 'goal_crusher',
    name: 'Goal Crusher',
    description: 'Hit all monthly goals',
    icon: '🎯',
    criteria: 'Achieve 100% of all set performance goals',
    reward: 'Bonus tier unlock',
  },
  {
    type: 'retail_star',
    name: 'Retail Star',
    description: 'Top retail performer',
    icon: '🛍️',
    criteria: 'Highest retail attach rate (40%+)',
    reward: 'Product discount',
  },
  {
    type: 'service_speed',
    name: 'Service Speed',
    description: 'Most services completed',
    icon: '⚡',
    criteria: 'Complete the most services in a week',
  },
  {
    type: 'consistency',
    name: 'Consistency King',
    description: 'Perfect attendance',
    icon: '👑',
    criteria: 'On-time for 30 consecutive work days',
  },
  {
    type: 'milestone',
    name: 'Milestone',
    description: 'Revenue milestone reached',
    icon: '🏆',
    criteria: 'Reach $10K, $25K, $50K, $100K revenue milestones',
  },
];

/**
 * Calculates goal progress from goals and metrics.
 */
export function calculateGoalProgress(
  goals: PerformanceGoals,
  metrics: PerformanceMetrics,
  period: PerformancePeriod
): GoalProgress[] {
  const progress: GoalProgress[] = [];

  // Revenue goal
  const revenueTarget = period === 'daily' ? goals.dailyRevenueTarget
    : period === 'weekly' ? goals.weeklyRevenueTarget
    : goals.monthlyRevenueTarget;

  if (revenueTarget) {
    progress.push({
      goalName: 'Revenue',
      goalKey: period === 'daily' ? 'dailyRevenueTarget' : period === 'weekly' ? 'weeklyRevenueTarget' : 'monthlyRevenueTarget',
      target: revenueTarget,
      actual: metrics.totalRevenue,
      percentage: Math.round((metrics.totalRevenue / revenueTarget) * 100),
      trend: 'stable',
      unit: 'currency',
      isOnTrack: metrics.totalRevenue >= revenueTarget * 0.8,
    });
  }

  // Services goal
  const servicesTarget = period === 'daily' ? goals.dailyServicesTarget : goals.weeklyServicesTarget;
  if (servicesTarget) {
    progress.push({
      goalName: 'Services',
      goalKey: period === 'daily' ? 'dailyServicesTarget' : 'weeklyServicesTarget',
      target: servicesTarget,
      actual: metrics.servicesCompleted,
      percentage: Math.round((metrics.servicesCompleted / servicesTarget) * 100),
      trend: 'stable',
      unit: 'count',
      isOnTrack: metrics.servicesCompleted >= servicesTarget * 0.8,
    });
  }

  // Average ticket goal
  if (goals.averageTicketTarget) {
    progress.push({
      goalName: 'Avg Ticket',
      goalKey: 'averageTicketTarget',
      target: goals.averageTicketTarget,
      actual: metrics.averageTicket,
      percentage: Math.round((metrics.averageTicket / goals.averageTicketTarget) * 100),
      trend: 'stable',
      unit: 'currency',
      isOnTrack: metrics.averageTicket >= goals.averageTicketTarget * 0.9,
    });
  }

  // Rating goal
  if (goals.ratingTarget) {
    progress.push({
      goalName: 'Rating',
      goalKey: 'ratingTarget',
      target: goals.ratingTarget,
      actual: metrics.averageRating,
      percentage: Math.round((metrics.averageRating / goals.ratingTarget) * 100),
      trend: 'stable',
      unit: 'rating',
      isOnTrack: metrics.averageRating >= goals.ratingTarget,
    });
  }

  // New clients goal
  if (goals.newClientTarget) {
    progress.push({
      goalName: 'New Clients',
      goalKey: 'newClientTarget',
      target: goals.newClientTarget,
      actual: metrics.newClients,
      percentage: Math.round((metrics.newClients / goals.newClientTarget) * 100),
      trend: 'stable',
      unit: 'count',
      isOnTrack: metrics.newClients >= goals.newClientTarget * 0.7,
    });
  }

  // Rebooking rate goal
  if (goals.rebookingRateTarget) {
    progress.push({
      goalName: 'Rebook Rate',
      goalKey: 'rebookingRateTarget',
      target: goals.rebookingRateTarget,
      actual: metrics.rebookingRate,
      percentage: Math.round((metrics.rebookingRate / goals.rebookingRateTarget) * 100),
      trend: 'stable',
      unit: 'percentage',
      isOnTrack: metrics.rebookingRate >= goals.rebookingRateTarget * 0.9,
    });
  }

  // Retail goal
  if (goals.retailSalesTarget) {
    progress.push({
      goalName: 'Retail Sales',
      goalKey: 'retailSalesTarget',
      target: goals.retailSalesTarget,
      actual: metrics.retailSales,
      percentage: Math.round((metrics.retailSales / goals.retailSalesTarget) * 100),
      trend: 'stable',
      unit: 'currency',
      isOnTrack: metrics.retailSales >= goals.retailSalesTarget * 0.7,
    });
  }

  return progress;
}

/**
 * Gets period label for display.
 */
export function getPeriodLabel(period: PerformancePeriod, date: Date = new Date()): string {
  switch (period) {
    case 'daily':
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    case 'weekly':
      return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    case 'monthly':
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    case 'yearly':
      return date.getFullYear().toString();
  }
}
