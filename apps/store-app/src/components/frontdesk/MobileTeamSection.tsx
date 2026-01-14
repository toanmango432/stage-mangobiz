/**
 * MobileTeamSection - Touch-optimized team view for mobile devices
 * Features:
 * - Vertical staff cards matching the app design
 * - Large touch targets (48px minimum)
 * - Quick status filters
 * - Haptic feedback on interactions
 * - Compact/Normal view toggle
 */

import { useState, useMemo, memo, useCallback } from 'react';
import { Users, Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useTickets } from '../../hooks/useTicketsCompat';
import { haptics } from '../../utils/haptics';
import { StaffCardVertical, type StaffMember, type ViewMode } from '../StaffCard/index';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectFrontDeskSettings } from '@/store/slices/frontDeskSettingsSlice';
import { setSelectedMember } from '@/store/slices/teamSlice';
import { useTicketPanel } from '@/contexts/TicketPanelContext';
import { MobileStaffActionSheet } from './MobileStaffActionSheet';
import { AddStaffNoteModal } from './AddStaffNoteModal';

interface MobileTeamSectionProps {
  className?: string;
}

// Map specialty string to valid Specialty type
const mapSpecialty = (specialty?: string): 'neutral' | 'nails' | 'hair' | 'massage' | 'skincare' | 'waxing' | 'combo' | 'support' => {
  if (!specialty) return 'neutral';
  const lower = specialty.toLowerCase();
  if (lower === 'nails' || lower === 'nail') return 'nails';
  if (lower === 'hair') return 'hair';
  if (lower === 'massage') return 'massage';
  if (lower === 'skincare' || lower === 'skin') return 'skincare';
  if (lower === 'waxing' || lower === 'wax') return 'waxing';
  if (lower === 'combo') return 'combo';
  if (lower === 'support') return 'support';
  return 'neutral';
};

// Convert UIStaff to StaffMember format for StaffCardVertical
const convertToStaffMember = (staff: any): StaffMember => {
  const staffId = typeof staff.id === 'string' ? parseInt(staff.id.replace(/\D/g, '')) || 1 : staff.id;

  // Convert activeTickets format
  const activeTickets = staff.activeTickets?.map((t: any) => ({
    id: typeof t.id === 'string' ? parseInt(t.id.replace(/\D/g, '')) || 1 : t.id,
    ticketNumber: t.ticketNumber,
    clientName: t.clientName,
    serviceName: t.serviceName,
    status: t.status === 'in-service' ? 'in-service' : 'pending',
  })) || undefined;

  return {
    id: staffId,
    name: staff.name,
    time: staff.time || '8:00 AM',
    image: staff.image || '',
    status: staff.status || 'ready',
    color: staff.color || '#6B7280',
    count: staff.count || 0,
    specialty: mapSpecialty(staff.specialty),
    turnCount: staff.turnCount ?? 0,
    // Ensure last/next times are always present (matching desktop behavior)
    lastServiceTime: staff.lastServiceTime || '10:30 AM',
    nextAppointmentTime: staff.nextAppointmentTime || '2:00 PM',
    activeTickets,
  };
};

export const MobileTeamSection = memo(function MobileTeamSection({
  className = '',
}: MobileTeamSectionProps) {
  const { staff = [], serviceTickets = [] } = useTickets();

  // US-007: Read FrontDeskSettings from Redux
  const settings = useAppSelector(selectFrontDeskSettings);

  // US-011: Get dispatch for Edit Team Member action
  const dispatch = useAppDispatch();

  // US-011: Get ticket panel context for Add Ticket and Quick Checkout actions
  const { openTicketWithData } = useTicketPanel();

  // US-007: Use organizeBy setting from FrontDeskSettings
  // 'busyStatus' shows Ready/Busy groups, 'clockedStatus' shows Clocked In/Out groups
  const organizeBy = settings?.organizeBy || 'busyStatus';

  const [filter, setFilter] = useState<'all' | 'ready' | 'busy' | 'off' | 'clockedIn' | 'clockedOut'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // US-011: State for mobile action sheet
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedStaffForAction, setSelectedStaffForAction] = useState<StaffMember | null>(null);

  // US-011: State for Add Staff Note modal
  const [showStaffNoteModal, setShowStaffNoteModal] = useState(false);
  const [selectedStaffForNote, setSelectedStaffForNote] = useState<{ id: number; name: string } | null>(null);

  // View mode state - persisted in localStorage
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('mobileTeamViewMode');
    return (saved === 'compact' || saved === 'normal') ? saved : 'compact';
  });

  const handleViewModeToggle = () => {
    haptics.selection();
    const newMode = viewMode === 'compact' ? 'normal' : 'compact';
    setViewMode(newMode);
    localStorage.setItem('mobileTeamViewMode', newMode);
  };

  // US-007: Calculate staff counts based on organizeBy setting
  const counts = useMemo(() => {
    const all = staff.length;
    const ready = staff.filter((s: any) => s.status === 'ready').length;
    const busy = staff.filter((s: any) => s.status === 'busy').length;
    const off = staff.filter((s: any) => s.status === 'off').length;
    // For clockedStatus mode
    const clockedIn = staff.filter((s: any) => s.status === 'ready' || s.status === 'busy').length;
    const clockedOut = off;
    return { all, ready, busy, off, clockedIn, clockedOut };
  }, [staff]);

  // US-007: Filter staff based on organizeBy mode
  const filteredStaff = useMemo(() => {
    return staff.filter((s: any) => {
      const matchesSearch = !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase());

      if (filter === 'all') return matchesSearch;

      if (organizeBy === 'busyStatus') {
        // Ready/Busy mode - filter by actual status
        return matchesSearch && s.status === filter;
      } else {
        // Clocked In/Out mode
        if (filter === 'clockedIn') {
          return matchesSearch && (s.status === 'ready' || s.status === 'busy');
        } else if (filter === 'clockedOut') {
          return matchesSearch && s.status === 'off';
        }
        // Fallback for legacy filters
        return matchesSearch && s.status === filter;
      }
    });
  }, [staff, filter, searchQuery, organizeBy]);

  // US-007: Group by status based on organizeBy setting
  const groupedStaff = useMemo(() => {
    const ready = filteredStaff.filter((s: any) => s.status === 'ready');
    const busy = filteredStaff.filter((s: any) => s.status === 'busy');
    const off = filteredStaff.filter((s: any) => s.status === 'off');
    // For clockedStatus mode
    const clockedIn = filteredStaff.filter((s: any) => s.status === 'ready' || s.status === 'busy');
    const clockedOut = filteredStaff.filter((s: any) => s.status === 'off');
    return { ready, busy, off, clockedIn, clockedOut };
  }, [filteredStaff]);

  const handleFilterChange = (newFilter: typeof filter) => {
    haptics.selection();
    setFilter(newFilter);
  };

  // US-011: Handle staff card click to open action sheet
  const handleStaffCardClick = useCallback((staffMember: StaffMember) => {
    haptics.selection();
    setSelectedStaffForAction(staffMember);
    setShowActionSheet(true);
  }, []);

  // US-011: Handle Add Ticket action from action sheet
  const handleAddTicket = useCallback((staffId: number) => {
    const staffMember = staff.find((s: any) => {
      const id = typeof s.id === 'string' ? parseInt(s.id.replace(/\D/g, '')) || 0 : s.id;
      return id === staffId;
    });

    if (staffMember) {
      openTicketWithData({
        id: '',
        clientName: '',
        techId: String(staffId),
        technician: staffMember.name,
      });
    }
  }, [staff, openTicketWithData]);

  // US-011: Handle Add Note action from action sheet
  const handleAddNote = useCallback((staffId: number) => {
    const staffMember = staff.find((s: any) => {
      const id = typeof s.id === 'string' ? parseInt(s.id.replace(/\D/g, '')) || 0 : s.id;
      return id === staffId;
    });

    if (staffMember) {
      setSelectedStaffForNote({ id: staffId, name: staffMember.name });
      setShowStaffNoteModal(true);
    }
  }, [staff]);

  // US-011: Handle saving staff note
  const handleSaveStaffNote = useCallback((staffId: number, note: string) => {
    // TODO: Integrate with staff notes storage/API
    console.log(`Staff note saved for ${staffId}:`, note);
  }, []);

  // US-011: Handle Edit Team Member action from action sheet
  const handleEditTeam = useCallback((staffId: number) => {
    const staffMember = staff.find((s: any) => {
      const id = typeof s.id === 'string' ? parseInt(s.id.replace(/\D/g, '')) || 0 : s.id;
      return id === staffId;
    });

    if (staffMember) {
      dispatch(setSelectedMember(staffMember.id));
      window.dispatchEvent(new CustomEvent('navigate-to-module', {
        detail: 'team-settings'
      }));
    }
  }, [staff, dispatch]);

  // US-011: Handle Quick Checkout action from action sheet
  const handleQuickCheckout = useCallback((staffId: number) => {
    const staffMember = staff.find((s: any) => {
      const id = typeof s.id === 'string' ? parseInt(s.id.replace(/\D/g, '')) || 0 : s.id;
      return id === staffId;
    });

    if (!staffMember) return;

    const staffInServiceTicket = serviceTickets.find((ticket: any) => {
      const ticketStaffId = ticket.techId || ticket.staffId || ticket.assignedTo?.id;
      return ticketStaffId === staffMember.id || ticketStaffId === String(staffId);
    });

    if (!staffInServiceTicket) return;

    const ticketData = {
      id: staffInServiceTicket.id,
      number: staffInServiceTicket.number,
      clientId: staffInServiceTicket.clientId,
      clientName: staffInServiceTicket.clientName,
      clientType: staffInServiceTicket.clientType,
      service: staffInServiceTicket.service,
      services: staffInServiceTicket.checkoutServices || (staffInServiceTicket.service ? [{
        serviceName: staffInServiceTicket.service,
        name: staffInServiceTicket.service,
        duration: parseInt(String(staffInServiceTicket.duration)) || 30,
        status: staffInServiceTicket.serviceStatus || 'in_progress',
        staffId: staffInServiceTicket.techId,
        staffName: staffInServiceTicket.technician,
      }] : []),
      technician: staffInServiceTicket.technician,
      techId: staffInServiceTicket.techId,
      duration: staffInServiceTicket.duration,
      status: staffInServiceTicket.status,
      notes: staffInServiceTicket.notes,
    };

    openTicketWithData(ticketData);
  }, [staff, serviceTickets, openTicketWithData]);

  // US-007: Get current count based on filter and organizeBy mode
  const currentCount = useMemo(() => {
    if (filter === 'all') return counts.all;
    if (organizeBy === 'busyStatus') {
      if (filter === 'ready') return counts.ready;
      if (filter === 'busy') return counts.busy;
      return counts.off;
    } else {
      if (filter === 'clockedIn') return counts.clockedIn;
      if (filter === 'clockedOut') return counts.clockedOut;
      return counts.all;
    }
  }, [filter, organizeBy, counts]);

  return (
    <div className={`flex flex-col bg-white overflow-hidden ${className}`}>
      {/* Row 1: Filter pills as tabs - US-007: Show different filters based on organizeBy */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-2 py-2">
        <div className="grid grid-cols-3 gap-1">
          {/* All filter - always shown */}
          <button
            onClick={() => handleFilterChange('all')}
            className={`flex items-center justify-center gap-1 px-1 py-2.5 rounded-xl text-xs font-medium transition-all ${
              filter === 'all'
                ? 'bg-gray-800 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Users size={14} />
            <span className="truncate">All</span>
            <span className={`min-w-[18px] px-1 py-0.5 rounded-full text-[10px] font-bold ${
              filter === 'all' ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              {counts.all}
            </span>
          </button>

          {organizeBy === 'busyStatus' ? (
            <>
              {/* Ready filter - busyStatus mode */}
              <button
                onClick={() => handleFilterChange('ready')}
                className={`flex items-center justify-center gap-1 px-1 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  filter === 'ready'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="truncate">Ready</span>
                <span className={`min-w-[18px] px-1 py-0.5 rounded-full text-[10px] font-bold ${
                  filter === 'ready' ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {counts.ready}
                </span>
              </button>

              {/* Busy filter - busyStatus mode */}
              <button
                onClick={() => handleFilterChange('busy')}
                className={`flex items-center justify-center gap-1 px-1 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  filter === 'busy'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="truncate">Busy</span>
                <span className={`min-w-[18px] px-1 py-0.5 rounded-full text-[10px] font-bold ${
                  filter === 'busy' ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {counts.busy}
                </span>
              </button>
            </>
          ) : (
            <>
              {/* Clocked In filter - clockedStatus mode */}
              <button
                onClick={() => handleFilterChange('clockedIn')}
                className={`flex items-center justify-center gap-1 px-1 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  filter === 'clockedIn'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="truncate">In</span>
                <span className={`min-w-[18px] px-1 py-0.5 rounded-full text-[10px] font-bold ${
                  filter === 'clockedIn' ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {counts.clockedIn}
                </span>
              </button>

              {/* Clocked Out filter - clockedStatus mode */}
              <button
                onClick={() => handleFilterChange('clockedOut')}
                className={`flex items-center justify-center gap-1 px-1 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  filter === 'clockedOut'
                    ? 'bg-gray-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="truncate">Out</span>
                <span className={`min-w-[18px] px-1 py-0.5 rounded-full text-[10px] font-bold ${
                  filter === 'clockedOut' ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {counts.clockedOut}
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Row 2: Metrics & View Settings */}
      <div className="flex-shrink-0 bg-gray-50 border-b border-gray-200 px-3 py-2">
        <div className="flex items-center justify-between">
          {/* Left: Metrics */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">{currentCount}</span>
            <span className="text-xs text-gray-500">
              {currentCount === 1 ? 'member' : 'members'}
            </span>
          </div>

          {/* Right: Compact/Normal Toggle */}
          <button
            onClick={handleViewModeToggle}
            className={`p-2 rounded-lg transition-all min-w-[40px] min-h-[40px] flex items-center justify-center ${
              viewMode === 'compact'
                ? 'bg-orange-100 text-orange-600'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {viewMode === 'compact' ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>
        </div>
      </div>

      {/* Row 3: Search bar */}
      <div className="flex-shrink-0 px-3 py-2 bg-white border-b border-gray-100">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search team..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-9 rounded-lg border border-gray-200 bg-gray-50
                     text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2
                     focus:ring-orange-500/20 focus:border-orange-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full
                       hover:bg-gray-100 active:bg-gray-200"
            >
              <X size={14} className="text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Staff content - Grid of vertical staff cards */}
      {/* US-007: Render staff card with displayConfig from FrontDeskSettings */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-4 pt-3 bg-white">
        {filteredStaff.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <Users size={32} className="mb-2 opacity-50" />
            <p className="text-sm">No team members found</p>
          </div>
        ) : filter === 'all' ? (
          // Grouped view when "All" is selected - US-007: Show groups based on organizeBy
          <div className="space-y-5">
            {organizeBy === 'busyStatus' ? (
              <>
                {/* Ready section - busyStatus mode */}
                {groupedStaff.ready.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Ready ({groupedStaff.ready.length})
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {groupedStaff.ready.map((s: any) => {
                        const staffMember = convertToStaffMember(s);
                        return (
                          <StaffCardVertical
                            key={s.id}
                            staff={staffMember}
                            viewMode={viewMode}
                            onClick={() => handleStaffCardClick(staffMember)}
                            displayConfig={{
                              showName: true,
                              showQueueNumber: true,
                              showAvatar: true,
                              showTurnCount: settings?.showTurnCount ?? true,
                              showStatus: true,
                              showClockedInTime: true,
                              showNextAppointment: settings?.showNextAppointment ?? true,
                              showSalesAmount: settings?.showServicedAmount ?? true,
                              showTickets: settings?.showTicketCount ?? true,
                              showLastService: settings?.showLastDone ?? true,
                              // US-011: Action settings from FrontDeskSettings
                              showMoreOptionsButton: settings?.showMoreOptionsButton ?? true,
                              showAddTicketAction: settings?.showAddTicketAction ?? true,
                              showAddNoteAction: settings?.showAddNoteAction ?? true,
                              showEditTeamAction: settings?.showEditTeamAction ?? true,
                              showQuickCheckoutAction: settings?.showQuickCheckoutAction ?? true,
                            }}
                            onAddTicket={handleAddTicket}
                            onAddNote={handleAddNote}
                            onEditTeam={handleEditTeam}
                            onQuickCheckout={handleQuickCheckout}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Busy section - busyStatus mode */}
                {groupedStaff.busy.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-rose-500" />
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Busy ({groupedStaff.busy.length})
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {groupedStaff.busy.map((s: any) => {
                        const staffMember = convertToStaffMember(s);
                        return (
                          <StaffCardVertical
                            key={s.id}
                            staff={staffMember}
                            viewMode={viewMode}
                            onClick={() => handleStaffCardClick(staffMember)}
                            displayConfig={{
                              showName: true,
                              showQueueNumber: true,
                              showAvatar: true,
                              showTurnCount: settings?.showTurnCount ?? true,
                              showStatus: true,
                              showClockedInTime: true,
                              showNextAppointment: settings?.showNextAppointment ?? true,
                              showSalesAmount: settings?.showServicedAmount ?? true,
                              showTickets: settings?.showTicketCount ?? true,
                              showLastService: settings?.showLastDone ?? true,
                              // US-011: Action settings from FrontDeskSettings
                              showMoreOptionsButton: settings?.showMoreOptionsButton ?? true,
                              showAddTicketAction: settings?.showAddTicketAction ?? true,
                              showAddNoteAction: settings?.showAddNoteAction ?? true,
                              showEditTeamAction: settings?.showEditTeamAction ?? true,
                              showQuickCheckoutAction: settings?.showQuickCheckoutAction ?? true,
                            }}
                            onAddTicket={handleAddTicket}
                            onAddNote={handleAddNote}
                            onEditTeam={handleEditTeam}
                            onQuickCheckout={handleQuickCheckout}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Clocked In section - clockedStatus mode */}
                {groupedStaff.clockedIn.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Clocked In ({groupedStaff.clockedIn.length})
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {groupedStaff.clockedIn.map((s: any) => {
                        const staffMember = convertToStaffMember(s);
                        return (
                          <StaffCardVertical
                            key={s.id}
                            staff={staffMember}
                            viewMode={viewMode}
                            onClick={() => handleStaffCardClick(staffMember)}
                            displayConfig={{
                              showName: true,
                              showQueueNumber: true,
                              showAvatar: true,
                              showTurnCount: settings?.showTurnCount ?? true,
                              showStatus: true,
                              showClockedInTime: true,
                              showNextAppointment: settings?.showNextAppointment ?? true,
                              showSalesAmount: settings?.showServicedAmount ?? true,
                              showTickets: settings?.showTicketCount ?? true,
                              showLastService: settings?.showLastDone ?? true,
                              // US-011: Action settings from FrontDeskSettings
                              showMoreOptionsButton: settings?.showMoreOptionsButton ?? true,
                              showAddTicketAction: settings?.showAddTicketAction ?? true,
                              showAddNoteAction: settings?.showAddNoteAction ?? true,
                              showEditTeamAction: settings?.showEditTeamAction ?? true,
                              showQuickCheckoutAction: settings?.showQuickCheckoutAction ?? true,
                            }}
                            onAddTicket={handleAddTicket}
                            onAddNote={handleAddNote}
                            onEditTeam={handleEditTeam}
                            onQuickCheckout={handleQuickCheckout}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Clocked Out section - clockedStatus mode */}
                {groupedStaff.clockedOut.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Clocked Out ({groupedStaff.clockedOut.length})
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {groupedStaff.clockedOut.map((s: any) => {
                        const staffMember = convertToStaffMember(s);
                        return (
                          <StaffCardVertical
                            key={s.id}
                            staff={staffMember}
                            viewMode={viewMode}
                            onClick={() => handleStaffCardClick(staffMember)}
                            displayConfig={{
                              showName: true,
                              showQueueNumber: true,
                              showAvatar: true,
                              showTurnCount: settings?.showTurnCount ?? true,
                              showStatus: true,
                              showClockedInTime: true,
                              showNextAppointment: settings?.showNextAppointment ?? true,
                              showSalesAmount: settings?.showServicedAmount ?? true,
                              showTickets: settings?.showTicketCount ?? true,
                              showLastService: settings?.showLastDone ?? true,
                              // US-011: Action settings from FrontDeskSettings
                              showMoreOptionsButton: settings?.showMoreOptionsButton ?? true,
                              showAddTicketAction: settings?.showAddTicketAction ?? true,
                              showAddNoteAction: settings?.showAddNoteAction ?? true,
                              showEditTeamAction: settings?.showEditTeamAction ?? true,
                              showQuickCheckoutAction: settings?.showQuickCheckoutAction ?? true,
                            }}
                            onAddTicket={handleAddTicket}
                            onAddNote={handleAddNote}
                            onEditTeam={handleEditTeam}
                            onQuickCheckout={handleQuickCheckout}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          // Grid view for filtered results - US-007: Apply displayConfig from settings
          <div className="grid grid-cols-2 gap-3">
            {filteredStaff.map((s: any) => {
              const staffMember = convertToStaffMember(s);
              return (
                <StaffCardVertical
                  key={s.id}
                  staff={staffMember}
                  viewMode={viewMode}
                  onClick={() => handleStaffCardClick(staffMember)}
                  displayConfig={{
                    showName: true,
                    showQueueNumber: true,
                    showAvatar: true,
                    showTurnCount: settings?.showTurnCount ?? true,
                    showStatus: true,
                    showClockedInTime: true,
                    showNextAppointment: settings?.showNextAppointment ?? true,
                    showSalesAmount: settings?.showServicedAmount ?? true,
                    showTickets: settings?.showTicketCount ?? true,
                    showLastService: settings?.showLastDone ?? true,
                    // US-011: Action settings from FrontDeskSettings
                    showMoreOptionsButton: settings?.showMoreOptionsButton ?? true,
                    showAddTicketAction: settings?.showAddTicketAction ?? true,
                    showAddNoteAction: settings?.showAddNoteAction ?? true,
                    showEditTeamAction: settings?.showEditTeamAction ?? true,
                    showQuickCheckoutAction: settings?.showQuickCheckoutAction ?? true,
                  }}
                  onAddTicket={handleAddTicket}
                  onAddNote={handleAddNote}
                  onEditTeam={handleEditTeam}
                  onQuickCheckout={handleQuickCheckout}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* US-011: Mobile Action Sheet */}
      {selectedStaffForAction && (
        <MobileStaffActionSheet
          isOpen={showActionSheet}
          onClose={() => {
            setShowActionSheet(false);
            setSelectedStaffForAction(null);
          }}
          staffName={selectedStaffForAction.name}
          staffId={selectedStaffForAction.id}
          isBusy={selectedStaffForAction.status === 'busy'}
          hasActiveTicket={!!selectedStaffForAction.activeTickets?.length}
          showAddTicketAction={settings?.showAddTicketAction ?? true}
          showAddNoteAction={settings?.showAddNoteAction ?? true}
          showEditTeamAction={settings?.showEditTeamAction ?? true}
          showQuickCheckoutAction={settings?.showQuickCheckoutAction ?? true}
          onAddTicket={handleAddTicket}
          onAddNote={handleAddNote}
          onEditTeam={handleEditTeam}
          onQuickCheckout={handleQuickCheckout}
        />
      )}

      {/* US-011: Add Staff Note Modal */}
      {selectedStaffForNote && (
        <AddStaffNoteModal
          isOpen={showStaffNoteModal}
          onClose={() => {
            setShowStaffNoteModal(false);
            setSelectedStaffForNote(null);
          }}
          staffName={selectedStaffForNote.name}
          staffId={selectedStaffForNote.id}
          onSave={handleSaveStaffNote}
        />
      )}
    </div>
  );
});

export default MobileTeamSection;
