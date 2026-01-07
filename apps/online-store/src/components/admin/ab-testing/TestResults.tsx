import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Users, 
  Target,
  BarChart3,
  Award
} from 'lucide-react';
import { TestResults as TestResultsData, StatisticalSignificance } from '@/types/ab-test';
import { cn } from '@/lib/utils';

interface TestResultsProps {
  results: TestResultsData;
  onConcludeTest?: () => void;
  onExtendTest?: () => void;
}

const TestResults: React.FC<TestResultsProps> = ({ 
  results, 
  onConcludeTest, 
  onExtendTest 
}) => {
  const getSignificanceColor = (significance: StatisticalSignificance | null) => {
    if (!significance) return 'text-gray-500';
    if (significance.isSignificant) return 'text-green-600';
    if (significance.confidenceLevel > 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSignificanceIcon = (significance: StatisticalSignificance | null) => {
    if (!significance) return <AlertCircle className="h-4 w-4" />;
    if (significance.isSignificant) return <CheckCircle className="h-4 w-4" />;
    if (significance.confidenceLevel > 0.8) return <Clock className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  const getRecommendedActionColor = (action: string) => {
    switch (action) {
      case 'conclude':
        return 'bg-green-100 text-green-800';
      case 'continue':
        return 'bg-blue-100 text-blue-800';
      case 'extend':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString();
  };

  const getVariantIcon = (isWinner: boolean) => {
    return isWinner ? (
      <Award className="h-5 w-5 text-yellow-500" />
    ) : (
      <BarChart3 className="h-5 w-5 text-gray-400" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Visitors</p>
                <p className="text-2xl font-bold">{formatNumber(results.totalVisitors)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Conversions</p>
                <p className="text-2xl font-bold">{formatNumber(results.totalConversions)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Overall Rate</p>
                <p className="text-2xl font-bold">
                  {formatPercentage(results.totalConversions / Math.max(1, results.totalVisitors))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                {getSignificanceIcon(results.statisticalSignificance)}
              </div>
              <div>
                <p className="text-sm text-gray-600">Significance</p>
                <p className={cn(
                  "text-2xl font-bold",
                  getSignificanceColor(results.statisticalSignificance)
                )}>
                  {results.statisticalSignificance 
                    ? formatPercentage(results.statisticalSignificance.confidenceLevel)
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistical Significance */}
      {results.statisticalSignificance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>Statistical Significance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Confidence Level</span>
                  <Badge 
                    variant={results.statisticalSignificance.isSignificant ? "default" : "secondary"}
                    className={getSignificanceColor(results.statisticalSignificance)}
                  >
                    {formatPercentage(results.statisticalSignificance.confidenceLevel)}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-medium">P-Value</span>
                  <span className="text-sm text-gray-600">
                    {results.statisticalSignificance.pValue.toFixed(4)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">Significant</span>
                  <Badge 
                    variant={results.statisticalSignificance.isSignificant ? "default" : "destructive"}
                  >
                    {results.statisticalSignificance.isSignificant ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                {results.statisticalSignificance.winner && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Winner</span>
                      <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                        Variant {results.statisticalSignificance.winner}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Improvement</span>
                      <span className="text-sm text-green-600 font-semibold">
                        +{results.statisticalSignificance.improvement.toFixed(1)}%
                      </span>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between">
                  <span className="font-medium">Status</span>
                  <Badge className={getRecommendedActionColor(results.recommendedAction)}>
                    {results.recommendedAction.charAt(0).toUpperCase() + results.recommendedAction.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Variant Results */}
      <Card>
        <CardHeader>
          <CardTitle>Variant Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(results.variants).map(([variantId, variant]) => (
              <div key={variantId} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {getVariantIcon(variant.isWinner)}
                    <h3 className="text-lg font-semibold">{variant.name}</h3>
                    {variant.isWinner && (
                      <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                        Winner
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
                      {formatPercentage(variant.conversionRate)}
                    </p>
                    <p className="text-sm text-gray-600">conversion rate</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Visitors</p>
                    <p className="text-lg font-semibold">{formatNumber(variant.visitors)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Conversions</p>
                    <p className="text-lg font-semibold">{formatNumber(variant.conversions)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Confidence Interval</p>
                    <p className="text-sm">
                      {formatPercentage(variant.confidenceInterval.lower)} - {formatPercentage(variant.confidenceInterval.upper)}
                    </p>
                  </div>
                </div>

                {/* Progress bar for conversion rate */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Conversion Rate</span>
                    <span>{formatPercentage(variant.conversionRate)}</span>
                  </div>
                  <Progress 
                    value={variant.conversionRate * 100} 
                    className="h-2"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {results.recommendedAction === 'conclude' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-800">Test Complete</h4>
                    <p className="text-green-700 text-sm mt-1">
                      The test has reached statistical significance. You can safely conclude the test and implement the winning variant.
                    </p>
                    {onConcludeTest && (
                      <Button 
                        onClick={onConcludeTest} 
                        className="mt-3"
                        size="sm"
                      >
                        Conclude Test
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {results.recommendedAction === 'continue' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-800">Continue Testing</h4>
                    <p className="text-blue-700 text-sm mt-1">
                      The test needs more data to reach statistical significance. Continue running the test to gather more visitors and conversions.
                    </p>
                    {results.estimatedDuration && (
                      <p className="text-blue-600 text-sm mt-2">
                        Estimated time to significance: {results.estimatedDuration} days
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {results.recommendedAction === 'extend' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-800">Consider Extending</h4>
                    <p className="text-yellow-700 text-sm mt-1">
                      The test has been running for a while without reaching significance. Consider extending the test duration or increasing the sample size.
                    </p>
                    {onExtendTest && (
                      <Button 
                        onClick={onExtendTest} 
                        variant="outline"
                        className="mt-3"
                        size="sm"
                      >
                        Extend Test
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestResults;