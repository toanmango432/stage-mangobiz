/**
 * ClientJourneyTimeline Component Tests
 * Tests for client visit history timeline with insights and predictions
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClientJourneyTimeline } from '../ClientJourneyTimeline';

describe('ClientJourneyTimeline', () => {
  const mockOnBookNext = vi.fn();

  const createMockVisit = (overrides = {}) => ({
    id: `visit-${Math.random().toString(36).substring(7)}`,
    date: new Date(2027, 5, 10),
    services: [
      { name: 'Haircut', price: 35, staff: 'Jane' },
    ],
    totalSpent: 35,
    status: 'completed' as const,
    ...overrides,
  });

  const createMockInsights = (overrides = {}) => ({
    totalVisits: 12,
    lifetimeValue: 1250,
    averageSpend: 85,
    averageCycle: 21,
    preferredServices: ['Haircut', 'Styling'],
    preferredStaff: 'Jane Stylist',
    preferredTimeOfDay: 'afternoon' as const,
    churnRisk: 'low' as const,
    loyaltyTier: 'gold' as const,
    ...overrides,
  });

  const defaultProps = {
    clientName: 'John Doe',
    visits: [createMockVisit()],
    insights: createMockInsights(),
    onBookNext: mockOnBookNext,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('header section', () => {
    it('renders client name', () => {
      render(<ClientJourneyTimeline {...defaultProps} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('shows loyalty tier text', () => {
      render(<ClientJourneyTimeline {...defaultProps} />);
      expect(screen.getByText('Gold Member')).toBeInTheDocument();
    });

    it('shows lifetime value', () => {
      render(<ClientJourneyTimeline {...defaultProps} />);
      expect(screen.getByText('$1,250')).toBeInTheDocument();
    });

    it('shows "Lifetime Value" label', () => {
      render(<ClientJourneyTimeline {...defaultProps} />);
      expect(screen.getByText('Lifetime Value')).toBeInTheDocument();
    });

    it('shows Heart icon', () => {
      const { container } = render(<ClientJourneyTimeline {...defaultProps} />);
      expect(container.querySelector('svg.lucide-heart')).toBeInTheDocument();
    });

    it('formats large lifetime values with commas', () => {
      const insights = createMockInsights({ lifetimeValue: 15250 });
      render(<ClientJourneyTimeline {...defaultProps} insights={insights} />);
      expect(screen.getByText('$15,250')).toBeInTheDocument();
    });

    it('capitalizes loyalty tier', () => {
      const insights = createMockInsights({ loyaltyTier: 'platinum' });
      render(<ClientJourneyTimeline {...defaultProps} insights={insights} />);
      expect(screen.getByText('Platinum Member')).toBeInTheDocument();
    });
  });

  describe('loyalty tier colors', () => {
    it('shows purple gradient for platinum tier', () => {
      const insights = createMockInsights({ loyaltyTier: 'platinum' });
      const { container } = render(
        <ClientJourneyTimeline {...defaultProps} insights={insights} />
      );
      const header = container.querySelector('.from-purple-500.to-pink-500');
      expect(header).toBeInTheDocument();
    });

    it('shows yellow gradient for gold tier', () => {
      const { container } = render(<ClientJourneyTimeline {...defaultProps} />);
      const header = container.querySelector('.from-yellow-500.to-amber-500');
      expect(header).toBeInTheDocument();
    });

    it('shows gray gradient for silver tier', () => {
      const insights = createMockInsights({ loyaltyTier: 'silver' });
      const { container } = render(
        <ClientJourneyTimeline {...defaultProps} insights={insights} />
      );
      const header = container.querySelector('.from-gray-400.to-gray-500');
      expect(header).toBeInTheDocument();
    });

    it('shows orange gradient for bronze tier', () => {
      const insights = createMockInsights({ loyaltyTier: 'bronze' });
      const { container } = render(
        <ClientJourneyTimeline {...defaultProps} insights={insights} />
      );
      const header = container.querySelector('.from-orange-500.to-red-500');
      expect(header).toBeInTheDocument();
    });
  });

  describe('key metrics', () => {
    it('shows total visits', () => {
      render(<ClientJourneyTimeline {...defaultProps} />);
      expect(screen.getByText('Total Visits')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('shows average spend', () => {
      render(<ClientJourneyTimeline {...defaultProps} />);
      expect(screen.getByText('Avg Spend')).toBeInTheDocument();
      expect(screen.getByText('$85')).toBeInTheDocument();
    });

    it('shows visit cycle in days', () => {
      render(<ClientJourneyTimeline {...defaultProps} />);
      expect(screen.getByText('Visit Cycle')).toBeInTheDocument();
      expect(screen.getByText('21d')).toBeInTheDocument();
    });

    it('shows churn risk', () => {
      render(<ClientJourneyTimeline {...defaultProps} />);
      expect(screen.getByText('Churn Risk')).toBeInTheDocument();
      expect(screen.getByText('LOW')).toBeInTheDocument();
    });
  });

  describe('churn risk colors', () => {
    it('shows green styling for low risk', () => {
      const { container } = render(<ClientJourneyTimeline {...defaultProps} />);
      const badge = container.querySelector('.text-green-600.bg-green-50');
      expect(badge).toBeInTheDocument();
    });

    it('shows CheckCircle2 icon for low risk', () => {
      const { container } = render(<ClientJourneyTimeline {...defaultProps} />);
      // Find the churn risk badge (green) and verify it contains an svg
      const badge = container.querySelector('.text-green-600.bg-green-50');
      expect(badge?.querySelector('svg')).toBeInTheDocument();
    });

    it('shows yellow styling for medium risk', () => {
      const insights = createMockInsights({ churnRisk: 'medium' });
      const { container } = render(
        <ClientJourneyTimeline {...defaultProps} insights={insights} />
      );
      const badge = container.querySelector('.text-yellow-600.bg-yellow-50');
      expect(badge).toBeInTheDocument();
    });

    it('shows red styling for high risk', () => {
      const insights = createMockInsights({ churnRisk: 'high' });
      const { container } = render(
        <ClientJourneyTimeline {...defaultProps} insights={insights} />
      );
      const badge = container.querySelector('.text-red-600.bg-red-50');
      expect(badge).toBeInTheDocument();
    });

    it('shows AlertCircle icon for high risk', () => {
      const insights = createMockInsights({ churnRisk: 'high' });
      const { container } = render(
        <ClientJourneyTimeline {...defaultProps} insights={insights} />
      );
      // Find the churn risk badge (red) and verify it contains an svg
      const badge = container.querySelector('.text-red-600.bg-red-50');
      expect(badge?.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('spend trend', () => {
    it('shows TrendingUp icon for positive trend', () => {
      const visits = [
        createMockVisit({ totalSpent: 100, date: new Date(2027, 5, 10) }),
        createMockVisit({ totalSpent: 100, date: new Date(2027, 5, 5) }),
        createMockVisit({ totalSpent: 100, date: new Date(2027, 5, 1) }),
        createMockVisit({ totalSpent: 50, date: new Date(2027, 4, 15) }),
        createMockVisit({ totalSpent: 50, date: new Date(2027, 4, 10) }),
        createMockVisit({ totalSpent: 50, date: new Date(2027, 4, 5) }),
      ];
      const { container } = render(
        <ClientJourneyTimeline {...defaultProps} visits={visits} />
      );
      expect(container.querySelector('svg.lucide-trending-up')).toBeInTheDocument();
    });

    it('shows TrendingDown icon for negative trend', () => {
      const visits = [
        createMockVisit({ totalSpent: 50, date: new Date(2027, 5, 10) }),
        createMockVisit({ totalSpent: 50, date: new Date(2027, 5, 5) }),
        createMockVisit({ totalSpent: 50, date: new Date(2027, 5, 1) }),
        createMockVisit({ totalSpent: 100, date: new Date(2027, 4, 15) }),
        createMockVisit({ totalSpent: 100, date: new Date(2027, 4, 10) }),
        createMockVisit({ totalSpent: 100, date: new Date(2027, 4, 5) }),
      ];
      const { container } = render(
        <ClientJourneyTimeline {...defaultProps} visits={visits} />
      );
      expect(container.querySelector('svg.lucide-trending-down')).toBeInTheDocument();
    });

    it('shows green color for positive trend', () => {
      const visits = [
        createMockVisit({ totalSpent: 100, date: new Date(2027, 5, 10) }),
        createMockVisit({ totalSpent: 100, date: new Date(2027, 5, 5) }),
        createMockVisit({ totalSpent: 100, date: new Date(2027, 5, 1) }),
        createMockVisit({ totalSpent: 50, date: new Date(2027, 4, 15) }),
        createMockVisit({ totalSpent: 50, date: new Date(2027, 4, 10) }),
        createMockVisit({ totalSpent: 50, date: new Date(2027, 4, 5) }),
      ];
      const { container } = render(
        <ClientJourneyTimeline {...defaultProps} visits={visits} />
      );
      const trendUp = container.querySelector('.text-green-600');
      expect(trendUp).toBeInTheDocument();
    });

    it('does not show trend for single visit', () => {
      const visits = [createMockVisit()];
      const { container } = render(
        <ClientJourneyTimeline {...defaultProps} visits={visits} />
      );
      expect(container.querySelector('svg.lucide-trending-up')).not.toBeInTheDocument();
      expect(container.querySelector('svg.lucide-trending-down')).not.toBeInTheDocument();
    });
  });

  describe('client insights section', () => {
    it('shows "Client Insights" heading', () => {
      render(<ClientJourneyTimeline {...defaultProps} />);
      expect(screen.getByText('Client Insights')).toBeInTheDocument();
    });

    it('shows Sparkles icon', () => {
      const { container } = render(<ClientJourneyTimeline {...defaultProps} />);
      const sparklesIcons = container.querySelectorAll('svg.lucide-sparkles');
      expect(sparklesIcons.length).toBeGreaterThanOrEqual(1);
    });

    it('shows preferred services', () => {
      render(<ClientJourneyTimeline {...defaultProps} />);
      expect(screen.getByText('Prefers')).toBeInTheDocument();
      expect(screen.getByText('Haircut, Styling')).toBeInTheDocument();
    });

    it('shows favorite staff', () => {
      render(<ClientJourneyTimeline {...defaultProps} />);
      expect(screen.getByText('Favorite Staff')).toBeInTheDocument();
      expect(screen.getByText('Jane Stylist')).toBeInTheDocument();
    });

    it('shows typical time of day', () => {
      render(<ClientJourneyTimeline {...defaultProps} />);
      expect(screen.getByText('Typical Time')).toBeInTheDocument();
      // CSS capitalize class renders it visually capitalized but DOM text is lowercase
      expect(screen.getByText('afternoon')).toBeInTheDocument();
    });

    it('shows next predicted visit when available', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2027, 5, 15)); // Set to 2027 so year won't show

      const insights = createMockInsights({
        nextPredictedVisit: new Date(2027, 6, 1),
      });
      render(<ClientJourneyTimeline {...defaultProps} insights={insights} />);
      expect(screen.getByText('Next Visit Predicted')).toBeInTheDocument();
      expect(screen.getByText('Jul 1')).toBeInTheDocument();

      vi.useRealTimers();
    });

    it('does not show predicted visit when not available', () => {
      render(<ClientJourneyTimeline {...defaultProps} />);
      expect(screen.queryByText('Next Visit Predicted')).not.toBeInTheDocument();
    });
  });

  describe('overdue alert', () => {
    it('shows overdue alert when client is overdue', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2027, 5, 30)); // 30 days after average cycle of 21

      const visits = [createMockVisit({ date: new Date(2027, 5, 1) })];
      const insights = createMockInsights({ averageCycle: 21 });
      render(
        <ClientJourneyTimeline {...defaultProps} visits={visits} insights={insights} />
      );

      expect(screen.getByText('Client is overdue for appointment')).toBeInTheDocument();

      vi.useRealTimers();
    });

    it('shows days since last visit in alert', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2027, 5, 30));

      const visits = [createMockVisit({ date: new Date(2027, 5, 1) })];
      const insights = createMockInsights({ averageCycle: 21 });
      render(
        <ClientJourneyTimeline {...defaultProps} visits={visits} insights={insights} />
      );

      expect(screen.getByText(/Last visit 29 days ago/)).toBeInTheDocument();

      vi.useRealTimers();
    });

    it('shows Book Now button in overdue alert', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2027, 5, 30));

      const visits = [createMockVisit({ date: new Date(2027, 5, 1) })];
      const insights = createMockInsights({ averageCycle: 21 });
      render(
        <ClientJourneyTimeline {...defaultProps} visits={visits} insights={insights} />
      );

      expect(screen.getByText('Book Now')).toBeInTheDocument();

      vi.useRealTimers();
    });

    it('calls onBookNext when Book Now clicked', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2027, 5, 30));

      const visits = [createMockVisit({ date: new Date(2027, 5, 1) })];
      const insights = createMockInsights({ averageCycle: 21 });
      render(
        <ClientJourneyTimeline {...defaultProps} visits={visits} insights={insights} />
      );

      fireEvent.click(screen.getByText('Book Now'));
      expect(mockOnBookNext).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it('does not show alert when not overdue', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2027, 5, 10));

      const visits = [createMockVisit({ date: new Date(2027, 5, 5) })];
      const insights = createMockInsights({ averageCycle: 21 });
      render(
        <ClientJourneyTimeline {...defaultProps} visits={visits} insights={insights} />
      );

      expect(screen.queryByText('Client is overdue for appointment')).not.toBeInTheDocument();

      vi.useRealTimers();
    });

    it('does not show Book Now button when onBookNext not provided', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2027, 5, 30));

      const visits = [createMockVisit({ date: new Date(2027, 5, 1) })];
      const insights = createMockInsights({ averageCycle: 21 });
      const { onBookNext, ...propsWithoutCallback } = defaultProps;
      render(
        <ClientJourneyTimeline {...propsWithoutCallback} visits={visits} insights={insights} />
      );

      expect(screen.queryByText('Book Now')).not.toBeInTheDocument();

      vi.useRealTimers();
    });
  });

  describe('visit timeline', () => {
    it('shows "Visit History" heading', () => {
      render(<ClientJourneyTimeline {...defaultProps} />);
      expect(screen.getByText('Visit History')).toBeInTheDocument();
    });

    it('shows Calendar icon in heading', () => {
      const { container } = render(<ClientJourneyTimeline {...defaultProps} />);
      expect(container.querySelector('svg.lucide-calendar')).toBeInTheDocument();
    });

    it('renders visit date', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2027, 5, 20)); // Set to 2027 so year won't show

      const visits = [createMockVisit({ date: new Date(2027, 5, 15) })];
      render(<ClientJourneyTimeline {...defaultProps} visits={visits} />);
      expect(screen.getByText('Jun 15')).toBeInTheDocument();

      vi.useRealTimers();
    });

    it('renders visit total spent', () => {
      const visits = [createMockVisit({ totalSpent: 75 })];
      render(<ClientJourneyTimeline {...defaultProps} visits={visits} />);
      expect(screen.getByText('75')).toBeInTheDocument();
    });

    it('shows DollarSign icon', () => {
      const { container } = render(<ClientJourneyTimeline {...defaultProps} />);
      const dollarIcons = container.querySelectorAll('svg.lucide-dollar-sign');
      expect(dollarIcons.length).toBeGreaterThanOrEqual(1);
    });

    it('renders visit status badge', () => {
      const visits = [createMockVisit({ status: 'completed' })];
      render(<ClientJourneyTimeline {...defaultProps} visits={visits} />);
      expect(screen.getByText('completed')).toBeInTheDocument();
    });

    it('renders services with staff', () => {
      const visits = [createMockVisit({
        services: [
          { name: 'Massage', price: 80, staff: 'Alice' },
        ],
      })];
      render(<ClientJourneyTimeline {...defaultProps} visits={visits} />);
      expect(screen.getByText('Massage')).toBeInTheDocument();
      expect(screen.getByText('with Alice')).toBeInTheDocument();
      expect(screen.getByText('$80')).toBeInTheDocument();
    });

    it('renders multiple services', () => {
      const visits = [createMockVisit({
        services: [
          { name: 'Haircut', price: 35, staff: 'Jane' },
          { name: 'Color', price: 85, staff: 'Jane' },
        ],
      })];
      render(<ClientJourneyTimeline {...defaultProps} visits={visits} />);
      expect(screen.getByText('Haircut')).toBeInTheDocument();
      expect(screen.getByText('Color')).toBeInTheDocument();
    });

    it('renders visit notes', () => {
      const visits = [createMockVisit({ notes: 'Client prefers extra conditioner' })];
      render(<ClientJourneyTimeline {...defaultProps} visits={visits} />);
      expect(screen.getByText('"Client prefers extra conditioner"')).toBeInTheDocument();
    });

    it('does not render notes section when no notes', () => {
      const visits = [createMockVisit({ notes: undefined })];
      render(<ClientJourneyTimeline {...defaultProps} visits={visits} />);
      expect(screen.queryByText(/"/)).not.toBeInTheDocument();
    });
  });

  describe('visit status styling', () => {
    it('shows CheckCircle2 icon for completed visits', () => {
      const visits = [createMockVisit({ status: 'completed' })];
      const { container } = render(
        <ClientJourneyTimeline {...defaultProps} visits={visits} />
      );
      // Find timeline dot with brand color and verify it contains svg
      const timelineDot = container.querySelector('.bg-brand-100');
      expect(timelineDot?.querySelector('svg')).toBeInTheDocument();
    });

    it('shows AlertCircle icon for no-show visits', () => {
      const visits = [createMockVisit({ status: 'no-show' })];
      const { container } = render(
        <ClientJourneyTimeline {...defaultProps} visits={visits} />
      );
      // Find timeline dot with red color and verify it contains svg
      const timelineDot = container.querySelector('.bg-red-100');
      expect(timelineDot?.querySelector('svg')).toBeInTheDocument();
    });

    it('shows X symbol for cancelled visits', () => {
      const visits = [createMockVisit({ status: 'cancelled' })];
      render(<ClientJourneyTimeline {...defaultProps} visits={visits} />);
      expect(screen.getByText('✕')).toBeInTheDocument();
    });

    it('applies brand colors for completed visits', () => {
      const visits = [createMockVisit({ status: 'completed' })];
      const { container } = render(
        <ClientJourneyTimeline {...defaultProps} visits={visits} />
      );
      expect(container.querySelector('.bg-brand-100')).toBeInTheDocument();
      expect(container.querySelector('.border-brand-200')).toBeInTheDocument();
    });

    it('applies red colors for no-show visits', () => {
      const visits = [createMockVisit({ status: 'no-show' })];
      const { container } = render(
        <ClientJourneyTimeline {...defaultProps} visits={visits} />
      );
      expect(container.querySelector('.bg-red-100')).toBeInTheDocument();
      expect(container.querySelector('.border-red-200')).toBeInTheDocument();
    });
  });

  describe('visit sorting', () => {
    it('sorts visits by date (newest first)', () => {
      const visits = [
        createMockVisit({ id: 'oldest', date: new Date(2027, 4, 1) }),
        createMockVisit({ id: 'newest', date: new Date(2027, 5, 15) }),
        createMockVisit({ id: 'middle', date: new Date(2027, 5, 1) }),
      ];
      render(<ClientJourneyTimeline {...defaultProps} visits={visits} />);

      const dateElements = screen.getAllByText(/Jun|May/);
      // First should be Jun 15 (newest)
      expect(dateElements[0].textContent).toContain('Jun 15');
    });

    it('shows "Latest visit" label for newest visit', () => {
      const visits = [
        createMockVisit({ date: new Date(2027, 5, 15) }),
        createMockVisit({ date: new Date(2027, 5, 1) }),
      ];
      render(<ClientJourneyTimeline {...defaultProps} visits={visits} />);
      expect(screen.getByText('Latest visit')).toBeInTheDocument();
    });
  });

  describe('show more button', () => {
    it('shows "Show All" button when more than 5 visits', () => {
      const visits = Array.from({ length: 6 }, (_, i) =>
        createMockVisit({ id: `visit-${i}`, date: new Date(2027, 5, 15 - i) })
      );
      render(<ClientJourneyTimeline {...defaultProps} visits={visits} />);
      expect(screen.getByText('Show All 6 Visits')).toBeInTheDocument();
    });

    it('does not show "Show All" button when 5 or fewer visits', () => {
      const visits = Array.from({ length: 5 }, (_, i) =>
        createMockVisit({ id: `visit-${i}`, date: new Date(2027, 5, 15 - i) })
      );
      render(<ClientJourneyTimeline {...defaultProps} visits={visits} />);
      expect(screen.queryByText(/Show All/)).not.toBeInTheDocument();
    });
  });

  describe('date formatting', () => {
    it('formats date without year for current year', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2027, 5, 20));

      const visits = [createMockVisit({ date: new Date(2027, 5, 15) })];
      render(<ClientJourneyTimeline {...defaultProps} visits={visits} />);
      expect(screen.getByText('Jun 15')).toBeInTheDocument();

      vi.useRealTimers();
    });

    it('includes year for dates in different year', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2027, 5, 20));

      const visits = [createMockVisit({ date: new Date(2026, 11, 15) })];
      render(<ClientJourneyTimeline {...defaultProps} visits={visits} />);
      expect(screen.getByText(/Dec 15, 2026/)).toBeInTheDocument();

      vi.useRealTimers();
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <ClientJourneyTimeline {...defaultProps} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('has white background', () => {
      const { container } = render(<ClientJourneyTimeline {...defaultProps} />);
      expect(container.firstChild).toHaveClass('bg-white');
    });

    it('has rounded corners', () => {
      const { container } = render(<ClientJourneyTimeline {...defaultProps} />);
      expect(container.firstChild).toHaveClass('rounded-xl');
    });

    it('has shadow', () => {
      const { container } = render(<ClientJourneyTimeline {...defaultProps} />);
      expect(container.firstChild).toHaveClass('shadow-lg');
    });

    it('has border', () => {
      const { container } = render(<ClientJourneyTimeline {...defaultProps} />);
      expect(container.firstChild).toHaveClass('border', 'border-gray-200');
    });

    it('has 4-column grid for metrics', () => {
      const { container } = render(<ClientJourneyTimeline {...defaultProps} />);
      const grid = container.querySelector('.grid.grid-cols-4');
      expect(grid).toBeInTheDocument();
    });

    it('has blue gradient background for insights section', () => {
      const { container } = render(<ClientJourneyTimeline {...defaultProps} />);
      const insightsSection = container.querySelector('.from-blue-50.to-indigo-50');
      expect(insightsSection).toBeInTheDocument();
    });

    it('has timeline line', () => {
      const { container } = render(<ClientJourneyTimeline {...defaultProps} />);
      const timelineLine = container.querySelector('.w-0\\.5.bg-gray-200');
      expect(timelineLine).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('renders with no visits', () => {
      render(<ClientJourneyTimeline {...defaultProps} visits={[]} />);
      expect(screen.getByText('Visit History')).toBeInTheDocument();
    });

    it('shows 0 days since last visit for no visits', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2027, 5, 10));

      const insights = createMockInsights({ averageCycle: 21 });
      render(<ClientJourneyTimeline {...defaultProps} visits={[]} insights={insights} />);

      // Should not show overdue alert since daysSinceLastVisit is 0
      expect(screen.queryByText('Client is overdue for appointment')).not.toBeInTheDocument();

      vi.useRealTimers();
    });
  });
});
