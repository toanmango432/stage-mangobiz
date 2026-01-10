/**
 * MQTT Topics for Mango Pad
 * Defines topic patterns for POS <-> Pad communication
 */

export const PAD_TOPICS = {
  READY_TO_PAY: 'salon/{salonId}/pad/ready_to_pay',
  TIP_SELECTED: 'salon/{salonId}/pad/tip_selected',
  SIGNATURE: 'salon/{salonId}/pad/signature',
  PAYMENT_RESULT: 'salon/{salonId}/pad/payment_result',
  RECEIPT_PREFERENCE: 'salon/{salonId}/pad/receipt_preference',
  TRANSACTION_COMPLETE: 'salon/{salonId}/pad/transaction_complete',
  CANCEL: 'salon/{salonId}/pad/cancel',
  HELP_REQUESTED: 'salon/{salonId}/pad/help_requested',
  SPLIT_PAYMENT: 'salon/{salonId}/pad/split_payment',
} as const;

export function buildPadTopic(
  pattern: string,
  params: { salonId: string }
): string {
  return pattern.replace('{salonId}', params.salonId);
}

export function getSubscribeTopics(salonId: string): string[] {
  return [
    buildPadTopic(PAD_TOPICS.READY_TO_PAY, { salonId }),
    buildPadTopic(PAD_TOPICS.PAYMENT_RESULT, { salonId }),
    buildPadTopic(PAD_TOPICS.CANCEL, { salonId }),
  ];
}

export function getPublishTopics(salonId: string) {
  return {
    tipSelected: buildPadTopic(PAD_TOPICS.TIP_SELECTED, { salonId }),
    signature: buildPadTopic(PAD_TOPICS.SIGNATURE, { salonId }),
    receiptPreference: buildPadTopic(PAD_TOPICS.RECEIPT_PREFERENCE, { salonId }),
    transactionComplete: buildPadTopic(PAD_TOPICS.TRANSACTION_COMPLETE, { salonId }),
    helpRequested: buildPadTopic(PAD_TOPICS.HELP_REQUESTED, { salonId }),
    splitPayment: buildPadTopic(PAD_TOPICS.SPLIT_PAYMENT, { salonId }),
  };
}
