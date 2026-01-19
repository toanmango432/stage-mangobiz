/**
 * Performance Operations
 * Aggregates real data from transactions, tickets, and appointments
 * to calculate staff performance metrics.
 */

import { supabase } from '@/services/supabase/client';
import { measureAsync } from '@/utils';
import type {
  PerformancePeriod,
  PerformanceMetrics,
  Achievement,
  ReviewSummary,
  StaffReview,
} from '@/types/performance';

// ============================================
// TYPES
// ============================================

interface DateRange {
  start: Date;
  end: Date;
}

// Note: StaffTransactionSummary interface reserved for future use in batch processing
// interface StaffTransactionSummary {
//   staffId: string;
//   totalRevenue: number;
//   serviceRevenue: number;
//   productRevenue: number;
//   tipRevenue: number;
//   servicesCompleted: number;
//   ticketCount: number;
//   clientIds: Set<string>;
//   newClientIds: Set<string>;
// }

// ============================================
// DATE UTILITIES
// ============================================

/**
 * Get date range for a given period
 */
export function getDateRange(period: PerformancePeriod, referenceDate: Date = new Date()): DateRange {
  const start = new Date(referenceDate);
  const end = new Date(referenceDate);

  switch (period) {
    case 'daily':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'weekly':
      // Start of week (Sunday)
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

// ============================================
// PERFORMANCE METRICS
// ============================================

/**
 * Fetch performance metrics for a staff member
 */
export async function getStaffPerformanceMetrics(
  storeId: string,
  staffId: string,
  period: PerformancePeriod,
  referenceDate: Date = new Date()
): Promise<PerformanceMetrics> {
  return measureAsync('performanceDB.getStaffPerformanceMetrics', async () => {
    const { start, end } = getDateRange(period, referenceDate);

  // Fetch tickets completed by this staff member
  const { data: tickets, error: ticketsError } = await supabase
    .from('tickets')
    .select('id, client_id, client_name, subtotal, tax, tip, total, services, status, created_at')
    .eq('store_id', storeId)
    .eq('staff_id', staffId)
    .eq('status', 'completed')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  if (ticketsError) {
    console.error('Error fetching tickets:', ticketsError);
  }

  const ticketData = tickets || [];

  // Calculate metrics from tickets
  let totalRevenue = 0;
  let serviceRevenue = 0;
  let productRevenue = 0;
  let tipRevenue = 0;
  let servicesCompleted = 0;
  const clientIds = new Set<string>();
  const newClientIds = new Set<string>();

  for (const ticket of ticketData) {
    totalRevenue += ticket.total || 0;
    serviceRevenue += ticket.subtotal || 0;
    tipRevenue += ticket.tip || 0;

    // Count services from ticket
    if (Array.isArray(ticket.services)) {
      servicesCompleted += ticket.services.length;
    }

    // Track unique clients
    if (ticket.client_id) {
      clientIds.add(ticket.client_id);
    }
  }

  // Get product sales from transactions
  const { data: transactions, error: transError } = await supabase
    .from('transactions')
    .select('total, tip, type, staff_id')
    .eq('store_id', storeId)
    .eq('staff_id', staffId)
    .eq('status', 'completed')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  if (!transError && transactions) {
    for (const tx of transactions) {
      if (tx.type === 'product_sale') {
        productRevenue += tx.total || 0;
      }
    }
  }

  // Check for new clients (first visit in this period) - batch query instead of N+1
  if (clientIds.size > 0) {
    const clientIdArray = Array.from(clientIds);
    const { data: existingClientVisits, error: prevError } = await supabase
      .from('tickets')
      .select('client_id')
      .eq('store_id', storeId)
      .in('client_id', clientIdArray)
      .eq('status', 'completed')
      .lt('created_at', start.toISOString());

    if (!prevError) {
      // Build set of clients who have previous visits
      const clientsWithPreviousVisits = new Set<string>(
        (existingClientVisits || []).map(ticket => ticket.client_id).filter(Boolean)
      );

      // New clients are those in clientIds but NOT in clientsWithPreviousVisits
      for (const clientId of clientIds) {
        if (!clientsWithPreviousVisits.has(clientId)) {
          newClientIds.add(clientId);
        }
      }
    }
  }

  // Calculate average ticket
  const averageTicket = ticketData.length > 0 ? totalRevenue / ticketData.length : 0;

  // Calculate rebooking rate (clients who have future appointments)
  let rebookingRate = 0;
  if (clientIds.size > 0) {
    const { data: futureAppointments, error: futureError } = await supabase
      .from('appointments')
      .select('client_id')
      .eq('store_id', storeId)
      .eq('staff_id', staffId)
      .in('client_id', Array.from(clientIds))
      .gt('scheduled_start_time', end.toISOString())
      .eq('status', 'booked');

    if (!futureError && futureAppointments) {
      const rebookedClients = new Set(futureAppointments.map(a => a.client_id));
      rebookingRate = (rebookedClients.size / clientIds.size) * 100;
    }
  }

  // Get utilization rate from timesheets
  let utilizationRate = 0;
  const { data: timesheets, error: tsError } = await supabase
    .from('timesheets')
    .select('actual_clock_in, actual_clock_out, scheduled_start, scheduled_end')
    .eq('store_id', storeId)
    .eq('staff_id', staffId)
    .gte('date', start.toISOString().split('T')[0])
    .lte('date', end.toISOString().split('T')[0]);

  if (!tsError && timesheets && timesheets.length > 0) {
    let totalScheduledMinutes = 0;
    let totalWorkedMinutes = 0;

    for (const ts of timesheets) {
      if (ts.scheduled_start && ts.scheduled_end) {
        const scheduled = (new Date(ts.scheduled_end).getTime() - new Date(ts.scheduled_start).getTime()) / 60000;
        totalScheduledMinutes += scheduled;
      }
      if (ts.actual_clock_in && ts.actual_clock_out) {
        const worked = (new Date(ts.actual_clock_out).getTime() - new Date(ts.actual_clock_in).getTime()) / 60000;
        totalWorkedMinutes += worked;
      }
    }

    if (totalScheduledMinutes > 0) {
      utilizationRate = (totalWorkedMinutes / totalScheduledMinutes) * 100;
    }
  }

  // Get reviews for rating
  const { data: reviews, error: reviewError } = await supabase
    .from('staff_reviews')
    .select('rating')
    .eq('staff_id', staffId)
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  let averageRating = 0;
  let totalReviews = 0;
  let fiveStarReviews = 0;

  if (!reviewError && reviews && reviews.length > 0) {
    totalReviews = reviews.length;
    const ratingSum = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    averageRating = ratingSum / reviews.length;
    fiveStarReviews = reviews.filter(r => r.rating === 5).length;
  }

  // Calculate retail attach rate
  const retailAttachRate = ticketData.length > 0
    ? (ticketData.filter(t => t.services?.some((s: any) => s.type === 'product')).length / ticketData.length) * 100
    : 0;

    return {
      periodType: period,
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      totalRevenue,
      serviceRevenue,
      productRevenue,
      tipRevenue,
      servicesCompleted,
      averageTicket,
      utilizationRate,
      totalClients: clientIds.size,
      newClients: newClientIds.size,
      returningClients: clientIds.size - newClientIds.size,
      rebookingRate,
      retailSales: productRevenue,
      retailUnits: 0, // Would need product line items to calculate
      retailAttachRate,
      averageRating,
      totalReviews,
      fiveStarReviews,
    };
  });
}

// ============================================
// ACHIEVEMENTS
// ============================================

/**
 * Get achievements for a staff member
 */
export async function getStaffAchievements(
  storeId: string,
  staffId: string
): Promise<Achievement[]> {
  const achievements: Achievement[] = [];
  const now = new Date();

  // Get monthly metrics to check for achievements
  const monthlyMetrics = await getStaffPerformanceMetrics(storeId, staffId, 'monthly', now);

  // Check for top performer (compare with other staff)
  const { data: allStaffMetrics, error: staffError } = await supabase
    .from('tickets')
    .select('staff_id, total')
    .eq('store_id', storeId)
    .eq('status', 'completed')
    .gte('created_at', getDateRange('monthly', now).start.toISOString())
    .lte('created_at', getDateRange('monthly', now).end.toISOString());

  if (!staffError && allStaffMetrics) {
    const staffRevenue: Record<string, number> = {};
    for (const ticket of allStaffMetrics) {
      if (ticket.staff_id) {
        staffRevenue[ticket.staff_id] = (staffRevenue[ticket.staff_id] || 0) + (ticket.total || 0);
      }
    }

    const sortedStaff = Object.entries(staffRevenue).sort((a, b) => b[1] - a[1]);
    if (sortedStaff.length > 0 && sortedStaff[0][0] === staffId) {
      achievements.push({
        id: `top-performer-${now.getMonth()}-${now.getFullYear()}`,
        type: 'top_performer',
        name: 'Top Performer',
        description: `Highest revenue in ${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        icon: '🌟',
        earnedAt: now.toISOString(),
        period: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        value: monthlyMetrics.totalRevenue,
      });
    }
  }

  // Check for perfect rating
  if (monthlyMetrics.averageRating >= 4.9 && monthlyMetrics.totalReviews >= 10) {
    achievements.push({
      id: `perfect-rating-${now.getMonth()}-${now.getFullYear()}`,
      type: 'perfect_rating',
      name: 'Perfect Rating',
      description: `Maintained ${monthlyMetrics.averageRating.toFixed(1)} rating with ${monthlyMetrics.totalReviews} reviews`,
      icon: '💯',
      earnedAt: now.toISOString(),
      value: monthlyMetrics.averageRating,
    });
  }

  // Check for rebooking master (80%+ rebook rate)
  if (monthlyMetrics.rebookingRate >= 80) {
    achievements.push({
      id: `rebooking-master-${now.getMonth()}-${now.getFullYear()}`,
      type: 'rebooking_master',
      name: 'Rebooking Master',
      description: `Achieved ${monthlyMetrics.rebookingRate.toFixed(0)}% rebook rate`,
      icon: '📅',
      earnedAt: now.toISOString(),
      period: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      value: monthlyMetrics.rebookingRate,
    });
  }

  // Check for new client champion
  if (monthlyMetrics.newClients >= 10) {
    achievements.push({
      id: `new-client-champion-${now.getMonth()}-${now.getFullYear()}`,
      type: 'new_client_champion',
      name: 'New Client Champion',
      description: `Brought in ${monthlyMetrics.newClients} new clients`,
      icon: '🆕',
      earnedAt: now.toISOString(),
      period: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      value: monthlyMetrics.newClients,
    });
  }

  // Check for retail star (40%+ attach rate)
  if (monthlyMetrics.retailAttachRate >= 40) {
    achievements.push({
      id: `retail-star-${now.getMonth()}-${now.getFullYear()}`,
      type: 'retail_star',
      name: 'Retail Star',
      description: `Achieved ${monthlyMetrics.retailAttachRate.toFixed(0)}% retail attach rate`,
      icon: '🛍️',
      earnedAt: now.toISOString(),
      period: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      value: monthlyMetrics.retailAttachRate,
    });
  }

  return achievements;
}

// ============================================
// REVIEWS
// ============================================

/**
 * Get review summary for a staff member
 */
export async function getStaffReviewSummary(
  staffId: string
): Promise<ReviewSummary> {
  const { data: reviews, error } = await supabase
    .from('staff_reviews')
    .select('rating, quality_rating, communication_rating, timeliness_rating, value_rating, created_at')
    .eq('staff_id', staffId)
    .order('created_at', { ascending: false });

  if (error || !reviews || reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      recentTrend: 'stable',
    };
  }

  // Calculate distribution
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let ratingSum = 0;

  for (const review of reviews) {
    const rating = Math.round(review.rating || 0);
    if (rating >= 1 && rating <= 5) {
      distribution[rating as keyof typeof distribution]++;
    }
    ratingSum += review.rating || 0;
  }

  const averageRating = reviews.length > 0 ? ratingSum / reviews.length : 0;

  // Calculate category averages
  let categoryAverages: ReviewSummary['categoryAverages'] = undefined;
  const hasCategories = reviews.some(r =>
    r.quality_rating || r.communication_rating || r.timeliness_rating || r.value_rating
  );

  if (hasCategories) {
    const catSums = { quality: 0, communication: 0, timeliness: 0, value: 0 };
    const catCounts = { quality: 0, communication: 0, timeliness: 0, value: 0 };

    for (const review of reviews) {
      if (review.quality_rating) {
        catSums.quality += review.quality_rating;
        catCounts.quality++;
      }
      if (review.communication_rating) {
        catSums.communication += review.communication_rating;
        catCounts.communication++;
      }
      if (review.timeliness_rating) {
        catSums.timeliness += review.timeliness_rating;
        catCounts.timeliness++;
      }
      if (review.value_rating) {
        catSums.value += review.value_rating;
        catCounts.value++;
      }
    }

    categoryAverages = {
      quality: catCounts.quality > 0 ? catSums.quality / catCounts.quality : 0,
      communication: catCounts.communication > 0 ? catSums.communication / catCounts.communication : 0,
      timeliness: catCounts.timeliness > 0 ? catSums.timeliness / catCounts.timeliness : 0,
      value: catCounts.value > 0 ? catSums.value / catCounts.value : 0,
    };
  }

  // Calculate trend (compare last 10 reviews to previous 10)
  let recentTrend: 'improving' | 'declining' | 'stable' = 'stable';
  if (reviews.length >= 10) {
    const recent10 = reviews.slice(0, 10);
    const previous10 = reviews.slice(10, 20);

    if (previous10.length >= 5) {
      const recentAvg = recent10.reduce((sum, r) => sum + (r.rating || 0), 0) / recent10.length;
      const previousAvg = previous10.reduce((sum, r) => sum + (r.rating || 0), 0) / previous10.length;

      if (recentAvg > previousAvg + 0.2) {
        recentTrend = 'improving';
      } else if (recentAvg < previousAvg - 0.2) {
        recentTrend = 'declining';
      }
    }
  }

  return {
    averageRating,
    totalReviews: reviews.length,
    distribution,
    recentTrend,
    categoryAverages,
  };
}

/**
 * Get recent reviews for a staff member
 */
export async function getStaffReviews(
  staffId: string,
  limit: number = 10
): Promise<StaffReview[]> {
  const { data: reviews, error } = await supabase
    .from('staff_reviews')
    .select('*')
    .eq('staff_id', staffId)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !reviews) {
    return [];
  }

  return reviews.map(r => ({
    id: r.id,
    staffId: r.staff_id,
    clientId: r.client_id,
    clientName: r.client_name || 'Anonymous',
    ticketId: r.ticket_id,
    serviceDate: r.service_date,
    rating: r.rating,
    comment: r.comment,
    categories: r.categories,
    createdAt: r.created_at,
    response: r.response,
    isPublic: r.is_public,
  }));
}

// ============================================
// EXPORTS
// ============================================

export const performanceDB = {
  getStaffPerformanceMetrics,
  getStaffAchievements,
  getStaffReviewSummary,
  getStaffReviews,
  getDateRange,
};

export default performanceDB;
