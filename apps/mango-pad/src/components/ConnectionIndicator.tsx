/**
 * Connection Indicator
 *
 * Small status indicator showing MQTT connection status.
 * Positioned in top-right corner of Pad screens.
 * Shows station name on tap/hover.
 *
 * Part of: Device Pairing System (US-009)
 */

import { useState } from 'react';
import { usePadMqtt } from '../providers/PadMqttProvider';
import { getPairingInfo } from '../services/pairingService';

interface ConnectionIndicatorProps {
  /** Optional additional class names */
  className?: string;
}

export function ConnectionIndicator({ className = '' }: ConnectionIndicatorProps) {
  const { isConnected, posConnection } = usePadMqtt();
  const [showTooltip, setShowTooltip] = useState(false);

  // Get pairing info for station name
  const pairingInfo = getPairingInfo();
  const stationName = pairingInfo?.stationName || posConnection.storeName || 'Unknown Station';

  // Determine connection status
  // Connected = MQTT connected AND receiving POS heartbeats
  const isFullyConnected = isConnected && posConnection.isConnected;

  const handleClick = () => {
    setShowTooltip(!showTooltip);
  };

  return (
    <div
      className={`relative ${className}`}
      onClick={handleClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Status pill */}
      <button
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
          transition-all duration-200 shadow-sm
          ${
            isFullyConnected
              ? 'bg-green-100 text-green-700 border border-green-200'
              : 'bg-red-100 text-red-700 border border-red-200'
          }
        `}
        type="button"
        aria-label={isFullyConnected ? 'Connected to POS' : 'Offline'}
      >
        {/* Status dot */}
        <span
          className={`
            w-2 h-2 rounded-full
            ${isFullyConnected ? 'bg-green-500' : 'bg-red-500'}
            ${isFullyConnected ? 'animate-pulse' : ''}
          `}
        />
        {/* Status text */}
        <span>{isFullyConnected ? 'Connected' : 'Offline'}</span>
      </button>

      {/* Tooltip with station name */}
      {showTooltip && (
        <div
          className="
            absolute top-full right-0 mt-2 px-3 py-2
            bg-gray-900 text-white text-sm rounded-lg shadow-lg
            whitespace-nowrap z-50
          "
        >
          <div className="text-xs text-gray-400 mb-0.5">Connected to</div>
          <div className="font-medium">{stationName}</div>
          {/* Tooltip arrow */}
          <div
            className="
              absolute -top-1.5 right-4
              w-3 h-3 bg-gray-900 rotate-45
            "
          />
        </div>
      )}
    </div>
  );
}

export default ConnectionIndicator;
