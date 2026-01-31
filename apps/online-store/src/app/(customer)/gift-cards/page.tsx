import type { Metadata } from 'next';
import GiftCards from '@/views/GiftCards';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Gift Cards',
  description:
    'Purchase gift cards for friends and family. The perfect gift for any beauty and wellness lover.',
};

export default function GiftCardsPage() {
  return <GiftCards />;
}
