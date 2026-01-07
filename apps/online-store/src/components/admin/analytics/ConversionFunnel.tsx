import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConversionFunnel } from "@/types/analytics";

interface ConversionFunnelProps {
  funnel: ConversionFunnel;
}

export const ConversionFunnelChart = ({ funnel }: ConversionFunnelProps) => {
  const maxCount = Math.max(...funnel.steps.map(s => s.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{funnel.name}</CardTitle>
        <div className="text-sm text-muted-foreground">
          Overall Conversion: {funnel.conversionRate.toFixed(1)}%
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {funnel.steps.map((step, index) => {
            const widthPercent = maxCount > 0 ? (step.count / maxCount) * 100 : 0;
            
            return (
              <div key={index}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">{step.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {step.count} ({step.conversionRate.toFixed(1)}%)
                  </span>
                </div>
                
                <div className="relative h-12 bg-muted rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-primary flex items-center justify-between px-4 transition-all duration-500"
                    style={{ width: `${widthPercent}%` }}
                  >
                    <span className="text-sm text-primary-foreground font-medium">
                      {step.count}
                    </span>
                  </div>
                </div>
                
                {index < funnel.steps.length - 1 && step.dropoffRate > 0 && (
                  <div className="text-xs text-red-600 mt-1">
                    {step.dropoffRate.toFixed(1)}% drop-off
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{funnel.totalEntries}</div>
              <div className="text-xs text-muted-foreground">Started</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{funnel.totalCompletions}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {funnel.conversionRate.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Conversion</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

