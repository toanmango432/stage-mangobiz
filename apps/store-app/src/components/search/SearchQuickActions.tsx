/**
 * Search Quick Actions - Premium Horizontal Filter Tiles
 *
 * Features:
 * - Horizontal scroll with snap points
 * - Distinctive colored icons with gradients
 * - Tactile hover/press states
 * - Stagger animations on mount
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  Hash,
  AtSign,
  DollarSign,
  Calendar,
  User,
  Scissors,
  Settings,
  Sparkles,
  Navigation,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SearchPrefix } from '@/services/search';
import { PREFIX_CONFIG } from '@/services/search';

// ============================================================================
// Icon Map with custom styling
// ============================================================================

interface PrefixStyle {
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  shadowColor: string;
}

const PREFIX_STYLES: Record<SearchPrefix, PrefixStyle> = {
  '': {
    icon: Hash,
    gradient: 'from-stone-400 to-stone-500',
    iconColor: 'text-stone-500',
    bgColor: 'bg-stone-50',
    borderColor: 'border-stone-200',
    shadowColor: 'shadow-stone-500/10',
  },
  '#': {
    icon: Hash,
    gradient: 'from-blue-400 to-blue-500',
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200/60',
    shadowColor: 'shadow-blue-500/20',
  },
  '@': {
    icon: AtSign,
    gradient: 'from-purple-400 to-purple-500',
    iconColor: 'text-purple-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200/60',
    shadowColor: 'shadow-purple-500/20',
  },
  '$': {
    icon: DollarSign,
    gradient: 'from-emerald-400 to-emerald-500',
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200/60',
    shadowColor: 'shadow-emerald-500/20',
  },
  'date:': {
    icon: Calendar,
    gradient: 'from-pink-400 to-pink-500',
    iconColor: 'text-pink-500',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200/60',
    shadowColor: 'shadow-pink-500/20',
  },
  'staff:': {
    icon: User,
    gradient: 'from-orange-400 to-orange-500',
    iconColor: 'text-orange-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200/60',
    shadowColor: 'shadow-orange-500/20',
  },
  'status:': {
    icon: Sparkles,
    gradient: 'from-amber-400 to-amber-500',
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200/60',
    shadowColor: 'shadow-amber-500/20',
  },
  'service:': {
    icon: Scissors,
    gradient: 'from-teal-400 to-teal-500',
    iconColor: 'text-teal-500',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200/60',
    shadowColor: 'shadow-teal-500/20',
  },
  'set:': {
    icon: Settings,
    gradient: 'from-slate-400 to-slate-500',
    iconColor: 'text-slate-500',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200/60',
    shadowColor: 'shadow-slate-500/20',
  },
  'go:': {
    icon: Navigation,
    gradient: 'from-indigo-400 to-indigo-500',
    iconColor: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200/60',
    shadowColor: 'shadow-indigo-500/20',
  },
};

// Prefixes to display (excluding empty and status prefixes for cleaner UI)
const DISPLAY_PREFIXES: SearchPrefix[] = ['#', '@', '$', 'date:', 'staff:', 'service:', 'set:', 'go:'];

// ============================================================================
// Types
// ============================================================================

interface SearchQuickActionsProps {
  onPrefixSelect: (prefix: SearchPrefix) => void;
}

// ============================================================================
// Component
// ============================================================================

export const SearchQuickActions = memo(function SearchQuickActions({
  onPrefixSelect,
}: SearchQuickActionsProps) {
  return (
    <div className="px-5 py-4">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-amber-500" />
        <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">
          Quick Filters
        </span>
      </div>

      {/* Horizontal scrollable tiles */}
      <div className="relative -mx-5 px-5">
        <div className="flex gap-3 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory scrollbar-hide">
          {DISPLAY_PREFIXES.map((prefix, idx) => (
            <QuickActionTile
              key={prefix}
              prefix={prefix}
              index={idx}
              onClick={() => onPrefixSelect(prefix)}
            />
          ))}
        </div>

        {/* Fade edges for scroll hint */}
        <div className="absolute top-0 right-0 w-12 h-full bg-gradient-to-l from-[#faf9f7] to-transparent pointer-events-none" />
      </div>

      {/* Helper text */}
      <p className="text-[11px] text-stone-400 mt-4 text-center">
        Type <kbd className="px-1.5 py-0.5 mx-0.5 bg-white rounded border border-stone-200 text-[10px] font-semibold text-stone-500">#</kbd>
        <kbd className="px-1.5 py-0.5 mx-0.5 bg-white rounded border border-stone-200 text-[10px] font-semibold text-stone-500">@</kbd>
        <kbd className="px-1.5 py-0.5 mx-0.5 bg-white rounded border border-stone-200 text-[10px] font-semibold text-stone-500">$</kbd>
        to filter, or click a tile
      </p>
    </div>
  );
});

// ============================================================================
// Quick Action Tile
// ============================================================================

interface QuickActionTileProps {
  prefix: SearchPrefix;
  index: number;
  onClick: () => void;
}

function QuickActionTile({ prefix, index, onClick }: QuickActionTileProps) {
  const config = PREFIX_CONFIG[prefix];
  const style = PREFIX_STYLES[prefix];
  const IconComponent = style.icon;

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.05,
        duration: 0.3,
        ease: [0.23, 1, 0.32, 1],
      }}
      onClick={onClick}
      className={cn(
        'group flex flex-col items-center gap-2.5',
        'min-w-[90px] px-4 py-4',
        'bg-white rounded-2xl',
        'border border-stone-150',
        'shadow-sm hover:shadow-md',
        'transition-all duration-200',
        'snap-start',
        'active:scale-95'
      )}
    >
      {/* Icon container with gradient on hover */}
      <div className={cn(
        'relative flex items-center justify-center w-11 h-11 rounded-xl',
        'transition-all duration-200',
        style.bgColor,
        'group-hover:shadow-lg',
        `group-hover:${style.shadowColor}`
      )}>
        {/* Gradient overlay on hover */}
        <div className={cn(
          'absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100',
          'transition-opacity duration-200',
          `bg-gradient-to-br ${style.gradient}`
        )} />

        {/* Icon */}
        <IconComponent className={cn(
          'w-5 h-5 relative z-10 transition-colors duration-200',
          style.iconColor,
          'group-hover:text-white'
        )} />
      </div>

      {/* Label */}
      <div className="text-center">
        <span className={cn(
          'text-xs font-semibold text-stone-700',
          'group-hover:text-stone-900',
          'transition-colors duration-200'
        )}>
          {config.label}
        </span>
      </div>

      {/* Prefix hint */}
      <div className={cn(
        'px-2 py-0.5 rounded-md',
        'bg-stone-50 group-hover:bg-stone-100',
        'transition-colors duration-200'
      )}>
        <span className="text-[10px] font-mono font-semibold text-stone-400">
          {prefix}
        </span>
      </div>
    </motion.button>
  );
}

export default SearchQuickActions;
