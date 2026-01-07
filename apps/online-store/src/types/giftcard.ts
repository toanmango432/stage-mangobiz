export interface GiftCard {
  id: string;
  code: string;
  originalAmount: number;
  currentBalance: number;
  issuedDate: string;
  expiryDate?: string;
  status: 'active' | 'redeemed' | 'expired';
  recipientName?: string;
  senderName?: string;
  message?: string;
  transactions: GiftCardTransaction[];
}

export interface GiftCardTransaction {
  id: string;
  date: string;
  amount: number;
  orderNumber: string;
  description: string;
}
