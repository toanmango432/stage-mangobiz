import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Square, 
  Edit, 
  Trash2, 
  BarChart3, 
  Users, 
  Target,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ABTestExperiment, TestStatus } from '@/types/ab-test';

interface ExperimentCardProps {
  experiment: ABTestExperiment;
  onStart: () => void;
  onPause: () => void;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewResults: () => void;
}

export const ExperimentCard: React.FC<ExperimentCardProps> = ({
  experiment,
  onStart,
  onPause,
  onComplete,
  onEdit,
  onDelete,
  onViewResults
}) => {
  const getStatusColor = (status: TestStatus) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'running': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: TestStatus) => {
    switch (status) {
      case 'draft': return <Edit className="h-4 w-4" />;
      case 'running': return <Play className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'promotion': return '🎉';
      case 'hero': return '🎯';
      case 'cta': return '👆';
      case 'pricing': return '💰';
      case 'layout': return '📐';
      case 'content': return '📝';
      default: return '🧪';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'promotion': return 'bg-purple-100 text-purple-800';
      case 'hero': return 'bg-blue-100 text-blue-800';
      case 'cta': return 'bg-green-100 text-green-800';
      case 'pricing': return 'bg-yellow-100 text-yellow-800';
      case 'layout': return 'bg-indigo-100 text-indigo-800';
      case 'content': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalVisitors = experiment.variants.reduce((sum, variant) => sum + (variant.visitors || 0), 0);
  const totalConversions = experiment.variants.reduce((sum, variant) => sum + (variant.conversions || 0), 0);
  const overallConversionRate = totalVisitors > 0 ? (totalConversions / totalVisitors) * 100 : 0;

  const getDuration = () => {
    if (!experiment.startDate) return null;
    const start = new Date(experiment.startDate);
    const end = experiment.endDate ? new Date(experiment.endDate) : new Date();
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getProgressPercentage = () => {
    if (!experiment.startDate) return 0;
    const daysElapsed = getDuration() || 0;
    const maxDuration = experiment.maxDuration || 30;
    return Math.min((daysElapsed / maxDuration) * 100, 100);
  };

  const getBestVariant = () => {
    if (experiment.variants.length === 0) return null;
    return experiment.variants.reduce((best, current) => {
      const currentRate = current.visitors > 0 ? (current.conversions || 0) / current.visitors : 0;
      const bestRate = best.visitors > 0 ? (best.conversions || 0) / best.visitors : 0;
      return currentRate > bestRate ? current : best;
    });
  };

  const bestVariant = getBestVariant();
  const bestConversionRate = bestVariant && bestVariant.visitors > 0 
    ? ((bestVariant.conversions || 0) / bestVariant.visitors) * 100 
    : 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{getTypeIcon(experiment.type)}</div>
            <div>
              <CardTitle className="text-lg">{experiment.name}</CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={getTypeColor(experiment.type)}>
                  {experiment.type}
                </Badge>
                <Badge className={getStatusColor(experiment.status)}>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(experiment.status)}
                    <span>{experiment.status}</span>
                  </div>
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewResults}
              className="h-8 w-8 p-0"
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        {experiment.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {experiment.description}
          </p>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 text-gray-600 mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs">Visitors</span>
            </div>
            <p className="text-lg font-semibold">{totalVisitors.toLocaleString()}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 text-gray-600 mb-1">
              <Target className="h-4 w-4" />
              <span className="text-xs">Conversions</span>
            </div>
            <p className="text-lg font-semibold">{totalConversions.toLocaleString()}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 text-gray-600 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Rate</span>
            </div>
            <p className="text-lg font-semibold text-blue-600">
              {overallConversionRate.toFixed(2)}%
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 text-gray-600 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Duration</span>
            </div>
            <p className="text-lg font-semibold">
              {getDuration() || 0}d
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {experiment.status === 'running' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Test Progress</span>
              <span>{getDuration() || 0} / {experiment.maxDuration || 30} days</span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
          </div>
        )}

        {/* Best Performing Variant */}
        {bestVariant && experiment.status === 'running' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Best Performing Variant</p>
                <p className="text-sm text-green-600">{bestVariant.name}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-green-700">
                  {bestConversionRate.toFixed(2)}%
                </p>
                <p className="text-xs text-green-600">conversion rate</p>
              </div>
            </div>
          </div>
        )}

        {/* Variants Summary */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Variants ({experiment.variants.length})</p>
          <div className="flex flex-wrap gap-2">
            {experiment.variants.map((variant, index) => {
              const variantRate = variant.visitors > 0 
                ? ((variant.conversions || 0) / variant.visitors) * 100 
                : 0;
              
              return (
                <div key={variant.id} className="flex items-center space-x-2 text-xs">
                  <span className="font-medium">{variant.name}</span>
                  <span className="text-gray-500">
                    {variantRate.toFixed(1)}%
                  </span>
                  <span className="text-gray-400">
                    ({variant.visitors || 0})
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-2">
          {experiment.status === 'draft' && (
            <Button onClick={onStart} size="sm">
              <Play className="h-4 w-4 mr-1" />
              Start Test
            </Button>
          )}
          
          {experiment.status === 'running' && (
            <>
              <Button onClick={onPause} variant="outline" size="sm">
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </Button>
              <Button onClick={onComplete} variant="outline" size="sm">
                <Square className="h-4 w-4 mr-1" />
                Complete
              </Button>
            </>
          )}
          
          {experiment.status === 'paused' && (
            <Button onClick={onStart} size="sm">
              <Play className="h-4 w-4 mr-1" />
              Resume
            </Button>
          )}
          
          {experiment.status === 'completed' && (
            <Button onClick={onViewResults} variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-1" />
              View Results
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};