/**
 * Payment Edit Modal Component
 * Modal for editing existing payment methods
 */

import { useState } from 'react';
import type { PaymentMethod } from '@/types';
import { PAYMENT_TYPES } from '../constants';

interface PaymentEditModalProps {
  payment: PaymentMethod;
  onSave: (updates: Partial<PaymentMethod>) => void;
  onClose: () => void;
  saving: boolean;
}

export function PaymentEditModal({ payment, onSave, onClose, saving }: PaymentEditModalProps) {
  const [name, setName] = useState(payment.name);
  const [type, setType] = useState(payment.type);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-bold mb-4">Edit Payment Method</h3>
        <div className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as PaymentMethod['type'])}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            {PAYMENT_TYPES.map((pt) => (
              <option key={pt.value} value={pt.value}>{pt.label}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onSave({ name, type })}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
