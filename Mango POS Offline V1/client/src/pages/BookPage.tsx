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
} from '../components/Book';
import { DaySchedule } from '../components/Book/DaySchedule.v2';
import { WeekView } from '../components/Book/WeekView';
import { WalkInSidebar } from '../components/Book/WalkInSidebar';
import { AppointmentFilters } from '../components/Book/FilterPanel';
import { LocalAppointment } from '../types/appointment';
import { addLocalAppointment } from '../store/slices/appointmentsSlice';
import { saveAppointment } from '../services/db';
import { syncService } from '../services/syncService';
import { Toast, ToastType } from '../components/Toast';
import { appointmentsDB } from '../db/database';
import { getTestSalonId } from '../db/seed';

export function BookPage() {
  const dispatch = useAppDispatch();
  
  // Modal states
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [isAppointmentDetailsOpen, setIsAppointmentDetailsOpen] = useState(false);
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

  const handleAppointmentDrop = (appointmentId: string, newStaffId: string, newTime: Date) => {
    console.log('Reschedule appointment:', { appointmentId, newStaffId, newTime });
    // TODO: Update appointment in Redux store
    alert(`Reschedule appointment ${appointmentId} to ${newStaffId} at ${newTime.toLocaleString()}`);
  };

  const handleStatusChange = (appointmentId: string, newStatus: string) => {
    console.log('Change status:', { appointmentId, newStatus });
    // TODO: Update appointment status in Redux store
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

  const handleCreateCustomer = (name: string, phone: string) => {
    console.log('Create customer:', name, phone);
    // TODO: Create customer via API
  };

  const handleSaveAppointment = async (appointmentData: any) => {
    try {
      // Convert to LocalAppointment format
      const appointment: LocalAppointment = {
        ...appointmentData,
        staffId: appointmentData.services[0]?.staffId || '',
        serviceIds: appointmentData.services.map((s: any) => s.id),
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
      
      // Close modal
      setIsNewAppointmentOpen(false);
    } catch (error) {
      console.error('Error saving appointment:', error);
      setToast({ message: 'Failed to create appointment. Please try again.', type: 'error' });
    }
  };

  // Load appointments from IndexedDB when date changes
  useEffect(() => {
    async function loadAppointments() {
      try {
        const appointments = await appointmentsDB.getByDate(salonId, selectedDate);
        
        // Convert to LocalAppointment format and dispatch to Redux
        const localAppointments: LocalAppointment[] = appointments.map((apt: any) => ({
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
        />

        {/* Calendar + Walk-In Sidebar */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
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
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <p className="text-lg font-medium mb-2">Month View</p>
                <p className="text-sm">Coming soon...</p>
              </div>
            </div>
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
      />

      {/* Appointment Details Modal */}
      <AppointmentDetailsModal
        isOpen={isAppointmentDetailsOpen}
        onClose={() => setIsAppointmentDetailsOpen(false)}
        appointment={selectedAppointment}
        onStatusChange={(id, status) => {
          console.log('Status changed:', id, status);
          // TODO: Update appointment status in Redux
        }}
        onCancel={(id) => {
          console.log('Cancel appointment:', id);
          // TODO: Cancel appointment
        }}
        onNoShow={(id) => {
          console.log('No show:', id);
          // TODO: Mark as no-show
        }}
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
