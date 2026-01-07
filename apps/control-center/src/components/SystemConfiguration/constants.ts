/**
 * System Configuration Constants
 */

// Emoji options for categories
export const EMOJI_OPTIONS = ['💅', '🦶', '✨', '🧖', '💇', '💆', '🪒', '💄', '🧴', '✂️', '🎨', '💎'];

// Color options for categories and roles
export const COLOR_OPTIONS = [
  '#FF6B9D', '#4ECDC4', '#95E1D3', '#F9ED69', '#FF8C42',
  '#6C5CE7', '#00B894', '#E17055', '#74B9FF', '#FDCB6E',
  '#A29BFE', '#55A3FF', '#FF7675', '#81ECEC', '#DFE6E9'
];

// Payment type options
export const PAYMENT_TYPES = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'check', label: 'Check' },
  { value: 'gift_card', label: 'Gift Card' },
  { value: 'other', label: 'Other' },
] as const;

// Section types
export type Section = 'taxes' | 'categories' | 'items' | 'roles' | 'payments';
