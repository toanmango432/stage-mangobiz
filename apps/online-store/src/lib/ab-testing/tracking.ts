// A/B Test Tracking and Analytics
import { analyticsTracker } from '@/lib/analytics/tracker';
import type { TestMetrics, TestResult } from '@/types/ab-test';

const TRACKING_KEY = 'mango-ab-tracking';

export class ABTestTracker {
  private trackingData: Map<string, Map<string, { impressions: number; conversions: number }>> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(TRACKING_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.trackingData = new Map(
          Object.entries(parsed).map(([expId, variants]) => [
            expId,
            new Map(Object.entries(variants as Record<string, { impressions: number; conversions: number }>))
          ])
        );
      }
    } catch (error) {
      console.error('Failed to load A/B test tracking data:', error);
    }
  }

  private saveToStorage() {
    try {
      const serialized = Object.fromEntries(
        Array.from(this.trackingData.entries()).map(([expId, variants]) => [
          expId,
          Object.fromEntries(variants.entries())
        ])
      );
      localStorage.setItem(TRACKING_KEY, JSON.stringify(serialized));
    } catch (error) {
      console.error('Failed to save A/B test tracking data:', error);
    }
  }

  trackImpression(experimentId: string, variantId: string): void {
    if (!this.trackingData.has(experimentId)) {
      this.trackingData.set(experimentId, new Map());
    }

    const experimentData = this.trackingData.get(experimentId)!;
    const current = experimentData.get(variantId) || { impressions: 0, conversions: 0 };
    experimentData.set(variantId, {
      ...current,
      impressions: current.impressions + 1
    });

    this.saveToStorage();

    // Track in analytics
    analyticsTracker.track('ab_test_impression', {
      experimentId,
      variantId
    });
  }

  trackConversion(experimentId: string, variantId: string, value?: number): void {
    if (!this.trackingData.has(experimentId)) {
      this.trackingData.set(experimentId, new Map());
    }

    const experimentData = this.trackingData.get(experimentId)!;
    const current = experimentData.get(variantId) || { impressions: 0, conversions: 0 };
    experimentData.set(variantId, {
      ...current,
      conversions: current.conversions + 1
    });

    this.saveToStorage();

    // Track in analytics
    analyticsTracker.track('ab_test_conversion', {
      experimentId,
      variantId,
      value
    });
  }

  getMetrics(experimentId: string): TestMetrics | null {
    const experimentData = this.trackingData.get(experimentId);
    if (!experimentData) return null;

    const results: TestResult[] = [];
    let totalImpressions = 0;
    let totalConversions = 0;

    for (const [variantId, data] of experimentData.entries()) {
      const conversionRate = data.impressions > 0 ? (data.conversions / data.impressions) * 100 : 0;
      const confidenceInterval = this.calculateConfidenceInterval(
        data.conversions,
        data.impressions,
        0.95
      );
      const significance = this.calculateStatisticalSignificance(
        data.conversions,
        data.impressions,
        totalConversions,
        totalImpressions
      );

      results.push({
        variantId,
        variantName: `Variant ${variantId}`,
        impressions: data.impressions,
        conversions: data.conversions,
        conversionRate,
        confidenceInterval,
        statisticalSignificance: significance,
        isSignificant: significance >= 0.95
      });

      totalImpressions += data.impressions;
      totalConversions += data.conversions;
    }

    // Determine winner
    const sortedResults = results.sort((a, b) => b.conversionRate - a.conversionRate);
    if (sortedResults.length > 0) {
      sortedResults[0].isWinner = true;
    }

    return {
      experimentId,
      totalImpressions,
      totalConversions,
      overallConversionRate: totalImpressions > 0 ? (totalConversions / totalImpressions) * 100 : 0,
      results: sortedResults,
      isComplete: this.isTestComplete(sortedResults),
      winner: sortedResults[0]?.isSignificant ? sortedResults[0].variantId : undefined,
      significanceLevel: 0.95
    };
  }

  private calculateConfidenceInterval(
    conversions: number,
    impressions: number,
    confidenceLevel: number
  ): { lower: number; upper: number } {
    if (impressions === 0) return { lower: 0, upper: 0 };

    const p = conversions / impressions;
    const z = this.getZScore(confidenceLevel);
    const marginOfError = z * Math.sqrt((p * (1 - p)) / impressions);

    return {
      lower: Math.max(0, (p - marginOfError) * 100),
      upper: Math.min(100, (p + marginOfError) * 100)
    };
  }

  private calculateStatisticalSignificance(
    variantConversions: number,
    variantImpressions: number,
    controlConversions: number,
    controlImpressions: number
  ): number {
    if (variantImpressions === 0 || controlImpressions === 0) return 0;

    const p1 = variantConversions / variantImpressions;
    const p2 = controlConversions / controlImpressions;
    const pooledP = (variantConversions + controlConversions) / (variantImpressions + controlImpressions);

    if (pooledP === 0 || pooledP === 1) return 0;

    const se = Math.sqrt(pooledP * (1 - pooledP) * (1/variantImpressions + 1/controlImpressions));
    const z = Math.abs(p1 - p2) / se;

    // Convert Z-score to p-value (simplified)
    return Math.max(0, Math.min(1, 1 - (2 * (1 - this.normalCDF(z)))));
  }

  private isTestComplete(results: TestResult[]): boolean {
    if (results.length < 2) return false;

    // Check if we have enough data for statistical significance
    const totalImpressions = results.reduce((sum, r) => sum + r.impressions, 0);
    const hasSignificantWinner = results.some(r => r.isSignificant && r.isWinner);

    return totalImpressions >= 1000 || hasSignificantWinner;
  }

  private getZScore(confidenceLevel: number): number {
    // Common Z-scores for confidence levels
    const zScores: Record<number, number> = {
      0.90: 1.645,
      0.95: 1.96,
      0.99: 2.576
    };
    return zScores[confidenceLevel] || 1.96;
  }

  private normalCDF(z: number): number {
    // Approximation of normal CDF
    return 0.5 * (1 + this.erf(z / Math.sqrt(2)));
  }

  private erf(x: number): number {
    // Approximation of error function
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  clearData(): void {
    this.trackingData.clear();
    localStorage.removeItem(TRACKING_KEY);
  }
}

// Export singleton instance
export const abTestTracker = new ABTestTracker();




