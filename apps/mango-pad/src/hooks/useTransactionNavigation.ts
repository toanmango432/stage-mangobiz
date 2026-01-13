/**
 * useTransactionNavigation Hook
 * Automatically navigates based on activeTransaction.step changes
 *
 * US-010: Create transaction navigation hook
 *
 * This hook watches the activeTransaction state and automatically
 * navigates to the correct screen when the step changes.
 */

import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePadMqttOptional } from '@/providers/PadMqttProvider';
import type { PadFlowStep } from '@/types';

/**
 * Route mapping from PadFlowStep to URL path
 * Note: Most navigation happens via Redux screen state, but
 * this provides URL-based navigation for deep linking and consistency
 */
const STEP_TO_ROUTE: Record<PadFlowStep, string> = {
  waiting: '/',
  receipt: '/receipt',
  tip: '/tip',
  signature: '/signature',
  receipt_preference: '/receipt-preference',
  waiting_payment: '/processing',
  complete: '/complete',
  failed: '/failed',
  cancelled: '/',
};

/**
 * Hook that provides automatic navigation based on transaction step changes
 *
 * @param options.skipInitialNavigation - If true, won't navigate on initial mount
 * @returns The current transaction step (or null if no active transaction)
 *
 * @example
 * function WaitingPage() {
 *   useTransactionNavigation();
 *   // When activeTransaction.step changes, this component will
 *   // automatically navigate to the appropriate route
 * }
 */
export function useTransactionNavigation(options?: { skipInitialNavigation?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const context = usePadMqttOptional();
  const previousStepRef = useRef<PadFlowStep | null>(null);
  const isInitialMountRef = useRef(true);

  const activeTransaction = context?.activeTransaction ?? null;
  const currentStep = activeTransaction?.step ?? null;

  useEffect(() => {
    // Skip if no context (not within PadMqttProvider)
    if (!context) return;

    // Skip if no active transaction
    if (!currentStep) {
      // Reset refs when transaction is cleared
      previousStepRef.current = null;
      return;
    }

    // Skip initial navigation if option is set
    if (isInitialMountRef.current && options?.skipInitialNavigation) {
      isInitialMountRef.current = false;
      previousStepRef.current = currentStep;
      return;
    }

    // Skip if step hasn't changed
    if (currentStep === previousStepRef.current) {
      return;
    }

    // Get the target route for this step
    const targetRoute = STEP_TO_ROUTE[currentStep];

    // Only navigate if we're not already on the target route
    if (location.pathname !== targetRoute) {
      console.log('[useTransactionNavigation] Navigating:', {
        from: location.pathname,
        to: targetRoute,
        step: currentStep,
      });
      navigate(targetRoute, { replace: true });
    }

    // Update refs
    previousStepRef.current = currentStep;
    isInitialMountRef.current = false;
  }, [context, currentStep, navigate, location.pathname, options?.skipInitialNavigation]);

  return currentStep;
}

/**
 * Get the route for a given transaction step
 * Useful for programmatic navigation without the hook
 */
export function getRouteForStep(step: PadFlowStep): string {
  return STEP_TO_ROUTE[step];
}

/**
 * Get the step for a given route
 * Useful for determining the expected step from URL
 */
export function getStepForRoute(route: string): PadFlowStep | null {
  const entry = Object.entries(STEP_TO_ROUTE).find(([, r]) => r === route);
  return entry ? (entry[0] as PadFlowStep) : null;
}
