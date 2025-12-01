/**
 * BookPage Component
 * Main appointment calendar page
 */

import { useEffect, useState } from 'react';
import { useAppointmentCalendar } from '../hooks/useAppointmentCalendar';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useBookSidebar } from '../hooks/useBookSidebar';
import { store } from '../store';
import { selectAllStaff } from '../store/slices/staffSlice';
import {
  CalendarHeader,
  CommandPalette,
  StaffSidebar,
  BookSidebar,
  CustomerSearchModal,
  NewAppointmentModalV2,
  AppointmentDetailsModal,
  EditAppointmentModal,
} from '../components/Book';
import { CalendarLoadingOverlay } from '../components/Book/skeletons';
import { DaySchedule } from '../components/Book/DaySchedule.v2';
import { WeekView } from '../components/Book/WeekView';
import { MonthView } from '../components/Book/MonthView';
import { AgendaView } from '../components/Book/AgendaView';
import { TimelineView } from '../components/Book/TimelineView';
import { WalkInSidebar } from '../components/Book/WalkInSidebar';
import { AppointmentFilters } from '../components/Book/FilterPanel';
import { LocalAppointment } from '../types/appointment';
import { addLocalAppointment, updateLocalAppointment, removeLocalAppointment } from '../store/slices/appointmentsSlice';
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-unused-vars
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
  const [filters, setFilters] = useState<AppointmentFilters>({
    search: '',
    status: [],
    serviceTypes: [],
    dateRange: 'today',
  });
  const [selectedAppointment, setSelectedAppointment] = useState<LocalAppointment | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [isSavingAppointment, setIsSavingAppointment] = useState(false);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isStaffDrawerOpen, setIsStaffDrawerOpen] = useState(false);

  const {
    selectedDate,
    selectedStaffIds,
    calendarView,
    timeWindowMode,
    filteredAppointments,
    visibleTimeSlots, // eslint-disable-line @typescript-eslint/no-unused-vars
    handleDateChange,
    handleStaffSelection,
    handleViewChange,
    handleTimeWindowModeChange,
    goToToday,
  } = useAppointmentCalendar({ filters });

  // Get salon ID and staff from Redux
  const salonId = getTestSalonId();
  const allStaff = useAppSelector(selectAllStaff) || [];

  // Transform staff data for components
  const staffWithCounts = allStaff.map(staff => ({
    id: staff.id,
    name: staff.name,
    photo: staff.avatar,
    isAvailable: staff.status === 'available',
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
      staffPhoto: staff?.avatar
    });
    setIsNewAppointmentOpen(true);
  };

  const handleSearchClick = () => {
    setIsCustomerSearchOpen(true);
  };

  const handleSettingsClick = () => {
    setIsSettingsOpen(true);
  };

  const handleRefreshClick = async () => {
    setIsLoadingAppointments(true);
    try {
      const appointments = await appointmentsDB.getByDate(salonId, selectedDate);

      // Convert to LocalAppointment format and dispatch to Redux
      const localAppointments: LocalAppointment[] = appointments.map((apt: any) => ({
        id: apt.id,
        clientId: apt.clientId,
        staffId: apt.staffId,
        serviceIds: apt.serviceIds,
        startTime: new Date(apt.startTime),
        endTime: new Date(apt.endTime),
        status: apt.status,
        notes: apt.notes,
        createdAt: apt.createdAt,
        updatedAt: apt.updatedAt,
      }));

      setToast({ message: 'Calendar refreshed', type: 'success' });
    } catch (error) {
      console.error('Failed to refresh appointments:', error);
      setToast({ message: 'Failed to refresh calendar', type: 'error' });
    } finally {
      setIsLoadingAppointments(false);
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

      // Create updated appointment with snapped time
      const updatedAppointment: LocalAppointment = {
        ...appointment,
        staffId: newStaffId,
        scheduledStartTime: snappedTime,
        scheduledEndTime: newEndTime,
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

      // Update in Redux with snapped time
      dispatch(updateLocalAppointment({
        id: appointmentId,
        updates: {
          staffId: newStaffId,
          scheduledStartTime: snappedTime,
          scheduledEndTime: newEndTime,
        },
      }));

      // Update in IndexedDB
      const appointmentToUpdate = await appointmentsDB.getById(appointmentId);
      if (appointmentToUpdate) {
        const updated: LocalAppointment = {
          ...appointmentToUpdate,
          staffId: newStaffId,
          scheduledStartTime: snappedTime,
          scheduledEndTime: newEndTime,
          updatedAt: new Date(),
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
          updatedAt: new Date(),
          syncStatus: 'pending', // Mark as pending sync
        };
        await db.appointments.put(updated);
      }

      // Queue for sync
      await syncService.queueUpdate('appointment', {
        ...appointment,
        status: newStatus as any,
      }, 3);

      setToast({ message: `Appointment marked as ${newStatus}`, type: 'success' });
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
          updatedAt: new Date(),
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

  const handleCheckIn = async (appointmentId: string) => {
    await handleStatusChange(appointmentId, 'checked-in');
  };

  const handleStartService = async (appointmentId: string) => {
    await handleStatusChange(appointmentId, 'in-service');
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
        updatedAt: new Date(),
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

  const handleSelectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    // TODO: Open new appointment modal with customer
  };

  const handleCreateCustomer = async (name: string, phone: string) => {
    try {
      const { clientsDB } = await import('../db/database');
      const newClient = await clientsDB.create({
        salonId,
        name: name.trim(),
        phone: phone.trim(),
        totalVisits: 0,
        totalSpent: 0,
      });
      
      setToast({ message: `Client "${newClient.name}" created successfully!`, type: 'success' });
      return newClient;
    } catch (error) {
      console.error('Error creating customer:', error);
      setToast({ message: 'Failed to create client. Please try again.', type: 'error' });
      throw error;
    }
  };

  const handleSaveAppointment = async (appointmentData: any) => {
    setIsSavingAppointment(true);
    try {
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
            isActive: s.isActive,
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
        salonId: appointmentData.salonId || salonId,
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
    } finally {
      setIsSavingAppointment(false);
    }
  };

  // Load appointments from IndexedDB when date changes
  useEffect(() => {
    async function loadAppointments() {
      try {
        const appointments = await appointmentsDB.getByDate(salonId, selectedDate);
        
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
  }, [selectedDate, salonId, dispatch]);

  // Auto-select all staff on mount if none selected
  useEffect(() => {
    if (selectedStaffIds.length === 0 && allStaff.length > 0) {
      const staffIds = allStaff.map(s => s.id);
      handleStaffSelection(staffIds);
    }
  }, [allStaff.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-screen bg-gray-50">
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
          timeWindowMode={timeWindowMode}
          onDateChange={handleDateChange}
          onViewChange={handleViewChangeWithTransition}
          onTimeWindowModeChange={handleTimeWindowModeChange}
          onSearchClick={handleSearchClick}
          onSettingsClick={handleSettingsClick}
          onRefreshClick={handleRefreshClick}
          onTodayClick={goToToday}
          onFilterChange={setFilters}
          onNewAppointment={() => {
            setSelectedTimeSlot(null); // Clear any previous time slot selection
            setIsNewAppointmentOpen(true);
          }}
          staff={allStaff.map(s => ({ id: s.id, name: s.name }))}
          selectedStaffIds={selectedStaffIds}
          onStaffFilterChange={handleStaffSelection}
          sidebarOpen={isSidebarOpen}
          onSidebarToggle={toggleSidebar}
        />

        {/* Calendar + Sidebars */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden gap-2 p-2 sm:gap-4 sm:p-4">
          {/* Calendar Area */}
          <div className="flex-1 overflow-hidden w-full lg:w-auto relative min-h-0">
          {calendarView === 'day' && (
            <div className="h-full animate-fade-in" style={{ animationDuration: '300ms' }}>
              <DaySchedule
                date={selectedDate}
                staff={selectedStaff.map(s => ({
                  id: s.id,
                  name: s.name,
                  photo: s.avatar,
                }))}
                appointments={filteredAppointments || []}
                businessClosure={businessClosure}
                onAppointmentClick={handleAppointmentClick}
                onTimeSlotClick={handleTimeSlotClick}
                onAppointmentDrop={handleAppointmentDrop}
                onStatusChange={handleStatusChange}
              />
            </div>
          )}

          {calendarView === 'week' && (
            <div className="h-full animate-fade-in" style={{ animationDuration: '300ms' }}>
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
            <div className="h-full animate-fade-in" style={{ animationDuration: '300ms' }}>
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

          {calendarView === 'agenda' && (
            <div className="h-full animate-fade-in" style={{ animationDuration: '300ms' }}>
              <AgendaView
                appointments={filteredAppointments || []}
                onAppointmentClick={handleAppointmentClick}
                onStatusChange={handleStatusChange}
              />
            </div>
          )}

          {calendarView === 'timeline' && (
            <div className="h-full animate-fade-in" style={{ animationDuration: '300ms' }}>
              <TimelineView
                appointments={filteredAppointments || []}
                date={selectedDate}
                staff={selectedStaff.map(s => ({
                  id: s.id,
                  name: s.name,
                  photo: s.avatar,
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
              onDragStart={(walkIn) => {/* TODO: Handle walk-in drag */}}
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
          onSelectCustomer={handleSelectCustomer}
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
