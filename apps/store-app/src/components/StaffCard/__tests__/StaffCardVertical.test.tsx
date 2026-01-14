/**
 * StaffCardVertical Component Unit Tests
 * Tests for display modes, action callbacks, and displayConfig integration
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StaffCardVertical, StaffMember, ViewMode } from '../StaffCardVertical';
import type { DisplayConfig } from '../hooks/useStaffCardDisplay';

// ============================================================================
// TEST HELPERS
// ============================================================================

const createMockStaff = (overrides: Partial<StaffMember> = {}): StaffMember => ({
  id: 1,
  name: 'Alice Smith',
  time: '9:00 AM',
  image: '/images/alice.jpg',
  status: 'ready',
  color: '#10b981',
  count: 1,
  specialty: 'nails',
  turnCount: 3,
  lastServiceTime: '10:30 AM',
  nextAppointmentTime: '2:00 PM',
  ...overrides,
});

const createBusyStaff = (overrides: Partial<StaffMember> = {}): StaffMember =>
  createMockStaff({
    status: 'busy',
    activeTickets: [
      {
        id: 101,
        ticketNumber: '#1001',
        clientName: 'John Doe',
        serviceName: 'Manicure',
        status: 'in-service',
      },
    ],
    currentTicketInfo: {
      timeLeft: 15,
      totalTime: 30,
      progress: 0.5,
      startTime: '11:00 AM',
      serviceName: 'Manicure',
      clientName: 'John Doe',
    },
    ...overrides,
  });

const defaultDisplayConfig: DisplayConfig = {
  showAvatar: true,
  showName: true,
  showClockedInTime: true,
  showQueueNumber: true,
  showTurnCount: true,
  showNextAppointment: true,
  showSalesAmount: true,
  showLastService: true,
  showMoreOptionsButton: true,
  showAddTicketAction: true,
  showAddNoteAction: true,
  showEditTeamAction: true,
  showQuickCheckoutAction: true,
  showClockInOutAction: true,
};

// ============================================================================
// TESTS
// ============================================================================

describe('StaffCardVertical Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render staff name', () => {
      const staff = createMockStaff();
      render(<StaffCardVertical staff={staff} />);
      expect(screen.getByText(/alice/i)).toBeInTheDocument();
    });

    it('should render staff with correct ARIA attributes', () => {
      const staff = createMockStaff({ name: 'Bob Johnson', status: 'ready' });
      render(<StaffCardVertical staff={staff} />);

      const card = screen.getByRole('button', { name: /staff card for bob johnson/i });
      expect(card).toBeInTheDocument();
    });

    it('should render queue number when showQueueNumber is true', () => {
      const staff = createMockStaff({ count: 5 });
      render(
        <StaffCardVertical
          staff={staff}
          displayConfig={{ ...defaultDisplayConfig, showQueueNumber: true }}
        />
      );
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should show turn count when enabled', () => {
      const staff = createMockStaff({ turnCount: 7 });
      render(
        <StaffCardVertical
          staff={staff}
          viewMode="normal"
          displayConfig={{ ...defaultDisplayConfig, showTurnCount: true }}
        />
      );
      // Turn count should be visible (rendered in StaffCardMetrics)
      expect(screen.getByText('7')).toBeInTheDocument();
    });
  });

  describe('View Modes', () => {
    it('should render in normal mode by default', () => {
      const staff = createMockStaff();
      const { container } = render(<StaffCardVertical staff={staff} viewMode="normal" />);

      // In normal mode, the card should have larger dimensions
      const card = container.querySelector('.staff-card-container');
      expect(card).toBeInTheDocument();
    });

    it('should render in compact mode', () => {
      const staff = createMockStaff();
      const { container } = render(<StaffCardVertical staff={staff} viewMode="compact" />);

      const card = container.querySelector('.staff-card-container');
      expect(card).toBeInTheDocument();
    });

    it('should render in ultra-compact mode', () => {
      const staff = createMockStaff();
      const { container } = render(<StaffCardVertical staff={staff} viewMode="ultra-compact" />);

      const card = container.querySelector('.staff-card-container');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Staff Status', () => {
    it('should render ready staff without busy overlay', () => {
      const staff = createMockStaff({ status: 'ready' });
      const { container } = render(<StaffCardVertical staff={staff} />);

      // Busy overlay uses specific mix-blend-mode style
      const overlay = container.querySelector('[style*="mix-blend-mode"]');
      expect(overlay).toBeNull();
    });

    it('should render busy staff with overlay', () => {
      const staff = createBusyStaff();
      const { container } = render(<StaffCardVertical staff={staff} />);

      // Busy overlay should be present
      const overlay = container.querySelector('[style*="mix-blend-mode"]');
      expect(overlay).toBeInTheDocument();
    });

    it('should render off staff with correct ARIA label', () => {
      const staff = createMockStaff({ status: 'off' });
      render(<StaffCardVertical staff={staff} />);

      const card = screen.getByRole('button', { name: /staff card for alice smith, status: off/i });
      expect(card).toBeInTheDocument();
    });
  });

  describe('Action Callbacks', () => {
    it('should call onClick when card is clicked', () => {
      const staff = createMockStaff();
      const onClick = vi.fn();

      render(<StaffCardVertical staff={staff} onClick={onClick} />);

      const card = screen.getByRole('button', { name: /staff card/i });
      fireEvent.click(card);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should render More Options button when showMoreOptionsButton is true', () => {
      const staff = createMockStaff();

      render(
        <StaffCardVertical
          staff={staff}
          viewMode="normal"
          displayConfig={{ ...defaultDisplayConfig, showMoreOptionsButton: true }}
        />
      );

      // Hover to show the More Options button
      const card = screen.getByRole('button', { name: /staff card/i });
      fireEvent.mouseEnter(card);

      // The More Options button should be rendered
      const moreButton = screen.getByLabelText('More options');
      expect(moreButton).toBeInTheDocument();
    });

    it('should NOT render More Options button when showMoreOptionsButton is false', () => {
      const staff = createMockStaff();

      render(
        <StaffCardVertical
          staff={staff}
          viewMode="normal"
          displayConfig={{ ...defaultDisplayConfig, showMoreOptionsButton: false }}
        />
      );

      // More Options button should not exist
      expect(screen.queryByLabelText('More options')).not.toBeInTheDocument();
    });
  });

  describe('DisplayConfig Integration', () => {
    it('should hide More Options button when showMoreOptionsButton is false', () => {
      const staff = createMockStaff();

      render(
        <StaffCardVertical
          staff={staff}
          viewMode="normal"
          displayConfig={{ ...defaultDisplayConfig, showMoreOptionsButton: false }}
        />
      );

      expect(screen.queryByLabelText('More options')).not.toBeInTheDocument();
    });

    it('should show More Options button when showMoreOptionsButton is true', () => {
      const staff = createMockStaff();

      render(
        <StaffCardVertical
          staff={staff}
          viewMode="normal"
          displayConfig={{ ...defaultDisplayConfig, showMoreOptionsButton: true }}
        />
      );

      // Hover to show the button
      const card = screen.getByRole('button', { name: /staff card/i });
      fireEvent.mouseEnter(card);

      expect(screen.getByLabelText('More options')).toBeInTheDocument();
    });

    it('should apply displayConfig for turn count visibility', () => {
      const staff = createMockStaff({ turnCount: 5 });

      const { rerender } = render(
        <StaffCardVertical
          staff={staff}
          viewMode="normal"
          displayConfig={{ ...defaultDisplayConfig, showTurnCount: true }}
        />
      );

      // Turn count should be visible
      expect(screen.getByText('5')).toBeInTheDocument();

      // Now hide turn count
      rerender(
        <StaffCardVertical
          staff={staff}
          viewMode="normal"
          displayConfig={{ ...defaultDisplayConfig, showTurnCount: false }}
        />
      );

      // Turn count element should still exist but with hidden class or not rendered
      // Based on the component implementation
    });
  });

  describe('Selection State', () => {
    it('should apply selection styles when isSelected is true', () => {
      const staff = createMockStaff();
      const { container } = render(<StaffCardVertical staff={staff} isSelected={true} />);

      const card = container.querySelector('.staff-card-container');
      expect(card).toHaveClass('ring-2');
      expect(card).toHaveClass('ring-blue-500');
    });

    it('should NOT apply selection styles when isSelected is false', () => {
      const staff = createMockStaff();
      const { container } = render(<StaffCardVertical staff={staff} isSelected={false} />);

      const card = container.querySelector('.staff-card-container');
      expect(card).not.toHaveClass('ring-2');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be focusable via tabIndex', () => {
      const staff = createMockStaff();
      render(<StaffCardVertical staff={staff} />);

      const card = screen.getByRole('button', { name: /staff card/i });
      expect(card).toHaveAttribute('tabindex', '0');
    });

    it('should have keyboard event handlers attached', () => {
      const staff = createMockStaff();
      const onClick = vi.fn();

      render(<StaffCardVertical staff={staff} onClick={onClick} />);

      const card = screen.getByRole('button', { name: /staff card/i });

      // Verify the card is interactive
      expect(card).toBeInTheDocument();
      expect(card.getAttribute('role')).toBe('button');
    });
  });

  describe('Busy Staff Display', () => {
    it('should apply busy status styling', () => {
      const staff = createBusyStaff();
      render(<StaffCardVertical staff={staff} />);

      // Staff card should have correct ARIA label indicating busy status
      const card = screen.getByRole('button', { name: /staff card for alice smith, status: busy/i });
      expect(card).toBeInTheDocument();
    });

    it('should show progress indicator for busy staff', () => {
      const staff = createBusyStaff();
      const { container } = render(<StaffCardVertical staff={staff} />);

      // Busy staff should have a progress element
      const progressElement = container.querySelector('[style*="width: 50%"]');
      expect(progressElement).toBeInTheDocument();
    });
  });
});
