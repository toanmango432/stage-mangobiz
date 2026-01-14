/**
 * MQTT Topics for Mango Pad
 * Defines topic patterns for POS <-> Pad communication
 *
 * Device-to-Device (1:1) Architecture:
 * - Each Mango Pad pairs to ONE specific Store App station
 * - All communication is scoped to that station via stationId in topic
 * - Topics include: salon/{salonId}/station/{stationId}/pad/...
 */

export const PAD_TOPICS = {
  // Station -> Pad (subscribe)
  READY_TO_PAY: 'salon/{salonId}/station/{stationId}/pad/ready_to_pay',
  PAYMENT_RESULT: 'salon/{salonId}/station/{stationId}/pad/payment_result',
  CANCEL: 'salon/{salonId}/station/{stationId}/pad/cancel',
  // NEW: Staff control messages from POS
  POS_SKIP_TIP: 'salon/{salonId}/station/{stationId}/pos/skip_tip',
  POS_SKIP_SIGNATURE: 'salon/{salonId}/station/{stationId}/pos/skip_signature',
  POS_FORCE_COMPLETE: 'salon/{salonId}/station/{stationId}/pos/force_complete',
  POS_UPDATE_ORDER: 'salon/{salonId}/station/{stationId}/pos/update_order',

  // Pad -> Station (publish)
  TIP_SELECTED: 'salon/{salonId}/station/{stationId}/pad/tip_selected',
  SIGNATURE: 'salon/{salonId}/station/{stationId}/pad/signature',
  RECEIPT_PREFERENCE: 'salon/{salonId}/station/{stationId}/pad/receipt_preference',
  TRANSACTION_COMPLETE: 'salon/{salonId}/station/{stationId}/pad/transaction_complete',
  HELP_REQUESTED: 'salon/{salonId}/station/{stationId}/pad/help_requested',
  SPLIT_PAYMENT: 'salon/{salonId}/station/{stationId}/pad/split_payment',
  // NEW: Screen sync messages to POS
  SCREEN_CHANGED: 'salon/{salonId}/station/{stationId}/pad/screen_changed',
  CUSTOMER_STARTED: 'salon/{salonId}/station/{stationId}/pad/customer_started',
  CUSTOMER_IDLE: 'salon/{salonId}/station/{stationId}/pad/customer_idle',

  // Heartbeat topics
  PAD_HEARTBEAT: 'salon/{salonId}/station/{stationId}/pad/heartbeat',  // Pad -> Station
  STATION_HEARTBEAT: 'salon/{salonId}/station/{stationId}/heartbeat',  // Station -> Pad

  // Unpair notification (station sends to specific pad)
  PAD_UNPAIRED: 'salon/{salonId}/station/{stationId}/pad/{padId}/unpaired',
} as const;

export interface PadTopicParams {
  salonId: string;
  stationId: string;
  padId?: string;
}

export function buildPadTopic(
  pattern: string,
  params: PadTopicParams
): string {
  let topic = pattern
    .replace('{salonId}', params.salonId)
    .replace('{stationId}', params.stationId);

  if (params.padId) {
    topic = topic.replace('{padId}', params.padId);
  }

  return topic;
}

/**
 * Get topics that Mango Pad subscribes to (from its paired station)
 */
export function getSubscribeTopics(salonId: string, stationId: string): string[] {
  const params = { salonId, stationId };
  return [
    buildPadTopic(PAD_TOPICS.READY_TO_PAY, params),
    buildPadTopic(PAD_TOPICS.PAYMENT_RESULT, params),
    buildPadTopic(PAD_TOPICS.CANCEL, params),
    buildPadTopic(PAD_TOPICS.STATION_HEARTBEAT, params),
    // NEW: Staff control topics
    buildPadTopic(PAD_TOPICS.POS_SKIP_TIP, params),
    buildPadTopic(PAD_TOPICS.POS_SKIP_SIGNATURE, params),
    buildPadTopic(PAD_TOPICS.POS_FORCE_COMPLETE, params),
    buildPadTopic(PAD_TOPICS.POS_UPDATE_ORDER, params),
  ];
}

/**
 * Get topics that Mango Pad publishes to (to its paired station)
 */
export function getPublishTopics(salonId: string, stationId: string) {
  const params = { salonId, stationId };
  return {
    tipSelected: buildPadTopic(PAD_TOPICS.TIP_SELECTED, params),
    signature: buildPadTopic(PAD_TOPICS.SIGNATURE, params),
    receiptPreference: buildPadTopic(PAD_TOPICS.RECEIPT_PREFERENCE, params),
    transactionComplete: buildPadTopic(PAD_TOPICS.TRANSACTION_COMPLETE, params),
    helpRequested: buildPadTopic(PAD_TOPICS.HELP_REQUESTED, params),
    splitPayment: buildPadTopic(PAD_TOPICS.SPLIT_PAYMENT, params),
    padHeartbeat: buildPadTopic(PAD_TOPICS.PAD_HEARTBEAT, params),
    // NEW: Screen sync topics
    screenChanged: buildPadTopic(PAD_TOPICS.SCREEN_CHANGED, params),
    customerStarted: buildPadTopic(PAD_TOPICS.CUSTOMER_STARTED, params),
    customerIdle: buildPadTopic(PAD_TOPICS.CUSTOMER_IDLE, params),
  };
}
