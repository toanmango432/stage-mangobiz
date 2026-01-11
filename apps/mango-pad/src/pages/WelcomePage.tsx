/**
 * Welcome Page
 *
 * First screen shown when Mango Pad is launched without pairing.
 * Allows user to pair with a store or try demo mode.
 *
 * Part of: Device Pairing System (US-005)
 */

import { useNavigate } from 'react-router-dom';
import { Tablet, Link, Play } from 'lucide-react';
import { isPaired } from '../services/pairingService';

// Re-export isPaired for use in App.tsx routing
export { isPaired };

export function WelcomePage() {
  const navigate = useNavigate();

  const handlePairWithStore = () => {
    navigate('/pair');
  };

  const handleTryDemo = () => {
    // Set demo mode flag and go to waiting page
    localStorage.setItem('mango_pad_demo_mode', 'true');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex flex-col items-center justify-center p-8">
      {/* Logo */}
      <div className="mb-8">
        <div className="w-32 h-32 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-xl">
          <Tablet className="w-16 h-16 text-white" />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-4xl font-bold text-gray-800 mb-3 text-center">
        Welcome to Mango Pad
      </h1>
      <p className="text-gray-600 text-lg mb-12 text-center max-w-md">
        Your customer-facing display for signatures, tips, and receipts
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 w-full max-w-sm">
        {/* Primary: Pair with Store */}
        <button
          onClick={handlePairWithStore}
          className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-orange-500 hover:bg-orange-600 text-white text-lg font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Link className="w-6 h-6" />
          Pair with Store
        </button>

        {/* Secondary: Try Demo Mode */}
        <button
          onClick={handleTryDemo}
          className="flex items-center justify-center gap-3 w-full py-3 px-6 bg-white hover:bg-gray-50 text-gray-700 text-base font-medium rounded-xl border-2 border-gray-200 shadow-sm transition-all duration-200"
        >
          <Play className="w-5 h-5" />
          Try Demo Mode
        </button>
      </div>

      {/* Footer info */}
      <p className="text-gray-400 text-sm mt-16 text-center">
        Pair with your checkout station to start accepting payments
      </p>
    </div>
  );
}
