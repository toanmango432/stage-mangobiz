/**
 * New Appointment Modal v3.0 - Refactored
 * Uses extracted hooks and components for maintainability
 */

import { useEffect, useState, useCallback } from 'react';
import { X, Calendar, Clock, Plus, PanelRightClose, Maximize, Check, ArrowDownToLine, LayoutPanelLeft, Lock, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { menuServicesDB, clientsDB } from '../../db/database';
import toast from 'react-hot-toast';
import { getTestSalonId } from '../../db/seed';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { selectAllStaff } from '../../store/slices/staffSlice';
import { selectMemberId } from '../../store/slices/authSlice';
import { checkPatchTestRequired } from '../../store/slices/clientsSlice/thunks';
import { LocalAppointment } from '../../types/appointment';
import { localTimeToUTC } from '../../utils/dateUtils';
import { BlockedClientOverrideModal } from '../clients/BlockedClientOverrideModal';
import { PatchTestWarningBanner } from './PatchTestWarningBanner';
import { auditLogger } from '../../services/audit/auditLogger';

import { useAppointmentForm, useAppointmentClients, useAppointmentServices } from './hooks';
import {
  MinimizedWidget,
  ClientSection,
  ServiceCatalog,
  StaffSelector,
  AppointmentSummary,
  BookingActions,
  type Client,
} from './NewAppointmentModal';

interface NewAppointmentModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  selectedTime?: Date;
  selectedStaffId?: string;
  selectedStaffName?: string;
  onSave?: (appointment: LocalAppointment) => void;
  viewMode?: 'slide' | 'fullpage';
  initialClient?: Client | null;
  onInitialClientUsed?: () => void;
}

export function NewAppointmentModalV2({
  isOpen,
  onClose,
  selectedDate,
  selectedTime,
  selectedStaffId,
  selectedStaffName,
  onSave,
  viewMode = 'slide',
  initialClient,
  onInitialClientUsed,
}: NewAppointmentModalV2Props) {
  const storeId = getTestSalonId();
  const allStaffFromRedux = useAppSelector(selectAllStaff) || [];
  const currentMemberId = useAppSelector(selectMemberId);
  const dispatch = useAppDispatch();

  // Blocked client override state
  const [blockedClientInfo, setBlockedClientInfo] = useState<{
    id: string;
    name: string;
    blockReason: string;
  } | null>(null);
  const [pendingClient, setPendingClient] = useState<any>(null);

  // Patch test warning state
  const [patchTestWarning, setPatchTestWarning] = useState<{
    clientName: string;
    serviceName: string;
    serviceId: string;
    reason: 'required' | 'expired';
    pendingService: {
      id: string;
      name: string;
      category: string;
      duration: number;
      price: number;
    };
  } | null>(null);

  // Handler for when a blocked client is selected (defined early, doesn't depend on clientHandlers)
  const handleBlockedClientSelected = useCallback(async (info: { id: string; name: string; blockReason: string }) => {
    // Fetch the full client to store for potential override
    const fullClient = await clientsDB.getById(info.id);
    if (fullClient) {
      setPendingClient(fullClient);
    }
    setBlockedClientInfo(info);
  }, []);

  // Form state hook
  const formState = useAppointmentForm({
    selectedDate,
    selectedTime,
    selectedStaffId,
    viewMode,
  });

  // Client handlers hook
  const clientHandlers = useAppointmentClients({
    isOpen,
    storeId,
    clientSearch: formState.clientSearch,
    selectedClients: formState.selectedClients,
    bookingMode: formState.bookingMode,
    partySize: formState.partySize,
    bookingGuests: formState.bookingGuests,
    newClientFirstName: formState.newClientFirstName,
    newClientLastName: formState.newClientLastName,
    newClientPhone: formState.newClientPhone,
    newClientEmail: formState.newClientEmail,
    validationErrors: formState.validationErrors,
    activeStaffId: formState.activeStaffId,
    initialClient,
    setRecentClients: formState.setRecentClients,
    setClients: formState.setClients,
    setSearching: formState.setSearching,
    setSelectedClients: formState.setSelectedClients,
    setPartySize: formState.setPartySize,
    setClientSearch: formState.setClientSearch,
    setShowAddNewForm: formState.setShowAddNewForm,
    setIsAddingAnotherClient: formState.setIsAddingAnotherClient,
    setActiveTab: formState.setActiveTab,
    setBookingGuests: formState.setBookingGuests,
    setValidationErrors: formState.setValidationErrors,
    setIsAddingClient: formState.setIsAddingClient,
    setNewClientFirstName: formState.setNewClientFirstName,
    setNewClientLastName: formState.setNewClientLastName,
    setNewClientPhone: formState.setNewClientPhone,
    setNewClientEmail: formState.setNewClientEmail,
    onInitialClientUsed,
    onBlockedClientSelected: handleBlockedClientSelected,
  });

  // Handler for block override (staff proceeds after approval) - defined after clientHandlers
  const handleBlockOverride = useCallback(async (overrideReason: string, managerApproved: boolean) => {
    if (!pendingClient || !blockedClientInfo) return;

    // Log the override attempt
    await auditLogger.log({
      action: 'update',
      entityType: 'client',
      entityId: blockedClientInfo.id,
      description: `Block override for client ${blockedClientInfo.name}: ${overrideReason}`,
      success: true,
      metadata: {
        operation: 'block_override',
        overrideReason,
        managerApproved,
        blockReason: blockedClientInfo.blockReason,
        clientName: blockedClientInfo.name,
        staffId: currentMemberId,
      },
    });

    // Proceed with client selection using the override handler
    clientHandlers.handleSelectClientAfterOverride(pendingClient);

    // Clear blocked client state
    setBlockedClientInfo(null);
    setPendingClient(null);
  }, [pendingClient, blockedClientInfo, currentMemberId, clientHandlers]);

  // Handler for canceling block override
  const handleBlockOverrideCancel = useCallback(() => {
    setBlockedClientInfo(null);
    setPendingClient(null);
  }, []);

  // Handler for canceling patch test booking
  const handlePatchTestCancel = useCallback(() => {
    setPatchTestWarning(null);
  }, []);

  // Service handlers hook
  const serviceHandlers = useAppointmentServices({
    postedStaff: formState.postedStaff,
    activeStaffId: formState.activeStaffId,
    activeStaffName: formState.activeStaffName,
    defaultStartTime: formState.defaultStartTime,
    timeMode: formState.timeMode,
    bookingMode: formState.bookingMode,
    groupStep: formState.groupStep,
    activeGuestId: formState.activeGuestId,
    bookingGuests: formState.bookingGuests,
    setPostedStaff: formState.setPostedStaff,
    setActiveStaffId: formState.setActiveStaffId,
    setActiveTab: formState.setActiveTab,
    setJustAddedService: formState.setJustAddedService,
    setBookingGuests: formState.setBookingGuests,
  });

  // Handler for patch test override - must be after serviceHandlers
  const handlePatchTestOverride = useCallback(async (overrideReason: string) => {
    if (!patchTestWarning) return;

    // Log the patch test override (audit logging per US-018)
    await auditLogger.log({
      action: 'update',
      entityType: 'client',
      entityId: formState.selectedClients[0]?.id || 'unknown',
      description: `Patch test override for service ${patchTestWarning.serviceName}: ${overrideReason}`,
      success: true,
      metadata: {
        operation: 'patch_test_override',
        overrideReason,
        serviceId: patchTestWarning.serviceId,
        serviceName: patchTestWarning.serviceName,
        reason: patchTestWarning.reason,
        clientName: patchTestWarning.clientName,
        staffId: currentMemberId,
      },
    });

    // Store pending service to add after clearing warning
    const serviceToAdd = patchTestWarning.pendingService;

    // Clear the warning
    setPatchTestWarning(null);

    // Proceed with adding the service
    if (serviceToAdd) {
      serviceHandlers.handleAddServiceToStaff(serviceToAdd);
    }
  }, [patchTestWarning, formState.selectedClients, currentMemberId, serviceHandlers]);

  // Wrapper function to check patch test before adding service
  const handleAddServiceWithPatchTestCheck = useCallback(async (service: {
    id: string;
    name: string;
    category: string;
    duration: number;
    price: number;
  }) => {
    // Skip patch test check for walk-in clients
    const selectedClient = formState.selectedClients[0];
    if (!selectedClient || selectedClient.id === 'walk-in') {
      serviceHandlers.handleAddServiceToStaff(service);
      return;
    }

    // Check if patch test is required for this service + client combo
    const result = await dispatch(checkPatchTestRequired({
      clientId: selectedClient.id,
      serviceId: service.id,
      appointmentDate: formState.date.toISOString(),
    })).unwrap();

    // If valid or no patch test required, add service directly
    if (result.valid) {
      serviceHandlers.handleAddServiceToStaff(service);
      return;
    }

    // If not valid due to patch test, show warning banner
    if (result.reason === 'patch_test_required' || result.reason === 'patch_test_expired') {
      setPatchTestWarning({
        clientName: selectedClient.name,
        serviceName: service.name,
        serviceId: service.id,
        reason: result.reason === 'patch_test_expired' ? 'expired' : 'required',
        pendingService: service,
      });
      return;
    }

    // For other reasons (e.g., client_blocked), add service anyway
    // since block check happens at client selection level
    serviceHandlers.handleAddServiceToStaff(service);
  }, [dispatch, formState.selectedClients, formState.date, serviceHandlers]);

  // Load services
  useEffect(() => {
    async function loadServices() {
      try {
        const servicesList = await menuServicesDB.getAll(storeId, false);
        formState.setServices(servicesList.map(s => ({
          id: s.id,
          name: s.name,
          category: s.categoryId,
          duration: s.duration,
          price: s.price,
          bookingAvailability: s.bookingAvailability,
          requiresPatchTest: s.requiresPatchTest,
        })));
      } catch (error) {
        console.error('Failed to load services:', error);
      }
    }
    if (isOpen) {
      loadServices();
    }
  }, [isOpen, storeId]);

  // Initialize staff if pre-selected
  useEffect(() => {
    if (isOpen && selectedStaffId && selectedStaffName) {
      formState.setActiveStaffId(selectedStaffId);
      if (!formState.postedStaff.find(s => s.staffId === selectedStaffId)) {
        formState.setPostedStaff([{
          staffId: selectedStaffId,
          staffName: selectedStaffName,
          services: [],
          isExpanded: true
        }]);
      }
    }
  }, [isOpen, selectedStaffId, selectedStaffName]);

  // Reset form on close
  useEffect(() => {
    if (!isOpen) {
      formState.resetForm();
    }
  }, [isOpen]);

  // Handle click outside view menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (formState.viewMenuRef.current && !formState.viewMenuRef.current.contains(event.target as Node)) {
        formState.setShowViewMenu(false);
      }
    }
    if (formState.showViewMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [formState.showViewMenu]);

  // Clear "just added" indicator after animation
  useEffect(() => {
    if (formState.justAddedService) {
      const timer = setTimeout(() => formState.setJustAddedService(null), 600);
      return () => clearTimeout(timer);
    }
  }, [formState.justAddedService]);

  // View change handlers
  const handleChangeView = (newView: 'slide' | 'fullpage') => {
    formState.setView(newView);
    formState.setShowViewMenu(false);
  };

  const handleSetDefaultView = (viewToSave: 'slide' | 'fullpage') => {
    localStorage.setItem('appointmentModalDefaultView', viewToSave);
    formState.setView(viewToSave);
    formState.setShowViewMenu(false);
  };

  // Book appointment handler
  const handleBook = async () => {
    if (!formState.canBook || formState.isBooking) return;
    formState.setIsBooking(true);

    const appointments = formState.selectedClients.flatMap(client =>
      formState.postedStaff
        .filter(s => s.services.length > 0)
        .map(staff => {
          const sortedServices = [...staff.services].sort((a, b) =>
            a.startTime.localeCompare(b.startTime)
          );
          const firstService = sortedServices[0];
          const lastService = sortedServices[sortedServices.length - 1];
          const scheduledStartTime = new Date(localTimeToUTC(formState.date, firstService.startTime));
          const scheduledEndTime = new Date(localTimeToUTC(formState.date, lastService.endTime));
          const staffTotalDuration = staff.services.reduce((sum, svc) => sum + svc.duration, 0);
          const staffTotalPrice = staff.services.reduce((sum, svc) => sum + svc.price, 0);
          const services = staff.services.map(svc => ({
            id: svc.id,
            serviceName: svc.name,
            category: svc.category,
            duration: svc.duration,
            price: svc.price,
            staffId: staff.staffId,
          }));
          return {
            clientId: client.id,
            clientName: client.name,
            partySize: formState.partySize,
            namedClients: formState.selectedClients.map(c => ({ id: c.id, name: c.name, phone: c.phone })),
            staffId: staff.staffId,
            staffRequested: staff.isRequested || false,
            scheduledStartTime,
            scheduledEndTime,
            services,
            duration: staffTotalDuration,
            totalPrice: staffTotalPrice,
            notes: formState.appointmentNotes,
            source: 'admin-portal',
          };
        })
    );

    try {
      for (const appointment of appointments) {
        await onSave?.(appointment as any);
      }
      onClose();
    } catch (error) {
      console.error('Error saving appointments:', error);
      toast.error(`Failed to save appointment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      formState.setIsBooking(false);
    }
  };

  // Handle walk-in selection
  const handleSelectWalkIn = () => {
    formState.setSelectedClients([{ id: 'walk-in', name: 'Walk-in', phone: '' }]);
    formState.setClientSearch('');
  };

  if (!isOpen) return null;

  // Minimized widget
  if (formState.isMinimized) {
    return (
      <MinimizedWidget
        selectedClients={formState.selectedClients}
        partySize={formState.partySize}
        postedStaff={formState.postedStaff}
        date={formState.date}
        totalDuration={formState.totalDuration}
        totalPrice={formState.totalPrice}
        onExpand={() => formState.setIsMinimized(false)}
        onClose={onClose}
      />
    );
  }

  const modalClasses = cn(
    'fixed bg-white/95 backdrop-blur-xl z-[70] flex flex-col border',
    formState.view === 'slide'
      ? 'right-0 top-0 bottom-0 left-0 sm:left-auto w-full sm:w-[90vw] sm:max-w-6xl shadow-premium-3xl border-l-0 sm:border-l border-gray-200/50'
      : 'inset-0 sm:inset-6 rounded-none sm:rounded-3xl shadow-premium-3xl border-gray-200/50'
  );

  const hasServices = formState.postedStaff.some(s => s.services.length > 0);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-md z-[60]"
        onClick={onClose}
        style={{ animation: 'fadeIn 300ms ease-out' }}
      />

      {/* Modal */}
      <div
        className={modalClasses}
        style={{
          animation: formState.view === 'slide'
            ? 'slideInRight 400ms cubic-bezier(0.4, 0.0, 0.2, 1)'
            : 'scaleIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 shrink-0 border-b border-gray-200/50 bg-white/50">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-gray-900">New Appointment</h2>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {formState.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <span className="text-xs text-gray-400">•</span>
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{formState.defaultStartTime}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {/* View Menu */}
            <div className="relative" ref={formState.viewMenuRef}>
              <button
                onClick={() => formState.setShowViewMenu(!formState.showViewMenu)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="View options"
              >
                <LayoutPanelLeft className="w-5 h-5 text-gray-500" />
              </button>
              {formState.showViewMenu && (
                <div className="absolute top-full right-0 mt-2 w-52 bg-white/95 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-premium-lg z-10 overflow-hidden animate-scale-in">
                  <div className="p-1.5">
                    <button
                      onClick={() => handleChangeView('slide')}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm rounded-xl flex items-center gap-2.5 transition-all',
                        formState.view === 'slide'
                          ? 'bg-brand-50 text-brand-900 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      <PanelRightClose className="w-4 h-4" />
                      <span className="flex-1">Side Panel</span>
                      {formState.view === 'slide' && <Check className="w-4 h-4 text-brand-600" />}
                    </button>
                    <button
                      onClick={() => handleChangeView('fullpage')}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm rounded-xl flex items-center gap-2.5 transition-all',
                        formState.view === 'fullpage'
                          ? 'bg-brand-50 text-brand-900 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      <Maximize className="w-4 h-4" />
                      <span className="flex-1">Full Page</span>
                      {formState.view === 'fullpage' && <Check className="w-4 h-4 text-brand-600" />}
                    </button>
                  </div>
                  <div className="border-t border-gray-100 p-1.5">
                    <button
                      onClick={() => handleSetDefaultView('slide')}
                      className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-xl flex items-center gap-2.5 transition-all"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Lock Side Panel</span>
                    </button>
                    <button
                      onClick={() => handleSetDefaultView('fullpage')}
                      className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-xl flex items-center gap-2.5 transition-all"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Lock Full Page</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => formState.setIsMinimized(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Minimize"
            >
              <ArrowDownToLine className="w-5 h-5 text-gray-500" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body: 2-Column Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT COLUMN */}
          <div className="w-1/2 flex flex-col relative">
            {/* Booking Mode Selector */}
            {formState.selectedClients.length === 0 && !formState.isAddingAnotherClient && (
              <div className="px-6 pt-4 pb-2">
                <div className="inline-flex items-center gap-1 p-0.5 bg-gray-100 rounded-lg">
                  <button
                    onClick={() => {
                      formState.setBookingMode('individual');
                      formState.setPartySize(1);
                      formState.setBookingGuests([]);
                      formState.setGroupStep('guests');
                      formState.setActiveGuestId(null);
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      formState.bookingMode === 'individual'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Individual
                  </button>
                  <button
                    onClick={() => {
                      formState.setBookingMode('group');
                      if (formState.partySize === 1) formState.setPartySize(2);
                      formState.setSelectedClients([]);
                      formState.setPostedStaff([]);
                      formState.setActiveStaffId(null);
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      formState.bookingMode === 'group'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Group
                  </button>
                </div>
              </div>
            )}

            {/* Client Search & Selection */}
            <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-brand-50/30 via-white to-white">
              <ClientSection
                clientSearch={formState.clientSearch}
                onClientSearchChange={formState.setClientSearch}
                clients={formState.clients}
                recentClients={formState.recentClients}
                selectedClients={formState.selectedClients}
                searching={formState.searching}
                showAddNewForm={formState.showAddNewForm}
                onShowAddNewForm={formState.setShowAddNewForm}
                onSelectClient={clientHandlers.handleSelectClient}
                onSelectWalkIn={handleSelectWalkIn}
                isAddingAnotherClient={formState.isAddingAnotherClient}
                onCancelAddAnother={() => {
                  formState.setIsAddingAnotherClient(false);
                  formState.setClientSearch('');
                }}
                newClientFirstName={formState.newClientFirstName}
                onNewClientFirstNameChange={formState.setNewClientFirstName}
                newClientLastName={formState.newClientLastName}
                onNewClientLastNameChange={formState.setNewClientLastName}
                newClientPhone={formState.newClientPhone}
                onNewClientPhoneChange={formState.setNewClientPhone}
                newClientEmail={formState.newClientEmail}
                onNewClientEmailChange={formState.setNewClientEmail}
                validationErrors={formState.validationErrors}
                onValidationErrorsChange={formState.setValidationErrors}
                onAddNewClient={clientHandlers.handleAddNewClient}
                isAddingClient={formState.isAddingClient}
                bookingMode={formState.bookingMode}
                onAddNamedGuest={clientHandlers.handleAddNamedGuest}
              />
            </div>

            {/* Selected Client Display */}
            {formState.selectedClients.length > 0 && !formState.isAddingAnotherClient && formState.bookingMode === 'individual' && (
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold shadow-md">
                      {formState.selectedClients[0].name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{formState.selectedClients[0].name}</p>
                      <p className="text-sm text-gray-500">{formState.selectedClients[0].phone || 'No phone'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => formState.setSelectedClients([])}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            )}

            {/* Tabs */}
            {formState.selectedClients.length > 0 && formState.bookingMode === 'individual' && (
              <div className="px-6 pt-4">
                <div className="flex gap-1 border-b border-gray-200">
                  <button
                    onClick={() => formState.setActiveTab('service')}
                    className={cn(
                      'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-all',
                      formState.activeTab === 'service'
                        ? 'border-brand-500 text-brand-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    )}
                  >
                    Services
                  </button>
                  <button
                    onClick={() => formState.setActiveTab('staff')}
                    className={cn(
                      'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-all',
                      formState.activeTab === 'staff'
                        ? 'border-brand-500 text-brand-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    )}
                  >
                    Staff
                  </button>
                </div>
              </div>
            )}

            {/* Tab Content */}
            {formState.selectedClients.length > 0 && formState.bookingMode === 'individual' && (
              <div className="flex-1 overflow-y-auto p-6">
                {formState.activeTab === 'service' ? (
                  <ServiceCatalog
                    services={formState.services}
                    categories={formState.categories}
                    selectedCategory={formState.selectedCategory}
                    onCategoryChange={formState.setSelectedCategory}
                    serviceSearch={formState.serviceSearch}
                    onServiceSearchChange={formState.setServiceSearch}
                    filteredServices={formState.filteredServices}
                    activeStaffId={formState.activeStaffId}
                    activeStaffName={formState.activeStaffName}
                    onAddService={handleAddServiceWithPatchTestCheck}
                    onGoToStaffTab={() => formState.setActiveTab('staff')}
                    justAddedService={formState.justAddedService}
                    bookingMode={formState.bookingMode}
                    groupStep={formState.groupStep}
                    activeGuestId={formState.activeGuestId}
                    bookingGuests={formState.bookingGuests}
                  />
                ) : (
                  <StaffSelector
                    staff={allStaffFromRedux.map(s => ({
                      id: s.id,
                      name: s.name || 'Unknown',
                    }))}
                    activeStaffId={formState.activeStaffId}
                    onSelectStaff={serviceHandlers.handleSelectStaff}
                  />
                )}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="w-1/2 border-l border-gray-200 flex flex-col bg-gray-50/30">
            {formState.bookingMode === 'group' ? (
              <div className="flex-1 overflow-y-auto p-5">
                <p className="text-sm text-gray-500">Group booking mode - coming soon</p>
              </div>
            ) : formState.selectedClients.length === 0 ? (
              /* Step 1: Choose Client message when no client selected */
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-sm">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-100 flex items-center justify-center">
                    <User className="w-8 h-8 text-brand-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Step 1: Choose Client
                  </h3>
                  <p className="text-sm text-gray-500">
                    Select an existing client, add a new one, or choose walk-in to continue
                  </p>
                </div>
              </div>
            ) : (
              <>
                <AppointmentSummary
                  date={formState.date}
                  onDateChange={formState.setDate}
                  defaultStartTime={formState.defaultStartTime}
                  onDefaultStartTimeChange={formState.setDefaultStartTime}
                  timeMode={formState.timeMode}
                  onTimeModeToggle={() => formState.setTimeMode(formState.timeMode === 'sequential' ? 'parallel' : 'sequential')}
                  appointmentNotes={formState.appointmentNotes}
                  onAppointmentNotesChange={formState.setAppointmentNotes}
                  postedStaff={formState.postedStaff}
                  activeStaffId={formState.activeStaffId}
                  onToggleStaffExpanded={serviceHandlers.toggleStaffExpanded}
                  onToggleStaffRequested={serviceHandlers.toggleStaffRequested}
                  onRemoveStaff={serviceHandlers.handleRemoveStaff}
                  onRemoveService={serviceHandlers.handleRemoveService}
                  onUpdateServiceTime={serviceHandlers.handleUpdateServiceTime}
                  onAddAnotherStaff={() => formState.setActiveTab('staff')}
                />

                <BookingActions
                  totalDuration={formState.totalDuration}
                  totalPrice={formState.totalPrice}
                  validationMessage={formState.validationMessage}
                  canBook={formState.canBook}
                  isBooking={formState.isBooking}
                  hasServices={hasServices}
                  onCancel={onClose}
                  onBook={handleBook}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Blocked Client Override Modal */}
      {blockedClientInfo && (
        <BlockedClientOverrideModal
          clientId={blockedClientInfo.id}
          clientName={blockedClientInfo.name}
          blockReason={blockedClientInfo.blockReason}
          onOverride={handleBlockOverride}
          onCancel={handleBlockOverrideCancel}
        />
      )}

      {/* Patch Test Warning Banner (shown as modal overlay) */}
      {patchTestWarning && (
        <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4">
          <div className="max-w-lg w-full">
            <PatchTestWarningBanner
              clientName={patchTestWarning.clientName}
              serviceName={patchTestWarning.serviceName}
              reason={patchTestWarning.reason}
              onOverride={handlePatchTestOverride}
              onCancel={handlePatchTestCancel}
            />
          </div>
        </div>
      )}
    </>
  );
}
