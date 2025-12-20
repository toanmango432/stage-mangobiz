/**
 * PerformanceSection Component - Phase 4: Staff Experience
 *
 * Performance Dashboard showing metrics, goals, achievements, and reviews
 * for individual staff members.
 *
 * Now uses real data from staffPerformanceSlice.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Target,
  Star,
  Trophy,
  DollarSign,
  Users,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
  ChevronRight,
  Award,
  Sparkles,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { Card, SectionHeader, Badge } from '../components/SharedComponents';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchStaffMetrics,
  fetchStaffAchievements,
  fetchStaffReviewSummary,
  selectStaffMetrics,
  selectStaffAchievements,
  selectStaffReviewSummary,
  selectPerformanceLoading,
  setCurrentPeriod,
} from '@/store/slices/staffPerformanceSlice';
import { createEmptyMetrics } from '@/types/performance';
import type { PerformanceGoals as TeamPerformanceGoals } from '../types';
import type {
  PerformancePeriod,
  PerformanceMetrics,
  GoalProgress,
  Achievement,
  ReviewSummary,
} from '@/types/performance';
import {
  calculateGoalProgress,
  ACHIEVEMENT_DEFINITIONS,
} from '@/types/performance';

// ============================================
// TYPES
// ============================================

interface PerformanceSectionProps {
  memberId: string;
  memberName: string;
  storeId: string;
  goals: TeamPerformanceGoals;
  onGoalsChange: (goals: TeamPerformanceGoals) => void;
}

// ============================================
// DEFAULT VALUES
// ============================================

const defaultReviewSummary: ReviewSummary = {
  averageRating: 0,
  totalReviews: 0,
  distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  recentTrend: 'stable',
};

// ============================================
// PERIOD SELECTOR COMPONENT
// ============================================

interface PeriodSelectorProps {
  period: PerformancePeriod;
  onChange: (period: PerformancePeriod) => void;
}

const PeriodSelector: React.FC<PeriodSelectorProps> = ({ period, onChange }) => {
  const periods: { value: PerformancePeriod; label: string }[] = [
    { value: 'daily', label: 'Today' },
    { value: 'weekly', label: 'This Week' },
    { value: 'monthly', label: 'This Month' },
    { value: 'yearly', label: 'This Year' },
  ];

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      {periods.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`px-3 py-1.5 text-sm rounded-md transition-all ${
            period === p.value
              ? 'bg-white text-gray-900 font-medium shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
};

// ============================================
// METRIC CARD COMPONENT
// ============================================

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  icon: React.ReactNode;
  iconBg?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subValue,
  trend,
  trendValue,
  icon,
  iconBg = 'from-gray-100 to-gray-200',
}) => {
  const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500';

  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subValue && <p className="text-xs text-gray-400 mt-0.5">{subValue}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      {trend && trendValue && (
        <div className={`flex items-center gap-1 mt-2 text-sm ${trendColor}`}>
          <TrendIcon className="w-3 h-3" />
          <span>{trendValue}</span>
        </div>
      )}
    </Card>
  );
};

// ============================================
// GOAL PROGRESS CARD COMPONENT
// ============================================

interface GoalProgressCardProps {
  progress: GoalProgress;
}

const GoalProgressCard: React.FC<GoalProgressCardProps> = ({ progress }) => {
  const formatValue = (value: number, unit: GoalProgress['unit']) => {
    switch (unit) {
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'percentage':
        return `${value.toFixed(0)}%`;
      case 'rating':
        return value.toFixed(1);
      default:
        return value.toLocaleString();
    }
  };

  const progressColor = progress.percentage >= 100
    ? 'bg-green-500'
    : progress.isOnTrack
      ? 'bg-emerald-500'
      : 'bg-amber-500';

  return (
    <div className="p-4 bg-gray-50 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{progress.goalName}</span>
        <span className={`text-xs font-medium ${progress.isOnTrack ? 'text-green-600' : 'text-amber-600'}`}>
          {progress.percentage >= 100 ? 'Achieved!' : progress.isOnTrack ? 'On Track' : 'Behind'}
        </span>
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-lg font-bold text-gray-900">
          {formatValue(progress.actual, progress.unit)}
        </span>
        <span className="text-sm text-gray-400">
          / {formatValue(progress.target, progress.unit)}
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${progressColor} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(progress.percentage, 100)}%` }}
        />
      </div>
      <div className="mt-1 text-right">
        <span className="text-xs text-gray-500">{progress.percentage.toFixed(0)}%</span>
      </div>
    </div>
  );
};

// ============================================
// ACHIEVEMENT BADGE COMPONENT
// ============================================

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'sm' | 'md' | 'lg';
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({ achievement, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-10 h-10 text-lg',
    md: 'w-14 h-14 text-2xl',
    lg: 'w-20 h-20 text-3xl',
  };

  return (
    <div className="flex flex-col items-center text-center">
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-amber-100 to-yellow-200 flex items-center justify-center shadow-lg border-2 border-amber-300`}>
        <span>{achievement.icon}</span>
      </div>
      <p className="text-xs font-medium text-gray-700 mt-2">{achievement.name}</p>
      {achievement.period && (
        <p className="text-xs text-gray-400">{achievement.period}</p>
      )}
    </div>
  );
};

// ============================================
// REVIEW SUMMARY COMPONENT
// ============================================

interface ReviewSummaryCardProps {
  summary: ReviewSummary;
}

const ReviewSummaryCard: React.FC<ReviewSummaryCardProps> = ({ summary }) => {
  const maxCount = Math.max(...Object.values(summary.distribution));

  return (
    <Card>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            <span className="text-2xl font-bold text-gray-900">{summary.averageRating.toFixed(1)}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{summary.totalReviews} reviews</p>
        </div>
        <Badge
          variant={summary.recentTrend === 'improving' ? 'success' : summary.recentTrend === 'declining' ? 'error' : 'default'}
        >
          {summary.recentTrend === 'improving' ? '↑ Improving' : summary.recentTrend === 'declining' ? '↓ Declining' : '→ Stable'}
        </Badge>
      </div>

      {/* Star Distribution */}
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((stars) => {
          const count = summary.distribution[stars as keyof typeof summary.distribution];
          const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
          return (
            <div key={stars} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-4">{stars}</span>
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-8">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Category Averages */}
      {summary.categoryAverages && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-2">Category Ratings</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(summary.categoryAverages).map(([category, rating]) => (
              <div key={category} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 capitalize">{category}</span>
                <span className="font-medium text-gray-900">{rating.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

// ============================================
// MAIN PERFORMANCE SECTION COMPONENT
// ============================================

export const PerformanceSection: React.FC<PerformanceSectionProps> = ({
  memberId,
  memberName,
  storeId,
  goals,
  onGoalsChange: _onGoalsChange,
}) => {
  const dispatch = useAppDispatch();
  const [period, setPeriod] = useState<PerformancePeriod>('monthly');
  const [showGoalModal, setShowGoalModal] = useState(false);

  // Select data from Redux store
  const storedMetrics = useAppSelector((state) => selectStaffMetrics(state, memberId));
  const storedAchievements = useAppSelector((state) => selectStaffAchievements(state, memberId));
  const storedReviewSummary = useAppSelector((state) => selectStaffReviewSummary(state, memberId));
  const loading = useAppSelector(selectPerformanceLoading);

  // Fetch data when member or period changes
  useEffect(() => {
    if (memberId && storeId) {
      dispatch(setCurrentPeriod(period));
      dispatch(fetchStaffMetrics({ storeId, staffId: memberId, period }));
      dispatch(fetchStaffAchievements({ storeId, staffId: memberId }));
      dispatch(fetchStaffReviewSummary({ staffId: memberId }));
    }
  }, [dispatch, memberId, storeId, period]);

  // Use stored data or defaults
  const now = new Date();
  const metrics: PerformanceMetrics = storedMetrics || createEmptyMetrics(period, now.toISOString(), now.toISOString());
  const achievements: Achievement[] = storedAchievements || [];
  const reviewSummary: ReviewSummary = storedReviewSummary || defaultReviewSummary;

  // Check if data is loading
  const isLoading = loading.metrics || loading.achievements || loading.reviews;

  // Calculate goal progress
  const goalProgress = useMemo(() => {
    // Convert TeamPerformanceGoals to the format expected by calculateGoalProgress
    const performanceGoals = {
      dailyRevenueTarget: goals.dailyRevenueTarget,
      weeklyRevenueTarget: goals.weeklyRevenueTarget,
      monthlyRevenueTarget: goals.monthlyRevenueTarget,
      dailyServicesTarget: goals.dailyServicesTarget,
      weeklyServicesTarget: goals.weeklyServicesTarget,
      averageTicketTarget: goals.averageTicketTarget,
      newClientTarget: goals.newClientTarget,
      rebookingRateTarget: goals.rebookingRateTarget,
      retailSalesTarget: goals.retailSalesTarget,
    };
    return calculateGoalProgress(performanceGoals, metrics, period);
  }, [goals, metrics, period]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        title="Performance Dashboard"
        subtitle={`Track ${memberName}'s metrics, goals, and achievements`}
        icon={<BarChart3 className="w-5 h-5" />}
        action={
          <div className="flex items-center gap-3">
            {isLoading && (
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            )}
            <PeriodSelector period={period} onChange={setPeriod} />
          </div>
        }
      />

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          subValue={`${metrics.servicesCompleted} services`}
          trend="up"
          trendValue="+12% vs last period"
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          iconBg="from-emerald-50 to-emerald-100"
        />
        <MetricCard
          label="Avg Ticket"
          value={formatCurrency(metrics.averageTicket)}
          trend="up"
          trendValue="+$8 vs last period"
          icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
          iconBg="from-blue-50 to-blue-100"
        />
        <MetricCard
          label="Clients"
          value={metrics.totalClients}
          subValue={`${metrics.newClients} new`}
          trend="stable"
          icon={<Users className="w-5 h-5 text-purple-600" />}
          iconBg="from-purple-50 to-purple-100"
        />
        <MetricCard
          label="Rating"
          value={metrics.averageRating.toFixed(1)}
          subValue={`${metrics.totalReviews} reviews`}
          trend="up"
          trendValue="+0.2 vs last period"
          icon={<Star className="w-5 h-5 text-amber-600" />}
          iconBg="from-amber-50 to-amber-100"
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Utilization"
          value={`${metrics.utilizationRate.toFixed(0)}%`}
          icon={<Calendar className="w-5 h-5 text-cyan-600" />}
          iconBg="from-cyan-50 to-cyan-100"
        />
        <MetricCard
          label="Rebook Rate"
          value={`${metrics.rebookingRate.toFixed(0)}%`}
          trend="up"
          trendValue="+5%"
          icon={<Target className="w-5 h-5 text-green-600" />}
          iconBg="from-green-50 to-green-100"
        />
        <MetricCard
          label="Retail Sales"
          value={formatCurrency(metrics.retailSales)}
          subValue={`${metrics.retailUnits} units`}
          icon={<DollarSign className="w-5 h-5 text-pink-600" />}
          iconBg="from-pink-50 to-pink-100"
        />
        <MetricCard
          label="Retail Attach"
          value={`${metrics.retailAttachRate.toFixed(0)}%`}
          icon={<BarChart3 className="w-5 h-5 text-indigo-600" />}
          iconBg="from-indigo-50 to-indigo-100"
        />
      </div>

      {/* Goals Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-600" />
            Goals Progress
          </h3>
          <button
            onClick={() => setShowGoalModal(true)}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Edit Goals
          </button>
        </div>

        {goalProgress.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goalProgress.map((gp) => (
              <GoalProgressCard key={gp.goalKey} progress={gp} />
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">No goals set</p>
              <button
                onClick={() => setShowGoalModal(true)}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Set performance goals
              </button>
            </div>
          </Card>
        )}
      </div>

      {/* Two Column Layout: Achievements & Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Achievements */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-amber-600" />
            Achievements
          </h3>

          {achievements.length > 0 ? (
            <Card>
              <div className="flex gap-6 overflow-x-auto pb-2">
                {achievements.map((achievement) => (
                  <AchievementBadge key={achievement.id} achievement={achievement} />
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                  View all badges
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="text-center py-8">
                <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No achievements yet</p>
                <p className="text-sm text-gray-400 mt-1">Keep working toward your goals!</p>
              </div>
            </Card>
          )}

          {/* Available Achievements */}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Available Badges
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {ACHIEVEMENT_DEFINITIONS.slice(0, 6).map((def) => (
                <div
                  key={def.type}
                  className="flex flex-col items-center text-center p-3 bg-gray-50 rounded-xl opacity-50"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xl grayscale">
                    {def.icon}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{def.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews Summary */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-amber-600" />
            Reviews
          </h3>
          <ReviewSummaryCard summary={reviewSummary} />
          <button className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            View all reviews
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Goal Edit Modal Placeholder */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Edit Performance Goals</h3>
            <p className="text-gray-500 mb-4">Goal editing modal coming soon...</p>
            <button
              onClick={() => setShowGoalModal(false)}
              className="w-full px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceSection;
