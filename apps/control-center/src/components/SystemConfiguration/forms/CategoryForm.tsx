/**
 * Category Form Component
 * Form for adding new service categories
 */

import { useState } from 'react';
import type { ServiceCategory } from '@/types';
import { EMOJI_OPTIONS, COLOR_OPTIONS } from '../constants';

interface CategoryFormProps {
  categories: ServiceCategory[];
  onSave: (category: Omit<ServiceCategory, 'id'>) => void;
  onCancel: () => void;
  saving: boolean;
}

export function CategoryForm({ categories, onSave, onCancel, saving }: CategoryFormProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(EMOJI_OPTIONS[0]);
  const [color, setColor] = useState(COLOR_OPTIONS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onSave({ name, icon, color, sortOrder: categories.length + 1 });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
      <input
        type="text"
        placeholder="Category name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        required
      />
      <div>
        <label className="text-sm text-gray-600 mb-1 block">Icon</label>
        <div className="flex flex-wrap gap-2">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setIcon(emoji)}
              className={`w-10 h-10 text-xl rounded-lg border-2 ${icon === emoji ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm text-gray-600 mb-1 block">Color</label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-lg border-2 ${color === c ? 'border-gray-900' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
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
