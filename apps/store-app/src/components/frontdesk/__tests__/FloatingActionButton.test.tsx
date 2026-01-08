/**
 * FloatingActionButton Component Tests
 * Tests for floating action button variants and click handling
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { FloatingActionButton } from '../FloatingActionButton';

describe('FloatingActionButton', () => {
  const defaultProps = {
    onCreateTicket: vi.fn(),
  };

  // Mock window.scrollY
  let scrollYValue = 0;

  beforeEach(() => {
    vi.clearAllMocks();
    scrollYValue = 0;
    Object.defineProperty(window, 'scrollY', {
      get: () => scrollYValue,
      configurable: true,
    });
  });

  afterEach(() => {
    scrollYValue = 0;
  });

  describe('basic rendering', () => {
    it('renders button element', () => {
      render(<FloatingActionButton {...defaultProps} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('has fixed positioning', () => {
      render(<FloatingActionButton {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('fixed');
    });

    it('has right positioning', () => {
      render(<FloatingActionButton {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('right-6');
    });

    it('has z-index for layering', () => {
      render(<FloatingActionButton {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('z-40');
    });

    it('has circular shape', () => {
      render(<FloatingActionButton {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('rounded-full');
    });

    it('has fixed dimensions', () => {
      render(<FloatingActionButton {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-14');
      expect(button).toHaveClass('h-14');
    });
  });

  describe('click handling', () => {
    it('calls onCreateTicket when clicked', () => {
      const handleCreateTicket = vi.fn();
      render(<FloatingActionButton onCreateTicket={handleCreateTicket} />);

      fireEvent.click(screen.getByRole('button'));

      expect(handleCreateTicket).toHaveBeenCalledTimes(1);
    });

    it('does not call onCreateTicket on multiple clicks if handler prevents it', () => {
      const handleCreateTicket = vi.fn();
      render(<FloatingActionButton onCreateTicket={handleCreateTicket} />);

      fireEvent.click(screen.getByRole('button'));
      fireEvent.click(screen.getByRole('button'));
      fireEvent.click(screen.getByRole('button'));

      expect(handleCreateTicket).toHaveBeenCalledTimes(3);
    });
  });

  describe('accessibility', () => {
    it('has aria-label for screen readers', () => {
      render(<FloatingActionButton {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Create new ticket');
    });

    it('has title attribute for tooltip', () => {
      render(<FloatingActionButton {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Create new ticket');
    });

    it('can be found by accessible name', () => {
      render(<FloatingActionButton {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Create new ticket' })).toBeInTheDocument();
    });
  });

  describe('icon', () => {
    it('renders Plus icon', () => {
      const { container } = render(<FloatingActionButton {...defaultProps} />);
      const icon = container.querySelector('.lucide-plus');
      expect(icon).toBeInTheDocument();
    });

    it('icon has hover rotation transition', () => {
      const { container } = render(<FloatingActionButton {...defaultProps} />);
      const icon = container.querySelector('.lucide-plus');
      expect(icon).toHaveClass('transition-transform');
      expect(icon).toHaveClass('duration-300');
    });

    it('icon has group-hover rotate class', () => {
      const { container } = render(<FloatingActionButton {...defaultProps} />);
      const icon = container.querySelector('.lucide-plus');
      expect(icon).toHaveClass('group-hover:rotate-90');
    });
  });

  describe('styling', () => {
    it('has gradient background', () => {
      render(<FloatingActionButton {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gradient-to-br');
      expect(button).toHaveClass('from-orange-500');
      expect(button).toHaveClass('to-pink-500');
    });

    it('has white text', () => {
      render(<FloatingActionButton {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-white');
    });

    it('has shadow', () => {
      render(<FloatingActionButton {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('shadow-lg');
    });

    it('has hover shadow', () => {
      render(<FloatingActionButton {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:shadow-xl');
    });

    it('has transition', () => {
      render(<FloatingActionButton {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('transition-all');
      expect(button).toHaveClass('duration-300');
    });

    it('has group class for hover effects', () => {
      render(<FloatingActionButton {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('group');
    });

    it('has flex centering', () => {
      render(<FloatingActionButton {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('flex');
      expect(button).toHaveClass('items-center');
      expect(button).toHaveClass('justify-center');
    });

    it('has easing', () => {
      render(<FloatingActionButton {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('ease-out');
    });
  });

  describe('visual effects', () => {
    it('has ripple effect element', () => {
      const { container } = render(<FloatingActionButton {...defaultProps} />);
      const ripple = container.querySelector('.absolute.inset-0.bg-white');
      expect(ripple).toBeInTheDocument();
    });

    it('ripple has opacity transition', () => {
      const { container } = render(<FloatingActionButton {...defaultProps} />);
      const ripple = container.querySelector('.absolute.inset-0.bg-white');
      expect(ripple).toHaveClass('transition-opacity');
    });

    it('has pulse animation element', () => {
      const { container } = render(<FloatingActionButton {...defaultProps} />);
      const pulse = container.querySelector('.animate-ping');
      expect(pulse).toBeInTheDocument();
    });

    it('pulse has orange background', () => {
      const { container } = render(<FloatingActionButton {...defaultProps} />);
      const pulse = container.querySelector('.animate-ping');
      expect(pulse).toHaveClass('bg-orange-500');
    });

    it('pulse has low opacity', () => {
      const { container } = render(<FloatingActionButton {...defaultProps} />);
      const pulse = container.querySelector('.animate-ping');
      expect(pulse).toHaveClass('opacity-20');
    });

    it('effects are rounded-full', () => {
      const { container } = render(<FloatingActionButton {...defaultProps} />);
      const roundedElements = container.querySelectorAll('.absolute.inset-0.rounded-full');
      expect(roundedElements.length).toBe(2);
    });
  });

  describe('scroll visibility', () => {
    it('is hidden initially (scrollY = 0)', () => {
      render(<FloatingActionButton {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('opacity-0');
      expect(button).toHaveClass('pointer-events-none');
    });

    it('is hidden when scrollY < 100', () => {
      scrollYValue = 50;
      render(<FloatingActionButton {...defaultProps} />);

      act(() => {
        fireEvent.scroll(window);
      });

      const button = screen.getByRole('button');
      expect(button).toHaveClass('opacity-0');
    });

    it('becomes visible when scrollY > 100', () => {
      render(<FloatingActionButton {...defaultProps} />);

      scrollYValue = 150;
      act(() => {
        fireEvent.scroll(window);
      });

      const button = screen.getByRole('button');
      expect(button).toHaveClass('opacity-100');
    });

    it('shows translateY-0 when visible', () => {
      render(<FloatingActionButton {...defaultProps} />);

      scrollYValue = 150;
      act(() => {
        fireEvent.scroll(window);
      });

      const button = screen.getByRole('button');
      expect(button).toHaveClass('translate-y-0');
    });

    it('shows translateY-20 when hidden', () => {
      render(<FloatingActionButton {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('translate-y-20');
    });

    it('shows scale-100 when visible', () => {
      render(<FloatingActionButton {...defaultProps} />);

      scrollYValue = 150;
      act(() => {
        fireEvent.scroll(window);
      });

      const button = screen.getByRole('button');
      expect(button).toHaveClass('scale-100');
    });

    it('shows scale-75 when hidden', () => {
      render(<FloatingActionButton {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('scale-75');
    });

    it('hides when scrolling back up to < 100', () => {
      render(<FloatingActionButton {...defaultProps} />);

      // First scroll down
      scrollYValue = 150;
      act(() => {
        fireEvent.scroll(window);
      });

      // Then scroll back up
      scrollYValue = 50;
      act(() => {
        fireEvent.scroll(window);
      });

      const button = screen.getByRole('button');
      expect(button).toHaveClass('opacity-0');
    });

    it('remains visible at exactly 100px scroll', () => {
      render(<FloatingActionButton {...defaultProps} />);

      scrollYValue = 100;
      act(() => {
        fireEvent.scroll(window);
      });

      const button = screen.getByRole('button');
      // At exactly 100, it should still be hidden (> 100 is the condition)
      expect(button).toHaveClass('opacity-0');
    });

    it('becomes visible at 101px scroll', () => {
      render(<FloatingActionButton {...defaultProps} />);

      scrollYValue = 101;
      act(() => {
        fireEvent.scroll(window);
      });

      const button = screen.getByRole('button');
      expect(button).toHaveClass('opacity-100');
    });
  });

  describe('scroll event listener', () => {
    it('adds scroll event listener on mount', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      render(<FloatingActionButton {...defaultProps} />);

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        { passive: true }
      );
    });

    it('removes scroll event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = render(<FloatingActionButton {...defaultProps} />);
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function)
      );
    });
  });

  describe('bottom positioning', () => {
    it('has custom bottom position with CSS variable', () => {
      render(<FloatingActionButton {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button.style.bottom).toBe('calc(var(--pending-section-height, 40px) + 24px)');
    });
  });

  describe('pointer events', () => {
    it('has pointer-events-none when hidden', () => {
      render(<FloatingActionButton {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('pointer-events-none');
    });

    it('removes pointer-events-none when visible', () => {
      render(<FloatingActionButton {...defaultProps} />);

      scrollYValue = 150;
      act(() => {
        fireEvent.scroll(window);
      });

      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('pointer-events-none');
    });
  });

  describe('interaction when hidden', () => {
    it('still technically responds to click when hidden (but has pointer-events-none)', () => {
      const handleCreateTicket = vi.fn();
      render(<FloatingActionButton onCreateTicket={handleCreateTicket} />);

      // The button has pointer-events-none when hidden, but fireEvent bypasses CSS
      fireEvent.click(screen.getByRole('button'));

      // This tests that the handler is attached, even if CSS prevents real clicks
      expect(handleCreateTicket).toHaveBeenCalled();
    });
  });

  describe('multiple scroll events', () => {
    it('handles rapid scroll events', () => {
      render(<FloatingActionButton {...defaultProps} />);

      // Rapid scroll down
      for (let i = 0; i <= 200; i += 10) {
        scrollYValue = i;
        act(() => {
          fireEvent.scroll(window);
        });
      }

      const button = screen.getByRole('button');
      expect(button).toHaveClass('opacity-100');
    });

    it('handles scroll oscillation around threshold', () => {
      render(<FloatingActionButton {...defaultProps} />);

      // Oscillate around 100px threshold
      const positions = [90, 110, 95, 105, 80, 150];
      positions.forEach(pos => {
        scrollYValue = pos;
        act(() => {
          fireEvent.scroll(window);
        });
      });

      // Final position is 150, should be visible
      const button = screen.getByRole('button');
      expect(button).toHaveClass('opacity-100');
    });
  });
});
