import { format, addMinutes, parse, isAfter, isBefore } from 'date-fns';

export interface TimeSlot {
  time: string;
  available: boolean;
  staffAvailable: string[];
  endTime: string;
}

export type AvailabilityStatus = 'available' | 'waitlist' | 'no_slots';

const BUSINESS_HOURS = {
  open: '09:00',
  close: '20:00',
  slotInterval: 5,
};

export const getAvailableSlots = (
  date: Date,
  staffId: string | 'any',
  serviceDuration: number = 30
): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const dayStart = parse(BUSINESS_HOURS.open, 'HH:mm', date);
  const dayEnd = parse(BUSINESS_HOURS.close, 'HH:mm', date);
  let currentSlot = dayStart;
  
  while (isBefore(currentSlot, dayEnd)) {
    const slotEndTime = addMinutes(currentSlot, serviceDuration);
    if (isAfter(slotEndTime, dayEnd)) break;
    
    const timeString = format(currentSlot, 'hh:mm a');
    const endTimeString = format(slotEndTime, 'hh:mm a');
    const isAvailable = Math.random() > 0.3;
    
    slots.push({
      time: timeString,
      available: isAvailable,
      staffAvailable: isAvailable ? [staffId === 'any' ? 'staff-1' : staffId] : [],
      endTime: endTimeString,
    });
    
    currentSlot = addMinutes(currentSlot, BUSINESS_HOURS.slotInterval);
  }
  
  return slots;
};

export const getCalendarAvailability = (
  month: Date,
  staffId: string | 'any',
  serviceDuration: number = 30
): Record<string, AvailabilityStatus> => {
  const availability: Record<string, AvailabilityStatus> = {};
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(month.getFullYear(), month.getMonth(), day);
    const dateKey = format(date, 'yyyy-MM-dd');
    const slots = getAvailableSlots(date, staffId, serviceDuration);
    const availableSlots = slots.filter(s => s.available);
    
    if (availableSlots.length > 10) {
      availability[dateKey] = 'available';
    } else if (availableSlots.length > 0) {
      availability[dateKey] = 'waitlist';
    } else {
      availability[dateKey] = 'no_slots';
    }
  }
  
  return availability;
};

export const groupSlotsByTimeOfDay = (slots: TimeSlot[]): {
  morning: TimeSlot[];
  afternoon: TimeSlot[];
  evening: TimeSlot[];
} => {
  return {
    morning: slots.filter(slot => {
      const hour = parseInt(slot.time.split(':')[0]);
      const period = slot.time.includes('AM') ? 'AM' : 'PM';
      return period === 'AM' && hour >= 6;
    }),
    afternoon: slots.filter(slot => {
      const hour = parseInt(slot.time.split(':')[0]);
      const period = slot.time.includes('PM') ? 'PM' : 'AM';
      return period === 'PM' && hour < 5;
    }),
    evening: slots.filter(slot => {
      const hour = parseInt(slot.time.split(':')[0]);
      const period = slot.time.includes('PM') ? 'PM' : 'AM';
      return period === 'PM' && hour >= 5;
    }),
  };
};

export const formatTimeSlot = (time: string): string => {
  return time;
};
