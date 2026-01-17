import { ReactNode, useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import {
  frontDeskHeaderActionButton,
  frontDeskHeaderBase,
  frontDeskHeaderSpacing,
  frontDeskHeaderTitle,
  primaryHeaderTheme,
  supportingHeaderTheme,
  FrontDeskHeaderTheme,
} from './headerTokens';

type FrontDeskHeaderVariant = 'primary' | 'supporting';

interface MetricPill {
  label: string;
  value: string | number;
  tone: 'alert' | 'info' | 'muted' | 'vip';
}

interface FrontDeskHeaderProps {
  variant?: FrontDeskHeaderVariant;
  title: string;
  count?: number | string;
  icon: ReactNode;
  leftActions?: ReactNode;
  rightActions?: ReactNode;
  metricPills?: MetricPill[];
  className?: string;
  customTheme?: FrontDeskHeaderTheme;
  subtitle?: string;
  /** Whether to show metric pills (default: true) */
  showMetricPills?: boolean;
  /** Hide metric pills on mobile for simpler display */
  hideMetricPillsOnMobile?: boolean;
  /** Whether to animate count badge when count changes (default: false) */
  animateCountChanges?: boolean;
}

const metricToneClass: Record<MetricPill['tone'], string> = {
  alert: 'border-red-100 bg-red-50 text-red-600',
  info: 'border-blue-100 bg-blue-50 text-blue-600',
  muted: 'border-slate-200 bg-slate-100 text-slate-600',
  vip: 'border-rose-200 bg-rose-100 text-rose-700',
};

const getTheme = (variant: FrontDeskHeaderVariant): FrontDeskHeaderTheme =>
  variant === 'primary' ? primaryHeaderTheme : supportingHeaderTheme;

export function FrontDeskHeader({
  variant = 'primary',
  title,
  count,
  icon,
  leftActions,
  rightActions,
  metricPills,
  className,
  customTheme,
  subtitle,
  showMetricPills = true,
  hideMetricPillsOnMobile = false,
  animateCountChanges = false,
}: FrontDeskHeaderProps) {
  const theme = customTheme || getTheme(variant);
  const shouldShowMetrics = showMetricPills && metricPills && metricPills.length > 0;

  // Track count changes for animation (US-025)
  const [isAnimating, setIsAnimating] = useState(false);
  const prevCountRef = useRef(count);

  useEffect(() => {
    if (animateCountChanges && prevCountRef.current !== count && prevCountRef.current !== undefined) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = count;
  }, [count, animateCountChanges]);

  return (
    <div className={clsx(frontDeskHeaderBase, theme.wrapper, className)}>
      <div className={clsx(frontDeskHeaderSpacing, theme.padding)}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className={clsx(theme.iconWrapper)}>{icon}</div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className={clsx(frontDeskHeaderTitle, theme.titleClass)}>{title}</h2>
                {typeof count !== 'undefined' && (
                  <span
                    className={clsx(
                      theme.countBadge,
                      'transition-all duration-200',
                      isAnimating && 'animate-pulse ring-2 ring-offset-1 ring-slate-300 scale-110'
                    )}
                  >
                    {count}
                  </span>
                )}
              </div>
              {subtitle && (
                <span className={clsx(theme.subtitleClass || 'text-2xs text-slate-600')}>{subtitle}</span>
              )}
            </div>
            {shouldShowMetrics && (
              <div className={clsx(
                'flex flex-wrap items-center gap-2',
                hideMetricPillsOnMobile && 'hidden sm:flex'
              )}>
                {metricPills.map(({ label, value, tone }) => (
                  <span
                    key={`${label}-${value}`}
                    className={clsx(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium',
                      metricToneClass[tone],
                      theme.metricPill
                    )}
                  >
                    <span>{label}</span>
                    <span className="font-semibold">{value}</span>
                  </span>
                ))}
              </div>
            )}
            {leftActions}
          </div>

          <div className="flex items-center gap-1.5">
            {rightActions}
          </div>
        </div>
      </div>
    </div>
  );
}

export const HeaderActionButton = ({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button className={clsx(frontDeskHeaderActionButton, className)} {...props}>
    {children}
  </button>
);




