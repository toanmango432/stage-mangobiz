import { useState } from 'react';
import { Clock, Star, Timer, DollarSign, X } from 'lucide-react';
import { PremiumColors, PremiumMotion } from '../constants/premiumDesignTokens';

export interface MetricData {
  clientsWaiting: number;
  nextVip: string | null;
  avgWaitTime: string;
  revenueToday: number;
}

interface FrontDeskMetricsProps {
  data: MetricData;
  onFilterChange?: (filter: 'waiting' | 'vip' | 'waitTime' | 'revenue' | null) => void;
  activeFilter?: 'waiting' | 'vip' | 'waitTime' | 'revenue' | null;
}

export function FrontDeskMetrics({ data, onFilterChange, activeFilter }: FrontDeskMetricsProps) {
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);

  const handleMetricClick = (filter: 'waiting' | 'vip' | 'waitTime' | 'revenue') => {
    // Toggle filter: if already active, clear it; otherwise set it
    if (activeFilter === filter) {
      onFilterChange?.(null);
    } else {
      onFilterChange?.(filter);
    }
  };

  const baseCardStyle = {
    background: PremiumColors.paper.base,
    borderRadius: '8px',
    padding: '12px 16px',
    boxShadow: PremiumColors.shadows.sm,
    border: `1px solid ${PremiumColors.borders.light}`,
    cursor: 'pointer',
    transition: `all ${PremiumMotion.duration.fast} ${PremiumMotion.easing.easeOut}`,
  };

  const hoverCardStyle = {
    background: PremiumColors.paper.hover,
    boxShadow: PremiumColors.shadows.md,
    borderColor: PremiumColors.borders.medium,
  };

  const activeCardStyle = {
    background: PremiumColors.paper.selected,
    boxShadow: PremiumColors.shadows.md,
    borderColor: PremiumColors.borders.accent,
  };

  const getCardStyle = (metricKey: string, isActive: boolean) => {
    const isHovered = hoveredMetric === metricKey;
    return {
      ...baseCardStyle,
      ...(isActive && activeCardStyle),
      ...(isHovered && !isActive && hoverCardStyle),
    };
  };

  return (
    <div className="w-full bg-white/95 backdrop-blur-sm border-b sticky top-0 z-10" style={{ borderColor: PremiumColors.borders.light }}>
      <div className="px-4 py-3">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Clients Waiting */}
          <div
            onClick={() => handleMetricClick('waiting')}
            onMouseEnter={() => setHoveredMetric('waiting')}
            onMouseLeave={() => setHoveredMetric(null)}
            style={getCardStyle('waiting', activeFilter === 'waiting')}
            className="relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={16} style={{ color: PremiumColors.status.waiting.icon }} strokeWidth={2} />
                  <span className="text-xs font-medium" style={{ color: PremiumColors.text.tertiary }}>
                    Waiting
                  </span>
                </div>
                <div className="text-2xl font-bold" style={{ color: PremiumColors.text.primary }}>
                  {data.clientsWaiting}
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: PremiumColors.text.tertiary }}>
                  clients in queue
                </div>
              </div>
              {activeFilter === 'waiting' && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: PremiumColors.status.waiting.icon }} />
                </div>
              )}
            </div>
            {/* Accent bar at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-1 transition-all duration-200" style={{ 
              background: activeFilter === 'waiting' ? PremiumColors.status.waiting.hover : PremiumColors.status.waiting.primary,
              opacity: activeFilter === 'waiting' ? 1 : hoveredMetric === 'waiting' ? 0.8 : 0.5,
            }} />
          </div>

          {/* Next VIP */}
          <div
            onClick={() => handleMetricClick('vip')}
            onMouseEnter={() => setHoveredMetric('vip')}
            onMouseLeave={() => setHoveredMetric(null)}
            style={getCardStyle('vip', activeFilter === 'vip')}
            className="relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Star size={16} style={{ color: PremiumColors.badges.vip.accent }} strokeWidth={2} fill={PremiumColors.badges.vip.accent} />
                  <span className="text-xs font-medium" style={{ color: PremiumColors.text.tertiary }}>
                    Next VIP
                  </span>
                </div>
                <div className="text-sm font-bold truncate" style={{ color: PremiumColors.text.primary }}>
                  {data.nextVip || 'None'}
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: PremiumColors.text.tertiary }}>
                  priority client
                </div>
              </div>
              {activeFilter === 'vip' && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: PremiumColors.badges.vip.accent }} />
                </div>
              )}
            </div>
            {/* Accent bar at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-1 transition-all duration-200" style={{ 
              background: PremiumColors.badges.vip.accent,
              opacity: activeFilter === 'vip' ? 1 : hoveredMetric === 'vip' ? 0.8 : 0.5,
            }} />
          </div>

          {/* Avg Wait Time */}
          <div
            onClick={() => handleMetricClick('waitTime')}
            onMouseEnter={() => setHoveredMetric('waitTime')}
            onMouseLeave={() => setHoveredMetric(null)}
            style={getCardStyle('waitTime', activeFilter === 'waitTime')}
            className="relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Timer size={16} style={{ color: '#3B82F6' }} strokeWidth={2} />
                  <span className="text-xs font-medium" style={{ color: PremiumColors.text.tertiary }}>
                    Avg Wait
                  </span>
                </div>
                <div className="text-2xl font-bold" style={{ color: PremiumColors.text.primary }}>
                  {data.avgWaitTime}
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: PremiumColors.text.tertiary }}>
                  average time
                </div>
              </div>
              {activeFilter === 'waitTime' && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#3B82F6' }} />
                </div>
              )}
            </div>
            {/* Accent bar at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-1 transition-all duration-200" style={{ 
              background: '#3B82F6',
              opacity: activeFilter === 'waitTime' ? 1 : hoveredMetric === 'waitTime' ? 0.8 : 0.5,
            }} />
          </div>

          {/* Revenue Today */}
          <div
            onClick={() => handleMetricClick('revenue')}
            onMouseEnter={() => setHoveredMetric('revenue')}
            onMouseLeave={() => setHoveredMetric(null)}
            style={getCardStyle('revenue', activeFilter === 'revenue')}
            className="relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign size={16} style={{ color: '#10B981' }} strokeWidth={2} />
                  <span className="text-xs font-medium" style={{ color: PremiumColors.text.tertiary }}>
                    Revenue
                  </span>
                </div>
                <div className="text-2xl font-bold" style={{ color: PremiumColors.text.primary }}>
                  ${data.revenueToday.toLocaleString()}
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: PremiumColors.text.tertiary }}>
                  today's total
                </div>
              </div>
              {activeFilter === 'revenue' && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#10B981' }} />
                </div>
              )}
            </div>
            {/* Accent bar at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-1 transition-all duration-200" style={{ 
              background: '#10B981',
              opacity: activeFilter === 'revenue' ? 1 : hoveredMetric === 'revenue' ? 0.8 : 0.5,
            }} />
          </div>
        </div>

        {/* Clear Filter Button (appears when a filter is active) */}
        {activeFilter && (
          <div className="mt-3 flex justify-center">
            <button
              onClick={() => onFilterChange?.(null)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150"
              style={{
                background: PremiumColors.paper.base,
                color: PremiumColors.text.secondary,
                border: `1px solid ${PremiumColors.borders.light}`,
                boxShadow: PremiumColors.shadows.sm,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = PremiumColors.paper.hover;
                e.currentTarget.style.borderColor = PremiumColors.borders.medium;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = PremiumColors.paper.base;
                e.currentTarget.style.borderColor = PremiumColors.borders.light;
              }}
            >
              <X size={14} />
              Clear Filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
