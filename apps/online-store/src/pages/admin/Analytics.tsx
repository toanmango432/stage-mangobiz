import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  Calendar,
  MessageSquare,
  DollarSign,
  Eye,
  Megaphone
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/admin/analytics/MetricCard";
import { ConversionFunnelChart } from "@/components/admin/analytics/ConversionFunnel";
import { UsageChart } from "@/components/admin/analytics/UsageChart";
import { analyticsTracker } from "@/lib/analytics/tracker";
import { generateAnalyticsReport } from "@/lib/analytics/metrics";
import type { AnalyticsReport } from "@/types/analytics";

export default function Analytics() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('week');
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = () => {
    setLoading(true);
    try {
      const events = analyticsTracker.getEvents();
      const generatedReport = generateAnalyticsReport(events, period);
      setReport(generatedReport);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !report) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  const { metrics, funnels, timeSeries } = report;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track performance and gain insights
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={period === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('day')}
          >
            Day
          </Button>
          <Button
            variant={period === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('week')}
          >
            Week
          </Button>
          <Button
            variant={period === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('month')}
          >
            Month
          </Button>
          <Button
            variant={period === 'quarter' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('quarter')}
          >
            Quarter
          </Button>
          <Button
            variant={period === 'year' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('year')}
          >
            Year
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Booking Conversion"
          value={`${metrics.bookingConversionRate.current.toFixed(1)}%`}
          metric={metrics.bookingConversionRate}
          icon={<Calendar className="h-4 w-4" />}
          format="percentage"
        />
        
        <MetricCard
          title="Cart Conversion"
          value={`${metrics.cartConversionRate.current.toFixed(1)}%`}
          metric={metrics.cartConversionRate}
          icon={<ShoppingCart className="h-4 w-4" />}
          format="percentage"
        />
        
        <MetricCard
          title="Total Revenue"
          value={`$${metrics.totalRevenue.current.toFixed(2)}`}
          metric={metrics.totalRevenue}
          icon={<DollarSign className="h-4 w-4" />}
          format="currency"
        />
        
        <MetricCard
          title="AI Chat Usage"
          value={`${metrics.aiChatUsageRate.current.toFixed(1)}%`}
          metric={metrics.aiChatUsageRate}
          icon={<MessageSquare className="h-4 w-4" />}
          format="percentage"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Page Views"
          value={metrics.totalPageViews.current.toLocaleString()}
          metric={metrics.totalPageViews}
          icon={<Eye className="h-4 w-4" />}
        />
        
        <MetricCard
          title="Unique Visitors"
          value={metrics.uniqueVisitors.current.toLocaleString()}
          metric={metrics.uniqueVisitors}
          icon={<Users className="h-4 w-4" />}
        />
        
        <MetricCard
          title="Promotion Engagement"
          value={`${metrics.promotionEngagementRate.current.toFixed(1)}%`}
          metric={metrics.promotionEngagementRate}
          icon={<TrendingUp className="h-4 w-4" />}
          format="percentage"
        />
        
        <MetricCard
          title="Announcement Views"
          value={`${metrics.announcementViewRate.current.toFixed(1)}%`}
          metric={metrics.announcementViewRate}
          icon={<Megaphone className="h-4 w-4" />}
          format="percentage"
        />
      </div>

      {/* Tabs for detailed views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <UsageChart
              title="Page Views Over Time"
              data={timeSeries.pageViews}
              type="line"
              color="#8b5cf6"
            />
            
            <UsageChart
              title="Conversions Over Time"
              data={timeSeries.conversions}
              type="bar"
              color="#10b981"
            />
          </div>
        </TabsContent>

        <TabsContent value="conversions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {funnels.map((funnel, index) => (
              <ConversionFunnelChart key={index} funnel={funnel} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 bg-card rounded-lg border">
                <div className="text-sm text-muted-foreground">AI Chat Sessions</div>
                <div className="text-3xl font-bold mt-2">
                  {Math.round(metrics.uniqueVisitors.current * (metrics.aiChatUsageRate.current / 100))}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  of {metrics.uniqueVisitors.current} visitors
                </div>
              </div>
              
              <div className="p-6 bg-card rounded-lg border">
                <div className="text-sm text-muted-foreground">Promotion Clicks</div>
                <div className="text-3xl font-bold mt-2">
                  {Math.round(metrics.promotionEngagementRate.current)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {metrics.promotionEngagementRate.current.toFixed(1)}% engagement
                </div>
              </div>
              
              <div className="p-6 bg-card rounded-lg border">
                <div className="text-sm text-muted-foreground">Announcement Views</div>
                <div className="text-3xl font-bold mt-2">
                  {Math.round(metrics.uniqueVisitors.current * (metrics.announcementViewRate.current / 100))}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {metrics.announcementViewRate.current.toFixed(1)}% view rate
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Data Quality Notice */}
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          📊 Analytics data is stored locally and based on {period} period. 
          Data may reset when browser storage is cleared.
        </p>
      </div>
    </div>
  );
}
