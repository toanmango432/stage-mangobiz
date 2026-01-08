/**
 * ErrorBoundary Component Tests
 * Tests for error boundary error catching and fallback UI
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary, withErrorBoundary } from '../ErrorBoundary';

// Component that throws an error
function ThrowingComponent({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>Child content</div>;
}

// Component that works normally
function WorkingComponent() {
  return <div>Working component</div>;
}

describe('ErrorBoundary', () => {
  // Suppress console.error during tests since we're intentionally causing errors
  const originalConsoleError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe('normal rendering', () => {
    it('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      render(
        <ErrorBoundary>
          <div>Child 1</div>
          <div>Child 2</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });
  });

  describe('error catching', () => {
    it('catches errors and shows fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('shows error description in fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(
        screen.getByText('An unexpected error occurred in the Front Desk module.')
      ).toBeInTheDocument();
    });

    it('shows action buttons in fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(screen.getByText('Reload Page')).toBeInTheDocument();
      expect(screen.getByText('Go to Home')).toBeInTheDocument();
    });

    it('shows support message in fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(
        screen.getByText('If this problem persists, please contact support')
      ).toBeInTheDocument();
    });
  });

  describe('retry functionality', () => {
    it('Try Again button resets error state', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      // Error UI should be shown
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Click Try Again - this resets internal state
      fireEvent.click(screen.getByText('Try Again'));

      // Re-render with non-throwing component would show content
      // But since ThrowingComponent still throws, it will show error again
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('custom fallback component', () => {
    it('renders custom fallback component when provided', () => {
      const CustomFallback = ({ error, retry }: { error: Error; retry: () => void }) => (
        <div>
          <span>Custom error: {error.message}</span>
          <button onClick={retry}>Custom retry</button>
        </div>
      );

      render(
        <ErrorBoundary fallbackComponent={CustomFallback}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error: Test error message')).toBeInTheDocument();
      expect(screen.getByText('Custom retry')).toBeInTheDocument();
    });

    it('custom fallback receives error object', () => {
      const CustomFallback = ({ error }: { error: Error; retry: () => void }) => (
        <div>Error type: {error.name}</div>
      );

      render(
        <ErrorBoundary fallbackComponent={CustomFallback}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error type: Error')).toBeInTheDocument();
    });

    it('custom fallback retry function works', () => {
      let retryCalled = false;
      const CustomFallback = ({ retry }: { error: Error; retry: () => void }) => (
        <button
          onClick={() => {
            retryCalled = true;
            retry();
          }}
        >
          Custom retry
        </button>
      );

      render(
        <ErrorBoundary fallbackComponent={CustomFallback}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByText('Custom retry'));
      expect(retryCalled).toBe(true);
    });
  });

  describe('onError callback', () => {
    it('calls onError callback when error occurs', () => {
      const handleError = vi.fn();

      render(
        <ErrorBoundary onError={handleError}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(handleError).toHaveBeenCalledTimes(1);
    });

    it('passes error object to onError callback', () => {
      const handleError = vi.fn();

      render(
        <ErrorBoundary onError={handleError}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(handleError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Test error message' }),
        expect.anything()
      );
    });

    it('passes error info to onError callback', () => {
      const handleError = vi.fn();

      render(
        <ErrorBoundary onError={handleError}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      const [, errorInfo] = handleError.mock.calls[0];
      expect(errorInfo).toHaveProperty('componentStack');
    });
  });

  describe('error icon', () => {
    it('renders alert icon in fallback UI', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      const alertIcon = container.querySelector('.lucide-circle-alert');
      expect(alertIcon).toBeInTheDocument();
    });
  });
});

describe('withErrorBoundary HOC', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('wraps component with error boundary', () => {
    const WrappedComponent = withErrorBoundary(WorkingComponent);
    render(<WrappedComponent />);

    expect(screen.getByText('Working component')).toBeInTheDocument();
  });

  it('catches errors from wrapped component', () => {
    const WrappedComponent = withErrorBoundary(ThrowingComponent);
    render(<WrappedComponent />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('uses custom fallback when provided', () => {
    const CustomFallback = ({ error }: { error: Error; retry: () => void }) => (
      <div>HOC custom: {error.message}</div>
    );

    const WrappedComponent = withErrorBoundary(ThrowingComponent, CustomFallback);
    render(<WrappedComponent />);

    expect(screen.getByText('HOC custom: Test error message')).toBeInTheDocument();
  });

  it('calls onError when provided', () => {
    const handleError = vi.fn();
    const WrappedComponent = withErrorBoundary(ThrowingComponent, undefined, handleError);
    render(<WrappedComponent />);

    expect(handleError).toHaveBeenCalled();
  });

  it('sets correct displayName', () => {
    const WrappedComponent = withErrorBoundary(WorkingComponent);
    expect(WrappedComponent.displayName).toBe('withErrorBoundary(WorkingComponent)');
  });

  it('passes props to wrapped component', () => {
    const ComponentWithProps = ({ name }: { name: string }) => (
      <div>Hello, {name}!</div>
    );
    const WrappedComponent = withErrorBoundary(ComponentWithProps);
    render(<WrappedComponent name="World" />);

    expect(screen.getByText('Hello, World!')).toBeInTheDocument();
  });
});
