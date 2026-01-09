import { useState, useEffect, useCallback } from 'react';
import { X, CreditCard, DollarSign, Gift, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Ticket } from '../../types/Ticket';
import { CheckoutPaymentMethod, TipDistribution, TIP_PERCENTAGES, CHECKOUT_STEPS } from '../../types/checkout';
import { getTaxRateFromConfig } from '../../constants/checkoutConfig';
import { ServiceSummary } from './ServiceSummary';
import GiftCardRedeemModal, { AppliedGiftCard } from './modals/GiftCardRedeemModal';
import { giftCardDB } from '../../db/giftCardOperations';
import { useAppSelector } from '../../store/hooks';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket;
  onComplete: (payment: {
    methods: CheckoutPaymentMethod[];
    tip: number;
    tipDistribution?: TipDistribution[];
  }) => void;
  staffMembers?: { id: string; name: string; serviceTotal?: number }[];
}

// Step Indicator Component
function StepIndicator({ currentStep, isFullyPaid }: { currentStep: number; isFullyPaid: boolean }) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 py-4">
      {CHECKOUT_STEPS.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = step.id < currentStep || (step.id === 3 && isFullyPaid);
        const isLast = index === CHECKOUT_STEPS.length - 1;

        return (
          <div key={step.id} className="flex items-center gap-2 sm:gap-4">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`
                  h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center
                  transition-all duration-200 text-sm font-semibold
                  ${isCompleted
                    ? 'bg-green-500 text-white'
                    : isActive
                      ? 'bg-blue-500 text-white ring-4 ring-blue-200'
                      : 'bg-gray-200 text-gray-500'
                  }
                `}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  step.id
                )}
              </div>
              <div className="text-center">
                <p className={`text-xs sm:text-sm font-medium ${isActive || isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                  {step.label}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-400 hidden sm:block">
                  {step.sublabel}
                </p>
              </div>
            </div>
            {!isLast && (
              <div
                className={`h-0.5 w-6 sm:w-12 mt-[-20px] sm:mt-[-24px] ${
                  step.id < currentStep ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function CheckoutModal({
  isOpen,
  onClose,
  ticket,
  onComplete,
  staffMembers = [],
}: CheckoutModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [tipPercentage, setTipPercentage] = useState<number | null>(20);
  const [customTip, setCustomTip] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<CheckoutPaymentMethod[]>([]);
  const [currentMethod, setCurrentMethod] = useState<'card' | 'cash' | 'gift_card' | 'custom' | null>(null);
  const [cashTendered, setCashTendered] = useState('');
  const [customPaymentName, setCustomPaymentName] = useState('');
  const [showTipDistribution, setShowTipDistribution] = useState(false);
  const [tipDistribution, setTipDistribution] = useState<TipDistribution[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showGiftCardModal, setShowGiftCardModal] = useState(false);
  const [appliedGiftCards, setAppliedGiftCards] = useState<AppliedGiftCard[]>([]);

  // Get auth context for gift card redemption
  const storeId = useAppSelector((state) => state.auth.store?.storeId || state.auth.storeId);
  const userId = useAppSelector((state) => state.auth.member?.memberId || state.auth.user?.id);
  const deviceId = useAppSelector((state) => state.auth.device?.id) || 'web-device';

  // Get dynamic tax rate from system config
  const taxRate = getTaxRateFromConfig();

  // Calculate totals
  const servicesTotal = ticket.services.reduce((sum, s) => sum + s.price, 0);
  const productsTotal = ticket.products.reduce((sum, p) => sum + p.total, 0);
  const subtotal = servicesTotal + productsTotal;
  const discountAmount = ticket.discount || 0;
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * taxRate;

  const tipAmount = tipPercentage
    ? (afterDiscount * tipPercentage) / 100
    : parseFloat(customTip) || 0;

  const total = afterDiscount + taxAmount;
  const totalWithTip = total + tipAmount;
  const amountPaid = paymentMethods.reduce((sum, m) => sum + m.amount, 0);
  const remaining = totalWithTip - amountPaid;
  const isFullyPaid = remaining <= 0.01 && amountPaid > 0;

  const totalCashTendered = paymentMethods
    .filter(m => m.type === 'cash')
    .reduce((sum, m) => sum + (m.tendered || m.amount), 0);
  const totalCashApplied = paymentMethods
    .filter(m => m.type === 'cash')
    .reduce((sum, m) => sum + m.amount, 0);
  const totalChangeToReturn = Math.max(0, totalCashTendered - totalCashApplied);

  // Auto-advance to step 3 when fully paid
  useEffect(() => {
    if (isFullyPaid && currentStep === 2) {
      setCurrentStep(3);
    }
  }, [isFullyPaid, currentStep]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setTipPercentage(20);
      setCustomTip('');
      setPaymentMethods([]);
      setCashTendered('');
      setCurrentMethod(null);
      setShowSuccess(false);
      setShowGiftCardModal(false);
      setAppliedGiftCards([]);
    }
  }, [isOpen]);

  // Gift card handlers
  const handleApplyGiftCard = useCallback((giftCard: AppliedGiftCard) => {
    // Add to applied gift cards list
    setAppliedGiftCards(prev => [...prev, giftCard]);

    // Add as a payment method
    const newPayment: CheckoutPaymentMethod = {
      type: 'gift_card',
      amount: giftCard.amountUsed,
      customName: `Gift Card (${giftCard.code})`,
    };
    setPaymentMethods(prev => [...prev, newPayment]);
  }, []);

  const handleRemoveGiftCard = useCallback((code: string) => {
    // Remove from applied gift cards
    const removedCard = appliedGiftCards.find(gc => gc.code === code);
    setAppliedGiftCards(prev => prev.filter(gc => gc.code !== code));

    // Remove from payment methods
    if (removedCard) {
      setPaymentMethods(prev =>
        prev.filter(p => !(p.type === 'gift_card' && p.customName?.includes(code)))
      );
    }
  }, [appliedGiftCards]);

  const handleSelectTipPercentage = (percentage: number) => {
    setTipPercentage(percentage);
    setCustomTip('');
  };

  const handleCustomTipChange = (value: string) => {
    setCustomTip(value);
    setTipPercentage(null);
  };

  const handleSelectMethod = (methodId: 'card' | 'cash' | 'gift_card' | 'custom') => {
    setCurrentMethod(methodId);
    setCurrentStep(2);
  };

  const handleAddPayment = (amount?: number) => {
    if (!currentMethod) return;

    let paymentAmount = amount;
    let tenderedAmount = amount;

    if (!paymentAmount) {
      if (currentMethod === 'cash' && cashTendered) {
        tenderedAmount = parseFloat(cashTendered);
        paymentAmount = Math.min(tenderedAmount, remaining);
      } else {
        paymentAmount = remaining;
      }
    }

    if (paymentAmount && paymentAmount > 0) {
      const newPayment: CheckoutPaymentMethod = {
        type: currentMethod,
        amount: Math.min(paymentAmount, remaining),
      };

      if (currentMethod === 'cash' && tenderedAmount) {
        newPayment.tendered = tenderedAmount;
      }

      if (currentMethod === 'custom' && customPaymentName.trim()) {
        newPayment.customName = customPaymentName.trim();
      }

      setPaymentMethods([...paymentMethods, newPayment]);
      setCashTendered('');
      setCustomPaymentName('');
      setCurrentMethod(null);
    }
  };

  const handleRemovePayment = (index: number) => {
    setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
    if (currentStep === 3) {
      setCurrentStep(2);
    }
  };

  const handleAutoDistributeTip = () => {
    if (tipAmount <= 0 || staffMembers.length === 0) return;

    const totalServiceRevenue = staffMembers.reduce((sum, s) => sum + (s.serviceTotal || 0), 0);

    if (totalServiceRevenue === 0) {
      handleEqualSplitTip();
      return;
    }

    const distribution = staffMembers.map(staff => ({
      staffId: staff.id,
      staffName: staff.name,
      amount: (tipAmount * (staff.serviceTotal || 0)) / totalServiceRevenue
    }));

    setTipDistribution(distribution);
    setShowTipDistribution(true);
  };

  const handleEqualSplitTip = () => {
    if (tipAmount <= 0 || staffMembers.length === 0) return;

    const amountPerStaff = tipAmount / staffMembers.length;
    const distribution = staffMembers.map(staff => ({
      staffId: staff.id,
      staffName: staff.name,
      amount: amountPerStaff
    }));

    setTipDistribution(distribution);
    setShowTipDistribution(true);
  };

  const handleComplete = async () => {
    if (isFullyPaid) {
      setShowSuccess(true);

      // Redeem all applied gift cards in the database
      try {
        if (storeId && userId) {
          for (const giftCard of appliedGiftCards) {
            await giftCardDB.redeemGiftCard(
              {
                code: giftCard.code,
                amount: giftCard.amountUsed,
                ticketId: ticket.id,
                staffId: userId,
              },
              storeId,
              userId,
              deviceId
            );
          }
        } else {
          console.warn('Missing storeId or userId for gift card redemption');
        }
      } catch (error) {
        console.error('Error redeeming gift cards:', error);
        // Continue with checkout even if redemption logging fails
        // The payment has already been recorded
      }

      setTimeout(() => {
        onComplete({
          methods: paymentMethods,
          tip: tipAmount,
          tipDistribution: showTipDistribution && tipDistribution.length > 0 ? tipDistribution : undefined,
        });
      }, 800);
    }
  };

  const goToNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setCurrentMethod(null);
    }
  };

  const PAYMENT_METHODS = [
    { id: 'card' as const, label: 'Credit Card', icon: CreditCard, color: 'blue' as const },
    { id: 'cash' as const, label: 'Cash', icon: DollarSign, color: 'green' as const },
    { id: 'gift_card' as const, label: 'Gift Card', icon: Gift, color: 'purple' as const },
    { id: 'custom' as const, label: 'Other', icon: DollarSign, color: 'gray' as const },
  ];

  const quickCashAmounts = [
    Math.ceil(remaining),
    20,
    50,
    100,
  ].filter((amount, index, arr) => arr.indexOf(amount) === index && amount >= remaining).slice(0, 4);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6 pb-0">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Checkout</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} isFullyPaid={isFullyPaid} />

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4">
          {/* Step 1: Tip Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Order Summary */}
              <ServiceSummary
                ticket={ticket}
                tipAmount={tipAmount}
                discountAmount={discountAmount}
                showTip={true}
              />

              {/* Tip Selection */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Add Tip</h3>

                {/* Tip Percentage Buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {TIP_PERCENTAGES.map((percentage) => (
                    <button
                      key={percentage}
                      onClick={() => handleSelectTipPercentage(percentage)}
                      className={`
                        py-3 px-2 rounded-xl font-semibold transition-all
                        ${tipPercentage === percentage
                          ? 'bg-green-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }
                      `}
                    >
                      {percentage}%
                    </button>
                  ))}
                </div>

                {/* No Tip Button */}
                <button
                  onClick={() => { setTipPercentage(null); setCustomTip('0'); }}
                  className={`
                    w-full py-2 rounded-lg font-medium transition-all
                    ${tipPercentage === null && customTip === '0'
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  No Tip
                </button>

                {/* Custom Tip Input */}
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
                  <input
                    type="number"
                    value={customTip}
                    onChange={(e) => handleCustomTipChange(e.target.value)}
                    placeholder="Custom tip amount"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* Tip Distribution (if staff members provided) */}
                {staffMembers.length > 1 && tipAmount > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Distribute tip?</span>
                      <div className="flex gap-2">
                        <button
                          onClick={handleAutoDistributeTip}
                          className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                        >
                          By Revenue
                        </button>
                        <button
                          onClick={handleEqualSplitTip}
                          className="text-xs px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          Equal Split
                        </button>
                      </div>
                    </div>

                    {showTipDistribution && tipDistribution.length > 0 && (
                      <div className="space-y-2">
                        {tipDistribution.map((dist) => (
                          <div key={dist.staffId} className="flex justify-between text-sm">
                            <span className="text-gray-600">{dist.staffName}</span>
                            <span className="font-medium">${dist.amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Payment Method */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Total Display */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Total to Pay</p>
                <p className="text-3xl font-bold text-gray-900">${totalWithTip.toFixed(2)}</p>
                {tipAmount > 0 && (
                  <p className="text-sm text-green-600 mt-1">Includes ${tipAmount.toFixed(2)} tip</p>
                )}
              </div>

              {/* Payment Methods */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Select Payment Method</h3>
                <div className="grid grid-cols-2 gap-3">
                  {PAYMENT_METHODS.map((method) => {
                    const Icon = method.icon;
                    const isSelected = currentMethod === method.id;
                    const colorClasses = {
                      blue: 'border-blue-500 bg-blue-50 text-blue-600',
                      green: 'border-green-500 bg-green-50 text-green-600',
                      purple: 'border-purple-500 bg-purple-50 text-purple-600',
                      gray: 'border-gray-500 bg-gray-50 text-gray-600',
                    };

                    return (
                      <button
                        key={method.id}
                        onClick={() => handleSelectMethod(method.id)}
                        className={`
                          p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                          ${isSelected
                            ? colorClasses[method.color]
                            : 'border-gray-200 hover:border-gray-300'
                          }
                        `}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="text-sm font-medium">{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment Input based on method */}
              {currentMethod === 'cash' && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Cash Payment</h4>

                  {/* Quick amounts */}
                  <div className="grid grid-cols-4 gap-2">
                    {quickCashAmounts.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setCashTendered(amount.toString())}
                        className="py-2 px-3 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200"
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
                    <input
                      type="number"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      placeholder="Amount tendered"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {parseFloat(cashTendered) > remaining && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <p className="text-sm text-green-700">Change Due</p>
                      <p className="text-2xl font-bold text-green-900">
                        ${(parseFloat(cashTendered) - remaining).toFixed(2)}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => handleAddPayment()}
                    disabled={!cashTendered || parseFloat(cashTendered) < remaining}
                    className="w-full py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply Cash Payment
                  </button>
                </div>
              )}

              {currentMethod === 'card' && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Card Payment</h4>
                  <p className="text-sm text-gray-500">Process card payment through terminal</p>
                  <button
                    onClick={() => handleAddPayment(remaining)}
                    className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600"
                  >
                    Pay ${remaining.toFixed(2)} with Card
                  </button>
                </div>
              )}

              {currentMethod === 'gift_card' && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Gift Card</h4>

                  {/* Show applied gift cards */}
                  {appliedGiftCards.length > 0 && (
                    <div className="space-y-2">
                      {appliedGiftCards.map((gc) => (
                        <div
                          key={gc.code}
                          className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg p-3"
                        >
                          <div className="flex items-center gap-2">
                            <Gift className="w-4 h-4 text-purple-600" />
                            <div>
                              <p className="font-mono text-sm font-medium text-purple-900">
                                {gc.code}
                              </p>
                              <p className="text-xs text-purple-600">
                                -${gc.amountUsed.toFixed(2)} applied
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveGiftCard(gc.code)}
                            className="p-1 text-purple-400 hover:text-purple-600 hover:bg-purple-100 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => setShowGiftCardModal(true)}
                    disabled={remaining <= 0}
                    className="w-full py-3 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Gift className="w-5 h-5" />
                    {appliedGiftCards.length > 0 ? 'Add Another Gift Card' : 'Enter Gift Card Code'}
                  </button>
                </div>
              )}

              {currentMethod === 'custom' && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Other Payment</h4>
                  <input
                    type="text"
                    value={customPaymentName}
                    onChange={(e) => setCustomPaymentName(e.target.value)}
                    placeholder="Payment type (e.g., Venmo, Check)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500"
                  />
                  <button
                    onClick={() => handleAddPayment(remaining)}
                    className="w-full py-3 bg-gray-700 text-white rounded-xl font-semibold hover:bg-gray-800"
                  >
                    Pay ${remaining.toFixed(2)}
                  </button>
                </div>
              )}

              {/* Applied Payments */}
              {paymentMethods.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700">Applied Payments</h4>
                  {paymentMethods.map((payment, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        {payment.type === 'card' && <CreditCard className="w-5 h-5 text-blue-500" />}
                        {payment.type === 'cash' && <DollarSign className="w-5 h-5 text-green-500" />}
                        {payment.type === 'gift_card' && <Gift className="w-5 h-5 text-purple-500" />}
                        {payment.type === 'custom' && <DollarSign className="w-5 h-5 text-gray-500" />}
                        <span className="font-medium capitalize">
                          {payment.customName || payment.type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">${payment.amount.toFixed(2)}</span>
                        <button
                          onClick={() => handleRemovePayment(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Remaining Balance */}
              {!isFullyPaid && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-yellow-800">Remaining Balance</span>
                    <span className="text-xl font-bold text-yellow-900">${remaining.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Change to Return (for cash) */}
              {totalChangeToReturn > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-green-800">Change to Return</span>
                    <span className="text-xl font-bold text-green-900">${totalChangeToReturn.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Complete */}
          {currentStep === 3 && (
            <div className="flex flex-col items-center justify-center py-8 space-y-6">
              <div className={`
                w-24 h-24 rounded-full flex items-center justify-center
                transition-all duration-500
                ${showSuccess
                  ? 'bg-green-500 scale-110'
                  : 'bg-green-100'
                }
              `}>
                <Check className={`w-12 h-12 ${showSuccess ? 'text-white' : 'text-green-500'}`} />
              </div>

              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {showSuccess ? 'Payment Complete!' : 'Ready to Complete'}
                </h3>
                <p className="text-gray-600">
                  Total Paid: <span className="font-semibold">${amountPaid.toFixed(2)}</span>
                </p>
                {tipAmount > 0 && (
                  <p className="text-green-600 text-sm mt-1">
                    Tip: ${tipAmount.toFixed(2)}
                  </p>
                )}
              </div>

              {/* Payment Summary */}
              <div className="w-full max-w-sm bg-gray-50 rounded-xl p-4 space-y-2">
                {paymentMethods.map((payment, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600 capitalize">
                      {payment.customName || payment.type.replace('_', ' ')}
                    </span>
                    <span className="font-medium">${payment.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {!showSuccess && (
                <button
                  onClick={handleComplete}
                  className="w-full max-w-sm py-4 bg-green-500 text-white rounded-xl font-semibold text-lg hover:bg-green-600 transition-all shadow-lg"
                >
                  Complete Checkout
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        {currentStep !== 3 && (
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={goToPrevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>

            {currentStep === 1 && (
              <button
                onClick={goToNextStep}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600"
              >
                Continue to Payment
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Gift Card Redeem Modal */}
      <GiftCardRedeemModal
        open={showGiftCardModal}
        onOpenChange={setShowGiftCardModal}
        remainingTotal={remaining}
        appliedGiftCards={appliedGiftCards}
        onApplyGiftCard={handleApplyGiftCard}
        onRemoveGiftCard={handleRemoveGiftCard}
      />
    </div>
  );
}
