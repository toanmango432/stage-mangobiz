/**
 * Device Mode Selector
 *
 * Allows users to select between online-only and offline-enabled mode
 * during device registration or in settings.
 */

import { useState } from 'react';
import { Cloud, CloudOff, Check, AlertCircle, Loader2 } from 'lucide-react';
import type { DeviceMode, DevicePolicy } from '@/types/device';

interface DeviceModeSelectorProps {
  /** Currently selected mode */
  value: DeviceMode;
  /** Called when mode changes */
  onChange: (mode: DeviceMode) => void;
  /** Store's device policy */
  policy?: DevicePolicy | null;
  /** Whether selection is disabled */
  disabled?: boolean;
  /** Whether in loading state */
  loading?: boolean;
  /** Show detailed descriptions */
  showDescriptions?: boolean;
  /** Current offline device count (for policy enforcement) */
  currentOfflineCount?: number;
}

export function DeviceModeSelector({
  value,
  onChange,
  policy,
  disabled = false,
  loading = false,
  showDescriptions = true,
  currentOfflineCount = 0,
}: DeviceModeSelectorProps) {
  const [hoveredMode, setHoveredMode] = useState<DeviceMode | null>(null);

  // Check if offline mode is allowed
  const offlineAllowed =
    !policy ||
    policy.allowUserOverride ||
    policy.defaultMode === 'offline-enabled';

  // Check if max offline devices reached
  const maxOfflineReached =
    policy && currentOfflineCount >= policy.maxOfflineDevices;

  // Determine if offline option should be disabled
  const offlineDisabled =
    disabled ||
    loading ||
    (!offlineAllowed && value !== 'offline-enabled') ||
    (maxOfflineReached && value !== 'offline-enabled');

  const options: {
    mode: DeviceMode;
    icon: typeof Cloud;
    title: string;
    description: string;
    benefits: string[];
  }[] = [
    {
      mode: 'online-only',
      icon: Cloud,
      title: 'Online Only',
      description: 'Requires internet connection to operate',
      benefits: [
        'Real-time data sync',
        'No local storage used',
        'Always up-to-date',
        'Easier device management',
      ],
    },
    {
      mode: 'offline-enabled',
      icon: CloudOff,
      title: 'Offline-Enabled',
      description: 'Works without internet, syncs when online',
      benefits: [
        'Works without internet',
        'Data stored locally',
        'Syncs when connected',
        'Continuous operation',
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {/* Mode options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((option) => {
          const isSelected = value === option.mode;
          const isDisabled =
            option.mode === 'offline-enabled' ? offlineDisabled : disabled || loading;
          const Icon = option.icon;

          return (
            <button
              key={option.mode}
              type="button"
              onClick={() => !isDisabled && onChange(option.mode)}
              onMouseEnter={() => setHoveredMode(option.mode)}
              onMouseLeave={() => setHoveredMode(null)}
              disabled={isDisabled}
              className={`
                relative p-4 rounded-xl border-2 text-left transition-all
                ${
                  isSelected
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}

              {/* Loading indicator */}
              {loading && isSelected && (
                <div className="absolute top-3 right-3">
                  <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                </div>
              )}

              {/* Content */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-orange-500' : 'bg-gray-100'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-600'}`}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{option.title}</h3>
                    <p className="text-sm text-gray-500">{option.description}</p>
                  </div>
                </div>

                {/* Benefits (shown on hover or always if showDescriptions) */}
                {(showDescriptions || hoveredMode === option.mode) && (
                  <ul className="space-y-1.5 pt-2 border-t border-gray-100">
                    {option.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Policy warnings */}
      {!offlineAllowed && value !== 'offline-enabled' && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">Offline mode restricted</p>
            <p>Your store administrator has disabled offline mode for new devices.</p>
          </div>
        </div>
      )}

      {maxOfflineReached && value !== 'offline-enabled' && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">Maximum offline devices reached</p>
            <p>
              Your store has reached the limit of {policy?.maxOfflineDevices} offline-enabled
              devices. Contact your administrator to enable offline mode.
            </p>
          </div>
        </div>
      )}

      {/* Policy info */}
      {policy && (
        <div className="text-xs text-gray-500 text-center">
          Store policy: {policy.maxOfflineDevices} max offline devices •{' '}
          {policy.offlineGraceDays} day offline grace period
        </div>
      )}
    </div>
  );
}

export default DeviceModeSelector;
