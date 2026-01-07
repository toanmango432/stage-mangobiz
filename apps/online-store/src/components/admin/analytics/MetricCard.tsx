import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MetricValue } from "@/types/analytics";

interface MetricCardProps {
  title: string;
  value: string | number;
  metric: MetricValue;
  icon?: React.ReactNode;
  format?: 'number' | 'currency' | 'percentage' | 'duration';
}

export const MetricCard = ({ 
  title, 
  value, 
  metric, 
  icon,
  format = 'number' 
}: MetricCardProps) => {
  const formatValue = (val: number): string => {
    switch (format) {
      case 'currency':
        return `$${val.toFixed(2)}`;
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'duration':
        const mins = Math.floor(val / 60);
        const secs = Math.floor(val % 60);
        return `${mins}m ${secs}s`;
      default:
        return val.toLocaleString();
    }
  };

  const getTrendIcon = () => {
    switch (metric.trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    switch (metric.trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-2 mt-2 text-xs">
          {getTrendIcon()}
          <span className={getTrendColor()}>
            {metric.changePercent > 0 ? '+' : ''}
            {metric.changePercent.toFixed(1)}%
          </span>
          <span className="text-muted-foreground">
            vs previous period
          </span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Previous: {formatValue(metric.previous)}
        </div>
      </CardContent>
    </Card>
  );
};

