import { describe, it, expect } from 'vitest';
import * as slices from './index';

describe('slices barrel exports', () => {
  it('should export authReducer', () => {
    expect(slices.authReducer).toBeDefined();
    expect(typeof slices.authReducer).toBe('function');
  });

  it('should export checkinReducer', () => {
    expect(slices.checkinReducer).toBeDefined();
    expect(typeof slices.checkinReducer).toBe('function');
  });

  it('should export clientReducer', () => {
    expect(slices.clientReducer).toBeDefined();
    expect(typeof slices.clientReducer).toBe('function');
  });

  it('should export uiReducer', () => {
    expect(slices.uiReducer).toBeDefined();
    expect(typeof slices.uiReducer).toBe('function');
  });

  it('should export syncReducer', () => {
    expect(slices.syncReducer).toBeDefined();
    expect(typeof slices.syncReducer).toBe('function');
  });

  it('should export servicesReducer', () => {
    expect(slices.servicesReducer).toBeDefined();
    expect(typeof slices.servicesReducer).toBe('function');
  });

  it('should export technicianReducer', () => {
    expect(slices.technicianReducer).toBeDefined();
    expect(typeof slices.technicianReducer).toBe('function');
  });

  it('should export appointmentReducer', () => {
    expect(slices.appointmentReducer).toBeDefined();
    expect(typeof slices.appointmentReducer).toBe('function');
  });

  it('should export adminReducer', () => {
    expect(slices.adminReducer).toBeDefined();
    expect(typeof slices.adminReducer).toBe('function');
  });

  it('should export accessibilityReducer', () => {
    expect(slices.accessibilityReducer).toBeDefined();
    expect(typeof slices.accessibilityReducer).toBe('function');
  });

  it('should export auth actions', () => {
    expect(slices.setStore).toBeDefined();
    expect(slices.setDeviceId).toBeDefined();
    expect(slices.clearAuth).toBeDefined();
  });

  it('should export checkin actions', () => {
    expect(slices.setCurrentClient).toBeDefined();
    expect(slices.addSelectedService).toBeDefined();
    expect(slices.resetCheckin).toBeDefined();
  });

  it('should export accessibility actions', () => {
    expect(slices.toggleLargeTextMode).toBeDefined();
    expect(slices.toggleReducedMotionMode).toBeDefined();
    expect(slices.toggleHighContrastMode).toBeDefined();
    expect(slices.openAccessibilityMenu).toBeDefined();
    expect(slices.closeAccessibilityMenu).toBeDefined();
  });

  it('should export admin actions', () => {
    expect(slices.showPinModal).toBeDefined();
    expect(slices.hidePinModal).toBeDefined();
    expect(slices.activateAdminMode).toBeDefined();
    expect(slices.deactivateAdminMode).toBeDefined();
  });
});
