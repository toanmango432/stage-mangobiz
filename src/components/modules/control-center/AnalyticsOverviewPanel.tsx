import {
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Award,
  Star,
  Target,
  BarChart3
} from 'lucide-react';

interface Metrics {
  today: {
    revenue: number;
    tickets: number;
    appointments: number;
    clients: number;
  };
  staff: {
    total: number;
    active: number;
    clockedIn: number;
  };
  week: {
    revenue: number;
    tickets: number;
  };
  month: {
    revenue: number;
    tickets: number;
  };
}

interface AnalyticsOverviewPanelProps {
  metrics: Metrics;
}

export function AnalyticsOverviewPanel({ metrics }: AnalyticsOverviewPanelProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Calculate some derived metrics
  const avgDailyRevenue = metrics.month.revenue / 30;
  const avgTicketValue = metrics.month.tickets > 0 ? metrics.month.revenue / metrics.month.tickets : 0;
  const staffUtilization = metrics.staff.total > 0 ? (metrics.staff.active / metrics.staff.total) * 100 : 0;

  // Mock growth data (in a real app, this would be calculated from historical data)
  const revenueGrowth = 12.5;
  const ticketGrowth = 8.3;
  const clientGrowth = 15.2;

  return (
    <div className="space-y-6">
      {/* Revenue Analytics */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          Revenue Analytics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="relative">
            <div className="absolute top-0 right-0">
              <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
                <TrendingUp className="w-3 h-3" />
                +{revenueGrowth}%
              </span>
            </div>
            <div className="text-sm text-gray-600 mb-2">Monthly Revenue</div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {formatCurrency(metrics.month.revenue)}
            </div>
            <div className="text-xs text-gray-500">
              {metrics.month.tickets} tickets completed
            </div>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: '75%' }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">75% of monthly goal</div>
          </div>

          <div className="relative">
            <div className="absolute top-0 right-0">
              <span className="flex items-center gap-1 text-xs font-semibold text-blue-600">
                <TrendingUp className="w-3 h-3" />
                +{ticketGrowth}%
              </span>
            </div>
            <div className="text-sm text-gray-600 mb-2">Avg Daily Revenue</div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {formatCurrency(avgDailyRevenue)}
            </div>
            <div className="text-xs text-gray-500">
              Based on last 30 days
            </div>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: '62%' }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">62% of daily target</div>
          </div>

          <div className="relative">
            <div className="absolute top-0 right-0">
              <span className="flex items-center gap-1 text-xs font-semibold text-purple-600">
                <TrendingUp className="w-3 h-3" />
                +6.2%
              </span>
            </div>
            <div className="text-sm text-gray-600 mb-2">Avg Ticket Value</div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {formatCurrency(avgTicketValue)}
            </div>
            <div className="text-xs text-gray-500">
              Per customer transaction
            </div>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full"
                style={{ width: '85%' }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">Above industry avg</div>
          </div>
        </div>
      </div>

      {/* Customer Analytics */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Customer Analytics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +{clientGrowth}%
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {metrics.today.clients}
            </div>
            <div className="text-xs text-gray-600">Clients Today</div>
          </div>

          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-5 h-5 text-green-600" />
              <span className="text-xs font-semibold text-green-600">Top 20%</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {Math.round(metrics.month.tickets * 0.2)}
            </div>
            <div className="text-xs text-gray-600">VIP Customers</div>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-5 h-5 text-purple-600" />
              <span className="text-xs font-semibold text-green-600">4.8/5.0</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {Math.round(metrics.month.tickets * 0.85)}
            </div>
            <div className="text-xs text-gray-600">Satisfied Clients</div>
          </div>

          <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5 text-orange-600" />
              <span className="text-xs font-semibold text-green-600">+8.5%</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {Math.round(metrics.month.tickets * 0.35)}
            </div>
            <div className="text-xs text-gray-600">Repeat Customers</div>
          </div>
        </div>
      </div>

      {/* Team Performance */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          Team Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">Staff Utilization</span>
              <span className="text-sm font-bold text-gray-900">
                {staffUtilization.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  staffUtilization > 80
                    ? 'bg-green-500'
                    : staffUtilization > 50
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${staffUtilization}%` }}
              />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-900">
                  {metrics.staff.total}
                </div>
                <div className="text-xs text-gray-600">Total Staff</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  {metrics.staff.clockedIn}
                </div>
                <div className="text-xs text-gray-600">Clocked In</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  {metrics.staff.active}
                </div>
                <div className="text-xs text-gray-600">Active</div>
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-600 mb-3">Top Performers</div>
            <div className="space-y-3">
              {[
                { name: 'Sarah Johnson', revenue: 4250, tickets: 28, rank: 1 },
                { name: 'Michael Chen', revenue: 3890, tickets: 25, rank: 2 },
                { name: 'Emily Davis', revenue: 3650, tickets: 23, rank: 3 }
              ].map((performer) => (
                <div
                  key={performer.rank}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      performer.rank === 1
                        ? 'bg-yellow-100 text-yellow-700'
                        : performer.rank === 2
                        ? 'bg-gray-200 text-gray-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      #{performer.rank}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {performer.name}
                      </div>
                      <div className="text-xs text-gray-600">
                        {performer.tickets} tickets
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-600">
                      {formatCurrency(performer.revenue)}
                    </div>
                    <div className="text-xs text-gray-500">this month</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Analytics */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-brand-600" />
          Appointment Analytics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-brand-50 to-brand-100 rounded-lg">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {metrics.today.appointments}
            </div>
            <div className="text-sm text-gray-600 mb-2">Today's Appointments</div>
            <div className="text-xs text-brand-600 font-semibold">+12% vs yesterday</div>
          </div>

          <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {Math.round(metrics.month.tickets * 0.92)}
            </div>
            <div className="text-sm text-gray-600 mb-2">Completion Rate</div>
            <div className="text-xs text-green-600 font-semibold">92% success</div>
          </div>

          <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {Math.round(metrics.month.tickets * 0.05)}
            </div>
            <div className="text-sm text-gray-600 mb-2">No-Shows</div>
            <div className="text-xs text-red-600 font-semibold">5% rate</div>
          </div>

          <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              28
            </div>
            <div className="text-sm text-gray-600 mb-2">Avg Wait Time</div>
            <div className="text-xs text-green-600 font-semibold">-5 min vs last week</div>
          </div>
        </div>
      </div>
    </div>
  );
}
