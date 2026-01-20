/**
 * PaymentModal Component
 * Main payment modal for checkout - handles tip selection, payment methods, and completion
 */

import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Printer, AlertCircle, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import GiftCardRedeemModal from "../modals/GiftCardRedeemModal";
import SendToPadButton from "../SendToPadButton";
import PadTransactionStatus from "../PadTransactionStatus";
import PadCheckoutOverlay from "../PadCheckoutOverlay";
import { TIP_PERCENTAGES } from "./constants";
import type { PaymentModalProps } from "./types";
import { usePaymentModal } from "./hooks";
import {
  StepIndicator,
  TipSection,
  PaymentMethodSelector,
  PaymentSummary,
  PaymentInputs,
  CompletionSection,
  ProcessingOverlay,
  PriceChangeWarning,
} from "./components";

export default function PaymentModal({
  open,
  onClose,
  total,
  subtotal,
  tax = 0,
  discount = 0,
  onComplete,
  staffMembers = [],
  ticketId,
  clientId,
  clientName,
  clientEmail,
  clientPhone,
  items = [],
  onShowReceipt,
  onSentToPad,
  onOpenPriceResolution,
}: PaymentModalProps) {
  const {
    // State
    currentStep,
    tipPercentage,
    customTip,
    paymentMethods,
    currentMethod,
    cashTendered,
    customPaymentName,
    showTipDistribution,
    tipDistribution,
    showSuccess,
    isProcessing,
    paymentError,
    showGiftCardModal,
    appliedGiftCards,
    sentToPadTransactionId,

    // Computed values
    tipAmount,
    totalWithTip,
    remaining,
    isFullyPaid,
    totalChangeToReturn,
    quickCashAmounts,
    hasUnresolvedPriceChanges,
    unresolvedPriceChanges,
    showPadOverlay,

    // Handlers
    handleQuickCash,
    handleAddPayment,
    handleComplete,
    handleSelectTipPercentage,
    handleCustomTipChange,
    handleAutoDistributeTip,
    handleEqualSplitTip,
    handleApplyGiftCard,
    handleRemoveGiftCard,
    handleSelectMethod,
    handleSentToPad,
    goToNextStep,
    goToPrevStep,
    setPaymentError,
    setShowGiftCardModal,
    setCashTendered,
    setCustomPaymentName,
    setPaymentMethods,
  } = usePaymentModal({
    total,
    ticketId,
    staffMembers,
    onComplete,
    onSentToPad,
  });

  const effectiveSubtotal = subtotal ?? total;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-lg sm:max-w-xl md:max-w-2xl flex flex-col p-0 z-[100]">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-0 flex-shrink-0">
            <DialogTitle className="text-lg sm:text-xl text-center">
              Checkout
            </DialogTitle>
          </DialogHeader>

          <StepIndicator currentStep={currentStep} isFullyPaid={isFullyPaid} />

          <ProcessingOverlay isProcessing={isProcessing} showSuccess={showSuccess} />

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="space-y-4">
              {/* Step 1: Tip Selection */}
              {currentStep === 1 && (
                <TipSection
                  total={total}
                  totalWithTip={totalWithTip}
                  tipPercentage={tipPercentage}
                  customTip={customTip}
                  tipAmount={tipAmount}
                  staffMembers={staffMembers}
                  showTipDistribution={showTipDistribution}
                  tipDistribution={tipDistribution}
                  onSelectTipPercentage={handleSelectTipPercentage}
                  onCustomTipChange={handleCustomTipChange}
                  onAutoDistributeTip={handleAutoDistributeTip}
                  onEqualSplitTip={handleEqualSplitTip}
                  onContinueToPayment={goToNextStep}
                />
              )}

              {/* Step 2: Payment */}
              {currentStep === 2 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goToPrevStep}
                    className="gap-2 -ml-2"
                    data-testid="button-back-to-tip"
                  >
                    ← Back to tip
                  </Button>

                  {/* Payment error display */}
                  {paymentError && (
                    <Card className="p-4 bg-red-500/10 border-red-500/30">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-600 dark:text-red-500">
                            {paymentError}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPaymentError(null)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  )}

                  <PriceChangeWarning
                    unresolvedPriceChanges={unresolvedPriceChanges}
                    onClose={onClose}
                    onOpenPriceResolution={onOpenPriceResolution}
                  />

                  <PaymentSummary
                    remaining={remaining}
                    totalWithTip={totalWithTip}
                    paymentMethods={paymentMethods}
                    totalChangeToReturn={totalChangeToReturn}
                    onRemovePayment={(index) => setPaymentMethods(prev => prev.filter((_, i) => i !== index))}
                  />

                  {remaining > 0.01 && (
                    <>
                      {/* Send to Pad option */}
                      {!sentToPadTransactionId && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground block">Customer-facing checkout</label>
                          <SendToPadButton
                            ticketId={ticketId || 'unknown'}
                            clientId={clientId}
                            clientName={clientName}
                            clientEmail={clientEmail}
                            clientPhone={clientPhone}
                            staffName={staffMembers[0]?.name}
                            items={items}
                            subtotal={effectiveSubtotal}
                            tax={tax}
                            discount={discount}
                            total={totalWithTip}
                            suggestedTips={TIP_PERCENTAGES}
                            onSent={handleSentToPad}
                          />
                          <Separator className="my-4" />
                        </div>
                      )}

                      {/* Show Pad transaction status when sent */}
                      {sentToPadTransactionId && ticketId && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground block">Mango Pad Status</label>
                          <PadTransactionStatus
                            ticketId={ticketId}
                            onRetry={() => handleSentToPad('')}
                            onCancelled={() => handleSentToPad('')}
                          />
                          <Separator className="my-4" />
                        </div>
                      )}

                      <PaymentMethodSelector
                        currentMethod={currentMethod}
                        onSelectMethod={handleSelectMethod}
                        isDisabled={hasUnresolvedPriceChanges}
                        sentToPadTransactionId={sentToPadTransactionId}
                      />

                      {currentMethod && (
                        <PaymentInputs
                          currentMethod={currentMethod}
                          remaining={remaining}
                          cashTendered={cashTendered}
                          customPaymentName={customPaymentName}
                          isProcessing={isProcessing}
                          hasUnresolvedPriceChanges={hasUnresolvedPriceChanges}
                          appliedGiftCards={appliedGiftCards}
                          quickCashAmounts={quickCashAmounts}
                          onQuickCash={handleQuickCash}
                          onCashTenderedChange={setCashTendered}
                          onCustomPaymentNameChange={setCustomPaymentName}
                          onAddPayment={handleAddPayment}
                          onOpenGiftCardModal={() => setShowGiftCardModal(true)}
                          onRemoveGiftCard={handleRemoveGiftCard}
                        />
                      )}
                    </>
                  )}

                  {isFullyPaid && (
                    <Button
                      className="w-full h-14 text-base"
                      onClick={handleComplete}
                      data-testid="button-finish-print"
                    >
                      <Printer className="h-5 w-5 mr-2" />
                      Finish & Print Receipt
                    </Button>
                  )}
                </>
              )}

              {/* Step 3: Completion */}
              {currentStep === 3 && (
                <CompletionSection
                  total={total}
                  tipAmount={tipAmount}
                  totalWithTip={totalWithTip}
                  paymentMethods={paymentMethods}
                  showTipDistribution={showTipDistribution}
                  tipDistribution={tipDistribution}
                  onShowReceipt={onShowReceipt}
                  onDone={() => {
                    onComplete({
                      methods: paymentMethods,
                      tip: tipAmount,
                      tipDistribution: showTipDistribution && tipDistribution.length > 0 ? tipDistribution : undefined,
                    });
                  }}
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gift Card Redeem Modal */}
      <GiftCardRedeemModal
        open={showGiftCardModal}
        onOpenChange={setShowGiftCardModal}
        remainingTotal={remaining}
        appliedGiftCards={appliedGiftCards}
        onApplyGiftCard={handleApplyGiftCard}
        onRemoveGiftCard={handleRemoveGiftCard}
      />

      {/* Pad Checkout Overlay - shows when customer is actively checking out on Mango Pad */}
      {showPadOverlay && ticketId && (
        <PadCheckoutOverlay
          ticketId={ticketId}
          onCancelled={() => handleSentToPad('')}
        />
      )}
    </>
  );
}
