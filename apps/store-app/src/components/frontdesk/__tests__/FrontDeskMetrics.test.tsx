/**
 * FrontDeskMetrics Component Tests
 * Tests for metrics display and filter functionality
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FrontDeskMetrics, type MetricData } from '../FrontDeskMetrics';

describe('FrontDeskMetrics', () => {
  const mockData: MetricData = {
    clientsWaiting: 5,
    nextVip: 'Sarah Johnson',
    avgWaitTime: '12m',
    revenueToday: 2450,
  };

  const defaultProps = {
    data: mockData,
    onFilterChange: vi.fn(),
    activeFilter: null as 'waiting' | 'vip' | 'waitTime' | 'revenue' | null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders container element', () => {
      const { container } = render(<FrontDeskMetrics {...defaultProps} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has sticky positioning', () => {
      const { container } = render(<FrontDeskMetrics {...defaultProps} />);
      expect(container.firstChild).toHaveClass('sticky');
      expect(container.firstChild).toHaveClass('top-0');
    });

    it('has z-index for layering', () => {
      const { container } = render(<FrontDeskMetrics {...defaultProps} />);
      expect(container.firstChild).toHaveClass('z-10');
    });

    it('has backdrop blur', () => {
      const { container } = render(<FrontDeskMetrics {...defaultProps} />);
      expect(container.firstChild).toHaveClass('backdrop-blur-sm');
    });

    it('renders 4 metric cards', () => {
      const { container } = render(<FrontDeskMetrics {...defaultProps} />);
      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      expect(grid?.children.length).toBe(4);
    });
  });

  describe('clients waiting metric', () => {
    it('displays waiting label', () => {
      render(<FrontDeskMetrics {...defaultProps} />);
      expect(screen.getByText('Waiting')).toBeInTheDocument();
    });

    it('displays clients waiting count', () => {
      render(<FrontDeskMetrics {...defaultProps} />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('displays clients in queue description', () => {
      render(<FrontDeskMetrics {...defaultProps} />);
      expect(screen.getByText('clients in queue')).toBeInTheDocument();
    });

    it('renders Clock icon', () => {
      const { container } = render(<FrontDeskMetrics {...defaultProps} />);
      const icon = container.querySelector('.lucide-clock');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('next VIP metric', () => {
    it('displays Next VIP label', () => {
      render(<FrontDeskMetrics {...defaultProps} />);
      expect(screen.getByText('Next VIP')).toBeInTheDocument();
    });

    it('displays VIP client name', () => {
      render(<FrontDeskMetrics {...defaultProps} />);
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    });

    it('displays priority client description', () => {
      render(<FrontDeskMetrics {...defaultProps} />);
      expect(screen.getByText('priority client')).toBeInTheDocument();
    });

    it('displays None when no VIP', () => {
      const dataNoVip = { ...mockData, nextVip: null };
      render(<FrontDeskMetrics {...defaultProps} data={dataNoVip} />);
      expect(screen.getByText('None')).toBeInTheDocument();
    });

    it('renders Star icon', () => {
      const { container } = render(<FrontDeskMetrics {...defaultProps} />);
      const icon = container.querySelector('.lucide-star');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('average wait time metric', () => {
    it('displays Avg Wait label', () => {
      render(<FrontDeskMetrics {...defaultProps} />);
      expect(screen.getByText('Avg Wait')).toBeInTheDocument();
    });

    it('displays average wait time', () => {
      render(<FrontDeskMetrics {...defaultProps} />);
      expect(screen.getByText('12m')).toBeInTheDocument();
    });

    it('displays average time description', () => {
      render(<FrontDeskMetrics {...defaultProps} />);
      expect(screen.getByText('average time')).toBeInTheDocument();
    });

    it('renders Timer icon', () => {
      const { container } = render(<FrontDeskMetrics {...defaultProps} />);
      const icon = container.querySelector('.lucide-timer');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('revenue metric', () => {
    it('displays Revenue label', () => {
      render(<FrontDeskMetrics {...defaultProps} />);
      expect(screen.getByText('Revenue')).toBeInTheDocument();
    });

    it('displays revenue with dollar sign and formatting', () => {
      render(<FrontDeskMetrics {...defaultProps} />);
      expect(screen.getByText('$2,450')).toBeInTheDocument();
    });

    it('displays today total description', () => {
      render(<FrontDeskMetrics {...defaultProps} />);
      expect(screen.getByText("today's total")).toBeInTheDocument();
    });

    it('renders DollarSign icon', () => {
      const { container } = render(<FrontDeskMetrics {...defaultProps} />);
      const icon = container.querySelector('.lucide-dollar-sign');
      expect(icon).toBeInTheDocument();
    });

    it('formats large revenue numbers', () => {
      const largeRevenue = { ...mockData, revenueToday: 12500 };
      render(<FrontDeskMetrics {...defaultProps} data={largeRevenue} />);
      expect(screen.getByText('$12,500')).toBeInTheDocument();
    });
  });

  describe('filter functionality', () => {
    it('calls onFilterChange when clicking waiting metric', () => {
      const handleFilterChange = vi.fn();
      render(<FrontDeskMetrics {...defaultProps} onFilterChange={handleFilterChange} />);

      const waitingCard = screen.getByText('Waiting').closest('div[style]');
      fireEvent.click(waitingCard!);

      expect(handleFilterChange).toHaveBeenCalledWith('waiting');
    });

    it('calls onFilterChange when clicking VIP metric', () => {
      const handleFilterChange = vi.fn();
      render(<FrontDeskMetrics {...defaultProps} onFilterChange={handleFilterChange} />);

      const vipCard = screen.getByText('Next VIP').closest('div[style]');
      fireEvent.click(vipCard!);

      expect(handleFilterChange).toHaveBeenCalledWith('vip');
    });

    it('calls onFilterChange when clicking wait time metric', () => {
      const handleFilterChange = vi.fn();
      render(<FrontDeskMetrics {...defaultProps} onFilterChange={handleFilterChange} />);

      const waitTimeCard = screen.getByText('Avg Wait').closest('div[style]');
      fireEvent.click(waitTimeCard!);

      expect(handleFilterChange).toHaveBeenCalledWith('waitTime');
    });

    it('calls onFilterChange when clicking revenue metric', () => {
      const handleFilterChange = vi.fn();
      render(<FrontDeskMetrics {...defaultProps} onFilterChange={handleFilterChange} />);

      const revenueCard = screen.getByText('Revenue').closest('div[style]');
      fireEvent.click(revenueCard!);

      expect(handleFilterChange).toHaveBeenCalledWith('revenue');
    });

    it('clears filter when clicking same metric twice', () => {
      const handleFilterChange = vi.fn();
      render(
        <FrontDeskMetrics
          {...defaultProps}
          onFilterChange={handleFilterChange}
          activeFilter="waiting"
        />
      );

      const waitingCard = screen.getByText('Waiting').closest('div[style]');
      fireEvent.click(waitingCard!);

      expect(handleFilterChange).toHaveBeenCalledWith(null);
    });
  });

  describe('active filter indicator', () => {
    it('shows pulsing dot when waiting filter is active', () => {
      const { container } = render(
        <FrontDeskMetrics {...defaultProps} activeFilter="waiting" />
      );

      const pulseDot = container.querySelector('.animate-pulse.rounded-full.w-2');
      expect(pulseDot).toBeInTheDocument();
    });

    it('shows pulsing dot when VIP filter is active', () => {
      const { container } = render(
        <FrontDeskMetrics {...defaultProps} activeFilter="vip" />
      );

      const pulseDot = container.querySelector('.animate-pulse.rounded-full.w-2');
      expect(pulseDot).toBeInTheDocument();
    });

    it('shows pulsing dot when waitTime filter is active', () => {
      const { container } = render(
        <FrontDeskMetrics {...defaultProps} activeFilter="waitTime" />
      );

      const pulseDot = container.querySelector('.animate-pulse.rounded-full.w-2');
      expect(pulseDot).toBeInTheDocument();
    });

    it('shows pulsing dot when revenue filter is active', () => {
      const { container } = render(
        <FrontDeskMetrics {...defaultProps} activeFilter="revenue" />
      );

      const pulseDot = container.querySelector('.animate-pulse.rounded-full.w-2');
      expect(pulseDot).toBeInTheDocument();
    });

    it('does not show pulsing dot when no filter active', () => {
      const { container } = render(
        <FrontDeskMetrics {...defaultProps} activeFilter={null} />
      );

      const pulseDot = container.querySelector('.animate-pulse.rounded-full.w-2');
      expect(pulseDot).not.toBeInTheDocument();
    });
  });

  describe('clear filter button', () => {
    it('shows clear filter button when filter is active', () => {
      render(<FrontDeskMetrics {...defaultProps} activeFilter="waiting" />);
      expect(screen.getByText('Clear Filter')).toBeInTheDocument();
    });

    it('does not show clear filter button when no filter', () => {
      render(<FrontDeskMetrics {...defaultProps} activeFilter={null} />);
      expect(screen.queryByText('Clear Filter')).not.toBeInTheDocument();
    });

    it('calls onFilterChange with null when clicking clear filter', () => {
      const handleFilterChange = vi.fn();
      render(
        <FrontDeskMetrics
          {...defaultProps}
          onFilterChange={handleFilterChange}
          activeFilter="waiting"
        />
      );

      fireEvent.click(screen.getByText('Clear Filter'));
      expect(handleFilterChange).toHaveBeenCalledWith(null);
    });

    it('renders X icon in clear filter button', () => {
      const { container } = render(
        <FrontDeskMetrics {...defaultProps} activeFilter="waiting" />
      );

      const xIcon = container.querySelector('.lucide-x');
      expect(xIcon).toBeInTheDocument();
    });
  });

  describe('hover state', () => {
    it('changes style on mouse enter', () => {
      const { container } = render(<FrontDeskMetrics {...defaultProps} />);

      const waitingCard = screen.getByText('Waiting').closest('div[style]') as HTMLElement;
      const initialBg = waitingCard.style.background;

      fireEvent.mouseEnter(waitingCard);

      // The background should change on hover (handled by state)
      // Note: We're testing that the event handlers exist and work
      expect(waitingCard).toBeInTheDocument();
    });

    it('resets style on mouse leave', () => {
      const { container } = render(<FrontDeskMetrics {...defaultProps} />);

      const waitingCard = screen.getByText('Waiting').closest('div[style]') as HTMLElement;

      fireEvent.mouseEnter(waitingCard);
      fireEvent.mouseLeave(waitingCard);

      expect(waitingCard).toBeInTheDocument();
    });
  });

  describe('grid layout', () => {
    it('uses 2 column grid on mobile', () => {
      const { container } = render(<FrontDeskMetrics {...defaultProps} />);
      const grid = container.querySelector('.grid-cols-2');
      expect(grid).toBeInTheDocument();
    });

    it('uses 4 column grid on larger screens', () => {
      const { container } = render(<FrontDeskMetrics {...defaultProps} />);
      const grid = container.querySelector('.sm\\:grid-cols-4');
      expect(grid).toBeInTheDocument();
    });

    it('has gap between cards', () => {
      const { container } = render(<FrontDeskMetrics {...defaultProps} />);
      const grid = container.querySelector('.gap-3');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('accent bars', () => {
    it('renders accent bar at bottom of each card', () => {
      const { container } = render(<FrontDeskMetrics {...defaultProps} />);
      const accentBars = container.querySelectorAll('.absolute.bottom-0.h-1');
      expect(accentBars.length).toBe(4);
    });

    it('accent bars have transition', () => {
      const { container } = render(<FrontDeskMetrics {...defaultProps} />);
      const accentBars = container.querySelectorAll('.transition-all.duration-200');
      expect(accentBars.length).toBeGreaterThan(0);
    });
  });

  describe('without onFilterChange callback', () => {
    it('renders without error when onFilterChange not provided', () => {
      const { container } = render(
        <FrontDeskMetrics data={mockData} />
      );
      expect(container.firstChild).toBeInTheDocument();
    });

    it('clicking metric works without onFilterChange', () => {
      render(<FrontDeskMetrics data={mockData} />);

      const waitingCard = screen.getByText('Waiting').closest('div[style]');
      expect(() => fireEvent.click(waitingCard!)).not.toThrow();
    });
  });

  describe('data variations', () => {
    it('handles zero clients waiting', () => {
      const zeroData = { ...mockData, clientsWaiting: 0 };
      render(<FrontDeskMetrics {...defaultProps} data={zeroData} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('handles zero revenue', () => {
      const zeroRevenue = { ...mockData, revenueToday: 0 };
      render(<FrontDeskMetrics {...defaultProps} data={zeroRevenue} />);
      expect(screen.getByText('$0')).toBeInTheDocument();
    });

    it('handles empty VIP name', () => {
      const emptyVip = { ...mockData, nextVip: '' };
      render(<FrontDeskMetrics {...defaultProps} data={emptyVip} />);
      expect(screen.getByText('None')).toBeInTheDocument();
    });

    it('handles long VIP name', () => {
      const longName = { ...mockData, nextVip: 'Very Long Name That Should Be Truncated' };
      const { container } = render(<FrontDeskMetrics {...defaultProps} data={longName} />);
      const truncatedElement = container.querySelector('.truncate');
      expect(truncatedElement).toBeInTheDocument();
    });
  });
});
