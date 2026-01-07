// A/B Testing Types

export type TestStatus = 'draft' | 'running' | 'paused' | 'completed' | 'cancelled';

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  weight: number; // Percentage (0-100)
  config: Record<string, any>;
  isControl?: boolean;
  visitors?: number;
  conversions?: number;
}

export interface ABTestExperiment {
  id: string;
  name: string;
  description: string;
  status: TestStatus;
  variants: ABTestVariant[];
  startDate?: string;
  endDate?: string;
  targetAudience?: {
    segments?: string[];
    percentage?: number; // Percentage of users to include
  };
  successMetrics: {
    primary: string; // Main metric to optimize
    secondary?: string[]; // Additional metrics to track
  };
  minimumSampleSize?: number;
  confidenceLevel?: number; // Default 95%
  createdAt: string;
  updatedAt: string;
}

export interface TestResult {
  variantId: string;
  variantName: string;
  impressions: number;
  conversions: number;
  conversionRate: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  statisticalSignificance: number; // 0-1
  isWinner?: boolean;
  isSignificant?: boolean;
}

export interface TestAssignment {
  userId: string;
  experimentId: string;
  variantId: string;
  assignedAt: string;
  lastSeenAt: string;
}

export interface TestMetrics {
  experimentId: string;
  totalImpressions: number;
  totalConversions: number;
  overallConversionRate: number;
  results: TestResult[];
  isComplete: boolean;
  winner?: string;
  significanceLevel: number;
}

export interface TestConfig {
  experimentId: string;
  variantId: string;
  config: Record<string, any>;
}

export interface StatisticalSignificance {
  isSignificant: boolean;
  confidenceLevel: number;
  pValue: number;
  winner: string | null; // 'A', 'B', or null
  improvement: number; // Percentage improvement
}

export interface TestResults {
  experimentId: string;
  totalVisitors: number;
  totalConversions: number;
  variants: Record<string, {
    name: string;
    visitors: number;
    conversions: number;
    conversionRate: number;
    confidenceInterval: {
      lower: number;
      upper: number;
    };
    isWinner: boolean;
  }>;
  statisticalSignificance: StatisticalSignificance | null;
  recommendedAction: 'continue' | 'conclude' | 'extend';
  estimatedDuration: number | null; // Days until significance
}

