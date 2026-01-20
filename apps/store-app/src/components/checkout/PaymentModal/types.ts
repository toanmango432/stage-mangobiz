/**
 * PaymentModal Types
 * Type definitions for the payment modal component
 */

export interface PaymentMethod {
  type: "card" | "cash" | "gift_card" | "custom";
  amount: number;
  customName?: string;
  tendered?: number;
}

export interface TipDistribution {
  staffId: string;
  staffName: string;
  amount: number;
}

export interface TicketItem {
  name: string;
  quantity: number;
  price: number;
  staffName?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  serviceTotal?: number;
}

export interface PaymentCompletionData {
  methods: PaymentMethod[];
  tip: number;
  tipDistribution?: TipDistribution[];
  padTransactionId?: string;
}

export interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  total: number;
  subtotal?: number;
  tax?: number;
  discount?: number;
  onComplete: (payment: PaymentCompletionData) => void;
  staffMembers?: StaffMember[];
  ticketId?: string;
  clientId?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  items?: TicketItem[];
  onShowReceipt?: () => void;
  onSentToPad?: (transactionId: string) => void;
  /** Callback to open PriceResolutionModal when there are unresolved price changes */
  onOpenPriceResolution?: () => void;
}

export type PaymentMethodType = "card" | "cash" | "gift_card" | "custom";

export interface PaymentMethodOption {
  id: PaymentMethodType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface Step {
  id: number;
  label: string;
  sublabel: string;
}
