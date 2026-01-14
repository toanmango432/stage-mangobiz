/**
 * StaffSidebar - Main staff management sidebar for Front Desk module
 *
 * ## US-016: Data Source Documentation
 *
 * ### Staff Data Flow (Redux-backed)
 * All staff data comes from Redux via the `useTicketsCompat` hook:
 * - `staff`: UIStaff[] from `selectAllStaff` (uiStaffSlice)
 * - `serviceTickets`: UITicket[] from `selectServiceTickets` (uiTicketsSlice)
 *
 * `useTicketsCompat` is a compatibility wrapper that provides the same API
 * as the legacy TicketContext but is fully Redux-backed under the hood.
 *
 * ### Authoritative Selectors
 * - Staff list: `selectAllStaff` from uiStaffSlice (via useTicketsCompat)
 * - Service tickets: `selectServiceTickets` from uiTicketsSlice
 * - Appointments: `selectAllAppointments` from appointmentsSlice
 * - Completed tickets: `selectCompletedTickets` from uiTicketsSlice
 *
 * ### Derived Data (Module Hooks)
 * - `useStaffTicketInfo()`: Provides activeTickets and currentTicketInfo
 * - `useStaffNextAppointment()`: Provides next scheduled appointment time
 * - `useStaffLastServiceTime()`: Provides last completed service time
 *
 * ### Settings
 * - Display settings: `selectFrontDeskSettings` from frontDeskSettingsSlice
 * - Staff notes: `selectAllStaffNotes` from frontDeskSettingsSlice
 * - Team settings: Local `teamSettings` state (localStorage) - see US-017 for consolidation
 */

import { useEffect, useState, useCallback } from 'react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { StaffCardVertical, type StaffMember } from '@/components/StaffCard';
import { TeamSettingsPanel } from '@/components/TeamSettingsPanel';
import { TurnTracker } from '@/components/TurnTracker/TurnTracker';
import { AddStaffNoteModal } from '@/components/frontdesk/AddStaffNoteModal';
import { StaffDetailsPanel } from '@/components/frontdesk/StaffDetailsPanel';
import { useTickets } from '@/hooks/useTicketsCompat';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  selectFrontDeskSettings,
  selectAllStaffNotes,
  selectTeamSettings,
  updateTeamSettings,
  type TeamSettings,
} from '@/store/slices/frontDeskSettingsSlice';
import { type UIStaff } from '@/store/slices/uiStaffSlice';

// Import from StaffSidebar module
import { getStaffImage, getGridColumns, getGapAndPadding, getCardViewMode, getEmptyStateClasses } from './StaffSidebar/utils';
import {
  useStaffTicketInfo,
  useStaffNextAppointment,
  useStaffLastServiceTime,
  useSidebarWidth,
  useViewMode,
  useStaffActions,
  useModalStack,
} from './StaffSidebar/hooks';
import { StaffSidebarHeader, StaffTooltip } from './StaffSidebar/components';
import { STORAGE_KEYS } from './StaffSidebar/constants';
import type { StaffSidebarProps, StaffCounts } from './StaffSidebar/types';

export function StaffSidebar({ settings: propSettings }: StaffSidebarProps = { settings: undefined }) {
  const USE_NEW_TEAM_STYLING = true;
  const { isEnabled: isTurnTrackerEnabled } = useFeatureFlag('turn-tracker');

  // Redux state
  const dispatch = useAppDispatch();
  const reduxSettings = useAppSelector(selectFrontDeskSettings);
  const settings = reduxSettings || propSettings;
  const staffNotes = useAppSelector(selectAllStaffNotes);
  // US-017: Team settings from Redux (consolidated from localStorage)
  const teamSettings = useAppSelector(selectTeamSettings);

  // Context data
  const { resetStaffStatus, staff, serviceTickets } = useTickets();

  // Module hooks
  const getStaffTicketInfo = useStaffTicketInfo();
  const getStaffNextAppointment = useStaffNextAppointment();
  const getStaffLastServiceTime = useStaffLastServiceTime();
  const { sidebarWidth, applyWidthSettings } = useSidebarWidth();

  // Local state (UI-only, not persisted)
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // US-019: Consolidated modal state management
  const {
    showTeamSettings,
    setShowTeamSettings,
    showTurnTracker,
    setShowTurnTracker,
    showStaffNoteModal,
    selectedStaffForNote,
    showStaffDetails,
    selectedStaffForDetails,
    showResetConfirmation,
    setShowResetConfirmation,
    openStaffNote,
    closeStaffNote,
    openStaffDetails,
    closeStaffDetails,
  } = useModalStack();

  const { viewMode, setViewMode, toggleViewMode } = useViewMode(teamSettings);
  const effectiveOrganizeBy = settings?.organizeBy || teamSettings.organizeBy;

  // Staff actions hook
  const {
    handleAddTicket,
    handleAddNote,
    handleSaveStaffNote,
    handleEditTeam,
    handleStaffClick,
    handleQuickCheckout,
    handleClockIn,
    handleClockOut,
  } = useStaffActions({
    staff,
    serviceTickets,
    onSelectStaffForNote: openStaffNote,
    onSelectStaffForDetails: openStaffDetails,
  });

  // Effects
  useEffect(() => {
    if (settings?.viewWidth) {
      const map: Record<string, string> = { ultraCompact: 'ultraCompact', compact: 'compact', wide: 'wide', fullScreen: 'fullScreen', custom: 'custom' };
      applyWidthSettings(map[settings.viewWidth] || 'compact', settings.customWidthPercentage || 40);
    }
  }, [settings?.viewWidth, settings?.customWidthPercentage, applyWidthSettings]);

  // US-017: Initialize sidebar width from Redux teamSettings on mount
  // This ensures the sidebar width matches the team settings preference
  useEffect(() => {
    if (teamSettings.viewWidth) {
      applyWidthSettings(teamSettings.viewWidth, teamSettings.customWidthPercentage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  useEffect(() => {
    const onOpen = () => setShowTurnTracker(true);
    window.addEventListener('open-turn-tracker', onOpen);
    return () => window.removeEventListener('open-turn-tracker', onOpen);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showTeamSettings) setShowTeamSettings(false);
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && showTeamSettings) { e.preventDefault(); setShowTeamSettings(false); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTeamSettings]);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `.scrollbar-hide::-webkit-scrollbar{display:none}.scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}`;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  // US-017: Handlers - dispatch Redux action instead of local state
  const handleTeamSettingsChange = useCallback((newSettings: Partial<TeamSettings>) => {
    // Dispatch Redux action to update team settings (persists to localStorage)
    dispatch(updateTeamSettings(newSettings));
    // Calculate updated values for immediate effects
    const updated = { ...teamSettings, ...newSettings };
    if (newSettings.viewWidth) applyWidthSettings(newSettings.viewWidth, updated.customWidthPercentage);
    else if (newSettings.customWidthPercentage && updated.viewWidth === 'custom') applyWidthSettings('custom', newSettings.customWidthPercentage);
    if (newSettings.showSearch !== undefined) setShowSearch(newSettings.showSearch);
    if (newSettings.showMinimizeExpandIcon !== undefined && !newSettings.showMinimizeExpandIcon) setViewMode('normal');
    if (newSettings.organizeBy !== undefined && newSettings.organizeBy !== teamSettings.organizeBy) setStatusFilter(null);
  }, [dispatch, teamSettings, applyWidthSettings, setViewMode]);

  // Grid styling computed from utilities
  const gridColumns = getGridColumns(sidebarWidth, viewMode);
  const gapPadding = getGapAndPadding(sidebarWidth, viewMode);
  const cardViewMode = getCardViewMode(sidebarWidth, viewMode);
  const emptyStateClasses = getEmptyStateClasses(sidebarWidth, viewMode);

  // Filter and count
  const filteredStaff = staff.filter((s) => {
    const match = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (effectiveOrganizeBy === 'busyStatus') {
      if (s.status !== 'ready' && s.status !== 'busy') return false;
      return match && (statusFilter === null || s.status === statusFilter);
    }
    if (statusFilter === null) return match;
    if (statusFilter === 'clockedIn') return match && (s.status === 'ready' || s.status === 'busy');
    if (statusFilter === 'clockedOut') return match && s.status === 'off';
    return false;
  });

  const staffCounts: StaffCounts = (() => {
    const list = effectiveOrganizeBy === 'busyStatus' ? staff.filter((s) => s.status !== 'off') : staff;
    return {
      clockedIn: list.filter((s) => s.status === 'ready' || s.status === 'busy').length,
      clockedOut: list.filter((s) => s.status === 'off').length,
      ready: list.filter((s) => s.status === 'ready').length,
      busy: list.filter((s) => s.status === 'busy').length,
      total: list.length,
    };
  })();

  // Styling
  const cls = USE_NEW_TEAM_STYLING
    ? 'relative h-full border-r-[3px] border-teal-300/60 bg-gradient-to-b from-teal-50/95 via-teal-50/95 to-teal-100/90 flex flex-col overflow-hidden transition-all duration-300'
    : 'relative h-full border-r border-[#E2D9DC] bg-[#FBF8F9] flex flex-col overflow-hidden shadow-xl transition-all duration-300';
  const style = {
    width: `${sidebarWidth}px`,
    boxShadow: USE_NEW_TEAM_STYLING
      ? '6px 0 16px -4px rgba(20,184,166,0.25),2px 0 8px -2px rgba(0,0,0,0.08)'
      : '0 20px 25px -5px rgba(0,0,0,0.05),0 10px 10px -5px rgba(0,0,0,0.02)',
  };

  return (
    <div className={cls} style={style}>
      <StaffSidebarHeader
        sidebarWidth={sidebarWidth}
        viewMode={viewMode}
        useNewTeamStyling={USE_NEW_TEAM_STYLING}
        teamSettings={teamSettings}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        staffCounts={staffCounts}
        organizeBy={effectiveOrganizeBy}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        toggleViewMode={toggleViewMode}
        onOpenSettings={() => setShowTeamSettings(true)}
      />

      <div className="flex-1 overflow-auto bg-gradient-to-b from-[#FBF8F9] to-[#F7F2F4] relative min-h-0">
        {filteredStaff.length > 0 ? (
          <div className={`staff-card-grid grid ${gridColumns} ${gapPadding}`}>
            {filteredStaff.map((s, i) => {
              const numId = typeof s.id === 'string' ? parseInt(s.id.replace(/\D/g, '')) || i + 1 : s.id;
              const ticket = getStaffTicketInfo(s.id);
              const mod = {
                ...s,
                id: numId,
                image: s.name === 'Jane' ? '' : getStaffImage(s),
                time: typeof s.clockInTime === 'string' ? new Date(s.clockInTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : undefined,
                revenue: s.revenue ?? null,
                count: s.turnCount ?? 0,
                activeTickets: ticket?.activeTickets,
                currentTicketInfo: ticket?.currentTicketInfo ?? undefined,
                nextAppointmentTime: getStaffNextAppointment(s.id),
                lastServiceTime: getStaffLastServiceTime(s.id),
              };
              return (
                <div key={mod.id} className="w-full min-w-[80px]">
                  <Tippy content={<StaffTooltip staff={mod} />} placement="right" duration={[200, 0]} delay={[300, 0]} animation="shift-away" interactive appendTo={() => document.body}>
                    <div>
                      <StaffCardVertical
                        staff={mod as StaffMember}
                        viewMode={cardViewMode}
                        displayConfig={{
                          showName: true, showQueueNumber: true, showAvatar: true, showStatus: true, showClockedInTime: true,
                          showTurnCount: settings?.showTurnCount ?? true,
                          showNextAppointment: settings?.showNextAppointment ?? true,
                          showSalesAmount: settings?.showServicedAmount ?? true,
                          showTickets: settings?.showTicketCount ?? true,
                          showLastService: settings?.showLastDone ?? true,
                          showMoreOptionsButton: settings?.showMoreOptionsButton ?? true,
                          showAddTicketAction: settings?.showAddTicketAction ?? true,
                          showAddNoteAction: settings?.showAddNoteAction ?? true,
                          showEditTeamAction: settings?.showEditTeamAction ?? true,
                          showQuickCheckoutAction: settings?.showQuickCheckoutAction ?? true,
                          showClockInOutAction: settings?.showClockInOutAction ?? true,
                        }}
                        onClick={() => handleStaffClick(s)}
                        onAddTicket={handleAddTicket}
                        onAddNote={handleAddNote}
                        onEditTeam={handleEditTeam}
                        onQuickCheckout={handleQuickCheckout}
                        onClockIn={handleClockIn}
                        onClockOut={handleClockOut}
                      />
                    </div>
                  </Tippy>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`${emptyStateClasses.padding} text-center text-gray-500 ${emptyStateClasses.textSize}`}>
            <div className="bg-white bg-opacity-70 rounded-lg shadow-md p-4 backdrop-blur-sm"><p>No technicians match your filters</p></div>
          </div>
        )}
      </div>

      <TeamSettingsPanel isOpen={showTeamSettings} onClose={() => setShowTeamSettings(false)} currentSettings={teamSettings} onSettingsChange={handleTeamSettingsChange} />

      {showResetConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg shadow-xl max-w-md">
            <h3 className="text-lg font-bold mb-2">Reset All Staff Status?</h3>
            <p className="mb-4">This will set all clocked-in staff to "Ready" status and move all tickets back to the waiting list.</p>
            <div className="flex justify-end space-x-2">
              <button className="px-3 py-1.5 bg-gray-200 rounded-md" onClick={() => setShowResetConfirmation(false)}>Cancel</button>
              <button className="px-3 py-1.5 bg-red-500 text-white rounded-md" onClick={() => { resetStaffStatus(); setShowResetConfirmation(false); }}>Reset</button>
            </div>
          </div>
        </div>
      )}

      {isTurnTrackerEnabled && <TurnTracker isOpen={showTurnTracker} onClose={() => setShowTurnTracker(false)} />}

      {selectedStaffForNote && (
        <AddStaffNoteModal
          isOpen={showStaffNoteModal}
          onClose={closeStaffNote}
          staffId={selectedStaffForNote.id}
          staffName={selectedStaffForNote.name}
          currentNote={staffNotes[String(selectedStaffForNote.id)] || ''}
          onSave={handleSaveStaffNote}
        />
      )}

      {showStaffDetails && selectedStaffForDetails && (
        <StaffDetailsPanel
          staff={selectedStaffForDetails}
          onClose={closeStaffDetails}
          onAddTicket={handleAddTicket}
          onAddNote={handleAddNote}
          onEditTeam={handleEditTeam}
          onQuickCheckout={handleQuickCheckout}
        />
      )}
    </div>
  );
}
