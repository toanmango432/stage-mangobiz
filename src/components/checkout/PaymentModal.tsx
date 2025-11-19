import { useState, useEffect } from 'react';
import { X, CreditCard, DollarSign, Camera, Percent, Check, AlertCircle } from 'lucide-react';
import { PaymentMethod } from '../../types/common';
import { PaymentDetails } from '../../types/transaction';
import { PendingTicket } from '../../types/Ticket';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: PendingTicket;
  onConfirm: (paymentMethod: PaymentMethod, paymentDetails: PaymentDetails, tip: number) => Promise<void>;
}

export function PaymentModal({ isOpen, onClose, ticket, onConfirm }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [tipAmount, setTipAmount] = useState(ticket.tip || 0);
  const [tipPercent, setTipPercent] = useState(0);

  // Card payment fields
  const [cardLast4, setCardLast4] = useState('');
  const [cardBrand, setCardBrand] = useState('');
  const [authCode, setAuthCode] = useState('');

  // Cash payment fields
  const [amountTendered, setAmountTendered] = useState(0);

  // Venmo payment fields
  const [venmoHandle, setVenmoHandle] = useState('');
  const [venmoTransactionId, setVenmoTransactionId] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = ticket.subtotal || 0;
  const tax = ticket.tax || 0;
  const tipValue = tipAmount || (subtotal * tipPercent / 100);
  const total = subtotal + tax + tipValue;
  const changeDue = paymentMethod === 'cash' ? Math.max(0, amountTendered - total) : 0;

  // Reset amount tendered when payment method or total changes
  useEffect(() => {
    if (paymentMethod === 'cash') {
      setAmountTendered(Math.ceil(total)); // Default to rounded up total
    }
  }, [paymentMethod, total]);

  // Reset error when user changes inputs
  useEffect(() => {
    setError(null);
  }, [paymentMethod, cardLast4, amountTendered, venmoHandle]);

  const handleTipPercentClick = (percent: number) => {
    setTipPercent(percent);
    setTipAmount(0);
  };

  const handleTipAmountChange = (amount: number) => {
    setTipAmount(amount);
    setTipPercent(0);
  };

  const validatePayment = (): string | null => {
    if (paymentMethod === 'card') {
      if (!cardLast4 || cardLast4.length !== 4 || !/^\d{4}$/.test(cardLast4)) {
        return 'Please enter the last 4 digits of the card';
      }
    } else if (paymentMethod === 'cash') {
      if (amountTendered < total) {
        return `Amount tendered must be at least $${total.toFixed(2)}`;
      }
    } else if (paymentMethod === 'venmo') {
      if (!venmoHandle || !venmoTransactionId) {
        return 'Please enter Venmo handle and transaction ID';
      }
    }
    return null;
  };

  const handleConfirm = async () => {
    // Validate payment
    const validationError = validatePayment();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Build payment details based on method
      const paymentDetails: PaymentDetails = {};

      if (paymentMethod === 'card') {
        paymentDetails.cardLast4 = cardLast4;
        paymentDetails.cardBrand = cardBrand || 'Unknown';
        paymentDetails.authCode = authCode || `AUTH-${Date.now()}`;
        paymentDetails.processor = 'Square'; // Default processor
      } else if (paymentMethod === 'cash') {
        paymentDetails.amountTendered = amountTendered;
        paymentDetails.changeDue = changeDue;
      } else if (paymentMethod === 'venmo') {
        paymentDetails.accountHandle = venmoHandle;
        paymentDetails.transactionId = venmoTransactionId;
      }

      paymentDetails.receiptNumber = `R-${Date.now()}`;

      // Call parent handler
      await onConfirm(paymentMethod, paymentDetails, tipValue);

      // Close modal on success
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Process Payment</h2>
            <p className="text-sm text-gray-500">Ticket #{ticket.number} • {ticket.clientName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isProcessing}
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Service Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Service</div>
            <div className="font-semibold text-gray-900">
              {ticket.service}
              {ticket.additionalServices > 0 && (
                <span className="text-sm text-gray-500 ml-2">
                  +{ticket.additionalServices} more
                </span>
              )}
            </div>
            {ticket.technician && (
              <div className="text-sm text-gray-600 mt-1">with {ticket.technician}</div>
            )}
          </div>

          {/* Payment Method Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setPaymentMethod('card')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === 'card'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCard size={24} className={paymentMethod === 'card' ? 'text-blue-600' : 'text-gray-400'} />
                <div className="text-sm font-medium mt-2">Card</div>
              </button>
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <DollarSign size={24} className={paymentMethod === 'cash' ? 'text-green-600' : 'text-gray-400'} />
                <div className="text-sm font-medium mt-2">Cash</div>
              </button>
              <button
                onClick={() => setPaymentMethod('venmo')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === 'venmo'
                    ? 'border-sky-500 bg-sky-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Camera size={24} className={paymentMethod === 'venmo' ? 'text-sky-600' : 'text-gray-400'} />
                <div className="text-sm font-medium mt-2">Venmo</div>
              </button>
            </div>
          </div>

          {/* Payment Method Specific Fields */}
          {paymentMethod === 'card' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Last 4 Digits *
                </label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="1234"
                  value={cardLast4}
                  onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Brand
                  </label>
                  <select
                    value={cardBrand}
                    onChange={(e) => setCardBrand(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select...</option>
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="Amex">American Express</option>
                    <option value="Discover">Discover</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auth Code
                  </label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={authCode}
                    onChange={(e) => setAuthCode(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'cash' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount Tendered
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min={total}
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              {changeDue > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm text-green-700">Change Due</div>
                  <div className="text-2xl font-bold text-green-900">${changeDue.toFixed(2)}</div>
                </div>
              )}
            </div>
          )}

          {paymentMethod === 'venmo' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venmo Handle *
                </label>
                <input
                  type="text"
                  placeholder="@username"
                  value={venmoHandle}
                  onChange={(e) => setVenmoHandle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction ID *
                </label>
                <input
                  type="text"
                  placeholder="Venmo transaction ID"
                  value={venmoTransactionId}
                  onChange={(e) => setVenmoTransactionId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Tip Adjustment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Adjust Tip
            </label>
            <div className="flex gap-2 mb-3">
              {[0, 15, 18, 20, 25].map((percent) => (
                <button
                  key={percent}
                  onClick={() => handleTipPercentClick(percent)}
                  className={`flex-1 py-2 rounded-lg border-2 transition-all ${
                    tipPercent === percent
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  {percent}%
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Custom amount"
                value={tipAmount || ''}
                onChange={(e) => handleTipAmountChange(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Amount Breakdown */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-mono">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax</span>
              <span className="font-mono">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tip</span>
              <span className="font-mono">${tipValue.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-300 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-xl font-mono">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Processing...
              </>
            ) : (
              <>
                <Check size={20} />
                Confirm Payment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
