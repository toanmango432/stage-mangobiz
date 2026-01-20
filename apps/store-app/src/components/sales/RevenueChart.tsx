import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import type { Ticket } from '../../types';

interface RevenueChartProps {
  tickets: Ticket[];
}

type ChartView = 'daily' | 'weekly' | 'monthly';

export function RevenueChart({ tickets }: RevenueChartProps) {
  const [view, setView] = useState<ChartView>('daily');

  const chartData = useMemo(() => {
    // Filter only completed tickets
    const completedTickets = tickets.filter(t => t.status === 'completed');

    if (view === 'daily') {
      // Group by day for last 7 days
      const dailyData: { [key: string]: number } = {};
      const today = new Date();

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dailyData[dateStr] = 0;
      }

      completedTickets.forEach(ticket => {
        const date = new Date(ticket.createdAt);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (dailyData[dateStr] !== undefined) {
          dailyData[dateStr] += ticket.total;
        }
      });

      return Object.entries(dailyData).map(([date, revenue]) => ({
        date,
        revenue: Math.round(revenue * 100) / 100
      }));
    } else if (view === 'weekly') {
      // Group by week for last 4 weeks
      const weeklyData: { [key: string]: number } = {};
      const today = new Date();

      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + 7 * i));
        const weekLabel = `Week ${4 - i}`;
        weeklyData[weekLabel] = 0;
      }

      completedTickets.forEach(ticket => {
        const date = new Date(ticket.createdAt);
        const today = new Date();
        const daysSinceToday = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        const weekIndex = Math.floor(daysSinceToday / 7);

        if (weekIndex >= 0 && weekIndex < 4) {
          const weekLabel = `Week ${4 - weekIndex}`;
          if (weeklyData[weekLabel] !== undefined) {
            weeklyData[weekLabel] += ticket.total;
          }
        }
      });

      return Object.entries(weeklyData).map(([week, revenue]) => ({
        date: week,
        revenue: Math.round(revenue * 100) / 100
      }));
    } else {
      // Monthly - last 6 months
      const monthlyData: { [key: string]: number } = {};
      const today = new Date();

      for (let i = 5; i >= 0; i--) {
        const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthStr = month.toLocaleDateString('en-US', { month: 'short' });
        monthlyData[monthStr] = 0;
      }

      completedTickets.forEach(ticket => {
        const date = new Date(ticket.createdAt);
        const monthStr = date.toLocaleDateString('en-US', { month: 'short' });
        if (monthlyData[monthStr] !== undefined) {
          monthlyData[monthStr] += ticket.total;
        }
      });

      return Object.entries(monthlyData).map(([month, revenue]) => ({
        date: month,
        revenue: Math.round(revenue * 100) / 100
      }));
    }
  }, [tickets, view]);

  const totalRevenue = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.revenue, 0);
  }, [chartData]);

  const avgRevenue = useMemo(() => {
    return chartData.length > 0 ? totalRevenue / chartData.length : 0;
  }, [totalRevenue, chartData]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Revenue Overview</h3>
          </div>
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total</p>
              <p className="text-3xl font-bold text-gray-900 tabular-nums">${totalRevenue.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Average</p>
              <p className="text-2xl font-bold text-gray-700 tabular-nums">${avgRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setView('daily')}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
              view === 'daily'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setView('weekly')}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
              view === 'weekly'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setView('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
              view === 'monthly'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickLine={false}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickLine={false}
              tickFormatter={(value: number) => `$${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
              labelStyle={{ color: '#111827', fontWeight: 600 }}
            />
            <Bar
              dataKey="revenue"
              fill="url(#colorRevenue)"
              radius={[8, 8, 0, 0]}
              maxBarSize={60}
            />
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.8} />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Period Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-gray-700 font-medium">
            {view === 'daily' && 'Last 7 days'}
            {view === 'weekly' && 'Last 4 weeks'}
            {view === 'monthly' && 'Last 6 months'}
          </span>
          <span className="text-gray-400">•</span>
          <span className="font-semibold text-gray-900">
            {chartData.filter(d => d.revenue > 0).length} {view === 'daily' ? 'days' : view === 'weekly' ? 'weeks' : 'months'} with sales
          </span>
        </div>
      </div>
    </div>
  );
}
