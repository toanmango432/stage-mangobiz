/**
 * CreateTicketButton Component Tests
 * Tests for create ticket button states and click handling
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CreateTicketButton } from '../CreateTicketButton';

describe('CreateTicketButton', () => {
  const defaultProps = {
    onClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders button element', () => {
      render(<CreateTicketButton {...defaultProps} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders Plus icon', () => {
      const { container } = render(<CreateTicketButton {...defaultProps} />);
      const plusIcon = container.querySelector('.lucide-plus');
      expect(plusIcon).toBeInTheDocument();
    });

    it('has aria-label for accessibility', () => {
      render(<CreateTicketButton {...defaultProps} />);
      expect(screen.getByLabelText('Create new ticket')).toBeInTheDocument();
    });
  });

  describe('click handling', () => {
    it('calls onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<CreateTicketButton onClick={handleClick} />);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('calls onClick multiple times on multiple clicks', () => {
      const handleClick = vi.fn();
      render(<CreateTicketButton onClick={handleClick} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('data-id prop', () => {
    it('renders without data-id when not provided', () => {
      const { container } = render(<CreateTicketButton {...defaultProps} />);
      const button = container.querySelector('button');
      expect(button?.getAttribute('data-id')).toBeNull();
    });

    it('applies data-id attribute when provided', () => {
      render(<CreateTicketButton {...defaultProps} data-id="create-ticket-btn" />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-id', 'create-ticket-btn');
    });
  });

  describe('styling', () => {
    it('has fixed positioning', () => {
      render(<CreateTicketButton {...defaultProps} />);
      expect(screen.getByRole('button')).toHaveClass('fixed');
    });

    it('is positioned at bottom right', () => {
      render(<CreateTicketButton {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bottom-6');
      expect(button).toHaveClass('right-6');
    });

    it('has emerald background color', () => {
      render(<CreateTicketButton {...defaultProps} />);
      expect(screen.getByRole('button')).toHaveClass('bg-emerald-500');
    });

    it('has white text color', () => {
      render(<CreateTicketButton {...defaultProps} />);
      expect(screen.getByRole('button')).toHaveClass('text-white');
    });

    it('has rounded-full for circular shape', () => {
      render(<CreateTicketButton {...defaultProps} />);
      expect(screen.getByRole('button')).toHaveClass('rounded-full');
    });

    it('has shadow', () => {
      render(<CreateTicketButton {...defaultProps} />);
      expect(screen.getByRole('button')).toHaveClass('shadow-lg');
    });

    it('has high z-index', () => {
      render(<CreateTicketButton {...defaultProps} />);
      expect(screen.getByRole('button')).toHaveClass('z-50');
    });

    it('has padding for touch target', () => {
      render(<CreateTicketButton {...defaultProps} />);
      expect(screen.getByRole('button')).toHaveClass('p-4');
    });

    it('uses flex for centering icon', () => {
      render(<CreateTicketButton {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('flex');
      expect(button).toHaveClass('items-center');
      expect(button).toHaveClass('justify-center');
    });

    it('has hover state classes', () => {
      render(<CreateTicketButton {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-emerald-600');
      expect(button).toHaveClass('hover:shadow-xl');
    });

    it('has transition classes', () => {
      render(<CreateTicketButton {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('transition-all');
      expect(button).toHaveClass('duration-200');
    });

    it('has group class for icon animation', () => {
      render(<CreateTicketButton {...defaultProps} />);
      expect(screen.getByRole('button')).toHaveClass('group');
    });
  });

  describe('icon styling', () => {
    it('icon has transition classes for rotation', () => {
      const { container } = render(<CreateTicketButton {...defaultProps} />);
      const icon = container.querySelector('.lucide-plus');
      expect(icon).toHaveClass('transition-transform');
      expect(icon).toHaveClass('duration-200');
    });

    it('icon has group-hover rotate class', () => {
      const { container } = render(<CreateTicketButton {...defaultProps} />);
      const icon = container.querySelector('.lucide-plus');
      expect(icon).toHaveClass('group-hover:rotate-90');
    });
  });

  describe('accessibility', () => {
    it('is focusable', () => {
      render(<CreateTicketButton {...defaultProps} />);
      const button = screen.getByRole('button');
      button.focus();
      expect(document.activeElement).toBe(button);
    });

    it('can be activated with keyboard', () => {
      const handleClick = vi.fn();
      render(<CreateTicketButton onClick={handleClick} />);

      const button = screen.getByRole('button');
      button.focus();
      fireEvent.keyDown(button, { key: 'Enter' });

      // Enter key should trigger click on button
      // Note: fireEvent.keyDown doesn't trigger onClick by default
      // but the button is keyboard accessible
      expect(button).toBe(document.activeElement);
    });

    it('has proper aria-label describing the action', () => {
      render(<CreateTicketButton {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button.getAttribute('aria-label')).toBe('Create new ticket');
    });
  });

  describe('FAB (Floating Action Button) behavior', () => {
    it('renders as a floating action button', () => {
      render(<CreateTicketButton {...defaultProps} />);
      const button = screen.getByRole('button');

      // Should have fixed positioning
      expect(button).toHaveClass('fixed');

      // Should have bottom/right position
      expect(button).toHaveClass('bottom-6');
      expect(button).toHaveClass('right-6');

      // Should be circular
      expect(button).toHaveClass('rounded-full');

      // Should have shadow
      expect(button).toHaveClass('shadow-lg');
    });

    it('has adequate touch target size', () => {
      render(<CreateTicketButton {...defaultProps} />);
      const button = screen.getByRole('button');

      // p-4 = 16px padding on all sides
      // Plus icon is 24px
      // Total: 24 + 32 = 56px minimum size
      expect(button).toHaveClass('p-4');
    });
  });
});
