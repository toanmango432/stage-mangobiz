/**
 * Booking Intelligence Service
 * Core intelligence engine for smart booking suggestions
 */

import { LocalAppointment } from '../types/appointment';
import { Client } from '../types/client';
import { Service } from '../types/service';
import { Staff } from '../types/staff';
import {
  analyzeClientHistory,
  getSuggestedServices,
  getSuggestedStaff,
  getSuggestedTime,
  formatLastVisit,
  ClientBookingPattern,
} from '../utils/clientHistoryAnalysis';
import { findAvailableStaff, isStaffAvailable } from '../utils/conflictDetection';
import { autoAssignStaff } from '../utils/smartAutoAssign';

export interface SmartBookingSuggestion {
  // Service suggestions
  suggestedServices: Array<{
    serviceId: string;
    serviceName: string;
    confidence: number;
    reason: string;
  }>;
  
  // Staff suggestions
  suggestedStaff: Array<{
    staffId: string;
    staffName: string;
    confidence: number;
    reason: string;
    isAvailable: boolean;
  }>;
  
  // Time suggestions
  suggestedTimes: Array<{
    time: Date;
    displayTime: string;
    confidence: number;
    reason: string;
    isAvailable: boolean;
  }>;
  
  // Client info
  clientInfo: {
    lastVisit: string;
    totalVisits: number;
    averageSpend: number;
    preferredTime?: string;
  };
  
  // Quick booking option
  quickBooking?: {
    services: Array<{ serviceId: string; serviceName: string; staffId: string; staffName: string }>;
    suggestedTime: Date;
    estimatedDuration: number;
    estimatedPrice: number;
    confidence: number;
    reason: string;
  };
}

/**
 * Generate smart booking suggestions for a client
 */
export async function generateSmartBookingSuggestions(
  client: Client,
  selectedDate: Date,
  allAppointments: LocalAppointment[],
  allServices: Service[],
  allStaff: Staff[],
  salonId: string
): Promise<SmartBookingSuggestion> {
  // Analyze client history
  const pattern = analyzeClientHistory(client, allAppointments);
  
  // Get suggested services
  const serviceSuggestions = getSuggestedServices(pattern, 3);
  const suggestedServices = serviceSuggestions
    .map(suggestion => {
      const service = allServices.find(s => 
        s.name.toLowerCase() === suggestion.serviceName.toLowerCase()
      );
      return service ? {
        serviceId: service.id,
        serviceName: suggestion.serviceName,
        confidence: suggestion.confidence,
        reason: suggestion.reason,
      } : null;
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);

  // Get suggested staff
  const staffSuggestions = getSuggestedStaff(pattern, 3);
  
  // Check staff availability for selected date
  const suggestedStaff = await Promise.all(
    staffSuggestions.map(async suggestion => {
      // Check if staff is available on selected date (simplified - check if no conflicting appointments)
      const staffAppointments = allAppointments.filter(
        apt => apt.staffId === suggestion.staffId &&
               new Date(apt.scheduledStartTime).toDateString() === selectedDate.toDateString() &&
               apt.status !== 'cancelled' &&
               apt.status !== 'no-show'
      );
      
      // Staff is available if they have fewer appointments (simplified check)
      const isAvailable = staffAppointments.length < 8; // Assume max 8 appointments per day
      
      return {
        staffId: suggestion.staffId,
        staffName: suggestion.staffName,
        confidence: suggestion.confidence,
        reason: suggestion.reason,
        isAvailable,
      };
    })
  );

  // Get suggested times
  const timeSuggestion = getSuggestedTime(pattern);
  const suggestedTimes: Array<{
    time: Date;
    displayTime: string;
    confidence: number;
    reason: string;
    isAvailable: boolean;
  }> = [];

  if (timeSuggestion) {
    // Create suggested time for selected date
    const suggestedTime = new Date(selectedDate);
    suggestedTime.setHours(timeSuggestion.hour, 0, 0, 0);
    
    // Check if time is available (simplified)
    const isTimeAvailable = true; // Would check against existing appointments
    
    const hour12 = timeSuggestion.hour > 12 
      ? timeSuggestion.hour - 12 
      : timeSuggestion.hour === 0 
        ? 12 
        : timeSuggestion.hour;
    const period = timeSuggestion.hour >= 12 ? 'PM' : 'AM';
    
    suggestedTimes.push({
      time: suggestedTime,
      displayTime: `${hour12}:00 ${period}`,
      confidence: timeSuggestion.confidence,
      reason: timeSuggestion.reason,
      isAvailable: isTimeAvailable,
    });
    
    // Add alternative times (1 hour before/after)
    const altTimes = [
      { offset: -1, label: '1 hour earlier' },
      { offset: 1, label: '1 hour later' },
    ];
    
    altTimes.forEach(({ offset, label }) => {
      const altHour = timeSuggestion.hour + offset;
      if (altHour >= 8 && altHour <= 20) { // Business hours
        const altTime = new Date(selectedDate);
        altTime.setHours(altHour, 0, 0, 0);
        
        const altHour12 = altHour > 12 
          ? altHour - 12 
          : altHour === 0 
            ? 12 
            : altHour;
        const altPeriod = altHour >= 12 ? 'PM' : 'AM';
        
        suggestedTimes.push({
          time: altTime,
          displayTime: `${altHour12}:00 ${altPeriod}`,
          confidence: timeSuggestion.confidence * 0.7, // Lower confidence for alternatives
          reason: `${label} than usual time`,
          isAvailable: true,
        });
      }
    });
  }

  // Generate quick booking option
  let quickBooking: SmartBookingSuggestion['quickBooking'] | undefined;
  
  if (suggestedServices.length > 0 && suggestedStaff.length > 0 && suggestedTimes.length > 0) {
    const topService = suggestedServices[0];
    const topStaff = suggestedStaff.find(s => s.isAvailable) || suggestedStaff[0];
    const topTime = suggestedTimes[0];
    
    // Find service in allServices
    const service = allServices.find(s => s.id === topService.serviceId);
    
    if (service && topStaff && topTime) {
      const estimatedDuration = service.duration;
      const estimatedPrice = service.price;
      
      quickBooking = {
        services: [{
          serviceId: topService.serviceId,
          serviceName: topService.serviceName,
          staffId: topStaff.staffId,
          staffName: topStaff.staffName,
        }],
        suggestedTime: topTime.time,
        estimatedDuration,
        estimatedPrice,
        confidence: Math.min(topService.confidence, topStaff.confidence, topTime.confidence),
        reason: `Based on ${client.name}'s booking history: ${topService.serviceName} with ${topStaff.staffName} at ${topTime.displayTime}`,
      };
    }
  }

  // Format client info
  const clientInfo = {
    lastVisit: formatLastVisit(pattern.daysSinceLastVisit),
    totalVisits: pattern.totalVisits,
    averageSpend: pattern.averageSpend,
    preferredTime: timeSuggestion 
      ? `${timeSuggestion.hour > 12 ? timeSuggestion.hour - 12 : timeSuggestion.hour === 0 ? 12 : timeSuggestion.hour}:00 ${timeSuggestion.hour >= 12 ? 'PM' : 'AM'}`
      : undefined,
  };

  return {
    suggestedServices,
    suggestedStaff,
    suggestedTimes,
    clientInfo,
    quickBooking,
  };
}

/**
 * Auto-fill booking form with smart suggestions
 */
export function createSmartBookingDefaults(
  suggestion: SmartBookingSuggestion
): {
  services: Array<{ id: string; name: string; staffId: string; staffName: string }>;
  time: Date;
  staffId: string;
} | null {
  if (!suggestion.quickBooking) return null;
  
  return {
    services: suggestion.quickBooking.services.map(s => ({
      id: s.serviceId,
      name: s.serviceName,
      staffId: s.staffId,
      staffName: s.staffName,
    })),
    time: suggestion.quickBooking.suggestedTime,
    staffId: suggestion.quickBooking.services[0].staffId,
  };
}

