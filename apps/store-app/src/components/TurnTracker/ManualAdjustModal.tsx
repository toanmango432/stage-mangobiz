import { useState } from 'react';
import { ModalContainer } from '../common';
import { StaffTurnData } from './types';

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
    <ModalContainer
      isOpen={true}
      onClose={onClose}
      title={`Adjust Turn for ${staff.name}`}
      size="sm"
      containerClassName="z-[90]"
      backdropClassName="z-[80]"
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="turn-amount" className="block text-sm font-medium text-gray-700 mb-2">
            Turn Amount
          </label>
          <input
            id="turn-amount"
            type="number"
            value={turnAmount}
            onChange={(e) => setTurnAmount(Number(e.target.value))}
            step="0.5"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>

        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">
            Reason
          </legend>
          <div className="space-y-2" role="radiogroup" aria-label="Select reason">
            {reasons.map((r, index) => (
              <label key={r} className="flex items-center gap-2 cursor-pointer">
                <input
                  id={`reason-${index}`}
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
              id="custom-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Type reason"
              aria-label="Custom reason"
              className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          )}
        </fieldset>

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
    </ModalContainer>
  );
}
