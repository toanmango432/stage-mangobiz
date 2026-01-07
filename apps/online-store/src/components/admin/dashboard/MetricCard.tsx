import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  prefix?: string;
  className?: string;
}

export const MetricCard = ({ title, value, icon: Icon, trend, prefix = '', className }: MetricCardProps) => {
  return (
    <Card className={cn("hover-scale", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {trend && (
          <p className={cn(
            "text-xs mt-1",
            trend.positive ? "text-green-600" : "text-red-600"
          )}>
            {trend.positive ? '+' : ''}{trend.value}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
};
