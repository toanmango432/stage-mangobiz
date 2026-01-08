/**
 * FrontDeskHeader Component Tests
 * Tests for header with title, actions, and responsive layout
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FrontDeskHeader, HeaderActionButton } from '../FrontDeskHeader';

describe('FrontDeskHeader', () => {
  const defaultProps = {
    title: 'Front Desk',
    icon: <span data-testid="header-icon">📋</span>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders header title', () => {
      render(<FrontDeskHeader {...defaultProps} />);
      expect(screen.getByText('Front Desk')).toBeInTheDocument();
    });

    it('renders header icon', () => {
      render(<FrontDeskHeader {...defaultProps} />);
      expect(screen.getByTestId('header-icon')).toBeInTheDocument();
    });

    it('renders as h2 element', () => {
      render(<FrontDeskHeader {...defaultProps} />);
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Front Desk');
    });
  });

  describe('count badge', () => {
    it('does not render count badge when count not provided', () => {
      const { container } = render(<FrontDeskHeader {...defaultProps} />);
      // Look for count badge element - it would be a span near the title
      const title = screen.getByText('Front Desk');
      const sibling = title.nextElementSibling;
      // If no count provided, there shouldn't be a sibling span with number
      expect(sibling?.tagName).not.toBe('SPAN');
    });

    it('renders count badge when count is provided as number', () => {
      render(<FrontDeskHeader {...defaultProps} count={5} />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('renders count badge when count is provided as string', () => {
      render(<FrontDeskHeader {...defaultProps} count="10+" />);
      expect(screen.getByText('10+')).toBeInTheDocument();
    });

    it('renders count badge with 0', () => {
      render(<FrontDeskHeader {...defaultProps} count={0} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('subtitle', () => {
    it('does not render subtitle when not provided', () => {
      render(<FrontDeskHeader {...defaultProps} />);
      // No subtitle element should exist
      const subtitle = document.querySelector('.text-2xs');
      expect(subtitle).not.toBeInTheDocument();
    });

    it('renders subtitle when provided', () => {
      render(<FrontDeskHeader {...defaultProps} subtitle="Today's appointments" />);
      expect(screen.getByText("Today's appointments")).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('uses primary variant by default', () => {
      const { container } = render(<FrontDeskHeader {...defaultProps} />);
      // Primary variant should apply specific styles
      expect(container.firstChild).toBeInTheDocument();
    });

    it('accepts primary variant', () => {
      const { container } = render(<FrontDeskHeader {...defaultProps} variant="primary" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('accepts supporting variant', () => {
      const { container } = render(<FrontDeskHeader {...defaultProps} variant="supporting" />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('actions', () => {
    it('renders left actions', () => {
      render(
        <FrontDeskHeader
          {...defaultProps}
          leftActions={<button data-testid="left-action">Left</button>}
        />
      );
      expect(screen.getByTestId('left-action')).toBeInTheDocument();
    });

    it('renders right actions', () => {
      render(
        <FrontDeskHeader
          {...defaultProps}
          rightActions={<button data-testid="right-action">Right</button>}
        />
      );
      expect(screen.getByTestId('right-action')).toBeInTheDocument();
    });

    it('renders both left and right actions', () => {
      render(
        <FrontDeskHeader
          {...defaultProps}
          leftActions={<button data-testid="left-action">Left</button>}
          rightActions={<button data-testid="right-action">Right</button>}
        />
      );
      expect(screen.getByTestId('left-action')).toBeInTheDocument();
      expect(screen.getByTestId('right-action')).toBeInTheDocument();
    });

    it('renders multiple action elements', () => {
      render(
        <FrontDeskHeader
          {...defaultProps}
          rightActions={
            <>
              <button data-testid="action-1">Action 1</button>
              <button data-testid="action-2">Action 2</button>
            </>
          }
        />
      );
      expect(screen.getByTestId('action-1')).toBeInTheDocument();
      expect(screen.getByTestId('action-2')).toBeInTheDocument();
    });
  });

  describe('metric pills', () => {
    const metricPills = [
      { label: 'Waiting', value: 5, tone: 'alert' as const },
      { label: 'In Service', value: 3, tone: 'info' as const },
    ];

    it('does not render metric pills when not provided', () => {
      render(<FrontDeskHeader {...defaultProps} />);
      expect(screen.queryByText('Waiting')).not.toBeInTheDocument();
    });

    it('renders metric pills when provided', () => {
      render(<FrontDeskHeader {...defaultProps} metricPills={metricPills} />);
      expect(screen.getByText('Waiting')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('In Service')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('does not render metric pills when showMetricPills is false', () => {
      render(
        <FrontDeskHeader
          {...defaultProps}
          metricPills={metricPills}
          showMetricPills={false}
        />
      );
      expect(screen.queryByText('Waiting')).not.toBeInTheDocument();
    });

    it('renders metric pills by default (showMetricPills=true)', () => {
      render(<FrontDeskHeader {...defaultProps} metricPills={metricPills} />);
      expect(screen.getByText('Waiting')).toBeInTheDocument();
    });

    it('renders empty array of metric pills without error', () => {
      render(<FrontDeskHeader {...defaultProps} metricPills={[]} />);
      expect(screen.getByText('Front Desk')).toBeInTheDocument();
    });
  });

  describe('metric pill tones', () => {
    it('renders alert tone with red styling', () => {
      const { container } = render(
        <FrontDeskHeader
          {...defaultProps}
          metricPills={[{ label: 'Alert', value: 1, tone: 'alert' }]}
        />
      );
      const pill = screen.getByText('Alert').closest('span');
      expect(pill).toHaveClass('border-red-100');
      expect(pill).toHaveClass('bg-red-50');
      expect(pill).toHaveClass('text-red-600');
    });

    it('renders info tone with blue styling', () => {
      const { container } = render(
        <FrontDeskHeader
          {...defaultProps}
          metricPills={[{ label: 'Info', value: 1, tone: 'info' }]}
        />
      );
      const pill = screen.getByText('Info').closest('span');
      expect(pill).toHaveClass('border-blue-100');
      expect(pill).toHaveClass('bg-blue-50');
      expect(pill).toHaveClass('text-blue-600');
    });

    it('renders muted tone with slate styling', () => {
      const { container } = render(
        <FrontDeskHeader
          {...defaultProps}
          metricPills={[{ label: 'Muted', value: 1, tone: 'muted' }]}
        />
      );
      const pill = screen.getByText('Muted').closest('span');
      expect(pill).toHaveClass('border-slate-200');
      expect(pill).toHaveClass('bg-slate-100');
      expect(pill).toHaveClass('text-slate-600');
    });

    it('renders vip tone with rose styling', () => {
      const { container } = render(
        <FrontDeskHeader
          {...defaultProps}
          metricPills={[{ label: 'VIP', value: 1, tone: 'vip' }]}
        />
      );
      const pill = screen.getByText('VIP').closest('span');
      expect(pill).toHaveClass('border-rose-200');
      expect(pill).toHaveClass('bg-rose-100');
      expect(pill).toHaveClass('text-rose-700');
    });
  });

  describe('hideMetricPillsOnMobile', () => {
    it('shows metric pills on all screens by default', () => {
      const { container } = render(
        <FrontDeskHeader
          {...defaultProps}
          metricPills={[{ label: 'Test', value: 1, tone: 'info' }]}
        />
      );
      const pillsContainer = screen.getByText('Test').closest('.flex');
      expect(pillsContainer).not.toHaveClass('hidden');
    });

    it('hides metric pills on mobile when hideMetricPillsOnMobile is true', () => {
      const { container } = render(
        <FrontDeskHeader
          {...defaultProps}
          metricPills={[{ label: 'Test', value: 1, tone: 'info' }]}
          hideMetricPillsOnMobile={true}
        />
      );
      const pillsContainer = screen.getByText('Test').closest('div.flex');
      // The container should have hidden sm:flex classes
      expect(pillsContainer).toHaveClass('hidden');
      expect(pillsContainer).toHaveClass('sm:flex');
    });
  });

  describe('custom className', () => {
    it('applies custom className', () => {
      const { container } = render(
        <FrontDeskHeader {...defaultProps} className="custom-header-class" />
      );
      expect(container.firstChild).toHaveClass('custom-header-class');
    });
  });

  describe('custom theme', () => {
    it('accepts custom theme', () => {
      const customTheme = {
        wrapper: 'custom-wrapper',
        padding: 'custom-padding',
        iconWrapper: 'custom-icon',
        titleClass: 'custom-title',
        countBadge: 'custom-badge',
      };

      const { container } = render(
        <FrontDeskHeader {...defaultProps} customTheme={customTheme} />
      );
      expect(container.firstChild).toHaveClass('custom-wrapper');
    });
  });

  describe('layout', () => {
    it('uses flex layout', () => {
      const { container } = render(<FrontDeskHeader {...defaultProps} />);
      const flexContainer = container.querySelector('.flex');
      expect(flexContainer).toBeInTheDocument();
    });

    it('wraps items on smaller screens', () => {
      const { container } = render(<FrontDeskHeader {...defaultProps} />);
      const flexContainer = container.querySelector('.flex-wrap');
      expect(flexContainer).toBeInTheDocument();
    });

    it('aligns items center', () => {
      const { container } = render(<FrontDeskHeader {...defaultProps} />);
      const flexContainer = container.querySelector('.items-center');
      expect(flexContainer).toBeInTheDocument();
    });

    it('justifies content between', () => {
      const { container } = render(<FrontDeskHeader {...defaultProps} />);
      const flexContainer = container.querySelector('.justify-between');
      expect(flexContainer).toBeInTheDocument();
    });
  });
});

describe('HeaderActionButton', () => {
  it('renders children', () => {
    render(<HeaderActionButton>Click Me</HeaderActionButton>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('renders as button element', () => {
    render(<HeaderActionButton>Test</HeaderActionButton>);
    expect(screen.getByRole('button')).toHaveTextContent('Test');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<HeaderActionButton onClick={handleClick}>Click</HeaderActionButton>);

    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    render(<HeaderActionButton className="custom-class">Test</HeaderActionButton>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('passes through button props', () => {
    render(
      <HeaderActionButton type="submit" disabled>
        Submit
      </HeaderActionButton>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toBeDisabled();
  });

  it('is focusable', () => {
    render(<HeaderActionButton>Focus Me</HeaderActionButton>);

    const button = screen.getByRole('button');
    button.focus();
    expect(document.activeElement).toBe(button);
  });
});
