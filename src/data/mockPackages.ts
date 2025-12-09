// Mock package data for checkout panel
import { Grid, Crown, Sparkles, Users } from 'lucide-react';

export interface Package {
  id: string;
  name: string;
  description: string;
  category: string;
  originalPrice: number;
  salePrice: number;
  discountPercent: number;
  includedServices: string[];
  gradient: string; // Tailwind gradient classes
}

export interface PackageCategory {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const PACKAGE_CATEGORIES: PackageCategory[] = [
  { id: 'all', name: 'All Packages', icon: Grid },
  { id: 'bridal', name: 'Bridal', icon: Crown },
  { id: 'spa-day', name: 'Spa Day', icon: Sparkles },
  { id: 'group', name: 'Group', icon: Users },
];

export const MOCK_PACKAGES: Package[] = [
  {
    id: 'pkg-1',
    name: 'Bridal Package',
    description: 'Hair, Makeup, Manicure & Pedicure',
    category: 'bridal',
    originalPrice: 350,
    salePrice: 299,
    discountPercent: 15,
    includedServices: ['Haircut', 'Color', 'Makeup', 'Mani/Pedi'],
    gradient: 'bg-gradient-to-br from-cyan-50 to-cyan-100',
  },
  {
    id: 'pkg-2',
    name: 'Spa Day Package',
    description: 'Full relaxation experience',
    category: 'spa-day',
    originalPrice: 260,
    salePrice: 199,
    discountPercent: 20,
    includedServices: ['Facial', 'Massage 90m', 'Pedicure'],
    gradient: 'bg-gradient-to-br from-purple-50 to-purple-100',
  },
  {
    id: 'pkg-3',
    name: 'Girls Night Out',
    description: 'Perfect for celebrations',
    category: 'group',
    originalPrice: 180,
    salePrice: 149,
    discountPercent: 17,
    includedServices: ['Blowout', 'Manicure', 'Champagne'],
    gradient: 'bg-gradient-to-br from-pink-50 to-pink-100',
  },
  {
    id: 'pkg-4',
    name: 'Groom Package',
    description: 'Look your best on the big day',
    category: 'bridal',
    originalPrice: 150,
    salePrice: 125,
    discountPercent: 17,
    includedServices: ['Haircut', 'Beard Trim', 'Facial'],
    gradient: 'bg-gradient-to-br from-slate-50 to-slate-100',
  },
  {
    id: 'pkg-5',
    name: 'Ultimate Relaxation',
    description: 'Head to toe pampering',
    category: 'spa-day',
    originalPrice: 400,
    salePrice: 320,
    discountPercent: 20,
    includedServices: ['Massage 90m', 'Facial', 'Body Wrap', 'Mani/Pedi'],
    gradient: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
  },
];

export function getPackagesByCategory(categoryId: string): Package[] {
  if (categoryId === 'all') return MOCK_PACKAGES;
  return MOCK_PACKAGES.filter(p => p.category === categoryId);
}
