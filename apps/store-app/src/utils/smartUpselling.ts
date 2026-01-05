/**
 * Smart Upselling Engine
 * AI-powered service recommendations and add-on suggestions
 */

import { LocalAppointment } from '../types/appointment';

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  category: string;
}

export interface UpsellSuggestion {
  service: Service;
  reason: string;
  confidence: number; // 0-100
  estimatedRevenue: number;
  type: 'add-on' | 'upgrade' | 'bundle' | 'seasonal';
  priority: 'high' | 'medium' | 'low';
}

export interface UpsellResult {
  suggestions: UpsellSuggestion[];
  totalPotentialRevenue: number;
  clientHistory?: {
    previouslyAccepted: string[];
    acceptanceRate: number;
  };
}

// Service compatibility matrix
const COMPATIBLE_SERVICES: Record<string, string[]> = {
  'Hair Cut': ['Deep Conditioning', 'Blow Dry', 'Hair Styling', 'Scalp Treatment'],
  'Hair Color': ['Highlights', 'Glossing', 'Toner', 'Deep Conditioning'],
  'Manicure': ['Nail Art', 'Gel Polish', 'Hand Massage', 'Paraffin Treatment'],
  'Pedicure': ['Foot Scrub', 'Gel Polish', 'Foot Massage', 'Callus Treatment'],
  'Facial': ['Eye Treatment', 'Neck Treatment', 'Facial Massage', 'Hydration Mask'],
  'Massage': ['Aromatherapy', 'Hot Stone', 'Deep Tissue Upgrade', 'Scalp Massage'],
};

// Premium upgrades
const PREMIUM_UPGRADES: Record<string, { service: string; additionalCost: number }> = {
  'Hair Cut': { service: 'Premium Cut with Senior Stylist', additionalCost: 20 },
  'Manicure': { service: 'Luxury Manicure with Spa Treatment', additionalCost: 25 },
  'Facial': { service: 'Premium Facial with LED Therapy', additionalCost: 40 },
  'Massage': { service: 'Deep Tissue Massage (90 min)', additionalCost: 35 },
};

/**
 * Generate upsell suggestions for an appointment
 */
export function generateUpsellSuggestions(
  appointment: LocalAppointment,
  availableServices: Service[],
  clientHistory?: LocalAppointment[]
): UpsellResult {
  const suggestions: UpsellSuggestion[] = [];

  // Get current services
  const currentServices = appointment.services.map(s => s.serviceName);

  // 1. Add-on suggestions based on service compatibility
  currentServices.forEach(serviceName => {
    const compatible = COMPATIBLE_SERVICES[serviceName] || [];

    compatible.forEach(addonName => {
      const service = availableServices.find(s => s.name === addonName);
      if (service && !currentServices.includes(addonName)) {
        const confidence = calculateConfidence(service, clientHistory);

        suggestions.push({
          service,
          reason: `Pairs perfectly with ${serviceName}`,
          confidence,
          estimatedRevenue: service.price,
          type: 'add-on',
          priority: confidence > 70 ? 'high' : 'medium',
        });
      }
    });
  });

  // 2. Premium upgrade suggestions
  currentServices.forEach(serviceName => {
    const upgrade = PREMIUM_UPGRADES[serviceName];
    if (upgrade) {
      const service = availableServices.find(s => s.name === upgrade.service);
      if (service) {
        suggestions.push({
          service,
          reason: `Upgrade to premium experience`,
          confidence: 60,
          estimatedRevenue: upgrade.additionalCost,
          type: 'upgrade',
          priority: 'medium',
        });
      }
    }
  });

  // 3. Bundle suggestions
  if (currentServices.includes('Hair Cut') && !currentServices.includes('Hair Color')) {
    const colorService = availableServices.find(s => s.name === 'Hair Color');
    if (colorService) {
      suggestions.push({
        service: colorService,
        reason: 'Save 15% when combining Cut + Color today',
        confidence: 55,
        estimatedRevenue: colorService.price * 0.85,
        type: 'bundle',
        priority: 'high',
      });
    }
  }

  // 4. Seasonal/promotional suggestions
  const seasonalSuggestion = getSeasonalSuggestion(availableServices, currentServices);
  if (seasonalSuggestion) {
    suggestions.push(seasonalSuggestion);
  }

  // 5. Client history-based suggestions
  if (clientHistory) {
    const historicalSuggestions = getHistoricalSuggestions(
      clientHistory,
      currentServices,
      availableServices
    );
    suggestions.push(...historicalSuggestions);
  }

  // Sort by priority and confidence
  suggestions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.confidence - a.confidence;
  });

  // Calculate metrics
  const totalPotentialRevenue = suggestions.reduce((sum, s) => sum + s.estimatedRevenue, 0);

  const clientMetrics = clientHistory ? analyzeClientAcceptance(clientHistory) : undefined;

  return {
    suggestions: suggestions.slice(0, 5), // Top 5 suggestions
    totalPotentialRevenue,
    clientHistory: clientMetrics,
  };
}

/**
 * Calculate confidence based on client history
 */
function calculateConfidence(service: Service, clientHistory?: LocalAppointment[]): number {
  if (!clientHistory || clientHistory.length === 0) return 60; // Default

  // Check if client has taken this service before
  const hasTakenBefore = clientHistory.some(apt =>
    apt.services.some(s => s.serviceName === service.name)
  );

  if (hasTakenBefore) return 85; // High confidence

  // Check if client has taken similar services
  const hasSimilarCategory = clientHistory.some(apt =>
    apt.services.some(s => s.serviceId === service.id) // Simplified check
  );

  if (hasSimilarCategory) return 70;

  return 55; // Lower confidence for new service types
}

/**
 * Get seasonal promotional suggestion
 */
function getSeasonalSuggestion(
  availableServices: Service[],
  currentServices: string[]
): UpsellSuggestion | null {
  const month = new Date().getMonth();

  // Summer (June-August): Highlight sun protection treatments
  if (month >= 5 && month <= 7) {
    const sunProtection = availableServices.find(s => s.name.includes('Sun Protection'));
    if (sunProtection && !currentServices.includes(sunProtection.name)) {
      return {
        service: sunProtection,
        reason: '☀️ Summer Special: Protect your hair from sun damage',
        confidence: 70,
        estimatedRevenue: sunProtection.price * 0.9, // 10% off
        type: 'seasonal',
        priority: 'high',
      };
    }
  }

  // Winter (December-February): Deep conditioning
  if (month === 11 || month <= 1) {
    const deepConditioning = availableServices.find(s => s.name === 'Deep Conditioning');
    if (deepConditioning && !currentServices.includes(deepConditioning.name)) {
      return {
        service: deepConditioning,
        reason: '❄️ Winter Care: Combat dry winter hair',
        confidence: 75,
        estimatedRevenue: deepConditioning.price * 0.85, // 15% off
        type: 'seasonal',
        priority: 'high',
      };
    }
  }

  return null;
}

/**
 * Get suggestions based on client's historical patterns
 */
function getHistoricalSuggestions(
  clientHistory: LocalAppointment[],
  currentServices: string[],
  availableServices: Service[]
): UpsellSuggestion[] {
  const suggestions: UpsellSuggestion[] = [];

  // Find services they've taken before but not in current booking
  const previousServices = new Set<string>();
  clientHistory.forEach(apt => {
    apt.services.forEach(s => previousServices.add(s.serviceName));
  });

  previousServices.forEach(serviceName => {
    if (!currentServices.includes(serviceName)) {
      const service = availableServices.find(s => s.name === serviceName);
      if (service) {
        suggestions.push({
          service,
          reason: `You enjoyed this last time!`,
          confidence: 90,
          estimatedRevenue: service.price,
          type: 'add-on',
          priority: 'high',
        });
      }
    }
  });

  return suggestions;
}

/**
 * Analyze client's upsell acceptance rate
 */
function analyzeClientAcceptance(clientHistory: LocalAppointment[]): {
  previouslyAccepted: string[];
  acceptanceRate: number;
} {
  // This would require tracking which services were upsold vs. originally booked
  // For now, simplified implementation

  const allServices = clientHistory.flatMap(apt => apt.services.map(s => s.serviceName));
  const uniqueServices = Array.from(new Set(allServices));

  return {
    previouslyAccepted: uniqueServices,
    acceptanceRate: 0.35, // Placeholder - would calculate based on actual data
  };
}

/**
 * Calculate bundle discount
 */
export function calculateBundleDiscount(
  services: Service[],
  bundleRules: Record<string, { services: string[]; discount: number }>
): number {
  let totalDiscount = 0;

  Object.entries(bundleRules).forEach(([, rule]) => {
    const hasAllServices = rule.services.every(reqService =>
      services.some(s => s.name === reqService)
    );

    if (hasAllServices) {
      const bundleTotal = services
        .filter(s => rule.services.includes(s.name))
        .reduce((sum, s) => sum + s.price, 0);
      totalDiscount = Math.max(totalDiscount, bundleTotal * rule.discount);
    }
  });

  return totalDiscount;
}

/**
 * Track upsell performance
 */
export interface UpsellMetrics {
  totalSuggestions: number;
  acceptedSuggestions: number;
  acceptanceRate: number;
  totalRevenue: number;
  averageUpsellValue: number;
  topPerformingServices: { service: string; acceptanceRate: number; revenue: number }[];
}

export function calculateUpsellMetrics(
  suggestions: UpsellSuggestion[],
  accepted: UpsellSuggestion[]
): UpsellMetrics {
  const acceptanceRate = suggestions.length > 0
    ? (accepted.length / suggestions.length) * 100
    : 0;

  const totalRevenue = accepted.reduce((sum, s) => sum + s.estimatedRevenue, 0);
  const averageUpsellValue = accepted.length > 0 ? totalRevenue / accepted.length : 0;

  // Group by service to find top performers
  const serviceStats = new Map<string, { accepted: number; total: number; revenue: number }>();

  suggestions.forEach(s => {
    const stats = serviceStats.get(s.service.name) || { accepted: 0, total: 0, revenue: 0 };
    stats.total++;
    serviceStats.set(s.service.name, stats);
  });

  accepted.forEach(s => {
    const stats = serviceStats.get(s.service.name)!;
    stats.accepted++;
    stats.revenue += s.estimatedRevenue;
  });

  const topPerformingServices = Array.from(serviceStats.entries())
    .map(([service, stats]) => ({
      service,
      acceptanceRate: (stats.accepted / stats.total) * 100,
      revenue: stats.revenue,
    }))
    .sort((a, b) => b.acceptanceRate - a.acceptanceRate)
    .slice(0, 5);

  return {
    totalSuggestions: suggestions.length,
    acceptedSuggestions: accepted.length,
    acceptanceRate,
    totalRevenue,
    averageUpsellValue,
    topPerformingServices,
  };
}
