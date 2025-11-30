import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Legacy Tab components for backward compatibility
 * These match the old API: Tabs with onChange and Tab with value/label/badge
 */

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  onChange?: (value: string) => void;
  children: React.ReactNode;
}

export interface TabProps {
  value: string;
  label: string;
  badge?: number | string;
}

// Legacy Tabs wrapper that uses onChange callback
export function LegacyTabs({ value, onChange, children, className, ...props }: TabsProps) {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500",
        className
      )}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement<TabProps>(child)) {
          return React.cloneElement(child as React.ReactElement<TabProps & { isActive: boolean; onClick: () => void }>, {
            isActive: value === child.props.value,
            onClick: () => onChange?.(child.props.value),
          });
        }
        return child;
      })}
    </div>
  );
}

// Legacy Tab button
export function Tab({
  value,
  label,
  badge,
  isActive,
  onClick,
}: TabProps & { isActive?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "bg-white text-gray-950 shadow-sm"
          : "text-gray-500 hover:text-gray-900"
      )}
    >
      {label}
      {badge !== undefined && (
        <span
          className={cn(
            "ml-2 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium",
            isActive
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-200 text-gray-600"
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
