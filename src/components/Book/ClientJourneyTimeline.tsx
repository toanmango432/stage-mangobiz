/**
 * Client Journey Timeline
 * Visual history of client visits with insights and predictions
 */

import { useMemo } from 'react';
import { Calendar, DollarSign, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Sparkles, Heart } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Visit {
  id: string;
  date: Date;
  services: {
    name: string;
    price: number;
    staff: string;
  }[];
  totalSpent: number;
  status: 'completed' | 'no-show' | 'cancelled';
  notes?: string;
}

interface ClientInsights {
  totalVisits: number;
  lifetimeValue: number;
  averageSpend: number;
  averageCycle: number; // days between visits
  preferredServices: string[];
  preferredStaff: string;
  preferredTimeOfDay: 'morning' | 'afternoon' | 'evening';
  churnRisk: 'low' | 'medium' | 'high';
  nextPredictedVisit?: Date;
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

interface ClientJourneyTimelineProps {
  clientName: string;
  visits: Visit[];
  insights: ClientInsights;
  onBookNext?: () => void;
  className?: string;
}

export function ClientJourneyTimeline({
  clientName,
  visits,
  insights,
  onBookNext,
  className,
}: ClientJourneyTimelineProps) {
  // Sort visits by date (newest first)
  const sortedVisits = useMemo(() => {
    return [...visits].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [visits]);

  // Calculate spend trend
  const spendTrend = useMemo(() => {
    if (visits.length < 2) return 0;
    const recent = visits.slice(0, 3);
    const older = visits.slice(3, 6);
    const recentAvg = recent.reduce((sum, v) => sum + v.totalSpent, 0) / recent.length;
    const olderAvg = older.length > 0
      ? older.reduce((sum, v) => sum + v.totalSpent, 0) / older.length
      : recentAvg;
    return ((recentAvg - olderAvg) / olderAvg) * 100;
  }, [visits]);

  // Days since last visit
  const daysSinceLastVisit = useMemo(() => {
    if (visits.length === 0) return 0;
    const lastVisit = Math.max(...visits.map(v => v.date.getTime()));
    return Math.floor((Date.now() - lastVisit) / (1000 * 60 * 60 * 24));
  }, [visits]);

  const isOverdue = daysSinceLastVisit > insights.averageCycle * 1.2;

  const getLoyaltyColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'from-purple-500 to-pink-500';
      case 'gold': return 'from-yellow-500 to-amber-500';
      case 'silver': return 'from-gray-400 to-gray-500';
      default: return 'from-orange-500 to-red-500';
    }
  };

  const getChurnRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <div className={cn('bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden', className)}>
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className={cn(
          'h-32 bg-gradient-to-r',
          getLoyaltyColor(insights.loyaltyTier)
        )} />
        <div className="absolute inset-0 flex items-center justify-between px-6 text-white">
          <div>
            <h2 className="text-2xl font-bold">{clientName}</h2>
            <p className="text-sm opacity-90 mt-1">
              {insights.loyaltyTier.charAt(0).toUpperCase() + insights.loyaltyTier.slice(1)} Member
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end mb-1">
              <Heart className="w-5 h-5" />
              <span className="text-2xl font-bold">${insights.lifetimeValue.toLocaleString()}</span>
            </div>
            <p className="text-sm opacity-90">Lifetime Value</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4 p-6 bg-gray-50 border-b border-gray-200">
        <div>
          <p className="text-xs text-gray-600 mb-1">Total Visits</p>
          <p className="text-2xl font-bold text-gray-900">{insights.totalVisits}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Avg Spend</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-gray-900">${insights.averageSpend}</p>
            {spendTrend !== 0 && (
              <div className={cn(
                'flex items-center gap-0.5 text-xs font-semibold',
                spendTrend > 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {spendTrend > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>{Math.abs(spendTrend).toFixed(0)}%</span>
              </div>
            )}
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Visit Cycle</p>
          <p className="text-2xl font-bold text-gray-900">{insights.averageCycle}d</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Churn Risk</p>
          <span className={cn(
            'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold',
            getChurnRiskColor(insights.churnRisk)
          )}>
            {insights.churnRisk === 'high' && <AlertCircle className="w-3 h-3" />}
            {insights.churnRisk === 'low' && <CheckCircle2 className="w-3 h-3" />}
            {insights.churnRisk.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Insights & Predictions */}
      <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-gray-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-2">Client Insights</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-600">Prefers</p>
                <p className="font-semibold text-gray-900">{insights.preferredServices.join(', ')}</p>
              </div>
              <div>
                <p className="text-gray-600">Favorite Staff</p>
                <p className="font-semibold text-gray-900">{insights.preferredStaff}</p>
              </div>
              <div>
                <p className="text-gray-600">Typical Time</p>
                <p className="font-semibold text-gray-900 capitalize">{insights.preferredTimeOfDay}</p>
              </div>
              {insights.nextPredictedVisit && (
                <div>
                  <p className="text-gray-600">Next Visit Predicted</p>
                  <p className="font-semibold text-gray-900">{formatDate(insights.nextPredictedVisit)}</p>
                </div>
              )}
            </div>

            {/* Status Alert */}
            {isOverdue && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-sm font-semibold text-red-900">
                      Client is overdue for appointment
                    </p>
                    <p className="text-xs text-red-700 mt-0.5">
                      Last visit {daysSinceLastVisit} days ago (typical cycle: {insights.averageCycle} days)
                    </p>
                  </div>
                </div>
                {onBookNext && (
                  <button
                    onClick={onBookNext}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm"
                  >
                    Book Now
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Visit History
        </h3>

        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

          {/* Visits */}
          <div className="space-y-6">
            {sortedVisits.map((visit, index) => (
              <div key={visit.id} className="relative pl-16">
                {/* Timeline Dot */}
                <div className={cn(
                  'absolute left-0 w-12 h-12 rounded-full flex items-center justify-center',
                  visit.status === 'completed' ? 'bg-teal-100 border-4 border-white shadow-md' :
                  visit.status === 'no-show' ? 'bg-red-100 border-4 border-white shadow-md' :
                  'bg-gray-100 border-4 border-white shadow-md'
                )}>
                  {visit.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-teal-600" />}
                  {visit.status === 'no-show' && <AlertCircle className="w-5 h-5 text-red-600" />}
                  {visit.status === 'cancelled' && <span className="text-lg">✕</span>}
                </div>

                {/* Visit Card */}
                <div className={cn(
                  'bg-white rounded-lg border-2 p-4 hover:shadow-md transition-all',
                  visit.status === 'completed' ? 'border-teal-200' :
                  visit.status === 'no-show' ? 'border-red-200' :
                  'border-gray-200'
                )}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-gray-900">{formatDate(visit.date)}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {index === 0 ? 'Latest visit' : `${daysSinceLastVisit} days ago`}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-lg font-bold text-gray-900">
                        <DollarSign className="w-4 h-4" />
                        <span>{visit.totalSpent}</span>
                      </div>
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-semibold',
                        visit.status === 'completed' ? 'bg-teal-100 text-teal-700' :
                        visit.status === 'no-show' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      )}>
                        {visit.status}
                      </span>
                    </div>
                  </div>

                  {/* Services */}
                  <div className="space-y-2">
                    {visit.services.map((service, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700">{service.name}</span>
                          <span className="text-xs text-gray-500">with {service.staff}</span>
                        </div>
                        <span className="font-medium text-gray-900">${service.price}</span>
                      </div>
                    ))}
                  </div>

                  {/* Notes */}
                  {visit.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-600 italic">"{visit.notes}"</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Show More */}
        {visits.length > 5 && (
          <div className="text-center mt-6">
            <button className="text-sm text-teal-600 hover:text-teal-700 font-semibold">
              Show All {visits.length} Visits
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
