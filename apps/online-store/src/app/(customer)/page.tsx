import type { Metadata } from 'next';
import Index from '@/pages/Index';

export const metadata: Metadata = {
  title: 'Home',
  description:
    'Book appointments, shop products, and manage your beauty and wellness experience with Mango.',
};

export default function HomePage() {
  return <Index />;
}
