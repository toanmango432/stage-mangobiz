import { X, Info } from 'lucide-react';

interface TurnQueueSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TurnQueueConfig;
  onSave: (settings: TurnQueueConfig) => void;
}

export interface TurnQueueConfig {
  mode: 'manual' | 'auto';
  autoAssignmentFactors: {
    serviceTypeMatch: number; // 0-100
    rotationFairness: number; // 0-100
    lastServiceTime: number; // 0-100
    preferenceMatching: number; // 0-100
  };
  minimumTimeBetweenServices: number; // minutes
  enableSpecialtyPriority: boolean;
  enableClientPreferences: boolean;
}

export const defaultTurnQueueConfig: TurnQueueConfig = {
  mode: 'manual',
  autoAssignmentFactors: {
    serviceTypeMatch: 40,
    rotationFairness: 30,
    lastServiceTime: 20,
    preferenceMatching: 10,
  },
  minimumTimeBetweenServices: 5,
  enableSpecialtyPriority: true,
  enableClientPreferences: true,
};

export function TurnQueueSettings({ isOpen, onClose, settings, onSave }: TurnQueueSettingsProps) {
  if (!isOpen) return null;

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Turn Queue Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Mode Selection */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Queue Mode</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onSave({ ...settings, mode: 'manual' })}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  settings.mode === 'manual'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-900 mb-1">Manual Mode</div>
                <div className="text-xs text-gray-600">
                  Staff manually controls turn order. Drag and drop to reorder.
                </div>
              </button>
              <button
                onClick={() => onSave({ ...settings, mode: 'auto' })}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  settings.mode === 'auto'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-900 mb-1">Auto Mode</div>
                <div className="text-xs text-gray-600">
                  System automatically assigns based on rules and factors below.
                </div>
              </button>
            </div>
          </div>

          {/* Auto Assignment Factors (only show in auto mode) */}
          {settings.mode === 'auto' && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Auto-Assignment Factors</h3>
                <div className="group relative">
                  <Info className="w-4 h-4 text-gray-400 cursor-help" />
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded-lg">
                    Adjust the weight of each factor. Higher values = more influence on assignment.
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Service Type Match */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-700">Service Type Match</label>
                    <span className="text-sm font-semibold text-gray-900">
                      {settings.autoAssignmentFactors.serviceTypeMatch}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.autoAssignmentFactors.serviceTypeMatch}
                    onChange={(e) =>
                      onSave({
                        ...settings,
                        autoAssignmentFactors: {
                          ...settings.autoAssignmentFactors,
                          serviceTypeMatch: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Prioritize staff with matching specialty
                  </p>
                </div>

                {/* Rotation Fairness */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-700">Rotation Fairness</label>
                    <span className="text-sm font-semibold text-gray-900">
                      {settings.autoAssignmentFactors.rotationFairness}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.autoAssignmentFactors.rotationFairness}
                    onChange={(e) =>
                      onSave({
                        ...settings,
                        autoAssignmentFactors: {
                          ...settings.autoAssignmentFactors,
                          rotationFairness: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Balance service count across all staff
                  </p>
                </div>

                {/* Last Service Time */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-700">Last Service Time</label>
                    <span className="text-sm font-semibold text-gray-900">
                      {settings.autoAssignmentFactors.lastServiceTime}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.autoAssignmentFactors.lastServiceTime}
                    onChange={(e) =>
                      onSave({
                        ...settings,
                        autoAssignmentFactors: {
                          ...settings.autoAssignmentFactors,
                          lastServiceTime: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Prioritize staff with longer idle time
                  </p>
                </div>

                {/* Preference Matching */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-700">Client Preference Matching</label>
                    <span className="text-sm font-semibold text-gray-900">
                      {settings.autoAssignmentFactors.preferenceMatching}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.autoAssignmentFactors.preferenceMatching}
                    onChange={(e) =>
                      onSave({
                        ...settings,
                        autoAssignmentFactors: {
                          ...settings.autoAssignmentFactors,
                          preferenceMatching: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Match client's preferred staff from history
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Additional Settings */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Additional Settings</h3>
            <div className="space-y-3">
              {/* Minimum Time Between Services */}
              <div>
                <label className="text-sm text-gray-700 block mb-2">
                  Minimum Time Between Services
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={settings.minimumTimeBetweenServices}
                    onChange={(e) =>
                      onSave({
                        ...settings,
                        minimumTimeBetweenServices: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <span className="text-sm text-gray-600">minutes</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Buffer time for staff between services
                </p>
              </div>

              {/* Enable Specialty Priority */}
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.enableSpecialtyPriority}
                  onChange={(e) =>
                    onSave({
                      ...settings,
                      enableSpecialtyPriority: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    Enable Specialty Priority
                  </div>
                  <div className="text-xs text-gray-600">
                    Prioritize staff with matching service specialties
                  </div>
                </div>
              </label>

              {/* Enable Client Preferences */}
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.enableClientPreferences}
                  onChange={(e) =>
                    onSave({
                      ...settings,
                      enableClientPreferences: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    Enable Client Preferences
                  </div>
                  <div className="text-xs text-gray-600">
                    Consider client's preferred staff from history
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-pink-500 hover:shadow-md rounded-lg transition-all"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
