/**
 * Help Request Notification Component
 * Displays prominent, persistent notifications when customers request help from Mango Pad.
 * Notifications persist until staff acknowledges them.
 */

import { useEffect, useRef } from 'react';
import { AlertTriangle, X, Check, Tablet } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectPendingHelpRequests,
  acknowledgeHelpRequest,
  removeHelpRequest,
} from '@/store/slices/helpRequestsSlice';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

const NOTIFICATION_SOUND_URL = '/sounds/notification.mp3';

export function HelpRequestNotification() {
  const dispatch = useAppDispatch();
  const pendingRequests = useAppSelector(selectPendingHelpRequests);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousCountRef = useRef(0);

  useEffect(() => {
    if (pendingRequests.length > previousCountRef.current) {
      if (audioRef.current) {
        audioRef.current.play().catch(() => {
          console.log('[HelpRequest] Audio playback blocked by browser');
        });
      }
    }
    previousCountRef.current = pendingRequests.length;
  }, [pendingRequests.length]);

  const handleAcknowledge = (id: string) => {
    dispatch(acknowledgeHelpRequest({ id }));
    setTimeout(() => {
      dispatch(removeHelpRequest(id));
    }, 500);
  };

  if (pendingRequests.length === 0) {
    return null;
  }

  return (
    <>
      <audio ref={audioRef} src={NOTIFICATION_SOUND_URL} preload="auto" />

      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 max-w-md w-full pointer-events-none">
        {pendingRequests.map((request) => (
          <div
            key={request.id}
            className={cn(
              'pointer-events-auto',
              'bg-gradient-to-r from-orange-500 to-red-500',
              'shadow-2xl rounded-xl border-2 border-orange-600',
              'p-4 animate-pulse-subtle'
            )}
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 p-2 bg-white/20 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-bold text-lg">
                    Help Requested!
                  </span>
                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs text-white font-medium">
                    URGENT
                  </span>
                </div>

                <div className="flex items-center gap-2 text-white/90 text-sm mb-2">
                  <Tablet className="w-4 h-4" />
                  <span className="font-medium">{request.deviceName}</span>
                </div>

                {request.clientName && (
                  <p className="text-white/90 text-sm">
                    Customer: <span className="font-semibold">{request.clientName}</span>
                  </p>
                )}

                <p className="text-white/70 text-xs mt-1">
                  {formatDistanceToNow(new Date(request.requestedAt), { addSuffix: true })}
                </p>
              </div>

              <button
                onClick={() => handleAcknowledge(request.id)}
                className="flex-shrink-0 p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <Button
              onClick={() => handleAcknowledge(request.id)}
              variant="outline"
              className={cn(
                'w-full mt-3',
                'bg-white text-orange-600 border-white',
                'hover:bg-white/90 hover:text-orange-700',
                'font-semibold'
              )}
            >
              <Check className="w-4 h-4 mr-2" />
              Acknowledge
            </Button>
          </div>
        ))}
      </div>
    </>
  );
}
