/**
 * SignaturePage - Signature Capture Screen
 * US-005: Allows clients to sign digitally to authorize payment
 */

import { useRef, useState, useCallback } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { motion } from 'framer-motion';
import { PenTool, RotateCcw, Check, HelpCircle } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { usePadMqtt } from '@/providers/PadMqttProvider';
import { setScreen } from '@/store/slices/padSlice';
import { setSignature } from '@/store/slices/transactionSlice';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function SignaturePage() {
  const dispatch = useAppDispatch();
  const { publishSignature, publishHelpRequested } = usePadMqtt();
  const transaction = useAppSelector((state) => state.transaction.current);
  const tip = useAppSelector((state) => state.transaction.tip);
  const isSplitPayment = useAppSelector((state) => state.transaction.isSplitPayment);
  const splitPayments = useAppSelector((state) => state.transaction.splitPayments);
  const currentSplitIndex = useAppSelector((state) => state.transaction.currentSplitIndex);

  const signatureRef = useRef<SignatureCanvas | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl text-gray-500">No transaction data</p>
      </div>
    );
  }

  const currentSplit = isSplitPayment ? splitPayments[currentSplitIndex] : null;
  const baseAmount = currentSplit ? currentSplit.amount : transaction.total;
  const tipAmount = tip?.tipAmount ?? 0;
  const finalTotal = baseAmount + tipAmount;

  const handleClear = useCallback(() => {
    signatureRef.current?.clear();
    setIsEmpty(true);
  }, []);

  const handleBegin = useCallback(() => {
    setIsEmpty(false);
  }, []);

  const handleEnd = useCallback(() => {
    if (signatureRef.current) {
      setIsEmpty(signatureRef.current.isEmpty());
    }
  }, []);

  const handleComplete = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      return;
    }

    const signatureBase64 = signatureRef.current.toDataURL('image/png');
    const agreedAt = new Date().toISOString();

    dispatch(
      setSignature({
        signatureBase64,
        agreedAt,
      })
    );

    try {
      await publishSignature({
        signatureBase64,
        agreedAt,
      });
    } catch (error) {
      console.error('Failed to publish signature:', error);
    }

    dispatch(setScreen('payment'));
  };

  const handleNeedHelp = async () => {
    try {
      await publishHelpRequested('signature');
    } catch (error) {
      console.error('Failed to publish help request:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      {/* Header */}
      <header className="p-6 bg-white border-b border-gray-100 shadow-sm">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          {isSplitPayment && currentSplit && (
            <div className="mb-2">
              <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                Payment {currentSplit.splitIndex + 1} of {currentSplit.totalSplits}
              </span>
            </div>
          )}
          <div className="flex items-center justify-center gap-2 mb-2">
            <PenTool className="w-7 h-7 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">Sign to Agree</h1>
          </div>
          <p className="text-lg text-gray-500">
            Please sign below to authorize payment
          </p>
        </motion.div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-6 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-2xl mx-auto w-full flex-1 flex flex-col"
        >
          {/* Total Display */}
          <div className="bg-indigo-50 rounded-2xl p-6 mb-6">
            <div className="text-center">
              <p className="text-lg text-indigo-600 font-medium mb-1">Total Amount</p>
              <p className="text-4xl font-bold text-indigo-900">{formatCurrency(finalTotal)}</p>
              {tipAmount > 0 && (
                <p className="text-base text-indigo-500 mt-2">
                  (includes {formatCurrency(tipAmount)} tip)
                </p>
              )}
            </div>
          </div>

          {/* Signature Canvas Container */}
          <div className="flex-1 min-h-[200px] mb-6">
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 relative overflow-hidden h-full min-h-[200px] shadow-sm">
              <SignatureCanvas
                ref={signatureRef}
                canvasProps={{
                  className: 'w-full h-full min-h-[200px] touch-none cursor-crosshair',
                  style: { width: '100%', height: '100%', minHeight: '200px' },
                }}
                penColor="#1f2937"
                backgroundColor="rgba(255, 255, 255, 0)"
                dotSize={2}
                minWidth={2}
                maxWidth={4}
                throttle={16}
                onBegin={handleBegin}
                onEnd={handleEnd}
              />

              {/* Signature line */}
              <div className="absolute bottom-12 left-6 right-6 border-b-2 border-gray-300 pointer-events-none" />
              <div className="absolute bottom-6 left-6 text-sm text-gray-400 pointer-events-none">
                Sign above this line
              </div>

              {/* Empty state hint */}
              {isEmpty && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-xl text-gray-300 font-medium">
                    Draw your signature here
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Clear Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleClear}
            disabled={isEmpty}
            className={`min-h-[56px] rounded-xl flex items-center justify-center gap-2 mb-4 transition-all ${
              isEmpty
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-[0.98]'
            }`}
          >
            <RotateCcw className="w-5 h-5" />
            <span className="text-lg font-medium">Clear Signature</span>
          </motion.button>

          {/* Agreement Text */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-center text-base text-gray-600 leading-relaxed">
              By signing above, I agree to pay the total shown and authorize this transaction.
            </p>
          </div>
        </motion.div>
      </main>

      {/* Footer Actions */}
      <footer className="p-6 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col gap-4"
        >
          {/* Complete Button */}
          <button
            onClick={handleComplete}
            disabled={isEmpty}
            className={`w-full min-h-[64px] text-xl font-semibold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 ${
              isEmpty
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 active:scale-[0.98]'
            }`}
          >
            <Check className="w-6 h-6" />
            <span>Done</span>
          </button>

          {/* Need Help */}
          <button
            onClick={handleNeedHelp}
            className="w-full min-h-[56px] bg-orange-50 text-orange-700 text-lg font-medium rounded-xl hover:bg-orange-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <HelpCircle className="w-5 h-5" />
            <span>Need Help</span>
          </button>
        </motion.div>
      </footer>
    </div>
  );
}
