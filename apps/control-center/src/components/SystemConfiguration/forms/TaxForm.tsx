/**
 * Tax Form Component
 * Form for adding new tax settings
 */

import { useState } from 'react';
import type { TaxSetting } from '@/types';

interface TaxFormProps {
  onSave: (tax: Omit<TaxSetting, 'id'>) => void;
  onCancel: () => void;
  saving: boolean;
}

export function TaxForm({ onSave, onCancel, saving }: TaxFormProps) {
  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !rate) return;
    onSave({ name, rate: parseFloat(rate), isDefault });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Tax name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
          required
        />
        <input
          type="number"
          placeholder="Rate %"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          step="0.01"
          min="0"
          max="100"
          className="px-3 py-2 border border-gray-300 rounded-lg"
          required
        />
      </div>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          className="w-4 h-4 text-purple-600 rounded"
        />
        <span className="text-sm text-gray-700">Set as default tax</span>
      </label>
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
