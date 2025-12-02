import { useState } from 'react';
import { RotateCw, DollarSign, RefreshCw } from 'lucide-react';
import { ModalContainer } from '../common';

interface TurnSettingsPanelProps {
  onClose: () => void;
}

export function TurnSettingsPanel({ onClose }: TurnSettingsPanelProps) {
  const [autoRotation, setAutoRotation] = useState(true);
  const [turnLimit, setTurnLimit] = useState(500);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReset = () => {
    // TODO: Implement reset logic
    console.log('Resetting turn tracker');
    setShowResetConfirm(false);
  };

  const handleSave = () => {
    // TODO: Implement save logic
    console.log('Saving settings:', { autoRotation, turnLimit });
    onClose();
  };

  return (
    <ModalContainer
      isOpen={true}
      onClose={onClose}
      title="Turn Settings"
      size="sm"
      position="right"
      containerClassName="z-[90]"
      backdropClassName="z-[80]"
    >
      <div className="space-y-6">
        {/* Auto-rotation toggle */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCw className="w-5 h-5 text-blue-600" aria-hidden="true" />
              <span id="auto-rotation-label" className="font-semibold text-gray-900">Auto-rotation</span>
            </div>
            <button
              onClick={() => setAutoRotation(!autoRotation)}
              role="switch"
              aria-checked={autoRotation}
              aria-labelledby="auto-rotation-label"
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoRotation ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoRotation ? 'translate-x-6' : 'translate-x-1'
                }`}
                aria-hidden="true"
              />
            </button>
          </div>
          <p className="text-sm text-gray-500 ml-7">
            Automatically rotate staff after completing a service
          </p>
        </div>

        {/* Turn limit input */}
        <div className="space-y-2">
          <label htmlFor="turn-limit" className="flex items-center gap-2 font-semibold text-gray-900">
            <DollarSign className="w-5 h-5 text-green-600" aria-hidden="true" />
            Turn Limit
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" aria-hidden="true">$</span>
            <input
              id="turn-limit"
              type="number"
              value={turnLimit}
              onChange={(e) => setTurnLimit(parseFloat(e.target.value) || 0)}
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
              step="10"
              min="0"
              aria-describedby="turn-limit-desc"
            />
          </div>
          <p id="turn-limit-desc" className="text-sm text-gray-500">
            Maximum amount before requiring a turn
          </p>
        </div>

        {/* Reset button */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 font-semibold text-gray-900">
            <RefreshCw className="w-5 h-5 text-orange-600" />
            Reset Turn Tracker
          </label>
          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full py-2 px-4 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors font-medium"
            >
              Reset All Turns
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-red-600 font-medium">
                Are you sure? This will reset all turn data.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          <p className="text-sm text-gray-500">
            Clear all turn history and start fresh
          </p>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-200 space-y-2">
          <button
            onClick={handleSave}
            className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Save Settings
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </ModalContainer>
  );
}
