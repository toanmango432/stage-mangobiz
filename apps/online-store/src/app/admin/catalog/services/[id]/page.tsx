import type { Metadata } from 'next';
import ServiceForm from '@/pages/admin/catalog/ServiceForm';

interface ServiceFormPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ServiceFormPageProps): Promise<Metadata> {
  const { id } = await params;

  if (id === 'new') {
    return {
      title: 'New Service',
      description: 'Create a new service in the catalog.',
    };
  }

  return {
    title: 'Edit Service',
    description: 'Edit service details in the catalog.',
  };
}

export default function AdminServiceFormPage() {
  return <ServiceForm />;
}
