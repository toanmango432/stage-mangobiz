import { Smartphone, Wifi, WifiOff } from 'lucide-react';
import { useEffect } from 'react';
import { usePadMqtt, usePosConnection } from '../providers/PadMqttProvider';

export function WaitingPage() {
  const { setCurrentScreen } = usePadMqtt();
  const posConnection = usePosConnection();

  // Update current screen for heartbeat
  useEffect(() => {
    setCurrentScreen('waiting');
  }, [setCurrentScreen]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex flex-col items-center justify-center p-8">
      {/* Logo/Brand */}
      <div className="mb-8">
        <div className="w-24 h-24 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
          <Smartphone className="w-12 h-12 text-white" />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
        Mango Pad
      </h1>
      <p className="text-gray-600 text-lg mb-12 text-center">
        Ready for your transaction
      </p>

      {/* Animated dots indicator */}
      <div className="flex space-x-2">
        <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>

      {/* Status text */}
      <p className="text-gray-500 text-sm mt-8">
        {posConnection.isConnected
          ? 'Waiting for receipt from POS...'
          : 'Waiting for POS connection...'}
      </p>

      {/* Connection status */}
      <div className="absolute bottom-8 flex items-center text-sm">
        {posConnection.isConnected ? (
          <>
            <Wifi className="w-4 h-4 text-green-500 mr-2" />
            <span className="text-green-600 font-medium">
              POS Connected
            </span>
            {posConnection.storeName && (
              <span className="text-gray-400 ml-1">
                • {posConnection.storeName}
              </span>
            )}
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-gray-500">
              POS Offline
            </span>
          </>
        )}
      </div>
    </div>
  );
}
