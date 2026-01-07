import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DetailedMetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  prefix?: string;
  trend?: {
    value: number;
    positive: boolean;
  };
  comparison?: string;
  className?: string;
}

export function DetailedMetricCard({
  title,
  value,
  icon: Icon,
  prefix = "",
  trend,
  comparison = "vs last period",
  className,
}: DetailedMetricCardProps) {
  return (
    <Card className={cn("hover-scale", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {prefix}
          {value}
        </div>
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            {trend.positive ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span
              className={cn(
                "text-xs font-medium",
                trend.positive ? "text-green-500" : "text-red-500"
              )}
            >
              {trend.positive ? "+" : ""}
              {trend.value}%
            </span>
            <span className="text-xs text-muted-foreground">{comparison}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
