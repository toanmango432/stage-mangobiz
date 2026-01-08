/**
 * TimeSlot Component Tests
 * Tests for calendar time slot rendering
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TimeSlot } from '../TimeSlot';

describe('TimeSlot', () => {
  const defaultProps = {
    time: '9:00 AM',
    timeInSeconds: 32400, // 9:00 AM in seconds
  };

  describe('basic rendering', () => {
    it('renders with correct data attributes', () => {
      const { container } = render(<TimeSlot {...defaultProps} />);
      const slot = container.firstChild as HTMLElement;

      expect(slot).toHaveAttribute('data-time', '9:00 AM');
      expect(slot).toHaveAttribute('data-time-seconds', '32400');
    });

    it('renders with border styling', () => {
      const { container } = render(<TimeSlot {...defaultProps} />);
      const slot = container.firstChild as HTMLElement;

      expect(slot).toHaveClass('border-b');
      expect(slot).toHaveClass('border-gray-200');
    });
  });

  describe('time label display', () => {
    it('shows time label for hour marks (AM)', () => {
      render(<TimeSlot time="9:00 AM" timeInSeconds={32400} />);
      expect(screen.getByText('9:00 AM')).toBeInTheDocument();
    });

    it('shows time label for hour marks (PM)', () => {
      render(<TimeSlot time="2:00 PM" timeInSeconds={50400} />);
      expect(screen.getByText('2:00 PM')).toBeInTheDocument();
    });

    it('does not show time label for non-hour marks', () => {
      render(<TimeSlot time="9:15 AM" timeInSeconds={33300} />);
      expect(screen.queryByText('9:15 AM')).not.toBeInTheDocument();
    });

    it('does not show time label for 30-minute marks', () => {
      render(<TimeSlot time="9:30 AM" timeInSeconds={34200} />);
      expect(screen.queryByText('9:30 AM')).not.toBeInTheDocument();
    });

    it('does not show time label for 45-minute marks', () => {
      render(<TimeSlot time="9:45 AM" timeInSeconds={35100} />);
      expect(screen.queryByText('9:45 AM')).not.toBeInTheDocument();
    });
  });

  describe('current time indicator', () => {
    it('does not show current time indicator by default', () => {
      const { container } = render(<TimeSlot {...defaultProps} />);
      const slot = container.firstChild as HTMLElement;

      expect(slot).not.toHaveClass('bg-blue-50');
      expect(container.querySelector('.bg-blue-500')).not.toBeInTheDocument();
    });

    it('shows current time indicator when isCurrentTime is true', () => {
      const { container } = render(<TimeSlot {...defaultProps} isCurrentTime={true} />);
      const slot = container.firstChild as HTMLElement;

      expect(slot).toHaveClass('bg-blue-50');
    });

    it('renders blue indicator line when isCurrentTime is true', () => {
      const { container } = render(<TimeSlot {...defaultProps} isCurrentTime={true} />);

      const indicator = container.querySelector('.bg-blue-500');
      expect(indicator).toBeInTheDocument();
    });

    it('renders indicator dot when isCurrentTime is true', () => {
      const { container } = render(<TimeSlot {...defaultProps} isCurrentTime={true} />);

      const dot = container.querySelector('.rounded-full.bg-blue-500');
      expect(dot).toBeInTheDocument();
    });
  });

  describe('blocked state', () => {
    it('does not show blocked styling by default', () => {
      const { container } = render(<TimeSlot {...defaultProps} />);
      const slot = container.firstChild as HTMLElement;

      expect(slot).not.toHaveClass('bg-gray-100');
      expect(slot).not.toHaveClass('opacity-50');
    });

    it('shows blocked styling when isBlocked is true', () => {
      const { container } = render(<TimeSlot {...defaultProps} isBlocked={true} />);
      const slot = container.firstChild as HTMLElement;

      expect(slot).toHaveClass('bg-gray-100');
      expect(slot).toHaveClass('opacity-50');
    });
  });

  describe('custom className', () => {
    it('applies custom className', () => {
      const { container } = render(
        <TimeSlot {...defaultProps} className="custom-slot-class" />
      );
      const slot = container.firstChild as HTMLElement;

      expect(slot).toHaveClass('custom-slot-class');
    });
  });

  describe('style', () => {
    it('applies height based on PIXELS_PER_15_MINUTES constant', () => {
      const { container } = render(<TimeSlot {...defaultProps} />);
      const slot = container.firstChild as HTMLElement;

      // Should have inline style with height (22px based on PIXELS_PER_15_MINUTES constant)
      expect(slot.style.height).toBeTruthy();
      expect(slot.style.height).toMatch(/^\d+px$/);
    });
  });
});
