import { useMemo } from 'react';
import { TimeSlot, Availability, Staff } from '@/types/booking';
import { format, addMinutes, parse, isBefore, isAfter } from 'date-fns';

// Mock staff data - 10 diverse staff members with realistic schedules
const mockStaff: Staff[] = [
  {
    id: 'staff-1',
    name: 'Sarah Johnson',
    title: 'Senior Nail Technician',
    photo: undefined,
    rating: 4.9,
    specialties: ['Gel Extensions', 'Nail Art', 'Luxury Manicures'],
    workingHours: {
      Monday: { start: '09:00', end: '18:00' },
      Tuesday: { start: '09:00', end: '18:00' },
      Wednesday: { start: '09:00', end: '18:00' },
      Thursday: { start: '09:00', end: '18:00' },
      Friday: { start: '09:00', end: '18:00' },
      Saturday: { start: '10:00', end: '16:00' },
    },
    daysOff: ['2025-11-05', '2025-11-20'],
  },
  {
    id: 'staff-2',
    name: 'Emily Chen',
    title: 'Lead Nail Artist',
    photo: undefined,
    rating: 4.8,
    specialties: ['Acrylic Nails', 'Nail Art', 'Classic Manicures'],
    workingHours: {
      Tuesday: { start: '10:00', end: '19:00' },
      Wednesday: { start: '10:00', end: '19:00' },
      Thursday: { start: '10:00', end: '19:00' },
      Friday: { start: '10:00', end: '19:00' },
      Saturday: { start: '10:00', end: '19:00' },
      Sunday: { start: '10:00', end: '17:00' },
    },
    daysOff: ['2025-11-12', '2025-11-26'],
  },
  {
    id: 'staff-3',
    name: 'Jessica Martinez',
    title: 'Nail & Beauty Specialist',
    photo: undefined,
    rating: 5.0,
    specialties: ['Pedicures', 'Gel Polish', 'Waxing'],
    workingHours: {
      Wednesday: { start: '09:00', end: '17:00' },
      Thursday: { start: '09:00', end: '17:00' },
      Friday: { start: '09:00', end: '17:00' },
      Saturday: { start: '09:00', end: '17:00' },
      Sunday: { start: '09:00', end: '17:00' },
    },
    daysOff: ['2025-11-08', '2025-11-22'],
  },
  {
    id: 'staff-4',
    name: 'Michael Rodriguez',
    title: 'Hair Stylist',
    photo: undefined,
    rating: 4.9,
    specialties: ['Haircuts', 'Hair Coloring', 'Balayage'],
    workingHours: {
      Monday: { start: '08:00', end: '16:00' },
      Tuesday: { start: '08:00', end: '16:00' },
      Wednesday: { start: '08:00', end: '16:00' },
      Thursday: { start: '08:00', end: '16:00' },
      Friday: { start: '08:00', end: '16:00' },
    },
    daysOff: ['2025-11-10', '2025-11-24'],
  },
  {
    id: 'staff-5',
    name: 'David Kim',
    title: 'Senior Hair Colorist',
    photo: undefined,
    rating: 4.7,
    specialties: ['Hair Coloring', 'Highlights', 'Ombre'],
    workingHours: {
      Thursday: { start: '11:00', end: '20:00' },
      Friday: { start: '11:00', end: '20:00' },
      Saturday: { start: '11:00', end: '20:00' },
      Sunday: { start: '11:00', end: '19:00' },
      Monday: { start: '11:00', end: '20:00' },
    },
    daysOff: ['2025-11-07', '2025-11-21'],
  },
  {
    id: 'staff-6',
    name: 'Amanda Thompson',
    title: 'Esthetician',
    photo: undefined,
    rating: 4.9,
    specialties: ['Facials', 'Skin Treatments', 'Waxing'],
    workingHours: {
      Monday: { start: '09:00', end: '17:00' },
      Tuesday: { start: '09:00', end: '17:00' },
      Wednesday: { start: '09:00', end: '17:00' },
      Thursday: { start: '09:00', end: '17:00' },
      Friday: { start: '09:00', end: '17:00' },
    },
    daysOff: ['2025-11-13', '2025-11-27'],
  },
  {
    id: 'staff-7',
    name: 'Marcus Williams',
    title: 'Massage Therapist',
    photo: undefined,
    rating: 4.8,
    specialties: ['Deep Tissue', 'Swedish Massage', 'Aromatherapy'],
    workingHours: {
      Tuesday: { start: '10:00', end: '18:00' },
      Wednesday: { start: '10:00', end: '18:00' },
      Thursday: { start: '10:00', end: '18:00' },
      Friday: { start: '10:00', end: '18:00' },
      Saturday: { start: '10:00', end: '18:00' },
    },
    daysOff: ['2025-11-06', '2025-11-19'],
  },
  {
    id: 'staff-8',
    name: 'Sophia Patel',
    title: 'Junior Nail Technician',
    photo: undefined,
    rating: 4.7,
    specialties: ['Basic Manicures', 'Pedicures', 'Gel Polish'],
    workingHours: {
      Monday: { start: '12:00', end: '20:00' },
      Wednesday: { start: '12:00', end: '20:00' },
      Friday: { start: '12:00', end: '20:00' },
      Saturday: { start: '12:00', end: '20:00' },
    },
    daysOff: ['2025-11-11', '2025-11-25'],
  },
  {
    id: 'staff-9',
    name: 'Isabella Garcia',
    title: 'Multi-Service Specialist',
    photo: undefined,
    rating: 4.9,
    specialties: ['Nails', 'Waxing', 'Brow Shaping'],
    workingHours: {
      Thursday: { start: '09:00', end: '18:00' },
      Friday: { start: '09:00', end: '18:00' },
      Saturday: { start: '09:00', end: '18:00' },
      Sunday: { start: '09:00', end: '18:00' },
    },
    daysOff: ['2025-11-14', '2025-11-28'],
  },
  {
    id: 'staff-10',
    name: 'Oliver Chen',
    title: 'Beauty Technician',
    photo: undefined,
    rating: 4.8,
    specialties: ['Waxing', 'Brow & Lash Treatments', 'Facials'],
    workingHours: {
      Monday: { start: '11:00', end: '19:00' },
      Tuesday: { start: '11:00', end: '19:00' },
      Wednesday: { start: '11:00', end: '19:00' },
      Thursday: { start: '11:00', end: '19:00' },
      Friday: { start: '11:00', end: '19:00' },
    },
    daysOff: ['2025-11-09', '2025-11-23'],
  },
];

export const useAvailability = (serviceDuration: number = 60) => {
  const generateTimeSlots = (date: Date): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const dayOfWeek = format(date, 'EEEE');
    const openHour = 9;
    const closeHour = 20;

    for (let hour = openHour; hour < closeHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotTime = new Date(date);
        slotTime.setHours(hour, minute, 0, 0);
        
        const endTime = addMinutes(slotTime, serviceDuration);
        
        // Don't add slot if it goes past closing time
        if (endTime.getHours() < closeHour || (endTime.getHours() === closeHour && endTime.getMinutes() === 0)) {
          const timeString = format(slotTime, 'hh:mm a');
          const endTimeString = format(endTime, 'hh:mm a');
          
          // Simulate availability (70% of slots are available)
          const available = Math.random() > 0.3;
          
          // Get staff available for this time
          const staffAvailable = mockStaff
            .filter(staff => {
              const workHours = staff.workingHours[dayOfWeek];
              if (!workHours) return false;
              
              const staffStart = parse(workHours.start, 'HH:mm', date);
              const staffEnd = parse(workHours.end, 'HH:mm', date);
              
              return !isBefore(slotTime, staffStart) && isBefore(endTime, staffEnd);
            })
            .map(staff => staff.id);
          
          slots.push({
            time: timeString,
            available: available && staffAvailable.length > 0,
            staffAvailable,
            endTime: endTimeString,
          });
        }
      }
    }

    return slots;
  };

  const getAvailability = (date: Date): Availability => {
    const dayOfWeek = format(date, 'EEEE');
    const isOpen = dayOfWeek !== 'Sunday'; // Closed on Sundays
    
    const timeSlots = isOpen ? generateTimeSlots(date) : [];
    const fullyBooked = timeSlots.length > 0 && timeSlots.every(slot => !slot.available);

    return {
      date: format(date, 'yyyy-MM-dd'),
      dayOfWeek,
      isOpen,
      hours: isOpen ? { open: '09:00', close: '20:00' } : undefined,
      timeSlots,
      fullyBooked,
    };
  };

  const getAvailableStaff = () => mockStaff;

  return {
    getAvailability,
    getAvailableStaff,
    generateTimeSlots,
  };
};
