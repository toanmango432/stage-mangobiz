/**
 * QuickActionsBar Component Tests
 * Tests for quick action buttons and callback handlers
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuickActionsBar } from '../QuickActionsBar';

describe('QuickActionsBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders container element', () => {
      const { container } = render(<QuickActionsBar />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has fixed positioning', () => {
      const { container } = render(<QuickActionsBar />);
      expect(container.firstChild).toHaveClass('fixed');
    });

    it('is positioned at bottom center', () => {
      const { container } = render(<QuickActionsBar />);
      expect(container.firstChild).toHaveClass('bottom-6');
      expect(container.firstChild).toHaveClass('left-1/2');
      expect(container.firstChild).toHaveClass('-translate-x-1/2');
    });

    it('has backdrop blur effect', () => {
      const { container } = render(<QuickActionsBar />);
      expect(container.firstChild).toHaveClass('backdrop-blur-lg');
    });

    it('renders dividers', () => {
      render(
        <QuickActionsBar
          onNewAppointment={() => {}}
          onSearch={() => {}}
          onOpenCommandPalette={() => {}}
        />
      );
      const dividers = document.querySelectorAll('.bg-gray-200.h-8');
      expect(dividers.length).toBeGreaterThan(0);
    });
  });

  describe('new appointment button', () => {
    it('does not render when callback not provided', () => {
      render(<QuickActionsBar />);
      expect(screen.queryByLabelText('Create new appointment')).not.toBeInTheDocument();
    });

    it('renders when callback provided', () => {
      render(<QuickActionsBar onNewAppointment={() => {}} />);
      expect(screen.getByLabelText('Create new appointment')).toBeInTheDocument();
    });

    it('calls onNewAppointment when clicked', () => {
      const handleNewAppointment = vi.fn();
      render(<QuickActionsBar onNewAppointment={handleNewAppointment} />);

      fireEvent.click(screen.getByLabelText('Create new appointment'));
      expect(handleNewAppointment).toHaveBeenCalledTimes(1);
    });

    it('has gradient background styling', () => {
      render(<QuickActionsBar onNewAppointment={() => {}} />);
      const button = screen.getByLabelText('Create new appointment');
      expect(button).toHaveClass('bg-gradient-to-r');
    });

    it('displays "New" text label', () => {
      render(<QuickActionsBar onNewAppointment={() => {}} />);
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('has title tooltip', () => {
      render(<QuickActionsBar onNewAppointment={() => {}} />);
      expect(screen.getByTitle('New Appointment')).toBeInTheDocument();
    });
  });

  describe('search button', () => {
    it('does not render when callback not provided', () => {
      render(<QuickActionsBar />);
      expect(screen.queryByLabelText('Search appointments')).not.toBeInTheDocument();
    });

    it('renders when callback provided', () => {
      render(<QuickActionsBar onSearch={() => {}} />);
      expect(screen.getByLabelText('Search appointments')).toBeInTheDocument();
    });

    it('calls onSearch when clicked', () => {
      const handleSearch = vi.fn();
      render(<QuickActionsBar onSearch={handleSearch} />);

      fireEvent.click(screen.getByLabelText('Search appointments'));
      expect(handleSearch).toHaveBeenCalledTimes(1);
    });

    it('has title tooltip', () => {
      render(<QuickActionsBar onSearch={() => {}} />);
      expect(screen.getByTitle('Search Appointments')).toBeInTheDocument();
    });
  });

  describe('refresh button', () => {
    it('does not render when callback not provided', () => {
      render(<QuickActionsBar />);
      expect(screen.queryByLabelText('Refresh calendar')).not.toBeInTheDocument();
    });

    it('renders when callback provided', () => {
      render(<QuickActionsBar onRefresh={() => {}} />);
      expect(screen.getByLabelText('Refresh calendar')).toBeInTheDocument();
    });

    it('calls onRefresh when clicked', () => {
      const handleRefresh = vi.fn();
      render(<QuickActionsBar onRefresh={handleRefresh} />);

      fireEvent.click(screen.getByLabelText('Refresh calendar'));
      expect(handleRefresh).toHaveBeenCalledTimes(1);
    });

    it('has title tooltip', () => {
      render(<QuickActionsBar onRefresh={() => {}} />);
      expect(screen.getByTitle('Refresh Calendar')).toBeInTheDocument();
    });
  });

  describe('pending count badge', () => {
    it('does not show badge when pendingCount is 0', () => {
      render(<QuickActionsBar onRefresh={() => {}} pendingCount={0} />);
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('shows badge with count when pendingCount > 0', () => {
      render(<QuickActionsBar onRefresh={() => {}} pendingCount={5} />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('shows "9+" when pendingCount > 9', () => {
      render(<QuickActionsBar onRefresh={() => {}} pendingCount={15} />);
      expect(screen.getByText('9+')).toBeInTheDocument();
    });

    it('shows exact count when pendingCount is 9', () => {
      render(<QuickActionsBar onRefresh={() => {}} pendingCount={9} />);
      expect(screen.getByText('9')).toBeInTheDocument();
    });

    it('badge has animation class', () => {
      const { container } = render(<QuickActionsBar onRefresh={() => {}} pendingCount={3} />);
      const pingElement = container.querySelector('.animate-ping');
      expect(pingElement).toBeInTheDocument();
    });

    it('badge is amber colored', () => {
      const { container } = render(<QuickActionsBar onRefresh={() => {}} pendingCount={3} />);
      const badge = container.querySelector('.bg-amber-500');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('jump to date button', () => {
    it('does not render when callback not provided', () => {
      render(<QuickActionsBar />);
      expect(screen.queryByLabelText('Jump to specific date')).not.toBeInTheDocument();
    });

    it('renders when callback provided', () => {
      render(<QuickActionsBar onJumpToDate={() => {}} />);
      expect(screen.getByLabelText('Jump to specific date')).toBeInTheDocument();
    });

    it('calls onJumpToDate when clicked', () => {
      const handleJumpToDate = vi.fn();
      render(<QuickActionsBar onJumpToDate={handleJumpToDate} />);

      fireEvent.click(screen.getByLabelText('Jump to specific date'));
      expect(handleJumpToDate).toHaveBeenCalledTimes(1);
    });

    it('has title tooltip', () => {
      render(<QuickActionsBar onJumpToDate={() => {}} />);
      expect(screen.getByTitle('Jump to Date')).toBeInTheDocument();
    });
  });

  describe('toggle filters button', () => {
    it('does not render when callback not provided', () => {
      render(<QuickActionsBar />);
      expect(screen.queryByLabelText('Toggle filters')).not.toBeInTheDocument();
    });

    it('renders when callback provided', () => {
      render(<QuickActionsBar onToggleFilters={() => {}} />);
      expect(screen.getByLabelText('Toggle filters')).toBeInTheDocument();
    });

    it('calls onToggleFilters when clicked', () => {
      const handleToggleFilters = vi.fn();
      render(<QuickActionsBar onToggleFilters={handleToggleFilters} />);

      fireEvent.click(screen.getByLabelText('Toggle filters'));
      expect(handleToggleFilters).toHaveBeenCalledTimes(1);
    });

    it('has title tooltip', () => {
      render(<QuickActionsBar onToggleFilters={() => {}} />);
      expect(screen.getByTitle('Toggle Filters')).toBeInTheDocument();
    });
  });

  describe('command palette button', () => {
    it('does not render when callback not provided', () => {
      render(<QuickActionsBar />);
      expect(screen.queryByLabelText('Open command palette')).not.toBeInTheDocument();
    });

    it('renders when callback provided', () => {
      render(<QuickActionsBar onOpenCommandPalette={() => {}} />);
      expect(screen.getByLabelText('Open command palette')).toBeInTheDocument();
    });

    it('calls onOpenCommandPalette when clicked', () => {
      const handleOpenCommandPalette = vi.fn();
      render(<QuickActionsBar onOpenCommandPalette={handleOpenCommandPalette} />);

      fireEvent.click(screen.getByLabelText('Open command palette'));
      expect(handleOpenCommandPalette).toHaveBeenCalledTimes(1);
    });

    it('displays keyboard shortcut', () => {
      render(<QuickActionsBar onOpenCommandPalette={() => {}} />);
      expect(screen.getByText('⌘')).toBeInTheDocument();
      expect(screen.getByText('K')).toBeInTheDocument();
    });

    it('has title tooltip with shortcut', () => {
      render(<QuickActionsBar onOpenCommandPalette={() => {}} />);
      expect(screen.getByTitle('Open Command Palette (Cmd+K)')).toBeInTheDocument();
    });
  });

  describe('all buttons together', () => {
    it('renders all buttons when all callbacks provided', () => {
      render(
        <QuickActionsBar
          onNewAppointment={() => {}}
          onSearch={() => {}}
          onRefresh={() => {}}
          onJumpToDate={() => {}}
          onToggleFilters={() => {}}
          onOpenCommandPalette={() => {}}
        />
      );

      expect(screen.getByLabelText('Create new appointment')).toBeInTheDocument();
      expect(screen.getByLabelText('Search appointments')).toBeInTheDocument();
      expect(screen.getByLabelText('Refresh calendar')).toBeInTheDocument();
      expect(screen.getByLabelText('Jump to specific date')).toBeInTheDocument();
      expect(screen.getByLabelText('Toggle filters')).toBeInTheDocument();
      expect(screen.getByLabelText('Open command palette')).toBeInTheDocument();
    });

    it('all buttons are clickable', () => {
      const handlers = {
        onNewAppointment: vi.fn(),
        onSearch: vi.fn(),
        onRefresh: vi.fn(),
        onJumpToDate: vi.fn(),
        onToggleFilters: vi.fn(),
        onOpenCommandPalette: vi.fn(),
      };

      render(<QuickActionsBar {...handlers} />);

      fireEvent.click(screen.getByLabelText('Create new appointment'));
      fireEvent.click(screen.getByLabelText('Search appointments'));
      fireEvent.click(screen.getByLabelText('Refresh calendar'));
      fireEvent.click(screen.getByLabelText('Jump to specific date'));
      fireEvent.click(screen.getByLabelText('Toggle filters'));
      fireEvent.click(screen.getByLabelText('Open command palette'));

      expect(handlers.onNewAppointment).toHaveBeenCalledTimes(1);
      expect(handlers.onSearch).toHaveBeenCalledTimes(1);
      expect(handlers.onRefresh).toHaveBeenCalledTimes(1);
      expect(handlers.onJumpToDate).toHaveBeenCalledTimes(1);
      expect(handlers.onToggleFilters).toHaveBeenCalledTimes(1);
      expect(handlers.onOpenCommandPalette).toHaveBeenCalledTimes(1);
    });
  });

  describe('custom className', () => {
    it('applies custom className', () => {
      const { container } = render(<QuickActionsBar className="custom-actions-class" />);
      expect(container.firstChild).toHaveClass('custom-actions-class');
    });
  });

  describe('styling', () => {
    it('has rounded corners', () => {
      const { container } = render(<QuickActionsBar />);
      expect(container.firstChild).toHaveClass('rounded-2xl');
    });

    it('has shadow', () => {
      const { container } = render(<QuickActionsBar />);
      expect(container.firstChild).toHaveClass('shadow-lg');
    });

    it('has z-index for layering', () => {
      const { container } = render(<QuickActionsBar />);
      expect(container.firstChild).toHaveClass('z-30');
    });

    it('buttons have focus ring styling', () => {
      render(<QuickActionsBar onNewAppointment={() => {}} />);
      const button = screen.getByLabelText('Create new appointment');
      expect(button).toHaveClass('focus:ring-2');
      expect(button).toHaveClass('focus:ring-brand-500');
    });
  });

  describe('icons', () => {
    it('renders Plus icon in new appointment button', () => {
      const { container } = render(<QuickActionsBar onNewAppointment={() => {}} />);
      const button = screen.getByLabelText('Create new appointment');
      const icon = button.querySelector('.lucide-plus');
      expect(icon).toBeInTheDocument();
    });

    it('renders Search icon in search button', () => {
      const { container } = render(<QuickActionsBar onSearch={() => {}} />);
      const button = screen.getByLabelText('Search appointments');
      const icon = button.querySelector('.lucide-search');
      expect(icon).toBeInTheDocument();
    });

    it('renders RefreshCw icon in refresh button', () => {
      const { container } = render(<QuickActionsBar onRefresh={() => {}} />);
      const button = screen.getByLabelText('Refresh calendar');
      const icon = button.querySelector('.lucide-refresh-cw');
      expect(icon).toBeInTheDocument();
    });

    it('renders Calendar icon in jump to date button', () => {
      const { container } = render(<QuickActionsBar onJumpToDate={() => {}} />);
      const button = screen.getByLabelText('Jump to specific date');
      const icon = button.querySelector('.lucide-calendar');
      expect(icon).toBeInTheDocument();
    });

    it('renders Filter icon in toggle filters button', () => {
      const { container } = render(<QuickActionsBar onToggleFilters={() => {}} />);
      const button = screen.getByLabelText('Toggle filters');
      // Lucide renamed Filter to funnel in newer versions
      const icon = button.querySelector('.lucide-funnel, .lucide-filter');
      expect(icon).toBeInTheDocument();
    });

    it('renders Command icon in command palette button', () => {
      const { container } = render(<QuickActionsBar onOpenCommandPalette={() => {}} />);
      const button = screen.getByLabelText('Open command palette');
      const icon = button.querySelector('.lucide-command');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('all buttons have aria-labels', () => {
      render(
        <QuickActionsBar
          onNewAppointment={() => {}}
          onSearch={() => {}}
          onRefresh={() => {}}
          onJumpToDate={() => {}}
          onToggleFilters={() => {}}
          onOpenCommandPalette={() => {}}
        />
      );

      expect(screen.getByLabelText('Create new appointment')).toBeInTheDocument();
      expect(screen.getByLabelText('Search appointments')).toBeInTheDocument();
      expect(screen.getByLabelText('Refresh calendar')).toBeInTheDocument();
      expect(screen.getByLabelText('Jump to specific date')).toBeInTheDocument();
      expect(screen.getByLabelText('Toggle filters')).toBeInTheDocument();
      expect(screen.getByLabelText('Open command palette')).toBeInTheDocument();
    });

    it('all buttons are focusable', () => {
      render(
        <QuickActionsBar
          onNewAppointment={() => {}}
          onSearch={() => {}}
        />
      );

      const newBtn = screen.getByLabelText('Create new appointment');
      const searchBtn = screen.getByLabelText('Search appointments');

      newBtn.focus();
      expect(document.activeElement).toBe(newBtn);

      searchBtn.focus();
      expect(document.activeElement).toBe(searchBtn);
    });

    it('all buttons have title tooltips', () => {
      render(
        <QuickActionsBar
          onNewAppointment={() => {}}
          onSearch={() => {}}
          onRefresh={() => {}}
          onJumpToDate={() => {}}
          onToggleFilters={() => {}}
          onOpenCommandPalette={() => {}}
        />
      );

      expect(screen.getByTitle('New Appointment')).toBeInTheDocument();
      expect(screen.getByTitle('Search Appointments')).toBeInTheDocument();
      expect(screen.getByTitle('Refresh Calendar')).toBeInTheDocument();
      expect(screen.getByTitle('Jump to Date')).toBeInTheDocument();
      expect(screen.getByTitle('Toggle Filters')).toBeInTheDocument();
      expect(screen.getByTitle('Open Command Palette (Cmd+K)')).toBeInTheDocument();
    });
  });
});
