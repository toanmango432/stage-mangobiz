import type { Metadata } from 'next';
import Cart from '@/views/Cart';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Cart',
  description: 'Review your cart items and proceed to checkout.',
};

export default function CartPage() {
  return <Cart />;
}
