/**
 * Tax Edit Modal Component
 * Modal for editing existing tax settings
 */

import { useState } from 'react';
import type { TaxSetting } from '@/types';

interface TaxEditModalProps {
  tax: TaxSetting;
  onSave: (updates: Partial<TaxSetting>) => void;
  onClose: () => void;
  saving: boolean;
}

export function TaxEditModal({ tax, onSave, onClose, saving }: TaxEditModalProps) {
  const [name, setName] = useState(tax.name);
  const [rate, setRate] = useState(tax.rate.toString());
  const [isDefault, setIsDefault] = useState(tax.isDefault);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-bold mb-4">Edit Tax Rate</h3>
        <div className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded"
            />
            <span className="text-sm">Default tax</span>
          </label>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onSave({ name, rate: parseFloat(rate), isDefault })}
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
