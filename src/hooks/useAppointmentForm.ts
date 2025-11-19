import { useState, useMemo, useCallback } from 'react';
import { Client } from '../types/client';

interface UseAppointmentFormProps {
  selectedDate?: Date;
  selectedTime?: Date;
}

/**
 * Custom hook for appointment form state management
 * Handles date, time, notes, and booking mode
 */
export function useAppointmentForm({
  selectedDate,
  selectedTime,
}: UseAppointmentFormProps = {}) {
  // Date and time
  const [date, setDate] = useState<Date>(
    selectedDate || selectedTime || new Date()
  );

  const [defaultStartTime, setDefaultStartTime] = useState<string>(() => {
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    return '10:00';
  });

  // Time mode for sequential vs parallel services
  const [timeMode, setTimeMode] = useState<'sequential' | 'parallel'>('sequential');

  // Notes
  const [appointmentNotes, setAppointmentNotes] = useState('');

  // Booking mode (individual vs group)
  const [bookingMode, setBookingMode] = useState<'individual' | 'group'>('individual');
  const [partySize, setPartySize] = useState(1);

  // Selected clients
  const [selectedClients, setSelectedClients] = useState<Client[]>([]);

  // Validation
  const canBook = useMemo(() => {
    return selectedClients.length > 0;
  }, [selectedClients]);

  // Time formatting helpers
  const formatTimeString = useCallback((date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }, []);

  const parseTimeString = useCallback((timeStr: string, baseDate: Date = new Date()): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const result = new Date(baseDate);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }, []);

  // Calculate end time based on duration
  const calculateEndTime = useCallback((startTime: string, duration: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setDate(new Date());
    setDefaultStartTime('10:00');
    setTimeMode('sequential');
    setAppointmentNotes('');
    setBookingMode('individual');
    setPartySize(1);
    setSelectedClients([]);
  }, []);

  // Switch booking mode
  const switchBookingMode = useCallback((mode: 'individual' | 'group') => {
    setBookingMode(mode);
    if (mode === 'group' && partySize === 1) {
      setPartySize(2);
    }
    // Clear selections when switching modes
    setSelectedClients([]);
  }, [partySize]);

  return {
    // Date and time
    date,
    setDate,
    defaultStartTime,
    setDefaultStartTime,
    timeMode,
    setTimeMode,

    // Notes
    appointmentNotes,
    setAppointmentNotes,

    // Booking mode
    bookingMode,
    setBookingMode: switchBookingMode,
    partySize,
    setPartySize,

    // Selected clients
    selectedClients,
    setSelectedClients,
    addClient: (client: Client) => setSelectedClients(prev => [...prev, client]),
    removeClient: (clientId: string) =>
      setSelectedClients(prev => prev.filter(c => c.id !== clientId)),
    clearClients: () => setSelectedClients([]),

    // Validation
    canBook,

    // Helpers
    formatTimeString,
    parseTimeString,
    calculateEndTime,
    resetForm,
  };
}