import { useState, useEffect } from 'react';
import { X, CreditCard, DollarSign, Percent, Receipt, Printer, Check } from 'lucide-react';
import { Ticket, Payment } from '../../types/Ticket';

interface QuickCheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket;
  onComplete: (payments: Payment[], tip: number, discount: number) => void;
}

type PaymentMethod = 'cash' | 'card' | 'split';

export function QuickCheckout({ isOpen, onClose, ticket, onComplete }: QuickCheckoutProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [tipAmount, setTipAmount] = useState(0);
  const [tipPercent, setTipPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountReason, setDiscountReason] = useState('');
  const [cashAmount, setCashAmount] = useState(0);
  const [cardAmount, setCardAmount] = useState(0);
  const [cardLast4, setCardLast4] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const servicesTotal = ticket.services.reduce((sum, s) => sum + s.price, 0);
  const productsTotal = ticket.products.reduce((sum, p) => sum + p.total, 0);
  const subtotal = servicesTotal + productsTotal;
  const discountValue = discountAmount || (subtotal * discountPercent / 100);
  const afterDiscount = subtotal - discountValue;
  const taxRate = 0.08; // 8% tax
  const taxAmount = afterDiscount * taxRate;
  const tipValue = tipAmount || (afterDiscount * tipPercent / 100);
  const grandTotal = afterDiscount + taxAmount + tipValue;

  useEffect(() => {
    if (paymentMethod === 'split') {
      const half = grandTotal / 2;
      setCashAmount(half);
      setCardAmount(half);
    } else {
      setCashAmount(0);
      setCardAmount(0);
    }
  }, [paymentMethod, grandTotal]);

  const handleTipPercentClick = (percent: number) => {
    setTipPercent(percent);
    setTipAmount(0);
  };

  const handleTipAmountChange = (amount: number) => {
    setTipAmount(amount);
    setTipPercent(0);
  };

  const handleDiscountPercentChange = (percent: number) => {
    setDiscountPercent(percent);
    setDiscountAmount(0);
  };

  const handleDiscountAmountChange = (amount: number) => {
    setDiscountAmount(amount);
    setDiscountPercent(0);
  };

  const handleComplete = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    const payments: Payment[] = [];

    if (paymentMethod === 'cash') {
      payments.push({
        id: `pay_${Date.now()}`,
        method: 'cash',
        amount: afterDiscount + taxAmount,
        tip: tipValue,
        total: grandTotal,
        processedAt: new Date()
      });
    } else if (paymentMethod === 'card') {
      payments.push({
        id: `pay_${Date.now()}`,
        method: 'card',
        amount: afterDiscount + taxAmount,
        tip: tipValue,
        total: grandTotal,
        processedAt: new Date(),
        cardLast4: cardLast4 || '****',
        transactionId: `txn_${Date.now()}`
      });
    } else {
      // Split payment
      if (cashAmount > 0) {
        payments.push({
          id: `pay_${Date.now()}_cash`,
          method: 'cash',
          amount: cashAmount,
          tip: 0,
          total: cashAmount,
          processedAt: new Date()
        });
      }
      if (cardAmount > 0) {
        payments.push({
          id: `pay_${Date.now()}_card`,
          method: 'card',
          amount: cardAmount,
          tip: tipValue,
          total: cardAmount + tipValue,
          processedAt: new Date(),
          cardLast4: cardLast4 || '****',
          transactionId: `txn_${Date.now()}`
        });
      }
    }

    onComplete(payments, tipValue, discountValue);
    setIsProcessing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-500 rounded-xl">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Quick Checkout</h2>
              <p className="text-sm text-gray-600">{ticket.clientName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Order Summary */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-gray-900">Order Summary</h3>
            
            {/* Services */}
            {ticket.services.map((service, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {service.serviceName} <span className="text-gray-500">({service.staffName})</span>
                </span>
                <span className="font-medium">${service.price.toFixed(2)}</span>
              </div>
            ))}

            {/* Products */}
            {ticket.products.map((product, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {product.productName} x{product.quantity}
                </span>
                <span className="font-medium">${product.total.toFixed(2)}</span>
              </div>
            ))}

            <div className="border-t border-gray-200 pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              {discountValue > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount</span>
                  <span>-${discountValue.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax (8%)</span>
                <span className="font-medium">${taxAmount.toFixed(2)}</span>
              </div>
              {tipValue > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Tip</span>
                  <span>+${tipValue.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                <span>Total</span>
                <span className="text-green-600">${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Discount */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <Percent className="w-5 h-5 mr-2 text-red-500" />
              Discount
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Amount ($)</label>
                <input
                  type="number"
                  value={discountAmount || ''}
                  onChange={(e) => handleDiscountAmountChange(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Percent (%)</label>
                <input
                  type="number"
                  value={discountPercent || ''}
                  onChange={(e) => handleDiscountPercentChange(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="0"
                  step="1"
                  max="100"
                />
              </div>
            </div>
            {discountValue > 0 && (
              <input
                type="text"
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
                placeholder="Reason for discount (optional)"
              />
            )}
          </div>

          {/* Tip */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-500" />
              Tip
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {[15, 18, 20, 25].map((percent) => (
                <button
                  key={percent}
                  onClick={() => handleTipPercentClick(percent)}
                  className={`py-2 rounded-lg font-medium transition-all ${
                    tipPercent === percent
                      ? 'bg-green-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {percent}%
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Custom Amount ($)</label>
                <input
                  type="number"
                  value={tipAmount || ''}
                  onChange={(e) => handleTipAmountChange(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Custom Percent (%)</label>
                <input
                  type="number"
                  value={tipPercent || ''}
                  onChange={(e) => handleTipPercentClick(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="0"
                  step="1"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-blue-500" />
              Payment Method
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-600" />
                <div className="text-sm font-medium">Cash</div>
              </button>
              <button
                onClick={() => setPaymentMethod('card')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === 'card'
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCard className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <div className="text-sm font-medium">Card</div>
              </button>
              <button
                onClick={() => setPaymentMethod('split')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === 'split'
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex justify-center mb-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-sm font-medium">Split</div>
              </button>
            </div>

            {paymentMethod === 'card' && (
              <input
                type="text"
                value={cardLast4}
                onChange={(e) => setCardLast4(e.target.value.slice(0, 4))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Last 4 digits of card"
                maxLength={4}
              />
            )}

            {paymentMethod === 'split' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Cash Amount</label>
                  <input
                    type="number"
                    value={cashAmount}
                    onChange={(e) => {
                      const cash = parseFloat(e.target.value) || 0;
                      setCashAmount(cash);
                      setCardAmount(grandTotal - cash);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Card Amount</label>
                  <input
                    type="number"
                    value={cardAmount}
                    onChange={(e) => {
                      const card = parseFloat(e.target.value) || 0;
                      setCardAmount(card);
                      setCashAmount(grandTotal - card);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <div className="flex space-x-3">
            <button
              onClick={handleComplete}
              disabled={isProcessing}
              className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all font-medium shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>Complete ${grandTotal.toFixed(2)}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
