import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { TimeSeriesData } from "@/types/analytics";

interface UsageChartProps {
  title: string;
  data: TimeSeriesData[];
  type?: 'line' | 'bar';
  dataKey?: string;
  color?: string;
}

export const UsageChart = ({ 
  title, 
  data, 
  type = 'line',
  dataKey = 'value',
  color = '#8b5cf6'
}: UsageChartProps) => {
  const ChartComponent = type === 'line' ? LineChart : BarChart;
  const DataComponent = type === 'line' ? Line : Bar;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ChartComponent data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="label" 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <DataComponent 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color}
              fill={color}
              strokeWidth={2}
              name={title}
            />
          </ChartComponent>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

