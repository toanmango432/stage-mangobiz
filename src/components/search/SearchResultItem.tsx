/**
 * Search Result Item - Premium Tactile Card Design
 *
 * Features:
 * - Paper-like tactile feel with subtle texture
 * - Refined shadows and depth
 * - Premium hover/selection states
 * - Stagger animations
 * - High-contrast accessibility
 */

import { memo, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserCircle,
  Users,
  Scissors,
  Calendar,
  FileText,
  DollarSign,
  Phone,
  Eye,
  Pencil,
  Plus,
  CreditCard,
  Printer,
  RefreshCcw,
  X,
  CheckCircle,
  UserPlus,
  MoreHorizontal,
  Settings,
  Gift,
  ChevronRight,
  Navigation,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SearchResult, QuickAction, SearchEntityType } from '@/services/search';
import { ENTITY_CONFIG } from '@/services/search';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ============================================================================
// Icon Maps
// ============================================================================

const ENTITY_ICONS: Record<SearchEntityType, React.ComponentType<{ className?: string }>> = {
  client: UserCircle,
  staff: Users,
  service: Scissors,
  appointment: Calendar,
  ticket: FileText,
  transaction: DollarSign,
  setting: Settings,
  giftcard: Gift,
  page: Navigation,
};

const ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Calendar: Calendar,
  Phone: Phone,
  User: UserCircle,
  Plus: Plus,
  Eye: Eye,
  Pencil: Pencil,
  CreditCard: CreditCard,
  Printer: Printer,
  RefreshCcw: RefreshCcw,
  X: X,
  CheckCircle: CheckCircle,
  UserPlus: UserPlus,
  Settings: Settings,
  Gift: Gift,
  Navigation: Navigation,
  ArrowRight: ArrowRight,
};

// Premium badge styling with refined colors
const BADGE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  green: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200/60',
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200/60',
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200/60',
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200/60',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200/60',
  },
  gray: {
    bg: 'bg-stone-100',
    text: 'text-stone-600',
    border: 'border-stone-200/60',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200/60',
  },
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200/60',
  },
  pink: {
    bg: 'bg-pink-50',
    text: 'text-pink-700',
    border: 'border-pink-200/60',
  },
  slate: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200/60',
  },
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200/60',
  },
};

// Entity-specific accent gradients for premium feel
const ENTITY_GRADIENTS: Record<SearchEntityType, string> = {
  client: 'from-purple-500 to-purple-600',
  staff: 'from-orange-500 to-orange-600',
  service: 'from-emerald-500 to-emerald-600',
  appointment: 'from-pink-500 to-pink-600',
  ticket: 'from-blue-500 to-blue-600',
  transaction: 'from-teal-500 to-teal-600',
  setting: 'from-slate-500 to-slate-600',
  giftcard: 'from-rose-500 to-rose-600',
  page: 'from-indigo-500 to-indigo-600',
};

// ============================================================================
// Types
// ============================================================================

interface SearchResultItemProps {
  result: SearchResult;
  isSelected?: boolean;
  onSelect?: () => void;
  onActionClick?: (action: QuickAction) => void;
  animationDelay?: number;
}

// ============================================================================
// Component
// ============================================================================

export const SearchResultItem = memo(function SearchResultItem({
  result,
  isSelected = false,
  onSelect,
  onActionClick,
  animationDelay = 0,
}: SearchResultItemProps) {
  const config = ENTITY_CONFIG[result.type] || {
    bgColor: 'bg-stone-50',
    color: 'text-stone-600',
  };
  const IconComponent = ENTITY_ICONS[result.type] || FileText;
  const gradient = ENTITY_GRADIENTS[result.type] || 'from-stone-500 to-stone-600';
  const [isHovered, setIsHovered] = useState(false);

  const { primaryAction, secondaryActions } = useMemo(() => {
    const [primary, ...secondary] = result.actions;
    return {
      primaryAction: primary,
      secondaryActions: secondary.slice(0, 4),
    };
  }, [result.actions]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.25,
        delay: animationDelay,
        ease: [0.23, 1, 0.32, 1],
      }}
      role="option"
      aria-selected={isSelected}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        // Base - tactile paper card
        'group relative flex items-center gap-4 px-4 py-3.5',
        'rounded-2xl cursor-pointer',
        'transition-all duration-200 ease-out',
        // Background and borders
        isSelected
          ? 'bg-white shadow-[0_4px_12px_-4px_rgba(245,158,11,0.3),0_0_0_2px_rgba(245,158,11,0.4)]'
          : 'bg-white/70 hover:bg-white hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)]',
        // Focus visible
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2'
      )}
    >
      {/* Selection indicator - left accent bar */}
      <div
        className={cn(
          'absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full',
          'transition-all duration-200',
          isSelected
            ? `bg-gradient-to-b ${gradient} opacity-100`
            : 'opacity-0'
        )}
      />

      {/* Avatar / Icon with premium gradient */}
      <div className="relative shrink-0">
        {result.avatar ? (
          <div className={cn(
            'w-12 h-12 rounded-2xl overflow-hidden',
            'ring-2 ring-white shadow-sm',
            'transition-transform duration-200',
            isHovered && 'scale-105'
          )}>
            <img
              src={result.avatar}
              alt={result.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div
            className={cn(
              'relative w-12 h-12 rounded-2xl',
              'flex items-center justify-center',
              'transition-transform duration-200',
              config.bgColor,
              isHovered && 'scale-105'
            )}
          >
            {/* Subtle inner glow */}
            <div className={cn(
              'absolute inset-0 rounded-2xl opacity-0 transition-opacity',
              isSelected && 'opacity-100',
              `bg-gradient-to-br ${gradient}/10`
            )} />
            <IconComponent className={cn('w-5 h-5 relative z-10', config.color)} />
          </div>
        )}

        {/* Status indicator dot */}
        {(result.type === 'staff' || result.type === 'client') &&
         result.badges?.some(b => b.label === 'Available' || b.label === 'VIP') && (
          <span className={cn(
            'absolute -top-0.5 -right-0.5 w-3.5 h-3.5',
            'bg-emerald-500 border-[2.5px] border-white rounded-full',
            'shadow-sm'
          )} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5">
          {/* Title */}
          <span className={cn(
            'font-semibold truncate transition-colors',
            isSelected ? 'text-amber-900' : 'text-stone-800'
          )}>
            {result.title}
          </span>

          {/* Badges - refined pill styling */}
          {result.badges && result.badges.length > 0 && (
            <div className="flex items-center gap-1.5 shrink-0">
              {result.badges.slice(0, 2).map((badge, idx) => {
                const style = BADGE_STYLES[badge.color] || BADGE_STYLES.gray;
                return (
                  <span
                    key={idx}
                    className={cn(
                      'inline-flex items-center px-2 py-0.5',
                      'text-[10px] font-bold uppercase tracking-wide',
                      'rounded-md border',
                      style.bg,
                      style.text,
                      style.border
                    )}
                  >
                    {badge.label}
                  </span>
                );
              })}
              {result.badges.length > 2 && (
                <span className="text-[10px] font-semibold text-stone-400">
                  +{result.badges.length - 2}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Subtitle */}
        {result.subtitle && (
          <p className={cn(
            'text-sm truncate mt-0.5 transition-colors',
            isSelected ? 'text-amber-700/80' : 'text-stone-500'
          )}>
            {result.subtitle}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className={cn(
        'flex items-center gap-2 shrink-0',
        'transition-opacity duration-200',
        isSelected || isHovered ? 'opacity-100' : 'opacity-70'
      )}>
        {/* Primary action button */}
        {primaryAction && (
          <PrimaryActionButton
            action={primaryAction}
            isSelected={isSelected}
            onClick={(e) => {
              e.stopPropagation();
              onActionClick?.(primaryAction);
            }}
          />
        )}

        {/* Secondary actions in overflow menu */}
        {secondaryActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-lg',
                  'transition-all duration-150',
                  isSelected
                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200',
                  'opacity-0 group-hover:opacity-100'
                )}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-44 py-1.5 bg-white border-stone-200 shadow-lg rounded-xl"
            >
              {secondaryActions.map((action) => {
                const ActionIcon = ACTION_ICONS[action.icon] || Eye;
                return (
                  <DropdownMenuItem
                    key={action.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onActionClick?.(action);
                    }}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 mx-1.5 rounded-lg cursor-pointer',
                      'text-sm font-medium',
                      action.variant === 'danger'
                        ? 'text-red-600 hover:bg-red-50 focus:bg-red-50'
                        : 'text-stone-700 hover:bg-stone-50 focus:bg-stone-50'
                    )}
                  >
                    <ActionIcon className="w-4 h-4" />
                    <span>{action.label}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Chevron indicator on hover */}
        <ChevronRight
          className={cn(
            'w-4 h-4 text-stone-300 transition-all duration-200',
            'opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0',
            isSelected && 'text-amber-400 opacity-100 translate-x-0'
          )}
        />
      </div>
    </motion.div>
  );
});

// ============================================================================
// Primary Action Button
// ============================================================================

interface PrimaryActionButtonProps {
  action: QuickAction;
  isSelected?: boolean;
  onClick: (e: React.MouseEvent) => void;
}

function PrimaryActionButton({ action, isSelected, onClick }: PrimaryActionButtonProps) {
  const ActionIcon = ACTION_ICONS[action.icon] || Eye;

  const variants = {
    primary: cn(
      'bg-gradient-to-b from-amber-400 to-amber-500 text-white',
      'shadow-md shadow-amber-500/20',
      'hover:from-amber-500 hover:to-amber-600',
      'active:from-amber-600 active:to-amber-700'
    ),
    danger: cn(
      'bg-red-50 text-red-600 border border-red-200/80',
      'hover:bg-red-100',
      'active:bg-red-200'
    ),
    default: cn(
      isSelected
        ? 'bg-amber-100 text-amber-700 border border-amber-200/80'
        : 'bg-white text-stone-700 border border-stone-200',
      isSelected
        ? 'hover:bg-amber-200'
        : 'hover:bg-stone-50 hover:border-stone-300',
      'shadow-sm'
    ),
  };

  const variant = action.variant === 'primary'
    ? 'primary'
    : action.variant === 'danger'
    ? 'danger'
    : 'default';

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3.5 py-2',
        'text-xs font-semibold rounded-xl',
        'transition-all duration-150',
        'active:scale-95',
        variants[variant]
      )}
      title={action.label}
    >
      <ActionIcon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{action.label}</span>
    </button>
  );
}

export default SearchResultItem;
