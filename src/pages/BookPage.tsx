/**
 * BookPage Component
 * Main appointment calendar page
 */

import { useEffect, useState } from 'react';
import { useAppointmentCalendar } from '../hooks/useAppointmentCalendar';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectAllStaff } from '../store/slices/staffSlice';
import {
  CalendarHeader,
  StaffSidebar,
  CustomerSearchModal,
  NewAppointmentModal,
  AppointmentDetailsModal,
  EditAppointmentModal,
} from '../components/Book';
import { DaySchedule } from '../components/Book/DaySchedule.v2';
import { WeekView } from '../components/Book/WeekView';
import { MonthView } from '../components/Book/MonthView';
import { AgendaView } from '../components/Book/AgendaView';
import { WalkInSidebar } from '../components/Book/WalkInSidebar';
import { AppointmentFilters } from '../components/Book/FilterPanel';
import { LocalAppointment } from '../types/appointment';
import { addLocalAppointment, updateLocalAppointment } from '../store/slices/appointmentsSlice';
import { detectAppointmentConflicts } from '../utils/conflictDetection';
import { saveAppointment } from '../services/db';
import { snapToGrid } from '../utils/dragAndDropHelpers';
import { syncService } from '../services/syncService';
import { Toast, ToastType } from '../components/Toast';
import { appointmentsDB } from '../db/database';
import { getTestSalonId } from '../db/seed';
import { NEXT_AVAILABLE_STAFF_ID } from '../constants/appointment';

export function BookPage() {
  const dispatch = useAppDispatch();
  
  // Modal states
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [isAppointmentDetailsOpen, setIsAppointmentDetailsOpen] = useState(false);
  const [isEditAppointmentOpen, setIsEditAppointmentOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ staffId: string; time: Date } | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState<AppointmentFilters>({ // eslint-disable-line @typescript-eslint/no-unused-vars
    search: '',
    status: [],
    serviceTypes: [],
    dateRange: 'today',
  });
  const [selectedAppointment, setSelectedAppointment] = useState<LocalAppointment | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

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
  } = useAppointmentCalendar();

  // Get salon ID and staff from Redux
  const salonId = getTestSalonId();
  const allStaff = useAppSelector(selectAllStaff) || [];
  
  // Debug: Log filtered appointments
  useEffect(() => {
    console.log('📊 Filtered appointments:', filteredAppointments?.length || 0, filteredAppointments);
  }, [filteredAppointments]);

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

  const handleAppointmentClick = (appointment: LocalAppointment) => {
    setSelectedAppointment(appointment);
    setIsAppointmentDetailsOpen(true);
  };

  const handleTimeSlotClick = (staffId: string, time: Date) => {
    setSelectedTimeSlot({ staffId, time });
    setIsNewAppointmentOpen(true);
  };

  const handleSearchClick = () => {
    setIsCustomerSearchOpen(true);
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
        await saveAppointment(updated);
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
        await saveAppointment(updated);
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
        await saveAppointment(updated);
      }

      // Queue for sync
      await syncService.queueUpdate('appointment', {
        ...appointment,
        ...updates,
      }, 3);

      // Reload appointments to show the updated one
      const updatedAppointments = await appointmentsDB.getByDate(salonId, selectedDate);
      updatedAppointments.forEach((apt: any) => {
        const localApt: LocalAppointment = {
          id: apt.id,
          salonId: apt.salonId,
          clientId: apt.clientId,
          clientName: apt.clientName,
          clientPhone: apt.clientPhone || '',
          staffId: apt.staffId,
          staffName: apt.staffName || '',
          services: apt.services || [],
          status: apt.status as any,
          scheduledStartTime: new Date(apt.scheduledStartTime),
          scheduledEndTime: new Date(apt.scheduledEndTime),
          notes: apt.notes,
          source: (apt.source || 'walk-in') as 'online' | 'walk-in',
          createdAt: new Date(apt.createdAt),
          updatedAt: new Date(apt.updatedAt),
          createdBy: apt.createdBy,
          lastModifiedBy: apt.lastModifiedBy,
          syncStatus: apt.syncStatus,
        };
        dispatch(addLocalAppointment(localApt));
      });

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

      // Queue deletion for sync (when backend is ready)
      await syncService.queueDelete('appointment', appointmentId, 3);

      // Reload appointments
      const updatedAppointments = await appointmentsDB.getByDate(salonId, selectedDate);
      updatedAppointments.forEach((apt: any) => {
        const localApt: LocalAppointment = {
          id: apt.id,
          salonId: apt.salonId,
          clientId: apt.clientId,
          clientName: apt.clientName,
          clientPhone: apt.clientPhone || '',
          staffId: apt.staffId,
          staffName: apt.staffName || '',
          services: apt.services || [],
          status: apt.status as any,
          scheduledStartTime: new Date(apt.scheduledStartTime),
          scheduledEndTime: new Date(apt.scheduledEndTime),
          notes: apt.notes,
          source: (apt.source || 'walk-in') as 'online' | 'walk-in',
          createdAt: new Date(apt.createdAt),
          updatedAt: new Date(apt.updatedAt),
          createdBy: apt.createdBy,
          lastModifiedBy: apt.lastModifiedBy,
          syncStatus: apt.syncStatus,
        };
        dispatch(addLocalAppointment(localApt));
      });

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

      // Update to cancelled status (soft delete)
      const updates: Partial<LocalAppointment> = {
        status: 'cancelled',
        notes: reason ? `${appointment.notes || ''}\n\nCancellation reason: ${reason}`.trim() : appointment.notes,
        updatedAt: new Date(),
      };

      // Update in IndexedDB
      const appointmentToUpdate = await appointmentsDB.getById(appointmentId);
      if (appointmentToUpdate) {
        const updated: LocalAppointment = {
          ...appointmentToUpdate,
          ...updates,
          syncStatus: 'pending',
        };
        await saveAppointment(updated);
      }

      // Queue for sync
      await syncService.queueUpdate('appointment', {
        ...appointment,
        ...updates,
      }, 3);

      // Reload appointments
      const updatedAppointments = await appointmentsDB.getByDate(salonId, selectedDate);
      updatedAppointments.forEach((apt: any) => {
        const localApt: LocalAppointment = {
          id: apt.id,
          salonId: apt.salonId,
          clientId: apt.clientId,
          clientName: apt.clientName,
          clientPhone: apt.clientPhone || '',
          staffId: apt.staffId,
          staffName: apt.staffName || '',
          services: apt.services || [],
          status: apt.status as any,
          scheduledStartTime: new Date(apt.scheduledStartTime),
          scheduledEndTime: new Date(apt.scheduledEndTime),
          notes: apt.notes,
          source: (apt.source || 'walk-in') as 'online' | 'walk-in',
          createdAt: new Date(apt.createdAt),
          updatedAt: new Date(apt.updatedAt),
          createdBy: apt.createdBy,
          lastModifiedBy: apt.lastModifiedBy,
          syncStatus: apt.syncStatus,
        };
        dispatch(addLocalAppointment(localApt));
      });

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
    console.log('Customer selected:', customer);
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
      await saveAppointment(appointment);

      // Queue for sync
      await syncService.queueCreate('appointment', appointment, 3);

      // Show success toast
      setToast({ message: 'Appointment created successfully!', type: 'success' });
      
      // Reload appointments to show the new one
      const updatedAppointments = await appointmentsDB.getByDate(salonId, selectedDate);
      updatedAppointments.forEach((apt: any) => {
        const localApt: LocalAppointment = {
          ...apt,
          scheduledStartTime: apt.scheduledStartTime instanceof Date ? apt.scheduledStartTime : new Date(apt.scheduledStartTime),
          scheduledEndTime: apt.scheduledEndTime instanceof Date ? apt.scheduledEndTime : new Date(apt.scheduledEndTime),
          createdAt: apt.createdAt instanceof Date ? apt.createdAt : new Date(apt.createdAt),
          updatedAt: apt.updatedAt instanceof Date ? apt.updatedAt : new Date(apt.updatedAt),
          syncStatus: apt.syncStatus || 'pending',
        };
        dispatch(addLocalAppointment(localApt));
      });
      
      // Close modal
      setIsNewAppointmentOpen(false);
    } catch (error) {
      console.error('Error saving appointment:', error);
      setToast({ message: `Failed to create appointment: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`, type: 'error' });
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
      {/* Staff Sidebar - Hidden on mobile */}
      <div className="hidden lg:block">
        <StaffSidebar
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
          onViewChange={handleViewChange}
          onTimeWindowModeChange={handleTimeWindowModeChange}
          onSearchClick={handleSearchClick}
          onTodayClick={goToToday}
          onFilterChange={setFilters}
          onNewAppointment={() => setIsNewAppointmentOpen(true)}
        />

        {/* Calendar + Sidebars */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden gap-4 p-4">
          {/* Calendar Area */}
          <div className="flex-1 overflow-hidden w-full lg:w-auto">
          {calendarView === 'day' && (
            <DaySchedule
              date={selectedDate}
              staff={selectedStaff.map(s => ({
                id: s.id,
                name: s.name,
                photo: s.avatar,
              }))}
              appointments={filteredAppointments || []}
              onAppointmentClick={handleAppointmentClick}
              onTimeSlotClick={handleTimeSlotClick}
              onAppointmentDrop={handleAppointmentDrop}
              onStatusChange={handleStatusChange}
            />
          )}

          {calendarView === 'week' && (
            <WeekView
              startDate={selectedDate}
              appointments={filteredAppointments || []}
              onAppointmentClick={handleAppointmentClick}
              onDateClick={(date) => {
                handleDateChange(date);
                handleViewChange('day');
              }}
            />
          )}

          {calendarView === 'month' && (
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
          )}

          {calendarView === 'agenda' && (
            <AgendaView
              appointments={filteredAppointments || []}
              onAppointmentClick={handleAppointmentClick}
              onStatusChange={handleStatusChange}
            />
          )}
          </div>

          {/* Walk-In Sidebar - Hidden on mobile, shows as bottom sheet */}
          <div className="hidden lg:block">
            <WalkInSidebar
              walkIns={mockWalkIns}
              onDragStart={(walkIn) => console.log('Dragging walk-in:', walkIn)}
            />
          </div>
        </div>
      </div>

      {/* Customer Search Modal */}
      <CustomerSearchModal
        isOpen={isCustomerSearchOpen}
        onClose={() => setIsCustomerSearchOpen(false)}
        onSelectCustomer={handleSelectCustomer}
        onCreateCustomer={handleCreateCustomer}
      />

      {/* New Appointment Modal */}
      <NewAppointmentModal
        isOpen={isNewAppointmentOpen}
        onClose={() => setIsNewAppointmentOpen(false)}
        selectedDate={selectedTimeSlot?.time || selectedDate}
        selectedTime={selectedTimeSlot?.time}
        selectedStaffId={selectedTimeSlot?.staffId}
        onSave={handleSaveAppointment}
        onCreateClient={handleCreateCustomer}
      />

      {/* Appointment Details Modal */}
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

      {/* Edit Appointment Modal */}
      <EditAppointmentModal
        isOpen={isEditAppointmentOpen}
        onClose={() => setIsEditAppointmentOpen(false)}
        appointment={selectedAppointment}
        onSave={handleEditAppointment}
        existingAppointments={filteredAppointments || []}
      />

      {/* Floating Action Button - New Appointment */}
      <button
        className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-orange-500 to-pink-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 active:scale-95 z-50"
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
