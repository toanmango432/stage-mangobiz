import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateReceiptData,
  formatReceiptText,
  sendReceiptEmail,
  sendReceiptSMS,
  printReceipt,
  ReceiptData,
} from '../receiptService';

// Mock Supabase
vi.mock('@/services/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
    },
  },
}));

describe('Receipt Service', () => {
  const mockReceiptData: ReceiptData = {
    transactionId: 'txn-123',
    businessName: 'Test Spa',
    businessAddress: '123 Test St',
    businessPhone: '555-0100',
    date: new Date('2026-01-09T12:00:00Z'),
    client: {
      id: 'client-1',
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      phone: '555-0101',
    },
    services: [
      { id: 's1', name: 'Haircut', price: 50, staffName: 'John' },
      { id: 's2', name: 'Color', price: 100, staffName: 'John' },
    ],
    subtotal: 150,
    discount: 10,
    tax: 12.60,
    total: 152.60,
    tipAmount: 20,
    paymentMethod: 'Credit Card',
    amountPaid: 172.60,
  };

  describe('generateReceiptData', () => {
    it('should generate receipt data from ticket', () => {
      const ticket = {
        id: 'ticket-1',
        services: [
          { id: 's1', name: 'Haircut', price: 50, staffName: 'John' },
        ],
        subtotal: 50,
        tax: 4.50,
        total: 54.50,
        tip: 10,
      };

      const result = generateReceiptData(ticket as any, {
        businessName: 'Test Spa',
        businessAddress: '123 Test St',
        businessPhone: '555-0100',
      });

      expect(result.services.length).toBe(1);
      expect(result.subtotal).toBe(50);
      expect(result.total).toBe(54.50);
    });

    it('should include client info when available', () => {
      const ticket = {
        id: 'ticket-1',
        clientId: 'client-1',
        clientName: 'Jane Doe',
        services: [],
        subtotal: 0,
        tax: 0,
        total: 0,
      };

      const client = {
        id: 'client-1',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
      };

      const result = generateReceiptData(ticket as any, {}, client as any);

      expect(result.client?.firstName).toBe('Jane');
      expect(result.client?.email).toBe('jane@example.com');
    });

    it('should handle missing tip gracefully', () => {
      const ticket = {
        id: 'ticket-1',
        services: [],
        subtotal: 100,
        tax: 9,
        total: 109,
      };

      const result = generateReceiptData(ticket as any, {});

      expect(result.tipAmount).toBeUndefined();
    });
  });

  describe('formatReceiptText', () => {
    it('should format receipt as plain text', () => {
      const text = formatReceiptText(mockReceiptData);

      expect(text).toContain('TEST SPA');
      expect(text).toContain('Jane Doe');
      expect(text).toContain('Haircut');
      expect(text).toContain('50.00');
    });

    it('should include transaction ID', () => {
      const text = formatReceiptText(mockReceiptData);

      expect(text).toContain('txn-123');
    });

    it('should show discount when present', () => {
      const text = formatReceiptText(mockReceiptData);

      expect(text).toContain('Discount');
      expect(text).toContain('10.00');
    });

    it('should show tip when present', () => {
      const text = formatReceiptText(mockReceiptData);

      expect(text).toContain('Tip');
      expect(text).toContain('20.00');
    });

    it('should format totals correctly', () => {
      const text = formatReceiptText(mockReceiptData);

      expect(text).toContain('TOTAL');
      // Total including tip: 152.60 + 20 = 172.60
      expect(text).toContain('172.60');
    });
  });

  describe('sendReceiptEmail', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should send email with receipt data', async () => {
      const { supabase } = await import('@/services/supabase/client');

      await sendReceiptEmail(mockReceiptData, 'jane@example.com');

      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        'send-receipt-email',
        expect.objectContaining({
          body: expect.objectContaining({
            to: 'jane@example.com',
          }),
        })
      );
    });

    it('should throw error if no email provided', async () => {
      const dataWithoutEmail = { ...mockReceiptData, client: undefined };
      await expect(sendReceiptEmail(dataWithoutEmail, '')).rejects.toThrow(
        'Email address is required'
      );
    });

    it('should use client email if not explicitly provided', async () => {
      const { supabase } = await import('@/services/supabase/client');

      await sendReceiptEmail(mockReceiptData);

      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        'send-receipt-email',
        expect.objectContaining({
          body: expect.objectContaining({
            to: 'jane@example.com',
          }),
        })
      );
    });
  });

  describe('sendReceiptSMS', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should send SMS with receipt summary', async () => {
      const { supabase } = await import('@/services/supabase/client');

      await sendReceiptSMS(mockReceiptData, '555-0101');

      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        'send-receipt-sms',
        expect.objectContaining({
          body: expect.objectContaining({
            to: '555-0101',
          }),
        })
      );
    });

    it('should throw error if no phone provided', async () => {
      const dataWithoutPhone = { ...mockReceiptData, client: undefined };

      await expect(sendReceiptSMS(dataWithoutPhone, '')).rejects.toThrow(
        'Phone number is required'
      );
    });

    it('should use client phone if not explicitly provided', async () => {
      const { supabase } = await import('@/services/supabase/client');

      await sendReceiptSMS(mockReceiptData);

      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        'send-receipt-sms',
        expect.objectContaining({
          body: expect.objectContaining({
            to: '555-0101',
          }),
        })
      );
    });
  });

  describe('printReceipt', () => {
    it('should create iframe for printing', () => {
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');

      printReceipt(mockReceiptData);

      // Should append an iframe to body
      expect(appendChildSpy).toHaveBeenCalled();

      appendChildSpy.mockRestore();
    });

    it('should generate printable HTML with receipt data', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');

      printReceipt(mockReceiptData);

      // Should create an iframe element
      expect(createElementSpy).toHaveBeenCalledWith('iframe');

      createElementSpy.mockRestore();
    });
  });
});
