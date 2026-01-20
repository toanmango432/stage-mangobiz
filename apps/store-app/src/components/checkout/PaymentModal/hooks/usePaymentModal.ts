/**
 * usePaymentModal Hook
 * Manages payment modal state and handlers
 */

import { useState, useEffect, useCallback } from "react";
import { useAppSelector } from "@/store/hooks";
import { paymentBridge } from "@/services/payment";
import { giftCardDB } from "@/db/giftCardOperations";
import {
  selectActivePadTransaction,
  selectCustomerStarted,
} from "@/store/slices/padTransactionSlice";
import { selectUnresolvedPriceChanges, type CheckoutTicketService } from "@/store/slices/uiTicketsSlice";
import type { AppliedGiftCard } from "../../modals/GiftCardRedeemModal";
import type {
  PaymentMethod,
  TipDistribution,
  PaymentMethodType,
  PaymentCompletionData,
  StaffMember,
} from "../types";

export interface UsePaymentModalProps {
  total: number;
  ticketId?: string;
  staffMembers?: StaffMember[];
  onComplete: (payment: PaymentCompletionData) => void;
  onSentToPad?: (transactionId: string) => void;
}

export interface UsePaymentModalReturn {
  // State
  currentStep: number;
  tipPercentage: number | null;
  customTip: string;
  paymentMethods: PaymentMethod[];
  currentMethod: PaymentMethodType | null;
  cashTendered: string;
  customPaymentName: string;
  showTipDistribution: boolean;
  tipDistribution: TipDistribution[];
  showSuccess: boolean;
  isProcessing: boolean;
  paymentError: string | null;
  showGiftCardModal: boolean;
  appliedGiftCards: AppliedGiftCard[];
  sentToPadTransactionId: string | null;

  // Computed values
  tipAmount: number;
  totalWithTip: number;
  amountPaid: number;
  remaining: number;
  isFullyPaid: boolean;
  totalChangeToReturn: number;
  quickCashAmounts: number[];
  hasUnresolvedPriceChanges: boolean;
  unresolvedPriceChanges: CheckoutTicketService[];
  showPadOverlay: boolean;

  // Selectors
  storeId: string | null | undefined;
  userId: string | null | undefined;
  deviceId: string;

  // Handlers
  handleQuickCash: (amount: number) => void;
  handleAddPayment: (amount?: number) => Promise<void>;
  handleComplete: () => void;
  handleSelectTipPercentage: (percentage: number) => void;
  handleCustomTipChange: (value: string) => void;
  handleAutoDistributeTip: () => void;
  handleEqualSplitTip: () => void;
  handleApplyGiftCard: (giftCard: AppliedGiftCard) => void;
  handleRemoveGiftCard: (code: string) => void;
  handleSelectMethod: (methodId: PaymentMethodType) => void;
  handleSentToPad: (transactionId: string) => void;
  goToNextStep: () => void;
  goToPrevStep: () => void;
  setPaymentError: (error: string | null) => void;
  setShowGiftCardModal: (show: boolean) => void;
  setCashTendered: (value: string) => void;
  setCustomPaymentName: (value: string) => void;
  setPaymentMethods: React.Dispatch<React.SetStateAction<PaymentMethod[]>>;
}

export function usePaymentModal({
  total,
  ticketId,
  staffMembers = [],
  onComplete,
  onSentToPad,
}: UsePaymentModalProps): UsePaymentModalReturn {
  const [currentStep, setCurrentStep] = useState(1);
  const [tipPercentage, setTipPercentage] = useState<number | null>(20);
  const [customTip, setCustomTip] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [currentMethod, setCurrentMethod] = useState<PaymentMethodType | null>(null);
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

  // Redux selectors
  const storeId = useAppSelector((state) => state.auth.store?.storeId || state.auth.storeId);
  const unresolvedPriceChanges = useAppSelector(
    ticketId ? selectUnresolvedPriceChanges(ticketId) : () => []
  );
  const hasUnresolvedPriceChanges = unresolvedPriceChanges.length > 0;
  const activePadTransaction = useAppSelector(selectActivePadTransaction);
  const customerStarted = useAppSelector(selectCustomerStarted);
  const showPadOverlay = !!(activePadTransaction &&
    activePadTransaction.ticketId === ticketId &&
    customerStarted &&
    !['complete', 'failed', 'cancelled'].includes(activePadTransaction.status));
  const userId = useAppSelector((state) => state.auth.member?.memberId || state.auth.user?.id);
  const deviceId = useAppSelector((state) => state.auth.device?.id) || 'web-device';

  // Computed values
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

  const quickCashAmounts = [
    Math.ceil(remaining),
    20,
    50,
    100,
  ].filter((amount, index, arr) => arr.indexOf(amount) === index && amount >= remaining);

  // Auto-advance to step 3 when fully paid and trigger completion
  useEffect(() => {
    if (isFullyPaid && currentStep === 2) {
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

      // Reduced from 800ms to 400ms for faster UI response
      setTimeout(() => {
        onComplete({
          methods: paymentMethods,
          tip: tipAmount,
          tipDistribution: showTipDistribution && tipDistribution.length > 0 ? tipDistribution : undefined,
          padTransactionId: sentToPadTransactionId || undefined,
        });
      }, 400);
    }
  }, [isFullyPaid, currentStep, paymentMethods, tipAmount, showTipDistribution, tipDistribution, onComplete, appliedGiftCards, storeId, userId, deviceId, ticketId, sentToPadTransactionId]);

  // Handlers
  const handleQuickCash = useCallback((amount: number) => {
    setCashTendered(amount.toString());
  }, []);

  const handleAddPayment = useCallback(async (amount?: number) => {
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
      setPaymentError(null);

      if (currentMethod === "card" || currentMethod === "gift_card") {
        setIsProcessing(true);

        try {
          const result = await paymentBridge.processPayment({
            amount: Math.min(paymentAmount, remaining),
            method: currentMethod,
            ticketId: ticketId || "unknown",
          });

          if (!result.success) {
            setPaymentError(result.error || "Payment failed. Please try again.");
            setIsProcessing(false);
            return;
          }

          console.log("Payment processed:", result.transactionId);
        } catch {
          setPaymentError("Payment processing failed. Please try again.");
          setIsProcessing(false);
          return;
        }

        setIsProcessing(false);
      }

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

      setPaymentMethods(prev => [...prev, newPayment]);
      setCashTendered("");
      setCustomPaymentName("");
      setCurrentMethod(null);
    }
  }, [currentMethod, cashTendered, remaining, ticketId, customPaymentName]);

  const handleComplete = useCallback(() => {
    if (isFullyPaid) {
      setShowSuccess(true);

      // Reduced from 800ms to 400ms for faster UI response
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
      }, 400);
    }
  }, [isFullyPaid, paymentMethods, tipAmount, showTipDistribution, tipDistribution, onComplete, sentToPadTransactionId]);

  const handleSelectTipPercentage = useCallback((percentage: number) => {
    setTipPercentage(percentage);
    setCustomTip("");
  }, []);

  const handleCustomTipChange = useCallback((value: string) => {
    setCustomTip(value);
    setTipPercentage(null);
  }, []);

  const handleAutoDistributeTip = useCallback(() => {
    if (tipAmount <= 0 || staffMembers.length === 0) return;

    const totalServiceRevenue = staffMembers.reduce((sum, s) => sum + (s.serviceTotal || 0), 0);

    if (totalServiceRevenue === 0) {
      // Fall back to equal split
      const amountPerStaff = tipAmount / staffMembers.length;
      const distribution = staffMembers.map(staff => ({
        staffId: staff.id,
        staffName: staff.name,
        amount: amountPerStaff
      }));
      setTipDistribution(distribution);
      setShowTipDistribution(true);
      return;
    }

    const distribution = staffMembers.map(staff => ({
      staffId: staff.id,
      staffName: staff.name,
      amount: (tipAmount * (staff.serviceTotal || 0)) / totalServiceRevenue
    }));

    setTipDistribution(distribution);
    setShowTipDistribution(true);
  }, [tipAmount, staffMembers]);

  const handleEqualSplitTip = useCallback(() => {
    if (tipAmount <= 0 || staffMembers.length === 0) return;

    const amountPerStaff = tipAmount / staffMembers.length;
    const distribution = staffMembers.map(staff => ({
      staffId: staff.id,
      staffName: staff.name,
      amount: amountPerStaff
    }));

    setTipDistribution(distribution);
    setShowTipDistribution(true);
  }, [tipAmount, staffMembers]);

  const handleApplyGiftCard = useCallback((giftCard: AppliedGiftCard) => {
    setAppliedGiftCards(prev => [...prev, giftCard]);

    const newPayment: PaymentMethod = {
      type: 'gift_card',
      amount: giftCard.amountUsed,
      customName: `Gift Card (${giftCard.code})`,
    };
    setPaymentMethods(prev => [...prev, newPayment]);
    setShowGiftCardModal(false);
  }, []);

  const handleRemoveGiftCard = useCallback((code: string) => {
    const removedCard = appliedGiftCards.find(gc => gc.code === code);
    setAppliedGiftCards(prev => prev.filter(gc => gc.code !== code));

    if (removedCard) {
      setPaymentMethods(prev =>
        prev.filter(p => !(p.type === 'gift_card' && p.customName?.includes(code)))
      );
    }
  }, [appliedGiftCards]);

  const handleSelectMethod = useCallback((methodId: PaymentMethodType) => {
    setCurrentMethod(methodId);
    setCurrentStep(2);
  }, []);

  const handleSentToPad = useCallback((transactionId: string) => {
    setSentToPadTransactionId(transactionId);
    onSentToPad?.(transactionId);
  }, [onSentToPad]);

  const goToNextStep = useCallback(() => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep]);

  const goToPrevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setCurrentMethod(null);
    }
  }, [currentStep]);

  return {
    // State
    currentStep,
    tipPercentage,
    customTip,
    paymentMethods,
    currentMethod,
    cashTendered,
    customPaymentName,
    showTipDistribution,
    tipDistribution,
    showSuccess,
    isProcessing,
    paymentError,
    showGiftCardModal,
    appliedGiftCards,
    sentToPadTransactionId,

    // Computed values
    tipAmount,
    totalWithTip,
    amountPaid,
    remaining,
    isFullyPaid,
    totalChangeToReturn,
    quickCashAmounts,
    hasUnresolvedPriceChanges,
    unresolvedPriceChanges,
    showPadOverlay,

    // Selectors
    storeId,
    userId,
    deviceId,

    // Handlers
    handleQuickCash,
    handleAddPayment,
    handleComplete,
    handleSelectTipPercentage,
    handleCustomTipChange,
    handleAutoDistributeTip,
    handleEqualSplitTip,
    handleApplyGiftCard,
    handleRemoveGiftCard,
    handleSelectMethod,
    handleSentToPad,
    goToNextStep,
    goToPrevStep,
    setPaymentError,
    setShowGiftCardModal,
    setCashTendered,
    setCustomPaymentName,
    setPaymentMethods,
  };
}
