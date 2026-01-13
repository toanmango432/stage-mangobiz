/**
 * UnpairHandler Component (US-013)
 * Handles navigation when Store App unpairs this device.
 *
 * This component must be placed inside BrowserRouter to use useNavigate.
 * It listens for unpairReceived from PadMqttContext and navigates to welcome page.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUnpairEvent } from '../providers/PadMqttProvider';

interface UnpairToastProps {
  message: string;
  onClose: () => void;
}

function UnpairToast({ message, onClose }: UnpairToastProps) {
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
      <div className="bg-amber-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 hover:opacity-80 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function UnpairHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const { unpairReceived, clearUnpairReceived } = useUnpairEvent();
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (unpairReceived) {
      console.log('[UnpairHandler] Unpair received, navigating to welcome page');

      // Clear the flag first
      clearUnpairReceived();

      // Show toast notification
      setShowToast(true);

      // Hide toast after 4 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 4000);

      // Navigate to welcome page (unless already there)
      if (location.pathname !== '/welcome') {
        navigate('/welcome', { replace: true });
      }
    }
  }, [unpairReceived, clearUnpairReceived, navigate, location.pathname]);

  if (!showToast) return null;

  return (
    <UnpairToast
      message="Device unpaired by store"
      onClose={() => setShowToast(false)}
    />
  );
}
