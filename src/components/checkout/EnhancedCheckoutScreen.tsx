import { useState, useEffect } from 'react';
import { X, Plus, Minus, Percent, DollarSign, CreditCard, Smartphone, Banknote, Check } from 'lucide-react';
import type { Ticket } from '../../types';

interface Payment {
  id: string;
  method: 'cash' | 'card' | 'mobile' | 'other';
  amount: number;
}

interface EnhancedCheckoutScreenProps {
  ticket: any; // Will be properly typed
  onClose: () => void;
  onComplete: (paymentData: any) => void;
}

const PAYMENT_METHODS = [
  { id: 'card', label: 'Card', icon: CreditCard, color: 'blue' },
  { id: 'cash', label: 'Cash', icon: Banknote, color: 'green' },
  { id: 'mobile', label: 'Mobile Pay', icon: Smartphone, color: 'purple' },
  { id: 'other', label: 'Other', icon: DollarSign, color: 'gray' },
];

export function EnhancedCheckoutScreen({ ticket, onClose, onComplete }: EnhancedCheckoutScreenProps) {
  // State
  const [tipType, setTipType] = useState<'percentage' | 'custom'>('percentage');
  const [tipPercentage, setTipPercentage] = useState(18);
  const [customTip, setCustomTip] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'card' | 'mobile' | 'other'>('card');
  const [paymentAmount, setPaymentAmount] = useState('');

  // Calculate totals
  const subtotal = ticket.subtotal || 0;
  const discountAmount = discountType === 'percentage' 
    ? (subtotal * discount) / 100 
    : discount;
  const afterDiscount = subtotal - discountAmount;
  const tax = afterDiscount * 0.08; // 8% tax
  const tipAmount = tipType === 'percentage'
    ? (afterDiscount * tipPercentage) / 100
    : customTip;
  const total = afterDiscount + tax + tipAmount;
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = total - totalPaid;

  // Auto-calculate remaining amount for payment input
  useEffect(() => {
    if (paymentAmount === '') {
      setPaymentAmount(remaining.toFixed(2));
    }
  }, [remaining]);

  const addPayment = () => {
    const amount = parseFloat(paymentAmount);
    if (amount > 0 && amount <= remaining) {
      setPayments([
        ...payments,
        {
          id: Date.now().toString(),
          method: selectedPaymentMethod,
          amount,
        },
      ]);
      setPaymentAmount('');
    }
  };

  const removePayment = (id: string) => {
    setPayments(payments.filter(p => p.id !== id));
  };

  const handleComplete = () => {
    if (remaining <= 0.01) {
      onComplete({
        ticketId: ticket.id,
        subtotal,
        discount: discountAmount,
        tax,
        tip: tipAmount,
        total,
        payments,
        completedAt: new Date(),
      });
    }
  };

  const isComplete = remaining <= 0.01;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-4 flex items-center justify-between text-white">
          <div>
            <h2 className="text-2xl font-bold">Checkout</h2>
            <p className="text-sm opacity-90">Ticket #{ticket.id} • {ticket.clientName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Order Summary */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  {ticket.services.map((service: any) => (
                    <div key={service.id} className="flex justify-between">
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-gray-600">by {service.staffName}</p>
                      </div>
                      <p className="font-semibold">${service.price.toFixed(2)}</p>
                    </div>
                  ))}
                  {ticket.products?.map((product: any) => (
                    <div key={product.id} className="flex justify-between">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-600">Qty: {product.quantity}</p>
                      </div>
                      <p className="font-semibold">${product.total.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discount Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Discount</h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDiscountType('percentage')}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                        discountType === 'percentage'
                          ? 'bg-orange-500 text-white'
                          : 'bg-white text-gray-700 border border-gray-300'
                      }`}
                    >
                      <Percent className="w-4 h-4 inline mr-2" />
                      Percentage
                    </button>
                    <button
                      onClick={() => setDiscountType('fixed')}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                        discountType === 'fixed'
                          ? 'bg-orange-500 text-white'
                          : 'bg-white text-gray-700 border border-gray-300'
                      }`}
                    >
                      <DollarSign className="w-4 h-4 inline mr-2" />
                      Fixed
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                    <span className="text-gray-600 font-medium">
                      {discountType === 'percentage' ? '%' : '$'}
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <p className="text-sm text-green-600 font-medium">
                      Discount: -${discountAmount.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              {/* Tip Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Tip</h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  {tipType === 'percentage' && (
                    <div className="grid grid-cols-4 gap-2">
                      {[15, 18, 20, 25].map(pct => (
                        <button
                          key={pct}
                          onClick={() => setTipPercentage(pct)}
                          className={`py-2 px-3 rounded-lg font-medium transition ${
                            tipPercentage === pct
                              ? 'bg-orange-500 text-white'
                              : 'bg-white text-gray-700 border border-gray-300'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTipType('percentage')}
                      className={`flex-1 py-2 rounded-lg font-medium transition ${
                        tipType === 'percentage'
                          ? 'bg-orange-500 text-white'
                          : 'bg-white text-gray-700 border'
                      }`}
                    >
                      Percentage
                    </button>
                    <button
                      onClick={() => setTipType('custom')}
                      className={`flex-1 py-2 rounded-lg font-medium transition ${
                        tipType === 'custom'
                          ? 'bg-orange-500 text-white'
                          : 'bg-white text-gray-700 border'
                      }`}
                    >
                      Custom
                    </button>
                  </div>
                  {tipType === 'custom' && (
                    <input
                      type="number"
                      value={customTip}
                      onChange={(e) => setCustomTip(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter custom tip amount"
                      min="0"
                      step="0.01"
                    />
                  )}
                  <p className="text-sm text-green-600 font-medium">
                    Tip: ${tipAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Payment */}
            <div className="space-y-6">
              {/* Total Summary */}
              <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-xl p-6 space-y-2">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-700">
                  <span>Tax (8%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                {tipAmount > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Tip</span>
                    <span>${tipAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t-2 border-gray-300 my-2"></div>
                <div className="flex justify-between text-2xl font-bold text-gray-900">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
                <div className="grid grid-cols-2 gap-3">
                  {PAYMENT_METHODS.map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setSelectedPaymentMethod(method.id as any)}
                        className={`p-4 rounded-xl border-2 transition ${
                          selectedPaymentMethod === method.id
                            ? `border-${method.color}-500 bg-${method.color}-50`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`w-6 h-6 mx-auto mb-2 text-${method.color}-600`} />
                        <p className="text-sm font-medium text-center">{method.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment Amount */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Add Payment</h3>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                      $
                    </span>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <button
                    onClick={addPayment}
                    disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                    className="px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Payment List */}
              {payments.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Payments ({payments.length})</h3>
                  <div className="space-y-2">
                    {payments.map((payment) => {
                      const method = PAYMENT_METHODS.find(m => m.id === payment.method);
                      const Icon = method?.icon || CreditCard;
                      return (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-5 h-5 text-gray-600" />
                            <span className="font-medium">{method?.label}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold">${payment.amount.toFixed(2)}</span>
                            <button
                              onClick={() => removePayment(payment.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Remaining Balance */}
              <div className={`p-4 rounded-xl ${
                isComplete ? 'bg-green-50 border-2 border-green-500' : 'bg-yellow-50 border-2 border-yellow-500'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Remaining</span>
                  <span className="text-2xl font-bold">
                    ${remaining.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleComplete}
            disabled={!isComplete}
            className="flex-1 py-3 px-6 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            Complete Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
