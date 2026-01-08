/**
 * SectionErrorBoundary Component Tests
 * Tests for section-level error boundary with fallback UI
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  SectionErrorBoundary,
  TeamSectionErrorBoundary,
  WaitListErrorBoundary,
  ServiceSectionErrorBoundary,
  ComingAppointmentsErrorBoundary,
  SettingsErrorBoundary,
} from '../SectionErrorBoundary';

// Component that throws an error
const ThrowError = ({ error }: { error: Error }) => {
  throw error;
};

// Component that renders normally
const GoodComponent = () => <div data-testid="good-component">Working content</div>;

// Suppress console.error during error boundary tests
let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleError.mockRestore();
});

describe('SectionErrorBoundary', () => {
  describe('normal rendering', () => {
    it('renders children when no error', () => {
      render(
        <SectionErrorBoundary>
          <GoodComponent />
        </SectionErrorBoundary>
      );
      expect(screen.getByTestId('good-component')).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      render(
        <SectionErrorBoundary>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </SectionErrorBoundary>
      );
      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });
  });

  describe('error catching', () => {
    it('catches errors and shows fallback', () => {
      render(
        <SectionErrorBoundary sectionName="Test Section">
          <ThrowError error={new Error('Test error')} />
        </SectionErrorBoundary>
      );
      expect(screen.getByText('Test Section encountered an error')).toBeInTheDocument();
    });

    it('displays error message', () => {
      render(
        <SectionErrorBoundary>
          <ThrowError error={new Error('Something went wrong')} />
        </SectionErrorBoundary>
      );
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('shows default message for errors without message', () => {
      render(
        <SectionErrorBoundary>
          <ThrowError error={new Error()} />
        </SectionErrorBoundary>
      );
      expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
    });

    it('calls onError callback when error occurs', () => {
      const onError = vi.fn();
      render(
        <SectionErrorBoundary onError={onError}>
          <ThrowError error={new Error('Test')} />
        </SectionErrorBoundary>
      );
      expect(onError).toHaveBeenCalled();
      expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    });
  });

  describe('section name', () => {
    it('uses default section name', () => {
      render(
        <SectionErrorBoundary>
          <ThrowError error={new Error('Error')} />
        </SectionErrorBoundary>
      );
      expect(screen.getByText('This section encountered an error')).toBeInTheDocument();
    });

    it('uses custom section name', () => {
      render(
        <SectionErrorBoundary sectionName="Custom Section">
          <ThrowError error={new Error('Error')} />
        </SectionErrorBoundary>
      );
      expect(screen.getByText('Custom Section encountered an error')).toBeInTheDocument();
    });
  });

  describe('retry functionality', () => {
    it('renders retry button', () => {
      render(
        <SectionErrorBoundary>
          <ThrowError error={new Error('Error')} />
        </SectionErrorBoundary>
      );
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('retry button has RefreshCw icon', () => {
      const { container } = render(
        <SectionErrorBoundary>
          <ThrowError error={new Error('Error')} />
        </SectionErrorBoundary>
      );
      const icon = container.querySelector('.lucide-refresh-cw');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('custom fallback', () => {
    it('uses custom fallback component', () => {
      const CustomFallback = ({ error }: { error: Error }) => (
        <div data-testid="custom-fallback">Custom error: {error.message}</div>
      );

      render(
        <SectionErrorBoundary fallback={CustomFallback}>
          <ThrowError error={new Error('Custom test')} />
        </SectionErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('Custom error: Custom test')).toBeInTheDocument();
    });
  });

  describe('fallback UI styling', () => {
    it('has error background color', () => {
      const { container } = render(
        <SectionErrorBoundary>
          <ThrowError error={new Error('Error')} />
        </SectionErrorBoundary>
      );
      const fallback = container.querySelector('.bg-red-50');
      expect(fallback).toBeInTheDocument();
    });

    it('has error border', () => {
      const { container } = render(
        <SectionErrorBoundary>
          <ThrowError error={new Error('Error')} />
        </SectionErrorBoundary>
      );
      const fallback = container.querySelector('.border-red-200');
      expect(fallback).toBeInTheDocument();
    });

    it('has rounded corners', () => {
      const { container } = render(
        <SectionErrorBoundary>
          <ThrowError error={new Error('Error')} />
        </SectionErrorBoundary>
      );
      const fallback = container.querySelector('.rounded-lg');
      expect(fallback).toBeInTheDocument();
    });

    it('has AlertTriangle icon', () => {
      const { container } = render(
        <SectionErrorBoundary>
          <ThrowError error={new Error('Error')} />
        </SectionErrorBoundary>
      );
      // Lucide icons have data-lucide attribute or SVG element
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('icon has error color', () => {
      const { container } = render(
        <SectionErrorBoundary>
          <ThrowError error={new Error('Error')} />
        </SectionErrorBoundary>
      );
      // Find the SVG icon and check its parent/itself has the color class
      const icon = container.querySelector('svg.text-red-600');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('retry button styling', () => {
    it('has error styling', () => {
      const { container } = render(
        <SectionErrorBoundary>
          <ThrowError error={new Error('Error')} />
        </SectionErrorBoundary>
      );
      const button = container.querySelector('button');
      expect(button).toHaveClass('text-red-700');
      expect(button).toHaveClass('bg-red-100');
    });

    it('has hover state', () => {
      const { container } = render(
        <SectionErrorBoundary>
          <ThrowError error={new Error('Error')} />
        </SectionErrorBoundary>
      );
      const button = container.querySelector('button');
      expect(button).toHaveClass('hover:bg-red-200');
    });
  });
});

describe('Pre-configured Error Boundaries', () => {
  describe('TeamSectionErrorBoundary', () => {
    it('renders children normally', () => {
      render(
        <TeamSectionErrorBoundary>
          <GoodComponent />
        </TeamSectionErrorBoundary>
      );
      expect(screen.getByTestId('good-component')).toBeInTheDocument();
    });

    it('shows Team Section error message', () => {
      render(
        <TeamSectionErrorBoundary>
          <ThrowError error={new Error('Error')} />
        </TeamSectionErrorBoundary>
      );
      expect(screen.getByText('Team Section encountered an error')).toBeInTheDocument();
    });
  });

  describe('WaitListErrorBoundary', () => {
    it('renders children normally', () => {
      render(
        <WaitListErrorBoundary>
          <GoodComponent />
        </WaitListErrorBoundary>
      );
      expect(screen.getByTestId('good-component')).toBeInTheDocument();
    });

    it('shows Wait List error message', () => {
      render(
        <WaitListErrorBoundary>
          <ThrowError error={new Error('Error')} />
        </WaitListErrorBoundary>
      );
      expect(screen.getByText('Wait List encountered an error')).toBeInTheDocument();
    });
  });

  describe('ServiceSectionErrorBoundary', () => {
    it('renders children normally', () => {
      render(
        <ServiceSectionErrorBoundary>
          <GoodComponent />
        </ServiceSectionErrorBoundary>
      );
      expect(screen.getByTestId('good-component')).toBeInTheDocument();
    });

    it('shows Service Section error message', () => {
      render(
        <ServiceSectionErrorBoundary>
          <ThrowError error={new Error('Error')} />
        </ServiceSectionErrorBoundary>
      );
      expect(screen.getByText('Service Section encountered an error')).toBeInTheDocument();
    });
  });

  describe('ComingAppointmentsErrorBoundary', () => {
    it('renders children normally', () => {
      render(
        <ComingAppointmentsErrorBoundary>
          <GoodComponent />
        </ComingAppointmentsErrorBoundary>
      );
      expect(screen.getByTestId('good-component')).toBeInTheDocument();
    });

    it('shows Coming Appointments error message', () => {
      render(
        <ComingAppointmentsErrorBoundary>
          <ThrowError error={new Error('Error')} />
        </ComingAppointmentsErrorBoundary>
      );
      expect(screen.getByText('Coming Appointments encountered an error')).toBeInTheDocument();
    });
  });

  describe('SettingsErrorBoundary', () => {
    it('renders children normally', () => {
      render(
        <SettingsErrorBoundary>
          <GoodComponent />
        </SettingsErrorBoundary>
      );
      expect(screen.getByTestId('good-component')).toBeInTheDocument();
    });

    it('shows Settings error message', () => {
      render(
        <SettingsErrorBoundary>
          <ThrowError error={new Error('Error')} />
        </SettingsErrorBoundary>
      );
      expect(screen.getByText('Settings encountered an error')).toBeInTheDocument();
    });
  });
});
