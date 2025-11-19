import { ReactNode } from 'react';
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
}

const metricToneClass: Record<MetricPill['tone'], string> = {
  alert: 'border-red-100 bg-red-50 text-red-600',
  info: 'border-blue-100 bg-blue-50 text-blue-600',
  muted: 'border-slate-200 bg-slate-100 text-slate-600',
  vip: 'border-amber-200 bg-amber-100 text-amber-700',
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
}: FrontDeskHeaderProps) {
  const theme = getTheme(variant);
  return (
    <div className={clsx(frontDeskHeaderBase, theme.wrapper, className)}>
      <div className={clsx(frontDeskHeaderSpacing, theme.padding)}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className={clsx(theme.iconWrapper)}>{icon}</div>
            <h2 className={clsx(frontDeskHeaderTitle, theme.titleClass)}>{title}</h2>
            {typeof count !== 'undefined' && (
              <span className={clsx(theme.countBadge)}>{count}</span>
            )}
            {metricPills && metricPills.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {metricPills.map(({ label, value, tone }) => (
                  <span
                    key={`${label}-${value}`}
                    className={clsx(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium',
                      metricToneClass[tone],
                      theme.metricPill
                    )}
                  >
                    <span>{label}</span>
                    <span>{value}</span>
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


