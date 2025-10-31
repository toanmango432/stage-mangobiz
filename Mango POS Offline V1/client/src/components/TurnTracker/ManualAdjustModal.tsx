import { useState } from 'react';
import { X } from 'lucide-react';
import { StaffTurnData } from './TurnTracker';

interface ManualAdjustModalProps {
  staff: StaffTurnData;
  onClose: () => void;
  onSave: (turnAmount: number, reason: string) => void;
}

export function ManualAdjustModal({ staff, onClose, onSave }: ManualAdjustModalProps) {
  const [turnAmount, setTurnAmount] = useState(1);
  const [reason, setReason] = useState('');
  const [selectedReason, setSelectedReason] = useState('');

  const reasons = [
    'Skip Turn',
    'Appointment/Request',
    'System Testing',
    'Late',
    'Other reason',
  ];

  const handleSave = () => {
    const finalReason = selectedReason === 'Other reason' ? reason : selectedReason;
    if (!finalReason) {
      alert('Please select or enter a reason');
      return;
    }
    onSave(turnAmount, finalReason);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[80]" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-[90] p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-bold">Adjust Turn for {staff.name}</h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Turn Amount
              </label>
              <input
                type="number"
                value={turnAmount}
                onChange={(e) => setTurnAmount(Number(e.target.value))}
                step="0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason
              </label>
              <div className="space-y-2">
                {reasons.map((r) => (
                  <label key={r} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="reason"
                      value={r}
                      checked={selectedReason === r}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="text-sm">{r}</span>
                  </label>
                ))}
              </div>
              {selectedReason === 'Other reason' && (
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Type reason"
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={() => {
                  setTurnAmount(-Math.abs(turnAmount));
                  handleSave();
                }}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
              >
                SUBTRACT
              </button>
              <button
                onClick={() => {
                  setTurnAmount(Math.abs(turnAmount));
                  handleSave();
                }}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
              >
                ADD
              </button>
            </div>

            <button
              onClick={handleSave}
              className="w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors"
            >
              SAVE
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
