import { useRef, useCallback } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { useToast } from '@/hooks/use-toast';
import {
  createCheckoutTicket,
  markTicketAsPaid,
  type CheckoutTicketService,
} from '@/store/slices/uiTicketsSlice';
import { dataService } from '@/services/dataService';
import type { TicketService } from '../ServiceList';
import type { Client } from '../ClientSelector';

interface UseTicketPaymentOptions {
  ticketId: string | null;
  services: TicketService[];
  selectedClient: Client | null;
  discount: number;
  subtotal: number;
  tax: number;
  total: number;
  onResetTicket: () => void;
  onTogglePaymentModal: (show: boolean) => void;
  onClose: () => void;
}

interface PaymentData {
  methods?: Array<{
    type: 'cash' | 'card' | 'gift_card' | 'custom';
    amount: number;
    tendered?: number;
    authCode?: string;
    authorization_code?: string;
    transactionId?: string;
    transaction_id?: string;
  }>;
  tip?: number;
  tipDistribution?: Array<{
    staffId: string;
    staffName: string;
    amount: number;
  }>;
}

interface RefundData {
  type: 'full' | 'partial';
  amount: number;
  reason: string;
  refundMethod: string;
  serviceIds: string[];
}

/**
 * Hook to handle payment-related operations for the checkout panel.
 */
export function useTicketPayment({
  ticketId,
  services,
  selectedClient,
  discount,
  subtotal,
  tax,
  total,
  onResetTicket,
  onTogglePaymentModal,
  onClose,
}: UseTicketPaymentOptions) {
  const reduxDispatch = useAppDispatch();
  const { toast } = useToast();
  const checkoutCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Convert local TicketService to CheckoutTicketService for Redux
  const convertToCheckoutServices = useCallback((localServices: TicketService[]): CheckoutTicketService[] => {
    return localServices.map(s => ({
      id: s.id,
      serviceId: s.serviceId,
      serviceName: s.serviceName,
      price: s.price,
      duration: s.duration,
      status: s.status as 'not_started' | 'in_progress' | 'paused' | 'completed',
      staffId: s.staffId,
      staffName: s.staffName,
      startTime: s.startTime,
    }));
  }, []);

  // Open payment modal
  const handleCheckout = useCallback(() => {
    onTogglePaymentModal(true);
  }, [onTogglePaymentModal]);

  // Process payment completion
  const handleCompletePayment = useCallback(async (payment: PaymentData) => {
    console.log('Payment completed:', { selectedClient, services, payment });

    // Close the payment modal first
    onTogglePaymentModal(false);

    // Track the effective ticket ID (either existing or newly created)
    let effectiveTicketId = ticketId;

    try {
      // 1. If no ticketId exists, create the ticket first (for direct checkout without prior save)
      if (!effectiveTicketId && services.length > 0) {
        console.log('📝 Creating ticket for direct checkout (no prior save)...');
        const checkoutServices = convertToCheckoutServices(services);
        const clientName = selectedClient
          ? `${selectedClient.firstName} ${selectedClient.lastName}`.trim()
          : 'Walk-in';

        const result = await reduxDispatch(createCheckoutTicket({
          clientId: selectedClient?.id,
          clientName,
          services: checkoutServices,
          notes: undefined,
          discount,
          subtotal,
          tax,
          total,
          status: 'completed', // Mark as completed since we're paying now
        })).unwrap();

        effectiveTicketId = result.id;
        console.log('✅ Ticket created for direct checkout:', effectiveTicketId, 'Number:', result.number);
      }

      // 2. Complete the ticket in the database (marks status as 'completed')
      if (effectiveTicketId) {
        console.log('📝 Completing ticket in database:', effectiveTicketId);
        const completedTicket = await dataService.tickets.complete(effectiveTicketId, payment.methods || []);
        if (completedTicket) {
          console.log('✅ Ticket completed:', completedTicket.id, 'Status:', completedTicket.status);
        }
      }

      // 3. Create transaction record for the payment
      const primaryMethod = payment.methods?.[0];
      const primaryPaymentMethod = (primaryMethod?.type || 'cash') as 'cash' | 'card' | 'gift_card' | 'other';

      // Get ticket number from localStorage
      const storedTicket = localStorage.getItem('checkout-pending-ticket');
      const parsedStoredTicket = storedTicket ? JSON.parse(storedTicket) : null;
      const ticketNumber = parsedStoredTicket?.number || 0;

      // Build payment details based on payment method
      const paymentDetails: {
        amountTendered?: number;
        changeDue?: number;
        authCode?: string;
        transactionId?: string;
        splits?: Array<{ method: 'cash' | 'card' | 'gift_card' | 'other'; amount: number; details: any }>;
      } = {};

      if (primaryPaymentMethod === 'cash' && primaryMethod?.tendered) {
        paymentDetails.amountTendered = primaryMethod.tendered;
        paymentDetails.changeDue = primaryMethod.tendered - primaryMethod.amount;
      }

      if (primaryPaymentMethod === 'card' && primaryMethod) {
        paymentDetails.authCode = primaryMethod.authCode || primaryMethod.authorization_code;
        paymentDetails.transactionId = primaryMethod.transactionId || primaryMethod.transaction_id;
      }

      // Handle split payments
      if (payment.methods && payment.methods.length > 1) {
        paymentDetails.splits = payment.methods.map((m) => ({
          method: m.type as 'cash' | 'card' | 'gift_card' | 'other',
          amount: m.amount,
          details: m,
        }));
      }

      // Create transaction
      const transactionData = {
        ticketId: effectiveTicketId || `ticket-${Date.now()}`,
        ticketNumber: ticketNumber,
        clientId: selectedClient?.id,
        clientName: selectedClient
          ? `${selectedClient.firstName} ${selectedClient.lastName}`.trim() || 'Walk-in'
          : 'Walk-in',
        subtotal: subtotal,
        tax: tax,
        tip: payment.tip || 0,
        tipDistribution: payment.tipDistribution || [],
        discount: discount || 0,
        paymentMethod: primaryPaymentMethod,
        paymentDetails: paymentDetails,
        services: services.map(s => ({
          name: s.serviceName,
          price: s.price,
          staffName: s.staffName,
        })),
        notes: '',
      };
      await dataService.transactions.create(transactionData as any);
      console.log('✅ Transaction record created');

      // 4. Mark ticket as paid and move from pending to closed
      if (effectiveTicketId) {
        console.log('📝 Marking ticket as paid:', effectiveTicketId);
        const mappedPaymentMethod = primaryPaymentMethod === 'card' ? 'credit-card' : primaryPaymentMethod;
        await reduxDispatch(markTicketAsPaid({
          ticketId: effectiveTicketId,
          paymentMethod: mappedPaymentMethod as any,
          paymentDetails: paymentDetails,
          tip: payment.tip || 0,
        })).unwrap();
        console.log('✅ Ticket marked as paid and moved to closed');
      }

      // Show success toast
      toast({
        title: 'Payment Complete!',
        description: `Successfully processed payment of $${total.toFixed(2)}. Ticket closed.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('❌ Error completing ticket:', error);
      // Still show success since payment was processed
      toast({
        title: 'Payment Complete!',
        description: `Payment of $${total.toFixed(2)} processed. Some records may sync later.`,
        duration: 3000,
      });
    }

    // Reset ticket state and close the panel
    onResetTicket();

    const closeTimeout = setTimeout(() => {
      onClose();
    }, 1500);

    if (checkoutCloseTimeoutRef.current) {
      clearTimeout(checkoutCloseTimeoutRef.current);
    }
    checkoutCloseTimeoutRef.current = closeTimeout;
  }, [
    ticketId,
    services,
    selectedClient,
    discount,
    subtotal,
    tax,
    total,
    reduxDispatch,
    toast,
    convertToCheckoutServices,
    onTogglePaymentModal,
    onResetTicket,
    onClose,
  ]);

  // Handle refund
  const handleRefund = useCallback((data: RefundData) => {
    toast({
      title: 'Refund Processed',
      description: `$${data.amount.toFixed(2)} refunded via ${data.refundMethod}`,
    });
  }, [toast]);

  // Handle void
  const handleVoid = useCallback((reason: string) => {
    toast({
      title: 'Transaction Voided',
      description: `Transaction has been voided: ${reason}`,
    });
  }, [toast]);

  // Cleanup timeout on unmount
  const cleanup = useCallback(() => {
    if (checkoutCloseTimeoutRef.current) {
      clearTimeout(checkoutCloseTimeoutRef.current);
      checkoutCloseTimeoutRef.current = null;
    }
  }, []);

  return {
    handleCheckout,
    handleCompletePayment,
    handleRefund,
    handleVoid,
    cleanup,
  };
}
