import type { Metadata } from 'next';
import Policies from '@/pages/info/Policies';

export const metadata: Metadata = {
  title: 'Policies',
  description: 'Review our salon policies including cancellation, refund, and service policies.',
};

export default function PoliciesPage() {
  return <Policies />;
}
