import { useState, useEffect } from 'react';
import { X, CreditCard, DollarSign, Percent, Receipt, Check } from 'lucide-react';
import { Ticket, Payment } from '../../types/Ticket';
import type { Client } from '../../types/client';
import { TAX_RATE } from '../../constants/checkoutConfig';
// import { POINTS_PER_DOLLAR_REDEMPTION } from '../../constants/loyaltyConfig';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createTransactionInSupabase } from '../../store/slices/transactionsSlice';
import { updateTicketInSupabase } from '../../store/slices/ticketsSlice';
import { earnLoyaltyPoints, redeemLoyaltyPoints } from '../../store/slices/clientsSlice';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { toast } from 'react-hot-toast';
import {
  roundToCents,
  addAmounts,
  subtractAmount,
  multiplyAmount,
  calculatePercentage
} from '../../utils/currency';
import RewardPointsRedemption from './RewardPointsRedemption';

interface QuickCheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket;
  client?: Client | null;  // Optional client for loyalty integration
  onComplete: (payments: Payment[], tip: number, discount: number, pointsEarned?: number) => void;
}

type PaymentMethod = 'cash' | 'card' | 'split';

export function QuickCheckout({ isOpen, onClose, ticket, client, onComplete }: QuickCheckoutProps) {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);
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

  // Loyalty points state
  const [redeemedPoints, setRedeemedPoints] = useState(0);
  const [pointsDiscount, setPointsDiscount] = useState(0);

  // Calculate totals with proper rounding to avoid floating-point errors
  const servicesTotal = roundToCents(ticket.services.reduce((sum, s) => sum + s.price, 0));
  const productsTotal = roundToCents(ticket.products.reduce((sum, p) => sum + p.total, 0));
  const subtotal = addAmounts(servicesTotal, productsTotal);
  const manualDiscount = discountAmount ? roundToCents(discountAmount) : calculatePercentage(subtotal, discountPercent);
  const discountValue = addAmounts(manualDiscount, pointsDiscount); // Include points redemption discount
  const afterDiscount = subtractAmount(subtotal, discountValue);
  const taxAmount = multiplyAmount(afterDiscount, TAX_RATE);
  const tipValue = tipAmount ? roundToCents(tipAmount) : calculatePercentage(afterDiscount, tipPercent);
  const grandTotal = addAmounts(afterDiscount, taxAmount, tipValue);

  // Handlers for loyalty points redemption
  const handleApplyPoints = (points: number, discount: number) => {
    setRedeemedPoints(points);
    setPointsDiscount(roundToCents(discount));
  };

  const handleRemovePointsRedemption = () => {
    setRedeemedPoints(0);
    setPointsDiscount(0);
  };

  // Create a client object for RewardPointsRedemption component if we have ticket client info
  // The RewardPointsRedemption uses a simpler Client type from ClientSelector
  const clientForLoyalty = client ? {
    id: client.id,
    firstName: client.firstName,
    lastName: client.lastName,
    phone: client.phone,
    rewardPoints: client.loyaltyInfo?.pointsBalance || 0,
    loyaltyStatus: (client.loyaltyInfo?.tier === 'platinum' || client.loyaltyInfo?.tier === 'vip'
      ? 'gold'
      : client.loyaltyInfo?.tier || 'bronze') as 'bronze' | 'silver' | 'gold',
  } : ticket.clientId ? {
    id: ticket.clientId,
    firstName: ticket.clientName?.split(' ')[0] || '',
    lastName: ticket.clientName?.split(' ').slice(1).join(' ') || '',
    phone: ticket.clientPhone || '',
    rewardPoints: 0,
    loyaltyStatus: 'bronze' as const,
  } : null;

  useEffect(() => {
    if (paymentMethod === 'split') {
      const half = roundToCents(grandTotal / 2);
      setCashAmount(half);
      setCardAmount(subtractAmount(grandTotal, half)); // Handle odd cent
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

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      const payments: Payment[] = [];
      const baseAmount = addAmounts(afterDiscount, taxAmount);

      if (paymentMethod === 'cash') {
        payments.push({
          id: `pay_${Date.now()}`,
          method: 'cash',
          amount: baseAmount,
          tip: tipValue,
          total: grandTotal,
          processedAt: new Date().toISOString()
        });
      } else if (paymentMethod === 'card') {
        payments.push({
          id: `pay_${Date.now()}`,
          method: 'card',
          amount: baseAmount,
          tip: tipValue,
          total: grandTotal,
          processedAt: new Date().toISOString(),
          cardLast4: cardLast4 || '****',
          transactionId: `txn_${Date.now()}`
        });
      } else {
        // Split payment
        const roundedCash = roundToCents(cashAmount);
        const roundedCard = roundToCents(cardAmount);
        if (roundedCash > 0) {
          payments.push({
            id: `pay_${Date.now()}_cash`,
            method: 'cash',
            amount: roundedCash,
            tip: 0,
            total: roundedCash,
            processedAt: new Date().toISOString()
          });
        }
        if (roundedCard > 0) {
          payments.push({
            id: `pay_${Date.now()}_card`,
            method: 'card',
            amount: roundedCard,
            tip: tipValue,
            total: addAmounts(roundedCard, tipValue),
            processedAt: new Date().toISOString(),
            cardLast4: cardLast4 || '****',
            transactionId: `txn_${Date.now()}`
          });
        }
      }

      // Validate user is authenticated
      if (!currentUser?.id) {
        throw new Error('User not authenticated. Please log in again.');
      }

      // 1. First update the ticket with payment info and mark as completed in Supabase
      await dispatch(updateTicketInSupabase({
        id: ticket.id,
        updates: {
          payments,
          tip: tipValue,
          discount: discountValue,
          status: 'completed',
          completedAt: new Date().toISOString(),
          subtotal: afterDiscount,
          tax: taxAmount,
          total: grandTotal
        }
      })).unwrap();

      // 2. Create transaction record for the completed ticket in Supabase
      // Determine primary payment method for transaction record
      const primaryPaymentMethod = paymentMethod === 'split' 
        ? (payments.length > 0 ? payments[0].method : 'card')
        : paymentMethod;
      
      // Build payment details object
      const paymentDetails: any = {
        payments: payments.map(p => ({
          method: p.method,
          amount: p.amount,
          tip: p.tip,
          total: p.total,
          processedAt: p.processedAt,
          cardLast4: p.cardLast4,
          transactionId: p.transactionId,
        })),
      };
      
      // Add split payment info if applicable
      if (paymentMethod === 'split') {
        paymentDetails.splits = payments.map(p => ({
          method: p.method,
          amount: p.amount,
          details: {
            cardLast4: p.cardLast4,
            transactionId: p.transactionId,
          },
        }));
      }
      
      // Add card details if card payment
      if (primaryPaymentMethod === 'card' && cardLast4) {
        paymentDetails.cardLast4 = cardLast4;
      }
      
      // Add cash details if cash payment
      if (primaryPaymentMethod === 'cash') {
        paymentDetails.amountTendered = grandTotal;
        paymentDetails.changeDue = 0; // Could calculate if needed
      }

      const transaction = await dispatch(createTransactionInSupabase({
        ticketId: ticket.id,
        ticketNumber: ticket.number || 0,
        clientId: ticket.clientId || client?.id,
        clientName: ticket.clientName || client?.firstName + ' ' + client?.lastName || 'Walk-in',
        subtotal: afterDiscount,
        tax: taxAmount,
        tip: tipValue,
        discount: discountValue,
        paymentMethod: primaryPaymentMethod as 'cash' | 'card' | 'debit-card' | 'credit-card' | 'gift-card' | 'split',
        paymentDetails,
        services: ticket.services.map(s => ({
          name: s.serviceName || s.name || 'Service',
          price: s.price,
          staffName: s.staffName,
        })),
        processedBy: currentUser.id,
      })).unwrap();

      // 3. Handle loyalty points (if client has loyalty)
      let pointsEarned = 0;

      if (client?.id) {
        try {
          // If points were redeemed, deduct them first
          if (redeemedPoints > 0) {
            await dispatch(redeemLoyaltyPoints({
              clientId: client.id,
              pointsToRedeem: redeemedPoints,
              transactionId: transaction.id,
            })).unwrap();
          }

          // Earn points on the transaction (based on subtotal before tax)
          const result = await dispatch(earnLoyaltyPoints({
            clientId: client.id,
            transactionId: transaction.id,
            ticketId: ticket.id,
            subtotal: afterDiscount, // Amount after discounts
            servicesTotal,
            productsTotal,
            taxAmount,
          })).unwrap();

          pointsEarned = result.result.pointsEarned;

          // Show loyalty notification
          if (pointsEarned > 0) {
            const tierMessage = result.result.tierChanged
              ? ` Tier upgraded to ${result.result.newTier}!`
              : '';
            toast.success(`+${pointsEarned} loyalty points earned!${tierMessage}`, {
              icon: '🎉',
              duration: 4000,
            });
          }
        } catch (loyaltyError) {
          // Loyalty errors should not block the transaction
          console.error('Loyalty update error:', loyaltyError);
        }
      }

      // 4. Success - notify parent and close
      toast.success('Payment processed and transaction created successfully');
      onComplete(payments, tipValue, discountValue, pointsEarned);
      setIsProcessing(false);

    } catch (error) {
      setIsProcessing(false);
      toast.error('Payment processing failed: ' + (error as Error).message);
      console.error('Checkout error:', error);
    }
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
              {manualDiscount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount</span>
                  <span>-${manualDiscount.toFixed(2)}</span>
                </div>
              )}
              {pointsDiscount > 0 && (
                <div className="flex justify-between text-sm text-purple-600">
                  <span>Points Redemption ({redeemedPoints} pts)</span>
                  <span>-${pointsDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax ({(TAX_RATE * 100).toFixed(0)}%)</span>
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

          {/* Loyalty Points Redemption */}
          {clientForLoyalty && clientForLoyalty.rewardPoints > 0 && (
            <RewardPointsRedemption
              client={clientForLoyalty}
              subtotal={subtotal}
              currentDiscount={manualDiscount}
              onApplyPoints={handleApplyPoints}
              onRemovePointsRedemption={handleRemovePointsRedemption}
              appliedPointsDiscount={pointsDiscount}
            />
          )}

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
                      const cash = roundToCents(parseFloat(e.target.value) || 0);
                      setCashAmount(cash);
                      setCardAmount(subtractAmount(grandTotal, cash));
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
                      const card = roundToCents(parseFloat(e.target.value) || 0);
                      setCardAmount(card);
                      setCashAmount(subtractAmount(grandTotal, card));
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
