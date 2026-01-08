/**
 * SellGiftCardModal - Modal for selling gift cards at POS checkout
 *
 * Features:
 * - Two-mode tabs: "New Gift Card" | "Activate Physical Card"
 * - Digital mode: delivery selection, recipient form, auto-generated code
 * - Physical mode: enter existing card number with validation
 * - Code preview section showing gift card code before adding to ticket
 * - Mango design system with premium/tactile aesthetic
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Gift,
  Mail,
  Printer,
  Ban,
  User,
  AtSign,
  Phone,
  MessageSquare,
  Sparkles,
  CreditCard,
  Check,
  AlertCircle
} from 'lucide-react';
import type { GiftCardDenomination } from '@/types/catalog';
import type { GiftCardDeliveryMethod } from '@/types/gift-card';
import { generateGiftCardCode } from '@/types/gift-card';

interface SellGiftCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  denomination: GiftCardDenomination | null;
  isCustomAmount?: boolean;
  minAmount?: number;
  maxAmount?: number;
  onAddToTicket: (giftCardData: GiftCardSaleData) => void;
}

export interface GiftCardSaleData {
  amount: number;
  deliveryMethod: GiftCardDeliveryMethod;
  recipientName?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  message?: string;
  denominationId?: string;
  giftCardCode: string;
  isPhysicalCard: boolean;
}

type CardMode = 'digital' | 'physical';

const DELIVERY_OPTIONS: { value: GiftCardDeliveryMethod; label: string; icon: typeof Mail; description: string }[] = [
  { value: 'email', label: 'Email', icon: Mail, description: 'Send via email immediately' },
  { value: 'print', label: 'Print', icon: Printer, description: 'Print physical receipt' },
  { value: 'none', label: 'No Delivery', icon: Ban, description: 'Generate code only' },
];

// Mango brand gradients
const CARD_GRADIENTS = [
  'from-emerald-500 to-teal-600',
  'from-violet-500 to-purple-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-sky-500 to-blue-600',
  'from-lime-500 to-green-600',
];

function getGradientForAmount(amount: number): string {
  const index = Math.floor(amount / 25) % CARD_GRADIENTS.length;
  return CARD_GRADIENTS[index];
}

// Validate physical card code format: GC-XXXX-XXXX-XXXX
const CARD_CODE_REGEX = /^GC-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;

function validateCardCode(code: string): boolean {
  return CARD_CODE_REGEX.test(code.toUpperCase());
}

function formatCardCodeInput(value: string): string {
  // Remove all non-alphanumeric except dashes
  let cleaned = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');

  // Add GC- prefix if not present
  if (!cleaned.startsWith('GC-') && !cleaned.startsWith('GC')) {
    if (cleaned.startsWith('G')) {
      // Let them type GC-
    } else {
      cleaned = 'GC-' + cleaned;
    }
  }

  // Format as GC-XXXX-XXXX-XXXX
  const parts = cleaned.replace('GC-', '').replace(/-/g, '');
  let formatted = 'GC';
  for (let i = 0; i < Math.min(parts.length, 12); i++) {
    if (i % 4 === 0) formatted += '-';
    formatted += parts[i];
  }

  return formatted;
}

export function SellGiftCardModal({
  isOpen,
  onClose,
  denomination,
  isCustomAmount = false,
  minAmount = 5,
  maxAmount = 500,
  onAddToTicket,
}: SellGiftCardModalProps) {
  // Mode state
  const [mode, setMode] = useState<CardMode>('digital');

  // Form state
  const [customAmountValue, setCustomAmountValue] = useState<number | ''>('');
  const [deliveryMethod, setDeliveryMethod] = useState<GiftCardDeliveryMethod>('print');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [message, setMessage] = useState('');
  const [physicalCardCode, setPhysicalCardCode] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [cardCodeError, setCardCodeError] = useState('');
  const [amountError, setAmountError] = useState('');

  // Generate code for digital cards
  const generatedCode = useMemo(() => {
    if (isOpen && mode === 'digital') {
      return generateGiftCardCode();
    }
    return '';
  }, [isOpen, mode]);

  // Determine the actual amount
  const amount = isCustomAmount
    ? (typeof customAmountValue === 'number' ? customAmountValue : 0)
    : (denomination?.amount || 0);
  const gradient = getGradientForAmount(amount || 50); // Default gradient for custom

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode('digital');
      setCustomAmountValue('');
      setDeliveryMethod('print');
      setRecipientName('');
      setRecipientEmail('');
      setRecipientPhone('');
      setMessage('');
      setPhysicalCardCode('');
      setEmailError('');
      setCardCodeError('');
      setAmountError('');
    }
  }, [isOpen]);

  // Handle custom amount change
  const handleCustomAmountChange = (value: string) => {
    const numValue = parseFloat(value);
    if (value === '') {
      setCustomAmountValue('');
      setAmountError('');
    } else if (isNaN(numValue)) {
      return;
    } else {
      setCustomAmountValue(numValue);
      if (numValue < minAmount) {
        setAmountError(`Minimum amount is $${minAmount}`);
      } else if (numValue > maxAmount) {
        setAmountError(`Maximum amount is $${maxAmount}`);
      } else {
        setAmountError('');
      }
    }
  };

  // Validate email
  const validateEmail = useCallback((email: string): boolean => {
    if (!email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const handleEmailChange = (value: string) => {
    setRecipientEmail(value);
    if (value && !validateEmail(value)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handleCardCodeChange = (value: string) => {
    const formatted = formatCardCodeInput(value);
    setPhysicalCardCode(formatted);

    if (formatted.length === 17) { // Full format: GC-XXXX-XXXX-XXXX
      if (!validateCardCode(formatted)) {
        setCardCodeError('Invalid card code format');
      } else {
        setCardCodeError('');
      }
    } else {
      setCardCodeError('');
    }
  };

  const handleAddToTicket = async () => {
    // Validate custom amount
    if (isCustomAmount) {
      if (!customAmountValue || customAmountValue <= 0) {
        setAmountError('Please enter an amount');
        return;
      }
      if (customAmountValue < minAmount || customAmountValue > maxAmount) {
        setAmountError(`Amount must be between $${minAmount} and $${maxAmount}`);
        return;
      }
    }

    if (amount <= 0) return;

    // Validate based on mode
    if (mode === 'digital') {
      if (deliveryMethod === 'email') {
        if (!recipientEmail) {
          setEmailError('Email is required for email delivery');
          return;
        }
        if (!validateEmail(recipientEmail)) {
          setEmailError('Please enter a valid email address');
          return;
        }
      }
    } else {
      // Physical mode - validate card code
      if (!physicalCardCode || physicalCardCode.length < 17) {
        setCardCodeError('Please enter a complete card code');
        return;
      }
      if (!validateCardCode(physicalCardCode)) {
        setCardCodeError('Invalid card code format');
        return;
      }
    }

    setIsAdding(true);
    try {
      const giftCardData: GiftCardSaleData = {
        amount,
        deliveryMethod: mode === 'physical' ? 'none' : deliveryMethod,
        denominationId: denomination?.id,
        giftCardCode: mode === 'digital' ? generatedCode : physicalCardCode.toUpperCase(),
        isPhysicalCard: mode === 'physical',
        ...(recipientName && { recipientName: recipientName.trim() }),
        ...(recipientEmail && { recipientEmail: recipientEmail.trim() }),
        ...(recipientPhone && { recipientPhone: recipientPhone.trim() }),
        ...(message && { message: message.trim() }),
      };

      onAddToTicket(giftCardData);
      onClose();
    } catch (error) {
      console.error('Failed to add gift card to ticket:', error);
    } finally {
      setIsAdding(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddToTicket();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, amount, deliveryMethod, recipientEmail, mode, physicalCardCode]);

  // Don't render if closed; for custom amount, we allow amount=0 initially
  if (!isOpen) return null;
  if (!isCustomAmount && amount <= 0) return null;

  const displayCode = mode === 'digital' ? generatedCode : physicalCardCode || 'GC-XXXX-XXXX-XXXX';
  const isCodeValid = mode === 'digital' || (physicalCardCode.length === 17 && validateCardCode(physicalCardCode));

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-[#faf9f7] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200/60 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {isCustomAmount ? 'Custom Gift Card' : 'Sell Gift Card'}
              </h2>
              <p className="text-sm text-gray-500">
                {isCustomAmount && !amount ? 'Enter amount below' : `$${amount.toFixed(2)} value`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Custom Amount Input - shown first for custom mode */}
        {isCustomAmount && (
          <div className="px-6 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gift Card Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-gray-400">$</span>
              <input
                type="number"
                min={minAmount}
                max={maxAmount}
                step={1}
                value={customAmountValue}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                placeholder={`${minAmount} - ${maxAmount}`}
                autoFocus
                className={`w-full pl-10 pr-4 py-4 text-3xl font-bold border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all ${
                  amountError
                    ? 'border-red-300 bg-red-50 focus:ring-red-500 text-red-700'
                    : 'border-gray-200 focus:ring-emerald-500 text-gray-900'
                }`}
              />
            </div>
            {amountError ? (
              <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                <AlertCircle size={12} />
                {amountError}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1.5">
                Enter any amount between ${minAmount} and ${maxAmount}
              </p>
            )}
          </div>
        )}

        {/* Mode Toggle Tabs */}
        <div className="px-6 pt-4">
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setMode('digital')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                mode === 'digital'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Sparkles size={16} />
              New Gift Card
            </button>
            <button
              type="button"
              onClick={() => setMode('physical')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                mode === 'physical'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CreditCard size={16} />
              Activate Physical Card
            </button>
          </div>
        </div>

        {/* Gift Card Preview - Paper/Tactile Style */}
        <div className="px-6 pt-5 pb-4">
          <div
            className={`relative bg-gradient-to-br ${gradient} rounded-2xl p-6 text-white overflow-hidden shadow-xl`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              backgroundBlendMode: 'soft-light',
            }}
          >
            {/* Decorative circles */}
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
            <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-white/5 rounded-full" />

            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <Gift size={28} className="opacity-80" />
                <span className="text-xs font-medium opacity-70 uppercase tracking-wide">Gift Card</span>
              </div>

              <p className="text-4xl font-bold tracking-tight">${amount.toFixed(0)}</p>

              {/* Code Display */}
              <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-xs opacity-60 uppercase tracking-wider mb-1">Card Code</p>
                <p className={`font-mono text-lg tracking-wider ${isCodeValid ? 'text-white' : 'text-white/50'}`}>
                  {displayCode}
                </p>
                {mode === 'digital' && (
                  <div className="flex items-center gap-1 mt-1">
                    <Check size={12} className="text-green-300" />
                    <span className="text-xs text-green-200">Auto-generated</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="px-6 pb-4 space-y-5 max-h-[40vh] overflow-y-auto">

          {/* Physical Card Mode - Code Input */}
          {mode === 'physical' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Physical Card Number
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={physicalCardCode}
                  onChange={(e) => handleCardCodeChange(e.target.value)}
                  placeholder="GC-XXXX-XXXX-XXXX"
                  maxLength={17}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl text-sm font-mono tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all ${
                    cardCodeError
                      ? 'border-red-300 bg-red-50 focus:ring-red-500'
                      : isCodeValid && physicalCardCode.length === 17
                        ? 'border-green-300 bg-green-50 focus:ring-green-500'
                        : 'border-gray-200 focus:ring-emerald-500'
                  }`}
                />
                {physicalCardCode.length === 17 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isCodeValid ? (
                      <Check size={18} className="text-green-500" />
                    ) : (
                      <AlertCircle size={18} className="text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {cardCodeError && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {cardCodeError}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1.5">
                Enter the code from the physical gift card to activate it
              </p>
            </div>
          )}

          {/* Digital Card Mode - Delivery & Recipient */}
          {mode === 'digital' && (
            <>
              {/* Delivery Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {DELIVERY_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isSelected = deliveryMethod === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setDeliveryMethod(option.value)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Icon size={20} />
                        <span className="text-xs font-medium">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  {DELIVERY_OPTIONS.find(o => o.value === deliveryMethod)?.description}
                </p>
              </div>

              {/* Recipient Details */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Recipient Details
                  {deliveryMethod !== 'email' && (
                    <span className="text-gray-400 font-normal ml-1">(optional)</span>
                  )}
                </label>

                {/* Recipient Name */}
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Recipient name"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Recipient Email */}
                <div>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      placeholder={deliveryMethod === 'email' ? 'Email address (required)' : 'Email address'}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                        emailError ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                    />
                  </div>
                  {emailError && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {emailError}
                    </p>
                  )}
                </div>

                {/* Recipient Phone */}
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="Phone number"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Personal Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare size={14} />
                    Personal Message <span className="text-gray-400 font-normal">(optional)</span>
                  </span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a personal message for the recipient..."
                  rows={2}
                  maxLength={200}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none transition-all"
                />
                <p className="text-xs text-gray-400 text-right mt-1">
                  {message.length}/200
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200/60 flex justify-between items-center bg-white">
          <div className="text-sm text-gray-600">
            Total: <span className="font-semibold text-gray-900">${amount.toFixed(2)}</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleAddToTicket}
              disabled={
                isAdding ||
                (isCustomAmount && (!customAmountValue || !!amountError)) ||
                (mode === 'digital' && deliveryMethod === 'email' && (!recipientEmail || !!emailError)) ||
                (mode === 'physical' && (!isCodeValid || physicalCardCode.length < 17))
              }
              className={`px-6 py-2.5 text-sm font-medium text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r ${gradient} hover:opacity-90 shadow-lg hover:shadow-xl`}
            >
              {isAdding ? 'Adding...' : 'Add to Ticket'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default SellGiftCardModal;
