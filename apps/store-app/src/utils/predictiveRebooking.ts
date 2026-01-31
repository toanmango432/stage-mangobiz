/**
 * Predictive Rebooking System
 * Analyzes client patterns and predicts when they're due for next visit
 */

import { LocalAppointment } from '../types/appointment';

export interface ClientRebookPrediction {
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  lastVisit: Date;
  averageCycle: number; // days
  predictedNextDate: Date;
  confidence: number; // 0-100
  daysOverdue: number;
  churnRisk: 'low' | 'medium' | 'high';
  recommendedAction: 'watch' | 'reach-out' | 'urgent';
  suggestedMessage: string;
  preferredServices?: string[];
  preferredStaff?: string;
  lifetimeValue: number;
}

/**
 * Analyze client visit history and predict next visit
 */
export function predictNextVisit(
  clientId: string,
  appointments: LocalAppointment[]
): ClientRebookPrediction | null {
  // Filter completed appointments for this client
  const clientAppointments = appointments
    .filter(apt => apt.clientId === clientId && apt.status === 'completed')
    .sort((a, b) => new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime());

  if (clientAppointments.length < 2) {
    return null; // Need at least 2 visits to predict
  }

  const lastAppointment = clientAppointments[clientAppointments.length - 1];
  const lastVisit = new Date(lastAppointment.scheduledStartTime);

  // Calculate average cycle
  const cycles: number[] = [];
  for (let i = 1; i < clientAppointments.length; i++) {
    const prev = new Date(clientAppointments[i - 1].scheduledStartTime);
    const curr = new Date(clientAppointments[i].scheduledStartTime);
    const daysBetween = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    cycles.push(daysBetween);
  }

  const averageCycle = Math.round(cycles.reduce((sum, c) => sum + c, 0) / cycles.length);

  // Calculate standard deviation for confidence
  const variance = cycles.reduce((sum, c) => sum + Math.pow(c - averageCycle, 2), 0) / cycles.length;
  const stdDev = Math.sqrt(variance);
  const confidence = Math.max(0, Math.min(100, 100 - (stdDev / averageCycle) * 100));

  // Predict next visit date
  const predictedNextDate = new Date(lastVisit);
  predictedNextDate.setDate(predictedNextDate.getDate() + averageCycle);

  // Calculate days overdue
  const now = new Date();
  const daysSinceLastVisit = Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));
  const daysOverdue = daysSinceLastVisit - averageCycle;

  // Determine churn risk
  let churnRisk: 'low' | 'medium' | 'high' = 'low';
  if (daysOverdue > averageCycle * 0.5) {
    churnRisk = 'high';
  } else if (daysOverdue > averageCycle * 0.2) {
    churnRisk = 'medium';
  }

  // Recommended action
  let recommendedAction: 'watch' | 'reach-out' | 'urgent' = 'watch';
  if (daysOverdue > 0) {
    recommendedAction = churnRisk === 'high' ? 'urgent' : 'reach-out';
  }

  // Analyze preferences
  const preferredServices = findPreferredServices(clientAppointments);
  const preferredStaff = findPreferredStaff(clientAppointments);

  // Calculate lifetime value
  const lifetimeValue = clientAppointments.reduce((sum, apt) =>
    sum + apt.services.reduce((s, svc) => s + svc.price, 0), 0);

  // Generate suggested message
  const suggestedMessage = generateRebookMessage(
    lastAppointment.clientName,
    daysOverdue,
    preferredServices,
    churnRisk
  );

  return {
    clientId,
    clientName: lastAppointment.clientName,
    clientPhone: lastAppointment.clientPhone,
    clientEmail: lastAppointment.clientEmail,
    lastVisit,
    averageCycle,
    predictedNextDate,
    confidence,
    daysOverdue,
    churnRisk,
    recommendedAction,
    suggestedMessage,
    preferredServices,
    preferredStaff,
    lifetimeValue,
  };
}

/**
 * Find client's preferred services
 */
function findPreferredServices(appointments: LocalAppointment[]): string[] {
  const serviceCounts = new Map<string, number>();

  appointments.forEach(apt => {
    apt.services.forEach(svc => {
      serviceCounts.set(svc.serviceName, (serviceCounts.get(svc.serviceName) || 0) + 1);
    });
  });

  return Array.from(serviceCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);
}

/**
 * Find client's preferred staff
 */
function findPreferredStaff(appointments: LocalAppointment[]): string {
  const staffCounts = new Map<string, number>();

  appointments.forEach(apt => {
    if (apt.staffName) {
      staffCounts.set(apt.staffName, (staffCounts.get(apt.staffName) || 0) + 1);
    }
  });

  const sorted = Array.from(staffCounts.entries()).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0][0] : '';
}

/**
 * Generate personalized rebook message
 */
function generateRebookMessage(
  clientName: string,
  daysOverdue: number,
  preferredServices?: string[],
  churnRisk?: 'low' | 'medium' | 'high'
): string {
  const firstName = clientName.split(' ')[0];

  if (daysOverdue <= 0) {
    // Due soon
    return `Hi ${firstName}! It's been a while. Ready for your next ${preferredServices?.[0] || 'appointment'}? Let's get you scheduled! Reply or call to book. - Mango Salon`;
  } else if (churnRisk === 'high') {
    // Overdue - high risk
    return `Hi ${firstName}! We miss you! It's been ${Math.abs(daysOverdue)} days since your last visit. Book this week and get 10% off your next ${preferredServices?.[0] || 'service'}! - Mango Salon`;
  } else {
    // Overdue - medium risk
    return `Hi ${firstName}! Time flies! You're due for your ${preferredServices?.[0] || 'appointment'}. When would you like to come in? - Mango Salon`;
  }
}

/**
 * Get all clients due for rebooking
 */
export function getClientsDueForRebooking(
  appointments: LocalAppointment[],
  daysAhead = 7
): ClientRebookPrediction[] {
  // Get unique clients
  const clientIds = new Set(appointments.map(apt => apt.clientId).filter(Boolean));
  const predictions: ClientRebookPrediction[] = [];

  clientIds.forEach(clientId => {
    if (clientId) {
      const prediction = predictNextVisit(clientId, appointments);
      if (prediction) {
        // Include if due within daysAhead or already overdue
        const daysUntilDue = Math.floor(
          (prediction.predictedNextDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilDue <= daysAhead || prediction.daysOverdue > 0) {
          predictions.push(prediction);
        }
      }
    }
  });

  // Sort by priority (overdue first, then by predicted date)
  return predictions.sort((a, b) => {
    if (a.daysOverdue > 0 && b.daysOverdue <= 0) return -1;
    if (a.daysOverdue <= 0 && b.daysOverdue > 0) return 1;
    return b.daysOverdue - a.daysOverdue;
  });
}

/**
 * Get high-value clients at risk
 */
export function getAtRiskHighValueClients(
  appointments: LocalAppointment[],
  minLifetimeValue = 500
): ClientRebookPrediction[] {
  const allPredictions = getClientsDueForRebooking(appointments, 30);

  return allPredictions.filter(pred =>
    pred.lifetimeValue >= minLifetimeValue &&
    (pred.churnRisk === 'high' || pred.churnRisk === 'medium')
  ).sort((a, b) => b.lifetimeValue - a.lifetimeValue);
}

/**
 * Auto-schedule rebook reminders
 */
export async function scheduleRebookReminders(
  predictions: ClientRebookPrediction[],
  sendMessage: (phone: string, message: string) => Promise<void>
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const prediction of predictions) {
    if (prediction.recommendedAction !== 'watch') {
      try {
        await sendMessage(prediction.clientPhone, prediction.suggestedMessage);
        sent++;
      } catch (error) {
        console.error(`Failed to send rebook reminder to ${prediction.clientName}:`, error);
        failed++;
      }
    }
  }

  return { sent, failed };
}

/**
 * Calculate churn prevention metrics
 */
export function calculateChurnMetrics(appointments: LocalAppointment[]): {
  totalClients: number;
  activeClients: number;
  atRisk: number;
  highRisk: number;
  retentionRate: number;
  averageLifetimeValue: number;
} {
  const clientIds = new Set(appointments.map(apt => apt.clientId).filter(Boolean));
  const predictions = Array.from(clientIds).map(clientId =>
    predictNextVisit(clientId as string, appointments)
  ).filter((p): p is ClientRebookPrediction => p !== null);

  const activeClients = predictions.filter(p => p.daysOverdue <= p.averageCycle * 0.2).length;
  const atRisk = predictions.filter(p => p.churnRisk === 'medium' || p.churnRisk === 'high').length;
  const highRisk = predictions.filter(p => p.churnRisk === 'high').length;

  const retentionRate = predictions.length > 0 ? (activeClients / predictions.length) * 100 : 0;
  const averageLifetimeValue = predictions.length > 0
    ? predictions.reduce((sum, p) => sum + p.lifetimeValue, 0) / predictions.length
    : 0;

  return {
    totalClients: clientIds.size,
    activeClients,
    atRisk,
    highRisk,
    retentionRate,
    averageLifetimeValue,
  };
}
