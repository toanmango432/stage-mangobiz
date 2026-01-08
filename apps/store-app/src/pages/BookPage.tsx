/**
 * BookPage Component
 * Main appointment calendar page
 */

import { useEffect, useState } from 'react';
import { useAppointmentCalendar } from '../hooks/useAppointmentCalendar';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useBookSidebar } from '../hooks/useBookSidebar';
import { selectAllStaff, loadStaff } from '../store/slices/uiStaffSlice';
import { fetchTeamMembers } from '../store/slices/teamSlice';
import { selectStoreId } from '../store/slices/authSlice';
import { selectPendingBookingClient, clearPendingBookingClient } from '../store/slices/uiSlice';
import {
  CalendarHeader,
  CommandPalette,
  BookSidebar,
  CustomerSearchModal,
  NewAppointmentModalV2,
  AppointmentDetailsModal,
  EditAppointmentModal,
} from '../components/Book';
import { CalendarLoadingOverlay } from '../components/Book/skeletons';
import { DaySchedule } from '../components/Book/DaySchedule';
import { WeekView } from '../components/Book/WeekView';
import { MonthView } from '../components/Book/MonthView';
import { AgendaView } from '../components/Book/AgendaView';
import { TimelineView } from '../components/Book/TimelineView';
import { WalkInSidebar } from '../components/Book/WalkInSidebar';
import { AppointmentFilters } from '../components/Book/FilterPanel';
import { LocalAppointment } from '../types/appointment';
import { addLocalAppointment, updateLocalAppointment, removeLocalAppointment, updateAppointmentInSupabase } from '../store/slices/appointmentsSlice';
import { createTicketInSupabase } from '../store/slices/ticketsSlice';
import { detectAppointmentConflicts } from '../utils/conflictDetection';
import { snapToGrid } from '../utils/dragAndDropHelpers';
import { syncService } from '../services/syncService';
import { Toast, ToastType } from '../components/Toast';
import { appointmentsDB, db } from '../db/database';
import { getTestSalonId } from '../db/seed';
import { NEXT_AVAILABLE_STAFF_ID } from '../constants/appointment';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { useClosedPeriodForDate } from '../hooks/useSchedule';

export function BookPage() {
  const dispatch = useAppDispatch();

  // Sidebar state (persisted to localStorage)
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useBookSidebar(true);

  // Modal states
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [isAppointmentDetailsOpen, setIsAppointmentDetailsOpen] = useState(false);
  const [isEditAppointmentOpen, setIsEditAppointmentOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    staffId: string;
    time: Date;
    staffName?: string;
    staffPhoto?: string;
  } | null>(null);

  // Initialize keyboard shortcuts
  useKeyboardShortcuts({
    enabled: true,
    onShowHelp: () => {
      // TODO: Create keyboard shortcuts help modal
      console.log('Show keyboard shortcuts help');
    },
    onCommandPalette: () => {
      setIsCommandPaletteOpen(true);
    },
  });
  
  // Filter state
  const [filters]  = useState<AppointmentFilters>({
    search: '',
    status: [],
    serviceTypes: [],
    dateRange: 'today',
  });
  const [selectedAppointment, setSelectedAppointment] = useState<LocalAppointment | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Clipboard state for copy/paste functionality
  const [_copiedAppointment, setCopiedAppointment] = useState<LocalAppointment | null>(null);

  const {
    selectedDate,
    selectedStaffIds,
    calendarView,
    // timeWindowMode,
    filteredAppointments,
    handleDateChange,
    handleStaffSelection,
    handleViewChange,
//     handleTimeWindowModeChange,
    goToToday,
  } = useAppointmentCalendar({ filters });

  // Get salon ID and staff from Redux
  const storeId = getTestSalonId();
  const authStoreId = useAppSelector(selectStoreId);
  const allStaff = useAppSelector(selectAllStaff) || [];
  const pendingBookingClient = useAppSelector(selectPendingBookingClient);

  // Load staff on mount - must fetch team members first (same pattern as useTicketsCompat)
  useEffect(() => {
    const storeId = authStoreId || 'default-store';
    console.log('[BookPage] Loading staff for storeId:', storeId);

    // First fetch team members from Supabase into Redux, then load staff for UI
    // This ensures state.team.members is populated before loadStaff reads from it
    dispatch(fetchTeamMembers(storeId)).then(() => {
      console.log('[BookPage] Team members fetched, now loading staff...');
      dispatch(loadStaff(storeId));
    });
  }, [dispatch, authStoreId]);

  // Auto-open appointment modal when client is pre-selected from global search
  useEffect(() => {
    if (pendingBookingClient) {
      setSelectedTimeSlot(null); // Clear any previous time slot selection
      setIsNewAppointmentOpen(true);
    }
  }, [pendingBookingClient]);

  // Debug: Log staff data
  console.log('[BookPage] allStaff from uiStaffSlice:', allStaff.length, allStaff.map(s => s.name));

  // Transform staff data for components (UIStaff from uiStaffSlice uses 'image' not 'avatar')
  const staffWithCounts = allStaff.map(staff => ({
    id: staff.id,
    name: staff.name,
    photo: staff.image, // UIStaff uses 'image' property
    isAvailable: staff.status === 'ready', // UIStaff uses 'ready' status instead of 'available'
    appointmentCount: filteredAppointments?.filter(
      (apt: LocalAppointment) => apt.staffId === staff.id
    ).length || 0,
  }));

  // Get selected staff for calendar display
  const selectedStaff = selectedStaffIds?.length > 0
    ? allStaff.filter(staff => selectedStaffIds.includes(staff.id))
    : allStaff;

  // Get business closure for the selected date (if any)
  const selectedDateString = selectedDate.toISOString().split('T')[0];
  const businessClosure = useClosedPeriodForDate(selectedDateString);

  // Wrapped view change handler with transition animation
  const handleViewChangeWithTransition = (view: string) => {
    setIsTransitioning(true);
    setTimeout(() => {
      handleViewChange(view as any);
      setTimeout(() => setIsTransitioning(false), 150); // Short delay after view changes
    }, 300); // Show loading overlay for 300ms
  };

  const handleAppointmentClick = (appointment: LocalAppointment) => {
    setSelectedAppointment(appointment);
    setIsAppointmentDetailsOpen(true);
  };

  const handleTimeSlotClick = (staffId: string, time: Date) => {
    // Find staff details
    const staff = allStaff.find(s => s.id === staffId);

    setSelectedTimeSlot({
      staffId,
      time,
      staffName: staff?.name || 'Unknown Staff',
      staffPhoto: staff?.image
    });
    setIsNewAppointmentOpen(true);
  };

  const handleSearchClick = () => {
    setIsCustomerSearchOpen(true);
  };

  const handleRefreshClick = async () => {
    try {
      await appointmentsDB.getByDate(storeId, selectedDate);
      setToast({ message: 'Calendar refreshed', type: 'success' });
    } catch (error) {
      console.error('Failed to refresh appointments:', error);
      setToast({ message: 'Failed to refresh calendar', type: 'error' });
    }
  };

  const handleAppointmentDrop = async (appointmentId: string, newStaffId: string, newTime: Date) => {
    try {
      const appointment = filteredAppointments?.find(apt => apt.id === appointmentId);
      if (!appointment) {
        setToast({ message: 'Appointment not found', type: 'error' });
        return;
      }

      // Snap to 15-minute grid
      const snappedTime = snapToGrid(newTime);
      
      // Calculate new end time based on duration
      const duration = Math.round(
        (new Date(appointment.scheduledEndTime).getTime() - 
         new Date(appointment.scheduledStartTime).getTime()) / 60000
      );
      const newEndTime = new Date(snappedTime.getTime() + duration * 60000);

      // Create updated appointment with snapped time (dates as ISO strings)
      const updatedAppointment: LocalAppointment = {
        ...appointment,
        staffId: newStaffId,
        scheduledStartTime: snappedTime.toISOString(),
        scheduledEndTime: newEndTime.toISOString(),
      };

      // Check for conflicts
      const otherAppointments = filteredAppointments?.filter(apt => apt.id !== appointmentId) || [];
      const conflicts = detectAppointmentConflicts(updatedAppointment, otherAppointments);

      if (conflicts.length > 0) {
        const confirmed = window.confirm(
          `Warning: This appointment has conflicts:\n\n${conflicts.join('\n')}\n\nDo you want to save anyway?`
        );
        if (!confirmed) return;
      }

      // Update in Redux with snapped time (dates as ISO strings)
      dispatch(updateLocalAppointment({
        id: appointmentId,
        updates: {
          staffId: newStaffId,
          scheduledStartTime: snappedTime.toISOString(),
          scheduledEndTime: newEndTime.toISOString(),
        },
      }));

      // Update in IndexedDB
      const appointmentToUpdate = await appointmentsDB.getById(appointmentId);
      if (appointmentToUpdate) {
        const updated: LocalAppointment = {
          ...appointmentToUpdate,
          staffId: newStaffId,
          scheduledStartTime: snappedTime.toISOString(),
          scheduledEndTime: newEndTime.toISOString(),
          updatedAt: new Date().toISOString(),
          syncStatus: 'pending', // Mark as pending sync
        };
        await db.appointments.put(updated);
      }

      // Queue for sync
      await syncService.queueUpdate('appointment', updatedAppointment, 3);

      setToast({ message: 'Appointment rescheduled successfully!', type: 'success' });
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      setToast({ message: 'Failed to reschedule appointment. Please try again.', type: 'error' });
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      const appointment = filteredAppointments?.find(apt => apt.id === appointmentId);
      if (!appointment) {
        setToast({ message: 'Appointment not found', type: 'error' });
        return;
      }

      // Update appointment status in Supabase
      const appointmentServerId = appointment.serverId || appointment.id;
      await dispatch(updateAppointmentInSupabase({
        id: String(appointmentServerId),
        updates: { status: newStatus as any },
      })).unwrap();

      // If checking in, create a ticket linked to this appointment
      if (newStatus === 'checked-in') {
        try {
          // scheduledStartTime/scheduledEndTime are now always ISO strings
          const startTime = typeof appointment.scheduledStartTime === 'string'
            ? appointment.scheduledStartTime
            : new Date(appointment.scheduledStartTime).toISOString();
          const endTime = typeof appointment.scheduledEndTime === 'string'
            ? appointment.scheduledEndTime
            : new Date(appointment.scheduledEndTime).toISOString();

          // Create ticket from appointment with appointmentId link
          await dispatch(createTicketInSupabase({
            appointmentId: String(appointmentServerId), // ✅ CRITICAL: Link ticket to appointment (convert to string)
            clientId: appointment.clientId,
            clientName: appointment.clientName,
            clientPhone: appointment.clientPhone || '',
            services: appointment.services.map(s => ({
              serviceId: s.serviceId,
              serviceName: s.serviceName,
              staffId: s.staffId,
              staffName: s.staffName,
              price: s.price,
              duration: s.duration,
              commission: (s as any).commission || 0,
              startTime,
              endTime,
              status: 'not_started' as const,
            })),
            source: 'calendar' as const,
          })).unwrap();

          setToast({ message: 'Appointment checked in and ticket created', type: 'success' });
        } catch (ticketError) {
          console.error('Error creating ticket from appointment:', ticketError);
          // Don't fail the status change if ticket creation fails
          setToast({ message: 'Appointment checked in, but ticket creation failed. Please create ticket manually.', type: 'error' });
        }
      }

      // Update in Redux
      dispatch(updateLocalAppointment({
        id: appointmentId,
        updates: { status: newStatus as any },
      }));

      // Update in IndexedDB
      const appointmentToUpdate = await appointmentsDB.getById(appointmentId);
      if (appointmentToUpdate) {
        const updated: LocalAppointment = {
          ...appointmentToUpdate,
          status: newStatus as any,
          updatedAt: new Date().toISOString(),
          syncStatus: 'pending', // Mark as pending sync
        };
        await db.appointments.put(updated);
      }

      // Queue for sync (legacy support)
      await syncService.queueUpdate('appointment', {
        ...appointment,
        status: newStatus as any,
      }, 3);

      if (newStatus !== 'checked-in') {
        setToast({ message: `Appointment marked as ${newStatus}`, type: 'success' });
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      setToast({ message: 'Failed to update appointment status. Please try again.', type: 'error' });
    }
  };

  const handleEditAppointment = async (appointment: LocalAppointment, updates: Partial<LocalAppointment>) => {
    try {
      // Update in Redux
      dispatch(updateLocalAppointment({
        id: appointment.id,
        updates,
      }));

      // Update in IndexedDB
      const appointmentToUpdate = await appointmentsDB.getById(appointment.id);
      if (appointmentToUpdate) {
        const updated: LocalAppointment = {
          ...appointmentToUpdate,
          ...updates,
          updatedAt: new Date().toISOString(),
          syncStatus: 'pending', // Mark as pending sync
        };
        await db.appointments.put(updated);
      }

      // Queue for sync
      await syncService.queueUpdate('appointment', {
        ...appointment,
        ...updates,
      }, 3);

      setToast({ message: 'Appointment updated successfully!', type: 'success' });
      setIsEditAppointmentOpen(false);
      setSelectedAppointment(null); // Clear selection
    } catch (error) {
      console.error('Error updating appointment:', error);
      setToast({ message: 'Failed to update appointment. Please try again.', type: 'error' });
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    // Confirmation dialog
    const appointment = filteredAppointments?.find(apt => apt.id === appointmentId);
    if (!appointment) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete this appointment?\n\n` +
      `Client: ${appointment.clientName}\n` +
      `Time: ${new Date(appointment.scheduledStartTime).toLocaleString()}\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      // Remove from IndexedDB
      await appointmentsDB.delete(appointmentId);

      // Remove from Redux state
      dispatch(removeLocalAppointment(appointmentId));

      // Queue deletion for sync (when backend is ready)
      await syncService.queueDelete('appointment', appointmentId, 3);

      setToast({ message: 'Appointment deleted successfully!', type: 'success' });
      setIsAppointmentDetailsOpen(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Error deleting appointment:', error);
      setToast({ message: 'Failed to delete appointment. Please try again.', type: 'error' });
    }
  };

  const handleCancelAppointment = async (appointmentId: string, reason?: string) => {
    try {
      const appointment = filteredAppointments?.find(apt => apt.id === appointmentId);
      if (!appointment) return;

      // Confirm cancellation with user
      const confirmed = window.confirm(
        `Are you sure you want to cancel the appointment for ${appointment.clientName} at ${
          new Date(appointment.scheduledStartTime).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
          })
        }?`
      );

      if (!confirmed) return;

      // Update to cancelled status (soft delete)
      const updates: Partial<LocalAppointment> = {
        status: 'cancelled',
        notes: reason ? `${appointment.notes || ''}\n\nCancellation reason: ${reason}`.trim() : appointment.notes,
        updatedAt: new Date().toISOString(),
      };

      // Update in Redux
      dispatch(updateLocalAppointment({
        id: appointmentId,
        updates: { ...updates, syncStatus: 'pending' as const },
      }));

      // Update in IndexedDB
      const appointmentToUpdate = await appointmentsDB.getById(appointmentId);
      if (appointmentToUpdate) {
        const updated: LocalAppointment = {
          ...appointmentToUpdate,
          ...updates,
          syncStatus: 'pending',
        };
        await db.appointments.put(updated);
      }

      // Queue for sync
      await syncService.queueUpdate('appointment', {
        ...appointment,
        ...updates,
      }, 3);

      setToast({ message: 'Appointment cancelled successfully!', type: 'success' });
      setIsAppointmentDetailsOpen(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      setToast({ message: 'Failed to cancel appointment. Please try again.', type: 'error' });
    }
  };

  // Copy appointment to clipboard
  const handleCopyAppointment = (appointment: LocalAppointment) => {
    setCopiedAppointment(appointment);
    setToast({ message: 'Appointment copied! Click a time slot to paste.', type: 'success' });
  };

  // Duplicate appointment - opens new appointment modal with pre-filled data
  const handleDuplicateAppointment = (appointment: LocalAppointment) => {
    // Set up the time slot with the same staff but allow user to pick new time
    const staff = allStaff.find(s => s.id === appointment.staffId);
    setSelectedTimeSlot({
      staffId: appointment.staffId,
      time: new Date(), // Default to now, user will pick new time
      staffName: staff?.name || appointment.staffName,
      staffPhoto: staff?.image,
    });
    // Store the appointment to duplicate (will be used to pre-fill modal)
    setCopiedAppointment(appointment);
    setIsNewAppointmentOpen(true);
    setToast({ message: 'Creating duplicate appointment...', type: 'info' });
  };

  // Rebook appointment - for completed appointments, book again with same details
  const handleRebookAppointment = async (appointment: LocalAppointment) => {
    try {
      // Import predictive rebooking utility
      const { predictNextVisit } = await import('../utils/predictiveRebooking');

      // Get prediction for next visit
      const allAppointments = filteredAppointments || [];
      const prediction = predictNextVisit(appointment.clientId, allAppointments);

      // Calculate suggested next date
      const suggestedDate = prediction?.predictedNextDate || new Date();
      suggestedDate.setHours(
        new Date(appointment.scheduledStartTime).getHours(),
        new Date(appointment.scheduledStartTime).getMinutes()
      );

      // Set up time slot with suggested date
      const staff = allStaff.find(s => s.id === appointment.staffId);
      setSelectedTimeSlot({
        staffId: appointment.staffId,
        time: suggestedDate,
        staffName: staff?.name || appointment.staffName,
        staffPhoto: staff?.image,
      });

      // Store appointment for rebooking (pre-fill modal)
      setCopiedAppointment(appointment);
      setIsNewAppointmentOpen(true);

      if (prediction) {
        setToast({
          message: `Rebooking ${appointment.clientName}. Suggested date based on ${prediction.averageCycle}-day cycle.`,
          type: 'info'
        });
      }
    } catch (error) {
      console.error('Error setting up rebook:', error);
      // Fallback: just open modal with appointment data
      const staff = allStaff.find(s => s.id === appointment.staffId);
      setSelectedTimeSlot({
        staffId: appointment.staffId,
        time: new Date(),
        staffName: staff?.name || appointment.staffName,
        staffPhoto: staff?.image,
      });
      setCopiedAppointment(appointment);
      setIsNewAppointmentOpen(true);
    }
  };

  // Mock walk-in data
  const mockWalkIns = [
    {
      id: 'walkin-1',
      clientName: 'John Doe',
      phone: '(555) 123-4567',
      partySize: 1,
      requestedService: 'Haircut',
      arrivalTime: new Date(Date.now() - 15 * 60 * 1000), // 15 min ago
      status: 'waiting' as const,
    },
    {
      id: 'walkin-2',
      clientName: 'Jane Smith',
      phone: '(555) 987-6543',
      partySize: 2,
      requestedService: 'Manicure & Pedicure',
      arrivalTime: new Date(Date.now() - 35 * 60 * 1000), // 35 min ago
      status: 'waiting' as const,
    },
  ];

  const handleCreateCustomer = async (name: string, phone: string) => {
    try {
      const { clientsDB } = await import('../db/database');
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      const newClient = await clientsDB.create({
        storeId,
        firstName,
        lastName,
        name: name.trim(),
        phone: phone.trim(),
        totalVisits: 0,
        totalSpent: 0,
        isBlocked: false,
      } as any);
      
      setToast({ message: `Client "${newClient.name}" created successfully!`, type: 'success' });
      return newClient;
    } catch (error) {
      console.error('Error creating customer:', error);
      setToast({ message: 'Failed to create client. Please try again.', type: 'error' });
      throw error;
    }
  };

  const handleSaveAppointment = async (appointmentData: any) => {
    try {
      // =====================================================
      // VALIDATION: Validate foreign keys before saving
      // =====================================================
      const { validateAppointmentInput } = await import('../utils/validation');

      // Build validation input with proper FK references
      const validationInput = {
        clientId: appointmentData.clientId || '',
        staffId: appointmentData.staffId || appointmentData.services?.[0]?.staffId || '',
        services: appointmentData.services?.map((s: any) => ({
          serviceId: s.serviceId || '',
          staffId: s.staffId || '',
        })) || [],
      };

      const validation = await validateAppointmentInput(validationInput);
      if (!validation.valid) {
        setToast({ message: validation.error || 'Validation failed', type: 'error' });
        return;
      }
      // =====================================================

      // Get existing appointments for auto-assign if needed
      const existingAppointments = filteredAppointments || [];

      // Ensure dates are Date objects
      const scheduledStartTime = appointmentData.scheduledStartTime instanceof Date
        ? appointmentData.scheduledStartTime
        : new Date(appointmentData.scheduledStartTime);

      const scheduledEndTime = appointmentData.scheduledEndTime instanceof Date
        ? appointmentData.scheduledEndTime
        : new Date(appointmentData.scheduledEndTime);
      
      // If staffId is 9999 or "Next Available", use smart auto-assign
      let finalStaffId = appointmentData.staffId || appointmentData.services[0]?.staffId || '';
      if (finalStaffId === '9999' || finalStaffId === 9999 || finalStaffId === NEXT_AVAILABLE_STAFF_ID || !finalStaffId) {
        // Import auto-assign dynamically
        const { autoAssignStaff } = await import('../utils/smartAutoAssign');
        const assignment = autoAssignStaff(
          appointmentData as LocalAppointment,
          scheduledStartTime,
          scheduledEndTime,
          existingAppointments,
          allStaff.map(s => ({
            id: s.id,
            name: s.name,
            specialty: s.specialty,
            isActive: (s as any).status !== 'off', // UIStaff uses status: 'ready'|'busy'|'off'
          })),
          finalStaffId || NEXT_AVAILABLE_STAFF_ID
        );
        
        if (assignment && assignment.staffId) {
          finalStaffId = assignment.staffId;
        } else {
          // Fallback to first available staff
          finalStaffId = allStaff.length > 0 ? allStaff[0].id : '';
        }
      }
      
      // Convert to LocalAppointment format
      const appointment: LocalAppointment = {
        ...appointmentData,
        id: appointmentData.id || `apt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        storeId: appointmentData.storeId || storeId,
        staffId: finalStaffId,
        scheduledStartTime,
        scheduledEndTime,
        status: appointmentData.status || 'scheduled',
        source: appointmentData.source || 'admin-portal',
        createdBy: appointmentData.createdBy || 'current-user',
        lastModifiedBy: appointmentData.lastModifiedBy || 'current-user',
        createdAt: appointmentData.createdAt instanceof Date ? appointmentData.createdAt : new Date(appointmentData.createdAt || Date.now()),
        updatedAt: appointmentData.updatedAt instanceof Date ? appointmentData.updatedAt : new Date(appointmentData.updatedAt || Date.now()),
        syncStatus: appointmentData.syncStatus || 'pending',
      };

      // Save to Redux
      dispatch(addLocalAppointment(appointment));

      // Save to IndexedDB
      await db.appointments.put(appointment);

      // Queue for sync if online
      if (navigator.onLine) {
        await syncService.queueCreate('appointment', appointment, 3);
      }

      // Show success toast with details
      setToast({
        message: `Appointment created for ${appointment.clientName} at ${scheduledStartTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit'
        })}`,
        type: 'success'
      });
      
      // Close modal
      setIsNewAppointmentOpen(false);
    } catch (error) {
      console.error('Error saving appointment:', error);

      // Provide user-friendly error messages
      let errorMessage = 'Failed to create appointment. ';
      if (error instanceof Error) {
        if (error.message.includes('conflict')) {
          errorMessage = 'Time slot is already booked. Please select another time.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Appointment saved locally and will sync when online.';
        } else {
          errorMessage += 'Please try again.';
        }
      }

      setToast({ message: errorMessage, type: 'error' });
    }
  };

  // Load appointments from IndexedDB when date changes
  useEffect(() => {
    async function loadAppointments() {
      try {
        const appointments = await appointmentsDB.getByDate(storeId, selectedDate);
        
        // Convert to LocalAppointment format and dispatch to Redux
        const localAppointments: LocalAppointment[] = appointments.map((apt: any) => ({
          ...apt,
          scheduledStartTime: apt.scheduledStartTime instanceof Date ? apt.scheduledStartTime : new Date(apt.scheduledStartTime),
          scheduledEndTime: apt.scheduledEndTime instanceof Date ? apt.scheduledEndTime : new Date(apt.scheduledEndTime),
          createdAt: apt.createdAt instanceof Date ? apt.createdAt : new Date(apt.createdAt),
          updatedAt: apt.updatedAt instanceof Date ? apt.updatedAt : new Date(apt.updatedAt),
          syncStatus: apt.syncStatus || 'pending', // Ensure syncStatus is present
        }));
        
        // Dispatch to Redux (this will update the calendar)
        localAppointments.forEach(apt => {
          dispatch(addLocalAppointment(apt));
        });
        
        console.log(`✅ Loaded ${localAppointments.length} appointments for ${selectedDate.toDateString()}`);
      } catch (error) {
        console.error('Failed to load appointments:', error);
        setToast({ message: 'Failed to load appointments', type: 'error' });
      }
    }
    
    loadAppointments();
  }, [selectedDate, storeId, dispatch]);

  // Auto-select all staff on mount if none selected
  useEffect(() => {
    if (selectedStaffIds.length === 0 && allStaff.length > 0) {
      const staffIds = allStaff.map(s => s.id);
      handleStaffSelection(staffIds);
    }
  }, [allStaff.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-full bg-gray-50">
      {/* Book Sidebar - Calendar + Staff Filter (Desktop) */}
      <div className="hidden lg:block">
        <BookSidebar
          isOpen={isSidebarOpen}
          onToggle={toggleSidebar}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          staff={staffWithCounts}
          selectedStaffIds={selectedStaffIds}
          onStaffSelection={handleStaffSelection}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <CalendarHeader
          selectedDate={selectedDate}
          calendarView={calendarView}
          timeWindowMode="fullday"
          onDateChange={handleDateChange}
          onViewChange={handleViewChangeWithTransition}
          onSearchClick={handleSearchClick}
          onRefreshClick={handleRefreshClick}
          onTodayClick={goToToday}
          onNewAppointment={() => {
            setSelectedTimeSlot(null); // Clear any previous time slot selection
            setIsNewAppointmentOpen(true);
          }}
          staff={allStaff}
          selectedStaffIds={selectedStaffIds}
          onStaffFilterChange={handleStaffSelection}
          sidebarOpen={isSidebarOpen}
          onSidebarToggle={toggleSidebar}
        />

        {/* Calendar + Sidebars */}
        <div className="flex-1 flex flex-col lg:flex-row gap-2 p-2 sm:gap-4 sm:p-4 min-h-0 overflow-auto">
          {/* Calendar Area - Allow scrolling */}
          <div className="flex-1 w-full lg:w-auto relative min-h-0 overflow-auto">
          {calendarView === 'day' && (
            <div className="h-full min-h-0 animate-fade-in" style={{ animationDuration: '300ms' }}>
              <DaySchedule
                date={selectedDate}
                staff={selectedStaff.map(s => ({
                  id: s.id,
                  name: s.name,
                  photo: s.image,
                }))}
                appointments={filteredAppointments || []}
                businessClosure={businessClosure}
                onAppointmentClick={handleAppointmentClick}
                onTimeSlotClick={handleTimeSlotClick}
                onAppointmentDrop={handleAppointmentDrop}
                onStatusChange={handleStatusChange}
                onCopyAppointment={handleCopyAppointment}
                onDuplicateAppointment={handleDuplicateAppointment}
                onRebookAppointment={handleRebookAppointment}
              />
            </div>
          )}

          {calendarView === 'week' && (
            <div className="h-full min-h-0 animate-fade-in" style={{ animationDuration: '300ms' }}>
              <WeekView
                startDate={selectedDate}
                appointments={filteredAppointments || []}
                onAppointmentClick={handleAppointmentClick}
                onDateClick={(date) => {
                  handleDateChange(date);
                  handleViewChange('day');
                }}
              />
            </div>
          )}

          {calendarView === 'month' && (
            <div className="h-full min-h-0 animate-fade-in" style={{ animationDuration: '300ms' }}>
              <MonthView
                date={selectedDate}
                appointments={filteredAppointments || []}
                onAppointmentClick={handleAppointmentClick}
                onDateClick={(date) => {
                  handleDateChange(date);
                  handleViewChange('day');
                }}
                onMonthChange={handleDateChange}
              />
            </div>
          )}

          {(calendarView as any) === 'agenda' && (
            <div className="h-full min-h-0 animate-fade-in" style={{ animationDuration: '300ms' }}>
              <AgendaView
                appointments={filteredAppointments || []}
                onAppointmentClick={handleAppointmentClick}
              />
            </div>
          )}

          {(calendarView as any) === 'timeline' && (
            <div className="h-full min-h-0 animate-fade-in" style={{ animationDuration: '300ms' }}>
              <TimelineView
                appointments={filteredAppointments || []}
                date={selectedDate}
                staff={selectedStaff.map(s => ({
                  id: s.id,
                  name: s.name,
                  photo: s.image,
                }))}
                onAppointmentClick={handleAppointmentClick}
                onTimeSlotClick={handleTimeSlotClick}
              />
            </div>
          )}

          {/* View Transition Overlay */}
          {isTransitioning && (
            <CalendarLoadingOverlay message="Switching view..." />
          )}
          </div>

          {/* Walk-In Sidebar - Hidden on mobile, shows as bottom sheet */}
          <div className="hidden lg:block">
            <WalkInSidebar
              walkIns={mockWalkIns}
              onDragStart={() => {/* TODO: Handle walk-in drag */}}
            />
          </div>
        </div>
      </div>

      {/* Customer Search Modal */}
      <ErrorBoundary
        isolate={true}
        onError={(error, errorInfo) => {
          console.error('CustomerSearchModal Error:', error, errorInfo);
          setToast({ type: 'error', message: 'Error loading customer search' });
        }}
      >
        <CustomerSearchModal
          isOpen={isCustomerSearchOpen}
          onClose={() => setIsCustomerSearchOpen(false)}
          onSelectCustomer={() => {/* TODO: Handle customer selection */}}
          onCreateCustomer={handleCreateCustomer}
        />
      </ErrorBoundary>

      {/* New Appointment Modal V2 - Staff-First Design */}
      <ErrorBoundary
        isolate={true}
        onError={(error, errorInfo) => {
          console.error('NewAppointmentModal Error:', error, errorInfo);
          setToast({ type: 'error', message: 'Error in appointment booking' });
        }}
      >
        <NewAppointmentModalV2
          isOpen={isNewAppointmentOpen}
          onClose={() => setIsNewAppointmentOpen(false)}
          selectedDate={selectedTimeSlot?.time || selectedDate}
          selectedTime={selectedTimeSlot?.time}
          selectedStaffId={selectedTimeSlot?.staffId}
          selectedStaffName={selectedTimeSlot?.staffName}
          onSave={handleSaveAppointment}
          viewMode="slide"
          initialClient={pendingBookingClient}
          onInitialClientUsed={() => dispatch(clearPendingBookingClient())}
        />
      </ErrorBoundary>

      {/* Appointment Details Modal */}
      <ErrorBoundary
        isolate={true}
        onError={(error, errorInfo) => {
          console.error('AppointmentDetailsModal Error:', error, errorInfo);
          setToast({ type: 'error', message: 'Error loading appointment details' });
        }}
      >
        <AppointmentDetailsModal
          isOpen={isAppointmentDetailsOpen}
          onClose={() => setIsAppointmentDetailsOpen(false)}
          appointment={selectedAppointment}
          onEdit={(apt) => {
            setSelectedAppointment(apt);
            setIsAppointmentDetailsOpen(false);
            setIsEditAppointmentOpen(true);
          }}
          onStatusChange={(id, status) => handleStatusChange(id, status)}
          onCancel={(id) => handleCancelAppointment(id)}
          onNoShow={(id) => handleStatusChange(id, 'no-show')}
          onDelete={handleDeleteAppointment}
        />
      </ErrorBoundary>

      {/* Edit Appointment Modal */}
      <ErrorBoundary
        isolate={true}
        onError={(error, errorInfo) => {
          console.error('EditAppointmentModal Error:', error, errorInfo);
          setToast({ type: 'error', message: 'Error editing appointment' });
        }}
      >
        <EditAppointmentModal
          isOpen={isEditAppointmentOpen}
          onClose={() => setIsEditAppointmentOpen(false)}
          appointment={selectedAppointment}
          onSave={handleEditAppointment}
          existingAppointments={filteredAppointments || []}
        />
      </ErrorBoundary>

      {/* Command Palette - Cmd+K Quick Actions */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      {/* Floating Action Button - New Appointment */}
      <button
        className="fixed bottom-24 right-8 sm:bottom-8 w-14 h-14 bg-gradient-to-br from-orange-500 to-pink-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 active:scale-95 z-50"
        aria-label="New appointment"
        onClick={() => setIsNewAppointmentOpen(true)}
      >
        <svg className="w-6 h-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
      
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
