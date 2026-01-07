/**
 * Role Form Component
 * Form for adding new employee roles
 */

import { useState } from 'react';
import type { EmployeeRole } from '@/types';
import { COLOR_OPTIONS } from '../constants';

interface RoleFormProps {
  roles: EmployeeRole[];
  onSave: (role: Omit<EmployeeRole, 'id'>) => void;
  onCancel: () => void;
  saving: boolean;
}

export function RoleForm({ roles, onSave, onCancel, saving }: RoleFormProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_OPTIONS[5]);
  const [fullAccess, setFullAccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onSave({
      name,
      color,
      permissions: fullAccess ? ['all'] : ['create_ticket', 'checkout'],
      sortOrder: roles.length + 1,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
      <input
        type="text"
        placeholder="Role name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        required
      />
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
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={fullAccess}
          onChange={(e) => setFullAccess(e.target.checked)}
          className="w-4 h-4 text-purple-600 rounded"
        />
        <span className="text-sm text-gray-700">Full access (all permissions)</span>
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
