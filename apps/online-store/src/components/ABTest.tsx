import { useEffect, useState } from 'react';
import { experimentManager } from '@/lib/ab-testing/experiment';
import { abTestTracker } from '@/lib/ab-testing/tracking';
import type { TestConfig } from '@/types/ab-test';

interface ABTestProps {
  experimentId: string;
  children: (config: TestConfig | null) => React.ReactNode;
  fallback?: React.ReactNode;
}

export const ABTest = ({ experimentId, children, fallback }: ABTestProps) => {
  const [config, setConfig] = useState<TestConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeTest = () => {
      try {
        // Get user ID (in real app, this would come from auth context)
        const userId = localStorage.getItem('mango-user-id') || 'anonymous';

        // Assign user to variant if not already assigned
        let variantId = experimentManager.getUserVariant(userId, experimentId);
        if (!variantId) {
          variantId = experimentManager.assignUserToVariant(userId, experimentId);
        }

        if (variantId) {
          // Get experiment configuration
          const experimentConfig = experimentManager.getExperimentConfig(experimentId, variantId);
          if (experimentConfig) {
            setConfig({
              experimentId,
              variantId,
              config: experimentConfig
            });

            // Track impression
            abTestTracker.trackImpression(experimentId, variantId);
          }
        }
      } catch (error) {
        console.error('Failed to initialize A/B test:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeTest();
  }, [experimentId]);

  if (isLoading) {
    return fallback || null;
  }

  if (!config) {
    return fallback || null;
  }

  return <>{children(config)}</>;
};

// Hook for tracking conversions
export const useABTestConversion = (experimentId: string, variantId: string) => {
  const trackConversion = (value?: number) => {
    abTestTracker.trackConversion(experimentId, variantId, value);
  };

  return { trackConversion };
};

// Hook for getting test metrics
export const useABTestMetrics = (experimentId: string) => {
  const [metrics, setMetrics] = useState(abTestTracker.getMetrics(experimentId));

  const refreshMetrics = () => {
    setMetrics(abTestTracker.getMetrics(experimentId));
  };

  return { metrics, refreshMetrics };
};




