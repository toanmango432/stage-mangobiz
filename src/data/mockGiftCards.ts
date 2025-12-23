// Mock gift card data for checkout panel
import { Grid, CreditCard, Cake, Gift, Sparkles } from 'lucide-react';

export interface GiftCard {
  id: string;
  name: string;
  value: number;
  design: string; // Design theme/style
  gradient: string; // Tailwind gradient classes
}

export interface GiftCardCategory {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const GIFT_CARD_CATEGORIES: GiftCardCategory[] = [
  { id: 'all', name: 'All Designs', icon: Grid },
  { id: 'classic', name: 'Classic', icon: CreditCard },
  { id: 'birthday', name: 'Birthday', icon: Cake },
  { id: 'holiday', name: 'Holiday', icon: Gift },
  { id: 'spa', name: 'Spa & Wellness', icon: Sparkles },
];

// Keep old export for backward compatibility
export const GIFT_CARD_DESIGNS = GIFT_CARD_CATEGORIES;

export const MOCK_GIFT_CARDS: GiftCard[] = [
  {
    id: 'gc-25',
    name: '$25 Gift Card',
    value: 25,
    design: 'classic',
    gradient: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
  },
  {
    id: 'gc-50',
    name: '$50 Gift Card',
    value: 50,
    design: 'classic',
    gradient: 'bg-gradient-to-br from-blue-400 to-blue-600',
  },
  {
    id: 'gc-75',
    name: '$75 Gift Card',
    value: 75,
    design: 'classic',
    gradient: 'bg-gradient-to-br from-purple-400 to-purple-600',
  },
  {
    id: 'gc-100',
    name: '$100 Gift Card',
    value: 100,
    design: 'classic',
    gradient: 'bg-gradient-to-br from-amber-400 to-amber-600',
  },
  {
    id: 'gc-150',
    name: '$150 Gift Card',
    value: 150,
    design: 'spa',
    gradient: 'bg-gradient-to-br from-brand-400 to-brand-600',
  },
  {
    id: 'gc-200',
    name: '$200 Gift Card',
    value: 200,
    design: 'spa',
    gradient: 'bg-gradient-to-br from-rose-400 to-rose-600',
  },
  {
    id: 'gc-birthday-50',
    name: 'Birthday $50',
    value: 50,
    design: 'birthday',
    gradient: 'bg-gradient-to-br from-pink-400 to-pink-600',
  },
  {
    id: 'gc-birthday-100',
    name: 'Birthday $100',
    value: 100,
    design: 'birthday',
    gradient: 'bg-gradient-to-br from-fuchsia-400 to-fuchsia-600',
  },
  {
    id: 'gc-holiday-50',
    name: 'Holiday $50',
    value: 50,
    design: 'holiday',
    gradient: 'bg-gradient-to-br from-red-400 to-green-500',
  },
  {
    id: 'gc-holiday-100',
    name: 'Holiday $100',
    value: 100,
    design: 'holiday',
    gradient: 'bg-gradient-to-br from-red-500 to-red-700',
  },
];

export function getGiftCardsByDesign(designId: string): GiftCard[] {
  if (designId === 'all') return MOCK_GIFT_CARDS;
  return MOCK_GIFT_CARDS.filter(gc => gc.design === designId);
}
