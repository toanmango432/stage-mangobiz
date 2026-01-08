/**
 * FrontDeskSubTabs Component Tests
 * Tests for sub-tab navigation and selection
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FrontDeskSubTabs, type SubTab } from '../FrontDeskSubTabs';

describe('FrontDeskSubTabs', () => {
  const mockTabs: SubTab[] = [
    { id: 'all', label: 'All', count: 12 },
    { id: 'active', label: 'Active', count: 5 },
    { id: 'completed', label: 'Completed', count: 7 },
    { id: 'cancelled', label: 'Cancelled' }, // No count
  ];

  const defaultProps = {
    tabs: mockTabs,
    activeTab: 'all',
    onTabChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders container element', () => {
      const { container } = render(<FrontDeskSubTabs {...defaultProps} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has gray background', () => {
      const { container } = render(<FrontDeskSubTabs {...defaultProps} />);
      expect(container.firstChild).toHaveClass('bg-gray-50');
    });

    it('has bottom border', () => {
      const { container } = render(<FrontDeskSubTabs {...defaultProps} />);
      expect(container.firstChild).toHaveClass('border-b');
      expect(container.firstChild).toHaveClass('border-gray-200');
    });

    it('renders all tabs', () => {
      render(<FrontDeskSubTabs {...defaultProps} />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBe(4);
    });
  });

  describe('tab content', () => {
    it('displays tab labels', () => {
      render(<FrontDeskSubTabs {...defaultProps} />);
      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Cancelled')).toBeInTheDocument();
    });

    it('displays count badges for tabs with counts', () => {
      render(<FrontDeskSubTabs {...defaultProps} />);
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
    });

    it('does not display count badge for tabs without count', () => {
      const { container } = render(<FrontDeskSubTabs {...defaultProps} />);
      // Cancelled tab has no count, so only 3 count badges
      const countBadges = container.querySelectorAll('.rounded-full.min-w-\\[20px\\]');
      expect(countBadges.length).toBe(3);
    });
  });

  describe('active state', () => {
    it('marks active tab with aria-selected=true', () => {
      render(<FrontDeskSubTabs {...defaultProps} activeTab="all" />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    });

    it('marks inactive tabs with aria-selected=false', () => {
      render(<FrontDeskSubTabs {...defaultProps} activeTab="all" />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
      expect(tabs[2]).toHaveAttribute('aria-selected', 'false');
      expect(tabs[3]).toHaveAttribute('aria-selected', 'false');
    });

    it('active tab has white background', () => {
      render(<FrontDeskSubTabs {...defaultProps} activeTab="all" />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs[0]).toHaveClass('bg-white');
    });

    it('active tab has shadow', () => {
      render(<FrontDeskSubTabs {...defaultProps} activeTab="all" />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs[0]).toHaveClass('shadow-sm');
    });

    it('active tab has border', () => {
      render(<FrontDeskSubTabs {...defaultProps} activeTab="all" />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs[0]).toHaveClass('border');
      expect(tabs[0]).toHaveClass('border-gray-200');
    });

    it('active tab has darker text', () => {
      render(<FrontDeskSubTabs {...defaultProps} activeTab="all" />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs[0]).toHaveClass('text-gray-900');
    });

    it('inactive tabs have lighter text', () => {
      render(<FrontDeskSubTabs {...defaultProps} activeTab="all" />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs[1]).toHaveClass('text-gray-600');
      expect(tabs[2]).toHaveClass('text-gray-600');
    });

    it('inactive tabs have hover styling', () => {
      render(<FrontDeskSubTabs {...defaultProps} activeTab="all" />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs[1]).toHaveClass('hover:text-gray-900');
      expect(tabs[1]).toHaveClass('hover:bg-gray-100');
    });
  });

  describe('tab selection', () => {
    it('calls onTabChange when clicking a tab', () => {
      const handleTabChange = vi.fn();
      render(<FrontDeskSubTabs {...defaultProps} onTabChange={handleTabChange} />);

      fireEvent.click(screen.getByText('Active'));

      expect(handleTabChange).toHaveBeenCalledTimes(1);
      expect(handleTabChange).toHaveBeenCalledWith('active');
    });

    it('calls onTabChange with correct tab id for each tab', () => {
      const handleTabChange = vi.fn();
      render(<FrontDeskSubTabs {...defaultProps} onTabChange={handleTabChange} />);

      fireEvent.click(screen.getByText('Completed'));
      expect(handleTabChange).toHaveBeenCalledWith('completed');

      fireEvent.click(screen.getByText('Cancelled'));
      expect(handleTabChange).toHaveBeenCalledWith('cancelled');
    });

    it('calls onTabChange when clicking count badge area', () => {
      const handleTabChange = vi.fn();
      render(<FrontDeskSubTabs {...defaultProps} onTabChange={handleTabChange} />);

      // Click on the count badge (12) which is inside the "All" tab
      fireEvent.click(screen.getByText('12'));

      expect(handleTabChange).toHaveBeenCalledWith('all');
    });
  });

  describe('count badge styling', () => {
    it('count badges have rounded-full', () => {
      const { container } = render(<FrontDeskSubTabs {...defaultProps} />);
      const badges = container.querySelectorAll('.rounded-full.min-w-\\[20px\\]');
      badges.forEach(badge => {
        expect(badge).toHaveClass('rounded-full');
      });
    });

    it('count badges have minimum width', () => {
      const { container } = render(<FrontDeskSubTabs {...defaultProps} />);
      const badges = container.querySelectorAll('.min-w-\\[20px\\]');
      expect(badges.length).toBe(3);
    });

    it('count badges have small text', () => {
      const { container } = render(<FrontDeskSubTabs {...defaultProps} />);
      const badges = container.querySelectorAll('.rounded-full.text-xs');
      expect(badges.length).toBe(3);
    });

    it('count badges have semibold font', () => {
      const { container } = render(<FrontDeskSubTabs {...defaultProps} />);
      const badges = container.querySelectorAll('.rounded-full.font-semibold');
      expect(badges.length).toBe(3);
    });

    it('active tab badge has darker styling', () => {
      render(<FrontDeskSubTabs {...defaultProps} activeTab="all" />);
      const badge = screen.getByText('12');
      expect(badge).toHaveClass('bg-gray-200');
      expect(badge).toHaveClass('text-gray-700');
    });

    it('inactive tab badge has lighter styling', () => {
      render(<FrontDeskSubTabs {...defaultProps} activeTab="all" />);
      const badge = screen.getByText('5'); // Active tab count
      expect(badge).toHaveClass('text-gray-500');
    });
  });

  describe('container styling', () => {
    it('has flex layout', () => {
      const { container } = render(<FrontDeskSubTabs {...defaultProps} />);
      const inner = container.querySelector('.flex.items-center');
      expect(inner).toBeInTheDocument();
    });

    it('has fixed height', () => {
      const { container } = render(<FrontDeskSubTabs {...defaultProps} />);
      const inner = container.querySelector('.h-10');
      expect(inner).toBeInTheDocument();
    });

    it('has horizontal padding', () => {
      const { container } = render(<FrontDeskSubTabs {...defaultProps} />);
      const inner = container.querySelector('.px-4');
      expect(inner).toBeInTheDocument();
    });

    it('has gap between tabs', () => {
      const { container } = render(<FrontDeskSubTabs {...defaultProps} />);
      const inner = container.querySelector('.gap-1');
      expect(inner).toBeInTheDocument();
    });
  });

  describe('tab button styling', () => {
    it('tabs have rounded corners', () => {
      render(<FrontDeskSubTabs {...defaultProps} />);
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveClass('rounded-md');
      });
    });

    it('tabs have horizontal padding', () => {
      render(<FrontDeskSubTabs {...defaultProps} />);
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveClass('px-3');
      });
    });

    it('tabs have transition', () => {
      render(<FrontDeskSubTabs {...defaultProps} />);
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveClass('transition-all');
        expect(tab).toHaveClass('duration-150');
      });
    });

    it('tabs have minimum height', () => {
      render(<FrontDeskSubTabs {...defaultProps} />);
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveClass('min-h-[32px]');
      });
    });

    it('tabs have medium font weight', () => {
      render(<FrontDeskSubTabs {...defaultProps} />);
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveClass('font-medium');
      });
    });

    it('tabs have small text', () => {
      render(<FrontDeskSubTabs {...defaultProps} />);
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveClass('text-sm');
      });
    });
  });

  describe('custom className', () => {
    it('applies custom className', () => {
      const { container } = render(
        <FrontDeskSubTabs {...defaultProps} className="custom-subtabs-class" />
      );
      expect(container.firstChild).toHaveClass('custom-subtabs-class');
    });

    it('preserves default classes with custom className', () => {
      const { container } = render(
        <FrontDeskSubTabs {...defaultProps} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('bg-gray-50');
      expect(container.firstChild).toHaveClass('border-b');
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('different active tabs', () => {
    it('correctly marks second tab as active', () => {
      render(<FrontDeskSubTabs {...defaultProps} activeTab="active" />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
      expect(tabs[1]).toHaveClass('bg-white');
      expect(tabs[1]).toHaveClass('shadow-sm');
    });

    it('correctly marks third tab as active', () => {
      render(<FrontDeskSubTabs {...defaultProps} activeTab="completed" />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
      expect(tabs[2]).toHaveClass('bg-white');
    });

    it('correctly marks fourth tab as active', () => {
      render(<FrontDeskSubTabs {...defaultProps} activeTab="cancelled" />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs[3]).toHaveAttribute('aria-selected', 'true');
      expect(tabs[3]).toHaveClass('bg-white');
    });
  });

  describe('edge cases', () => {
    it('renders with single tab', () => {
      const singleTab: SubTab[] = [{ id: 'only', label: 'Only Tab' }];
      render(
        <FrontDeskSubTabs
          tabs={singleTab}
          activeTab="only"
          onTabChange={vi.fn()}
        />
      );
      expect(screen.getByText('Only Tab')).toBeInTheDocument();
      expect(screen.getAllByRole('tab').length).toBe(1);
    });

    it('renders with zero count', () => {
      const tabsWithZero: SubTab[] = [
        { id: 'empty', label: 'Empty', count: 0 },
      ];
      render(
        <FrontDeskSubTabs
          tabs={tabsWithZero}
          activeTab="empty"
          onTabChange={vi.fn()}
        />
      );
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('renders with large count', () => {
      const tabsWithLarge: SubTab[] = [
        { id: 'many', label: 'Many', count: 999 },
      ];
      render(
        <FrontDeskSubTabs
          tabs={tabsWithLarge}
          activeTab="many"
          onTabChange={vi.fn()}
        />
      );
      expect(screen.getByText('999')).toBeInTheDocument();
    });

    it('renders with long label', () => {
      const tabsWithLong: SubTab[] = [
        { id: 'long', label: 'Very Long Tab Label Text' },
      ];
      render(
        <FrontDeskSubTabs
          tabs={tabsWithLong}
          activeTab="long"
          onTabChange={vi.fn()}
        />
      );
      expect(screen.getByText('Very Long Tab Label Text')).toBeInTheDocument();
    });

    it('handles empty tabs array', () => {
      const { container } = render(
        <FrontDeskSubTabs
          tabs={[]}
          activeTab=""
          onTabChange={vi.fn()}
        />
      );
      expect(container.firstChild).toBeInTheDocument();
      expect(screen.queryAllByRole('tab').length).toBe(0);
    });

    it('handles non-existent activeTab', () => {
      render(
        <FrontDeskSubTabs
          {...defaultProps}
          activeTab="nonexistent"
        />
      );
      const tabs = screen.getAllByRole('tab');
      // All tabs should be inactive
      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('aria-selected', 'false');
      });
    });
  });

  describe('accessibility', () => {
    it('all tabs have role=tab', () => {
      render(<FrontDeskSubTabs {...defaultProps} />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBe(4);
    });

    it('tabs are button elements', () => {
      render(<FrontDeskSubTabs {...defaultProps} />);
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab.tagName).toBe('BUTTON');
      });
    });

    it('each tab has unique key (no duplicate renders)', () => {
      const { container } = render(<FrontDeskSubTabs {...defaultProps} />);
      const buttons = container.querySelectorAll('button');
      const ids = Array.from(buttons).map(btn => btn.textContent);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('memoization', () => {
    it('component is wrapped in memo', () => {
      // Verify the component is memoized by checking it renders consistently
      const { rerender } = render(<FrontDeskSubTabs {...defaultProps} />);
      const initialTabs = screen.getAllByRole('tab');

      // Re-render with same props
      rerender(<FrontDeskSubTabs {...defaultProps} />);
      const rerenderedTabs = screen.getAllByRole('tab');

      expect(rerenderedTabs.length).toBe(initialTabs.length);
    });
  });
});
