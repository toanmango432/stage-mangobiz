/**
 * AchievementsSection Component - Phase 4: Staff Experience
 *
 * Displays staff achievements, badges, and milestone progress.
 */

import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Star,
  Target,
  TrendingUp,
  Award,
  Lock,
  Check,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Card, SectionHeader, Badge } from '../components/SharedComponents';
import type {
  Achievement,
  AchievementProgress,
} from '@/types/performance';
import { ACHIEVEMENT_DEFINITIONS } from '@/types/performance';

// ============================================
// TYPES
// ============================================

interface AchievementsSectionProps {
  memberId: string;
  memberName: string;
  storeId: string;
}

// ============================================
// MOCK DATA
// ============================================

const generateMockAchievements = (): Achievement[] => {
  return [
    {
      id: 'ach-1',
      type: 'top_performer',
      name: 'Top Performer',
      description: 'Highest revenue in November 2024',
      icon: '🌟',
      earnedAt: new Date(2024, 10, 30).toISOString(),
      period: 'November 2024',
      value: 12500,
    },
    {
      id: 'ach-2',
      type: 'perfect_rating',
      name: 'Perfect Rating',
      description: 'Maintained 5.0 rating with 15 reviews',
      icon: '💯',
      earnedAt: new Date(2024, 11, 15).toISOString(),
      value: 5.0,
    },
    {
      id: 'ach-3',
      type: 'rebooking_master',
      name: 'Rebooking Master',
      description: 'Achieved 85% rebook rate',
      icon: '📅',
      earnedAt: new Date(2024, 11, 1).toISOString(),
      period: 'November 2024',
      value: 85,
    },
    {
      id: 'ach-4',
      type: 'milestone',
      name: '$10K Milestone',
      description: 'Reached $10,000 in monthly revenue',
      icon: '🏆',
      earnedAt: new Date(2024, 9, 15).toISOString(),
      period: 'October 2024',
      value: 10000,
    },
    {
      id: 'ach-5',
      type: 'new_client_champion',
      name: 'New Client Champion',
      description: 'Brought in 15 new clients',
      icon: '🆕',
      earnedAt: new Date(2024, 8, 30).toISOString(),
      period: 'September 2024',
      value: 15,
    },
  ];
};

const generateMockProgress = (): AchievementProgress[] => {
  return ACHIEVEMENT_DEFINITIONS.map((def) => {
    // Generate mock progress for each achievement type
    const progressMap: Record<string, { current: number; target: number }> = {
      'top_performer': { current: 8500, target: 12000 },
      'new_client_champion': { current: 8, target: 15 },
      'rebooking_master': { current: 72, target: 80 },
      'perfect_rating': { current: 4.8, target: 5.0 },
      'goal_crusher': { current: 4, target: 5 },
      'retail_star': { current: 35, target: 40 },
      'service_speed': { current: 42, target: 50 },
      'consistency': { current: 22, target: 30 },
      'milestone': { current: 8500, target: 25000 },
    };

    const { current, target } = progressMap[def.type] || { current: 0, target: 100 };
    const percentage = Math.min((current / target) * 100, 100);

    return {
      definition: def,
      currentValue: current,
      targetValue: target,
      percentage,
      isUnlocked: percentage >= 100,
    };
  });
};

// ============================================
// ACHIEVEMENT ICON COMPONENT
// ============================================

interface AchievementIconProps {
  icon: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLocked?: boolean;
}

const AchievementIcon: React.FC<AchievementIconProps> = ({
  icon,
  size = 'md',
  isLocked = false,
}) => {
  const sizeClasses = {
    sm: 'w-10 h-10 text-lg',
    md: 'w-14 h-14 text-2xl',
    lg: 'w-20 h-20 text-3xl',
    xl: 'w-24 h-24 text-4xl',
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center ${
        isLocked
          ? 'bg-gray-200 grayscale opacity-50'
          : 'bg-gradient-to-br from-amber-100 to-yellow-200 shadow-lg border-2 border-amber-300'
      }`}
    >
      <span className={isLocked ? 'opacity-50' : ''}>{icon}</span>
    </div>
  );
};

// ============================================
// EARNED ACHIEVEMENT CARD
// ============================================

interface EarnedAchievementCardProps {
  achievement: Achievement;
}

const EarnedAchievementCard: React.FC<EarnedAchievementCardProps> = ({ achievement }) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card className="text-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-amber-50 to-transparent" />

      <div className="relative pt-2">
        <AchievementIcon icon={achievement.icon} size="lg" />

        <h4 className="font-semibold text-gray-900 mt-3">{achievement.name}</h4>
        <p className="text-sm text-gray-500 mt-1">{achievement.description}</p>

        <div className="mt-3 flex items-center justify-center gap-2">
          <Badge variant="success" size="sm">
            <Check className="w-3 h-3 mr-1" />
            Earned
          </Badge>
        </div>

        <p className="text-xs text-gray-400 mt-2">
          {formatDate(achievement.earnedAt)}
        </p>
      </div>
    </Card>
  );
};

// ============================================
// PROGRESS ACHIEVEMENT CARD
// ============================================

interface ProgressAchievementCardProps {
  progress: AchievementProgress;
}

const ProgressAchievementCard: React.FC<ProgressAchievementCardProps> = ({ progress }) => {
  const { definition, currentValue, targetValue, percentage, isUnlocked } = progress;

  const formatValue = (value: number) => {
    if (definition.type === 'top_performer' || definition.type === 'milestone') {
      return `$${value.toLocaleString()}`;
    }
    if (definition.type === 'rebooking_master' || definition.type === 'retail_star' || definition.type === 'perfect_rating') {
      return definition.type === 'perfect_rating' ? value.toFixed(1) : `${value}%`;
    }
    return value.toString();
  };

  return (
    <div className={`p-4 rounded-xl border ${
      isUnlocked
        ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200'
        : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center gap-3">
        <AchievementIcon icon={definition.icon} size="sm" isLocked={!isUnlocked} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className={`font-medium truncate ${isUnlocked ? 'text-amber-900' : 'text-gray-700'}`}>
              {definition.name}
            </h4>
            {isUnlocked ? (
              <Badge variant="success" size="sm">
                <Check className="w-3 h-3" />
              </Badge>
            ) : (
              <span className="text-xs text-gray-500">
                {formatValue(currentValue)} / {formatValue(targetValue)}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate mt-0.5">{definition.criteria}</p>

          {/* Progress bar */}
          <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isUnlocked ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MILESTONE TRACKER
// ============================================

interface MilestoneTrackerProps {
  currentRevenue: number;
}

const MilestoneTracker: React.FC<MilestoneTrackerProps> = ({ currentRevenue }) => {
  const milestones = [
    { amount: 10000, label: '$10K' },
    { amount: 25000, label: '$25K' },
    { amount: 50000, label: '$50K' },
    { amount: 100000, label: '$100K' },
  ];

  const nextMilestone = milestones.find((m) => m.amount > currentRevenue);
  const progress = nextMilestone
    ? (currentRevenue / nextMilestone.amount) * 100
    : 100;

  return (
    <Card>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">Revenue Milestones</h4>
          <p className="text-sm text-gray-500">
            Current: ${currentRevenue.toLocaleString()} this year
          </p>
        </div>
      </div>

      {/* Milestone visualization */}
      <div className="relative">
        <div className="h-2 bg-gray-100 rounded-full">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          {milestones.map((milestone) => {
            const achieved = currentRevenue >= milestone.amount;
            return (
              <div key={milestone.amount} className="text-center">
                <div
                  className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center ${
                    achieved
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {achieved ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Lock className="w-3 h-3" />
                  )}
                </div>
                <span className={`text-xs mt-1 block ${
                  achieved ? 'text-purple-600 font-medium' : 'text-gray-400'
                }`}>
                  {milestone.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {nextMilestone && (
        <p className="text-sm text-gray-500 mt-4 text-center">
          ${(nextMilestone.amount - currentRevenue).toLocaleString()} to next milestone
        </p>
      )}
    </Card>
  );
};

// ============================================
// MAIN ACHIEVEMENTS SECTION
// ============================================

export const AchievementsSection: React.FC<AchievementsSectionProps> = ({
  memberId: _memberId,
  memberName,
}) => {
  const [showAllProgress, setShowAllProgress] = useState(false);

  // Mock data
  const earnedAchievements = useMemo(() => generateMockAchievements(), []);
  const progressList = useMemo(() => generateMockProgress(), []);

  // Stats
  const stats = useMemo(() => {
    const totalEarned = earnedAchievements.length;
    const totalAvailable = ACHIEVEMENT_DEFINITIONS.length;
    const inProgress = progressList.filter((p) => p.percentage > 0 && !p.isUnlocked).length;
    return { totalEarned, totalAvailable, inProgress };
  }, [earnedAchievements, progressList]);

  // Separate locked achievements for progress display
  const lockedProgress = progressList.filter((p) => !p.isUnlocked);
  const displayedProgress = showAllProgress ? lockedProgress : lockedProgress.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        title="Achievements"
        subtitle={`${memberName}'s badges and milestones`}
        icon={<Trophy className="w-5 h-5" />}
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <div className="flex items-center justify-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <span className="text-2xl font-bold text-gray-900">{stats.totalEarned}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Badges Earned</p>
        </Card>
        <Card className="text-center">
          <div className="flex items-center justify-center gap-2">
            <Target className="w-5 h-5 text-emerald-500" />
            <span className="text-2xl font-bold text-gray-900">{stats.inProgress}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">In Progress</p>
        </Card>
        <Card className="text-center">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <span className="text-2xl font-bold text-gray-900">
              {stats.totalAvailable - stats.totalEarned}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">To Unlock</p>
        </Card>
      </div>

      {/* Milestone Tracker */}
      <MilestoneTracker currentRevenue={8500} />

      {/* Earned Achievements */}
      {earnedAchievements.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-amber-500" />
            Earned Badges ({earnedAchievements.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {earnedAchievements.map((achievement) => (
              <EarnedAchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </div>
      )}

      {/* Progress Achievements */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-emerald-500" />
          In Progress
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {displayedProgress.map((progress) => (
            <ProgressAchievementCard
              key={progress.definition.type}
              progress={progress}
            />
          ))}
        </div>

        {lockedProgress.length > 4 && (
          <button
            onClick={() => setShowAllProgress(!showAllProgress)}
            className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {showAllProgress ? 'Show Less' : `View All (${lockedProgress.length})`}
            <ChevronRight className={`w-4 h-4 transition-transform ${showAllProgress ? 'rotate-90' : ''}`} />
          </button>
        )}
      </div>
    </div>
  );
};

export default AchievementsSection;
