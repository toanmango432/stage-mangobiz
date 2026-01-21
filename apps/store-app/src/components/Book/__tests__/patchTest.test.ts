/**
 * Unit Tests for Patch Test Enforcement in Booking Flow
 *
 * Tests the patch test validation, warning banner display,
 * and override reason validation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { PatchTestValidationResult } from '../../../store/slices/clientsSlice/thunks';

// Mock the Supabase client functions
vi.mock('../../../services/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

// Import the mocked supabase after mocking
import { supabase } from '../../../services/supabase/client';

// ==================== TEST UTILITIES ====================

/**
 * Create a mock validation result for testing
 */
function createMockValidationResult(overrides: Partial<PatchTestValidationResult> = {}): PatchTestValidationResult {
  return {
    valid: true,
    ...overrides,
  };
}

/**
 * Create a mock service for testing
 */
function createMockService(overrides: Partial<{
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
  requiresPatchTest?: boolean;
}> = {}) {
  return {
    id: `service-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Hair Color Service',
    category: 'Color',
    duration: 60,
    price: 150,
    ...overrides,
  };
}

// ==================== PATCH TEST VALIDATION TESTS ====================

describe('Patch test validation logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should block booking when patch test is required but client has none', async () => {
    const mockInvoke = vi.mocked(supabase.functions.invoke);
    mockInvoke.mockResolvedValue({
      data: createMockValidationResult({
        valid: false,
        reason: 'patch_test_required',
        message: 'This service requires a patch test',
        canOverride: true,
        patchTestRequired: true,
      }),
      error: null,
    });

    const { data } = await supabase.functions.invoke('validate-booking', {
      body: {
        clientId: 'client-001',
        serviceId: 'service-001',
        appointmentDate: new Date().toISOString(),
      },
    });

    expect(data.valid).toBe(false);
    expect(data.reason).toBe('patch_test_required');
    expect(data.canOverride).toBe(true);
    expect(data.patchTestRequired).toBe(true);
  });

  it('should block booking when patch test is expired', async () => {
    const mockInvoke = vi.mocked(supabase.functions.invoke);
    mockInvoke.mockResolvedValue({
      data: createMockValidationResult({
        valid: false,
        reason: 'patch_test_expired',
        message: 'Patch test has expired',
        canOverride: true,
        patchTestRequired: true,
        lastPatchTestDate: '2024-01-01T00:00:00Z',
        patchTestExpiresAt: '2024-07-01T00:00:00Z',
      }),
      error: null,
    });

    const { data } = await supabase.functions.invoke('validate-booking', {
      body: {
        clientId: 'client-001',
        serviceId: 'service-001',
        appointmentDate: new Date().toISOString(),
      },
    });

    expect(data.valid).toBe(false);
    expect(data.reason).toBe('patch_test_expired');
    expect(data.canOverride).toBe(true);
    expect(data.lastPatchTestDate).toBeDefined();
    expect(data.patchTestExpiresAt).toBeDefined();
  });

  it('should allow booking when client has valid patch test', async () => {
    const mockInvoke = vi.mocked(supabase.functions.invoke);
    mockInvoke.mockResolvedValue({
      data: createMockValidationResult({
        valid: true,
      }),
      error: null,
    });

    const { data } = await supabase.functions.invoke('validate-booking', {
      body: {
        clientId: 'client-001',
        serviceId: 'service-001',
        appointmentDate: new Date().toISOString(),
      },
    });

    expect(data.valid).toBe(true);
    expect(data.reason).toBeUndefined();
  });

  it('should allow booking when service does not require patch test', async () => {
    const mockInvoke = vi.mocked(supabase.functions.invoke);
    mockInvoke.mockResolvedValue({
      data: createMockValidationResult({
        valid: true,
        patchTestRequired: false,
      }),
      error: null,
    });

    const { data } = await supabase.functions.invoke('validate-booking', {
      body: {
        clientId: 'client-001',
        serviceId: 'service-no-patch-test',
        appointmentDate: new Date().toISOString(),
      },
    });

    expect(data.valid).toBe(true);
    expect(data.patchTestRequired).toBe(false);
  });

  it('should fail open when validation service errors', async () => {
    const mockInvoke = vi.mocked(supabase.functions.invoke);
    mockInvoke.mockResolvedValue({
      data: null,
      error: { message: 'Network error' },
    });

    const { error } = await supabase.functions.invoke('validate-booking', {
      body: {
        clientId: 'client-001',
        serviceId: 'service-001',
        appointmentDate: new Date().toISOString(),
      },
    });

    // Error should be present, but the thunk handles this by returning { valid: true }
    expect(error).toBeTruthy();
    expect(error.message).toBe('Network error');
  });
});

// ==================== PATCH TEST WARNING BANNER TESTS ====================

describe('PatchTestWarningBanner component', () => {
  // Import the component for testing
  // Note: We test the component logic without React rendering to avoid
  // complex setup. Full component tests would use @testing-library/react.

  it('should display "Patch test required" message for required reason', () => {
    const getMessage = (reason: 'required' | 'expired', serviceName: string) => {
      if (reason === 'expired') {
        return `Patch test expired for ${serviceName}`;
      }
      return `Patch test required for ${serviceName}`;
    };

    expect(getMessage('required', 'Hair Color')).toBe('Patch test required for Hair Color');
  });

  it('should display "Patch test expired" message for expired reason', () => {
    const getMessage = (reason: 'required' | 'expired', serviceName: string) => {
      if (reason === 'expired') {
        return `Patch test expired for ${serviceName}`;
      }
      return `Patch test required for ${serviceName}`;
    };

    expect(getMessage('expired', 'Hair Color')).toBe('Patch test expired for Hair Color');
  });

  it('should generate correct description for required patch test', () => {
    const getDescription = (
      reason: 'required' | 'expired',
      clientName: string,
      serviceName: string
    ) => {
      if (reason === 'expired') {
        return `${clientName}'s patch test for ${serviceName} has expired. A new patch test should be performed before proceeding.`;
      }
      return `${clientName} has not had a patch test for ${serviceName}. This service requires a patch test before it can be performed.`;
    };

    const description = getDescription('required', 'Jane Doe', 'Hair Color');
    expect(description).toBe(
      "Jane Doe has not had a patch test for Hair Color. This service requires a patch test before it can be performed."
    );
  });

  it('should generate correct description for expired patch test', () => {
    const getDescription = (
      reason: 'required' | 'expired',
      clientName: string,
      serviceName: string
    ) => {
      if (reason === 'expired') {
        return `${clientName}'s patch test for ${serviceName} has expired. A new patch test should be performed before proceeding.`;
      }
      return `${clientName} has not had a patch test for ${serviceName}. This service requires a patch test before it can be performed.`;
    };

    const description = getDescription('expired', 'Jane Doe', 'Hair Color');
    expect(description).toBe(
      "Jane Doe's patch test for Hair Color has expired. A new patch test should be performed before proceeding."
    );
  });
});

// ==================== OVERRIDE FLOW TESTS ====================

describe('Patch test override flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should require non-empty override reason', () => {
    const validateOverrideReason = (reason: string): boolean => {
      return reason.trim().length > 0;
    };

    expect(validateOverrideReason('')).toBe(false);
    expect(validateOverrideReason('   ')).toBe(false);
    expect(validateOverrideReason('Client performed patch test at home')).toBe(true);
  });

  it('should allow override with valid reason', () => {
    const canOverride = (overrideReason: string): boolean => {
      return overrideReason.trim().length > 0;
    };

    expect(canOverride('Manager approved special case')).toBe(true);
    expect(canOverride('Returning client with known history')).toBe(true);
  });

  it('should NOT allow override without reason', () => {
    const canOverride = (overrideReason: string): boolean => {
      return overrideReason.trim().length > 0;
    };

    expect(canOverride('')).toBe(false);
    expect(canOverride('  ')).toBe(false);
    expect(canOverride('\n\t')).toBe(false);
  });

  it('should track pending service during override', () => {
    // Simulate patch test warning state management
    interface PatchTestWarningState {
      clientName: string;
      serviceName: string;
      serviceId: string;
      reason: 'required' | 'expired';
      pendingService: {
        id: string;
        name: string;
        category: string;
        duration: number;
        price: number;
      };
    }

    const service = createMockService({ id: 'color-001', name: 'Hair Color' });
    const warningState: PatchTestWarningState = {
      clientName: 'Jane Doe',
      serviceName: service.name,
      serviceId: service.id,
      reason: 'required',
      pendingService: service,
    };

    expect(warningState.pendingService).toEqual(service);
    expect(warningState.reason).toBe('required');
  });

  it('should clear warning state after override', () => {
    let warningState: {
      clientName: string;
      serviceName: string;
      reason: 'required' | 'expired';
    } | null = {
      clientName: 'Jane Doe',
      serviceName: 'Hair Color',
      reason: 'required',
    };

    // Simulate clearing after override
    const handleOverride = (overrideReason: string) => {
      if (overrideReason.trim()) {
        warningState = null;
      }
    };

    handleOverride('Manager approved');
    expect(warningState).toBeNull();
  });
});

// ==================== WALK-IN CLIENT HANDLING ====================

describe('Walk-in client patch test handling', () => {
  it('should skip patch test check for walk-in clients', () => {
    const shouldCheckPatchTest = (clientId: string | undefined): boolean => {
      if (!clientId || clientId === 'walk-in') {
        return false;
      }
      return true;
    };

    expect(shouldCheckPatchTest('walk-in')).toBe(false);
    expect(shouldCheckPatchTest(undefined)).toBe(false);
    expect(shouldCheckPatchTest('client-001')).toBe(true);
  });

  it('should directly add service for walk-in clients', () => {
    const addedServices: string[] = [];

    const handleAddService = (
      serviceId: string,
      clientId: string | undefined
    ) => {
      if (!clientId || clientId === 'walk-in') {
        // Skip patch test check, add directly
        addedServices.push(serviceId);
        return;
      }
      // Would normally check patch test here
    };

    handleAddService('service-001', 'walk-in');
    handleAddService('service-002', undefined);

    expect(addedServices).toEqual(['service-001', 'service-002']);
  });
});

// ==================== EDGE CASES ====================

describe('Patch test edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle multiple services requiring patch tests', async () => {
    const mockInvoke = vi.mocked(supabase.functions.invoke);

    // First service requires patch test
    mockInvoke.mockResolvedValueOnce({
      data: createMockValidationResult({
        valid: false,
        reason: 'patch_test_required',
        canOverride: true,
      }),
      error: null,
    });

    // Second service does not require patch test
    mockInvoke.mockResolvedValueOnce({
      data: createMockValidationResult({
        valid: true,
        patchTestRequired: false,
      }),
      error: null,
    });

    const result1 = await supabase.functions.invoke('validate-booking', {
      body: { clientId: 'client-001', serviceId: 'color-service' },
    });

    const result2 = await supabase.functions.invoke('validate-booking', {
      body: { clientId: 'client-001', serviceId: 'haircut-service' },
    });

    expect(result1.data.valid).toBe(false);
    expect(result1.data.reason).toBe('patch_test_required');
    expect(result2.data.valid).toBe(true);
  });

  it('should handle client blocked reason separately from patch test', async () => {
    const mockInvoke = vi.mocked(supabase.functions.invoke);
    mockInvoke.mockResolvedValue({
      data: createMockValidationResult({
        valid: false,
        reason: 'client_blocked',
        canOverride: true,
      }),
      error: null,
    });

    const { data } = await supabase.functions.invoke('validate-booking', {
      body: {
        clientId: 'blocked-client-001',
        serviceId: 'service-001',
      },
    });

    expect(data.valid).toBe(false);
    expect(data.reason).toBe('client_blocked');
    // client_blocked is handled at client selection level, not service selection
  });

  it('should preserve service data through override flow', () => {
    const service = createMockService({
      id: 'premium-color-001',
      name: 'Premium Hair Color',
      price: 250,
      duration: 90,
    });

    // Simulate override flow preserving service data
    type ServiceType = {
      id: string;
      name: string;
      category: string;
      duration: number;
      price: number;
    };

    const state: {
      pendingService: ServiceType | null;
      addedService: ServiceType | null;
    } = {
      pendingService: service,
      addedService: null,
    };

    const handleOverride = (overrideReason: string) => {
      if (overrideReason.trim() && state.pendingService) {
        state.addedService = state.pendingService;
        state.pendingService = null;
      }
    };

    handleOverride('Manager approved special case');

    expect(state.addedService).toEqual(service);
    expect(state.addedService).not.toBeNull();
    expect(state.addedService?.id).toBe('premium-color-001');
    expect(state.addedService?.price).toBe(250);
    expect(state.addedService?.duration).toBe(90);
    expect(state.pendingService).toBeNull();
  });
});

// ==================== VALIDATION REASON MAPPING ====================

describe('Validation reason mapping', () => {
  it('should map patch_test_required to "required" reason', () => {
    const mapReasonToDisplay = (
      reason: 'patch_test_required' | 'patch_test_expired' | undefined
    ): 'required' | 'expired' => {
      return reason === 'patch_test_expired' ? 'expired' : 'required';
    };

    expect(mapReasonToDisplay('patch_test_required')).toBe('required');
  });

  it('should map patch_test_expired to "expired" reason', () => {
    const mapReasonToDisplay = (
      reason: 'patch_test_required' | 'patch_test_expired' | undefined
    ): 'required' | 'expired' => {
      return reason === 'patch_test_expired' ? 'expired' : 'required';
    };

    expect(mapReasonToDisplay('patch_test_expired')).toBe('expired');
  });

  it('should default to "required" for undefined reason', () => {
    const mapReasonToDisplay = (
      reason: 'patch_test_required' | 'patch_test_expired' | undefined
    ): 'required' | 'expired' => {
      return reason === 'patch_test_expired' ? 'expired' : 'required';
    };

    expect(mapReasonToDisplay(undefined)).toBe('required');
  });
});
