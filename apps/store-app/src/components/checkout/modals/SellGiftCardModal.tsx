/**
 * SellGiftCardModal - Full-featured gift card selling modal
 *
 * Features:
 * - Preset amounts for quick selection ($25, $50, $100, etc.)
 * - Gift Value vs Price (supports discounted gift cards)
 * - Discount option (percentage or fixed)
 * - Physical card activation with camera scan
 * - Digital card with delivery options
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
  Percent,
  Tag,
  DollarSign,
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
  amount: number;  // Gift value (what recipient gets)
  price: number;   // What customer pays
  deliveryMethod: GiftCardDeliveryMethod;
  recipientName?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  message?: string;
  denominationId?: string;
  giftCardCode: string;
  isPhysicalCard: boolean;
  discountPercent?: number;
}

type CardMode = 'digital' | 'physical';

// Preset amounts for quick selection
const PRESET_AMOUNTS = [25, 50, 75, 100, 150, 200];

const DELIVERY_OPTIONS: { value: GiftCardDeliveryMethod; label: string; icon: typeof Mail }[] = [
  { value: 'print', label: 'Print', icon: Printer },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'none', label: 'None', icon: Ban },
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

// Flexible card code validation
const CARD_CODE_PATTERNS = [
  /^GC-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/,
  /^GC[A-HJ-NP-Z2-9]{12}$/,
  /^[A-HJ-NP-Z2-9]{12}$/,
];

function validateCardCode(code: string): boolean {
  const upper = code.toUpperCase().trim();
  return CARD_CODE_PATTERNS.some(pattern => pattern.test(upper));
}

function normalizeCardCode(input: string): string {
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const chars = cleaned.startsWith('GC') ? cleaned.slice(2) : cleaned;
  if (chars.length >= 12) {
    const validChars = chars.slice(0, 12);
    return `GC-${validChars.slice(0, 4)}-${validChars.slice(4, 8)}-${validChars.slice(8, 12)}`;
  }
  return input;
}

function formatCardCodeInput(value: string): string {
  let cleaned = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
  if (cleaned.length > 0 && !cleaned.startsWith('GC') && !cleaned.startsWith('G')) {
    cleaned = 'GC-' + cleaned;
  }
  if (cleaned.length > 17) {
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
  const [mode, setMode] = useState<CardMode>('physical');

  // Amount state
  const [giftValue, setGiftValue] = useState<number>(0);
  const [customValueInput, setCustomValueInput] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  // Pricing state
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [customPrice, setCustomPrice] = useState<string>('');

  // Form state
  const [deliveryMethod, setDeliveryMethod] = useState<GiftCardDeliveryMethod>('print');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [message, setMessage] = useState('');
  const [physicalCardCode, setPhysicalCardCode] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [cardCodeError, setCardCodeError] = useState('');

  // Progressive disclosure state
  const [recipientExpanded, setRecipientExpanded] = useState(false);
  const [messageExpanded, setMessageExpanded] = useState(false);

  // Scanner state
  const [showScanner, setShowScanner] = useState(false);

  // Calculate price based on discount
  const price = useMemo(() => {
    if (!hasDiscount) return giftValue;
    if (customPrice) {
      const parsed = parseFloat(customPrice);
      return isNaN(parsed) ? giftValue : parsed;
    }
    if (discountPercent > 0) {
      return Math.round(giftValue * (1 - discountPercent / 100) * 100) / 100;
    }
    return giftValue;
  }, [giftValue, hasDiscount, discountPercent, customPrice]);

  // Generate code for digital cards
  const generatedCode = useMemo(() => {
    if (isOpen && mode === 'digital') {
      return generateGiftCardCode();
    }
    return '';
  }, [isOpen, mode]);

  const gradient = getGradientForAmount(giftValue || 50);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode('physical');
      // Set initial value from denomination or reset
      if (denomination?.amount && !isCustomAmount) {
        setGiftValue(denomination.amount);
        setSelectedPreset(PRESET_AMOUNTS.includes(denomination.amount) ? denomination.amount : null);
      } else {
        setGiftValue(0);
        setSelectedPreset(null);
      }
      setCustomValueInput('');
      setHasDiscount(false);
      setDiscountPercent(0);
      setCustomPrice('');
      setDeliveryMethod('print');
      setRecipientName('');
      setRecipientEmail('');
      setRecipientPhone('');
      setMessage('');
      setPhysicalCardCode('');
      setEmailError('');
      setCardCodeError('');
      setRecipientExpanded(false);
      setMessageExpanded(false);
    }
  }, [isOpen, denomination, isCustomAmount]);

  // Auto-expand recipient section when email delivery selected
  useEffect(() => {
    if (deliveryMethod === 'email') {
      setRecipientExpanded(true);
    }
  }, [deliveryMethod]);

  // Handle preset amount selection
  const handlePresetSelect = (amount: number) => {
    setSelectedPreset(amount);
    setGiftValue(amount);
    setCustomValueInput('');
  };

  // Handle custom value input
  const handleCustomValueChange = (value: string) => {
    setCustomValueInput(value);
    setSelectedPreset(null);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= minAmount && numValue <= maxAmount) {
      setGiftValue(numValue);
    } else if (value === '') {
      setGiftValue(0);
    }
  };

  // Handle discount toggle
  const handleDiscountToggle = () => {
    setHasDiscount(!hasDiscount);
    if (hasDiscount) {
      setDiscountPercent(0);
      setCustomPrice('');
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
    if (giftValue <= 0) return;
    if (price <= 0) return;

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
        amount: giftValue,
        price: price,
        deliveryMethod: mode === 'physical' ? 'none' : deliveryMethod,
        denominationId: denomination?.id,
        giftCardCode: finalCode,
        isPhysicalCard: mode === 'physical',
        ...(hasDiscount && discountPercent > 0 && { discountPercent }),
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
  }, [isOpen, giftValue, price, deliveryMethod, recipientEmail, mode, physicalCardCode]);

  if (!isOpen) return null;

  const displayCode = mode === 'digital' ? generatedCode : (physicalCardCode || 'GC-XXXX-XXXX-XXXX');
  const isCodeValid = mode === 'digital' || validateCardCode(physicalCardCode);
  const canSubmit =
    !isAdding &&
    giftValue > 0 &&
    price > 0 &&
    (mode === 'digital' || (isCodeValid && physicalCardCode.length >= 6)) &&
    (mode !== 'digital' || deliveryMethod !== 'email' || (recipientEmail && !emailError));

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative bg-[#faf9f7] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3 border-b border-gray-200/60 flex items-center justify-between bg-white flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl bg-gradient-to-br ${gradient} shadow-md`}>
              <Gift className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Sell Gift Card</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Mode Toggle Tabs */}
          <div className="px-5 pt-4">
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
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
            </div>
          </div>

          {/* Amount Selection */}
          <div className="px-5 pt-4">
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Gift Card Value
            </label>
            {/* Preset Amounts */}
            <div className="grid grid-cols-6 gap-2 mb-3">
              {PRESET_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => handlePresetSelect(amount)}
                  className={`py-2 px-1 rounded-lg text-sm font-medium transition-all ${
                    selectedPreset === amount
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-emerald-300 hover:bg-emerald-50'
                  }`}
                >
                  ${amount}
                </button>
              ))}
            </div>
            {/* Custom Amount Input */}
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="number"
                min={minAmount}
                max={maxAmount}
                value={customValueInput}
                onChange={(e) => handleCustomValueChange(e.target.value)}
                placeholder="Custom amount"
                className={`w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                  selectedPreset === null && customValueInput ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200'
                }`}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">${minAmount} - ${maxAmount} range</p>
          </div>

          {/* Discount Section */}
          <div className="px-5 pt-3">
            <button
              type="button"
              onClick={handleDiscountToggle}
              className={`flex items-center gap-2 text-sm font-medium transition-all ${
                hasDiscount ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                hasDiscount ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
              }`}>
                {hasDiscount && <Check size={12} className="text-white" />}
              </div>
              <Tag size={14} />
              Apply Discount
            </button>

            {hasDiscount && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                <div className="flex gap-3">
                  {/* Discount Percent */}
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">Discount %</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={discountPercent || ''}
                        onChange={(e) => {
                          setDiscountPercent(parseFloat(e.target.value) || 0);
                          setCustomPrice('');
                        }}
                        placeholder="0"
                        className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    </div>
                  </div>
                  {/* Custom Price */}
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">Or Set Price</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      <input
                        type="number"
                        min={0}
                        max={giftValue}
                        value={customPrice}
                        onChange={(e) => {
                          setCustomPrice(e.target.value);
                          setDiscountPercent(0);
                        }}
                        placeholder={giftValue.toString()}
                        className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>
                {giftValue > 0 && price < giftValue && (
                  <p className="text-xs text-amber-700">
                    Customer pays <span className="font-semibold">${price.toFixed(2)}</span> for ${giftValue} gift card
                    {discountPercent > 0 && ` (${discountPercent}% off)`}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Gift Card Preview */}
          <div className="px-5 pt-4">
            <div className={`relative bg-gradient-to-br ${gradient} rounded-xl p-4 text-white overflow-hidden`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Gift size={24} className="opacity-80" />
                  <div>
                    <p className="text-2xl font-bold">
                      {giftValue > 0 ? `$${giftValue}` : '$---'}
                    </p>
                    <p className="text-xs opacity-70">
                      {hasDiscount && price < giftValue ? (
                        <>Sells for <span className="font-semibold">${price.toFixed(2)}</span></>
                      ) : (
                        'Gift Card'
                      )}
                    </p>
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
          <div className="px-5 py-4 space-y-4">

            {/* Physical Card Mode */}
            {mode === 'physical' && (
              <div className="space-y-3">
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

                <div className="flex items-center gap-3 text-gray-400">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs">or enter manually</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

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
                  {cardCodeError && (
                    <p className="text-xs text-red-500 mt-1">{cardCodeError}</p>
                  )}
                </div>
              </div>
            )}

            {/* Digital Card Mode */}
            {mode === 'digital' && (
              <>
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
                          <span className="text-sm font-medium">{option.label}</span>
                          {isSelected && <Check size={14} className="ml-auto" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Collapsible open={recipientExpanded} onOpenChange={setRecipientExpanded}>
                  <CollapsibleTrigger className="flex items-center w-full py-2 text-left">
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      {recipientExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      Recipient Details
                      {deliveryMethod !== 'email' && (
                        <span className="text-gray-400 font-normal text-xs">(optional)</span>
                      )}
                      {deliveryMethod === 'email' && !recipientEmail && (
                        <span className="text-amber-500 text-xs">Required</span>
                      )}
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2.5 pt-2">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="Name"
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="email"
                        value={recipientEmail}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        placeholder={deliveryMethod === 'email' ? 'Email (required)' : 'Email'}
                        className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                          emailError ? 'border-red-300 bg-red-50' : 'border-gray-200'
                        }`}
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="tel"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        placeholder="Phone"
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible open={messageExpanded} onOpenChange={setMessageExpanded}>
                  <CollapsibleTrigger className="flex items-center w-full py-2 text-left">
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
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    />
                    <p className="text-xs text-gray-400 text-right mt-1">{message.length}/200</p>
                  </CollapsibleContent>
                </Collapsible>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-200/60 bg-white flex-shrink-0">
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
                {mode === 'physical' ? 'Activate' : 'Add'} ${giftValue > 0 ? giftValue : '—'} Gift Card
                {hasDiscount && price < giftValue && (
                  <span className="opacity-75">for ${price.toFixed(2)}</span>
                )}
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
