/**
 * Appointment Filtering Utilities
 * Apply various filters to appointment lists
 */

import { LocalAppointment } from '../types/appointment';
import { AppointmentFilters } from '../components/Book/FilterPanel';

/**
 * Filter appointments based on search, status, and service type
 */
export function filterAppointments(
  appointments: LocalAppointment[],
  filters: AppointmentFilters
): LocalAppointment[] {
  let filtered = [...appointments];

  // Apply search filter
  if (filters.search && filters.search.trim()) {
    const searchLower = filters.search.toLowerCase().trim();
    filtered = filtered.filter(apt => {
      // Search in client name
      if (apt.clientName.toLowerCase().includes(searchLower)) return true;

      // Search in client phone
      if (apt.clientPhone?.toLowerCase().includes(searchLower)) return true;

      // Search in service names
      if (apt.services.some(s => s.serviceName.toLowerCase().includes(searchLower))) return true;

      // Search in staff name
      if (apt.staffName?.toLowerCase().includes(searchLower)) return true;

      return false;
    });
  }

  // Apply status filter
  if (filters.status && filters.status.length > 0) {
    filtered = filtered.filter(apt => filters.status.includes(apt.status));
  }

  // Apply service type filter
  if (filters.serviceTypes && filters.serviceTypes.length > 0) {
    filtered = filtered.filter(apt => {
      // Check if any of the appointment's services match the filter
      return apt.services.some(service => {
        return filters.serviceTypes.some(filterType =>
          service.serviceName.toLowerCase().includes(filterType.toLowerCase())
        );
      });
    });
  }

  return filtered;
}

/**
 * Get appointments for a specific date range
 */
export function getAppointmentsByDateRange(
  appointments: LocalAppointment[],
  dateRange: 'today' | 'week' | 'month' | 'all',
  referenceDate: Date = new Date()
): LocalAppointment[] {
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  switch (dateRange) {
    case 'today': {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      return appointments.filter(apt => {
        const aptDate = new Date(apt.scheduledStartTime);
        return aptDate >= today && aptDate < tomorrow;
      });
    }

    case 'week': {
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + 7);

      return appointments.filter(apt => {
        const aptDate = new Date(apt.scheduledStartTime);
        return aptDate >= today && aptDate < weekEnd;
      });
    }

    case 'month': {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

      return appointments.filter(apt => {
        const aptDate = new Date(apt.scheduledStartTime);
        return aptDate >= monthStart && aptDate <= monthEnd;
      });
    }

    case 'all':
    default:
      return appointments;
  }
}
