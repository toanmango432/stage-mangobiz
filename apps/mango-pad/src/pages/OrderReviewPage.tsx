/**
 * OrderReviewPage - Order Review Screen
 * US-003: Displays transaction details for client verification before payment
 * US-014: WCAG 2.1 AA Accessibility compliance
 * US-015: Responsive design for all device sizes
 */

import { motion } from 'framer-motion';
import { HelpCircle, Scissors, ShoppingBag, ChevronRight, SplitSquareVertical } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { usePadMqtt } from '@/providers/PadMqttProvider';
import { setScreen } from '@/store/slices/padSlice';
import { useResponsive } from '@/hooks/useResponsive';
import type { TransactionItem } from '@/types';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

interface ItemRowProps {
  item: TransactionItem;
}

function ItemRow({ item }: ItemRowProps) {
  const Icon = item.type === 'service' ? Scissors : ShoppingBag;
  const iconBg = item.type === 'service' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between py-3 md:py-4 border-b border-gray-100 last:border-b-0"
    >
      <div className="flex items-center gap-3 md:gap-4">
        <div className={`w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className="w-5 h-5 md:w-6 md:h-6" />
        </div>
        <div>
          <p className="text-base sm:text-lg font-medium text-gray-900">{item.name}</p>
          {item.quantity > 1 && (
            <p className="text-xs sm:text-sm text-gray-500">Qty: {item.quantity}</p>
          )}
        </div>
      </div>
      <p className="text-base sm:text-lg font-semibold text-gray-900">
        {formatCurrency(item.price * item.quantity)}
      </p>
    </motion.div>
  );
}

interface SummaryRowProps {
  label: string;
  value: number;
  isTotal?: boolean;
  isDiscount?: boolean;
}

function SummaryRow({ label, value, isTotal, isDiscount }: SummaryRowProps) {
  return (
    <div className={`flex justify-between items-center py-1.5 sm:py-2 ${isTotal ? 'border-t-2 border-gray-900 pt-3 sm:pt-4 mt-2' : ''}`}>
      <span className={`${isTotal ? 'text-lg sm:text-xl font-bold text-gray-900' : 'text-base sm:text-lg text-gray-600'}`}>
        {label}
      </span>
      <span className={`${isTotal ? 'text-xl sm:text-2xl font-bold text-gray-900' : 'text-base sm:text-lg'} ${isDiscount ? 'text-green-600' : 'text-gray-900'}`}>
        {isDiscount ? '-' : ''}{formatCurrency(Math.abs(value))}
      </span>
    </div>
  );
}

export function OrderReviewPage() {
  const dispatch = useAppDispatch();
  const { publishHelpRequested } = usePadMqtt();
  const transaction = useAppSelector((state) => state.transaction.current);
  const config = useAppSelector((state) => state.config.config);
  const { orientation, isShortScreen } = useResponsive();

  const handleConfirm = () => {
    if (config.tipEnabled) {
      dispatch(setScreen('tip'));
    } else if (config.signatureRequired) {
      dispatch(setScreen('signature'));
    } else {
      dispatch(setScreen('payment'));
    }
  };

  const handleSplitPayment = () => {
    dispatch(setScreen('split-selection'));
  };

  const handleNeedHelp = async () => {
    try {
      await publishHelpRequested('order-review');
    } catch (error) {
      console.error('Failed to publish help request:', error);
    }
  };

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl text-gray-500">No transaction data</p>
      </div>
    );
  }

  const serviceItems = transaction.items.filter((item) => item.type === 'service');
  const productItems = transaction.items.filter((item) => item.type === 'product');

  const isLandscape = orientation === 'landscape';

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-gray-50 to-white flex flex-col" role="main" id="main-content" data-orientation={orientation}>
      {/* Header */}
      <header className={`p-4 sm:p-5 md:p-6 bg-white border-b border-gray-100 shadow-sm ${isShortScreen ? 'py-2' : ''}`} role="banner">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-base sm:text-lg text-gray-500 mb-0.5 sm:mb-1">Welcome back,</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{transaction.clientName}</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1 sm:mt-2">
            Serviced by <span className="font-medium text-gray-700">{transaction.staffName}</span>
          </p>
        </motion.div>
      </header>

      {/* Items List */}
      <main className={`flex-1 overflow-auto p-4 sm:p-5 md:p-6 ${isLandscape ? 'flex gap-4 md:gap-6' : ''}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 md:p-6 mb-4 md:mb-6 ${isLandscape ? 'flex-1' : ''}`}
        >
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 md:mb-4">Order Summary</h2>
          
          {/* Services */}
          {serviceItems.length > 0 && (
            <div className="mb-3 md:mb-4">
              <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide mb-1.5 sm:mb-2">Services</p>
              {serviceItems.map((item, index) => (
                <ItemRow key={`service-${index}`} item={item} />
              ))}
            </div>
          )}

          {/* Products */}
          {productItems.length > 0 && (
            <div className="mb-3 md:mb-4">
              <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide mb-1.5 sm:mb-2 mt-4 md:mt-6">Products</p>
              {productItems.map((item, index) => (
                <ItemRow key={`product-${index}`} item={item} />
              ))}
            </div>
          )}
        </motion.div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 md:p-6 ${isLandscape ? 'w-72 md:w-80 lg:w-96 flex-shrink-0' : ''}`}
        >
          <SummaryRow label="Subtotal" value={transaction.subtotal} />
          <SummaryRow label="Tax" value={transaction.tax} />
          {transaction.discount && transaction.discount > 0 && (
            <SummaryRow label="Discount" value={transaction.discount} isDiscount />
          )}
          <SummaryRow label="Total" value={transaction.total} isTotal />
        </motion.div>
      </main>

      {/* Footer Actions */}
      <footer className={`p-4 sm:p-5 md:p-6 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] ${isShortScreen ? 'py-2 sm:py-3' : ''}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`flex gap-3 md:gap-4 ${isLandscape ? 'flex-row' : 'flex-col'}`}
        >
          {/* Main Action */}
          <button
            onClick={handleConfirm}
            aria-label={`Confirm order total of ${formatCurrency(transaction.total)}`}
            className={`min-h-[56px] sm:min-h-[60px] md:min-h-[64px] bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-lg sm:text-xl font-semibold rounded-2xl shadow-lg hover:from-indigo-700 hover:to-indigo-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 md:gap-3 ${isLandscape ? 'flex-1' : 'w-full'}`}
          >
            <span>Looks Good</span>
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" aria-hidden="true" />
          </button>

          {/* Secondary Actions */}
          <div className={`flex gap-3 md:gap-4 ${isLandscape ? '' : ''}`} role="group" aria-label="Additional payment options">
            {config.splitPaymentEnabled && (
              <button
                onClick={handleSplitPayment}
                aria-label="Split payment between multiple people"
                className="flex-1 min-h-[48px] sm:min-h-[52px] md:min-h-[56px] bg-gray-100 text-gray-700 text-base sm:text-lg font-medium rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <SplitSquareVertical className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                <span className="hidden xs:inline sm:inline">Split Payment</span>
                <span className="xs:hidden">Split</span>
              </button>
            )}
            <button
              onClick={handleNeedHelp}
              aria-label="Request assistance from staff"
              className="flex-1 min-h-[48px] sm:min-h-[52px] md:min-h-[56px] bg-orange-50 text-orange-700 text-base sm:text-lg font-medium rounded-xl hover:bg-orange-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
              <span className="hidden xs:inline sm:inline">Need Help</span>
              <span className="xs:hidden">Help</span>
            </button>
          </div>
        </motion.div>
      </footer>
    </div>
  );
}
