import { useState, useEffect } from "react";
import { DollarSign, ShoppingCart, Users, Calendar, TrendingUp, Package } from "lucide-react";
import { DetailedMetricCard } from "@/components/admin/dashboard/DetailedMetricCard";
import { RevenueChart } from "@/components/admin/dashboard/RevenueChart";
import { ActivityFeed } from "@/components/admin/dashboard/ActivityFeed";
import { QuickActions } from "@/components/admin/dashboard/QuickActions";

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    todayRevenue: 2450,
    activeBookings: 12,
    totalCustomers: 350,
    pendingOrders: 8,
    totalRevenue: 125430,
    avgOrderValue: 87.50,
    completedBookings: 142
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your salon management dashboard</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DetailedMetricCard
          title="Today's Revenue"
          value={metrics.todayRevenue}
          icon={DollarSign}
          prefix="$"
          trend={{ value: 12, positive: true }}
        />
        <DetailedMetricCard
          title="Active Bookings"
          value={metrics.activeBookings}
          icon={Calendar}
          trend={{ value: 8, positive: true }}
        />
        <DetailedMetricCard
          title="Total Customers"
          value={metrics.totalCustomers}
          icon={Users}
          trend={{ value: 15, positive: true }}
        />
        <DetailedMetricCard
          title="Pending Orders"
          value={metrics.pendingOrders}
          icon={Package}
          trend={{ value: 4, positive: false }}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <DetailedMetricCard
          title="Total Revenue"
          value={metrics.totalRevenue}
          icon={TrendingUp}
          prefix="$"
          className="md:col-span-1"
        />
        <DetailedMetricCard
          title="Avg Order Value"
          value={metrics.avgOrderValue.toFixed(2)}
          icon={ShoppingCart}
          prefix="$"
          className="md:col-span-1"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <QuickActions />
      </div>

      <ActivityFeed />
    </div>
  );
};

export default Dashboard;
