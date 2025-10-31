import { useState } from 'react';
import { X, Plus, Minus, Tag, Gift, CreditCard, DollarSign, Smartphone, Wallet } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  staffName: string;
  staffId: string;
  duration: number;
  price: number;
  discount?: number;
}

interface Product {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface CheckoutTicket {
  id: string;
  clientName: string;
  clientPhoto?: string;
  services: Service[];
  products: Product[];
  subtotal: number;
  discounts: number;
  tax: number;
  total: number;
}

interface CheckoutScreenProps {
  ticket: CheckoutTicket;
  onClose: () => void;
  onComplete: (paymentData: any) => void;
}

const TIP_PERCENTAGES = [15, 18, 20, 25];

export function CheckoutScreen({ ticket, onClose, onComplete }: CheckoutScreenProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [tipAmount, setTipAmount] = useState(0);
  const [tipPercentage, setTipPercentage] = useState<number | null>(null);
  const [customTip, setCustomTip] = useState('');
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  const totalWithTip = ticket.total + tipAmount;

  const handleTipPercentage = (percentage: number) => {
    setTipPercentage(percentage);
    setTipAmount(ticket.total * (percentage / 100));
    setCustomTip('');
  };

  const handleCustomTip = (value: string) => {
    setCustomTip(value);
    setTipPercentage(null);
    const amount = parseFloat(value) || 0;
    setTipAmount(amount);
  };

  const handlePayment = () => {
    if (!selectedPaymentMethod) return;

    const paymentData = {
      ticketId: ticket.id,
      paymentMethod: selectedPaymentMethod,
      subtotal: ticket.subtotal,
      discounts: ticket.discounts,
      tax: ticket.tax,
      tip: tipAmount,
      total: totalWithTip,
      timestamp: new Date(),
    };

    onComplete(paymentData);
  };

  const paymentMethods = [
    { id: 'card', label: 'Card', icon: CreditCard, color: 'from-blue-500 to-blue-600' },
    { id: 'cash', label: 'Cash', icon: DollarSign, color: 'from-green-500 to-green-600' },
    { id: 'digital', label: 'Digital Wallet', icon: Smartphone, color: 'from-purple-500 to-purple-600' },
    { id: 'gift', label: 'Gift Card', icon: Gift, color: 'from-pink-500 to-pink-600' },
    { id: 'split', label: 'Split Payment', icon: Wallet, color: 'from-orange-500 to-orange-600' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full h-[90vh] overflow-hidden flex">
        {/* Left Panel - Ticket Summary */}
        <div className="w-[60%] border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {ticket.clientPhoto ? (
                <img src={ticket.clientPhoto} alt={ticket.clientName} className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold">
                  {ticket.clientName.charAt(0)}
                </div>
              )}
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{ticket.clientName}</h2>
                <p className="text-sm text-gray-500">Ticket #{ticket.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Services */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Services Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Services</h3>
                  <button className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                    + Add Service
                  </button>
                </div>
                <div className="space-y-2">
                  {ticket.services.map((service) => (
                    <div key={service.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{service.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {service.staffName} • {service.duration} min
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          ${service.price.toFixed(2)}
                        </p>
                        {service.discount && (
                          <p className="text-xs text-green-600">-${service.discount.toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Products Section */}
              {ticket.products.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">Products</h3>
                    <button className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                      + Add Product
                    </button>
                  </div>
                  <div className="space-y-2">
                    {ticket.products.map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            ${product.unitPrice.toFixed(2)} × {product.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          ${product.total.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pricing Breakdown */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">${ticket.subtotal.toFixed(2)}</span>
                </div>
                {ticket.discounts > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Discounts</span>
                    <span className="font-medium text-green-600">-${ticket.discounts.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium text-gray-900">${ticket.tax.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-base font-semibold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-gray-900">${ticket.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Discount Button */}
              <button
                onClick={() => setShowDiscountModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all text-gray-600 hover:text-orange-600"
              >
                <Tag className="w-4 h-4" />
                <span className="text-sm font-medium">Apply Discount</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - Payment */}
        <div className="w-[40%] flex flex-col bg-gray-50">
          {/* Payment Methods */}
          <div className="p-6 border-b border-gray-200 bg-white">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment Method</h3>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                    className={`
                      flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
                      ${selectedPaymentMethod === method.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${method.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-900">{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tip Section */}
          <div className="p-6 border-b border-gray-200 bg-white">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Add Tip</h3>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {TIP_PERCENTAGES.map((percentage) => (
                <button
                  key={percentage}
                  onClick={() => handleTipPercentage(percentage)}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-all
                    ${tipPercentage === percentage
                      ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {percentage}%
                </button>
              ))}
            </div>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={customTip}
                onChange={(e) => handleCustomTip(e.target.value)}
                placeholder="Custom tip amount"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            {tipAmount > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                Tip: <span className="font-semibold text-gray-900">${tipAmount.toFixed(2)}</span>
              </p>
            )}
          </div>

          {/* Payment Summary */}
          <div className="flex-1 p-6 bg-white">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">${ticket.total.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Tip</span>
                <span className="font-medium text-gray-900">${tipAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <span className="text-lg font-semibold text-gray-900">Total to Charge</span>
                <span className="text-2xl font-bold text-gray-900">${totalWithTip.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-gray-200 bg-white space-y-2">
            <button
              onClick={handlePayment}
              disabled={!selectedPaymentMethod}
              className={`
                w-full py-4 rounded-lg font-semibold text-lg transition-all
                ${selectedPaymentMethod
                  ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {selectedPaymentMethod ? `Charge $${totalWithTip.toFixed(2)}` : 'Select Payment Method'}
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Save for Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
