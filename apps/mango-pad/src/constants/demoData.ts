/**
 * Demo Mode Mock Data (US-016)
 *
 * Hardcoded data for demo mode functionality.
 * Allows testing Mango Pad screens without real store connection.
 */

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
