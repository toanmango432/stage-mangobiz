// Analytics Types and Interfaces

export type EventType =
  | 'page_view'
  | 'booking_started'
  | 'booking_step_completed'
  | 'booking_completed'
  | 'booking_abandoned'
  | 'cart_add'
  | 'cart_remove'
  | 'checkout_started'
  | 'checkout_completed'
  | 'checkout_abandoned'
  | 'membership_viewed'
  | 'membership_purchased'
  | 'gift_card_purchased'
  | 'product_viewed'
  | 'product_purchased'
  | 'promotion_viewed'
  | 'promotion_clicked'
  | 'announcement_viewed'
  | 'ai_chat_started'
  | 'ai_chat_message_sent'
  | 'search_performed'
  | 'review_submitted';

export interface AnalyticsEvent {
  id: string;
  type: EventType;
  timestamp: number;
  sessionId: string;
  userId?: string;
  metadata?: Record<string, any>;
  page?: string;
  referrer?: string;
}

export interface ConversionFunnel {
  name: string;
  steps: FunnelStep[];
  totalEntries: number;
  totalCompletions: number;
  conversionRate: number;
}

export interface FunnelStep {
  name: string;
  eventType: EventType;
  count: number;
  dropoffRate: number;
  conversionRate: number;
}

export interface MetricValue {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface AnalyticsMetrics {
  // Conversion Rates
  bookingConversionRate: MetricValue;
  cartConversionRate: MetricValue;
  membershipConversionRate: MetricValue;
  
  // Usage Stats
  totalPageViews: MetricValue;
  uniqueVisitors: MetricValue;
  aiChatUsageRate: MetricValue;
  avgSessionDuration: MetricValue;
  
  // Revenue Metrics
  totalRevenue: MetricValue;
  avgOrderValue: MetricValue;
  
  // Engagement
  promotionEngagementRate: MetricValue;
  announcementViewRate: MetricValue;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface AnalyticsReport {
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  startDate: string;
  endDate: string;
  metrics: AnalyticsMetrics;
  funnels: ConversionFunnel[];
  timeSeries: {
    pageViews: TimeSeriesData[];
    conversions: TimeSeriesData[];
    revenue: TimeSeriesData[];
  };
}

export interface AnalyticsFilter {
  startDate?: string;
  endDate?: string;
  eventType?: EventType;
  userId?: string;
  page?: string;
}

export interface SessionData {
  sessionId: string;
  userId?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  events: AnalyticsEvent[];
  pageViews: number;
  conversionEvents: number;
}

