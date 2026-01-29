import type { Metadata } from 'next';
import Checkout from '@/views/Checkout';

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Complete your purchase securely. Review your order and enter payment details.',
};

export default function CheckoutPage() {
  return <Checkout />;
}
