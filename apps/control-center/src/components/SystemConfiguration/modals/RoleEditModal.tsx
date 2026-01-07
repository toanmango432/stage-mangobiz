/**
 * Role Edit Modal Component
 * Modal for editing existing employee roles
 */

import { useState } from 'react';
import type { EmployeeRole } from '@/types';
import { COLOR_OPTIONS } from '../constants';

interface RoleEditModalProps {
  role: EmployeeRole;
  onSave: (updates: Partial<EmployeeRole>) => void;
  onClose: () => void;
  saving: boolean;
}

export function RoleEditModal({ role, onSave, onClose, saving }: RoleEditModalProps) {
  const [name, setName] = useState(role.name);
  const [color, setColor] = useState(role.color);
  const [fullAccess, setFullAccess] = useState(role.permissions.includes('all'));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-bold mb-4">Edit Role</h3>
        <div className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
            <span className="text-sm">Full access</span>
          </label>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onSave({
              name,
              color,
              permissions: fullAccess ? ['all'] : ['create_ticket', 'checkout'],
            })}
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
