import React, { useState } from 'react';
import { Coffee, Play } from 'lucide-react';
import type { BreakButtonProps } from '../types';

/**
 * Break management button component
 * Shows break options (paid/unpaid) or end break button based on current state
 */
export const BreakButton: React.FC<BreakButtonProps> = ({
  isOnBreak,
  isLoading,
  disabled,
  onStartBreak,
  onEndBreak,
}) => {
  const [showBreakOptions, setShowBreakOptions] = useState(false);

  if (isOnBreak) {
    return (
      <button
        onClick={onEndBreak}
        disabled={isLoading}
        className={`
          flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl
          font-medium transition-all duration-300
          bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700
          text-white shadow-md
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <Play className="w-5 h-5" />
            End Break
          </>
        )}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowBreakOptions(!showBreakOptions)}
        disabled={disabled || isLoading}
        className={`
          flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl
          font-medium transition-all duration-300
          ${disabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white shadow-md'
          }
        `}
      >
        <Coffee className="w-5 h-5" />
        Take Break
      </button>

      {showBreakOptions && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-10">
          <button
            onClick={() => {
              onStartBreak('paid');
              setShowBreakOptions(false);
            }}
            className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-medium">Paid Break</span>
          </button>
          <button
            onClick={() => {
              onStartBreak('unpaid');
              setShowBreakOptions(false);
            }}
            className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-t border-gray-100"
          >
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="font-medium">Unpaid Break</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default BreakButton;
