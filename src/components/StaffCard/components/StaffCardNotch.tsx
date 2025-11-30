/**
 * StaffCardNotch Component
 * Displays status indicator and progress information at top of card
 */

import React from 'react';
import { Check, Minus, Clock } from 'lucide-react';
import { getProgressColor, getProgressGradient } from '../constants/staffCardTokens';
import { formatProgress, formatMinutes } from '../utils/formatters';

interface CurrentTicketInfo {
  timeLeft: number;
  totalTime: number;
  progress: number;
  startTime: string;
  serviceName?: string;
  clientName?: string;
}

interface StaffCardNotchProps {
  status: 'ready' | 'busy' | 'off';
  ticketInfo?: CurrentTicketInfo;
  notchWidth: string;
  notchHeight: string;
  isUltra: boolean;
}

export const StaffCardNotch = React.memo<StaffCardNotchProps>(
  ({ status, ticketInfo, notchWidth, notchHeight, isUltra }) => {
    const isBusy = status === 'busy';
    const isReady = status === 'ready';

    return (
      <div
        className="absolute top-0 left-1/2 transform -translate-x-1/2 z-30 transition-all duration-300"
        style={{
          width: notchWidth,
          height: notchHeight,
        }}
      >
        {/* Notch Shape - Jewel Effect */}
        <div
          className="absolute inset-0 rounded-b-2xl shadow-md border-b border-l border-r border-white/50 backdrop-blur-md"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(255,255,255,0.8))',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 -2px 4px rgba(0,0,0,0.02)',
          }}
        />

        {/* Busy State Content */}
        {isBusy && ticketInfo ? (
          <div className="absolute inset-0 overflow-hidden rounded-b-xl">
            {/* Subtle Background Gradient */}
            <div
              className="absolute inset-0 transition-all duration-700 ease-out"
              style={{
                background: `linear-gradient(135deg, ${getProgressGradient(ticketInfo.progress)} 0%, transparent 100%)`,
              }}
            />

            {/* Main Content Container */}
            <div className="absolute inset-0 flex items-center justify-between px-2.5">
              {/* LEFT: Time Information Group */}
              {!isUltra && (
                <div className="flex items-center gap-1.5">
                  {/* Clock Icon */}
                  <Clock
                    size={9}
                    className="text-gray-400 flex-shrink-0"
                    strokeWidth={2.5}
                  />

                  {/* Time Stack */}
                  <div className="flex flex-col items-end -space-y-0.5">
                    <span className="text-[11px] font-bold text-gray-900 tabular-nums leading-none">
                      {formatMinutes(ticketInfo.timeLeft)}
                    </span>
                    <span className="text-xs text-gray-400 font-medium leading-none">
                      left
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="w-px h-3.5 bg-gray-300/60" />

                  {/* Total Time */}
                  <span className="text-xs text-gray-600 font-semibold tabular-nums">
                    {formatMinutes(ticketInfo.totalTime)}
                  </span>
                </div>
              )}

              {/* RIGHT: Progress Percentage (Centered if Ultra) */}
              <div className={`flex items-center ${isUltra ? 'w-full justify-center' : ''}`}>
                <span className="text-[14px] font-black text-gray-900 font-mono tabular-nums tracking-tight">
                  {formatProgress(ticketInfo.progress)}
                </span>
              </div>
            </div>

            {/* Bottom Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-200/50">
              <div
                className="h-full transition-all duration-700 ease-out"
                style={{
                  width: `${ticketInfo.progress * 100}%`,
                  background: getProgressColor(ticketInfo.progress),
                  opacity: 0.6,
                }}
              />
            </div>
          </div>
        ) : (
          /* Ready/Off State Content */
          <div className="absolute inset-0 flex items-center justify-center gap-1">
            {isReady ? (
              <>
                <Check size={14} className="text-emerald-500" strokeWidth={3} />
                {!isUltra && (
                  <span className="text-xs font-semibold text-emerald-600">
                    Ready
                  </span>
                )}
              </>
            ) : (
              <>
                <Minus size={14} className="text-gray-400" strokeWidth={3} />
                {!isUltra && (
                  <span className="text-xs font-semibold text-gray-500">
                    Off
                  </span>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  }
);

StaffCardNotch.displayName = 'StaffCardNotch';
