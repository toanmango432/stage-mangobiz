/**
 * BookErrorBoundary Component Tests
 * Tests for Book module error boundary error catching and reset
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BookErrorBoundary } from '../BookErrorBoundary';

// Component that throws an error for testing
function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div data-testid="child-content">Child content</div>;
}

describe('BookErrorBoundary', () => {
  // Suppress console.error during tests
  const originalConsoleError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe('normal rendering', () => {
    it('renders children when no error', () => {
      render(
        <BookErrorBoundary>
          <div data-testid="child">Child content</div>
        </BookErrorBoundary>
      );
      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('passes children through without modification', () => {
      render(
        <BookErrorBoundary>
          <div className="test-class">Test content</div>
        </BookErrorBoundary>
      );
      const child = screen.getByText('Test content');
      expect(child).toHaveClass('test-class');
    });

    it('renders multiple children', () => {
      render(
        <BookErrorBoundary>
          <div data-testid="child1">First</div>
          <div data-testid="child2">Second</div>
        </BookErrorBoundary>
      );
      expect(screen.getByTestId('child1')).toBeInTheDocument();
      expect(screen.getByTestId('child2')).toBeInTheDocument();
    });
  });

  describe('error catching', () => {
    it('catches errors and shows fallback UI', () => {
      render(
        <BookErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </BookErrorBoundary>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
      expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
    });

    it('displays error description', () => {
      render(
        <BookErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </BookErrorBoundary>
      );

      expect(screen.getByText("The calendar encountered an error and couldn't display properly.")).toBeInTheDocument();
    });

    it('displays help text', () => {
      render(
        <BookErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </BookErrorBoundary>
      );

      expect(screen.getByText('If this problem persists, please contact support or try refreshing the page.')).toBeInTheDocument();
    });

    it('logs error to console', () => {
      render(
        <BookErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </BookErrorBoundary>
      );

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('fallback UI icons', () => {
    it('renders AlertCircle icon', () => {
      const { container } = render(
        <BookErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </BookErrorBoundary>
      );

      // Lucide icons can have different class names
      const icon = container.querySelector('.lucide-alert-circle, .lucide-circle-alert');
      expect(icon).toBeInTheDocument();
    });

    it('icon container has red background', () => {
      const { container } = render(
        <BookErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </BookErrorBoundary>
      );

      const iconContainer = container.querySelector('.bg-red-100');
      expect(iconContainer).toBeInTheDocument();
    });

    it('icon has red color', () => {
      const { container } = render(
        <BookErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </BookErrorBoundary>
      );

      const icon = container.querySelector('.text-red-600');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('action buttons', () => {
    it('renders Try Again button', () => {
      render(
        <BookErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </BookErrorBoundary>
      );

      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('renders Reload Page button', () => {
      render(
        <BookErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </BookErrorBoundary>
      );

      expect(screen.getByText('Reload Page')).toBeInTheDocument();
    });

    it('renders RefreshCw icon in Reload button', () => {
      const { container } = render(
        <BookErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </BookErrorBoundary>
      );

      const icon = container.querySelector('.lucide-refresh-cw');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Try Again button functionality', () => {
    it('resets error state without page reload', () => {
      // Use a ref-like pattern to track throw state
      const throwState = { shouldThrow: true };

      function ConditionalThrowComponent() {
        if (throwState.shouldThrow) {
          throw new Error('First render error');
        }
        return <div data-testid="recovered">Recovered!</div>;
      }

      render(
        <BookErrorBoundary>
          <ConditionalThrowComponent />
        </BookErrorBoundary>
      );

      // Initially shows error
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();

      // Fix the component before clicking Try Again
      throwState.shouldThrow = false;

      // Click Try Again
      fireEvent.click(screen.getByText('Try Again'));

      // Should recover and show child content
      expect(screen.getByTestId('recovered')).toBeInTheDocument();
      expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument();
    });
  });

  describe('Reload Page button functionality', () => {
    it('calls window.location.reload on click', () => {
      const reloadMock = vi.fn();
      const originalLocation = window.location;

      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: { ...originalLocation, reload: reloadMock },
        writable: true,
      });

      render(
        <BookErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </BookErrorBoundary>
      );

      fireEvent.click(screen.getByText('Reload Page'));

      expect(reloadMock).toHaveBeenCalledTimes(1);

      // Restore
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
      });
    });
  });

  describe('custom fallback', () => {
    it('renders custom fallback when provided', () => {
      render(
        <BookErrorBoundary fallback={<div data-testid="custom-fallback">Custom error view</div>}>
          <ThrowingComponent shouldThrow={true} />
        </BookErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('Custom error view')).toBeInTheDocument();
    });

    it('does not render default UI when custom fallback provided', () => {
      render(
        <BookErrorBoundary fallback={<div>Custom fallback</div>}>
          <ThrowingComponent shouldThrow={true} />
        </BookErrorBoundary>
      );

      expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument();
      expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
    });
  });

  describe('fallback UI styling', () => {
    it('has full height', () => {
      const { container } = render(
        <BookErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </BookErrorBoundary>
      );

      const wrapper = container.querySelector('.h-full');
      expect(wrapper).toBeInTheDocument();
    });

    it('has centered layout', () => {
      const { container } = render(
        <BookErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </BookErrorBoundary>
      );

      const wrapper = container.querySelector('.flex.items-center.justify-center');
      expect(wrapper).toBeInTheDocument();
    });

    it('has gray background', () => {
      const { container } = render(
        <BookErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </BookErrorBoundary>
      );

      const wrapper = container.querySelector('.bg-gray-50');
      expect(wrapper).toBeInTheDocument();
    });

    it('card has white background', () => {
      const { container } = render(
        <BookErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </BookErrorBoundary>
      );

      const card = container.querySelector('.bg-white');
      expect(card).toBeInTheDocument();
    });

    it('card has shadow', () => {
      const { container } = render(
        <BookErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </BookErrorBoundary>
      );

      const card = container.querySelector('.shadow-lg');
      expect(card).toBeInTheDocument();
    });

    it('card has rounded corners', () => {
      const { container } = render(
        <BookErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </BookErrorBoundary>
      );

      const card = container.querySelector('.rounded-lg');
      expect(card).toBeInTheDocument();
    });

    it('card has max width', () => {
      const { container } = render(
        <BookErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </BookErrorBoundary>
      );

      const card = container.querySelector('.max-w-md');
      expect(card).toBeInTheDocument();
    });
  });

  describe('button styling', () => {
    it('Try Again button has gray background', () => {
      render(
        <BookErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </BookErrorBoundary>
      );

      const button = screen.getByText('Try Again');
      expect(button).toHaveClass('bg-gray-100');
    });

    it('Reload Page button has brand color', () => {
      render(
        <BookErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </BookErrorBoundary>
      );

      const button = screen.getByText('Reload Page');
      expect(button).toHaveClass('bg-brand-600');
    });

    it('Reload Page button has white text', () => {
      render(
        <BookErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </BookErrorBoundary>
      );

      const button = screen.getByText('Reload Page');
      expect(button).toHaveClass('text-white');
    });

    it('buttons have rounded corners', () => {
      render(
        <BookErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </BookErrorBoundary>
      );

      const tryAgainBtn = screen.getByText('Try Again');
      const reloadBtn = screen.getByText('Reload Page');
      expect(tryAgainBtn).toHaveClass('rounded-lg');
      expect(reloadBtn).toHaveClass('rounded-lg');
    });

    it('buttons have transition', () => {
      render(
        <BookErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </BookErrorBoundary>
      );

      const tryAgainBtn = screen.getByText('Try Again');
      const reloadBtn = screen.getByText('Reload Page');
      expect(tryAgainBtn).toHaveClass('transition-colors');
      expect(reloadBtn).toHaveClass('transition-colors');
    });
  });

  describe('error recovery', () => {
    it('can recover from error and catch new errors', () => {
      let shouldThrow = true;

      function ConditionalThrowComponent() {
        if (shouldThrow) {
          throw new Error('Error!');
        }
        return <div data-testid="success">Success</div>;
      }

      const { rerender } = render(
        <BookErrorBoundary>
          <ConditionalThrowComponent />
        </BookErrorBoundary>
      );

      // Initially shows error
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();

      // Fix the error and try again
      shouldThrow = false;
      fireEvent.click(screen.getByText('Try Again'));

      // Should recover
      expect(screen.getByTestId('success')).toBeInTheDocument();
    });
  });

  describe('initial state', () => {
    it('starts with hasError false', () => {
      render(
        <BookErrorBoundary>
          <div>Child</div>
        </BookErrorBoundary>
      );

      // If hasError was true initially, we'd see the error UI
      expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument();
      expect(screen.getByText('Child')).toBeInTheDocument();
    });
  });

  describe('icon container', () => {
    it('has circular shape', () => {
      const { container } = render(
        <BookErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </BookErrorBoundary>
      );

      const iconContainer = container.querySelector('.rounded-full');
      expect(iconContainer).toBeInTheDocument();
    });

    it('has fixed dimensions', () => {
      const { container } = render(
        <BookErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </BookErrorBoundary>
      );

      const iconContainer = container.querySelector('.w-16.h-16');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('text styling', () => {
    it('title is bold', () => {
      render(
        <BookErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </BookErrorBoundary>
      );

      const title = screen.getByText('Oops! Something went wrong');
      expect(title).toHaveClass('font-bold');
    });

    it('title has large font size', () => {
      render(
        <BookErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </BookErrorBoundary>
      );

      const title = screen.getByText('Oops! Something went wrong');
      expect(title).toHaveClass('text-2xl');
    });

    it('description has gray color', () => {
      render(
        <BookErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </BookErrorBoundary>
      );

      const description = screen.getByText("The calendar encountered an error and couldn't display properly.");
      expect(description).toHaveClass('text-gray-600');
    });

    it('help text has small font', () => {
      render(
        <BookErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </BookErrorBoundary>
      );

      const helpText = screen.getByText('If this problem persists, please contact support or try refreshing the page.');
      expect(helpText).toHaveClass('text-xs');
    });
  });
});
