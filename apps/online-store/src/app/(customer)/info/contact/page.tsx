import type { Metadata } from 'next';
import Contact from '@/views/info/Contact';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with us. Find our location, phone number, email, and business hours.',
};

export default function ContactPage() {
  return <Contact />;
}
