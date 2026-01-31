import React, { useEffect, useCallback, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { TeamMemberSettings, TeamSettingsSection, StaffRole } from './types';
import { mockTeamMembers, roleLabels, teamSettingsTokens } from './constants';
import { TeamMemberList } from './components/TeamMemberList';
import { AddTeamMember } from './components/AddTeamMember';
import { Button, Badge } from './components/SharedComponents';
import { ProfileSection } from './sections/ProfileSection';
import { ServicesSection } from './sections/ServicesSection';
import { ScheduleSection } from './sections/ScheduleSection';
import { TimesheetSection } from './sections/TimesheetSection';
import { PermissionsSection } from './sections/PermissionsSection';
import { CommissionSection } from './sections/CommissionSection';
import { PayrollSection } from './sections/PayrollSection';
import { OnlineBookingSection } from './sections/OnlineBookingSection';
import { NotificationsSection } from './sections/NotificationsSection';
import { PerformanceSection } from './sections/PerformanceSection';
import { LoginCredentialsSection } from './sections/LoginCredentialsSection';
import { supabase } from '../../services/supabase/client';
import { selectStoreId } from '../../store/slices/authSlice';

// Redux imports
import type { AppDispatch } from '../../store';
import {
  // Selectors
  selectFilteredTeamMembers,
  selectAllTeamMembers,
  selectSelectedTeamMember,
  selectTeamUI,
  selectTeamLoading,
  selectTeamError,
  // Actions
  setSelectedMember,
  setActiveSection,
  setSearchQuery,
  setFilterRole,
  setFilterStatus,
  setIsAddingNew,
  setHasUnsavedChanges,
  setMobileListVisible,
  updateMember,
  addMember,
  clearError,
  // Thunks
  fetchTeamMembers,
  saveTeamMember,
  archiveTeamMember,
  restoreTeamMember,
  deleteTeamMember,
  setMembers,
} from '../../store/slices/teamSlice';
import { teamDB } from '../../db/teamOperations';

interface TeamSettingsProps {
  onBack?: () => void;
}

export const TeamSettings: React.FC<TeamSettingsProps> = ({ onBack }) => {
  const dispatch = useDispatch<AppDispatch>();

  // Redux selectors
  const members = useSelector(selectFilteredTeamMembers);
  const allMembers = useSelector(selectAllTeamMembers);
  const selectedMember = useSelector(selectSelectedTeamMember);
  const ui = useSelector(selectTeamUI);
  const loading = useSelector(selectTeamLoading);
  const error = useSelector(selectTeamError);

  // Get store ID from auth state
  const storeId = useSelector(selectStoreId);

  // Get all existing emails for uniqueness validation
  const existingEmails = allMembers.map(m => m.profile.email);

  const {
    selectedMemberId,
    activeSection,
    searchQuery,
    filterRole,
    filterStatus,
    hasUnsavedChanges,
    isMobileListVisible,
    isAddingNew,
  } = ui;

  // Toast state for notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Discard confirmation modal
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Navigation warning state
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // Saving state for button feedback
  const [isSaving, setIsSaving] = useState(false);

  // Show toast helper
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Load team data on mount using unified fetchTeamMembers thunk
  // The thunk handles IndexedDB-first with Supabase fallback internally
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('📡 Fetching team members via Redux thunk for store:', storeId);
        const result = await dispatch(fetchTeamMembers(storeId ?? undefined)).unwrap();

        // If no data, seed with mock data
        if (result.length === 0) {
          await teamDB.seedInitialData(mockTeamMembers, 'system', 'seed');
          dispatch(setMembers(mockTeamMembers));
          if (mockTeamMembers.length > 0) {
            dispatch(setSelectedMember(mockTeamMembers[0].id));
          }
        } else if (result.length > 0 && !selectedMemberId) {
          dispatch(setSelectedMember(result[0].id));
        }
        console.log(`✅ Loaded ${result.length} team members`);
      } catch (err) {
        console.error('Failed to load team data:', err);
        // Fall back to mock data on error
        dispatch(setMembers(mockTeamMembers));
        if (mockTeamMembers.length > 0) {
          dispatch(setSelectedMember(mockTeamMembers[0].id));
        }
      }
    };

    loadData();
  }, [dispatch, storeId]);

  // Update member handler - marks changes as unsaved (manual save pattern)
  const handleUpdateMember = useCallback((updates: Partial<TeamMemberSettings>) => {
    if (!selectedMemberId) return;
    dispatch(updateMember({ id: selectedMemberId, updates }));
    dispatch(setHasUnsavedChanges(true));
  }, [dispatch, selectedMemberId]);

  // Section navigation items
  const sectionNav: { id: TeamSettingsSection; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Profile', icon: <UserIcon className="w-5 h-5" /> },
    { id: 'login', label: 'Login', icon: <KeyIcon className="w-5 h-5" /> },
    { id: 'services', label: 'Services', icon: <ScissorsIcon className="w-5 h-5" /> },
    { id: 'schedule', label: 'Schedule', icon: <CalendarIcon className="w-5 h-5" /> },
    { id: 'timesheet', label: 'Timesheet', icon: <ClockIcon className="w-5 h-5" /> },
    { id: 'permissions', label: 'Permissions', icon: <ShieldIcon className="w-5 h-5" /> },
    { id: 'commission', label: 'Commission', icon: <DollarIcon className="w-5 h-5" /> },
    { id: 'payroll', label: 'Payroll', icon: <WalletIcon className="w-5 h-5" /> },
    { id: 'performance', label: 'Performance', icon: <ChartIcon className="w-5 h-5" /> },
    { id: 'online-booking', label: 'Online Booking', icon: <GlobeIcon className="w-5 h-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <BellIcon className="w-5 h-5" /> },
  ];

  const handleSelectMember = useCallback((memberId: string) => {
    // If there are unsaved changes, show confirmation
    if (hasUnsavedChanges) {
      setPendingNavigation(memberId);
      return;
    }
    dispatch(setSelectedMember(memberId));
    dispatch(setMobileListVisible(false));
  }, [dispatch, hasUnsavedChanges]);

  // Confirm navigation (discard changes and switch member)
  const handleConfirmNavigation = useCallback(() => {
    if (pendingNavigation) {
      dispatch(setSelectedMember(pendingNavigation));
      dispatch(setMobileListVisible(false));
      dispatch(setHasUnsavedChanges(false));
      setPendingNavigation(null);
    }
  }, [dispatch, pendingNavigation]);

  // Cancel navigation
  const handleCancelNavigation = useCallback(() => {
    setPendingNavigation(null);
  }, []);

  const handleAddMember = useCallback(() => {
    dispatch(setIsAddingNew(true));
  }, [dispatch]);

  const handleSaveNewMember = useCallback(async (newMember: TeamMemberSettings) => {
    try {
      await dispatch(saveTeamMember({ member: newMember })).unwrap();
      dispatch(setSelectedMember(newMember.id));
      dispatch(setIsAddingNew(false));
      dispatch(setMobileListVisible(false));
    } catch (err) {
      console.error('Failed to save new member:', err);
      // Still add to local state even if DB fails
      dispatch(addMember(newMember));
      dispatch(setSelectedMember(newMember.id));
      dispatch(setIsAddingNew(false));
      dispatch(setMobileListVisible(false));
    }
  }, [dispatch]);

  const handleSave = useCallback(async () => {
    if (!selectedMember || isSaving) return;

    setIsSaving(true);
    try {
      await dispatch(saveTeamMember({ member: selectedMember })).unwrap();
      dispatch(setHasUnsavedChanges(false));
      showToast('Changes saved', 'success');
    } catch (err) {
      console.error('Failed to save changes:', err);
      showToast('Failed to save changes', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [dispatch, selectedMember, showToast, isSaving]);

  // Discard changes handler - reloads member from database
  const handleDiscard = useCallback(async () => {
    if (!selectedMemberId) return;

    try {
      // Reload the member data from database
      await dispatch(fetchTeamMembers(undefined)).unwrap();
      dispatch(setHasUnsavedChanges(false));
      setShowDiscardConfirm(false);
      showToast('Changes discarded', 'success');
    } catch (err) {
      console.error('Failed to discard changes:', err);
      showToast('Failed to discard changes', 'error');
    }
  }, [dispatch, selectedMemberId, showToast]);

  // Archive member handler
  const handleArchiveMember = useCallback(async () => {
    if (!selectedMemberId) return;
    try {
      await dispatch(archiveTeamMember({ memberId: selectedMemberId })).unwrap();
    } catch (err) {
      console.error('Failed to archive member:', err);
    }
  }, [dispatch, selectedMemberId]);

  // Restore member handler
  const handleRestoreMember = useCallback(async () => {
    if (!selectedMemberId) return;
    try {
      await dispatch(restoreTeamMember({ memberId: selectedMemberId })).unwrap();
    } catch (err) {
      console.error('Failed to restore member:', err);
    }
  }, [dispatch, selectedMemberId]);

  // Delete member handler
  const handleDeleteMember = useCallback(async () => {
    if (!selectedMemberId) return;
    try {
      await dispatch(deleteTeamMember({ memberId: selectedMemberId })).unwrap();
      dispatch(setSelectedMember(null));
    } catch (err) {
      console.error('Failed to delete member:', err);
    }
  }, [dispatch, selectedMemberId]);

  const handleSearchChange = useCallback((query: string) => {
    dispatch(setSearchQuery(query));
  }, [dispatch]);

  const handleFilterRoleChange = useCallback((role: StaffRole | 'all') => {
    dispatch(setFilterRole(role));
  }, [dispatch]);

  const handleFilterStatusChange = useCallback((status: 'all' | 'active' | 'inactive') => {
    dispatch(setFilterStatus(status as 'all' | 'active' | 'inactive' | 'archived'));
  }, [dispatch]);

  const handleSectionChange = useCallback((section: TeamSettingsSection) => {
    dispatch(setActiveSection(section));
  }, [dispatch]);

  const handleBackToList = useCallback(() => {
    dispatch(setMobileListVisible(true));
  }, [dispatch]);

  const handleCloseAddMember = useCallback(() => {
    dispatch(setIsAddingNew(false));
  }, [dispatch]);

  const getRoleColor = (role: StaffRole) => {
    return teamSettingsTokens.roleColors[role] || teamSettingsTokens.roleColors.stylist;
  };

  // Clear error on unmount
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900">Team Settings</h1>
            <p className="text-sm text-gray-500">Manage your team members and their settings</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {error && (
            <Badge variant="error">{error}</Badge>
          )}
          {hasUnsavedChanges && (
            <Badge variant="warning">Unsaved Changes</Badge>
          )}
          {hasUnsavedChanges && (
            <Button
              variant="outline"
              onClick={() => setShowDiscardConfirm(true)}
              disabled={isSaving}
            >
              Discard
            </Button>
          )}
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile: Back to list button */}
        <div className="lg:hidden">
          {!isMobileListVisible && selectedMember && (
            <button
              onClick={handleBackToList}
              className="fixed top-20 left-4 z-20 bg-white shadow-lg rounded-full p-2 border border-gray-200"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>

        {/* Team Member List Sidebar */}
        <aside
          className={`
            w-full lg:w-80 flex-shrink-0 bg-white border-r border-gray-200
            ${isMobileListVisible ? 'block' : 'hidden lg:block'}
          `}
        >
          <TeamMemberList
            members={members}
            selectedMemberId={selectedMemberId}
            onSelectMember={handleSelectMember}
            onAddMember={handleAddMember}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            filterRole={filterRole}
            onFilterRoleChange={handleFilterRoleChange}
            filterStatus={filterStatus === 'archived' ? 'inactive' : filterStatus}
            onFilterStatusChange={handleFilterStatusChange}
            loading={loading && members.length === 0}
          />
        </aside>

        {/* Main Settings Area */}
        {selectedMember && !isMobileListVisible && (
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Member Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white text-xl font-bold">
                    {selectedMember.profile.avatar ? (
                      <img
                        src={selectedMember.profile.avatar}
                        alt={selectedMember.profile.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      `${selectedMember.profile.firstName[0]}${selectedMember.profile.lastName[0]}`
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {selectedMember.profile.firstName} {selectedMember.profile.lastName}
                      </h2>
                      <Badge
                        variant={selectedMember.isActive ? 'success' : 'error'}
                        dot
                        dotColor={selectedMember.isActive ? '#66BB6A' : '#EF5350'}
                        size="sm"
                      >
                        {selectedMember.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: getRoleColor(selectedMember.permissions.role).bg,
                          color: getRoleColor(selectedMember.permissions.role).text,
                        }}
                      >
                        {roleLabels[selectedMember.permissions.role]}
                      </span>
                      <span className="text-sm text-gray-500">
                        {selectedMember.profile.email}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section Navigation */}
              <nav className="mt-4 -mb-4 overflow-x-auto">
                <div className="flex gap-1 min-w-max">
                  {sectionNav.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => handleSectionChange(section.id)}
                      className={`
                        flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg
                        border-b-2 transition-all duration-200
                        ${activeSection === section.id
                          ? 'border-cyan-500 text-cyan-600 bg-cyan-50/50'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      {section.icon}
                      <span className="hidden sm:inline">{section.label}</span>
                    </button>
                  ))}
                </div>
              </nav>
            </div>

            {/* Section Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeSection === 'profile' && (
                <ProfileSection
                  profile={selectedMember.profile}
                  isActive={selectedMember.isActive}
                  onChange={(profile) => handleUpdateMember({ profile })}
                  onToggleActive={() => handleUpdateMember({ isActive: !selectedMember.isActive })}
                  onArchive={handleArchiveMember}
                  onRestore={handleRestoreMember}
                  onDelete={handleDeleteMember}
                />
              )}

              {activeSection === 'login' && (
                <LoginCredentialsSection
                  email={selectedMember.profile.email}
                  onPasswordChange={async (newPassword) => {
                    // Update password in Supabase members table
                    const { error } = await supabase
                      .from('members')
                      .update({ password_hash: newPassword })
                      .eq('email', selectedMember.profile.email);
                    if (error) throw new Error(error.message);
                  }}
                  onPinChange={async (newPin) => {
                    // Update PIN in Supabase members table
                    const { error } = await supabase
                      .from('members')
                      .update({ pin: newPin })
                      .eq('email', selectedMember.profile.email);
                    if (error) throw new Error(error.message);
                  }}
                />
              )}

              {activeSection === 'services' && (
                <ServicesSection
                  services={selectedMember.services}
                  onChange={(services) => handleUpdateMember({ services })}
                />
              )}

              {activeSection === 'schedule' && (
                <ScheduleSection
                  workingHours={selectedMember.workingHours}
                  memberId={selectedMember.id}
                  memberName={selectedMember.profile.displayName}
                  onChange={(workingHours) => handleUpdateMember({ workingHours })}
                />
              )}

              {activeSection === 'timesheet' && (
                <TimesheetSection
                  memberId={selectedMember.id}
                  memberName={selectedMember.profile.displayName}
                  storeId={selectedMember.storeId}
                />
              )}

              {activeSection === 'permissions' && (
                <PermissionsSection
                  permissions={selectedMember.permissions}
                  onChange={(permissions) => handleUpdateMember({ permissions })}
                />
              )}

              {activeSection === 'commission' && (
                <CommissionSection
                  commission={selectedMember.commission}
                  payroll={selectedMember.payroll}
                  onCommissionChange={(commission) => handleUpdateMember({ commission })}
                  onPayrollChange={(payroll) => handleUpdateMember({ payroll })}
                />
              )}

              {activeSection === 'payroll' && (
                <PayrollSection
                  memberId={selectedMember.id}
                  memberName={selectedMember.profile.displayName}
                  storeId={selectedMember.storeId}
                />
              )}

              {activeSection === 'online-booking' && (
                <OnlineBookingSection
                  settings={selectedMember.onlineBooking}
                  onChange={(onlineBooking) => handleUpdateMember({ onlineBooking })}
                  memberName={`${selectedMember.profile.firstName} ${selectedMember.profile.lastName}`}
                />
              )}

              {activeSection === 'notifications' && (
                <NotificationsSection
                  notifications={selectedMember.notifications}
                  onChange={(notifications) => handleUpdateMember({ notifications })}
                />
              )}

              {activeSection === 'performance' && (
                <PerformanceSection
                  memberId={selectedMember.id}
                  memberName={selectedMember.profile.displayName}
                  storeId={selectedMember.storeId}
                  goals={selectedMember.performanceGoals}
                  onGoalsChange={(performanceGoals) => handleUpdateMember({ performanceGoals })}
                />
              )}
            </div>
          </main>
        )}

        {/* Empty State when no member selected on desktop */}
        {!selectedMember && !isMobileListVisible && (
          <main className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
                <UsersIcon className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Select a Team Member</h3>
              <p className="text-sm text-gray-500 max-w-sm">
                Choose a team member from the list to view and edit their settings
              </p>
            </div>
          </main>
        )}
      </div>

      {/* Add Team Member Modal */}
      {isAddingNew && (
        <AddTeamMember
          onClose={handleCloseAddMember}
          onSave={handleSaveNewMember}
          existingEmails={existingEmails}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`
            fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg text-white
            flex items-center gap-2 z-50 animate-in slide-in-from-bottom-4 duration-200
            ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}
          `}
        >
          {toast.type === 'success' ? (
            <CheckCircleIcon className="w-5 h-5" />
          ) : (
            <ExclamationCircleIcon className="w-5 h-5" />
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Discard Changes Confirmation Modal */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <ExclamationCircleIcon className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Discard Changes?</h3>
            </div>
            <p className="text-gray-600 mb-6">
              You have unsaved changes. Are you sure you want to discard them? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDiscardConfirm(false)}>
                Keep Editing
              </Button>
              <Button variant="danger" onClick={handleDiscard}>
                Discard Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Warning Modal */}
      {pendingNavigation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <ExclamationCircleIcon className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Unsaved Changes</h3>
            </div>
            <p className="text-gray-600 mb-6">
              You have unsaved changes. Would you like to save them before switching to another team member?
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleCancelNavigation}>
                Cancel
              </Button>
              <Button variant="outline" onClick={handleConfirmNavigation}>
                Don't Save
              </Button>
              <Button variant="primary" onClick={async () => {
                await handleSave();
                handleConfirmNavigation();
              }}>
                Save & Continue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Icons
const ArrowLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ScissorsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0 0L9.121 9.121" />
  </svg>
);

const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ShieldIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const DollarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const GlobeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BellIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const WalletIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const ChartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ExclamationCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const KeyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

export default TeamSettings;
