/**
 * useSync Hook Tests
 *
 * Tests for sync hooks including mode-aware functionality.
 * LOCAL-FIRST: All devices are always offline-enabled.
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useModeAwareSync, useCanOperate } from '../useSync';

// Mock react-redux to avoid multiple React instances issue in monorepo
const mockUseSelector = vi.fn();
vi.mock('react-redux', () => ({
  useSelector: (selector: any) => mockUseSelector(selector),
}));

// Mock syncService
vi.mock('@/services/syncService', () => ({
  syncService: {
    getStatus: vi.fn(() => ({ isOnline: true, isSyncing: false })),
    subscribe: vi.fn(() => () => {}),
    syncNow: vi.fn().mockResolvedValue({ success: true, synced: 0 }),
  },
  SyncStatus: {},
}));

// Default mock state
const defaultMockState = {
  isOnline: true,
  isSyncing: false,
  pendingOperations: 0,
  lastSyncAt: null,
  syncEnabled: false,
  syncDisabledReason: null,
  shouldSync: false,
  isOfflineEnabled: true,
  deviceMode: 'offline-enabled',
};

describe('useModeAwareSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default selector mock behavior
    mockUseSelector.mockImplementation((selector: any) => {
      const selectorName = selector.name || selector.toString();
      if (selectorName.includes('selectIsOnline') || selectorName.includes('IsOnline')) {
        return defaultMockState.isOnline;
      }
      if (selectorName.includes('selectIsSyncing') || selectorName.includes('IsSyncing')) {
        return defaultMockState.isSyncing;
      }
      if (selectorName.includes('selectPendingOperations') || selectorName.includes('PendingOperations')) {
        return defaultMockState.pendingOperations;
      }
      if (selectorName.includes('selectLastSyncAt') || selectorName.includes('LastSyncAt')) {
        return defaultMockState.lastSyncAt;
      }
      if (selectorName.includes('selectSyncEnabled') || selectorName.includes('SyncEnabled')) {
        return defaultMockState.syncEnabled;
      }
      if (selectorName.includes('selectSyncDisabledReason') || selectorName.includes('SyncDisabledReason')) {
        return defaultMockState.syncDisabledReason;
      }
      if (selectorName.includes('selectShouldSync') || selectorName.includes('ShouldSync')) {
        return defaultMockState.shouldSync;
      }
      if (selectorName.includes('selectIsOfflineEnabled') || selectorName.includes('IsOfflineEnabled')) {
        return defaultMockState.isOfflineEnabled;
      }
      if (selectorName.includes('selectDeviceMode') || selectorName.includes('DeviceMode')) {
        return defaultMockState.deviceMode;
      }
      return null;
    });
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useModeAwareSync());

    expect(result.current.isOnline).toBe(true);
    expect(result.current.isSyncing).toBe(false);
    expect(result.current.syncEnabled).toBe(false);
    expect(result.current.pendingOperations).toBe(0);
    // LOCAL-FIRST: canWorkOffline is always true
    expect(result.current.canWorkOffline).toBe(true);
  });

  it('should reflect sync enabled state', () => {
    mockUseSelector.mockImplementation((selector: any) => {
      const selectorName = selector.name || selector.toString();
      if (selectorName.includes('SyncEnabled')) return true;
      if (selectorName.includes('SyncDisabledReason')) return null;
      if (selectorName.includes('IsOnline')) return true;
      if (selectorName.includes('IsSyncing')) return false;
      if (selectorName.includes('PendingOperations')) return 0;
      if (selectorName.includes('IsOfflineEnabled')) return true;
      if (selectorName.includes('DeviceMode')) return 'offline-enabled';
      return null;
    });

    const { result } = renderHook(() => useModeAwareSync());

    expect(result.current.syncEnabled).toBe(true);
    expect(result.current.syncDisabledReason).toBeNull();
  });

  it('should reflect sync disabled state with reason', () => {
    mockUseSelector.mockImplementation((selector: any) => {
      const selectorName = selector.name || selector.toString();
      if (selectorName.includes('SyncEnabled')) return false;
      if (selectorName.includes('SyncDisabledReason')) return 'Device revoked';
      if (selectorName.includes('IsOnline')) return true;
      if (selectorName.includes('IsSyncing')) return false;
      if (selectorName.includes('PendingOperations')) return 0;
      if (selectorName.includes('IsOfflineEnabled')) return true;
      if (selectorName.includes('DeviceMode')) return 'offline-enabled';
      return null;
    });

    const { result } = renderHook(() => useModeAwareSync());

    expect(result.current.syncEnabled).toBe(false);
    expect(result.current.syncDisabledReason).toBe('Device revoked');
  });

  it('should reflect offline-enabled device', () => {
    mockUseSelector.mockImplementation((selector: any) => {
      const selectorName = selector.name || selector.toString();
      if (selectorName.includes('SyncEnabled')) return true;
      if (selectorName.includes('IsOnline')) return true;
      if (selectorName.includes('IsSyncing')) return false;
      if (selectorName.includes('PendingOperations')) return 0;
      if (selectorName.includes('IsOfflineEnabled')) return true;
      if (selectorName.includes('DeviceMode')) return 'offline-enabled';
      return null;
    });

    const { result } = renderHook(() => useModeAwareSync());

    // LOCAL-FIRST: isOfflineEnabled always true
    expect(result.current.isOfflineEnabled).toBe(true);
    // LOCAL-FIRST: deviceMode always 'offline-enabled'
    expect(result.current.deviceMode).toBe('offline-enabled');
    // LOCAL-FIRST: canWorkOffline always true
    expect(result.current.canWorkOffline).toBe(true);
  });

  it('should show pending sync status', () => {
    mockUseSelector.mockImplementation((selector: any) => {
      const selectorName = selector.name || selector.toString();
      if (selectorName.includes('PendingOperations')) return 5;
      if (selectorName.includes('IsOnline')) return true;
      if (selectorName.includes('IsSyncing')) return false;
      if (selectorName.includes('SyncEnabled')) return false;
      if (selectorName.includes('IsOfflineEnabled')) return true;
      if (selectorName.includes('DeviceMode')) return 'offline-enabled';
      return null;
    });

    const { result } = renderHook(() => useModeAwareSync());

    expect(result.current.pendingOperations).toBe(5);
    expect(result.current.hasPendingSync).toBe(true);
  });

  describe('statusMessage', () => {
    it('should show all synced message when online with no pending', () => {
      mockUseSelector.mockImplementation((selector: any) => {
        const selectorName = selector.name || selector.toString();
        if (selectorName.includes('IsOnline')) return true;
        if (selectorName.includes('IsSyncing')) return false;
        if (selectorName.includes('PendingOperations')) return 0;
        if (selectorName.includes('SyncEnabled')) return true;
        if (selectorName.includes('IsOfflineEnabled')) return true;
        if (selectorName.includes('DeviceMode')) return 'offline-enabled';
        return null;
      });

      const { result } = renderHook(() => useModeAwareSync());

      expect(result.current.statusMessage).toBe('All changes synced');
    });

    it('should show offline message with pending count', () => {
      mockUseSelector.mockImplementation((selector: any) => {
        const selectorName = selector.name || selector.toString();
        if (selectorName.includes('IsOnline')) return false;
        if (selectorName.includes('IsSyncing')) return false;
        if (selectorName.includes('PendingOperations')) return 3;
        if (selectorName.includes('SyncEnabled')) return true;
        if (selectorName.includes('IsOfflineEnabled')) return true;
        if (selectorName.includes('DeviceMode')) return 'offline-enabled';
        return null;
      });

      const { result } = renderHook(() => useModeAwareSync());

      expect(result.current.statusMessage).toBe('Offline - 3 changes pending');
    });

    it('should show offline message when no pending', () => {
      mockUseSelector.mockImplementation((selector: any) => {
        const selectorName = selector.name || selector.toString();
        if (selectorName.includes('IsOnline')) return false;
        if (selectorName.includes('IsSyncing')) return false;
        if (selectorName.includes('PendingOperations')) return 0;
        if (selectorName.includes('SyncEnabled')) return true;
        if (selectorName.includes('IsOfflineEnabled')) return true;
        if (selectorName.includes('DeviceMode')) return 'offline-enabled';
        return null;
      });

      const { result } = renderHook(() => useModeAwareSync());

      expect(result.current.statusMessage).toBe('Offline - changes will sync when online');
    });

    it('should show pending sync message when online with pending', () => {
      mockUseSelector.mockImplementation((selector: any) => {
        const selectorName = selector.name || selector.toString();
        if (selectorName.includes('IsOnline')) return true;
        if (selectorName.includes('IsSyncing')) return false;
        if (selectorName.includes('PendingOperations')) return 3;
        if (selectorName.includes('SyncEnabled')) return true;
        if (selectorName.includes('IsOfflineEnabled')) return true;
        if (selectorName.includes('DeviceMode')) return 'offline-enabled';
        return null;
      });

      const { result } = renderHook(() => useModeAwareSync());

      expect(result.current.statusMessage).toBe('3 changes pending sync');
    });
  });

  describe('syncNow', () => {
    it('should not sync when disabled', async () => {
      mockUseSelector.mockImplementation((selector: any) => {
        const selectorName = selector.name || selector.toString();
        if (selectorName.includes('SyncEnabled')) return false;
        if (selectorName.includes('SyncDisabledReason')) return 'Test';
        if (selectorName.includes('IsOnline')) return true;
        if (selectorName.includes('IsSyncing')) return false;
        if (selectorName.includes('PendingOperations')) return 0;
        if (selectorName.includes('IsOfflineEnabled')) return true;
        if (selectorName.includes('DeviceMode')) return 'offline-enabled';
        return null;
      });

      const { result } = renderHook(() => useModeAwareSync());

      const response = await result.current.syncNow();
      expect(response.success).toBe(false);
      expect(response.error).toBe('Test');
    });
  });
});

describe('useCanOperate', () => {
  /**
   * LOCAL-FIRST: useCanOperate always returns true
   * All devices can work offline in local-first architecture
   */

  it('should always return canOperate true (local-first)', () => {
    const { result } = renderHook(() => useCanOperate());

    expect(result.current.canOperate).toBe(true);
    expect(result.current.reason).toBeNull();
  });

  it('should return canOperate true regardless of online status', () => {
    // Note: useCanOperate doesn't actually check online status in local-first mode
    // It always returns true
    const { result } = renderHook(() => useCanOperate());

    expect(result.current.canOperate).toBe(true);
    expect(result.current.reason).toBeNull();
  });

  it('should return canOperate true regardless of device mode', () => {
    // Note: useCanOperate doesn't check device mode in local-first mode
    // It always returns true
    const { result } = renderHook(() => useCanOperate());

    expect(result.current.canOperate).toBe(true);
    expect(result.current.reason).toBeNull();
  });
});
