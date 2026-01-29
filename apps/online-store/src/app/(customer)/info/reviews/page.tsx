import type { Metadata } from 'next';
import Reviews from '@/views/info/Reviews';

export const metadata: Metadata = {
  title: 'Reviews',
  description: 'Read reviews and testimonials from our satisfied customers.',
};

export default function ReviewsPage() {
  return <Reviews />;
}
