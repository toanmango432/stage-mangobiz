import { useState, useEffect } from 'react';
import { licenseManager, type LicenseState } from '../services/licenseManager';
import toast from 'react-hot-toast';

/**
 * Hook to check license status and block operations if needed
 */
export function useLicenseGuard() {
  const [state, setState] = useState<LicenseState>(licenseManager.getState());

  useEffect(() => {
    const unsubscribe = licenseManager.subscribe((newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, []);

  const isOperational = licenseManager.isOperational();
  const isBlocked = licenseManager.isBlocked();

  /**
   * Check if operation is allowed
   * Shows toast error if blocked
   */
  const canPerformOperation = (operationName?: string): boolean => {
    if (isBlocked) {
      const message = getBlockedMessage(operationName);
      toast.error(message, {
        duration: 4000,
      });
      return false;
    }

    return true;
  };

  /**
   * Get blocked operation message
   */
  const getBlockedMessage = (operationName?: string): string => {
    const operation = operationName || 'This operation';

    switch (state.status) {
      case 'not_activated':
        return `${operation} requires license activation. Please activate your store.`;
      case 'deactivated':
        return `${operation} is blocked. Your license has been deactivated.`;
      case 'expired':
        return `${operation} is blocked. Your license has expired.`;
      case 'offline_expired':
        return `${operation} is blocked. Please reconnect to the internet.`;
      case 'version_mismatch':
        return `${operation} is blocked. Please update your app to continue.`;
      default:
        return `${operation} is currently unavailable.`;
    }
  };

  /**
   * Guard wrapper for operations
   * Usage: guardOperation(() => doSomething(), 'Create ticket')
   */
  const guardOperation = <T,>(operation: () => T, operationName?: string): T | null => {
    if (!canPerformOperation(operationName)) {
      return null;
    }

    return operation();
  };

  /**
   * Guard wrapper for async operations
   * Usage: await guardOperationAsync(async () => await doSomething(), 'Create ticket')
   */
  const guardOperationAsync = async <T,>(
    operation: () => Promise<T>,
    operationName?: string
  ): Promise<T | null> => {
    if (!canPerformOperation(operationName)) {
      return null;
    }

    return await operation();
  };

  return {
    state,
    isOperational,
    isBlocked,
    canPerformOperation,
    guardOperation,
    guardOperationAsync,
    getBlockedMessage,
  };
}

/**
 * Hook for read-only mode (allows viewing but not editing)
 */
export function useReadOnlyMode() {
  const { isBlocked, canPerformOperation } = useLicenseGuard();

  return {
    isReadOnly: isBlocked,
    canEdit: !isBlocked,
    checkCanEdit: (operationName?: string) => canPerformOperation(operationName),
  };
}
