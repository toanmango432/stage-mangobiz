/**
 * Commission Calculation Utilities
 * Handles commission rate resolution and calculation for service transactions
 */

import type { MenuService, StaffServiceAssignment } from '@/types/catalog';
import type { CheckoutTicketService } from '@/store/slices/uiTicketsSlice';

export interface ServiceCommissionData {
  serviceId: string;
  staffId?: string;
  price: number;
  commissionRate: number; // percentage (0-100)
  commissionAmount: number; // calculated in dollars
}

/**
 * Calculate commission for a single service
 * @param service - The service from the ticket
 * @param menuService - The menu service with base commission rate
 * @param staffAssignment - Optional staff-specific assignment with custom rate
 * @returns Commission data for the service
 */
export function calculateServiceCommission(
  service: CheckoutTicketService,
  menuService: MenuService | undefined,
  staffAssignment: StaffServiceAssignment | undefined
): ServiceCommissionData {
  // Determine the commission rate
  // Priority: Staff assignment override > Menu service default > 0%
  let commissionRate = 0;

  if (staffAssignment?.customCommissionRate !== undefined && staffAssignment.customCommissionRate !== null) {
    // Staff has custom commission rate override
    commissionRate = staffAssignment.customCommissionRate;
  } else if (menuService?.commissionRate !== undefined && menuService.commissionRate !== null) {
    // Use service default commission rate
    commissionRate = menuService.commissionRate;
  }

  // Calculate commission amount (rate is percentage, convert to decimal)
  const commissionAmount = (service.price * commissionRate) / 100;

  return {
    serviceId: service.serviceId,
    staffId: service.staffId,
    price: service.price,
    commissionRate,
    commissionAmount,
  };
}

/**
 * Calculate total commission for all services
 * @param commissions - Array of service commission data
 * @returns Total commission amount
 */
export function calculateTotalCommission(commissions: ServiceCommissionData[]): number {
  return commissions.reduce((total, item) => total + item.commissionAmount, 0);
}

/**
 * Group commissions by staff member
 * @param commissions - Array of service commission data
 * @returns Map of staffId to total commission amount
 */
export function groupCommissionsByStaff(
  commissions: ServiceCommissionData[]
): Map<string, number> {
  const staffCommissions = new Map<string, number>();

  commissions.forEach((item) => {
    if (!item.staffId) return;

    const current = staffCommissions.get(item.staffId) || 0;
    staffCommissions.set(item.staffId, current + item.commissionAmount);
  });

  return staffCommissions;
}
