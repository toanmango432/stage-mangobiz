/**
 * SellGiftCardModal - Redesigned for optimal UX
 *
 * Key improvements:
 * - Smart defaults: "Print" pre-selected (most common at POS)
 * - Progressive disclosure: Recipient/message collapsed by default
 * - Camera scan: Primary action for physical cards
 * - Flexible input: Accepts multiple card code formats
 * - Reduced clicks: 2 clicks for quick print, 4 for email
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
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Camera,
  ScanLine,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BarcodeScannerModal } from '@/components/common/BarcodeScannerModal';
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

const DELIVERY_OPTIONS: { value: GiftCardDeliveryMethod; label: string; icon: typeof Mail; hint: string }[] = [
  { value: 'print', label: 'Print', icon: Printer, hint: 'Receipt now' },
  { value: 'email', label: 'Email', icon: Mail, hint: 'Send digitally' },
  { value: 'none', label: 'None', icon: Ban, hint: 'Code only' },
];

// Mango brand gradients
const CARD_GRADIENTS = [
  'from-emerald-500 to-teal-600',
  'from-violet-500 to-purple-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-sky-500 to-blue-600',
];

function getGradientForAmount(amount: number): string {
  const index = Math.floor(amount / 25) % CARD_GRADIENTS.length;
  return CARD_GRADIENTS[index];
}

// Flexible card code validation - accepts multiple formats
const CARD_CODE_PATTERNS = [
  /^GC-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/, // GC-XXXX-XXXX-XXXX
  /^GC[A-HJ-NP-Z2-9]{12}$/,  // GCXXXXXXXXXXXX (raw scan)
  /^[A-HJ-NP-Z2-9]{12}$/,    // XXXXXXXXXXXX (without prefix)
];

function validateCardCode(code: string): boolean {
  const upper = code.toUpperCase().trim();
  return CARD_CODE_PATTERNS.some(pattern => pattern.test(upper));
}

function normalizeCardCode(input: string): string {
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  // Remove GC prefix if present
  const chars = cleaned.startsWith('GC') ? cleaned.slice(2) : cleaned;
  if (chars.length >= 12) {
    const validChars = chars.slice(0, 12);
    return `GC-${validChars.slice(0, 4)}-${validChars.slice(4, 8)}-${validChars.slice(8, 12)}`;
  }
  return input;
}

function formatCardCodeInput(value: string): string {
  // Allow flexible input, auto-format as they type
  let cleaned = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');

  // Auto-add GC- prefix if not present and they're typing characters
  if (cleaned.length > 0 && !cleaned.startsWith('GC') && !cleaned.startsWith('G')) {
    cleaned = 'GC-' + cleaned;
  }

  // Don't force format too aggressively - let them paste raw codes
  if (cleaned.length > 17) {
    // Probably a raw code, normalize it
    return normalizeCardCode(cleaned);
  }

  return cleaned;
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
  const [deliveryMethod, setDeliveryMethod] = useState<GiftCardDeliveryMethod>('print'); // Smart default
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [message, setMessage] = useState('');
  const [physicalCardCode, setPhysicalCardCode] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [cardCodeError, setCardCodeError] = useState('');
  const [amountError, setAmountError] = useState('');

  // Progressive disclosure state
  const [recipientExpanded, setRecipientExpanded] = useState(false);
  const [messageExpanded, setMessageExpanded] = useState(false);

  // Scanner state
  const [showScanner, setShowScanner] = useState(false);

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
  const gradient = getGradientForAmount(amount || 50);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode('digital');
      setCustomAmountValue('');
      setDeliveryMethod('print'); // Smart default
      setRecipientName('');
      setRecipientEmail('');
      setRecipientPhone('');
      setMessage('');
      setPhysicalCardCode('');
      setEmailError('');
      setCardCodeError('');
      setAmountError('');
      setRecipientExpanded(false);
      setMessageExpanded(false);
    }
  }, [isOpen]);

  // Auto-expand recipient section when email delivery selected
  useEffect(() => {
    if (deliveryMethod === 'email') {
      setRecipientExpanded(true);
    }
  }, [deliveryMethod]);

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
        setAmountError(`Min $${minAmount}`);
      } else if (numValue > maxAmount) {
        setAmountError(`Max $${maxAmount}`);
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
      setEmailError('Invalid email');
    } else {
      setEmailError('');
    }
  };

  const handleCardCodeChange = (value: string) => {
    const formatted = formatCardCodeInput(value);
    setPhysicalCardCode(formatted);
    setCardCodeError('');
  };

  // Handle barcode scan result
  const handleScanResult = (code: string) => {
    const normalized = normalizeCardCode(code);
    setPhysicalCardCode(normalized);
    setShowScanner(false);

    if (validateCardCode(normalized)) {
      setCardCodeError('');
    } else {
      setCardCodeError('Invalid code scanned');
    }
  };

  const handleAddToTicket = async () => {
    // Validate custom amount
    if (isCustomAmount) {
      if (!customAmountValue || customAmountValue <= 0) {
        setAmountError('Enter amount');
        return;
      }
      if (customAmountValue < minAmount || customAmountValue > maxAmount) {
        setAmountError(`$${minAmount}-$${maxAmount}`);
        return;
      }
    }

    if (amount <= 0) return;

    // Validate based on mode
    if (mode === 'digital') {
      if (deliveryMethod === 'email') {
        if (!recipientEmail) {
          setEmailError('Required');
          setRecipientExpanded(true);
          return;
        }
        if (!validateEmail(recipientEmail)) {
          setEmailError('Invalid email');
          setRecipientExpanded(true);
          return;
        }
      }
    } else {
      // Physical mode - flexible validation
      if (!physicalCardCode || physicalCardCode.length < 6) {
        setCardCodeError('Enter card code');
        return;
      }
      if (!validateCardCode(physicalCardCode)) {
        setCardCodeError('Invalid format');
        return;
      }
    }

    setIsAdding(true);
    try {
      const finalCode = mode === 'digital'
        ? generatedCode
        : normalizeCardCode(physicalCardCode);

      const giftCardData: GiftCardSaleData = {
        amount,
        deliveryMethod: mode === 'physical' ? 'none' : deliveryMethod,
        denominationId: denomination?.id,
        giftCardCode: finalCode,
        isPhysicalCard: mode === 'physical',
        ...(recipientName && { recipientName: recipientName.trim() }),
        ...(recipientEmail && { recipientEmail: recipientEmail.trim() }),
        ...(recipientPhone && { recipientPhone: recipientPhone.trim() }),
        ...(message && { message: message.trim() }),
      };

      onAddToTicket(giftCardData);
      onClose();
    } catch (error) {
      console.error('Failed to add gift card:', error);
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

  if (!isOpen) return null;
  if (!isCustomAmount && amount <= 0) return null;

  const displayCode = mode === 'digital' ? generatedCode : (physicalCardCode || 'GC-XXXX-XXXX-XXXX');
  const isCodeValid = mode === 'digital' || validateCardCode(physicalCardCode);
  const canSubmit =
    !isAdding &&
    amount > 0 &&
    (!isCustomAmount || (customAmountValue && !amountError)) &&
    (mode === 'digital' || (isCodeValid && physicalCardCode.length >= 6)) &&
    (mode !== 'digital' || deliveryMethod !== 'email' || (recipientEmail && !emailError));

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
        <div className="px-5 py-3 border-b border-gray-200/60 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl bg-gradient-to-br ${gradient} shadow-md`}>
              <Gift className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {isCustomAmount ? 'Custom Gift Card' : 'Sell Gift Card'}
              </h2>
              {amount > 0 && (
                <p className="text-xs text-gray-500">${amount.toFixed(2)} value</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Custom Amount Input */}
        {isCustomAmount && (
          <div className="px-5 pt-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl font-semibold text-gray-400">$</span>
              <input
                type="number"
                min={minAmount}
                max={maxAmount}
                step={1}
                value={customAmountValue === '' ? '' : customAmountValue}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                placeholder="Amount"
                autoFocus
                className={`w-full pl-9 pr-4 py-3 text-2xl font-bold border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all placeholder:text-gray-300 placeholder:font-normal ${
                  amountError
                    ? 'border-red-300 bg-red-50 focus:ring-red-500 text-red-700'
                    : 'border-gray-200 focus:ring-emerald-500 text-gray-900'
                }`}
              />
              {amountError && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-red-500">{amountError}</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1.5">${minAmount} - ${maxAmount} range</p>
          </div>
        )}

        {/* Mode Toggle Tabs */}
        <div className="px-5 pt-4">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={() => setMode('digital')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                mode === 'digital'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Sparkles size={16} />
              <span>New Card</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('physical')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                mode === 'physical'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CreditCard size={16} />
              <span>Activate Card</span>
            </button>
          </div>
        </div>

        {/* Compact Gift Card Preview */}
        <div className="px-5 pt-4">
          <div
            className={`relative bg-gradient-to-br ${gradient} rounded-xl p-4 text-white overflow-hidden`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Gift size={24} className="opacity-80" />
                <div>
                  <p className="text-2xl font-bold">
                    {amount > 0 ? `$${amount.toFixed(0)}` : '$---'}
                  </p>
                  <p className="text-xs opacity-70">Gift Card</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-mono text-sm ${isCodeValid ? 'text-white' : 'text-white/50'}`}>
                  {displayCode}
                </p>
                {mode === 'digital' && (
                  <p className="text-xs opacity-60 flex items-center justify-end gap-1 mt-0.5">
                    <Check size={10} /> Auto-generated
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="px-5 py-4 space-y-4 max-h-[45vh] overflow-y-auto">

          {/* Physical Card Mode - Camera Scan + Input */}
          {mode === 'physical' && (
            <div className="space-y-3">
              {/* Camera Scan Button - Primary Action */}
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="w-full flex items-center justify-center gap-3 py-4 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl transition-all shadow-lg"
              >
                <Camera size={22} />
                <div className="text-left">
                  <span className="font-medium">Scan Card Barcode</span>
                  <p className="text-xs text-gray-400">Tap to open camera</p>
                </div>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 text-gray-400">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs">or enter manually</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Manual Input */}
              <div>
                <div className="relative">
                  <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={physicalCardCode}
                    onChange={(e) => handleCardCodeChange(e.target.value)}
                    placeholder="GC-XXXX-XXXX-XXXX"
                    className={`w-full pl-10 pr-10 py-3 border-2 rounded-xl text-sm font-mono tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all ${
                      cardCodeError
                        ? 'border-red-300 bg-red-50 focus:ring-red-500'
                        : isCodeValid && physicalCardCode.length >= 6
                          ? 'border-green-300 bg-green-50 focus:ring-green-500'
                          : 'border-gray-200 focus:ring-emerald-500'
                    }`}
                  />
                  {physicalCardCode.length >= 6 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isCodeValid ? (
                        <Check size={18} className="text-green-500" />
                      ) : (
                        <AlertCircle size={18} className="text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {cardCodeError ? (
                  <p className="text-xs text-red-500 mt-1">{cardCodeError}</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    Accepts: GC-XXXX-XXXX-XXXX or raw scan
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Digital Card Mode - Delivery & Recipient */}
          {mode === 'digital' && (
            <>
              {/* Delivery Method - Inline Pills */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Delivery Method
                </label>
                <div className="flex gap-2">
                  {DELIVERY_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isSelected = deliveryMethod === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setDeliveryMethod(option.value)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        <Icon size={16} />
                        <div className="text-left">
                          <span className="text-sm font-medium block">{option.label}</span>
                        </div>
                        {isSelected && <Check size={14} className="ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recipient Details - Collapsible */}
              <Collapsible open={recipientExpanded} onOpenChange={setRecipientExpanded}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-left group">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    {recipientExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    Recipient Details
                    {deliveryMethod !== 'email' && (
                      <span className="text-gray-400 font-normal text-xs">(optional)</span>
                    )}
                    {deliveryMethod === 'email' && !recipientEmail && (
                      <span className="text-amber-500 text-xs">Required for email</span>
                    )}
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2.5 pt-2">
                  {/* Recipient Name */}
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Name"
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Recipient Email */}
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      placeholder={deliveryMethod === 'email' ? 'Email (required)' : 'Email'}
                      className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                        emailError ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                    />
                    {emailError && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-red-500">{emailError}</span>
                    )}
                  </div>

                  {/* Recipient Phone */}
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="tel"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder="Phone"
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Personal Message - Collapsible */}
              <Collapsible open={messageExpanded} onOpenChange={setMessageExpanded}>
                <CollapsibleTrigger className="flex items-center w-full py-2 text-left group">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    {messageExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <MessageSquare size={14} />
                    Personal Message
                    <span className="text-gray-400 font-normal text-xs">(optional)</span>
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Add a personal message..."
                    rows={2}
                    maxLength={200}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none transition-all"
                  />
                  <p className="text-xs text-gray-400 text-right mt-1">{message.length}/200</p>
                </CollapsibleContent>
              </Collapsible>
            </>
          )}
        </div>

        {/* Footer - Prominent CTA */}
        <div className="px-5 py-4 border-t border-gray-200/60 bg-white">
          <button
            onClick={handleAddToTicket}
            disabled={!canSubmit}
            className={`w-full py-3.5 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r ${gradient} hover:opacity-90 shadow-lg hover:shadow-xl flex items-center justify-center gap-2`}
          >
            {isAdding ? (
              'Adding...'
            ) : (
              <>
                <Check size={18} />
                {mode === 'physical' ? 'Activate' : 'Add'} ${amount > 0 ? amount.toFixed(0) : '—'} Gift Card
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="w-full mt-2 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScanResult}
        title="Scan Gift Card"
      />
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default SellGiftCardModal;
