import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CreditCard,
  Banknote,
  Gift,
  X,
  Check,
  DollarSign,
  Printer,
  Loader2,
  AlertCircle,
  FileText,
  Zap,
} from "lucide-react";
import { paymentBridge } from "@/services/payment";
import GiftCardRedeemModal, { AppliedGiftCard } from "./modals/GiftCardRedeemModal";
import { giftCardDB } from "@/db/giftCardOperations";
import { useAppSelector } from "@/store/hooks";
import SendToPadButton from "./SendToPadButton";
import PadTransactionStatus from "./PadTransactionStatus";
import PadCheckoutOverlay from "./PadCheckoutOverlay";
import {
  selectActivePadTransaction,
  selectCustomerStarted,
} from "@/store/slices/padTransactionSlice";
import { selectUnresolvedPriceChanges } from "@/store/slices/uiTicketsSlice";

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

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  total: number;
  subtotal?: number;
  tax?: number;
  discount?: number;
  onComplete: (payment: {
    methods: PaymentMethod[];
    tip: number;
    tipDistribution?: TipDistribution[];
    padTransactionId?: string;
  }) => void;
  staffMembers?: { id: string; name: string; serviceTotal?: number }[];
  ticketId?: string; // Bug #8 fix: Pass actual ticket ID for transaction linking
  clientId?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  items?: TicketItem[];
  onShowReceipt?: () => void; // Callback to show receipt preview
  onSentToPad?: (transactionId: string) => void;
  /** Callback to open PriceResolutionModal when there are unresolved price changes */
  onOpenPriceResolution?: () => void;
}

const TIP_PERCENTAGES = [15, 18, 20, 25];

const STEPS = [
  { id: 1, label: "Add Tip", sublabel: "optional" },
  { id: 2, label: "Payment", sublabel: "required" },
  { id: 3, label: "Complete", sublabel: "final" },
];

function StepIndicator({ currentStep, isFullyPaid }: { currentStep: number; isFullyPaid: boolean }) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 py-4" data-testid="stepper-indicator">
      {STEPS.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = step.id < currentStep || (step.id === 3 && isFullyPaid);
        const isLast = index === STEPS.length - 1;

        return (
          <div key={step.id} className="flex items-center gap-2 sm:gap-4">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`
                  h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center
                  transition-all duration-200 text-sm font-semibold
                  ${isCompleted 
                    ? "bg-primary text-primary-foreground" 
                    : isActive 
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20" 
                      : "bg-muted text-muted-foreground"
                  }
                `}
                data-testid={`step-circle-${step.id}`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  step.id
                )}
              </div>
              <div className="text-center">
                <p className={`text-xs sm:text-sm font-medium ${isActive || isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.label}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                  {step.sublabel}
                </p>
              </div>
            </div>
            {!isLast && (
              <div 
                className={`h-0.5 w-6 sm:w-12 mt-[-20px] sm:mt-[-24px] ${
                  step.id < currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function PaymentModal({
  open,
  onClose,
  total,
  subtotal,
  tax = 0,
  discount = 0,
  onComplete,
  staffMembers = [],
  ticketId,
  clientId,
  clientName,
  clientEmail,
  clientPhone,
  items = [],
  onShowReceipt,
  onSentToPad,
  onOpenPriceResolution,
}: PaymentModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [tipPercentage, setTipPercentage] = useState<number | null>(20);
  const [customTip, setCustomTip] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [currentMethod, setCurrentMethod] = useState<"card" | "cash" | "gift_card" | "custom" | null>(null);
  const [cashTendered, setCashTendered] = useState("");
  const [customPaymentName, setCustomPaymentName] = useState("");
  const [showTipDistribution, setShowTipDistribution] = useState(false);
  const [tipDistribution, setTipDistribution] = useState<TipDistribution[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showGiftCardModal, setShowGiftCardModal] = useState(false);
  const [appliedGiftCards, setAppliedGiftCards] = useState<AppliedGiftCard[]>([]);
  const [sentToPadTransactionId, setSentToPadTransactionId] = useState<string | null>(null);

  // Get auth context for gift card redemption
  const storeId = useAppSelector((state) => state.auth.store?.storeId || state.auth.storeId);

  // Check for unresolved price changes - payments should be blocked until resolved
  const unresolvedPriceChanges = useAppSelector(
    ticketId ? selectUnresolvedPriceChanges(ticketId) : () => []
  );
  const hasUnresolvedPriceChanges = unresolvedPriceChanges.length > 0;

  // Pad transaction state for overlay
  const activePadTransaction = useAppSelector(selectActivePadTransaction);
  const customerStarted = useAppSelector(selectCustomerStarted);
  const showPadOverlay = activePadTransaction &&
    activePadTransaction.ticketId === ticketId &&
    customerStarted &&
    !['complete', 'failed', 'cancelled'].includes(activePadTransaction.status);
  const userId = useAppSelector((state) => state.auth.member?.memberId || state.auth.user?.id);
  const deviceId = useAppSelector((state) => state.auth.device?.id) || 'web-device';

  const tipAmount = tipPercentage
    ? (total * tipPercentage) / 100
    : parseFloat(customTip) || 0;

  const totalWithTip = total + tipAmount;
  const amountPaid = paymentMethods.reduce((sum, m) => sum + m.amount, 0);
  const remaining = totalWithTip - amountPaid;
  const isFullyPaid = remaining <= 0.01 && amountPaid > 0;

  const totalCashTendered = paymentMethods
    .filter(m => m.type === "cash")
    .reduce((sum, m) => sum + (m.tendered || m.amount), 0);
  const totalCashApplied = paymentMethods
    .filter(m => m.type === "cash")
    .reduce((sum, m) => sum + m.amount, 0);
  const totalChangeToReturn = Math.max(0, totalCashTendered - totalCashApplied);

  // Auto-advance to step 3 when fully paid and trigger completion
  useEffect(() => {
    if (isFullyPaid && currentStep === 2) {
      // Show success animation briefly, then transition to step 3
      setShowSuccess(true);

      // Redeem gift cards in the database
      const redeemGiftCards = async () => {
        if (storeId && userId && appliedGiftCards.length > 0 && ticketId) {
          for (const giftCard of appliedGiftCards) {
            try {
              await giftCardDB.redeemGiftCard(
                {
                  code: giftCard.code,
                  amount: giftCard.amountUsed,
                  ticketId: ticketId,
                  staffId: userId,
                },
                storeId,
                userId,
                deviceId
              );
            } catch (error) {
              console.error('Error redeeming gift card:', error);
            }
          }
        }
      };

      redeemGiftCards();

      // Transition to step 3 after showing success animation
      // User will click "Done" to complete and close
      setTimeout(() => {
        onComplete({
          methods: paymentMethods,
          tip: tipAmount,
          tipDistribution: showTipDistribution && tipDistribution.length > 0 ? tipDistribution : undefined,
          padTransactionId: sentToPadTransactionId || undefined,
        });
      }, 800);
    }
  }, [isFullyPaid, currentStep, paymentMethods, tipAmount, showTipDistribution, tipDistribution, onComplete, appliedGiftCards, storeId, userId, deviceId, ticketId, sentToPadTransactionId]);

  const handleQuickCash = (amount: number) => {
    setCashTendered(amount.toString());
  };

  const handleAddPayment = async (amount?: number) => {
    if (!currentMethod) return;

    let paymentAmount = amount;
    let tenderedAmount = amount;

    if (!paymentAmount) {
      if (currentMethod === "cash" && cashTendered) {
        tenderedAmount = parseFloat(cashTendered);
        paymentAmount = Math.min(tenderedAmount, remaining);
      }
    }

    if (paymentAmount && paymentAmount > 0) {
      // Clear any previous error
      setPaymentError(null);

      // For card and gift card, process through paymentBridge
      if (currentMethod === "card" || currentMethod === "gift_card") {
        setIsProcessing(true);

        try {
          const result = await paymentBridge.processPayment({
            amount: Math.min(paymentAmount, remaining),
            method: currentMethod,
            ticketId: ticketId || "unknown", // Bug #8 fix: Use actual ticket ID
          });

          if (!result.success) {
            setPaymentError(result.error || "Payment failed. Please try again.");
            setIsProcessing(false);
            return;
          }

          console.log("✅ Payment processed:", result.transactionId);
        } catch (error) {
          setPaymentError("Payment processing failed. Please try again.");
          setIsProcessing(false);
          return;
        }

        setIsProcessing(false);
      }

      // Add the payment method to the list
      const newPayment: PaymentMethod = {
        type: currentMethod,
        amount: Math.min(paymentAmount, remaining),
      };

      if (currentMethod === "cash" && tenderedAmount) {
        newPayment.tendered = tenderedAmount;
      }

      if (currentMethod === "custom" && customPaymentName.trim()) {
        newPayment.customName = customPaymentName.trim();
      }

      setPaymentMethods([...paymentMethods, newPayment]);
      setCashTendered("");
      setCustomPaymentName("");
      setCurrentMethod(null);
    }
  };

  const handleComplete = () => {
    if (isFullyPaid) {
      setShowSuccess(true);

      setTimeout(() => {
        onComplete({
          methods: paymentMethods,
          tip: tipAmount,
          tipDistribution: showTipDistribution && tipDistribution.length > 0 ? tipDistribution : undefined,
          padTransactionId: sentToPadTransactionId || undefined,
        });
        setCurrentStep(1);
        setPaymentMethods([]);
        setCashTendered("");
        setTipPercentage(20);
        setCustomTip("");
        setShowTipDistribution(false);
        setTipDistribution([]);
        setShowSuccess(false);
        setCurrentMethod(null);
        setSentToPadTransactionId(null);
      }, 800);
    }
  };

  const handleSelectTipPercentage = (percentage: number) => {
    setTipPercentage(percentage);
    setCustomTip("");
  };

  const handleCustomTipChange = (value: string) => {
    setCustomTip(value);
    setTipPercentage(null);
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

  // Gift card handlers
  const handleApplyGiftCard = useCallback((giftCard: AppliedGiftCard) => {
    // Add to applied gift cards list
    setAppliedGiftCards(prev => [...prev, giftCard]);

    // Add as a payment method
    const newPayment: PaymentMethod = {
      type: 'gift_card',
      amount: giftCard.amountUsed,
      customName: `Gift Card (${giftCard.code})`,
    };
    setPaymentMethods(prev => [...prev, newPayment]);
    setShowGiftCardModal(false);
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

  const PAYMENT_METHODS = [
    { id: "card", label: "Credit Card", icon: CreditCard },
    { id: "cash", label: "Cash", icon: Banknote },
    { id: "gift_card", label: "Gift Card", icon: Gift },
    { id: "custom", label: "Other", icon: DollarSign },
  ];

  const handleSelectMethod = (methodId: "card" | "cash" | "gift_card" | "custom") => {
    setCurrentMethod(methodId);
    // Ensure we're on step 2 when selecting a payment method
    setCurrentStep(2);
  };

  const handleSentToPad = useCallback((transactionId: string) => {
    setSentToPadTransactionId(transactionId);
    onSentToPad?.(transactionId);
  }, [onSentToPad]);

  const effectiveSubtotal = subtotal ?? total;

  const quickCashAmounts = [
    Math.ceil(remaining),
    20,
    50,
    100,
  ].filter((amount, index, arr) => arr.indexOf(amount) === index && amount >= remaining);

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

  return (
    <>
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-lg sm:max-w-xl md:max-w-2xl flex flex-col p-0 z-[100]">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-0 flex-shrink-0">
          <DialogTitle className="text-lg sm:text-xl text-center">
            Checkout
          </DialogTitle>
        </DialogHeader>

        <StepIndicator currentStep={currentStep} isFullyPaid={isFullyPaid} />

        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-background/95 flex items-center justify-center z-50 rounded-lg">
            <div className="flex flex-col items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-1">Processing payment...</h3>
                <p className="text-sm text-muted-foreground">Please wait</p>
              </div>
            </div>
          </div>
        )}

        {/* Success overlay */}
        {showSuccess && (
          <div className="absolute inset-0 bg-background/95 flex items-center justify-center z-50 rounded-lg">
            <div className="flex flex-col items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center checkmark-animate">
                <Check className="h-10 w-10 text-primary checkmark-icon" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-1">All paid!</h3>
                <p className="text-sm text-muted-foreground">Preparing your receipt...</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="space-y-4">
            {currentStep === 1 && (
              <>
                <Card className="p-4 bg-muted/30">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Service total</span>
                    <span className="text-xl font-bold">${total.toFixed(2)}</span>
                  </div>
                </Card>

                <Separator />

                <div>
                  <label className="text-sm font-medium mb-3 block">Add a tip (optional)</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {TIP_PERCENTAGES.map((percentage) => (
                      <Button
                        key={percentage}
                        variant={tipPercentage === percentage ? "default" : "outline"}
                        onClick={() => handleSelectTipPercentage(percentage)}
                        className="h-12 sm:h-11 text-sm sm:text-base"
                        data-testid={`button-tip-${percentage}`}
                      >
                        <div className="flex flex-col items-center">
                          <span>{percentage}%</span>
                          <span className="text-xs opacity-70">${((total * percentage) / 100).toFixed(2)}</span>
                        </div>
                      </Button>
                    ))}
                    <Button
                      variant={tipPercentage === 0 ? "default" : "outline"}
                      onClick={() => {
                        setTipPercentage(0);
                        setCustomTip("0");
                      }}
                      className="h-12 sm:h-11 text-sm sm:text-base"
                      data-testid="button-no-tip"
                    >
                      No Tip
                    </Button>
                  </div>
                  <Input
                    type="number"
                    placeholder="Custom tip amount"
                    value={customTip}
                    onChange={(e) => handleCustomTipChange(e.target.value)}
                    className="mt-3 h-11"
                    data-testid="input-custom-tip"
                  />
                  
                  {staffMembers.length > 1 && tipAmount > 0 && (
                    <div className="mt-4 space-y-2">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAutoDistributeTip}
                          className="flex-1"
                          data-testid="button-auto-distribute-tip"
                        >
                          Auto-Distribute
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleEqualSplitTip}
                          className="flex-1"
                          data-testid="button-equal-split-tip"
                        >
                          Split Equally
                        </Button>
                      </div>
                      
                      {showTipDistribution && tipDistribution.length > 0 && (
                        <Card className="p-3 bg-green-500/5 border-green-500/20">
                          <div className="text-xs font-medium text-muted-foreground mb-2">Tip Distribution</div>
                          <div className="space-y-1">
                            {tipDistribution.map((dist, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span>{dist.staffName}</span>
                                <span className="font-semibold text-green-600 dark:text-green-500">
                                  ${dist.amount.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </Card>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                <Card className="p-4 bg-primary/5 border-primary/20">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Your total (with tip)</span>
                    <span className="text-2xl font-bold text-primary">${totalWithTip.toFixed(2)}</span>
                  </div>
                </Card>

                <Button
                  className="w-full h-12 text-base"
                  onClick={goToNextStep}
                  data-testid="button-continue-to-payment"
                >
                  Continue to Payment
                </Button>
              </>
            )}

            {currentStep === 2 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToPrevStep}
                  className="gap-2 -ml-2"
                  data-testid="button-back-to-tip"
                >
                  ← Back to tip
                </Button>

                {/* Payment error display */}
                {paymentError && (
                  <Card className="p-4 bg-red-500/10 border-red-500/30">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-600 dark:text-red-500">
                          {paymentError}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPaymentError(null)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Unresolved price changes warning - blocks payment */}
                {hasUnresolvedPriceChanges && (
                  <Card className="p-4 bg-amber-500/10 border-amber-500/30" data-testid="price-change-payment-warning">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <Zap className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                          {unresolvedPriceChanges.length} service{unresolvedPriceChanges.length > 1 ? 's have' : ' has'} price changes
                        </p>
                        <p className="text-xs text-amber-600/80 dark:text-amber-500/80 mt-1">
                          Resolve price changes before processing payment
                        </p>
                        {onOpenPriceResolution && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 text-amber-700 border-amber-300 hover:bg-amber-500/10 dark:text-amber-400 dark:border-amber-600"
                            onClick={() => {
                              onClose();
                              onOpenPriceResolution();
                            }}
                            data-testid="button-resolve-prices-from-payment"
                          >
                            <Zap className="h-4 w-4 mr-2" />
                            Review & Resolve Prices
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                )}

                {remaining > 0.01 ? (
                  <Card className="p-4 sm:p-6 bg-primary/10 border-primary/30">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Amount left to pay</p>
                      <p className="text-3xl sm:text-4xl font-bold text-primary" data-testid="text-amount-left">
                        ${remaining.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        of ${totalWithTip.toFixed(2)} total
                      </p>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-4 sm:p-6 bg-green-500/10 border-green-500/30">
                    <div className="flex items-center justify-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Check className="h-6 w-6 text-green-600 dark:text-green-500" />
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-green-600 dark:text-green-500">All paid!</p>
                        <p className="text-sm text-muted-foreground">Ready to complete</p>
                      </div>
                    </div>
                  </Card>
                )}

                <Separator />

                {paymentMethods.length > 0 && (
                  <>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Payments applied</label>
                      <div className="flex flex-wrap gap-2">
                        {paymentMethods.map((method, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="px-3 py-2 text-sm gap-2"
                            data-testid={`badge-payment-${index}`}
                          >
                            <span className="capitalize">
                              {method.customName || method.type.replace('_', ' ')}
                            </span>
                            <span className="font-bold">${method.amount.toFixed(2)}</span>
                            {method.type === "cash" && method.tendered && method.tendered > method.amount && (
                              <span className="text-xs opacity-70">
                                (Cash received: ${method.tendered.toFixed(2)})
                              </span>
                            )}
                            <button
                              className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                              onClick={() => setPaymentMethods(paymentMethods.filter((_, i) => i !== index))}
                              aria-label={`Remove ${method.customName || method.type.replace('_', ' ')} payment`}
                              data-testid={`button-remove-payment-${index}`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {totalChangeToReturn > 0 && (
                      <Card className="p-3 bg-amber-500/10 border-amber-500/20">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Change to give back</span>
                          <span className="text-lg font-bold text-amber-600 dark:text-amber-500">
                            ${totalChangeToReturn.toFixed(2)}
                          </span>
                        </div>
                      </Card>
                    )}

                    <Separator />
                  </>
                )}

                {remaining > 0.01 && (
                  <>
                    {/* Send to Pad option */}
                    {!sentToPadTransactionId && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground block">Customer-facing checkout</label>
                        <SendToPadButton
                          ticketId={ticketId || 'unknown'}
                          clientId={clientId}
                          clientName={clientName}
                          clientEmail={clientEmail}
                          clientPhone={clientPhone}
                          staffName={staffMembers[0]?.name}
                          items={items}
                          subtotal={effectiveSubtotal}
                          tax={tax}
                          discount={discount}
                          total={totalWithTip}
                          suggestedTips={TIP_PERCENTAGES}
                          onSent={handleSentToPad}
                        />
                        <Separator className="my-4" />
                      </div>
                    )}

                    {/* Show Pad transaction status when sent */}
                    {sentToPadTransactionId && ticketId && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground block">Mango Pad Status</label>
                        <PadTransactionStatus
                          ticketId={ticketId}
                          onRetry={() => setSentToPadTransactionId(null)}
                          onCancelled={() => setSentToPadTransactionId(null)}
                        />
                        <Separator className="my-4" />
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium mb-3 block">
                        {sentToPadTransactionId ? 'Or pay here' : 'Choose payment method'}
                      </label>
                      <TooltipProvider>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {PAYMENT_METHODS.map((method) => {
                            const Icon = method.icon;
                            const isSelected = currentMethod === method.id;
                            const isDisabled = hasUnresolvedPriceChanges;

                            const cardContent = (
                              <Card
                                key={method.id}
                                className={`p-4 sm:p-5 flex flex-col items-center justify-center gap-2 ${
                                  isDisabled
                                    ? "opacity-50 cursor-not-allowed"
                                    : "cursor-pointer hover-elevate active-elevate-2"
                                } ${isSelected && !isDisabled ? "ring-2 ring-primary bg-primary/5" : ""}`}
                                onClick={isDisabled ? undefined : () => handleSelectMethod(method.id as "card" | "cash" | "gift_card" | "custom")}
                                data-testid={`card-payment-method-${method.id}`}
                              >
                                <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center ${
                                  isSelected && !isDisabled ? "bg-primary text-primary-foreground" : "bg-primary/10"
                                }`}>
                                  <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${isSelected && !isDisabled ? "" : "text-primary"}`} />
                                </div>
                                <span className="text-xs sm:text-sm font-medium text-center">{method.label}</span>
                              </Card>
                            );

                            if (isDisabled) {
                              return (
                                <Tooltip key={method.id}>
                                  <TooltipTrigger asChild>
                                    {cardContent}
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Resolve price changes first</p>
                                  </TooltipContent>
                                </Tooltip>
                              );
                            }

                            return cardContent;
                          })}
                        </div>
                      </TooltipProvider>
                    </div>

                    {currentMethod && (
                      <>
                        <Separator />

                        {currentMethod === "card" && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="w-full">
                                  <Button
                                    className="w-full h-14 text-base"
                                    onClick={() => handleAddPayment(remaining)}
                                    disabled={isProcessing || hasUnresolvedPriceChanges}
                                    data-testid="button-apply-card"
                                  >
                                    {isProcessing ? (
                                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    ) : (
                                      <CreditCard className="h-5 w-5 mr-2" />
                                    )}
                                    {isProcessing ? "Processing..." : `Apply $${remaining.toFixed(2)}`}
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              {hasUnresolvedPriceChanges && (
                                <TooltipContent>
                                  <p>Resolve price changes first</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {currentMethod === "cash" && (
                          <div className="space-y-3">
                            <label className="text-sm font-medium block">Cash received</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {quickCashAmounts.slice(0, 4).map((amount) => (
                                <Button
                                  key={amount}
                                  variant={cashTendered === amount.toString() ? "default" : "outline"}
                                  className="h-12 sm:h-14 text-base"
                                  onClick={() => handleQuickCash(amount)}
                                  data-testid={`button-quick-cash-${amount}`}
                                >
                                  ${amount}
                                </Button>
                              ))}
                            </div>
                            <Input
                              type="number"
                              placeholder="Enter amount received"
                              value={cashTendered}
                              onChange={(e) => setCashTendered(e.target.value)}
                              className="text-lg h-12"
                              data-testid="input-cash-received"
                            />
                            {cashTendered && parseFloat(cashTendered) >= remaining && (
                              <Card className="p-3 bg-green-500/10 border-green-500/20">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium">Change to give back</span>
                                  <span className="text-lg font-bold text-green-600 dark:text-green-500" data-testid="text-change-preview">
                                    ${(parseFloat(cashTendered) - remaining).toFixed(2)}
                                  </span>
                                </div>
                              </Card>
                            )}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="w-full">
                                    <Button
                                      className="w-full h-14 text-base"
                                      onClick={() => handleAddPayment()}
                                      disabled={!cashTendered || parseFloat(cashTendered) <= 0 || hasUnresolvedPriceChanges}
                                      data-testid="button-apply-cash"
                                    >
                                      <Banknote className="h-5 w-5 mr-2" />
                                      Apply ${cashTendered ? Math.min(parseFloat(cashTendered), remaining).toFixed(2) : "0.00"}
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                {hasUnresolvedPriceChanges && (
                                  <TooltipContent>
                                    <p>Resolve price changes first</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        )}

                        {currentMethod === "gift_card" && (
                          <div className="space-y-3">
                            <label className="text-sm font-medium block">Gift Card Payment</label>

                            {/* Show applied gift cards */}
                            {appliedGiftCards.length > 0 && (
                              <div className="space-y-2">
                                {appliedGiftCards.map((gc) => (
                                  <Card
                                    key={gc.code}
                                    className="p-3 bg-purple-500/10 border-purple-500/20"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Gift className="h-4 w-4 text-purple-600" />
                                        <div>
                                          <p className="font-mono text-sm font-medium">
                                            {gc.code}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            -${gc.amountUsed.toFixed(2)} applied • ${gc.remainingBalance.toFixed(2)} remaining
                                          </p>
                                        </div>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => handleRemoveGiftCard(gc.code)}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </Card>
                                ))}
                              </div>
                            )}

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="w-full">
                                    <Button
                                      className="w-full h-14 text-base"
                                      onClick={() => setShowGiftCardModal(true)}
                                      disabled={remaining <= 0 || hasUnresolvedPriceChanges}
                                      data-testid="button-enter-gift-card"
                                    >
                                      <Gift className="h-5 w-5 mr-2" />
                                      {appliedGiftCards.length > 0 ? 'Add Another Gift Card' : 'Enter Gift Card Code'}
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                {hasUnresolvedPriceChanges && (
                                  <TooltipContent>
                                    <p>Resolve price changes first</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        )}

                        {currentMethod === "custom" && (
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium mb-2 block">Payment method name</label>
                              <Input
                                type="text"
                                placeholder="e.g., Venmo, Check, PayPal"
                                value={customPaymentName}
                                onChange={(e) => setCustomPaymentName(e.target.value)}
                                className="text-base h-12"
                                data-testid="input-custom-payment-name"
                              />
                            </div>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="w-full">
                                    <Button
                                      className="w-full h-14 text-base"
                                      onClick={() => handleAddPayment(remaining)}
                                      disabled={!customPaymentName.trim() || hasUnresolvedPriceChanges}
                                      data-testid="button-apply-custom"
                                    >
                                      <DollarSign className="h-5 w-5 mr-2" />
                                      Apply ${remaining.toFixed(2)} via {customPaymentName.trim() || "..."}
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                {hasUnresolvedPriceChanges && (
                                  <TooltipContent>
                                    <p>Resolve price changes first</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                {isFullyPaid && (
                  <Button
                    className="w-full h-14 text-base"
                    onClick={handleComplete}
                    data-testid="button-finish-print"
                  >
                    <Printer className="h-5 w-5 mr-2" />
                    Finish & Print Receipt
                  </Button>
                )}
              </>
            )}

            {currentStep === 3 && (
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="h-10 w-10 text-green-600 dark:text-green-500" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-1">Payment Complete!</h3>
                  <p className="text-muted-foreground">Transaction has been processed successfully.</p>
                </div>
                <Card className="w-full p-4 mt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Service total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tip</span>
                      <span className="text-green-600 dark:text-green-500">${tipAmount.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total paid</span>
                      <span>${totalWithTip.toFixed(2)}</span>
                    </div>
                  </div>
                </Card>

                {/* Receipt and Done buttons */}
                <div className="flex gap-3 mt-4 w-full">
                  {onShowReceipt && (
                    <Button
                      variant="outline"
                      className="flex-1 h-12"
                      onClick={() => {
                        onShowReceipt();
                      }}
                      data-testid="button-view-receipt"
                    >
                      <FileText className="h-5 w-5 mr-2" />
                      View Receipt
                    </Button>
                  )}
                  <Button
                    className="flex-1 h-12"
                    onClick={() => {
                      // Complete the payment and close
                      onComplete({
                        methods: paymentMethods,
                        tip: tipAmount,
                        tipDistribution: showTipDistribution && tipDistribution.length > 0 ? tipDistribution : undefined,
                      });
                    }}
                    data-testid="button-done"
                  >
                    <Check className="h-5 w-5 mr-2" />
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Gift Card Redeem Modal */}
    <GiftCardRedeemModal
      open={showGiftCardModal}
      onOpenChange={setShowGiftCardModal}
      remainingTotal={remaining}
      appliedGiftCards={appliedGiftCards}
      onApplyGiftCard={handleApplyGiftCard}
      onRemoveGiftCard={handleRemoveGiftCard}
    />

    {/* Pad Checkout Overlay - shows when customer is actively checking out on Mango Pad */}
    {showPadOverlay && ticketId && (
      <PadCheckoutOverlay
        ticketId={ticketId}
        onCancelled={() => setSentToPadTransactionId(null)}
      />
    )}
    </>
  );
}
