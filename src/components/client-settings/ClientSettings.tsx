import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { EnhancedClient, ClientSettingsSection, LoyaltyTier } from './types';
import type { Client } from '../../types';
import { clientSettingsTokens, tierLabels } from './constants';
import { ClientList } from './components/ClientList';
import { AddClient } from './components/AddClient';
import { Button, Badge, Avatar, ArrowLeftIcon } from './components/SharedComponents';
import { ProfileSection } from './sections/ProfileSection';
import { PreferencesSection } from './sections/PreferencesSection';
import { BeautyProfileSection } from './sections/BeautyProfileSection';
import { SafetySection } from './sections/SafetySection';
import { HistorySection } from './sections/HistorySection';
import { NotesSection } from './sections/NotesSection';
import { LoyaltySection } from './sections/LoyaltySection';
import { WalletSection } from './sections/WalletSection';
import type { AppDispatch, RootState } from '../../store';
import {
  fetchClients,
  fetchClientStats,
  createClient,
  updateClient,
  selectClient,
  setFilters,
  selectClients,
  selectSelectedClient,
  selectClientFilters,
  selectClientsLoading,
  selectClientsSaving,
  selectClientStats,
} from '../../store/slices/clientsSlice';

interface ClientSettingsProps {
  onBack?: () => void;
}

// Adapter: Convert Client to EnhancedClient for UI compatibility
function clientToEnhanced(client: Client): EnhancedClient {
  return {
    id: client.id,
    salonId: client.salonId,
    firstName: client.firstName,
    lastName: client.lastName,
    displayName: client.displayName,
    nickname: client.nickname,
    avatar: client.avatar,
    gender: client.gender,
    birthday: client.birthday,
    contact: {
      phone: client.phone,
      phoneType: 'mobile',
      email: client.email,
      preferredContact: client.communicationPreferences?.preferredContact || 'phone',
    },
    address: client.address,
    emergencyContact: client.emergencyContacts?.[0] ? {
      name: client.emergencyContacts[0].name,
      phone: client.emergencyContacts[0].phone,
      relationship: client.emergencyContacts[0].relationship,
    } : undefined,
    source: client.source,
    sourceDetails: client.sourceDetails,
    referredByClientId: client.referredByClientId,
    referredByClientName: client.referredByClientName,
    hairProfile: client.hairProfile,
    skinProfile: client.skinProfile,
    nailProfile: client.nailProfile,
    medicalInfo: client.medicalInfo,
    preferences: client.preferences,
    communicationPreferences: client.communicationPreferences || {
      allowEmail: true,
      allowSms: true,
      allowPhone: true,
      allowMarketing: false,
      appointmentReminders: true,
      reminderTiming: 24,
      birthdayGreetings: true,
      promotionalOffers: false,
      newsletterSubscribed: false,
    },
    loyaltyInfo: client.loyaltyInfo || {
      tier: 'bronze',
      pointsBalance: 0,
      lifetimePoints: 0,
      referralCount: 0,
      rewardsRedeemed: 0,
    },
    membership: client.membership,
    giftCards: client.giftCards,
    visitSummary: client.visitSummary || {
      totalVisits: 0,
      totalSpent: 0,
      averageTicket: 0,
      noShowCount: 0,
      lateCancelCount: 0,
    },
    outstandingBalance: client.outstandingBalance,
    storeCredit: client.storeCredit,
    tags: client.tags,
    notes: client.notes,
    isVip: client.isVip,
    isBlocked: client.isBlocked,
    blockReason: client.blockReasonNote,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
    syncStatus: client.syncStatus,
  };
}

// Adapter: Convert EnhancedClient updates back to Client format
function enhancedUpdatesToClient(updates: Partial<EnhancedClient>): Partial<Client> {
  const clientUpdates: Partial<Client> = {};

  if (updates.firstName !== undefined) clientUpdates.firstName = updates.firstName;
  if (updates.lastName !== undefined) clientUpdates.lastName = updates.lastName;
  if (updates.displayName !== undefined) clientUpdates.displayName = updates.displayName;
  if (updates.nickname !== undefined) clientUpdates.nickname = updates.nickname;
  if (updates.avatar !== undefined) clientUpdates.avatar = updates.avatar;
  if (updates.gender !== undefined) clientUpdates.gender = updates.gender;
  if (updates.birthday !== undefined) clientUpdates.birthday = updates.birthday;
  if (updates.contact) {
    if (updates.contact.phone) clientUpdates.phone = updates.contact.phone;
    if (updates.contact.email !== undefined) clientUpdates.email = updates.contact.email;
  }
  if (updates.address !== undefined) clientUpdates.address = updates.address;
  if (updates.source !== undefined) clientUpdates.source = updates.source;
  if (updates.hairProfile !== undefined) clientUpdates.hairProfile = updates.hairProfile;
  if (updates.skinProfile !== undefined) clientUpdates.skinProfile = updates.skinProfile;
  if (updates.nailProfile !== undefined) clientUpdates.nailProfile = updates.nailProfile;
  if (updates.medicalInfo !== undefined) clientUpdates.medicalInfo = updates.medicalInfo;
  if (updates.preferences !== undefined) clientUpdates.preferences = updates.preferences;
  if (updates.communicationPreferences !== undefined) clientUpdates.communicationPreferences = updates.communicationPreferences;
  if (updates.loyaltyInfo !== undefined) clientUpdates.loyaltyInfo = updates.loyaltyInfo;
  if (updates.membership !== undefined) clientUpdates.membership = updates.membership;
  if (updates.tags !== undefined) clientUpdates.tags = updates.tags;
  if (updates.notes !== undefined) clientUpdates.notes = updates.notes;
  if (updates.isVip !== undefined) clientUpdates.isVip = updates.isVip;
  if (updates.isBlocked !== undefined) clientUpdates.isBlocked = updates.isBlocked;

  return clientUpdates;
}

export const ClientSettings: React.FC<ClientSettingsProps> = ({ onBack }) => {
  const dispatch = useDispatch<AppDispatch>();

  // Redux state
  const clients = useSelector(selectClients);
  const selectedClientFromStore = useSelector(selectSelectedClient);
  const filters = useSelector(selectClientFilters);
  const loading = useSelector(selectClientsLoading);
  const saving = useSelector(selectClientsSaving);
  const stats = useSelector(selectClientStats);

  // Get salonId from auth state or use a default
  const salonId = useSelector((state: RootState) => state.auth?.user?.salonId || 'default-salon');

  // Local UI state
  const [activeSection, setActiveSection] = useState<ClientSettingsSection>('profile');
  const [filterTier, setFilterTier] = useState<LoyaltyTier | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'blocked' | 'vip'>('all');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isMobileListVisible, setIsMobileListVisible] = useState(true);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState<Partial<EnhancedClient>>({});

  // Convert clients to EnhancedClient format for UI
  const enhancedClients = useMemo(() => clients.map(clientToEnhanced), [clients]);

  // Convert selected client to EnhancedClient format
  const selectedClient = useMemo(() => {
    if (!selectedClientFromStore) return null;
    const enhanced = clientToEnhanced(selectedClientFromStore);
    // Apply pending updates for immediate UI feedback
    return { ...enhanced, ...pendingUpdates };
  }, [selectedClientFromStore, pendingUpdates]);

  // Fetch clients on mount
  useEffect(() => {
    dispatch(fetchClients({
      salonId,
      filters: {
        searchQuery: filters.searchQuery,
        status: filterStatus,
        loyaltyTier: filterTier,
      },
    }));
    dispatch(fetchClientStats(salonId));
  }, [dispatch, salonId, filterStatus, filterTier, filters.searchQuery]);

  // Search handler
  const handleSearchChange = useCallback((query: string) => {
    dispatch(setFilters({ searchQuery: query }));
  }, [dispatch]);

  // Filter handlers
  const handleFilterTierChange = useCallback((tier: LoyaltyTier | 'all') => {
    setFilterTier(tier);
  }, []);

  const handleFilterStatusChange = useCallback((status: 'all' | 'active' | 'blocked' | 'vip') => {
    setFilterStatus(status);
  }, []);

  // Update client handler - accumulates changes locally
  const handleUpdateClient = useCallback((updates: Partial<EnhancedClient>) => {
    setPendingUpdates(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  }, []);

  // Section navigation items
  const sectionNav: { id: ClientSettingsSection; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Profile', icon: <UserIcon className="w-5 h-5" /> },
    { id: 'preferences', label: 'Preferences', icon: <HeartIcon className="w-5 h-5" /> },
    { id: 'beauty-profile', label: 'Beauty Profile', icon: <SparklesIcon className="w-5 h-5" /> },
    { id: 'safety', label: 'Safety', icon: <ShieldIcon className="w-5 h-5" /> },
    { id: 'history', label: 'History', icon: <ClockIcon className="w-5 h-5" /> },
    { id: 'wallet', label: 'Wallet', icon: <WalletIcon className="w-5 h-5" /> },
    { id: 'notes', label: 'Notes & Tags', icon: <NoteIcon className="w-5 h-5" /> },
    { id: 'loyalty', label: 'Loyalty', icon: <StarIcon className="w-5 h-5" /> },
  ];

  const handleSelectClient = useCallback((clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      dispatch(selectClient(client));
      setPendingUpdates({});
      setHasUnsavedChanges(false);
    }
    setIsMobileListVisible(false);
    setActiveSection('profile');
  }, [dispatch, clients]);

  const handleAddClient = useCallback(() => {
    setIsAddingClient(true);
  }, []);

  const handleSaveNewClient = useCallback(async (newClient: EnhancedClient) => {
    try {
      const clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'> = {
        salonId,
        firstName: newClient.firstName,
        lastName: newClient.lastName,
        phone: newClient.contact.phone,
        email: newClient.contact.email,
        isBlocked: false,
        isVip: false,
      };

      const result = await dispatch(createClient(clientData)).unwrap();
      dispatch(selectClient(result));
      setIsAddingClient(false);
      setIsMobileListVisible(false);
    } catch (error) {
      console.error('Failed to create client:', error);
    }
  }, [dispatch, salonId]);

  const handleSave = useCallback(async () => {
    if (!selectedClientFromStore || Object.keys(pendingUpdates).length === 0) return;

    try {
      const clientUpdates = enhancedUpdatesToClient(pendingUpdates);
      await dispatch(updateClient({
        id: selectedClientFromStore.id,
        updates: clientUpdates,
      })).unwrap();

      setPendingUpdates({});
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save changes:', error);
    }
  }, [dispatch, selectedClientFromStore, pendingUpdates]);

  const getTierBadgeStyle = (tier: LoyaltyTier) => {
    const colors = clientSettingsTokens.tierColors[tier];
    return {
      backgroundColor: colors.bg,
      color: colors.text,
    };
  };

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
            <h1 className="text-xl font-bold text-gray-900">Clients</h1>
            <p className="text-sm text-gray-500">
              {stats.total} clients • {stats.vip} VIP • {stats.blocked} blocked
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <Badge variant="warning">Unsaved Changes</Badge>
          )}
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!hasUnsavedChanges || saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile: Back to list button */}
        <div className="lg:hidden">
          {!isMobileListVisible && selectedClient && (
            <button
              onClick={() => setIsMobileListVisible(true)}
              className="fixed top-20 left-4 z-20 bg-white shadow-lg rounded-full p-2 border border-gray-200"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>

        {/* Client List Sidebar */}
        <aside
          className={`
            w-full lg:w-80 flex-shrink-0 bg-white border-r border-gray-200
            ${isMobileListVisible ? 'block' : 'hidden lg:block'}
          `}
        >
          <ClientList
            clients={enhancedClients}
            selectedClientId={selectedClientFromStore?.id || null}
            onSelectClient={handleSelectClient}
            onAddClient={handleAddClient}
            searchQuery={filters.searchQuery}
            onSearchChange={handleSearchChange}
            filterTier={filterTier}
            onFilterTierChange={handleFilterTierChange}
            filterStatus={filterStatus}
            onFilterStatusChange={handleFilterStatusChange}
            loading={loading}
          />
        </aside>

        {/* Main Settings Area */}
        {selectedClient && !isMobileListVisible && (
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Client Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar
                    src={selectedClient.avatar}
                    name={`${selectedClient.firstName} ${selectedClient.lastName}`}
                    size="lg"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {selectedClient.firstName} {selectedClient.lastName}
                      </h2>
                      {selectedClient.isVip && (
                        <Badge variant="warning" size="sm">VIP</Badge>
                      )}
                      {selectedClient.isBlocked && (
                        <Badge variant="error" size="sm">Blocked</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={getTierBadgeStyle(selectedClient.loyaltyInfo.tier)}
                      >
                        {tierLabels[selectedClient.loyaltyInfo.tier]}
                      </span>
                      <span className="text-sm text-gray-500">
                        {selectedClient.contact.phone}
                      </span>
                      {selectedClient.contact.email && (
                        <>
                          <span className="text-gray-300">|</span>
                          <span className="text-sm text-gray-500">
                            {selectedClient.contact.email}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {selectedClient.visitSummary.totalVisits} visits
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    ${selectedClient.visitSummary.totalSpent.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Section Navigation */}
              <nav className="mt-4 -mb-4 overflow-x-auto">
                <div className="flex gap-1 min-w-max">
                  {sectionNav.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
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
                  client={selectedClient}
                  onChange={handleUpdateClient}
                />
              )}

              {activeSection === 'preferences' && (
                <PreferencesSection
                  client={selectedClient}
                  onChange={handleUpdateClient}
                />
              )}

              {activeSection === 'beauty-profile' && (
                <BeautyProfileSection
                  client={selectedClient}
                  onChange={handleUpdateClient}
                />
              )}

              {activeSection === 'safety' && (
                <SafetySection
                  client={selectedClient}
                  onChange={handleUpdateClient}
                />
              )}

              {activeSection === 'history' && (
                <HistorySection
                  client={selectedClient}
                />
              )}

              {activeSection === 'wallet' && (
                <WalletSection
                  client={selectedClient}
                  onChange={handleUpdateClient}
                />
              )}

              {activeSection === 'notes' && (
                <NotesSection
                  client={selectedClient}
                  onChange={handleUpdateClient}
                />
              )}

              {activeSection === 'loyalty' && (
                <LoyaltySection
                  client={selectedClient}
                  onChange={handleUpdateClient}
                />
              )}
            </div>
          </main>
        )}

        {/* Empty State when no client selected on desktop */}
        {!selectedClient && !isMobileListVisible && (
          <main className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
                <UsersIcon className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Select a Client</h3>
              <p className="text-sm text-gray-500 max-w-sm">
                Choose a client from the list to view and edit their information
              </p>
            </div>
          </main>
        )}
      </div>

      {/* Add Client Modal */}
      {isAddingClient && (
        <AddClient
          onClose={() => setIsAddingClient(false)}
          onSave={handleSaveNewClient}
        />
      )}
    </div>
  );
};

// Icons
const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const HeartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const NoteIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const ShieldIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const WalletIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

export default ClientSettings;
