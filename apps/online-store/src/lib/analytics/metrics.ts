// Analytics Metrics Calculation
import type {
  AnalyticsEvent,
  AnalyticsMetrics,
  ConversionFunnel,
  FunnelStep,
  MetricValue,
  TimeSeriesData,
  AnalyticsReport
} from '@/types/analytics';

/**
 * Calculate metric value with comparison
 */
function calculateMetricValue(
  currentValue: number,
  previousValue: number
): MetricValue {
  const change = currentValue - previousValue;
  const changePercent = previousValue > 0 ? (change / previousValue) * 100 : 0;
  
  let trend: 'up' | 'down' | 'neutral' = 'neutral';
  if (Math.abs(changePercent) > 1) {
    trend = change > 0 ? 'up' : 'down';
  }
  
  return {
    current: currentValue,
    previous: previousValue,
    change,
    changePercent,
    trend
  };
}

/**
 * Calculate conversion rate
 */
function calculateConversionRate(completions: number, starts: number): number {
  return starts > 0 ? (completions / starts) * 100 : 0;
}

/**
 * Get events in date range
 */
function getEventsInRange(
  events: AnalyticsEvent[],
  startDate: Date,
  endDate: Date
): AnalyticsEvent[] {
  const startTs = startDate.getTime();
  const endTs = endDate.getTime();
  return events.filter(e => e.timestamp >= startTs && e.timestamp <= endTs);
}

/**
 * Calculate booking conversion metrics
 */
export function calculateBookingConversion(
  events: AnalyticsEvent[],
  currentStart: Date,
  currentEnd: Date,
  previousStart: Date,
  previousEnd: Date
): MetricValue {
  const currentEvents = getEventsInRange(events, currentStart, currentEnd);
  const previousEvents = getEventsInRange(events, previousStart, previousEnd);
  
  const currentStarts = currentEvents.filter(e => e.type === 'booking_started').length;
  const currentCompletions = currentEvents.filter(e => e.type === 'booking_completed').length;
  const currentRate = calculateConversionRate(currentCompletions, currentStarts);
  
  const previousStarts = previousEvents.filter(e => e.type === 'booking_started').length;
  const previousCompletions = previousEvents.filter(e => e.type === 'booking_completed').length;
  const previousRate = calculateConversionRate(previousCompletions, previousStarts);
  
  return calculateMetricValue(currentRate, previousRate);
}

/**
 * Calculate cart conversion metrics
 */
export function calculateCartConversion(
  events: AnalyticsEvent[],
  currentStart: Date,
  currentEnd: Date,
  previousStart: Date,
  previousEnd: Date
): MetricValue {
  const currentEvents = getEventsInRange(events, currentStart, currentEnd);
  const previousEvents = getEventsInRange(events, previousStart, previousEnd);
  
  const currentStarts = currentEvents.filter(e => e.type === 'checkout_started').length;
  const currentCompletions = currentEvents.filter(e => e.type === 'checkout_completed').length;
  const currentRate = calculateConversionRate(currentCompletions, currentStarts);
  
  const previousStarts = previousEvents.filter(e => e.type === 'checkout_started').length;
  const previousCompletions = previousEvents.filter(e => e.type === 'checkout_completed').length;
  const previousRate = calculateConversionRate(previousCompletions, previousStarts);
  
  return calculateMetricValue(currentRate, previousRate);
}

/**
 * Calculate page views
 */
export function calculatePageViews(
  events: AnalyticsEvent[],
  currentStart: Date,
  currentEnd: Date,
  previousStart: Date,
  previousEnd: Date
): MetricValue {
  const currentEvents = getEventsInRange(events, currentStart, currentEnd);
  const previousEvents = getEventsInRange(events, previousStart, previousEnd);
  
  const currentViews = currentEvents.filter(e => e.type === 'page_view').length;
  const previousViews = previousEvents.filter(e => e.type === 'page_view').length;
  
  return calculateMetricValue(currentViews, previousViews);
}

/**
 * Calculate unique visitors
 */
export function calculateUniqueVisitors(
  events: AnalyticsEvent[],
  currentStart: Date,
  currentEnd: Date,
  previousStart: Date,
  previousEnd: Date
): MetricValue {
  const currentEvents = getEventsInRange(events, currentStart, currentEnd);
  const previousEvents = getEventsInRange(events, previousStart, previousEnd);
  
  const currentSessions = new Set(currentEvents.map(e => e.sessionId)).size;
  const previousSessions = new Set(previousEvents.map(e => e.sessionId)).size;
  
  return calculateMetricValue(currentSessions, previousSessions);
}

/**
 * Calculate AI chat usage rate
 */
export function calculateAIChatUsage(
  events: AnalyticsEvent[],
  currentStart: Date,
  currentEnd: Date,
  previousStart: Date,
  previousEnd: Date
): MetricValue {
  const currentEvents = getEventsInRange(events, currentStart, currentEnd);
  const previousEvents = getEventsInRange(events, previousStart, previousEnd);
  
  const currentSessions = new Set(currentEvents.map(e => e.sessionId)).size;
  const currentChatSessions = new Set(
    currentEvents.filter(e => e.type === 'ai_chat_started').map(e => e.sessionId)
  ).size;
  const currentRate = currentSessions > 0 ? (currentChatSessions / currentSessions) * 100 : 0;
  
  const previousSessions = new Set(previousEvents.map(e => e.sessionId)).size;
  const previousChatSessions = new Set(
    previousEvents.filter(e => e.type === 'ai_chat_started').map(e => e.sessionId)
  ).size;
  const previousRate = previousSessions > 0 ? (previousChatSessions / previousSessions) * 100 : 0;
  
  return calculateMetricValue(currentRate, previousRate);
}

/**
 * Calculate promotion engagement rate
 */
export function calculatePromotionEngagement(
  events: AnalyticsEvent[],
  currentStart: Date,
  currentEnd: Date,
  previousStart: Date,
  previousEnd: Date
): MetricValue {
  const currentEvents = getEventsInRange(events, currentStart, currentEnd);
  const previousEvents = getEventsInRange(events, previousStart, previousEnd);
  
  const currentViews = currentEvents.filter(e => e.type === 'promotion_viewed').length;
  const currentClicks = currentEvents.filter(e => e.type === 'promotion_clicked').length;
  const currentRate = currentViews > 0 ? (currentClicks / currentViews) * 100 : 0;
  
  const previousViews = previousEvents.filter(e => e.type === 'promotion_viewed').length;
  const previousClicks = previousEvents.filter(e => e.type === 'promotion_clicked').length;
  const previousRate = previousViews > 0 ? (previousClicks / previousViews) * 100 : 0;
  
  return calculateMetricValue(currentRate, previousRate);
}

/**
 * Calculate announcement view rate
 */
export function calculateAnnouncementViews(
  events: AnalyticsEvent[],
  currentStart: Date,
  currentEnd: Date,
  previousStart: Date,
  previousEnd: Date
): MetricValue {
  const currentEvents = getEventsInRange(events, currentStart, currentEnd);
  const previousEvents = getEventsInRange(events, previousStart, previousEnd);
  
  const currentSessions = new Set(currentEvents.map(e => e.sessionId)).size;
  const currentViewSessions = new Set(
    currentEvents.filter(e => e.type === 'announcement_viewed').map(e => e.sessionId)
  ).size;
  const currentRate = currentSessions > 0 ? (currentViewSessions / currentSessions) * 100 : 0;
  
  const previousSessions = new Set(previousEvents.map(e => e.sessionId)).size;
  const previousViewSessions = new Set(
    previousEvents.filter(e => e.type === 'announcement_viewed').map(e => e.sessionId)
  ).size;
  const previousRate = previousSessions > 0 ? (previousViewSessions / previousSessions) * 100 : 0;
  
  return calculateMetricValue(currentRate, previousRate);
}

/**
 * Calculate total revenue
 */
export function calculateTotalRevenue(
  events: AnalyticsEvent[],
  currentStart: Date,
  currentEnd: Date,
  previousStart: Date,
  previousEnd: Date
): MetricValue {
  const currentEvents = getEventsInRange(events, currentStart, currentEnd);
  const previousEvents = getEventsInRange(events, previousStart, previousEnd);
  
  const currentRevenue = currentEvents
    .filter(e => e.type === 'booking_completed' || e.type === 'checkout_completed')
    .reduce((sum, e) => sum + (e.metadata?.revenue || 0), 0);
  
  const previousRevenue = previousEvents
    .filter(e => e.type === 'booking_completed' || e.type === 'checkout_completed')
    .reduce((sum, e) => sum + (e.metadata?.revenue || 0), 0);
  
  return calculateMetricValue(currentRevenue, previousRevenue);
}

/**
 * Calculate booking funnel
 */
export function calculateBookingFunnel(events: AnalyticsEvent[]): ConversionFunnel {
  const started = events.filter(e => e.type === 'booking_started').length;
  const serviceSelected = events.filter(
    e => e.type === 'booking_step_completed' && e.metadata?.step === 'service'
  ).length;
  const dateSelected = events.filter(
    e => e.type === 'booking_step_completed' && e.metadata?.step === 'datetime'
  ).length;
  const completed = events.filter(e => e.type === 'booking_completed').length;
  
  const steps: FunnelStep[] = [
    {
      name: 'Started',
      eventType: 'booking_started',
      count: started,
      dropoffRate: 0,
      conversionRate: 100
    },
    {
      name: 'Service Selected',
      eventType: 'booking_step_completed',
      count: serviceSelected,
      dropoffRate: started > 0 ? ((started - serviceSelected) / started) * 100 : 0,
      conversionRate: started > 0 ? (serviceSelected / started) * 100 : 0
    },
    {
      name: 'Date Selected',
      eventType: 'booking_step_completed',
      count: dateSelected,
      dropoffRate: serviceSelected > 0 ? ((serviceSelected - dateSelected) / serviceSelected) * 100 : 0,
      conversionRate: started > 0 ? (dateSelected / started) * 100 : 0
    },
    {
      name: 'Completed',
      eventType: 'booking_completed',
      count: completed,
      dropoffRate: dateSelected > 0 ? ((dateSelected - completed) / dateSelected) * 100 : 0,
      conversionRate: started > 0 ? (completed / started) * 100 : 0
    }
  ];
  
  return {
    name: 'Booking Flow',
    steps,
    totalEntries: started,
    totalCompletions: completed,
    conversionRate: started > 0 ? (completed / started) * 100 : 0
  };
}

/**
 * Calculate checkout funnel
 */
export function calculateCheckoutFunnel(events: AnalyticsEvent[]): ConversionFunnel {
  const started = events.filter(e => e.type === 'checkout_started').length;
  const completed = events.filter(e => e.type === 'checkout_completed').length;
  
  const steps: FunnelStep[] = [
    {
      name: 'Started',
      eventType: 'checkout_started',
      count: started,
      dropoffRate: 0,
      conversionRate: 100
    },
    {
      name: 'Completed',
      eventType: 'checkout_completed',
      count: completed,
      dropoffRate: started > 0 ? ((started - completed) / started) * 100 : 0,
      conversionRate: started > 0 ? (completed / started) * 100 : 0
    }
  ];
  
  return {
    name: 'Checkout Flow',
    steps,
    totalEntries: started,
    totalCompletions: completed,
    conversionRate: started > 0 ? (completed / started) * 100 : 0
  };
}

/**
 * Generate time series data
 */
export function generateTimeSeries(
  events: AnalyticsEvent[],
  startDate: Date,
  endDate: Date,
  eventType?: string,
  interval: 'day' | 'week' | 'month' = 'day'
): TimeSeriesData[] {
  const result: TimeSeriesData[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const nextDate = new Date(current);
    if (interval === 'day') {
      nextDate.setDate(nextDate.getDate() + 1);
    } else if (interval === 'week') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }
    
    const periodEvents = events.filter(e => {
      const eventDate = new Date(e.timestamp);
      return eventDate >= current && eventDate < nextDate;
    });
    
    const filteredEvents = eventType
      ? periodEvents.filter(e => e.type === eventType)
      : periodEvents;
    
    result.push({
      date: current.toISOString().split('T')[0],
      value: filteredEvents.length,
      label: current.toLocaleDateString()
    });
    
    current.setTime(nextDate.getTime());
  }
  
  return result;
}

/**
 * Generate complete analytics report
 */
export function generateAnalyticsReport(
  events: AnalyticsEvent[],
  period: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'week'
): AnalyticsReport {
  const now = new Date();
  let currentStart = new Date();
  let currentEnd = now;
  let previousStart = new Date();
  let previousEnd = new Date();
  
  // Calculate date ranges based on period
  switch (period) {
    case 'day':
      currentStart.setDate(now.getDate() - 1);
      previousStart.setDate(now.getDate() - 2);
      previousEnd.setDate(now.getDate() - 1);
      break;
    case 'week':
      currentStart.setDate(now.getDate() - 7);
      previousStart.setDate(now.getDate() - 14);
      previousEnd.setDate(now.getDate() - 7);
      break;
    case 'month':
      currentStart.setMonth(now.getMonth() - 1);
      previousStart.setMonth(now.getMonth() - 2);
      previousEnd.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      currentStart.setMonth(now.getMonth() - 3);
      previousStart.setMonth(now.getMonth() - 6);
      previousEnd.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      currentStart.setFullYear(now.getFullYear() - 1);
      previousStart.setFullYear(now.getFullYear() - 2);
      previousEnd.setFullYear(now.getFullYear() - 1);
      break;
  }
  
  const metrics: AnalyticsMetrics = {
    bookingConversionRate: calculateBookingConversion(events, currentStart, currentEnd, previousStart, previousEnd),
    cartConversionRate: calculateCartConversion(events, currentStart, currentEnd, previousStart, previousEnd),
    membershipConversionRate: calculateMetricValue(0, 0), // TODO: Implement
    totalPageViews: calculatePageViews(events, currentStart, currentEnd, previousStart, previousEnd),
    uniqueVisitors: calculateUniqueVisitors(events, currentStart, currentEnd, previousStart, previousEnd),
    aiChatUsageRate: calculateAIChatUsage(events, currentStart, currentEnd, previousStart, previousEnd),
    avgSessionDuration: calculateMetricValue(0, 0), // TODO: Implement
    totalRevenue: calculateTotalRevenue(events, currentStart, currentEnd, previousStart, previousEnd),
    avgOrderValue: calculateMetricValue(0, 0), // TODO: Implement
    promotionEngagementRate: calculatePromotionEngagement(events, currentStart, currentEnd, previousStart, previousEnd),
    announcementViewRate: calculateAnnouncementViews(events, currentStart, currentEnd, previousStart, previousEnd)
  };
  
  const currentEvents = getEventsInRange(events, currentStart, currentEnd);
  
  return {
    period,
    startDate: currentStart.toISOString(),
    endDate: currentEnd.toISOString(),
    metrics,
    funnels: [
      calculateBookingFunnel(currentEvents),
      calculateCheckoutFunnel(currentEvents)
    ],
    timeSeries: {
      pageViews: generateTimeSeries(currentEvents, currentStart, currentEnd, 'page_view'),
      conversions: generateTimeSeries(currentEvents, currentStart, currentEnd, 'booking_completed'),
      revenue: [] // TODO: Implement revenue time series
    }
  };
}

