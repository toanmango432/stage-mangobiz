/**
 * Appointment Filtering Utilities
 * Apply various filters to appointment lists
 */

import type { LocalAppointment, AppointmentFilters } from '@mango/types';

/**
 * Extended filters with serviceTypes for UI use
 */
interface ExtendedFilters extends AppointmentFilters {
  search?: string;
  serviceTypes?: string[];
}

/**
 * Filter appointments based on search, status, and service type
 */
export function filterAppointments(
  appointments: LocalAppointment[],
  filters: ExtendedFilters
): LocalAppointment[] {
  let filtered = [...appointments];

  // Apply search filter (support both search and searchQuery)
  const searchTerm = filters.search || filters.searchQuery;
  if (searchTerm && searchTerm.trim()) {
    const searchLower = searchTerm.toLowerCase().trim();
    filtered = filtered.filter(apt => {
      // Search in client name
      if (apt.clientName.toLowerCase().includes(searchLower)) return true;

      // Search in client phone
      if (apt.clientPhone?.toLowerCase().includes(searchLower)) return true;

      // Search in service names
      if (apt.services.some((s: { serviceName: string }) => s.serviceName.toLowerCase().includes(searchLower))) return true;

      // Search in staff name
      if (apt.staffName?.toLowerCase().includes(searchLower)) return true;

      return false;
    });
  }

  // Apply status filter
  if (filters.status && filters.status.length > 0) {
    filtered = filtered.filter(apt => filters.status!.includes(apt.status));
  }

  // Apply service type filter
  if (filters.serviceTypes && filters.serviceTypes.length > 0) {
    filtered = filtered.filter(apt => {
      // Check if any of the appointment's services match the filter
      return apt.services.some((service: { serviceName: string }) => {
        return filters.serviceTypes!.some((filterType: string) =>
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
