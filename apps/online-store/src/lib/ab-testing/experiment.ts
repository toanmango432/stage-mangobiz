// A/B Test Experiment Management
import type { ABTestExperiment, TestStatus, ABTestVariant, TestResults, StatisticalSignificance } from '@/types/ab-test';

const STORAGE_KEY = 'mango-ab-experiments';
const ASSIGNMENTS_KEY = 'mango-ab-assignments';

export class ExperimentManager {
  private experiments: ABTestExperiment[] = [];
  private assignments: Map<string, string> = new Map(); // userId -> variantId

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.experiments = JSON.parse(stored);
      }

      const assignments = localStorage.getItem(ASSIGNMENTS_KEY);
      if (assignments) {
        const parsed = JSON.parse(assignments);
        this.assignments = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.error('Failed to load A/B test data:', error);
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.experiments));
      localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(Object.fromEntries(this.assignments)));
    } catch (error) {
      console.error('Failed to save A/B test data:', error);
    }
  }

  createExperiment(experiment: Omit<ABTestExperiment, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newExperiment: ABTestExperiment = {
      ...experiment,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.experiments.push(newExperiment);
    this.saveToStorage();
    return id;
  }

  updateExperiment(id: string, updates: Partial<ABTestExperiment>): boolean {
    const index = this.experiments.findIndex(exp => exp.id === id);
    if (index === -1) return false;

    this.experiments[index] = {
      ...this.experiments[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.saveToStorage();
    return true;
  }

  deleteExperiment(id: string): boolean {
    const index = this.experiments.findIndex(exp => exp.id === id);
    if (index === -1) return false;

    this.experiments.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  getExperiment(id: string): ABTestExperiment | null {
    return this.experiments.find(exp => exp.id === id) || null;
  }

  getAllExperiments(): ABTestExperiment[] {
    return [...this.experiments];
  }

  getRunningExperiments(): ABTestExperiment[] {
    return this.experiments.filter(exp => exp.status === 'running');
  }

  startExperiment(id: string): boolean {
    const experiment = this.getExperiment(id);
    if (!experiment || experiment.status !== 'draft') return false;

    return this.updateExperiment(id, {
      status: 'running',
      startDate: new Date().toISOString()
    });
  }

  pauseExperiment(id: string): boolean {
    const experiment = this.getExperiment(id);
    if (!experiment || experiment.status !== 'running') return false;

    return this.updateExperiment(id, { status: 'paused' });
  }

  completeExperiment(id: string): boolean {
    const experiment = this.getExperiment(id);
    if (!experiment || !['running', 'paused'].includes(experiment.status)) return false;

    return this.updateExperiment(id, {
      status: 'completed',
      endDate: new Date().toISOString()
    });
  }

  assignUserToVariant(userId: string, experimentId: string): string | null {
    // Check if user is already assigned
    const existingAssignment = this.assignments.get(userId);
    if (existingAssignment) {
      return existingAssignment;
    }

    const experiment = this.getExperiment(experimentId);
    if (!experiment || experiment.status !== 'running') return null;

    // Weighted random selection
    const variant = this.selectVariant(experiment.variants);
    if (!variant) return null;

    this.assignments.set(userId, variant.id);
    this.saveToStorage();
    return variant.id;
  }

  getUserVariant(userId: string, experimentId: string): string | null {
    const assignment = this.assignments.get(userId);
    if (!assignment) return null;

    const experiment = this.getExperiment(experimentId);
    if (!experiment || experiment.status !== 'running') return null;

    // Verify the assigned variant still exists
    const variant = experiment.variants.find(v => v.id === assignment);
    return variant ? assignment : null;
  }

  private selectVariant(variants: ABTestVariant[]): ABTestVariant | null {
    if (variants.length === 0) return null;

    const totalWeight = variants.reduce((sum, variant) => sum + variant.weight, 0);
    if (totalWeight === 0) return variants[0];

    const random = Math.random() * totalWeight;
    let currentWeight = 0;

    for (const variant of variants) {
      currentWeight += variant.weight;
      if (random <= currentWeight) {
        return variant;
      }
    }

    return variants[variants.length - 1]; // Fallback
  }

  getExperimentConfig(experimentId: string, variantId: string): Record<string, any> | null {
    const experiment = this.getExperiment(experimentId);
    if (!experiment) return null;

    const variant = experiment.variants.find(v => v.id === variantId);
    return variant ? variant.config : null;
  }

  // Statistical Analysis Methods
  calculateConversionRate(conversions: number, visitors: number): number {
    if (visitors === 0) return 0;
    return conversions / visitors;
  }

  calculateConfidenceInterval(conversions: number, visitors: number, confidenceLevel: number = 0.95): { lower: number; upper: number } {
    if (visitors === 0) return { lower: 0, upper: 0 };

    const p = this.calculateConversionRate(conversions, visitors);
    const z = this.getZScore(confidenceLevel);
    const marginOfError = z * Math.sqrt((p * (1 - p)) / visitors);

    return {
      lower: Math.max(0, p - marginOfError),
      upper: Math.min(1, p + marginOfError)
    };
  }

  calculateStatisticalSignificance(
    variantA: { conversions: number; visitors: number },
    variantB: { conversions: number; visitors: number }
  ): StatisticalSignificance {
    const p1 = this.calculateConversionRate(variantA.conversions, variantA.visitors);
    const p2 = this.calculateConversionRate(variantB.conversions, variantB.visitors);
    
    if (variantA.visitors === 0 || variantB.visitors === 0) {
      return {
        isSignificant: false,
        confidenceLevel: 0,
        pValue: 1,
        winner: null,
        improvement: 0
      };
    }

    // Pooled proportion
    const pooledP = (variantA.conversions + variantB.conversions) / (variantA.visitors + variantB.visitors);
    
    // Standard error
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1/variantA.visitors + 1/variantB.visitors));
    
    if (se === 0) {
      return {
        isSignificant: false,
        confidenceLevel: 0,
        pValue: 1,
        winner: null,
        improvement: 0
      };
    }

    // Z-score
    const z = Math.abs(p1 - p2) / se;
    
    // P-value (two-tailed test)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(z)));
    
    // Confidence level
    const confidenceLevel = 1 - pValue;
    
    // Determine winner
    let winner: string | null = null;
    let improvement = 0;
    
    if (pValue < 0.05) { // 95% confidence
      if (p1 > p2) {
        winner = 'A';
        improvement = ((p1 - p2) / p2) * 100;
      } else if (p2 > p1) {
        winner = 'B';
        improvement = ((p2 - p1) / p1) * 100;
      }
    }

    return {
      isSignificant: pValue < 0.05,
      confidenceLevel: Math.max(0, Math.min(1, confidenceLevel)),
      pValue,
      winner,
      improvement: Math.abs(improvement)
    };
  }

  calculateTestResults(experiment: ABTestExperiment): TestResults {
    const results: TestResults = {
      experimentId: experiment.id,
      totalVisitors: 0,
      totalConversions: 0,
      variants: {},
      statisticalSignificance: null,
      recommendedAction: 'continue',
      estimatedDuration: null
    };

    // Calculate metrics for each variant
    for (const variant of experiment.variants) {
      const visitors = variant.visitors || 0;
      const conversions = variant.conversions || 0;
      const conversionRate = this.calculateConversionRate(conversions, visitors);
      const confidenceInterval = this.calculateConfidenceInterval(conversions, visitors);

      results.variants[variant.id] = {
        name: variant.name,
        visitors,
        conversions,
        conversionRate,
        confidenceInterval,
        isWinner: false
      };

      results.totalVisitors += visitors;
      results.totalConversions += conversions;
    }

    // Calculate statistical significance if we have at least 2 variants
    if (experiment.variants.length >= 2) {
      const variantA = experiment.variants[0];
      const variantB = experiment.variants[1];
      
      results.statisticalSignificance = this.calculateStatisticalSignificance(
        { conversions: variantA.conversions || 0, visitors: variantA.visitors || 0 },
        { conversions: variantB.conversions || 0, visitors: variantB.visitors || 0 }
      );

      // Mark winner
      if (results.statisticalSignificance.winner) {
        const winnerId = results.statisticalSignificance.winner === 'A' ? variantA.id : variantB.id;
        if (results.variants[winnerId]) {
          results.variants[winnerId].isWinner = true;
        }
      }
    }

    // Determine recommended action
    if (results.statisticalSignificance?.isSignificant) {
      results.recommendedAction = 'conclude';
    } else if (results.totalVisitors < 1000) {
      results.recommendedAction = 'continue';
    } else {
      results.recommendedAction = 'extend';
    }

    // Estimate duration for significance
    if (!results.statisticalSignificance?.isSignificant && results.totalVisitors > 0) {
      const currentRate = results.totalConversions / results.totalVisitors;
      const requiredVisitors = this.estimateRequiredVisitors(currentRate, 0.05);
      const daysElapsed = experiment.startDate ? 
        (Date.now() - new Date(experiment.startDate).getTime()) / (1000 * 60 * 60 * 24) : 0;
      const visitorsPerDay = results.totalVisitors / Math.max(1, daysElapsed);
      
      if (visitorsPerDay > 0) {
        results.estimatedDuration = Math.ceil((requiredVisitors - results.totalVisitors) / visitorsPerDay);
      }
    }

    return results;
  }

  private getZScore(confidenceLevel: number): number {
    // Common z-scores for confidence levels
    const zScores: Record<number, number> = {
      0.90: 1.645,
      0.95: 1.96,
      0.99: 2.576
    };
    return zScores[confidenceLevel] || 1.96;
  }

  private normalCDF(x: number): number {
    // Approximation of the normal CDF using the error function
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private erf(x: number): number {
    // Approximation of the error function
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

  private estimateRequiredVisitors(currentRate: number, minimumDetectableEffect: number): number {
    // Simplified sample size calculation for A/B tests
    const alpha = 0.05; // 5% significance level
    const beta = 0.20; // 80% power
    const zAlpha = 1.96; // 95% confidence
    const zBeta = 0.84; // 80% power

    const p1 = currentRate;
    const p2 = currentRate * (1 + minimumDetectableEffect);
    const pooledP = (p1 + p2) / 2;

    const numerator = Math.pow(zAlpha * Math.sqrt(2 * pooledP * (1 - pooledP)) + zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)), 2);
    const denominator = Math.pow(p2 - p1, 2);

    return Math.ceil(numerator / denominator);
  }

  // Track conversion events
  trackConversion(experimentId: string, variantId: string, userId: string): void {
    const experiment = this.getExperiment(experimentId);
    if (!experiment || experiment.status !== 'running') return;

    const variant = experiment.variants.find(v => v.id === variantId);
    if (!variant) return;

    // Increment conversion count
    variant.conversions = (variant.conversions || 0) + 1;
    
    // Update experiment
    this.updateExperiment(experimentId, {
      variants: experiment.variants
    });
  }

  // Track visitor events
  trackVisitor(experimentId: string, variantId: string, userId: string): void {
    const experiment = this.getExperiment(experimentId);
    if (!experiment || experiment.status !== 'running') return;

    const variant = experiment.variants.find(v => v.id === variantId);
    if (!variant) return;

    // Increment visitor count (only if not already counted)
    const visitorKey = `${experimentId}-${variantId}-${userId}`;
    const existingVisitors = JSON.parse(localStorage.getItem('ab-visitors') || '[]');
    
    if (!existingVisitors.includes(visitorKey)) {
      variant.visitors = (variant.visitors || 0) + 1;
      existingVisitors.push(visitorKey);
      localStorage.setItem('ab-visitors', JSON.stringify(existingVisitors));
      
      // Update experiment
      this.updateExperiment(experimentId, {
        variants: experiment.variants
      });
    }
  }
}

// Export singleton instance
export const experimentManager = new ExperimentManager();
