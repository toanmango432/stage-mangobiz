import type { Metadata } from 'next';
import Account from '@/pages/Account';

export const metadata: Metadata = {
  title: 'My Account',
  description:
    'Manage your account, view upcoming appointments, order history, and saved preferences.',
};

export default function AccountPage() {
  return <Account />;
}
