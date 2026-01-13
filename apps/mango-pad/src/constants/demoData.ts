/**
 * Demo Mode Mock Data (US-016)
 *
 * Hardcoded data for demo mode functionality.
 * Allows testing Mango Pad screens without real store connection.
 */

import type { ActiveTransaction } from '@/types';

export interface DemoReceiptItem {
  name: string;
  price: number;
  quantity: number;
}

export interface DemoReceipt {
  id: string;
  items: DemoReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
  storeName: string;
  timestamp: string;
}

export const DEMO_RECEIPT: DemoReceipt = {
  id: 'DEMO-001',
  items: [
    { name: 'Gel Manicure', price: 45.00, quantity: 1 },
    { name: 'Spa Pedicure', price: 55.00, quantity: 1 },
    { name: 'Nail Art (per nail)', price: 5.00, quantity: 4 },
  ],
  subtotal: 120.00,
  tax: 10.80,
  total: 130.80,
  storeName: 'Mango Nail Spa',
  timestamp: new Date().toISOString(),
};

// Tip options as percentages
export const DEMO_TIP_OPTIONS = [15, 18, 20, 25];

// Demo mode config
export const DEMO_CONFIG = {
  storeName: 'Mango Nail Spa',
  stationName: 'Station 1',
  salonId: 'demo-salon-001',
  deviceId: 'demo-pad-001',
};

/**
 * Base demo transaction data used across all pages
 * Pages can override specific fields as needed
 */
export const DEMO_TRANSACTION_BASE: Omit<ActiveTransaction, 'step' | 'startedAt'> = {
  transactionId: 'demo-transaction',
  ticketId: 'ticket-demo-001',
  clientName: 'Sarah Johnson',
  clientEmail: 'sarah@example.com',
  clientPhone: '555-0123',
  staffName: 'Mike Chen',
  items: [
    { id: '1', name: 'Haircut & Style', staffName: 'Mike Chen', price: 45.00, quantity: 1, type: 'service' },
    { id: '2', name: 'Deep Conditioning', staffName: 'Mike Chen', price: 25.00, quantity: 1, type: 'service' },
    { id: '3', name: 'Premium Shampoo', staffName: 'Mike Chen', price: 18.99, quantity: 1, type: 'product' },
  ],
  subtotal: 88.99,
  tax: 7.12,
  discount: 0,
  total: 96.11,
  suggestedTips: [15, 18, 20, 25],
  tipAmount: 0,
  tipPercent: null,
};

/**
 * Create a demo transaction for a specific page/step
 */
export function createDemoTransaction(
  step: ActiveTransaction['step'],
  overrides?: Partial<Omit<ActiveTransaction, 'step' | 'startedAt'>>
): ActiveTransaction {
  return {
    ...DEMO_TRANSACTION_BASE,
    ...overrides,
    step,
    startedAt: new Date().toISOString(),
  };
}
