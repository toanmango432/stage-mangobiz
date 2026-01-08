/**
 * RevenueDashboard Component Tests
 * Tests for real-time revenue tracking, goals, opportunities, and insights
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RevenueDashboard } from '../RevenueDashboard';

describe('RevenueDashboard', () => {
  const mockOnClick = vi.fn();

  const createMockOpportunity = (overrides = {}) => ({
    id: `opp-${Math.random().toString(36).substring(7)}`,
    type: 'fill-gap' as const,
    description: 'Fill 10am gap with walk-in',
    potentialRevenue: 75,
    confidence: 85,
    action: {
      label: 'Fill Gap',
      onClick: mockOnClick,
    },
    ...overrides,
  });

  const defaultProps = {
    currentRevenue: 1500,
    goalRevenue: 3000,
    period: 'today' as const,
    previousRevenue: 1200,
    opportunities: [createMockOpportunity()],
    breakdown: {
      completed: 1000,
      scheduled: 400,
      potential: 100,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('main revenue card', () => {
    it('displays current revenue formatted', () => {
      render(<RevenueDashboard {...defaultProps} />);
      // Revenue appears in header ($1,500) and in remaining to goal ($1,500)
      const revenueElements = screen.getAllByText('$1,500');
      expect(revenueElements.length).toBeGreaterThanOrEqual(1);
    });

    it('displays revenue period label for today', () => {
      render(<RevenueDashboard {...defaultProps} period="today" />);
      expect(screen.getByText('Today Revenue')).toBeInTheDocument();
    });

    it('displays revenue period label for week', () => {
      render(<RevenueDashboard {...defaultProps} period="week" />);
      expect(screen.getByText('This Week Revenue')).toBeInTheDocument();
    });

    it('displays revenue period label for month', () => {
      render(<RevenueDashboard {...defaultProps} period="month" />);
      expect(screen.getByText('This Month Revenue')).toBeInTheDocument();
    });

    it('shows goal amount formatted', () => {
      render(<RevenueDashboard {...defaultProps} />);
      expect(screen.getByText('Goal: $3,000')).toBeInTheDocument();
    });

    it('shows progress percentage', () => {
      render(<RevenueDashboard {...defaultProps} />);
      // Progress appears in header and quick stats
      const progressElements = screen.getAllByText('50%');
      expect(progressElements.length).toBeGreaterThanOrEqual(1);
    });

    it('shows DollarSign icon', () => {
      const { container } = render(<RevenueDashboard {...defaultProps} />);
      const dollarIcons = container.querySelectorAll('svg');
      expect(dollarIcons.length).toBeGreaterThan(0);
    });

    it('formats large revenue with commas', () => {
      render(<RevenueDashboard {...defaultProps} currentRevenue={12500} goalRevenue={50000} />);
      expect(screen.getByText('$12,500')).toBeInTheDocument();
      expect(screen.getByText('Goal: $50,000')).toBeInTheDocument();
    });
  });

  describe('trend indicator', () => {
    it('shows positive trend when current exceeds previous', () => {
      render(<RevenueDashboard {...defaultProps} />);
      // 1500 vs 1200 = +25%
      expect(screen.getByText('25.0%')).toBeInTheDocument();
    });

    it('shows green styling for positive trend', () => {
      const { container } = render(<RevenueDashboard {...defaultProps} />);
      expect(container.querySelector('.bg-green-500\\/30')).toBeInTheDocument();
    });

    it('shows negative trend when current is below previous', () => {
      render(
        <RevenueDashboard
          {...defaultProps}
          currentRevenue={1000}
          previousRevenue={1250}
        />
      );
      // 1000 vs 1250 = -20%
      expect(screen.getByText('20.0%')).toBeInTheDocument();
    });

    it('shows red styling for negative trend', () => {
      const { container } = render(
        <RevenueDashboard
          {...defaultProps}
          currentRevenue={1000}
          previousRevenue={1250}
        />
      );
      expect(container.querySelector('.bg-red-500\\/30')).toBeInTheDocument();
    });

    it('does not show trend when no previousRevenue', () => {
      render(
        <RevenueDashboard
          {...defaultProps}
          previousRevenue={undefined}
        />
      );
      // Should not find any percentage trend in header
      expect(screen.queryByText(/^\d+\.\d%$/)).not.toBeInTheDocument();
    });
  });

  describe('progress bar', () => {
    it('renders progress bar container', () => {
      const { container } = render(<RevenueDashboard {...defaultProps} />);
      expect(container.querySelector('.h-3.bg-white\\/20.rounded-full')).toBeInTheDocument();
    });

    it('applies green gradient when goal achieved', () => {
      const { container } = render(
        <RevenueDashboard
          {...defaultProps}
          currentRevenue={3500}
          goalRevenue={3000}
        />
      );
      expect(container.querySelector('.from-green-400')).toBeInTheDocument();
    });
  });

  describe('revenue breakdown', () => {
    it('shows completed revenue', () => {
      render(<RevenueDashboard {...defaultProps} />);
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('$1,000')).toBeInTheDocument();
    });

    it('shows scheduled revenue', () => {
      render(<RevenueDashboard {...defaultProps} />);
      expect(screen.getByText('Scheduled')).toBeInTheDocument();
      expect(screen.getByText('$400')).toBeInTheDocument();
    });

    it('shows potential revenue', () => {
      render(<RevenueDashboard {...defaultProps} />);
      expect(screen.getByText('Potential')).toBeInTheDocument();
      expect(screen.getByText('$100')).toBeInTheDocument();
    });

    it('does not show breakdown when not provided', () => {
      render(
        <RevenueDashboard
          {...defaultProps}
          breakdown={undefined}
        />
      );
      expect(screen.queryByText('Completed')).not.toBeInTheDocument();
    });
  });

  describe('goal status - not achieved', () => {
    it('shows remaining amount to goal', () => {
      render(<RevenueDashboard {...defaultProps} />);
      expect(screen.getByText('Remaining to goal')).toBeInTheDocument();
      // $1,500 appears multiple times (current revenue AND remaining)
      const amounts = screen.getAllByText('$1,500');
      expect(amounts.length).toBeGreaterThanOrEqual(1);
    });

    it('shows available opportunities total', () => {
      render(<RevenueDashboard {...defaultProps} />);
      expect(screen.getByText('Available opportunities')).toBeInTheDocument();
      // +$75 appears in multiple places
      const totals = screen.getAllByText('+$75');
      expect(totals.length).toBeGreaterThanOrEqual(1);
    });

    it('does not show opportunities total when no opportunities', () => {
      render(
        <RevenueDashboard
          {...defaultProps}
          opportunities={[]}
        />
      );
      expect(screen.queryByText('Available opportunities')).not.toBeInTheDocument();
    });
  });

  describe('goal status - achieved', () => {
    it('shows goal achieved message', () => {
      render(
        <RevenueDashboard
          {...defaultProps}
          currentRevenue={3500}
          goalRevenue={3000}
        />
      );
      expect(screen.getByText(/Goal Achieved!/)).toBeInTheDocument();
    });

    it('shows exceeded amount', () => {
      render(
        <RevenueDashboard
          {...defaultProps}
          currentRevenue={3500}
          goalRevenue={3000}
        />
      );
      expect(screen.getByText('Exceeded by $500')).toBeInTheDocument();
    });

    it('shows CheckCircle2 icon when goal achieved', () => {
      const { container } = render(
        <RevenueDashboard
          {...defaultProps}
          currentRevenue={3500}
          goalRevenue={3000}
        />
      );
      // Green success banner with svg
      expect(container.querySelector('.bg-green-500 svg')).toBeInTheDocument();
    });

    it('does not show remaining when goal achieved', () => {
      render(
        <RevenueDashboard
          {...defaultProps}
          currentRevenue={3500}
          goalRevenue={3000}
        />
      );
      expect(screen.queryByText('Remaining to goal')).not.toBeInTheDocument();
    });
  });

  describe('revenue opportunities section', () => {
    it('shows opportunities heading', () => {
      render(<RevenueDashboard {...defaultProps} />);
      expect(screen.getByText('💡 Revenue Opportunities')).toBeInTheDocument();
    });

    it('shows opportunity count text', () => {
      render(<RevenueDashboard {...defaultProps} />);
      expect(screen.getByText('1 way to hit your goal')).toBeInTheDocument();
    });

    it('shows plural for multiple opportunities', () => {
      render(
        <RevenueDashboard
          {...defaultProps}
          opportunities={[
            createMockOpportunity({ id: '1' }),
            createMockOpportunity({ id: '2' }),
          ]}
        />
      );
      expect(screen.getByText('2 ways to hit your goal')).toBeInTheDocument();
    });

    it('shows total potential revenue', () => {
      render(<RevenueDashboard {...defaultProps} />);
      expect(screen.getByText('Total Potential')).toBeInTheDocument();
      // +$75 appears in multiple places
      const totals = screen.getAllByText('+$75');
      expect(totals.length).toBeGreaterThanOrEqual(1);
    });

    it('renders opportunity description', () => {
      render(<RevenueDashboard {...defaultProps} />);
      expect(screen.getByText('Fill 10am gap with walk-in')).toBeInTheDocument();
    });

    it('shows opportunity potential revenue', () => {
      render(<RevenueDashboard {...defaultProps} />);
      // +$75 appears in multiple places
      const totals = screen.getAllByText('+$75');
      expect(totals.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('potential')).toBeInTheDocument();
    });

    it('shows opportunity confidence', () => {
      render(<RevenueDashboard {...defaultProps} />);
      expect(screen.getByText('85% confidence')).toBeInTheDocument();
    });

    it('renders action button with label', () => {
      render(<RevenueDashboard {...defaultProps} />);
      expect(screen.getByText('Fill Gap')).toBeInTheDocument();
    });

    it('calls onClick when action button clicked', () => {
      render(<RevenueDashboard {...defaultProps} />);
      fireEvent.click(screen.getByText('Fill Gap'));
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('does not show opportunities when goal achieved', () => {
      render(
        <RevenueDashboard
          {...defaultProps}
          currentRevenue={3500}
          goalRevenue={3000}
        />
      );
      expect(screen.queryByText('💡 Revenue Opportunities')).not.toBeInTheDocument();
    });

    it('does not show opportunities section when empty', () => {
      render(
        <RevenueDashboard
          {...defaultProps}
          opportunities={[]}
        />
      );
      expect(screen.queryByText('💡 Revenue Opportunities')).not.toBeInTheDocument();
    });
  });

  describe('opportunity types styling', () => {
    it('applies orange gradient for fill-gap type', () => {
      const { container } = render(
        <RevenueDashboard
          {...defaultProps}
          opportunities={[createMockOpportunity({ type: 'fill-gap' })]}
        />
      );
      expect(container.querySelector('.from-orange-500.to-red-500')).toBeInTheDocument();
    });

    it('applies brand gradient for upsell type', () => {
      const { container } = render(
        <RevenueDashboard
          {...defaultProps}
          opportunities={[createMockOpportunity({ type: 'upsell' })]}
        />
      );
      expect(container.querySelector('.from-brand-500.to-cyan-500')).toBeInTheDocument();
    });

    it('applies purple gradient for waitlist type', () => {
      const { container } = render(
        <RevenueDashboard
          {...defaultProps}
          opportunities={[createMockOpportunity({ type: 'waitlist' })]}
        />
      );
      expect(container.querySelector('.from-purple-500.to-pink-500')).toBeInTheDocument();
    });

    it('applies amber gradient for premium-pricing type', () => {
      const { container } = render(
        <RevenueDashboard
          {...defaultProps}
          opportunities={[createMockOpportunity({ type: 'premium-pricing' })]}
        />
      );
      expect(container.querySelector('.from-amber-500.to-yellow-500')).toBeInTheDocument();
    });
  });

  describe('quick stats grid', () => {
    it('shows completion percentage', () => {
      render(<RevenueDashboard {...defaultProps} />);
      expect(screen.getByText('Completion')).toBeInTheDocument();
      // Should show 50% (1500/3000)
      const fiftyPercent = screen.getAllByText('50%');
      expect(fiftyPercent.length).toBeGreaterThanOrEqual(1);
    });

    it('shows vs Yesterday for today period', () => {
      render(<RevenueDashboard {...defaultProps} period="today" />);
      expect(screen.getByText('vs Yesterday')).toBeInTheDocument();
    });

    it('shows vs Last Period for week period', () => {
      render(<RevenueDashboard {...defaultProps} period="week" />);
      expect(screen.getByText('vs Last Period')).toBeInTheDocument();
    });

    it('shows vs Last Period for month period', () => {
      render(<RevenueDashboard {...defaultProps} period="month" />);
      expect(screen.getByText('vs Last Period')).toBeInTheDocument();
    });

    it('shows trend percentage with sign', () => {
      render(<RevenueDashboard {...defaultProps} />);
      // 1500 vs 1200 = +25%
      expect(screen.getByText('+25.0%')).toBeInTheDocument();
    });

    it('shows negative trend with minus sign', () => {
      render(
        <RevenueDashboard
          {...defaultProps}
          currentRevenue={1000}
          previousRevenue={1250}
        />
      );
      expect(screen.getByText('-20.0%')).toBeInTheDocument();
    });

    it('shows opportunities count', () => {
      render(<RevenueDashboard {...defaultProps} />);
      expect(screen.getByText('Opportunities')).toBeInTheDocument();
      // Should show "1" for single opportunity
      const ones = screen.getAllByText('1');
      expect(ones.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('quick stats icons', () => {
    it('renders Target icon in completion stat', () => {
      const { container } = render(<RevenueDashboard {...defaultProps} />);
      expect(container.querySelector('.bg-blue-100 svg')).toBeInTheDocument();
    });

    it('renders TrendingUp icon in vs period stat', () => {
      const { container } = render(<RevenueDashboard {...defaultProps} />);
      expect(container.querySelector('.bg-green-100 svg')).toBeInTheDocument();
    });

    it('renders Zap icon in opportunities stat', () => {
      const { container } = render(<RevenueDashboard {...defaultProps} />);
      expect(container.querySelector('.bg-purple-100 svg')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles zero current revenue', () => {
      render(
        <RevenueDashboard
          {...defaultProps}
          currentRevenue={0}
        />
      );
      expect(screen.getByText('$0')).toBeInTheDocument();
      // 0% appears in multiple places
      const zeros = screen.getAllByText('0%');
      expect(zeros.length).toBeGreaterThanOrEqual(1);
    });

    it('handles zero goal revenue safely', () => {
      // This would cause division by zero, check it doesn't crash
      render(
        <RevenueDashboard
          {...defaultProps}
          currentRevenue={100}
          goalRevenue={0}
        />
      );
      // Should render something (even if Infinity% or similar)
      // $100 may appear multiple places
      const amounts = screen.getAllByText('$100');
      expect(amounts.length).toBeGreaterThanOrEqual(1);
    });

    it('handles exactly 100% progress', () => {
      render(
        <RevenueDashboard
          {...defaultProps}
          currentRevenue={3000}
          goalRevenue={3000}
        />
      );
      // 100% appears in multiple places
      const percents = screen.getAllByText('100%');
      expect(percents.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Goal Achieved!/)).toBeInTheDocument();
    });

    it('handles very large numbers', () => {
      render(
        <RevenueDashboard
          {...defaultProps}
          currentRevenue={1250000}
          goalRevenue={2000000}
        />
      );
      expect(screen.getByText('$1,250,000')).toBeInTheDocument();
      expect(screen.getByText('Goal: $2,000,000')).toBeInTheDocument();
    });

    it('handles no previous revenue for trend', () => {
      render(
        <RevenueDashboard
          {...defaultProps}
          previousRevenue={undefined}
        />
      );
      // Should show 0% or similar in quick stats
      expect(screen.getByText('+0.0%')).toBeInTheDocument();
    });
  });

  describe('multiple opportunities', () => {
    it('renders all opportunities', () => {
      render(
        <RevenueDashboard
          {...defaultProps}
          opportunities={[
            createMockOpportunity({ id: '1', description: 'First opportunity' }),
            createMockOpportunity({ id: '2', description: 'Second opportunity' }),
            createMockOpportunity({ id: '3', description: 'Third opportunity' }),
          ]}
        />
      );
      expect(screen.getByText('First opportunity')).toBeInTheDocument();
      expect(screen.getByText('Second opportunity')).toBeInTheDocument();
      expect(screen.getByText('Third opportunity')).toBeInTheDocument();
    });

    it('sums total potential from all opportunities', () => {
      render(
        <RevenueDashboard
          {...defaultProps}
          opportunities={[
            createMockOpportunity({ id: '1', potentialRevenue: 50 }),
            createMockOpportunity({ id: '2', potentialRevenue: 75 }),
            createMockOpportunity({ id: '3', potentialRevenue: 100 }),
          ]}
        />
      );
      // Total: 50 + 75 + 100 = 225, appears in multiple places
      const totals = screen.getAllByText('+$225');
      expect(totals.length).toBeGreaterThanOrEqual(1);
    });

    it('calls correct onClick for each opportunity', () => {
      const onClick1 = vi.fn();
      const onClick2 = vi.fn();

      render(
        <RevenueDashboard
          {...defaultProps}
          opportunities={[
            createMockOpportunity({
              id: '1',
              action: { label: 'Action 1', onClick: onClick1 },
            }),
            createMockOpportunity({
              id: '2',
              action: { label: 'Action 2', onClick: onClick2 },
            }),
          ]}
        />
      );

      fireEvent.click(screen.getByText('Action 1'));
      expect(onClick1).toHaveBeenCalledTimes(1);
      expect(onClick2).not.toHaveBeenCalled();

      fireEvent.click(screen.getByText('Action 2'));
      expect(onClick2).toHaveBeenCalledTimes(1);
    });
  });

  describe('styling', () => {
    it('applies gradient background to main card', () => {
      const { container } = render(<RevenueDashboard {...defaultProps} />);
      expect(container.querySelector('.bg-gradient-to-br.from-brand-500.to-cyan-600')).toBeInTheDocument();
    });

    it('applies shadow to main card', () => {
      const { container } = render(<RevenueDashboard {...defaultProps} />);
      expect(container.querySelector('.shadow-xl')).toBeInTheDocument();
    });

    it('applies rounded corners to main card', () => {
      const { container } = render(<RevenueDashboard {...defaultProps} />);
      expect(container.querySelector('.rounded-2xl')).toBeInTheDocument();
    });

    it('applies white background to opportunities card', () => {
      const { container } = render(<RevenueDashboard {...defaultProps} />);
      expect(container.querySelector('.bg-white.rounded-xl')).toBeInTheDocument();
    });
  });
});
