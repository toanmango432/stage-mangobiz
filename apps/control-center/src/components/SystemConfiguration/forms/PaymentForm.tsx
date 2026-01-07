/**
 * Payment Form Component
 * Form for adding new payment methods
 */

import { useState } from 'react';
import type { PaymentMethod } from '@/types';
import { PAYMENT_TYPES } from '../constants';

interface PaymentFormProps {
  payments: PaymentMethod[];
  onSave: (payment: Omit<PaymentMethod, 'id'>) => void;
  onCancel: () => void;
  saving: boolean;
}

export function PaymentForm({ payments, onSave, onCancel, saving }: PaymentFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<PaymentMethod['type']>('card');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onSave({ name, type, isActive: true, sortOrder: payments.length + 1 });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Method name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
          required
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as PaymentMethod['type'])}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          {PAYMENT_TYPES.map((pt) => (
            <option key={pt.value} value={pt.value}>{pt.label}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Add'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
