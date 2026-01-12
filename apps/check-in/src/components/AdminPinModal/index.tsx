import { useState, useCallback, useEffect } from 'react';
import { X, Delete, Shield, Check, AlertCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { hidePinModal, setPinError, activateAdminMode } from '../../store/slices/adminSlice';

const ADMIN_PIN = '1234';

export function AdminPinModal() {
  const dispatch = useAppDispatch();
  const { showPinModal, pinError } = useAppSelector((state) => state.admin);
  const [pin, setPin] = useState('');
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!showPinModal) {
      setPin('');
      setIsSuccess(false);
    }
  }, [showPinModal]);

  const handleKey = useCallback(
    (key: string) => {
      if (pin.length >= 4) return;
      setPressedKey(key);
      setTimeout(() => setPressedKey(null), 150);

      const newPin = pin + key;
      setPin(newPin);
      dispatch(setPinError(''));

      if (newPin.length === 4) {
        if (newPin === ADMIN_PIN) {
          setIsSuccess(true);
          setTimeout(() => {
            dispatch(activateAdminMode());
          }, 500);
        } else {
          dispatch(setPinError('Incorrect PIN. Please try again.'));
          setTimeout(() => setPin(''), 500);
        }
      }
    },
    [pin, dispatch]
  );

  const handleDelete = useCallback(() => {
    setPressedKey('delete');
    setTimeout(() => setPressedKey(null), 150);
    setPin((p) => p.slice(0, -1));
    dispatch(setPinError(''));
  }, [dispatch]);

  const handleClose = useCallback(() => {
    dispatch(hidePinModal());
    setPin('');
  }, [dispatch]);

  if (!showPinModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#e5e7eb]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e8f5f0] flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#1a5f4a]" />
            </div>
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#1f2937]">
                Staff Access
              </h2>
              <p className="font-['Work_Sans'] text-sm text-[#6b7280]">Enter 4-digit PIN</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-xl bg-[#f3f4f6] hover:bg-[#e5e7eb] flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-[#6b7280]" />
          </button>
        </div>

        {/* PIN Display */}
        <div className="p-6">
          <div className="flex justify-center gap-4 mb-6">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`
                  w-16 h-16 rounded-2xl border-2 flex items-center justify-center transition-all duration-200
                  ${pinError
                    ? 'border-[#ef4444] bg-[#fef2f2]'
                    : isSuccess
                      ? 'border-[#1a5f4a] bg-[#e8f5f0]'
                      : pin.length > index
                        ? 'border-[#1a5f4a] bg-[#f9fafb]'
                        : 'border-[#e5e7eb] bg-white'
                  }
                `}
              >
                {isSuccess && pin.length > index ? (
                  <Check className="w-6 h-6 text-[#1a5f4a]" />
                ) : pin.length > index ? (
                  <div className="w-4 h-4 rounded-full bg-[#1a5f4a]" />
                ) : null}
              </div>
            ))}
          </div>

          {/* Error Message */}
          {pinError && (
            <div className="flex items-center justify-center gap-2 mb-4 text-[#ef4444] font-['Work_Sans'] text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{pinError}</span>
            </div>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                onClick={() => handleKey(num)}
                disabled={pin.length >= 4}
                className={`
                  h-16 rounded-xl font-['Plus_Jakarta_Sans'] text-2xl font-semibold
                  bg-white shadow-sm border border-[#e5e7eb]
                  transition-all duration-150 ease-out
                  hover:bg-[#f9fafb] hover:border-[#1a5f4a]/20 hover:shadow
                  active:scale-95 active:bg-[#e8f5f0]
                  disabled:opacity-40 disabled:cursor-not-allowed
                  ${pressedKey === num ? 'scale-95 bg-[#e8f5f0] border-[#1a5f4a]/30' : ''}
                `}
              >
                {num}
              </button>
            ))}
            <div className="h-16" />
            <button
              onClick={() => handleKey('0')}
              disabled={pin.length >= 4}
              className={`
                h-16 rounded-xl font-['Plus_Jakarta_Sans'] text-2xl font-semibold
                bg-white shadow-sm border border-[#e5e7eb]
                transition-all duration-150 ease-out
                hover:bg-[#f9fafb] hover:border-[#1a5f4a]/20 hover:shadow
                active:scale-95 active:bg-[#e8f5f0]
                disabled:opacity-40 disabled:cursor-not-allowed
                ${pressedKey === '0' ? 'scale-95 bg-[#e8f5f0] border-[#1a5f4a]/30' : ''}
              `}
            >
              0
            </button>
            <button
              onClick={handleDelete}
              disabled={pin.length === 0}
              className={`
                h-16 rounded-xl flex items-center justify-center
                bg-[#f3f4f6] border border-transparent
                transition-all duration-150 ease-out
                hover:bg-[#e5e7eb]
                active:scale-95
                disabled:opacity-30 disabled:cursor-not-allowed
                ${pressedKey === 'delete' ? 'scale-95 bg-[#e5e7eb]' : ''}
              `}
            >
              <Delete className="w-6 h-6 text-[#6b7280]" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <p className="text-center font-['Work_Sans'] text-xs text-[#9ca3af]">
            Contact your manager if you've forgotten the PIN
          </p>
        </div>
      </div>

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
    </div>
  );
}

export default AdminPinModal;
