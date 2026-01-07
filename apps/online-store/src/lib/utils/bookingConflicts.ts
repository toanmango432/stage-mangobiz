import { TimeSlot } from '@/types/booking';
import { getBookingsForDate } from '@/lib/storage/bookingStorage';
import { addMinutes, parse, format, parseISO, isWithinInterval } from 'date-fns';

const BUFFER_TIME_MINUTES = 15; // Buffer between appointments

/**
 * Calculate end time based on start time and duration
 */
export const calculateEndTime = (
  startTime: string, // "09:00 AM"
  duration: number, // minutes
  addOnsDuration: number = 0
): string => {
  const parsed = parse(startTime, 'hh:mm a', new Date());
  const endTime = addMinutes(parsed, duration + addOnsDuration);
  return format(endTime, 'hh:mm a');
};

/**
 * Check if two time ranges overlap (including buffer)
 */
const timeRangesOverlap = (
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean => {
  // Add buffer time
  const bufferedStart1 = addMinutes(start1, -BUFFER_TIME_MINUTES);
  const bufferedEnd1 = addMinutes(end1, BUFFER_TIME_MINUTES);
  
  return (
    isWithinInterval(start2, { start: bufferedStart1, end: bufferedEnd1 }) ||
    isWithinInterval(end2, { start: bufferedStart1, end: bufferedEnd1 }) ||
    isWithinInterval(bufferedStart1, { start: start2, end: end2 }) ||
    isWithinInterval(bufferedEnd1, { start: start2, end: end2 })
  );
};

/**
 * Check if a time slot conflicts with existing bookings
 */
export const checkConflict = (
  date: string, // "2025-10-20"
  time: string, // "09:00 AM"
  duration: number, // minutes (service + add-ons)
  staffId?: string
): boolean => {
  const bookings = getBookingsForDate(date);
  
  if (bookings.length === 0) return false;
  
  // Parse the proposed appointment time
  const proposedStart = parse(`${date} ${time}`, 'yyyy-MM-dd hh:mm a', new Date());
  const proposedEnd = addMinutes(proposedStart, duration);
  
  // Check against each existing booking
  for (const booking of bookings) {
    // If staff is specified, only check bookings with the same staff
    if (staffId && booking.staff?.id !== staffId) continue;
    
    const bookingStart = parseISO(booking.dateTime);
    const bookingEnd = parseISO(booking.endTime);
    
    if (timeRangesOverlap(proposedStart, proposedEnd, bookingStart, bookingEnd)) {
      return true;
    }
  }
  
  return false;
};

/**
 * Find alternative time slots around the requested time
 */
export const findAlternativeTimes = (
  date: string,
  requestedTime: string,
  serviceDuration: number,
  addOnsDuration: number = 0,
  count: number = 6
): Array<{ time: string; endTime: string; available: boolean }> => {
  const alternatives: Array<{ time: string; endTime: string; available: boolean }> = [];
  const totalDuration = serviceDuration + addOnsDuration;
  
  // Parse requested time
  const baseTime = parse(requestedTime, 'hh:mm a', new Date());
  
  // Check times in 30-minute increments, ±2 hours
  for (let offset = -120; offset <= 120; offset += 30) {
    if (offset === 0) continue; // Skip the originally requested time
    
    const alternativeTime = addMinutes(baseTime, offset);
    const timeStr = format(alternativeTime, 'hh:mm a');
    const endTimeStr = calculateEndTime(timeStr, serviceDuration, addOnsDuration);
    
    // Check if this time is within business hours (9 AM - 8 PM)
    const hours = alternativeTime.getHours();
    if (hours < 9 || hours >= 20) continue;
    
    const available = !checkConflict(date, timeStr, totalDuration);
    
    alternatives.push({
      time: timeStr,
      endTime: endTimeStr,
      available,
    });
    
    if (alternatives.filter(a => a.available).length >= count) break;
  }
  
  // Sort by proximity to requested time
  return alternatives
    .sort((a, b) => {
      const aTime = parse(a.time, 'hh:mm a', new Date());
      const bTime = parse(b.time, 'hh:mm a', new Date());
      const aOffset = Math.abs(aTime.getTime() - baseTime.getTime());
      const bOffset = Math.abs(bTime.getTime() - baseTime.getTime());
      return aOffset - bOffset;
    })
    .slice(0, count);
};

/**
 * Check if there's buffer time between two bookings
 */
export const isWithinBufferTime = (
  booking1Start: Date,
  booking1End: Date,
  booking2Start: Date,
  booking2End: Date
): boolean => {
  const buffer1End = addMinutes(booking1End, BUFFER_TIME_MINUTES);
  const buffer2End = addMinutes(booking2End, BUFFER_TIME_MINUTES);
  
  return (
    isWithinInterval(booking2Start, { start: booking1Start, end: buffer1End }) ||
    isWithinInterval(booking1Start, { start: booking2Start, end: buffer2End })
  );
};
