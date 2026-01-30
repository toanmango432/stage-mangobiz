/**
 * useCommissionCalculation Hook
 * Calculates commission for services based on menu service rates and staff assignments
 */

import { useState, useEffect } from 'react';
import { dataService } from '@/services/dataService';
import { calculateServiceCommission, groupCommissionsByStaff } from '@/utils/commissionCalculation';
import type { CommissionSummary, TicketItem, StaffMember } from '../types';
import type { MenuService, StaffServiceAssignment } from '@/types/catalog';

export interface UseCommissionCalculationProps {
  items?: TicketItem[];
  staffMembers?: StaffMember[];
}

/**
 * Hook to calculate commission summary from ticket items
 * Fetches catalog data (MenuService, StaffServiceAssignment) and calculates commissions
 */
export function useCommissionCalculation({
  items = [],
  staffMembers = [],
}: UseCommissionCalculationProps): CommissionSummary | undefined {
  const [commissionSummary, setCommissionSummary] = useState<CommissionSummary | undefined>(undefined);

  useEffect(() => {
    // Async commission calculation
    const calculateCommissions = async () => {
      // Only calculate if there are items
      if (items.length === 0) {
        setCommissionSummary(undefined);
        return;
      }
      try {
        const storeId = dataService.getStoreId?.() || 'default-store';
        const menuServices = new Map<string, MenuService>();
        const staffAssignments = new Map<string, StaffServiceAssignment[]>();

        // Load menu services for all items that have serviceId
        const allServices = await dataService.menuServices.getAll(storeId);
        allServices.forEach(service => menuServices.set(service.id, service));

        // Load staff assignments for each unique serviceId
        const uniqueServiceIds = Array.from(new Set(items.map(item => item.serviceId).filter(Boolean)));
        for (const serviceId of uniqueServiceIds) {
          if (serviceId) {
            const assignments = await dataService.staffServiceAssignments.getByService(storeId, serviceId);
            staffAssignments.set(serviceId, assignments);
          }
        }

        // Calculate commission for each item
        const commissions = items
          .filter((item): item is TicketItem & { serviceId: string; staffId: string } =>
            Boolean(item.serviceId && item.staffId)
          ) // Type guard for items with both serviceId and staffId
          .map(item => {
            const menuService = menuServices.get(item.serviceId);
            const assignments = staffAssignments.get(item.serviceId) || [];
            const staffAssignment = assignments.find((a: StaffServiceAssignment) => a.staffId === item.staffId && a.isActive);

            // Convert TicketItem to CheckoutTicketService format for commission calculation
            const checkoutService = {
              id: item.serviceId,
              serviceId: item.serviceId,
              serviceName: item.name,
              price: item.price,
              duration: 0, // Not needed for commission calculation
              status: 'completed' as const,
              staffId: item.staffId,
              staffName: item.staffName,
            };

            return calculateServiceCommission(checkoutService, menuService, staffAssignment);
          });

        // Group commissions by staff
        const staffCommissionsMap = groupCommissionsByStaff(commissions);

        // Convert to CommissionSummary format
        const staffCommissions = Array.from(staffCommissionsMap.entries()).map(([staffId, commissionAmount]) => {
          const staff = staffMembers.find(s => s.id === staffId);
          return {
            staffId,
            staffName: staff?.name || 'Unknown Staff',
            commissionAmount,
          };
        });

        // Sort by commission amount descending
        staffCommissions.sort((a, b) => b.commissionAmount - a.commissionAmount);

        const totalCommission = commissions.reduce((total, c) => total + c.commissionAmount, 0);

        setCommissionSummary({
          totalCommission,
          staffCommissions,
        });
      } catch (error) {
        console.warn('Failed to calculate commissions:', error);
        // Set empty summary on error (graceful degradation)
        setCommissionSummary({
          totalCommission: 0,
          staffCommissions: [],
        });
      }
    };

    calculateCommissions();
  }, [items, staffMembers]);

  return commissionSummary;
}
