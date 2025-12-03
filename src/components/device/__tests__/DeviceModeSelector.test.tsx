/**
 * DeviceModeSelector Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeviceModeSelector } from '../DeviceModeSelector';
import type { DevicePolicy } from '@/types/device';

describe('DeviceModeSelector', () => {
  const defaultProps = {
    value: 'online-only' as const,
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render both mode options', () => {
    render(<DeviceModeSelector {...defaultProps} />);

    expect(screen.getByText('Online Only')).toBeInTheDocument();
    expect(screen.getByText('Offline-Enabled')).toBeInTheDocument();
  });

  it('should highlight selected mode', () => {
    render(<DeviceModeSelector {...defaultProps} value="offline-enabled" />);

    // The offline-enabled option should have the selected styling
    const offlineButton = screen.getByText('Offline-Enabled').closest('button');
    expect(offlineButton).toHaveClass('border-orange-500');
  });

  it('should call onChange when clicking a mode', () => {
    const onChange = vi.fn();
    render(<DeviceModeSelector {...defaultProps} onChange={onChange} />);

    fireEvent.click(screen.getByText('Offline-Enabled'));

    expect(onChange).toHaveBeenCalledWith('offline-enabled');
  });

  it('should not call onChange when disabled', () => {
    const onChange = vi.fn();
    render(<DeviceModeSelector {...defaultProps} onChange={onChange} disabled />);

    fireEvent.click(screen.getByText('Offline-Enabled'));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('should show policy warning when offline not allowed', () => {
    const policy: DevicePolicy = {
      defaultMode: 'online-only',
      allowUserOverride: false,
      maxOfflineDevices: 3,
      offlineGraceDays: 14,
    };

    render(<DeviceModeSelector {...defaultProps} policy={policy} />);

    expect(screen.getByText('Offline mode restricted')).toBeInTheDocument();
  });

  it('should show max devices warning when limit reached', () => {
    const policy: DevicePolicy = {
      defaultMode: 'offline-enabled',
      allowUserOverride: true,
      maxOfflineDevices: 2,
      offlineGraceDays: 14,
    };

    render(
      <DeviceModeSelector {...defaultProps} policy={policy} currentOfflineCount={2} />
    );

    expect(screen.getByText('Maximum offline devices reached')).toBeInTheDocument();
  });

  it('should show policy info', () => {
    const policy: DevicePolicy = {
      defaultMode: 'online-only',
      allowUserOverride: true,
      maxOfflineDevices: 5,
      offlineGraceDays: 7,
    };

    render(<DeviceModeSelector {...defaultProps} policy={policy} />);

    expect(screen.getByText(/5 max offline devices/)).toBeInTheDocument();
    expect(screen.getByText(/7 day offline grace period/)).toBeInTheDocument();
  });

  it('should allow offline selection when policy allows override', () => {
    const onChange = vi.fn();
    const policy: DevicePolicy = {
      defaultMode: 'online-only',
      allowUserOverride: true,
      maxOfflineDevices: 5,
      offlineGraceDays: 14,
    };

    render(<DeviceModeSelector {...defaultProps} onChange={onChange} policy={policy} />);

    fireEvent.click(screen.getByText('Offline-Enabled'));

    expect(onChange).toHaveBeenCalledWith('offline-enabled');
  });

  it('should show descriptions when showDescriptions is true', () => {
    render(<DeviceModeSelector {...defaultProps} showDescriptions />);

    // Benefits should be visible
    expect(screen.getByText('Real-time data sync')).toBeInTheDocument();
    expect(screen.getByText('Works without internet')).toBeInTheDocument();
  });
});
