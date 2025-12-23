/**
 * Revenue Dashboard
 * Real-time revenue tracking, goals, opportunities, and insights
 */

import { DollarSign, TrendingUp, TrendingDown, Target, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface RevenueOpportunity {
  id: string;
  type: 'fill-gap' | 'upsell' | 'waitlist' | 'premium-pricing';
  description: string;
  potentialRevenue: number;
  confidence: number; // 0-100
  action: {
    label: string;
    onClick: () => void;
  };
}

interface RevenueDashboardProps {
  currentRevenue: number;
  goalRevenue: number;
  period: 'today' | 'week' | 'month';
  previousRevenue?: number; // For comparison
  opportunities: RevenueOpportunity[];
  breakdown?: {
    completed: number;
    scheduled: number;
    potential: number;
  };
}

export function RevenueDashboard({
  currentRevenue,
  goalRevenue,
  period,
  previousRevenue,
  opportunities,
  breakdown,
}: RevenueDashboardProps) {
  const progress = (currentRevenue / goalRevenue) * 100;
  const remaining = Math.max(0, goalRevenue - currentRevenue);
  const totalOpportunity = opportunities.reduce((sum, opp) => sum + opp.potentialRevenue, 0);

  // Calculate trend
  const trend = previousRevenue
    ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
    : 0;

  const periodLabels = {
    today: 'Today',
    week: 'This Week',
    month: 'This Month',
  };

  const getOpportunityIcon = (type: string) => {
    switch (type) {
      case 'fill-gap':
        return Zap;
      case 'upsell':
        return TrendingUp;
      case 'waitlist':
        return AlertCircle;
      case 'premium-pricing':
        return Target;
      default:
        return Zap;
    }
  };

  const getOpportunityColor = (type: string): string => {
    switch (type) {
      case 'fill-gap':
        return 'from-orange-500 to-red-500';
      case 'upsell':
        return 'from-brand-500 to-cyan-500';
      case 'waitlist':
        return 'from-purple-500 to-pink-500';
      case 'premium-pricing':
        return 'from-amber-500 to-yellow-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Revenue Card */}
      <div className="bg-gradient-to-br from-brand-500 to-cyan-600 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 text-white">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-brand-100 text-sm font-medium">
                {periodLabels[period]} Revenue
              </p>
              <div className="flex items-baseline gap-3 mt-2">
                <h2 className="text-4xl font-bold">
                  ${currentRevenue.toLocaleString()}
                </h2>
                {previousRevenue && (
                  <div className={cn(
                    'flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-full',
                    trend >= 0 ? 'bg-green-500/30' : 'bg-red-500/30'
                  )}>
                    {trend >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span>{Math.abs(trend).toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <DollarSign className="w-8 h-8" />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-brand-100">Goal: ${goalRevenue.toLocaleString()}</span>
              <span className="font-semibold">{Math.round(progress)}%</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full bg-white transition-all duration-500 ease-out rounded-full',
                  progress >= 100 && 'bg-gradient-to-r from-green-400 to-emerald-400'
                )}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>

          {/* Breakdown */}
          {breakdown && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
              <div>
                <p className="text-xs text-brand-100">Completed</p>
                <p className="text-lg font-bold mt-1">${breakdown.completed.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-brand-100">Scheduled</p>
                <p className="text-lg font-bold mt-1">${breakdown.scheduled.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-brand-100">Potential</p>
                <p className="text-lg font-bold mt-1">${breakdown.potential.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>

        {/* Goal Status */}
        {progress >= 100 ? (
          <div className="bg-green-500 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white font-bold">Goal Achieved! 🎉</p>
                <p className="text-green-100 text-sm">
                  Exceeded by ${(currentRevenue - goalRevenue).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/10 px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-white text-sm">Remaining to goal</p>
              <p className="text-white font-bold text-lg">${remaining.toLocaleString()}</p>
            </div>
            {totalOpportunity > 0 && (
              <div className="text-right">
                <p className="text-brand-100 text-sm">Available opportunities</p>
                <p className="text-white font-bold text-lg">
                  +${totalOpportunity.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Revenue Opportunities */}
      {opportunities.length > 0 && progress < 100 && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  💡 Revenue Opportunities
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {opportunities.length} way{opportunities.length !== 1 ? 's' : ''} to hit your goal
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Potential</p>
                <p className="text-2xl font-bold text-brand-600">
                  +${totalOpportunity.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {opportunities.map((opp) => {
              const Icon = getOpportunityIcon(opp.type);
              return (
                <div
                  key={opp.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                      'bg-gradient-to-br text-white',
                      getOpportunityColor(opp.type)
                    )}>
                      <Icon className="w-6 h-6" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {opp.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1.5">
                              <DollarSign className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-semibold text-gray-900">
                                +${opp.potentialRevenue}
                              </span>
                              <span className="text-sm text-gray-500">potential</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Target className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                {opp.confidence}% confidence
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={opp.action.onClick}
                          className={cn(
                            'px-4 py-2 rounded-lg font-semibold text-white transition-all',
                            'bg-gradient-to-r hover:shadow-lg',
                            getOpportunityColor(opp.type)
                          )}
                        >
                          {opp.action.label}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Completion</p>
              <p className="text-lg font-bold text-gray-900">{Math.round(progress)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">vs {period === 'today' ? 'Yesterday' : 'Last Period'}</p>
              <p className={cn(
                'text-lg font-bold',
                trend >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Opportunities</p>
              <p className="text-lg font-bold text-gray-900">{opportunities.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
