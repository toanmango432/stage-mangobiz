/**
 * StatusBadge Component Tests
 * Tests for appointment status badge rendering
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge, StatusIndicator, type AppointmentStatus } from '../StatusBadge';

describe('StatusBadge', () => {
  const statuses: AppointmentStatus[] = [
    'confirmed',
    'pending',
    'cancelled',
    'completed',
    'checked-in',
    'no-show',
    'walkin',
  ];

  describe('renders correct label for each status', () => {
    it.each([
      ['confirmed', 'Confirmed'],
      ['pending', 'Pending'],
      ['cancelled', 'Cancelled'],
      ['completed', 'Completed'],
      ['checked-in', 'Checked In'],
      ['no-show', 'No Show'],
      ['walkin', 'Walk-in'],
    ])('renders "%s" status with label "%s"', (status, expectedLabel) => {
      render(<StatusBadge status={status as AppointmentStatus} />);
      expect(screen.getByText(expectedLabel)).toBeInTheDocument();
    });
  });

  describe('renders correct CSS classes for each status', () => {
    it('renders confirmed with green classes', () => {
      const { container } = render(<StatusBadge status="confirmed" />);
      const badge = container.querySelector('.status-badge');
      expect(badge).toHaveClass('status-confirmed');
      expect(badge).toHaveClass('bg-green-100');
      expect(badge).toHaveClass('text-green-800');
    });

    it('renders pending with yellow classes', () => {
      const { container } = render(<StatusBadge status="pending" />);
      const badge = container.querySelector('.status-badge');
      expect(badge).toHaveClass('status-pending');
      expect(badge).toHaveClass('bg-yellow-100');
    });

    it('renders cancelled with red classes', () => {
      const { container } = render(<StatusBadge status="cancelled" />);
      const badge = container.querySelector('.status-badge');
      expect(badge).toHaveClass('status-cancelled');
      expect(badge).toHaveClass('bg-red-100');
    });

    it('renders checked-in with blue classes', () => {
      const { container } = render(<StatusBadge status="checked-in" />);
      const badge = container.querySelector('.status-badge');
      expect(badge).toHaveClass('status-checked-in');
      expect(badge).toHaveClass('bg-blue-100');
    });
  });

  describe('size prop', () => {
    it('renders small size with correct classes', () => {
      const { container } = render(<StatusBadge status="confirmed" size="sm" />);
      const badge = container.querySelector('.status-badge');
      expect(badge).toHaveClass('px-1.5');
      expect(badge).toHaveClass('py-0.5');
    });

    it('renders medium size by default', () => {
      const { container } = render(<StatusBadge status="confirmed" />);
      const badge = container.querySelector('.status-badge');
      expect(badge).toHaveClass('px-2');
      expect(badge).toHaveClass('py-1');
    });

    it('renders large size with correct classes', () => {
      const { container } = render(<StatusBadge status="confirmed" size="lg" />);
      const badge = container.querySelector('.status-badge');
      expect(badge).toHaveClass('px-3');
      expect(badge).toHaveClass('py-1.5');
    });
  });

  describe('showIcon prop', () => {
    it('shows icon by default', () => {
      const { container } = render(<StatusBadge status="confirmed" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('hides icon when showIcon is false', () => {
      const { container } = render(<StatusBadge status="confirmed" showIcon={false} />);
      const svg = container.querySelector('svg');
      expect(svg).not.toBeInTheDocument();
    });
  });

  describe('showDot prop', () => {
    it('does not show dot by default', () => {
      const { container } = render(<StatusBadge status="confirmed" />);
      const dot = container.querySelector('.w-1\\.5.h-1\\.5.rounded-full');
      expect(dot).not.toBeInTheDocument();
    });

    it('shows dot when showDot is true and hides icon', () => {
      const { container } = render(<StatusBadge status="confirmed" showDot={true} />);
      const dot = container.querySelector('.w-1\\.5');
      expect(dot).toBeInTheDocument();
      // Icon should be hidden when dot is shown
      const svg = container.querySelector('svg');
      expect(svg).not.toBeInTheDocument();
    });
  });

  describe('title attribute', () => {
    it.each([
      ['confirmed', 'Appointment confirmed'],
      ['pending', 'Awaiting confirmation'],
      ['checked-in', 'Client has arrived'],
      ['completed', 'Service completed'],
      ['cancelled', 'Appointment cancelled'],
      ['no-show', 'Client did not show up'],
      ['walkin', 'Walk-in client'],
    ])('renders "%s" status with title "%s"', (status, expectedTitle) => {
      render(<StatusBadge status={status as AppointmentStatus} />);
      const badge = screen.getByTitle(expectedTitle);
      expect(badge).toBeInTheDocument();
    });
  });

  describe('custom className', () => {
    it('applies custom className', () => {
      const { container } = render(
        <StatusBadge status="confirmed" className="custom-class" />
      );
      const badge = container.querySelector('.status-badge');
      expect(badge).toHaveClass('custom-class');
    });
  });
});

describe('StatusIndicator', () => {
  it('returns correct border color for confirmed', () => {
    const result = StatusIndicator({ status: 'confirmed' });
    expect(result).toBe('border-green-400');
  });

  it('returns correct border color for pending', () => {
    const result = StatusIndicator({ status: 'pending' });
    expect(result).toBe('border-amber-400');
  });

  it('returns correct border color for checked-in', () => {
    const result = StatusIndicator({ status: 'checked-in' });
    expect(result).toBe('border-blue-500');
  });

  it('returns correct border color for completed', () => {
    const result = StatusIndicator({ status: 'completed' });
    expect(result).toBe('border-gray-400');
  });

  it('returns correct border color for cancelled', () => {
    const result = StatusIndicator({ status: 'cancelled' });
    expect(result).toBe('border-red-400');
  });

  it('returns correct border color for no-show', () => {
    const result = StatusIndicator({ status: 'no-show' });
    expect(result).toBe('border-red-500');
  });

  it('returns correct border color for walkin', () => {
    const result = StatusIndicator({ status: 'walkin' });
    expect(result).toBe('border-blue-500');
  });
});
