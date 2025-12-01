import { useMemo, useCallback } from 'react';
import { clientsDB, patchTestsDB } from '../db/database';
import type { Client, PatchTest } from '../types';

export interface BookingValidationResult {
  isValid: boolean;
  errors: BookingValidationError[];
  warnings: BookingValidationWarning[];
}

export interface BookingValidationError {
  type: 'blocked' | 'patch_test_required' | 'form_required';
  message: string;
  clientId: string;
  details?: Record<string, any>;
}

export interface BookingValidationWarning {
  type: 'patch_test_expiring' | 'high_no_show_rate' | 'outstanding_balance' | 'staff_alert';
  message: string;
  clientId: string;
  details?: Record<string, any>;
}

/**
 * Hook for validating client booking eligibility
 * Implements PRD 2.3.2 (Blocking) and PRD 2.3.3 (Patch Tests)
 */
export function useClientBookingValidation() {
  /**
   * Validate a single client for booking
   */
  const validateClient = useCallback(async (
    clientId: string,
    serviceIds: string[] = []
  ): Promise<BookingValidationResult> => {
    const errors: BookingValidationError[] = [];
    const warnings: BookingValidationWarning[] = [];

    // Fetch client
    const client = await clientsDB.getById(clientId);
    if (!client) {
      return {
        isValid: false,
        errors: [{
          type: 'blocked',
          message: 'Client not found',
          clientId,
        }],
        warnings: [],
      };
    }

    // Check if client is blocked
    if (client.isBlocked) {
      errors.push({
        type: 'blocked',
        message: `${client.firstName} ${client.lastName} is blocked and cannot book appointments.`,
        clientId,
        details: {
          blockReason: client.blockReason,
          blockedAt: client.blockedAt,
          blockedBy: client.blockedBy,
        },
      });
    }

    // Check patch tests for services that require them
    if (serviceIds.length > 0) {
      for (const serviceId of serviceIds) {
        const validPatchTest = await patchTestsDB.getValidForService(clientId, serviceId);
        if (!validPatchTest) {
          // Check if service requires patch test (would need service lookup)
          // For now, we'll just check expiring tests
        }
      }

      // Check for expiring patch tests
      const expiringTests = await patchTestsDB.getExpiring(clientId, 14); // 2 weeks ahead
      if (expiringTests.length > 0) {
        warnings.push({
          type: 'patch_test_expiring',
          message: `${expiringTests.length} patch test(s) expiring soon`,
          clientId,
          details: {
            expiringTests: expiringTests.map(t => ({
              serviceId: t.serviceId,
              expiresAt: t.expiresAt,
            })),
          },
        });
      }
    }

    // Check for staff alert
    if (client.staffAlert) {
      warnings.push({
        type: 'staff_alert',
        message: client.staffAlert.message,
        clientId,
        details: {
          createdAt: client.staffAlert.createdAt,
          createdBy: client.staffAlert.createdByName,
        },
      });
    }

    // Check for high no-show rate
    if (client.visitSummary) {
      const totalAppointments = client.visitSummary.totalVisits + client.visitSummary.noShowCount;
      if (totalAppointments > 3) {
        const noShowRate = client.visitSummary.noShowCount / totalAppointments;
        if (noShowRate > 0.2) { // More than 20% no-shows
          warnings.push({
            type: 'high_no_show_rate',
            message: `High no-show rate (${Math.round(noShowRate * 100)}%)`,
            clientId,
            details: {
              noShowCount: client.visitSummary.noShowCount,
              totalAppointments,
              rate: noShowRate,
            },
          });
        }
      }
    }

    // Check for outstanding balance
    if (client.outstandingBalance && client.outstandingBalance > 0) {
      warnings.push({
        type: 'outstanding_balance',
        message: `Outstanding balance: $${client.outstandingBalance.toFixed(2)}`,
        clientId,
        details: {
          amount: client.outstandingBalance,
        },
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }, []);

  /**
   * Validate multiple clients (for group bookings)
   */
  const validateClients = useCallback(async (
    clientIds: string[],
    serviceIds: string[] = []
  ): Promise<Map<string, BookingValidationResult>> => {
    const results = new Map<string, BookingValidationResult>();

    await Promise.all(
      clientIds.map(async (clientId) => {
        const result = await validateClient(clientId, serviceIds);
        results.set(clientId, result);
      })
    );

    return results;
  }, [validateClient]);

  /**
   * Quick check if a client can book (just checks blocked status)
   */
  const canClientBook = useCallback(async (clientId: string): Promise<boolean> => {
    const client = await clientsDB.getById(clientId);
    return client ? !client.isBlocked : false;
  }, []);

  /**
   * Get blocked status message for display
   */
  const getBlockedMessage = useCallback((client: Client): string | null => {
    if (!client.isBlocked) return null;

    const reasons: Record<string, string> = {
      no_show: 'Repeated no-shows',
      late_cancel: 'Late cancellations',
      payment_issue: 'Payment issues',
      behavior: 'Inappropriate behavior',
      safety_concern: 'Safety concern',
      other: 'Other',
    };

    const reasonText = client.blockReason
      ? reasons[client.blockReason] || client.blockReason
      : 'Unknown reason';

    return `This client is blocked (${reasonText}). They cannot book appointments.`;
  }, []);

  return {
    validateClient,
    validateClients,
    canClientBook,
    getBlockedMessage,
  };
}

export default useClientBookingValidation;
