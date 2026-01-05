/**
 * Client History Analysis
 * Analyze client booking patterns for smart suggestions
 */

import { LocalAppointment } from '../types/appointment';
import { Client } from '../types/client';

export interface ClientBookingPattern {
  // Service patterns
  mostCommonServices: Array<{ serviceName: string; count: number; lastUsed: Date }>;
  serviceFrequency: Map<string, number>;
  averageSpend: number;
  
  // Staff patterns
  preferredStaff: Array<{ staffId: string; staffName: string; count: number; lastUsed: Date }>;
  staffFrequency: Map<string, number>;
  
  // Time patterns
  preferredTimes: Array<{ hour: number; count: number }>;
  averageDuration: number;
  
  // Visit patterns
  totalVisits: number;
  lastVisit: Date | null;
  daysSinceLastVisit: number | null;
  visitFrequency: number; // visits per month
}

/**
 * Analyze client booking history
 */
export function analyzeClientHistory(
  client: Client,
  appointments: LocalAppointment[]
): ClientBookingPattern {
  // Filter to this client's appointments (completed/past)
  const clientAppointments = appointments.filter(
    apt => apt.clientId === client.id &&
           (apt.status === 'completed' || 
            new Date(apt.scheduledStartTime) < new Date())
  );

  // Service patterns
  const serviceFrequency = new Map<string, number>();
  const serviceLastUsed = new Map<string, Date>();
  
  clientAppointments.forEach(apt => {
    apt.services.forEach(service => {
      const count = serviceFrequency.get(service.serviceName) || 0;
      serviceFrequency.set(service.serviceName, count + 1);
      
      const aptDate = new Date(apt.scheduledStartTime);
      const lastUsed = serviceLastUsed.get(service.serviceName);
      if (!lastUsed || aptDate > lastUsed) {
        serviceLastUsed.set(service.serviceName, aptDate);
      }
    });
  });

  const mostCommonServices = Array.from(serviceFrequency.entries())
    .map(([serviceName, count]) => ({
      serviceName,
      count,
      lastUsed: serviceLastUsed.get(serviceName) || new Date(),
    }))
    .sort((a, b) => b.count - a.count);

  // Staff patterns
  const staffFrequency = new Map<string, number>();
  const staffLastUsed = new Map<string, Date>();
  const staffNames = new Map<string, string>();
  
  clientAppointments.forEach(apt => {
    apt.services.forEach(service => {
      if (service.staffId) {
        const count = staffFrequency.get(service.staffId) || 0;
        staffFrequency.set(service.staffId, count + 1);
        staffNames.set(service.staffId, service.staffName || '');
        
        const aptDate = new Date(apt.scheduledStartTime);
        const lastUsed = staffLastUsed.get(service.staffId);
        if (!lastUsed || aptDate > lastUsed) {
          staffLastUsed.set(service.staffId, aptDate);
        }
      }
    });
  });

  const preferredStaff = Array.from(staffFrequency.entries())
    .map(([staffId, count]) => ({
      staffId,
      staffName: staffNames.get(staffId) || 'Unknown',
      count,
      lastUsed: staffLastUsed.get(staffId) || new Date(),
    }))
    .sort((a, b) => b.count - a.count);

  // Time patterns
  const timeFrequency = new Map<number, number>();
  let totalDuration = 0;
  let durationCount = 0;
  
  clientAppointments.forEach(apt => {
    const hour = new Date(apt.scheduledStartTime).getHours();
    const count = timeFrequency.get(hour) || 0;
    timeFrequency.set(hour, count + 1);
    
    const duration = Math.round(
      (new Date(apt.scheduledEndTime).getTime() - 
       new Date(apt.scheduledStartTime).getTime()) / 60000
    );
    totalDuration += duration;
    durationCount++;
  });

  const preferredTimes = Array.from(timeFrequency.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => b.count - a.count);

  // Visit patterns
  const sortedAppointments = [...clientAppointments].sort(
    (a, b) => new Date(b.scheduledStartTime).getTime() - 
              new Date(a.scheduledStartTime).getTime()
  );
  
  const lastVisit = sortedAppointments.length > 0
    ? new Date(sortedAppointments[0].scheduledStartTime)
    : null;
  
  const daysSinceLastVisit = lastVisit
    ? Math.floor((Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Calculate visit frequency (visits per month)
  let visitFrequency = 0;
  if (clientAppointments.length > 1) {
    const firstVisit = new Date(sortedAppointments[sortedAppointments.length - 1].scheduledStartTime);
    const monthsBetween = (lastVisit!.getTime() - firstVisit.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsBetween > 0) {
      visitFrequency = clientAppointments.length / monthsBetween;
    }
  }

  // Calculate average spend
  const totalSpent = clientAppointments.reduce((sum, apt) => {
    const aptSpend = apt.services.reduce((serviceSum, s) => serviceSum + s.price, 0);
    return sum + aptSpend;
  }, 0);
  
  const averageSpend = clientAppointments.length > 0
    ? totalSpent / clientAppointments.length
    : 0;

  return {
    mostCommonServices,
    serviceFrequency,
    averageSpend,
    preferredStaff,
    staffFrequency,
    preferredTimes,
    averageDuration: durationCount > 0 ? totalDuration / durationCount : 0,
    totalVisits: clientAppointments.length,
    lastVisit,
    daysSinceLastVisit,
    visitFrequency,
  };
}

/**
 * Get suggested services for client
 */
export function getSuggestedServices(
  pattern: ClientBookingPattern,
  maxSuggestions: number = 3
): Array<{ serviceName: string; confidence: number; reason: string }> {
  return pattern.mostCommonServices
    .slice(0, maxSuggestions)
    .map((service, index) => ({
      serviceName: service.serviceName,
      confidence: Math.min(100, (service.count / (pattern.totalVisits || 1)) * 100),
      reason: index === 0 
        ? `Booked ${service.count} time${service.count !== 1 ? 's' : ''}`
        : `Booked ${service.count} time${service.count !== 1 ? 's' : ''} (${Math.round((service.count / (pattern.totalVisits || 1)) * 100)}% of visits)`,
    }));
}

/**
 * Get suggested staff for client
 */
export function getSuggestedStaff(
  pattern: ClientBookingPattern,
  maxSuggestions: number = 2
): Array<{ staffId: string; staffName: string; confidence: number; reason: string }> {
  return pattern.preferredStaff
    .slice(0, maxSuggestions)
    .map((staff, index) => ({
      staffId: staff.staffId,
      staffName: staff.staffName,
      confidence: Math.min(100, (staff.count / (pattern.totalVisits || 1)) * 100),
      reason: index === 0
        ? `Preferred staff (${staff.count} past booking${staff.count !== 1 ? 's' : ''})`
        : `Often books with ${staff.staffName} (${staff.count} time${staff.count !== 1 ? 's' : ''})`,
    }));
}

/**
 * Get suggested time for client
 */
export function getSuggestedTime(
  pattern: ClientBookingPattern
): { hour: number; confidence: number; reason: string } | null {
  if (pattern.preferredTimes.length === 0) return null;
  
  const mostPreferred = pattern.preferredTimes[0];
  const confidence = Math.min(100, (mostPreferred.count / (pattern.totalVisits || 1)) * 100);
  
  const hour12 = mostPreferred.hour > 12 
    ? mostPreferred.hour - 12 
    : mostPreferred.hour === 0 
      ? 12 
      : mostPreferred.hour;
  const period = mostPreferred.hour >= 12 ? 'PM' : 'AM';
  
  return {
    hour: mostPreferred.hour,
    confidence,
    reason: `Usually books at ${hour12}:00 ${period} (${mostPreferred.count} of ${pattern.totalVisits} visits)`,
  };
}

/**
 * Format last visit text
 */
export function formatLastVisit(daysSinceLastVisit: number | null): string {
  if (daysSinceLastVisit === null) return 'First visit';
  if (daysSinceLastVisit === 0) return 'Today';
  if (daysSinceLastVisit === 1) return 'Yesterday';
  if (daysSinceLastVisit < 7) return `${daysSinceLastVisit} days ago`;
  if (daysSinceLastVisit < 30) return `${Math.floor(daysSinceLastVisit / 7)} weeks ago`;
  if (daysSinceLastVisit < 365) return `${Math.floor(daysSinceLastVisit / 30)} months ago`;
  return `${Math.floor(daysSinceLastVisit / 365)} years ago`;
}

