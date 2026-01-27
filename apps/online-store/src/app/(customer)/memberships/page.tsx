import type { Metadata } from 'next';
import Memberships from '@/pages/Memberships';

export const metadata: Metadata = {
  title: 'Memberships',
  description:
    'Explore membership plans and save on your favorite services. Join a membership for exclusive perks and discounts.',
};

export default function MembershipsPage() {
  return <Memberships />;
}
