/**
 * Demo Banner Component (US-016)
 *
 * Shows a yellow banner at the top of screens when in demo mode.
 * Includes "Exit Demo" button to return to welcome page.
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, X } from 'lucide-react';

export function isDemoMode(): boolean {
  return localStorage.getItem('mango_pad_demo_mode') === 'true';
}

export function exitDemoMode(): void {
  localStorage.removeItem('mango_pad_demo_mode');
}

export function DemoBanner() {
  const navigate = useNavigate();

  const handleExitDemo = useCallback(() => {
    exitDemoMode();
    navigate('/welcome', { replace: true });
  }, [navigate]);

  if (!isDemoMode()) {
    return null;
  }

  return (
    <div className="bg-amber-400 text-amber-900 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Play className="w-4 h-4" />
        <span className="font-semibold text-sm">DEMO MODE</span>
        <span className="text-amber-800 text-sm">
          — Not connected to a real store
        </span>
      </div>
      <button
        onClick={handleExitDemo}
        className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-amber-900 text-sm font-medium rounded-lg transition-colors"
      >
        <X className="w-4 h-4" />
        Exit Demo
      </button>
    </div>
  );
}
