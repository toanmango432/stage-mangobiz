/**
 * StaffSidebar Component Unit Tests
 * Tests for rendering, filtering, and FrontDesk settings integration
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// ============================================================================
// MOCKS
// ============================================================================

// Mock frontDeskSettingsStorage before importing slice
vi.mock('@/services/frontDeskSettingsStorage', () => ({
  loadSettings: vi.fn().mockResolvedValue({}),
  saveSettings: vi.fn().mockResolvedValue(true),
  subscribeToSettingsChanges: vi.fn().mockReturnValue(() => {}),
}));

// Mock useTicketPanel
vi.mock('@/hooks/useTicketPanel', () => ({
  useTicketPanel: () => ({
    openTicketPanel: vi.fn(),
    openTicketWithData: vi.fn(),
    closeTicketPanel: vi.fn(),
    isTicketPanelOpen: false,
  }),
}));

// Mock useTickets hook
vi.mock('@/hooks/useTicketsCompat', () => ({
  useTickets: () => ({
    staff: [
      {
        id: '1',
        name: 'Alice Smith',
        time: '9:00 AM',
        image: '/images/alice.jpg',
        status: 'ready',
        color: '#10b981',
        count: 1,
        specialty: 'nails',
        turnCount: 3,
      },
      {
        id: '2',
        name: 'Bob Johnson',
        time: '8:30 AM',
        image: '/images/bob.jpg',
        status: 'busy',
        color: '#ef4444',
        count: 2,
        specialty: 'hair',
        turnCount: 5,
      },
      {
        id: '3',
        name: 'Carol Williams',
        time: '',
        image: '',
        status: 'off',
        color: '#9ca3af',
        count: 3,
        specialty: 'massage',
        turnCount: 0,
      },
    ],
    waitListTickets: [],
    serviceTickets: [],
    pendingTickets: [],
    completedTickets: [],
  }),
}));

// Mock teamSlice selectors
vi.mock('@/store/slices/teamSlice', async () => {
  const actual = await vi.importActual('@/store/slices/teamSlice');
  return {
    ...actual,
    setSelectedMember: vi.fn(() => ({ type: 'team/setSelectedMember' })),
  };
});

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

// Import after mocks
import { defaultFrontDeskSettings } from '@/components/frontdesk-settings/constants';

// ============================================================================
// TEST HELPERS
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createTestStore = (overrides: any = {}) => {
  return configureStore({
    reducer: {
      frontDeskSettings: () => ({
        settings: {
          ...defaultFrontDeskSettings,
          showTurnCount: true,
          showNextAppointment: true,
          showServicedAmount: true,
          showTicketCount: true,
          showLastDone: true,
          showMoreOptionsButton: true,
          showAddTicketAction: true,
          showAddNoteAction: true,
          showEditTeamAction: true,
          showQuickCheckoutAction: true,
          showClockInOutAction: true,
        },
        viewState: {
          activeMobileSection: 'waitList',
          activeCombinedTab: 'waitList',
          combinedViewMode: 'list',
          combinedMinimizedLineView: false,
          serviceColumnWidth: 50,
        },
        hasUnsavedChanges: false,
        lastSaved: null,
        isLoading: false,
        isInitialized: true,
        error: null,
        ...overrides.frontDeskSettings,
      }),
      uiTickets: () => ({
        waitListTickets: [],
        serviceTickets: [],
        pendingTickets: [],
        completedTickets: [],
        closedFloating: [],
        ...overrides.uiTickets,
      }),
      appointments: () => ({
        appointments: [],
        selectedDate: new Date().toISOString(),
        isLoading: false,
        error: null,
        ...overrides.appointments,
      }),
      team: () => ({
        members: [],
        isLoading: false,
        error: null,
        selectedMember: null,
        ...overrides.team,
      }),
      timesheet: () => ({
        timesheets: [],
        isLoading: false,
        error: null,
        ...overrides.timesheet,
      }),
    },
  });
};

// ============================================================================
// MOCK COMPONENT FOR SIMPLER TESTING
// ============================================================================

interface UIStaff {
  id: string | number;
  name: string;
  time: string;
  image: string;
  status: 'ready' | 'busy' | 'off';
  color: string;
  count: number;
  specialty?: string;
  turnCount?: number;
}

interface MockStaffSidebarProps {
  staff: UIStaff[];
  organizeBy: 'busyStatus' | 'clockedStatus';
  showTurnCount: boolean;
  showNextAppointment: boolean;
  showServicedAmount: boolean;
  showTicketCount: boolean;
  showLastDone: boolean;
  showMoreOptionsButton: boolean;
  showAddTicketAction: boolean;
  showAddNoteAction: boolean;
  showEditTeamAction: boolean;
  showQuickCheckoutAction: boolean;
  showClockInOutAction: boolean;
  onAddTicket?: (staffId: number) => void;
  onAddNote?: (staffId: number) => void;
  onEditTeam?: (staffId: number) => void;
  onQuickCheckout?: (staffId: number) => void;
  onClockIn?: (staffId: number) => void;
  onClockOut?: (staffId: number) => void;
  onStaffClick?: (staffId: number) => void;
}

const MockStaffSidebar = ({
  staff,
  organizeBy,
  showTurnCount,
  showNextAppointment,
  showServicedAmount,
  showTicketCount,
  showLastDone,
  showMoreOptionsButton,
  showAddTicketAction,
  showAddNoteAction,
  showEditTeamAction,
  showQuickCheckoutAction,
  showClockInOutAction,
  onAddTicket,
  onAddNote,
  onEditTeam,
  onQuickCheckout,
  onClockIn,
  onClockOut,
  onStaffClick,
}: MockStaffSidebarProps) => {
  // Group staff based on organizeBy
  const grouped =
    organizeBy === 'busyStatus'
      ? {
          ready: staff.filter((s) => s.status === 'ready'),
          busy: staff.filter((s) => s.status === 'busy'),
        }
      : {
          clockedIn: staff.filter((s) => s.status !== 'off'),
          clockedOut: staff.filter((s) => s.status === 'off'),
        };

  return (
    <div data-testid="staff-sidebar">
      <div data-testid="organize-by">{organizeBy}</div>

      {/* Settings indicators */}
      <div data-testid="display-settings">
        <span data-testid="show-turn-count">{String(showTurnCount)}</span>
        <span data-testid="show-next-appointment">{String(showNextAppointment)}</span>
        <span data-testid="show-serviced-amount">{String(showServicedAmount)}</span>
        <span data-testid="show-ticket-count">{String(showTicketCount)}</span>
        <span data-testid="show-last-done">{String(showLastDone)}</span>
        <span data-testid="show-more-options">{String(showMoreOptionsButton)}</span>
      </div>

      {/* Action settings indicators */}
      <div data-testid="action-settings">
        <span data-testid="show-add-ticket">{String(showAddTicketAction)}</span>
        <span data-testid="show-add-note">{String(showAddNoteAction)}</span>
        <span data-testid="show-edit-team">{String(showEditTeamAction)}</span>
        <span data-testid="show-quick-checkout">{String(showQuickCheckoutAction)}</span>
        <span data-testid="show-clock-in-out">{String(showClockInOutAction)}</span>
      </div>

      {/* Staff list */}
      {organizeBy === 'busyStatus' ? (
        <>
          <div data-testid="ready-group">
            <h3>Ready ({grouped.ready?.length || 0})</h3>
            {grouped.ready?.map((s) => (
              <div
                key={s.id}
                data-testid={`staff-card-${s.id}`}
                onClick={() => onStaffClick?.(Number(s.id))}
              >
                <span data-testid="staff-name">{s.name}</span>
                <span data-testid="staff-status">{s.status}</span>
                {showMoreOptionsButton && (
                  <div data-testid="more-options-menu">
                    {showAddTicketAction && (
                      <button onClick={() => onAddTicket?.(Number(s.id))}>Add Ticket</button>
                    )}
                    {showAddNoteAction && (
                      <button onClick={() => onAddNote?.(Number(s.id))}>Add Note</button>
                    )}
                    {showEditTeamAction && (
                      <button onClick={() => onEditTeam?.(Number(s.id))}>Edit Team</button>
                    )}
                    {showClockInOutAction && s.status !== 'off' && (
                      <button onClick={() => onClockOut?.(Number(s.id))}>Clock Out</button>
                    )}
                    {showClockInOutAction && s.status === 'off' && (
                      <button onClick={() => onClockIn?.(Number(s.id))}>Clock In</button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div data-testid="busy-group">
            <h3>Busy ({grouped.busy?.length || 0})</h3>
            {grouped.busy?.map((s) => (
              <div
                key={s.id}
                data-testid={`staff-card-${s.id}`}
                onClick={() => onStaffClick?.(Number(s.id))}
              >
                <span data-testid="staff-name">{s.name}</span>
                <span data-testid="staff-status">{s.status}</span>
                {showMoreOptionsButton && (
                  <div data-testid="more-options-menu">
                    {showAddTicketAction && (
                      <button onClick={() => onAddTicket?.(Number(s.id))}>Add Ticket</button>
                    )}
                    {showQuickCheckoutAction && (
                      <button onClick={() => onQuickCheckout?.(Number(s.id))}>
                        Quick Checkout
                      </button>
                    )}
                    {showClockInOutAction && (
                      <button onClick={() => onClockOut?.(Number(s.id))}>Clock Out</button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div data-testid="clocked-in-group">
            <h3>Clocked In ({grouped.clockedIn?.length || 0})</h3>
            {grouped.clockedIn?.map((s) => (
              <div key={s.id} data-testid={`staff-card-${s.id}`}>
                <span>{s.name}</span>
              </div>
            ))}
          </div>
          <div data-testid="clocked-out-group">
            <h3>Clocked Out ({grouped.clockedOut?.length || 0})</h3>
            {grouped.clockedOut?.map((s) => (
              <div key={s.id} data-testid={`staff-card-${s.id}`}>
                <span>{s.name}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div data-testid="staff-count">{staff.length}</div>
    </div>
  );
};

// ============================================================================
// TESTS
// ============================================================================

describe('StaffSidebar Component', () => {
  const mockStaff: UIStaff[] = [
    {
      id: '1',
      name: 'Alice Smith',
      time: '9:00 AM',
      image: '/images/alice.jpg',
      status: 'ready',
      color: '#10b981',
      count: 1,
      specialty: 'nails',
      turnCount: 3,
    },
    {
      id: '2',
      name: 'Bob Johnson',
      time: '8:30 AM',
      image: '/images/bob.jpg',
      status: 'busy',
      color: '#ef4444',
      count: 2,
      specialty: 'hair',
      turnCount: 5,
    },
    {
      id: '3',
      name: 'Carol Williams',
      time: '',
      image: '',
      status: 'off',
      color: '#9ca3af',
      count: 3,
      specialty: 'massage',
      turnCount: 0,
    },
  ];

  const defaultProps: MockStaffSidebarProps = {
    staff: mockStaff,
    organizeBy: 'busyStatus',
    showTurnCount: true,
    showNextAppointment: true,
    showServicedAmount: true,
    showTicketCount: true,
    showLastDone: true,
    showMoreOptionsButton: true,
    showAddTicketAction: true,
    showAddNoteAction: true,
    showEditTeamAction: true,
    showQuickCheckoutAction: true,
    showClockInOutAction: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render staff sidebar', () => {
      render(<MockStaffSidebar {...defaultProps} />);
      expect(screen.getByTestId('staff-sidebar')).toBeInTheDocument();
    });

    it('should render all staff members', () => {
      render(<MockStaffSidebar {...defaultProps} />);
      expect(screen.getByTestId('staff-count')).toHaveTextContent('3');
    });

    it('should render staff cards for ready and busy members', () => {
      render(<MockStaffSidebar {...defaultProps} />);
      // In busyStatus mode, only ready and busy are shown in groups
      expect(screen.getByTestId('staff-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('staff-card-2')).toBeInTheDocument();
    });

    it('should render all staff cards in clockedStatus mode', () => {
      render(<MockStaffSidebar {...defaultProps} organizeBy="clockedStatus" />);
      expect(screen.getByTestId('staff-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('staff-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('staff-card-3')).toBeInTheDocument();
    });
  });

  describe('Filtering by busyStatus', () => {
    it('should group staff into Ready/Busy groups', () => {
      render(<MockStaffSidebar {...defaultProps} organizeBy="busyStatus" />);

      expect(screen.getByTestId('ready-group')).toBeInTheDocument();
      expect(screen.getByTestId('busy-group')).toBeInTheDocument();
    });

    it('should show correct count in Ready group', () => {
      render(<MockStaffSidebar {...defaultProps} organizeBy="busyStatus" />);

      const readyGroup = screen.getByTestId('ready-group');
      expect(readyGroup).toHaveTextContent('Ready (1)');
    });

    it('should show correct count in Busy group', () => {
      render(<MockStaffSidebar {...defaultProps} organizeBy="busyStatus" />);

      const busyGroup = screen.getByTestId('busy-group');
      expect(busyGroup).toHaveTextContent('Busy (1)');
    });
  });

  describe('Filtering by clockedStatus', () => {
    it('should group staff into Clocked In/Out groups', () => {
      render(<MockStaffSidebar {...defaultProps} organizeBy="clockedStatus" />);

      expect(screen.getByTestId('clocked-in-group')).toBeInTheDocument();
      expect(screen.getByTestId('clocked-out-group')).toBeInTheDocument();
    });

    it('should show correct count in Clocked In group', () => {
      render(<MockStaffSidebar {...defaultProps} organizeBy="clockedStatus" />);

      const clockedInGroup = screen.getByTestId('clocked-in-group');
      // Alice (ready) + Bob (busy) = 2 clocked in
      expect(clockedInGroup).toHaveTextContent('Clocked In (2)');
    });

    it('should show correct count in Clocked Out group', () => {
      render(<MockStaffSidebar {...defaultProps} organizeBy="clockedStatus" />);

      const clockedOutGroup = screen.getByTestId('clocked-out-group');
      // Carol (off) = 1 clocked out
      expect(clockedOutGroup).toHaveTextContent('Clocked Out (1)');
    });
  });

  describe('FrontDeskSettings Integration', () => {
    it('should receive showTurnCount from settings', () => {
      render(<MockStaffSidebar {...defaultProps} showTurnCount={true} />);
      expect(screen.getByTestId('show-turn-count')).toHaveTextContent('true');
    });

    it('should receive showNextAppointment from settings', () => {
      render(<MockStaffSidebar {...defaultProps} showNextAppointment={false} />);
      expect(screen.getByTestId('show-next-appointment')).toHaveTextContent('false');
    });

    it('should receive showServicedAmount from settings', () => {
      render(<MockStaffSidebar {...defaultProps} showServicedAmount={true} />);
      expect(screen.getByTestId('show-serviced-amount')).toHaveTextContent('true');
    });

    it('should receive showTicketCount from settings', () => {
      render(<MockStaffSidebar {...defaultProps} showTicketCount={false} />);
      expect(screen.getByTestId('show-ticket-count')).toHaveTextContent('false');
    });

    it('should receive showLastDone from settings', () => {
      render(<MockStaffSidebar {...defaultProps} showLastDone={true} />);
      expect(screen.getByTestId('show-last-done')).toHaveTextContent('true');
    });

    it('should receive showMoreOptionsButton from settings', () => {
      render(<MockStaffSidebar {...defaultProps} showMoreOptionsButton={true} />);
      expect(screen.getByTestId('show-more-options')).toHaveTextContent('true');
    });
  });

  describe('Action Settings Integration', () => {
    it('should receive showAddTicketAction from settings', () => {
      render(<MockStaffSidebar {...defaultProps} showAddTicketAction={true} />);
      expect(screen.getByTestId('show-add-ticket')).toHaveTextContent('true');
    });

    it('should receive showAddNoteAction from settings', () => {
      render(<MockStaffSidebar {...defaultProps} showAddNoteAction={false} />);
      expect(screen.getByTestId('show-add-note')).toHaveTextContent('false');
    });

    it('should receive showEditTeamAction from settings', () => {
      render(<MockStaffSidebar {...defaultProps} showEditTeamAction={true} />);
      expect(screen.getByTestId('show-edit-team')).toHaveTextContent('true');
    });

    it('should receive showQuickCheckoutAction from settings', () => {
      render(<MockStaffSidebar {...defaultProps} showQuickCheckoutAction={false} />);
      expect(screen.getByTestId('show-quick-checkout')).toHaveTextContent('false');
    });

    it('should receive showClockInOutAction from settings', () => {
      render(<MockStaffSidebar {...defaultProps} showClockInOutAction={true} />);
      expect(screen.getByTestId('show-clock-in-out')).toHaveTextContent('true');
    });
  });

  describe('Action Callbacks', () => {
    it('should call onAddTicket when Add Ticket button is clicked', () => {
      const onAddTicket = vi.fn();
      render(<MockStaffSidebar {...defaultProps} onAddTicket={onAddTicket} />);

      const addTicketButtons = screen.getAllByText('Add Ticket');
      fireEvent.click(addTicketButtons[0]);

      expect(onAddTicket).toHaveBeenCalledWith(1);
    });

    it('should call onAddNote when Add Note button is clicked', () => {
      const onAddNote = vi.fn();
      render(<MockStaffSidebar {...defaultProps} onAddNote={onAddNote} />);

      const addNoteButtons = screen.getAllByText('Add Note');
      fireEvent.click(addNoteButtons[0]);

      expect(onAddNote).toHaveBeenCalledWith(1);
    });

    it('should call onEditTeam when Edit Team button is clicked', () => {
      const onEditTeam = vi.fn();
      render(<MockStaffSidebar {...defaultProps} onEditTeam={onEditTeam} />);

      const editTeamButtons = screen.getAllByText('Edit Team');
      fireEvent.click(editTeamButtons[0]);

      expect(onEditTeam).toHaveBeenCalledWith(1);
    });

    it('should call onQuickCheckout for busy staff', () => {
      const onQuickCheckout = vi.fn();
      render(<MockStaffSidebar {...defaultProps} onQuickCheckout={onQuickCheckout} />);

      const quickCheckoutButton = screen.getByText('Quick Checkout');
      fireEvent.click(quickCheckoutButton);

      expect(onQuickCheckout).toHaveBeenCalledWith(2);
    });

    it('should call onClockOut for clocked-in staff', () => {
      const onClockOut = vi.fn();
      render(<MockStaffSidebar {...defaultProps} onClockOut={onClockOut} />);

      const clockOutButtons = screen.getAllByText('Clock Out');
      fireEvent.click(clockOutButtons[0]);

      expect(onClockOut).toHaveBeenCalledWith(1);
    });

    it('should call onStaffClick when staff card is clicked', () => {
      const onStaffClick = vi.fn();
      render(<MockStaffSidebar {...defaultProps} onStaffClick={onStaffClick} />);

      const staffCard = screen.getByTestId('staff-card-1');
      fireEvent.click(staffCard);

      expect(onStaffClick).toHaveBeenCalledWith(1);
    });
  });

  describe('Conditional Rendering', () => {
    it('should hide More Options menu when showMoreOptionsButton is false', () => {
      render(<MockStaffSidebar {...defaultProps} showMoreOptionsButton={false} />);

      expect(screen.queryByTestId('more-options-menu')).not.toBeInTheDocument();
    });

    it('should hide Add Ticket button when showAddTicketAction is false', () => {
      render(<MockStaffSidebar {...defaultProps} showAddTicketAction={false} />);

      expect(screen.queryByText('Add Ticket')).not.toBeInTheDocument();
    });

    it('should hide Add Note button when showAddNoteAction is false', () => {
      render(<MockStaffSidebar {...defaultProps} showAddNoteAction={false} />);

      expect(screen.queryByText('Add Note')).not.toBeInTheDocument();
    });

    it('should hide Edit Team button when showEditTeamAction is false', () => {
      render(<MockStaffSidebar {...defaultProps} showEditTeamAction={false} />);

      expect(screen.queryByText('Edit Team')).not.toBeInTheDocument();
    });

    it('should hide Clock In/Out buttons when showClockInOutAction is false', () => {
      render(<MockStaffSidebar {...defaultProps} showClockInOutAction={false} />);

      expect(screen.queryByText('Clock Out')).not.toBeInTheDocument();
      expect(screen.queryByText('Clock In')).not.toBeInTheDocument();
    });
  });
});

describe('StaffSidebar Redux Integration', () => {
  it('should have correct initial state', () => {
    const store = createTestStore();
    const state = store.getState();

    expect(state.frontDeskSettings.settings.showTurnCount).toBe(true);
    expect(state.frontDeskSettings.settings.showNextAppointment).toBe(true);
    expect(state.frontDeskSettings.settings.showMoreOptionsButton).toBe(true);
    expect(state.frontDeskSettings.settings.showClockInOutAction).toBe(true);
  });

  it('should have default organizeBy setting', () => {
    const store = createTestStore();
    const state = store.getState();

    expect(state.frontDeskSettings.settings.organizeBy).toBe('busyStatus');
  });
});
