/**
 * ReceiptPage - Receipt Selection Screen
 * US-008: Allows clients to choose how to receive their receipt
 */

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Mail, Smartphone, Printer, X, Pencil, Check } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setScreen } from '@/store/slices/padSlice';
import { setReceiptSelection } from '@/store/slices/transactionSlice';
import { usePadMqtt } from '@/providers/PadMqttProvider';
import { formatCurrency } from '@/utils/formatting';
import type { ReceiptPreference } from '@/types';

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          {type === 'email' ? 'Edit Email Address' : 'Edit Phone Number'}
        </h3>

        <input
          type={type === 'email' ? 'email' : 'tel'}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={type === 'email' ? 'Enter email address' : 'Enter phone number'}
          className="w-full text-xl p-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
          autoFocus
        />

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 min-h-[56px] text-lg font-medium rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 min-h-[56px] text-lg font-semibold rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            Save
          </button>
        </div>
      </motion.div>
    </motion.div>
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

function getButtonStyles(selected: boolean, variant: 'default' | 'none'): string {
  if (selected) {
    return 'border-indigo-500 bg-indigo-50';
  }
  if (variant === 'none') {
    return 'border-gray-200 bg-gray-50 hover:border-gray-300';
  }
  return 'border-gray-200 bg-white hover:border-gray-300';
}

function getIconStyles(selected: boolean, variant: 'default' | 'none'): string {
  if (selected) {
    return 'bg-indigo-500 text-white';
  }
  if (variant === 'none') {
    return 'bg-gray-200 text-gray-500';
  }
  return 'bg-gray-100 text-gray-600';
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
      className={`w-full min-h-[80px] p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${getButtonStyles(selected, variant)}`}
    >
      <div
        className={`w-14 h-14 rounded-xl flex items-center justify-center ${getIconStyles(selected, variant)}`}
      >
        {icon}
      </div>

      <div className="flex-1 text-left">
        <p className={`text-lg font-semibold ${selected ? 'text-indigo-700' : 'text-gray-800'}`}>
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
          className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
          aria-label="Edit"
        >
          <Pencil className="w-5 h-5" />
        </button>
      )}

      {selected && (
        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
          <Check className="w-5 h-5 text-white" />
        </div>
      )}
    </motion.button>
  );
}

export function ReceiptPage() {
  const dispatch = useAppDispatch();
  const transaction = useAppSelector((state) => state.transaction.current);
  const tip = useAppSelector((state) => state.transaction.tip);
  const { publishReceiptPreference } = usePadMqtt();

  const [selectedPreference, setSelectedPreference] =
    useState<ReceiptPreference | null>(null);
  const [email, setEmail] = useState(transaction?.clientEmail || '');
  const [phone, setPhone] = useState(transaction?.clientPhone || '');
  const [editingField, setEditingField] = useState<'email' | 'phone' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tipAmount = tip?.tipAmount ?? 0;
  const finalTotal = transaction ? transaction.total + tipAmount : 0;

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

    const receiptSelection = {
      preference: selectedPreference,
      email: selectedPreference === 'email' ? email : undefined,
      phone: selectedPreference === 'sms' ? phone : undefined,
      selectedAt: new Date().toISOString(),
    };

    dispatch(setReceiptSelection(receiptSelection));

    await publishReceiptPreference({
      preference: selectedPreference,
      email: selectedPreference === 'email' ? email : undefined,
      phone: selectedPreference === 'sms' ? phone : undefined,
    });

    dispatch(setScreen('thank-you'));
  }, [selectedPreference, email, phone, dispatch, publishReceiptPreference, isSubmitting]);

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl text-gray-500">No transaction data</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 p-6 shadow-sm">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-2xl font-bold text-gray-800">
            How Would You Like Your Receipt?
          </h1>
          <p className="text-lg text-gray-500 mt-1">
            Total: {formatCurrency(finalTotal)}
          </p>
        </motion.div>
      </header>

      {/* Options */}
      <main className="flex-1 p-6 overflow-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="max-w-lg mx-auto space-y-4"
        >
          {/* Email Option */}
          <ReceiptOption
            icon={<Mail className="w-7 h-7" />}
            title="Email Receipt"
            subtitle={email || 'No email on file'}
            selected={selectedPreference === 'email'}
            onSelect={() => handleSelectPreference('email')}
            onEdit={handleEditEmail}
          />

          {/* SMS Option */}
          <ReceiptOption
            icon={<Smartphone className="w-7 h-7" />}
            title="Text Receipt"
            subtitle={phone || 'No phone on file'}
            selected={selectedPreference === 'sms'}
            onSelect={() => handleSelectPreference('sms')}
            onEdit={handleEditPhone}
          />

          {/* Print Option */}
          <ReceiptOption
            icon={<Printer className="w-7 h-7" />}
            title="Print Receipt"
            subtitle="Print at counter"
            selected={selectedPreference === 'print'}
            onSelect={() => handleSelectPreference('print')}
          />

          {/* No Receipt Option */}
          <ReceiptOption
            icon={<X className="w-7 h-7" />}
            title="No Receipt"
            selected={selectedPreference === 'none'}
            onSelect={() => handleSelectPreference('none')}
            variant="none"
          />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="p-6 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleContinue}
          disabled={!selectedPreference || isSubmitting}
          className={`w-full min-h-[64px] text-xl font-semibold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 ${
            selectedPreference && !isSubmitting
              ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700 active:scale-[0.98]'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <span>Sending...</span>
          ) : (
            <span>Continue</span>
          )}
        </motion.button>
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
