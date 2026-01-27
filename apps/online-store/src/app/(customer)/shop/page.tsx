import type { Metadata } from 'next';
import Shop from '@/pages/Shop';

export const metadata: Metadata = {
  title: 'Shop',
  description:
    'Browse and shop premium beauty and wellness products. Find everything from skincare to hair care at Mango.',
};

export default function ShopPage() {
  return <Shop />;
}
