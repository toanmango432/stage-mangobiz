import type { Metadata } from 'next';
import Promotions from '@/views/Promotions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Promotions',
  description:
    'Discover current deals, discounts, and special offers on services and products.',
};

export default function PromotionsPage() {
  return <Promotions />;
}
