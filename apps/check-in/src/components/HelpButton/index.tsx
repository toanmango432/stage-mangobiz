import { useState, useCallback } from 'react';
import { HelpCircle, X, Check, Loader2, Shield } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { requestHelp, cancelHelpRequest, showPinModal } from '../../store/slices/adminSlice';
import { useMqtt } from '../../providers/MqttProvider';

function generateHelpRequestId(): string {
  return `help-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function HelpButton() {
  const dispatch = useAppDispatch();
  const { publish } = useMqtt();
  const { storeId } = useAppSelector((state) => state.auth);
  const { isHelpRequested, helpRequestId } = useAppSelector((state) => state.admin);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleRequestHelp = useCallback(async () => {
    if (isHelpRequested) {
      dispatch(cancelHelpRequest());
      if (storeId && helpRequestId) {
        await publish(`salon/${storeId}/help/cancel`, {
          requestId: helpRequestId,
          cancelledAt: new Date().toISOString(),
        });
      }
      return;
    }

    setIsSending(true);
    const requestId = generateHelpRequestId();

    try {
      dispatch(requestHelp(requestId));

      if (storeId) {
        await publish(`salon/${storeId}/help/request`, {
          requestId,
          source: 'check-in-kiosk',
          requestedAt: new Date().toISOString(),
          location: 'Check-In Kiosk',
        });
      }

      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 3000);
    } finally {
      setIsSending(false);
    }
  }, [dispatch, publish, storeId, isHelpRequested, helpRequestId]);

  const handleAdminAccess = useCallback(() => {
    dispatch(showPinModal());
  }, [dispatch]);

  return (
    <>
      {/* Floating Help Button - Fixed Position */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
        {/* Admin Mode Button (smaller) */}
        <button
          onClick={handleAdminAccess}
          className="w-12 h-12 rounded-full bg-white border border-[#e5e7eb] shadow-lg flex items-center justify-center transition-all hover:bg-[#f9fafb] hover:shadow-xl active:scale-95"
          aria-label="Staff access"
        >
          <Shield className="w-5 h-5 text-[#6b7280]" />
        </button>

        {/* Help Button (larger, primary) */}
        <button
          onClick={handleRequestHelp}
          disabled={isSending}
          className={`
            w-16 h-16 rounded-full shadow-xl flex items-center justify-center transition-all active:scale-95
            ${isHelpRequested
              ? 'bg-[#d4a853] text-white'
              : 'bg-[#1a5f4a] text-white hover:bg-[#154d3c]'
            }
          `}
          aria-label={isHelpRequested ? 'Cancel help request' : 'Request assistance'}
        >
          {isSending ? (
            <Loader2 className="w-7 h-7 animate-spin" />
          ) : isHelpRequested ? (
            <X className="w-7 h-7" />
          ) : (
            <HelpCircle className="w-7 h-7" />
          )}
        </button>

        {/* Status label */}
        {isHelpRequested && (
          <div className="absolute -left-32 bottom-4 bg-[#d4a853] text-white px-3 py-1.5 rounded-lg text-sm font-['Work_Sans'] font-medium shadow-lg animate-pulse whitespace-nowrap">
            Help is on the way!
          </div>
        )}
      </div>

      {/* Confirmation Toast */}
      {showConfirmation && (
        <div className="fixed bottom-28 right-6 z-50 animate-slide-up">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#e5e7eb] p-4 flex items-center gap-3 max-w-xs">
            <div className="w-10 h-10 rounded-full bg-[#e8f5f0] flex items-center justify-center flex-shrink-0">
              <Check className="w-5 h-5 text-[#1a5f4a]" />
            </div>
            <div>
              <p className="font-['Plus_Jakarta_Sans'] font-semibold text-[#1f2937] text-sm">
                Staff Notified
              </p>
              <p className="font-['Work_Sans'] text-xs text-[#6b7280]">
                Someone will assist you shortly
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
}

export default HelpButton;
