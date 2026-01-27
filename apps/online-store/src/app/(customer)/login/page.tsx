import type { Metadata } from 'next';
import Login from '@/pages/Login';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Sign in to your Mango account to manage bookings, orders, and preferences.',
};

export default function LoginPage() {
  return <Login />;
}
