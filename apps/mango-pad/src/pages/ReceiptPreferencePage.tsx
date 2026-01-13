/**
 * ReceiptPreferencePage - Receipt Preference Selection Screen
 * US-015: Allows customers to choose how to receive their receipt
 *
 * Shows 4 options: Email, SMS, Print, No Receipt
 * Pre-fills email/phone from activeTransaction if available
 * Publishes preference and completes transaction via MQTT
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Smartphone, Printer, X, Pencil, Check, HelpCircle } from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import { setReceiptSelection } from '@/store/slices/transactionSlice';
import { usePadMqtt } from '@/providers/PadMqttProvider';
import { useTransactionNavigation } from '@/hooks/useTransactionNavigation';
import type { ReceiptPreference, ActiveTransaction } from '@/types';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Demo transaction data for testing without a live Store App connection
 */
const DEMO_TRANSACTION: Omit<ActiveTransaction, 'step' | 'startedAt'> = {
  transactionId: 'demo-receipt-preference-page',
  ticketId: 'ticket-demo-001',
  clientName: 'Sarah Johnson',
  clientEmail: 'sarah@example.com',
  clientPhone: '555-0123',
  staffName: 'Mike Chen',
  items: [
    { id: '1', name: 'Haircut & Style', staffName: 'Mike Chen', price: 45.00, quantity: 1, type: 'service' },
    { id: '2', name: 'Deep Conditioning', staffName: 'Mike Chen', price: 25.00, quantity: 1, type: 'service' },
    { id: '3', name: 'Premium Shampoo', staffName: 'Mike Chen', price: 18.99, quantity: 1, type: 'product' },
  ],
  subtotal: 88.99,
  tax: 7.12,
  discount: 0,
  total: 96.11,
  suggestedTips: [15, 18, 20, 25],
  tipAmount: 17.33, // 18% tip
  tipPercent: 18,
};

interface EditModalProps {
  type: 'email' | 'phone';
  value: string;
  onSave: (value: string) => void;
  onClose: () => void;
}

function EditModal({ type, value, onSave, onClose }: EditModalProps) {
  const [inputValue, setInputValue] = useState(value);

  const handleSave = () => {
    if (inputValue.trim()) {
      onSave(inputValue.trim());
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-modal-title"
        >
          <h3 id="edit-modal-title" className="text-xl font-semibold text-gray-800 mb-4">
            {type === 'email' ? 'Edit Email Address' : 'Edit Phone Number'}
          </h3>

          <input
            type={type === 'email' ? 'email' : 'tel'}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={type === 'email' ? 'Enter email address' : 'Enter phone number'}
            className="w-full text-xl p-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
            autoFocus
            aria-label={type === 'email' ? 'Email address' : 'Phone number'}
          />

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              aria-label="Cancel editing"
              className="flex-1 min-h-[56px] text-lg font-medium rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              aria-label={`Save ${type === 'email' ? 'email address' : 'phone number'}`}
              className="flex-1 min-h-[56px] text-lg font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" aria-hidden="true" />
              Save
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

interface ReceiptOptionProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  selected: boolean;
  onSelect: () => void;
  onEdit?: () => void;
  variant?: 'default' | 'none';
}

function ReceiptOption({
  icon,
  title,
  subtitle,
  selected,
  onSelect,
  onEdit,
  variant = 'default',
}: ReceiptOptionProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      aria-label={`Select ${title}${subtitle ? `, ${subtitle}` : ''}`}
      aria-pressed={selected}
      className={`w-full min-h-[80px] p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
        selected
          ? 'border-indigo-600 bg-indigo-50'
          : variant === 'none'
            ? 'border-gray-200 bg-gray-50 hover:border-gray-300'
            : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div
        className={`w-14 h-14 rounded-xl flex items-center justify-center ${
          selected
            ? 'bg-indigo-600 text-white'
            : variant === 'none'
              ? 'bg-gray-200 text-gray-500'
              : 'bg-gray-100 text-gray-600'
        }`}
      >
        {icon}
      </div>

      <div className="flex-1 text-left">
        <p
          className={`text-lg font-semibold ${
            selected ? 'text-indigo-700' : 'text-gray-800'
          }`}
        >
          {title}
        </p>
        {subtitle && (
          <p className="text-base text-gray-500 truncate">{subtitle}</p>
        )}
      </div>

      {onEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          aria-label={`Edit ${title.toLowerCase()}`}
          className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
        >
          <Pencil className="w-5 h-5" aria-hidden="true" />
        </button>
      )}

      {selected && (
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
          <Check className="w-5 h-5 text-white" aria-hidden="true" />
        </div>
      )}
    </motion.button>
  );
}

export function ReceiptPreferencePage() {
  const dispatch = useAppDispatch();
  const {
    activeTransaction,
    publishReceiptPreference,
    publishTransactionComplete,
    publishHelpRequested,
    updateTransactionStep,
  } = usePadMqtt();

  // Enable auto-navigation on transaction step changes
  useTransactionNavigation({ skipInitialNavigation: true });

  // Use activeTransaction from context, fallback to demo data for demo mode
  const transaction = activeTransaction ?? {
    ...DEMO_TRANSACTION,
    step: 'receipt_preference' as const,
    startedAt: new Date().toISOString(),
  };

  const [selectedPreference, setSelectedPreference] = useState<ReceiptPreference | null>(null);
  const [email, setEmail] = useState(transaction.clientEmail || '');
  const [phone, setPhone] = useState(transaction.clientPhone || '');
  const [editingField, setEditingField] = useState<'email' | 'phone' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate final total including tip
  const tipAmount = transaction.tipAmount ?? 0;
  const finalTotal = transaction.total + tipAmount;

  const handleSelectPreference = useCallback((preference: ReceiptPreference) => {
    setSelectedPreference(preference);
  }, []);

  const handleEditEmail = useCallback(() => {
    setEditingField('email');
  }, []);

  const handleEditPhone = useCallback(() => {
    setEditingField('phone');
  }, []);

  const handleSaveEdit = useCallback(
    (value: string) => {
      if (editingField === 'email') {
        setEmail(value);
      } else if (editingField === 'phone') {
        setPhone(value);
      }
      setEditingField(null);
    },
    [editingField]
  );

  const handleContinue = useCallback(async () => {
    if (!selectedPreference || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Update Redux state with receipt selection
      const receiptSelection = {
        preference: selectedPreference,
        email: selectedPreference === 'email' ? email : undefined,
        phone: selectedPreference === 'sms' ? phone : undefined,
        selectedAt: new Date().toISOString(),
      };
      dispatch(setReceiptSelection(receiptSelection));

      // Publish receipt preference to Store App
      await publishReceiptPreference({
        preference: selectedPreference,
        email: selectedPreference === 'email' ? email : undefined,
        phone: selectedPreference === 'sms' ? phone : undefined,
      });

      // Publish transaction complete to Store App
      await publishTransactionComplete();

      // Update step to waiting_payment and navigate to processing page
      updateTransactionStep('waiting_payment');
    } catch (error) {
      console.error('Failed to publish receipt preference:', error);
      setIsSubmitting(false);
    }
  }, [
    selectedPreference,
    email,
    phone,
    dispatch,
    publishReceiptPreference,
    publishTransactionComplete,
    updateTransactionStep,
    isSubmitting,
  ]);

  const handleNeedHelp = async () => {
    try {
      await publishHelpRequested('receipt');
    } catch (error) {
      console.error('Failed to publish help request:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col" role="main" id="main-content">
      {/* Header */}
      <header className="p-6 bg-white border-b border-gray-100 shadow-sm" role="banner">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-2xl font-bold text-gray-900">
            How Would You Like Your Receipt?
          </h1>
          <p className="text-lg text-gray-500 mt-1">
            Total: {formatCurrency(finalTotal)}
          </p>
        </motion.div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-lg mx-auto space-y-4"
          role="group"
          aria-label="Receipt delivery options"
        >
          {/* Email Option */}
          <ReceiptOption
            icon={<Mail className="w-7 h-7" aria-hidden="true" />}
            title="Email Receipt"
            subtitle={email || 'No email on file'}
            selected={selectedPreference === 'email'}
            onSelect={() => handleSelectPreference('email')}
            onEdit={handleEditEmail}
          />

          {/* SMS Option */}
          <ReceiptOption
            icon={<Smartphone className="w-7 h-7" aria-hidden="true" />}
            title="Text Receipt"
            subtitle={phone || 'No phone on file'}
            selected={selectedPreference === 'sms'}
            onSelect={() => handleSelectPreference('sms')}
            onEdit={handleEditPhone}
          />

          {/* Print Option */}
          <ReceiptOption
            icon={<Printer className="w-7 h-7" aria-hidden="true" />}
            title="Print Receipt"
            subtitle="Print at counter"
            selected={selectedPreference === 'print'}
            onSelect={() => handleSelectPreference('print')}
          />

          {/* No Receipt Option */}
          <ReceiptOption
            icon={<X className="w-7 h-7" aria-hidden="true" />}
            title="No Receipt"
            selected={selectedPreference === 'none'}
            onSelect={() => handleSelectPreference('none')}
            variant="none"
          />
        </motion.div>
      </main>

      {/* Footer Actions */}
      <footer className="p-6 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col gap-4"
        >
          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={!selectedPreference || isSubmitting}
            aria-label={
              !selectedPreference
                ? 'Please select a receipt option to continue'
                : isSubmitting
                  ? 'Processing...'
                  : `Continue with ${selectedPreference} receipt`
            }
            aria-disabled={!selectedPreference || isSubmitting}
            className={`w-full min-h-[64px] text-xl font-semibold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 ${
              selectedPreference && !isSubmitting
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 active:scale-[0.98]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Check className="w-6 h-6" aria-hidden="true" />
                <span>Complete</span>
              </>
            )}
          </button>

          {/* Need Help */}
          <button
            onClick={handleNeedHelp}
            aria-label="Request assistance from staff"
            className="w-full min-h-[56px] bg-orange-50 text-orange-700 text-lg font-medium rounded-xl hover:bg-orange-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <HelpCircle className="w-5 h-5" aria-hidden="true" />
            <span>Need Help</span>
          </button>
        </motion.div>
      </footer>

      {/* Edit Modal */}
      {editingField && (
        <EditModal
          type={editingField}
          value={editingField === 'email' ? email : phone}
          onSave={handleSaveEdit}
          onClose={() => setEditingField(null)}
        />
      )}
    </div>
  );
}
