import type { Metadata } from 'next';
import BookingFlowSimple from '@/pages/BookingFlowSimple';

export const metadata: Metadata = {
  title: 'Book an Appointment',
  description:
    'Schedule your next salon appointment online. Choose your services, pick a time, and book instantly.',
};

export default function BookPage() {
  return <BookingFlowSimple />;
}
