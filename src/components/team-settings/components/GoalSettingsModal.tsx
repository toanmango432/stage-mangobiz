/**
 * GoalSettingsModal Component - Phase 4: Staff Experience
 *
 * Modal for setting and editing staff performance goals.
 */

import React, { useState, useCallback } from 'react';
import {
  X,
  Target,
  DollarSign,
  Users,
  TrendingUp,
  ShoppingBag,
  Calendar,
  Save,
  RotateCcw,
} from 'lucide-react';
import type { PerformanceGoals } from '../types';

// ============================================
// TYPES
// ============================================

interface GoalSettingsModalProps {
  goals: PerformanceGoals;
  memberName: string;
  onSave: (goals: PerformanceGoals) => void;
  onClose: () => void;
}

interface GoalInputProps {
  label: string;
  value?: number;
  onChange: (value: number | undefined) => void;
  placeholder: string;
  prefix?: string;
  suffix?: string;
  icon: React.ReactNode;
  description?: string;
}

// ============================================
// GOAL INPUT COMPONENT
// ============================================

const GoalInput: React.FC<GoalInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  prefix,
  suffix,
  icon,
  description,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange(undefined);
    } else {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        onChange(num);
      }
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded-xl">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
          {description && (
            <p className="text-xs text-gray-500 mb-2">{description}</p>
          )}
          <div className="relative">
            {prefix && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                {prefix}
              </span>
            )}
            <input
              type="number"
              value={value ?? ''}
              onChange={handleChange}
              placeholder={placeholder}
              className={`w-full py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                prefix ? 'pl-7' : 'pl-3'
              } ${suffix ? 'pr-12' : 'pr-3'}`}
            />
            {suffix && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                {suffix}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// GOAL CATEGORY SECTION
// ============================================

interface GoalCategorySectionProps {
  title: string;
  children: React.ReactNode;
}

const GoalCategorySection: React.FC<GoalCategorySectionProps> = ({ title, children }) => {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
        {title}
      </h4>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const GoalSettingsModal: React.FC<GoalSettingsModalProps> = ({
  goals: initialGoals,
  memberName,
  onSave,
  onClose,
}) => {
  const [goals, setGoals] = useState<PerformanceGoals>(initialGoals);
  const [hasChanges, setHasChanges] = useState(false);

  // Update a specific goal
  const updateGoal = useCallback(<K extends keyof PerformanceGoals>(
    key: K,
    value: PerformanceGoals[K]
  ) => {
    setGoals((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }, []);

  // Reset to initial values
  const handleReset = useCallback(() => {
    setGoals(initialGoals);
    setHasChanges(false);
  }, [initialGoals]);

  // Save changes
  const handleSave = useCallback(() => {
    onSave(goals);
    onClose();
  }, [goals, onSave, onClose]);

  // Clear all goals
  const handleClearAll = useCallback(() => {
    setGoals({});
    setHasChanges(true);
  }, []);

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Performance Goals</h3>
              <p className="text-sm text-gray-500">Set targets for {memberName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Revenue Goals */}
          <GoalCategorySection title="Revenue Goals">
            <GoalInput
              label="Daily Revenue Target"
              value={goals.dailyRevenueTarget}
              onChange={(val) => updateGoal('dailyRevenueTarget', val)}
              placeholder="500"
              prefix="$"
              icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
              description="Target revenue per working day"
            />
            <GoalInput
              label="Weekly Revenue Target"
              value={goals.weeklyRevenueTarget}
              onChange={(val) => updateGoal('weeklyRevenueTarget', val)}
              placeholder="2500"
              prefix="$"
              icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
              description="Target revenue per week"
            />
            <GoalInput
              label="Monthly Revenue Target"
              value={goals.monthlyRevenueTarget}
              onChange={(val) => updateGoal('monthlyRevenueTarget', val)}
              placeholder="10000"
              prefix="$"
              icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
              description="Target revenue per month"
            />
          </GoalCategorySection>

          {/* Service Goals */}
          <GoalCategorySection title="Service Goals">
            <GoalInput
              label="Daily Services Target"
              value={goals.dailyServicesTarget}
              onChange={(val) => updateGoal('dailyServicesTarget', val)}
              placeholder="8"
              icon={<Calendar className="w-5 h-5 text-blue-600" />}
              description="Number of services to complete per day"
            />
            <GoalInput
              label="Weekly Services Target"
              value={goals.weeklyServicesTarget}
              onChange={(val) => updateGoal('weeklyServicesTarget', val)}
              placeholder="40"
              icon={<Calendar className="w-5 h-5 text-blue-600" />}
              description="Number of services to complete per week"
            />
            <GoalInput
              label="Average Ticket Target"
              value={goals.averageTicketTarget}
              onChange={(val) => updateGoal('averageTicketTarget', val)}
              placeholder="85"
              prefix="$"
              icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
              description="Target average ticket value"
            />
          </GoalCategorySection>

          {/* Client Goals */}
          <GoalCategorySection title="Client Goals">
            <GoalInput
              label="New Client Target (Monthly)"
              value={goals.newClientTarget}
              onChange={(val) => updateGoal('newClientTarget', val)}
              placeholder="10"
              icon={<Users className="w-5 h-5 text-cyan-600" />}
              description="Number of new clients per month"
            />
            <GoalInput
              label="Rebooking Rate Target"
              value={goals.rebookingRateTarget}
              onChange={(val) => updateGoal('rebookingRateTarget', val)}
              placeholder="75"
              suffix="%"
              icon={<TrendingUp className="w-5 h-5 text-green-600" />}
              description="Percentage of clients who rebook"
            />
          </GoalCategorySection>

          {/* Retail Goals */}
          <GoalCategorySection title="Retail Goals">
            <GoalInput
              label="Monthly Retail Sales Target"
              value={goals.retailSalesTarget}
              onChange={(val) => updateGoal('retailSalesTarget', val)}
              placeholder="500"
              prefix="$"
              icon={<ShoppingBag className="w-5 h-5 text-pink-600" />}
              description="Target retail sales per month"
            />
          </GoalCategorySection>

          {/* Tips Section */}
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <h4 className="font-medium text-amber-800 mb-2">Goal Setting Tips</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Set realistic goals based on historical performance</li>
              <li>• Start with fewer goals and add more as targets are met</li>
              <li>• Review and adjust goals monthly based on progress</li>
              <li>• Consider seasonality when setting targets</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearAll}
              className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Clear All
            </button>
            {hasChanges && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Goals
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalSettingsModal;
