import React, { useState } from 'react';
import type { EnhancedClient } from '../types';
import type { GiftCardBalance } from '@/types';
import { Card, Button, Badge, Input } from '../components/SharedComponents';

interface WalletSectionProps {
  client: EnhancedClient;
  onChange: (updates: Partial<EnhancedClient>) => void;
}

interface CreditAdjustmentModalProps {
  type: 'add' | 'deduct';
  currentBalance: number;
  onAdjust: (amount: number, reason: string) => void;
  onClose: () => void;
}

const CreditAdjustmentModal: React.FC<CreditAdjustmentModalProps> = ({
  type,
  currentBalance,
  onAdjust,
  onClose,
}) => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (type === 'deduct' && amountNum > currentBalance) {
      setError('Cannot deduct more than current balance');
      return;
    }
    if (!reason.trim()) {
      setError('Please provide a reason');
      return;
    }
    onAdjust(amountNum, reason.trim());
  };

  const isAdd = type === 'add';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className={`px-6 py-4 ${isAdd ? 'bg-green-50' : 'bg-red-50'} border-b`}>
          <h2 className="text-lg font-semibold text-gray-900">
            {isAdd ? 'Add Store Credit' : 'Deduct Store Credit'}
          </h2>
          <p className="text-sm text-gray-500">Current: ${currentBalance.toFixed(2)}</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(''); }}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError(''); }}
              placeholder={isAdd ? 'e.g., Refund for cancelled service' : 'e.g., Applied to purchase'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <button
            onClick={handleSubmit}
            className={`px-4 py-2 font-medium rounded-lg text-white ${isAdd ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {isAdd ? 'Add Credit' : 'Deduct Credit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const WalletSection: React.FC<WalletSectionProps> = ({
  client,
  onChange,
}) => {
  const [showCreditModal, setShowCreditModal] = useState<'add' | 'deduct' | null>(null);
  const [showAddGiftCard, setShowAddGiftCard] = useState(false);
  const [newGiftCard, setNewGiftCard] = useState({ cardNumber: '', balance: '', expirationDate: '' });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'No expiry';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleCreditAdjust = (amount: number, _reason: string) => {
    const currentCredit = client.storeCredit || 0;
    const newCredit = showCreditModal === 'add'
      ? currentCredit + amount
      : currentCredit - amount;
    onChange({ storeCredit: Math.max(0, newCredit) });
    setShowCreditModal(null);
  };

  const handleAddGiftCard = () => {
    if (!newGiftCard.cardNumber || !newGiftCard.balance) return;
    const card: GiftCardBalance = {
      cardNumber: newGiftCard.cardNumber,
      balance: parseFloat(newGiftCard.balance),
      expirationDate: newGiftCard.expirationDate || undefined,
      isActive: true,
    };
    const currentCards = client.giftCards || [];
    onChange({ giftCards: [...currentCards, card] });
    setNewGiftCard({ cardNumber: '', balance: '', expirationDate: '' });
    setShowAddGiftCard(false);
  };

  const handleToggleGiftCard = (cardNumber: string) => {
    const currentCards = client.giftCards || [];
    onChange({
      giftCards: currentCards.map(gc =>
        gc.cardNumber === cardNumber ? { ...gc, isActive: !gc.isActive } : gc
      ),
    });
  };

  const totalGiftCardBalance = (client.giftCards || [])
    .filter(gc => gc.isActive)
    .reduce((sum, gc) => sum + gc.balance, 0);

  const hasOutstanding = (client.outstandingBalance || 0) > 0;

  return (
    <div className="space-y-6">
      {/* Outstanding Balance Warning */}
      {hasOutstanding && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertIcon className="w-6 h-6 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-800">Outstanding Balance</h3>
            <p className="text-sm text-red-600 mt-1">
              This client has an outstanding balance of {formatCurrency(client.outstandingBalance || 0)}
            </p>
          </div>
          <Badge variant="error" size="sm">
            {formatCurrency(client.outstandingBalance || 0)}
          </Badge>
        </div>
      )}

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Store Credit */}
        <Card className="text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
            <WalletIcon className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600">
            {formatCurrency(client.storeCredit || 0)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Store Credit</p>
          <div className="flex gap-2 mt-4 justify-center">
            <Button variant="outline" size="sm" onClick={() => setShowCreditModal('add')}>
              <PlusIcon className="w-3 h-3" />
              Add
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCreditModal('deduct')}
              disabled={!client.storeCredit || client.storeCredit <= 0}
            >
              <MinusIcon className="w-3 h-3" />
              Deduct
            </Button>
          </div>
        </Card>

        {/* Gift Card Balance */}
        <Card className="text-center">
          <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center mx-auto mb-3">
            <GiftIcon className="w-6 h-6 text-cyan-600" />
          </div>
          <p className="text-3xl font-bold text-cyan-600">
            {formatCurrency(totalGiftCardBalance)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Gift Card Balance</p>
          <p className="text-xs text-gray-400 mt-1">
            {(client.giftCards || []).filter(gc => gc.isActive).length} active cards
          </p>
        </Card>

        {/* Outstanding */}
        <Card className="text-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${hasOutstanding ? 'bg-red-100' : 'bg-gray-100'}`}>
            <ReceiptIcon className={`w-6 h-6 ${hasOutstanding ? 'text-red-600' : 'text-gray-400'}`} />
          </div>
          <p className={`text-3xl font-bold ${hasOutstanding ? 'text-red-600' : 'text-gray-400'}`}>
            {formatCurrency(client.outstandingBalance || 0)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Outstanding</p>
          {hasOutstanding && (
            <Button variant="outline" size="sm" className="mt-4">
              Collect Payment
            </Button>
          )}
        </Card>
      </div>

      {/* Gift Cards */}
      <Card
        title="Gift Cards"
        description="Client's gift card balances"
        actions={
          <Button variant="outline" size="sm" onClick={() => setShowAddGiftCard(!showAddGiftCard)}>
            <PlusIcon className="w-4 h-4" />
            Add Card
          </Button>
        }
      >
        {/* Add Gift Card Form */}
        {showAddGiftCard && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Add Gift Card</h4>
            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Card Number"
                value={newGiftCard.cardNumber}
                onChange={(v) => setNewGiftCard(prev => ({ ...prev, cardNumber: v }))}
                placeholder="Enter card number"
              />
              <Input
                label="Balance"
                type="number"
                value={newGiftCard.balance}
                onChange={(v) => setNewGiftCard(prev => ({ ...prev, balance: v }))}
                placeholder="0.00"
              />
              <Input
                label="Expiry (Optional)"
                type="date"
                value={newGiftCard.expirationDate}
                onChange={(v) => setNewGiftCard(prev => ({ ...prev, expirationDate: v }))}
              />
            </div>
            <div className="flex gap-2 mt-3 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowAddGiftCard(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddGiftCard}
                disabled={!newGiftCard.cardNumber || !newGiftCard.balance}
              >
                Add Card
              </Button>
            </div>
          </div>
        )}

        {/* Gift Cards List */}
        {(!client.giftCards || client.giftCards.length === 0) ? (
          <div className="text-center py-8">
            <GiftIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No gift cards on file</p>
            <p className="text-xs text-gray-400 mt-1">
              Add a gift card to track balances
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {client.giftCards.map((gc) => {
              const isExpired = gc.expirationDate && new Date(gc.expirationDate) < new Date();
              const isLowBalance = gc.balance < 10;

              return (
                <div
                  key={gc.cardNumber}
                  className={`
                    flex items-center justify-between p-4 rounded-lg border
                    ${!gc.isActive || isExpired
                      ? 'bg-gray-50 border-gray-200 opacity-60'
                      : isLowBalance
                        ? 'bg-orange-50 border-orange-200'
                        : 'bg-white border-gray-200'
                    }
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${!gc.isActive || isExpired
                        ? 'bg-gray-100'
                        : 'bg-cyan-100'
                      }
                    `}>
                      <GiftIcon className={`w-5 h-5 ${!gc.isActive || isExpired ? 'text-gray-400' : 'text-cyan-600'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">
                          ****{gc.cardNumber.slice(-4)}
                        </p>
                        {!gc.isActive && <Badge variant="default" size="sm">Inactive</Badge>}
                        {isExpired && <Badge variant="error" size="sm">Expired</Badge>}
                        {isLowBalance && gc.isActive && !isExpired && (
                          <Badge variant="warning" size="sm">Low Balance</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {gc.expirationDate
                          ? `Expires ${formatDate(gc.expirationDate)}`
                          : 'No expiration'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-xl font-bold ${gc.isActive && !isExpired ? 'text-cyan-600' : 'text-gray-400'}`}>
                        {formatCurrency(gc.balance)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleGiftCard(gc.cardNumber)}
                      className={`
                        px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
                        ${gc.isActive
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          : 'bg-cyan-100 text-cyan-600 hover:bg-cyan-200'
                        }
                      `}
                    >
                      {gc.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Transaction History Placeholder */}
      <Card title="Recent Transactions">
        <div className="text-center py-8">
          <ReceiptIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No recent transactions</p>
          <p className="text-xs text-gray-400 mt-1">
            Transaction history will appear here
          </p>
        </div>
      </Card>

      {/* Credit Adjustment Modal */}
      {showCreditModal && (
        <CreditAdjustmentModal
          type={showCreditModal}
          currentBalance={client.storeCredit || 0}
          onAdjust={handleCreditAdjust}
          onClose={() => setShowCreditModal(null)}
        />
      )}
    </div>
  );
};

// Icons
const WalletIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const GiftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
  </svg>
);

const ReceiptIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
  </svg>
);

const AlertIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const MinusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
  </svg>
);

export default WalletSection;
