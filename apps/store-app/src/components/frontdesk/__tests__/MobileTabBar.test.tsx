/**
 * MobileTabBar Component Tests
 * Tests for mobile tab bar navigation and active states
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileTabBar, tabColors, type MobileTab } from '../MobileTabBar';

// Mock haptics
vi.mock('../../../utils/haptics', () => ({
  haptics: {
    selection: vi.fn(),
  },
}));

describe('MobileTabBar', () => {
  const mockTabs: MobileTab[] = [
    {
      id: 'service',
      label: 'In Service',
      shortLabel: 'Service',
      icon: 'service',
      metrics: { count: 3 },
      color: tabColors.service,
    },
    {
      id: 'waiting',
      label: 'Waiting',
      icon: 'waiting',
      metrics: { count: 5, urgent: true },
      color: tabColors.waiting,
    },
    {
      id: 'appointments',
      label: 'Appointments',
      shortLabel: 'Appts',
      icon: 'appointments',
      metrics: { count: 8, secondary: '12m avg' },
      color: tabColors.appointments,
    },
    {
      id: 'team',
      label: 'Team',
      icon: 'team',
      metrics: { count: 4 },
      color: tabColors.team,
    },
  ];

  const defaultProps = {
    tabs: mockTabs,
    activeTab: 'service',
    onTabChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders container element', () => {
      const { container } = render(<MobileTabBar {...defaultProps} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders tablist role', () => {
      render(<MobileTabBar {...defaultProps} />);
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('renders all tabs', () => {
      render(<MobileTabBar {...defaultProps} />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBe(4);
    });

    it('has gray background', () => {
      const { container } = render(<MobileTabBar {...defaultProps} />);
      expect(container.firstChild).toHaveClass('bg-gray-50');
    });

    it('has bottom border', () => {
      const { container } = render(<MobileTabBar {...defaultProps} />);
      expect(container.firstChild).toHaveClass('border-b');
    });
  });

  describe('tab content', () => {
    it('displays tab labels', () => {
      render(<MobileTabBar {...defaultProps} />);
      expect(screen.getByText('Service')).toBeInTheDocument();
      expect(screen.getByText('Waiting')).toBeInTheDocument();
      expect(screen.getByText('Appts')).toBeInTheDocument();
      expect(screen.getByText('Team')).toBeInTheDocument();
    });

    it('displays metric counts', () => {
      render(<MobileTabBar {...defaultProps} />);
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('uses shortLabel when provided', () => {
      render(<MobileTabBar {...defaultProps} />);
      // Service tab has shortLabel="Service" instead of "In Service"
      expect(screen.getByText('Service')).toBeInTheDocument();
      expect(screen.queryByText('In Service')).not.toBeInTheDocument();
    });

    it('uses label when shortLabel not provided', () => {
      render(<MobileTabBar {...defaultProps} />);
      // Waiting tab has no shortLabel, so uses label
      expect(screen.getByText('Waiting')).toBeInTheDocument();
    });
  });

  describe('icons', () => {
    it('renders FileText icon for service tab', () => {
      const { container } = render(<MobileTabBar {...defaultProps} />);
      const icon = container.querySelector('.lucide-file-text');
      expect(icon).toBeInTheDocument();
    });

    it('renders Users icon for waiting tab', () => {
      const { container } = render(<MobileTabBar {...defaultProps} />);
      const icon = container.querySelector('.lucide-users');
      expect(icon).toBeInTheDocument();
    });

    it('renders Calendar icon for appointments tab', () => {
      const { container } = render(<MobileTabBar {...defaultProps} />);
      const icon = container.querySelector('.lucide-calendar');
      expect(icon).toBeInTheDocument();
    });

    it('renders UserCircle icon for team tab', () => {
      const { container } = render(<MobileTabBar {...defaultProps} />);
      const icon = container.querySelector('.lucide-user-circle, .lucide-circle-user');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('active state', () => {
    it('marks active tab with aria-selected=true', () => {
      render(<MobileTabBar {...defaultProps} activeTab="service" />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    });

    it('marks inactive tabs with aria-selected=false', () => {
      render(<MobileTabBar {...defaultProps} activeTab="service" />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
      expect(tabs[2]).toHaveAttribute('aria-selected', 'false');
      expect(tabs[3]).toHaveAttribute('aria-selected', 'false');
    });

    it('active tab has white background', () => {
      render(<MobileTabBar {...defaultProps} activeTab="service" />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs[0]).toHaveClass('bg-white');
    });

    it('active tab has shadow', () => {
      render(<MobileTabBar {...defaultProps} activeTab="service" />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs[0]).toHaveClass('shadow-sm');
    });

    it('active tab has border', () => {
      render(<MobileTabBar {...defaultProps} activeTab="service" />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs[0]).toHaveClass('border');
    });

    it('inactive tabs have gray text', () => {
      render(<MobileTabBar {...defaultProps} activeTab="service" />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs[1]).toHaveClass('text-gray-500');
    });
  });

  describe('tab selection', () => {
    it('calls onTabChange when clicking a tab', () => {
      const handleTabChange = vi.fn();
      render(<MobileTabBar {...defaultProps} onTabChange={handleTabChange} />);

      const tabs = screen.getAllByRole('tab');
      fireEvent.click(tabs[1]); // Click waiting tab

      expect(handleTabChange).toHaveBeenCalledTimes(1);
      expect(handleTabChange).toHaveBeenCalledWith('waiting');
    });

    it('calls onTabChange with correct tab id', () => {
      const handleTabChange = vi.fn();
      render(<MobileTabBar {...defaultProps} onTabChange={handleTabChange} />);

      fireEvent.click(screen.getAllByRole('tab')[2]); // Click appointments
      expect(handleTabChange).toHaveBeenCalledWith('appointments');

      fireEvent.click(screen.getAllByRole('tab')[3]); // Click team
      expect(handleTabChange).toHaveBeenCalledWith('team');
    });
  });

  describe('urgent indicator', () => {
    it('shows urgent indicator for tabs with urgent=true', () => {
      const { container } = render(<MobileTabBar {...defaultProps} />);
      // Waiting tab has urgent: true
      const urgentIndicator = container.querySelector('.bg-red-500.rounded-full.animate-pulse');
      expect(urgentIndicator).toBeInTheDocument();
    });

    it('does not show urgent indicator for non-urgent tabs', () => {
      const nonUrgentTabs: MobileTab[] = [
        {
          id: 'test',
          label: 'Test',
          icon: 'service',
          metrics: { count: 1, urgent: false },
          color: tabColors.service,
        },
      ];

      const { container } = render(
        <MobileTabBar tabs={nonUrgentTabs} activeTab="test" onTabChange={vi.fn()} />
      );

      const urgentIndicator = container.querySelector('.bg-red-500.rounded-full.animate-pulse');
      expect(urgentIndicator).not.toBeInTheDocument();
    });
  });

  describe('keyboard navigation', () => {
    it('moves focus right on ArrowRight', () => {
      const handleTabChange = vi.fn();
      render(<MobileTabBar {...defaultProps} activeTab="service" onTabChange={handleTabChange} />);

      const tabs = screen.getAllByRole('tab');
      tabs[0].focus();

      fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });

      expect(handleTabChange).toHaveBeenCalledWith('waiting');
    });

    it('moves focus left on ArrowLeft', () => {
      const handleTabChange = vi.fn();
      render(<MobileTabBar {...defaultProps} activeTab="waiting" onTabChange={handleTabChange} />);

      const tabs = screen.getAllByRole('tab');
      tabs[1].focus();

      fireEvent.keyDown(tabs[1], { key: 'ArrowLeft' });

      expect(handleTabChange).toHaveBeenCalledWith('service');
    });

    it('wraps to first tab when pressing ArrowRight on last tab', () => {
      const handleTabChange = vi.fn();
      render(<MobileTabBar {...defaultProps} activeTab="team" onTabChange={handleTabChange} />);

      const tabs = screen.getAllByRole('tab');
      tabs[3].focus();

      fireEvent.keyDown(tabs[3], { key: 'ArrowRight' });

      expect(handleTabChange).toHaveBeenCalledWith('service');
    });

    it('wraps to last tab when pressing ArrowLeft on first tab', () => {
      const handleTabChange = vi.fn();
      render(<MobileTabBar {...defaultProps} activeTab="service" onTabChange={handleTabChange} />);

      const tabs = screen.getAllByRole('tab');
      tabs[0].focus();

      fireEvent.keyDown(tabs[0], { key: 'ArrowLeft' });

      expect(handleTabChange).toHaveBeenCalledWith('team');
    });

    it('moves to first tab on Home key', () => {
      const handleTabChange = vi.fn();
      render(<MobileTabBar {...defaultProps} activeTab="team" onTabChange={handleTabChange} />);

      const tabs = screen.getAllByRole('tab');
      tabs[3].focus();

      fireEvent.keyDown(tabs[3], { key: 'Home' });

      expect(handleTabChange).toHaveBeenCalledWith('service');
    });

    it('moves to last tab on End key', () => {
      const handleTabChange = vi.fn();
      render(<MobileTabBar {...defaultProps} activeTab="service" onTabChange={handleTabChange} />);

      const tabs = screen.getAllByRole('tab');
      tabs[0].focus();

      fireEvent.keyDown(tabs[0], { key: 'End' });

      expect(handleTabChange).toHaveBeenCalledWith('team');
    });

    it('ignores other keys', () => {
      const handleTabChange = vi.fn();
      render(<MobileTabBar {...defaultProps} activeTab="service" onTabChange={handleTabChange} />);

      const tabs = screen.getAllByRole('tab');
      fireEvent.keyDown(tabs[0], { key: 'Enter' });

      expect(handleTabChange).not.toHaveBeenCalled();
    });
  });

  describe('tabindex management', () => {
    it('active tab has tabIndex=0', () => {
      render(<MobileTabBar {...defaultProps} activeTab="service" />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs[0]).toHaveAttribute('tabIndex', '0');
    });

    it('inactive tabs have tabIndex=-1', () => {
      render(<MobileTabBar {...defaultProps} activeTab="service" />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs[1]).toHaveAttribute('tabIndex', '-1');
      expect(tabs[2]).toHaveAttribute('tabIndex', '-1');
      expect(tabs[3]).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('loading state', () => {
    it('renders skeleton when isLoading=true', () => {
      const { container } = render(
        <MobileTabBar {...defaultProps} isLoading={true} />
      );

      // Should have skeleton elements with animate-pulse
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('does not render tabs when loading', () => {
      render(<MobileTabBar {...defaultProps} isLoading={true} />);

      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
      expect(screen.queryAllByRole('tab').length).toBe(0);
    });

    it('renders default 4 skeletons', () => {
      const { container } = render(
        <MobileTabBar {...defaultProps} isLoading={true} />
      );

      const skeletonGroups = container.querySelectorAll('.animate-pulse');
      expect(skeletonGroups.length).toBe(4);
    });

    it('renders custom skeleton count', () => {
      const { container } = render(
        <MobileTabBar {...defaultProps} isLoading={true} skeletonCount={3} />
      );

      const skeletonGroups = container.querySelectorAll('.animate-pulse');
      expect(skeletonGroups.length).toBe(3);
    });

    it('skeleton has icon placeholder', () => {
      const { container } = render(
        <MobileTabBar {...defaultProps} isLoading={true} skeletonCount={1} />
      );

      const iconPlaceholder = container.querySelector('.w-4.h-4.bg-gray-200');
      expect(iconPlaceholder).toBeInTheDocument();
    });

    it('skeleton has badge placeholder', () => {
      const { container } = render(
        <MobileTabBar {...defaultProps} isLoading={true} skeletonCount={1} />
      );

      const badgePlaceholder = container.querySelector('.w-5.h-5.bg-gray-200.rounded-full');
      expect(badgePlaceholder).toBeInTheDocument();
    });
  });

  describe('custom className', () => {
    it('applies custom className', () => {
      const { container } = render(
        <MobileTabBar {...defaultProps} className="custom-tabbar-class" />
      );
      expect(container.firstChild).toHaveClass('custom-tabbar-class');
    });
  });

  describe('styling', () => {
    it('tabs have minimum height for touch', () => {
      render(<MobileTabBar {...defaultProps} />);
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveClass('min-h-[44px]');
      });
    });

    it('tabs have focus styling', () => {
      render(<MobileTabBar {...defaultProps} />);
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveClass('focus:outline-none');
        expect(tab).toHaveClass('focus-visible:ring-2');
      });
    });

    it('tabs have transition', () => {
      render(<MobileTabBar {...defaultProps} />);
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveClass('transition-all');
      });
    });

    it('count badge has rounded-full', () => {
      const { container } = render(<MobileTabBar {...defaultProps} />);
      const badges = container.querySelectorAll('.rounded-full.min-w-\\[20px\\]');
      expect(badges.length).toBe(4);
    });
  });

  describe('tabColors export', () => {
    it('exports service colors', () => {
      expect(tabColors.service).toEqual({
        active: 'bg-white',
        text: 'text-gray-900',
        badge: 'bg-gray-200',
      });
    });

    it('exports waiting colors', () => {
      expect(tabColors.waiting).toEqual({
        active: 'bg-white',
        text: 'text-gray-900',
        badge: 'bg-gray-200',
      });
    });

    it('exports appointments colors', () => {
      expect(tabColors.appointments).toEqual({
        active: 'bg-white',
        text: 'text-gray-900',
        badge: 'bg-gray-200',
      });
    });

    it('exports team colors', () => {
      expect(tabColors.team).toEqual({
        active: 'bg-white',
        text: 'text-gray-900',
        badge: 'bg-gray-200',
      });
    });
  });
});
