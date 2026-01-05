/**
 * Calendar Auto-Optimizer Engine
 * Analyzes calendar and suggests optimizations for maximum revenue and efficiency
 */

import { LocalAppointment } from '../types/appointment';

interface OptimizationSuggestion {
  id: string;
  type: 'move' | 'combine' | 'fill-gap' | 'swap' | 'split';
  priority: 'high' | 'medium' | 'low';
  revenueGain: number;
  description: string;
  actions: {
    appointmentId: string;
    currentTime: Date;
    suggestedTime: Date;
    reason: string;
  }[];
  confidence: number; // 0-100
  impact: {
    revenueIncrease: number;
    utilizationImprovement: number;
    clientSatisfaction: number; // -100 to 100
  };
}

interface OptimizationResult {
  suggestions: OptimizationSuggestion[];
  metrics: {
    currentRevenue: number;
    potentialRevenue: number;
    currentUtilization: number;
    potentialUtilization: number;
    totalGaps: number;
    optimizableGaps: number;
  };
}

interface OptimizerConfig {
  workingHours: { start: number; end: number };
  bufferTime: number; // minutes between appointments
  prioritizeRevenue: boolean;
  respectClientPreferences: boolean;
  minGapToFill: number; // minimum gap duration in minutes
}

const DEFAULT_CONFIG: OptimizerConfig = {
  workingHours: { start: 9, end: 18 },
  bufferTime: 15,
  prioritizeRevenue: true,
  respectClientPreferences: true,
  minGapToFill: 30,
};

/**
 * Analyze calendar and generate optimization suggestions
 */
export function analyzeCalendarForOptimization(
  appointments: LocalAppointment[],
  date: Date,
  config: Partial<OptimizerConfig> = {}
): OptimizationResult {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const suggestions: OptimizationSuggestion[] = [];

  // Filter appointments for the specified date
  const dayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.scheduledStartTime);
    return aptDate.toDateString() === date.toDateString();
  }).sort((a, b) =>
    new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime()
  );

  // Calculate current metrics
  const currentMetrics = calculateDayMetrics(dayAppointments, finalConfig);

  // Find gaps and opportunities
  const gaps = findGaps(dayAppointments, date, finalConfig);

  // 1. Fill gap opportunities
  suggestions.push(...generateFillGapSuggestions(gaps, dayAppointments, finalConfig));

  // 2. Move appointments to create premium slots
  suggestions.push(...generateMoveSuggestions(dayAppointments, gaps, finalConfig));

  // 3. Combine small appointments
  suggestions.push(...generateCombineSuggestions(dayAppointments, finalConfig));

  // 4. Swap appointments for better client preferences
  suggestions.push(...generateSwapSuggestions(finalConfig));

  // Sort by revenue gain
  suggestions.sort((a, b) => b.revenueGain - a.revenueGain);

  // Calculate potential metrics
  const potentialRevenue = currentMetrics.revenue + suggestions.reduce((sum, s) => sum + s.revenueGain, 0);
  const potentialUtilization = Math.min(100, currentMetrics.utilization +
    suggestions.reduce((sum, s) => sum + s.impact.utilizationImprovement, 0));

  return {
    suggestions,
    metrics: {
      currentRevenue: currentMetrics.revenue,
      potentialRevenue,
      currentUtilization: currentMetrics.utilization,
      potentialUtilization,
      totalGaps: gaps.length,
      optimizableGaps: gaps.filter(g => g.duration >= finalConfig.minGapToFill).length,
    },
  };
}

/**
 * Calculate metrics for a day
 */
function calculateDayMetrics(appointments: LocalAppointment[], config: OptimizerConfig) {
  const totalMinutes = (config.workingHours.end - config.workingHours.start) * 60;
  const bookedMinutes = appointments.reduce((sum, apt) => {
    const duration = (new Date(apt.scheduledEndTime).getTime() -
                     new Date(apt.scheduledStartTime).getTime()) / 60000;
    return sum + duration;
  }, 0);

  const revenue = appointments.reduce((sum, apt) =>
    sum + apt.services.reduce((s, svc) => s + svc.price, 0), 0);

  return {
    revenue,
    utilization: (bookedMinutes / totalMinutes) * 100,
    appointments: appointments.length,
  };
}

/**
 * Find gaps in the calendar
 */
interface Gap {
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  staffId?: string;
}

function findGaps(
  appointments: LocalAppointment[],
  date: Date,
  config: OptimizerConfig
): Gap[] {
  const gaps: Gap[] = [];
  const dayStart = new Date(date);
  dayStart.setHours(config.workingHours.start, 0, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(config.workingHours.end, 0, 0, 0);

  // Group by staff
  const byStaff = new Map<string, LocalAppointment[]>();
  appointments.forEach(apt => {
    if (!byStaff.has(apt.staffId)) {
      byStaff.set(apt.staffId, []);
    }
    byStaff.get(apt.staffId)!.push(apt);
  });

  // Find gaps for each staff member
  byStaff.forEach((staffAppts, staffId) => {
    let currentTime = new Date(dayStart);

    staffAppts.forEach(apt => {
      const aptStart = new Date(apt.scheduledStartTime);
      const gapDuration = (aptStart.getTime() - currentTime.getTime()) / 60000;

      if (gapDuration >= config.minGapToFill) {
        gaps.push({
          startTime: new Date(currentTime),
          endTime: new Date(aptStart),
          duration: gapDuration,
          staffId,
        });
      }

      currentTime = new Date(apt.scheduledEndTime);
      currentTime.setMinutes(currentTime.getMinutes() + config.bufferTime);
    });

    // Check gap until end of day
    const finalGapDuration = (dayEnd.getTime() - currentTime.getTime()) / 60000;
    if (finalGapDuration >= config.minGapToFill) {
      gaps.push({
        startTime: new Date(currentTime),
        endTime: new Date(dayEnd),
        duration: finalGapDuration,
        staffId,
      });
    }
  });

  return gaps;
}

/**
 * Generate fill gap suggestions
 */
function generateFillGapSuggestions(
  gaps: Gap[],
  appointments: LocalAppointment[],
  config: OptimizerConfig
): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];

  gaps.forEach((gap, index) => {
    if (gap.duration >= config.minGapToFill) {
      // Estimate potential revenue based on average service price
      const avgRevenue = appointments.length > 0
        ? appointments.reduce((sum, apt) =>
            sum + apt.services.reduce((s, svc) => s + svc.price, 0), 0) / appointments.length
        : 60;

      const estimatedRevenue = Math.round((gap.duration / 60) * avgRevenue);

      suggestions.push({
        id: `fill-gap-${index}`,
        type: 'fill-gap',
        priority: gap.duration >= 60 ? 'high' : 'medium',
        revenueGain: estimatedRevenue,
        description: `Fill ${gap.duration}-minute gap at ${formatTime(gap.startTime)}`,
        actions: [{
          appointmentId: 'new',
          currentTime: gap.startTime,
          suggestedTime: gap.startTime,
          reason: `Available ${gap.duration} min slot - perfect for quick services`,
        }],
        confidence: 80,
        impact: {
          revenueIncrease: estimatedRevenue,
          utilizationImprovement: (gap.duration / ((config.workingHours.end - config.workingHours.start) * 60)) * 100,
          clientSatisfaction: 20,
        },
      });
    }
  });

  return suggestions;
}

/**
 * Generate move suggestions to create better slots
 */
function generateMoveSuggestions(
  appointments: LocalAppointment[],
  gaps: Gap[],
  config: OptimizerConfig
): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];

  // Look for low-value appointments that could be moved to create premium slots
  appointments.forEach(apt => {
    const revenue = apt.services.reduce((sum, svc) => sum + svc.price, 0);
    const duration = (new Date(apt.scheduledEndTime).getTime() -
                     new Date(apt.scheduledStartTime).getTime()) / 60000;

    // Low-value short appointments
    if (revenue < 50 && duration < 45) {
      // Check if moving this would create a better slot
      const aptStart = new Date(apt.scheduledStartTime);
      const aptHour = aptStart.getHours();

      // If in prime time (11am-3pm), consider moving
      if (aptHour >= 11 && aptHour < 15) {
        // Find alternative gap
        const alternativeGap = gaps.find(g => g.duration >= duration &&
          (g.startTime.getHours() < 11 || g.startTime.getHours() >= 15));

        if (alternativeGap) {
          suggestions.push({
            id: `move-${apt.id}`,
            type: 'move',
            priority: 'medium',
            revenueGain: 40, // Estimated gain from freeing prime slot
            description: `Move ${apt.clientName}'s appointment to create premium slot`,
            actions: [{
              appointmentId: apt.id,
              currentTime: aptStart,
              suggestedTime: alternativeGap.startTime,
              reason: 'Free up prime time for higher-value services',
            }],
            confidence: 65,
            impact: {
              revenueIncrease: 40,
              utilizationImprovement: 0,
              clientSatisfaction: config.respectClientPreferences ? -10 : 0,
            },
          });
        }
      }
    }
  });

  return suggestions;
}

/**
 * Generate combine suggestions
 */
function generateCombineSuggestions(
  appointments: LocalAppointment[],
  config: OptimizerConfig
): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];

  // Look for consecutive appointments with same staff that could be combined
  for (let i = 0; i < appointments.length - 1; i++) {
    const current = appointments[i];
    const next = appointments[i + 1];

    if (current.staffId === next.staffId) {
      const currentEnd = new Date(current.scheduledEndTime);
      const nextStart = new Date(next.scheduledStartTime);
      const gap = (nextStart.getTime() - currentEnd.getTime()) / 60000;

      // Small gap that could be eliminated
      if (gap > 0 && gap <= config.bufferTime + 5) {
        const currentDuration = (currentEnd.getTime() - new Date(current.scheduledStartTime).getTime()) / 60000;
        const nextDuration = (new Date(next.scheduledEndTime).getTime() - nextStart.getTime()) / 60000;

        // Both are short services
        if (currentDuration <= 45 && nextDuration <= 45) {
          suggestions.push({
            id: `combine-${current.id}-${next.id}`,
            type: 'combine',
            priority: 'low',
            revenueGain: 25, // Save time, create new slot
            description: `Combine ${current.clientName} and ${next.clientName} appointments`,
            actions: [
              {
                appointmentId: current.id,
                currentTime: new Date(current.scheduledStartTime),
                suggestedTime: new Date(current.scheduledStartTime),
                reason: 'Keep current time',
              },
              {
                appointmentId: next.id,
                currentTime: nextStart,
                suggestedTime: currentEnd,
                reason: 'Move immediately after previous',
              },
            ],
            confidence: 70,
            impact: {
              revenueIncrease: 25,
              utilizationImprovement: 2,
              clientSatisfaction: -5,
            },
          });
        }
      }
    }
  }

  return suggestions;
}

/**
 * Generate swap suggestions for client preferences
 */
function generateSwapSuggestions(
//   appointments: LocalAppointment[],
  config: OptimizerConfig
): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];

  if (!config.respectClientPreferences) return suggestions;

  // This would require client preference data
  // Placeholder for future implementation

  return suggestions;
}

/**
 * Format time for display
 */
function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Apply optimization suggestion
 */
export async function applyOptimization(
  suggestion: OptimizationSuggestion,
  updateAppointment: (id: string, updates: Partial<LocalAppointment>) => Promise<void>
): Promise<void> {
  for (const action of suggestion.actions) {
    if (action.appointmentId !== 'new') {
      await updateAppointment(action.appointmentId, {
        scheduledStartTime: action.suggestedTime.toISOString(),
        scheduledEndTime: new Date(
          action.suggestedTime.getTime() +
          60 * 60 * 1000 // Placeholder - should calculate based on services
        ).toISOString(),
      });
    }
  }
}

/**
 * Batch apply multiple optimizations
 */
export async function applyOptimizations(
  suggestions: OptimizationSuggestion[],
  updateAppointment: (id: string, updates: Partial<LocalAppointment>) => Promise<void>,
  onProgress?: (current: number, total: number) => void
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (let i = 0; i < suggestions.length; i++) {
    try {
      await applyOptimization(suggestions[i], updateAppointment);
      success++;
    } catch (error) {
      console.error(`Failed to apply optimization ${suggestions[i].id}:`, error);
      failed++;
    }

    onProgress?.(i + 1, suggestions.length);
  }

  return { success, failed };
}
