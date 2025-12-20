/**
 * Today's Sales
 * EOD summary view with quick stats and closeout access
 * Located in MORE Menu for daily overview and end-of-day operations
 */

import { useMemo } from 'react';
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Users,
  Receipt,
  Printer,
  FileDown,
  CreditCard,
  Banknote,
  Wallet,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { selectCompletedTickets, selectPendingTickets } from '../../store/slices/uiTicketsSlice';
import type { Ticket } from '../../types';

interface TodaysSalesProps {
  onBack?: () => void;
}

export function TodaysSales({ onBack }: TodaysSalesProps) {
  // Get completed and pending tickets from Redux
  const completedTickets = useAppSelector(selectCompletedTickets);
  const pendingTickets = useAppSelector(selectPendingTickets);
  
  // Combine completed and pending tickets for today's sales view
  const allTickets: Ticket[] = [...completedTickets, ...pendingTickets] as Ticket[];

  // Calculate today's stats
  const todayStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter to today's closed tickets
    const todayTickets = allTickets.filter(t => {
      const ticketDate = new Date(t.closedAt || t.createdAt || new Date());
      ticketDate.setHours(0, 0, 0, 0);
      return ticketDate.getTime() === today.getTime() &&
        (t.status === 'closed' || t.status === 'completed' || t.status === 'paid');
    });

    const totalRevenue = todayTickets.reduce((sum, t) => sum + (t.total || 0), 0);
    const totalTips = todayTickets.reduce((sum, t) => sum + (t.tip || 0), 0);
    const transactionCount = todayTickets.length;
    const avgTicket = transactionCount > 0 ? totalRevenue / transactionCount : 0;

    // Payment breakdown (mock data for now - would come from payment details)
    const cashAmount = todayTickets
      .filter(t => t.paymentMethod === 'cash')
      .reduce((sum, t) => sum + (t.total || 0), 0);
    const cardAmount = todayTickets
      .filter(t => t.paymentMethod === 'card' || !t.paymentMethod)
      .reduce((sum, t) => sum + (t.total || 0), 0);
    const otherAmount = todayTickets
      .filter(t => t.paymentMethod && t.paymentMethod !== 'cash' && t.paymentMethod !== 'card')
      .reduce((sum, t) => sum + (t.total || 0), 0);

    // Staff performance (aggregate by staff)
    const staffMap = new Map<string, { name: string; revenue: number; tickets: number; tips: number }>();
    todayTickets.forEach(ticket => {
      const staffName = ticket.staffName || ticket.services?.[0]?.staffName || 'Unassigned';
      const existing = staffMap.get(staffName) || { name: staffName, revenue: 0, tickets: 0, tips: 0 };
      existing.revenue += ticket.total || 0;
      existing.tickets += 1;
      existing.tips += ticket.tip || 0;
      staffMap.set(staffName, existing);
    });

    const staffPerformance = Array.from(staffMap.values())
      .sort((a, b) => b.revenue - a.revenue);

    return {
      totalRevenue,
      totalTips,
      transactionCount,
      avgTicket,
      paymentBreakdown: {
        cash: cashAmount,
        card: cardAmount,
        other: otherAmount
      },
      staffPerformance
    };
  }, [allTickets]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const getPaymentPercentage = (amount: number) => {
    if (todayStats.totalRevenue === 0) return 0;
    return (amount / todayStats.totalRevenue) * 100;
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Today's Sales</h1>
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              Last updated: {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard
              label="Total Revenue"
              value={formatCurrency(todayStats.totalRevenue)}
              icon={DollarSign}
              color="green"
            />
            <SummaryCard
              label="Transactions"
              value={todayStats.transactionCount.toString()}
              icon={Receipt}
              color="blue"
            />
            <SummaryCard
              label="Avg Ticket"
              value={formatCurrency(todayStats.avgTicket)}
              icon={TrendingUp}
              color="purple"
            />
            <SummaryCard
              label="Tips"
              value={formatCurrency(todayStats.totalTips)}
              icon={Users}
              color="orange"
            />
          </div>

          {/* Payment Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-gray-400" />
              Payment Breakdown
            </h2>
            <div className="space-y-4">
              {/* Cash */}
              <PaymentRow
                icon={Banknote}
                label="Cash"
                amount={todayStats.paymentBreakdown.cash}
                percentage={getPaymentPercentage(todayStats.paymentBreakdown.cash)}
                color="green"
                formatCurrency={formatCurrency}
              />
              {/* Card */}
              <PaymentRow
                icon={CreditCard}
                label="Card"
                amount={todayStats.paymentBreakdown.card}
                percentage={getPaymentPercentage(todayStats.paymentBreakdown.card)}
                color="blue"
                formatCurrency={formatCurrency}
              />
              {/* Other */}
              {todayStats.paymentBreakdown.other > 0 && (
                <PaymentRow
                  icon={Wallet}
                  label="Other"
                  amount={todayStats.paymentBreakdown.other}
                  percentage={getPaymentPercentage(todayStats.paymentBreakdown.other)}
                  color="gray"
                  formatCurrency={formatCurrency}
                />
              )}
            </div>
          </div>

          {/* Staff Performance */}
          {todayStats.staffPerformance.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-400" />
                Staff Performance
              </h2>
              <div className="space-y-3">
                {todayStats.staffPerformance.map((staff, index) => (
                  <div
                    key={staff.name}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-100 text-gray-600' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-50 text-gray-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{staff.name}</p>
                        <p className="text-sm text-gray-500">{staff.tickets} tickets</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(staff.revenue)}</p>
                      {staff.tips > 0 && (
                        <p className="text-sm text-green-600">+{formatCurrency(staff.tips)} tips</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-gray-400" />
              Quick Actions
            </h2>
            <div className="flex flex-wrap gap-3">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-medium transition-colors">
                <Printer className="w-4 h-4" />
                Print Z-Report
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-medium transition-colors">
                <FileDown className="w-4 h-4" />
                Export CSV
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 rounded-xl text-white font-semibold shadow-md hover:shadow-lg transition-all">
                Start End-of-Day Closeout
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Summary Card Component
function SummaryCard({
  label,
  value,
  icon: Icon,
  color
}: {
  label: string;
  value: string;
  icon: any;
  color: 'green' | 'blue' | 'purple' | 'orange';
}) {
  const colors = {
    green: 'bg-green-50 text-green-600 border-green-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100'
  };

  const iconColors = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600'
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

// Payment Row Component
function PaymentRow({
  icon: Icon,
  label,
  amount,
  percentage,
  color,
  formatCurrency
}: {
  icon: any;
  label: string;
  amount: number;
  percentage: number;
  color: 'green' | 'blue' | 'gray';
  formatCurrency: (amount: number) => string;
}) {
  const barColors = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    gray: 'bg-gray-400'
  };

  const iconColors = {
    green: 'text-green-600',
    blue: 'text-blue-600',
    gray: 'text-gray-500'
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 w-24">
        <Icon className={`w-4 h-4 ${iconColors[color]}`} />
        <span className="text-sm text-gray-600 font-medium">{label}</span>
      </div>
      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColors[color]} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <span className="w-24 text-right text-sm font-semibold text-gray-900">
        {formatCurrency(amount)}
      </span>
      <span className="w-12 text-right text-sm text-gray-500">
        {percentage.toFixed(0)}%
      </span>
    </div>
  );
}
