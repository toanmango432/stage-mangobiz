import { http, HttpResponse } from 'msw';

// Mock API handlers for testing
export const handlers = [
  // Services API
  http.get('/api/services', () => {
    return HttpResponse.json({
      services: [
        {
          id: '1',
          name: 'Gel Manicure',
          category: 'Nail Services',
          description: 'Premium gel manicure service',
          duration: 60,
          basePrice: 45,
          image: '/images/gel-manicure.jpg',
          featured: true,
          popular: true,
        },
        {
          id: '2',
          name: 'Pedicure',
          category: 'Nail Services',
          description: 'Relaxing pedicure service',
          duration: 45,
          basePrice: 60,
          image: '/images/pedicure.jpg',
          featured: false,
          popular: true,
        },
      ],
    });
  }),

  // Staff API
  http.get('/api/staff', () => {
    return HttpResponse.json({
      staff: [
        {
          id: '1',
          name: 'Sarah Chen',
          role: 'Senior Stylist',
          specialties: ['Hair Color', 'Balayage'],
          rating: 4.9,
          reviewCount: 127,
          experience: 8,
          totalBookings: 1250,
          avatar: '/images/staff/sarah-chen.jpg',
          portfolio: [
            '/images/portfolio/sarah-1.jpg',
            '/images/portfolio/sarah-2.jpg',
            '/images/portfolio/sarah-3.jpg',
          ],
          bio: 'Expert colorist with 8 years of experience',
          workingHours: {
            monday: { start: '09:00', end: '18:00' },
            tuesday: { start: '09:00', end: '18:00' },
            wednesday: { start: '09:00', end: '18:00' },
            thursday: { start: '09:00', end: '18:00' },
            friday: { start: '09:00', end: '18:00' },
            saturday: { start: '10:00', end: '16:00' },
            sunday: { start: '10:00', end: '16:00' },
          },
          daysOff: [],
        },
      ],
    });
  }),

  // Availability API
  http.get('/api/availability', () => {
    return HttpResponse.json({
      suggestions: [
        {
          date: '2024-01-15',
          time: '14:00',
          staff: { id: '1', name: 'Sarah Chen' },
          available: true,
          popular: true,
          label: 'Today',
        },
        {
          date: '2024-01-15',
          time: '15:30',
          staff: { id: '1', name: 'Sarah Chen' },
          available: true,
          popular: false,
          label: 'Today',
        },
        {
          date: '2024-01-16',
          time: '10:00',
          staff: { id: '1', name: 'Sarah Chen' },
          available: true,
          popular: false,
          label: 'Tomorrow',
        },
      ],
    });
  }),

  // Booking submission
  http.post('/api/bookings', () => {
    return HttpResponse.json({
      success: true,
      bookingId: 'BK-2024-001',
      bookingNumber: 'BK-2024-001',
    });
  }),
];



