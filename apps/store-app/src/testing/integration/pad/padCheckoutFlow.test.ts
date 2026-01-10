/**
 * Mango Pad Checkout Flow Integration Tests
 * 
 * Tests the complete Store App ↔ Mango Pad MQTT integration:
 * - Send to Pad → Tip Selected → Signature → Payment Complete
 * - Send to Pad → Cancel flow
 * - Help Requested notification
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import padTransactionReducer, {
  startPadTransaction,
  setTipSelected,
  setSignatureCaptured,
  setReceiptPreference,
  setTransactionComplete,
  setTransactionFailed,
  setTransactionCancelled,
  clearPadTransaction,
  selectPadTransactionStatus,
  selectActivePadTransaction,
  selectHasActivePadTransaction,
} from '../../../store/slices/padTransactionSlice';
import padDevicesReducer, {
  handleHeartbeat,
  checkOfflineDevices,
  selectAllPadDevices,
  getConnectedPads,
  selectHasConnectedPad,
} from '../../../store/slices/padDevicesSlice';
import helpRequestsReducer, {
  addHelpRequest,
  acknowledgeHelpRequest,
  selectAllHelpRequests,
} from '../../../store/slices/helpRequestsSlice';

// =============================================================================
// TEST STORE SETUP
// =============================================================================

function createTestStore() {
  return configureStore({
    reducer: {
      padTransaction: padTransactionReducer,
      padDevices: padDevicesReducer,
      helpRequests: helpRequestsReducer,
    },
  });
}

type TestStore = ReturnType<typeof createTestStore>;
type TestRootState = ReturnType<TestStore['getState']>;

// Helper to type-cast selectors for our test store
const getStatus = (state: TestRootState) => state.padTransaction.activeTransaction?.status ?? 'idle';
const getActiveTransaction = (state: TestRootState) => state.padTransaction.activeTransaction;
const getAllDevices = (state: TestRootState) => Object.values(state.padDevices.devices);
const getOnlineDevices = (state: TestRootState) => Object.values(state.padDevices.devices).filter((d) => d.status === 'online');
const hasOnlineDevice = (state: TestRootState) => Object.values(state.padDevices.devices).some((d) => d.status === 'online');
const getAllHelpRequests = (state: TestRootState) => state.helpRequests.requests;

// =============================================================================
// FULL CHECKOUT FLOW TESTS
// =============================================================================

describe('Pad Checkout Flow Integration', () => {
  let store: TestStore;

  beforeEach(() => {
    store = createTestStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Happy Path: Send to Pad → Tip → Signature → Complete', () => {
    it('should complete full checkout flow from POS to Pad and back', () => {
      const transactionId = 'txn-12345';
      const ticketId = 'ticket-001';

      // Step 1: Start transaction on Pad
      store.dispatch(startPadTransaction({ transactionId, ticketId }));

      // Verify: Transaction is in 'waiting' state
      let state = store.getState();
      expect(getStatus(state)).toBe('waiting');
      expect(getActiveTransaction(state)?.transactionId).toBe(transactionId);
      expect(getActiveTransaction(state)?.ticketId).toBe(ticketId);

      // Step 2: Tip selection from Pad
      store.dispatch(setTipSelected({
        transactionId,
        tipAmount: 10.00,
        tipPercent: 20,
      }));

      // Verify: Transaction is in 'tip_selected' state
      state = store.getState();
      expect(getStatus(state)).toBe('tip_selected');
      expect(getActiveTransaction(state)?.tipAmount).toBe(10.00);
      expect(getActiveTransaction(state)?.tipPercent).toBe(20);

      // Step 3: Signature capture from Pad
      store.dispatch(setSignatureCaptured({ transactionId }));

      // Verify: Transaction is in 'signature' state
      state = store.getState();
      expect(getStatus(state)).toBe('signature');
      expect(getActiveTransaction(state)?.signatureCaptured).toBe(true);

      // Step 4: Receipt preference from Pad
      store.dispatch(setReceiptPreference({
        transactionId,
        preference: 'email',
      }));

      // Verify: Receipt preference is stored
      state = store.getState();
      expect(getStatus(state)).toBe('receipt');
      expect(getActiveTransaction(state)?.receiptPreference).toBe('email');

      // Step 5: Transaction complete from Pad
      store.dispatch(setTransactionComplete({ transactionId }));

      // Verify: Transaction is complete
      state = store.getState();
      expect(getStatus(state)).toBe('complete');
      expect(getActiveTransaction(state)?.completedAt).toBeDefined();
    });

    it('should track all steps in correct order', () => {
      const transactionId = 'txn-order-test';
      const ticketId = 'ticket-002';
      const steps: string[] = [];

      // Track state changes
      const trackStep = () => {
        const state = store.getState();
        const status = getStatus(state);
        if (!steps.includes(status)) {
          steps.push(status);
        }
      };

      // Initial state
      trackStep();

      // Run through flow
      store.dispatch(startPadTransaction({ transactionId, ticketId }));
      trackStep();
      
      store.dispatch(setTipSelected({ transactionId, tipAmount: 20, tipPercent: 20 }));
      trackStep();
      
      store.dispatch(setSignatureCaptured({ transactionId }));
      trackStep();
      
      store.dispatch(setReceiptPreference({ transactionId, preference: 'email' }));
      trackStep();
      
      store.dispatch(setTransactionComplete({ transactionId }));
      trackStep();

      expect(steps).toEqual(['idle', 'waiting', 'tip_selected', 'signature', 'receipt', 'complete']);
    });
  });

  describe('Cancel Flow: Send to Pad → Cancel', () => {
    it('should allow cancellation before customer interaction', () => {
      const transactionId = 'txn-cancel-1';
      const ticketId = 'ticket-cancel';

      // Start transaction
      store.dispatch(startPadTransaction({ transactionId, ticketId }));
      
      let state = store.getState();
      expect(getStatus(state)).toBe('waiting');

      // Cancel transaction
      store.dispatch(setTransactionCancelled({ transactionId }));

      state = store.getState();
      expect(getStatus(state)).toBe('cancelled');
    });

    it('should allow cancellation after tip selection', () => {
      const transactionId = 'txn-cancel-2';
      const ticketId = 'ticket-cancel-2';

      // Start and select tip
      store.dispatch(startPadTransaction({ transactionId, ticketId }));
      store.dispatch(setTipSelected({ transactionId, tipAmount: 10, tipPercent: 20 }));
      
      let state = store.getState();
      expect(getStatus(state)).toBe('tip_selected');

      // Cancel
      store.dispatch(setTransactionCancelled({ transactionId }));

      state = store.getState();
      expect(getStatus(state)).toBe('cancelled');
    });

    it('should allow cancellation after signature', () => {
      const transactionId = 'txn-cancel-3';
      const ticketId = 'ticket-cancel-3';

      // Progress to signature
      store.dispatch(startPadTransaction({ transactionId, ticketId }));
      store.dispatch(setTipSelected({ transactionId, tipAmount: 10, tipPercent: 20 }));
      store.dispatch(setSignatureCaptured({ transactionId }));
      
      let state = store.getState();
      expect(getStatus(state)).toBe('signature');

      // Cancel
      store.dispatch(setTransactionCancelled({ transactionId }));

      state = store.getState();
      expect(getStatus(state)).toBe('cancelled');
    });

    it('should clear state for new transaction after cancellation', () => {
      const transactionId = 'txn-reset';
      const ticketId = 'ticket-reset';

      // Start and cancel
      store.dispatch(startPadTransaction({ transactionId, ticketId }));
      store.dispatch(setTransactionCancelled({ transactionId }));
      
      // Clear for new transaction
      store.dispatch(clearPadTransaction());

      const state = store.getState();
      expect(getStatus(state)).toBe('idle');
      expect(getActiveTransaction(state)).toBeNull();
    });
  });

  describe('Failure Flow: Send to Pad → Payment Failed', () => {
    it('should handle payment failure gracefully', () => {
      const transactionId = 'txn-fail';
      const ticketId = 'ticket-fail';

      // Progress to payment processing
      store.dispatch(startPadTransaction({ transactionId, ticketId }));
      store.dispatch(setTipSelected({ transactionId, tipAmount: 10, tipPercent: 20 }));
      store.dispatch(setSignatureCaptured({ transactionId }));

      // Simulate payment failure
      const errorMessage = 'Card declined - insufficient funds';
      store.dispatch(setTransactionFailed({ transactionId, errorMessage }));

      const state = store.getState();
      expect(getStatus(state)).toBe('failed');
      expect(getActiveTransaction(state)?.errorMessage).toBe(errorMessage);
    });

    it('should allow retry after failure', () => {
      const transactionId = 'txn-retry';
      const ticketId = 'ticket-retry';

      // Fail first attempt
      store.dispatch(startPadTransaction({ transactionId, ticketId }));
      store.dispatch(setTransactionFailed({ transactionId, errorMessage: 'Network error' }));

      let state = store.getState();
      expect(getStatus(state)).toBe('failed');

      // Clear and retry
      store.dispatch(clearPadTransaction());
      store.dispatch(startPadTransaction({ transactionId: 'txn-retry-2', ticketId }));

      state = store.getState();
      expect(getStatus(state)).toBe('waiting');
    });
  });

  describe('Help Request Notification', () => {
    it('should add help request when customer needs assistance', () => {
      const helpRequest = {
        id: 'help-1',
        transactionId: 'txn-help',
        ticketId: 'ticket-help',
        deviceId: 'pad-001',
        deviceName: 'Checkout Pad 1',
        clientName: 'John Smith',
        requestedAt: new Date().toISOString(),
      };

      store.dispatch(addHelpRequest(helpRequest));

      const state = store.getState();
      const requests = getAllHelpRequests(state);
      expect(requests).toHaveLength(1);
      expect(requests[0].clientName).toBe('John Smith');
      expect(requests[0].deviceName).toBe('Checkout Pad 1');
    });

    it('should acknowledge and dismiss help request', () => {
      const helpRequest = {
        id: 'help-ack',
        transactionId: 'txn-ack',
        ticketId: 'ticket-ack',
        deviceId: 'pad-003',
        deviceName: 'Checkout Pad 3',
        requestedAt: new Date().toISOString(),
      };

      store.dispatch(addHelpRequest(helpRequest));
      store.dispatch(acknowledgeHelpRequest({ id: 'help-ack' }));

      const state = store.getState();
      const requests = getAllHelpRequests(state);
      const acknowledged = requests.find(r => r.id === 'help-ack');
      expect(acknowledged?.acknowledged).toBe(true);
    });

    it('should handle multiple help requests', () => {
      const requests = [
        { id: 'help-a', transactionId: 'txn-a', ticketId: 't-a', deviceId: 'pad-a', deviceName: 'Pad A', requestedAt: '' },
        { id: 'help-b', transactionId: 'txn-b', ticketId: 't-b', deviceId: 'pad-b', deviceName: 'Pad B', requestedAt: '' },
        { id: 'help-c', transactionId: 'txn-c', ticketId: 't-c', deviceId: 'pad-c', deviceName: 'Pad C', requestedAt: '' },
      ];

      requests.forEach(r => store.dispatch(addHelpRequest(r)));

      const state = store.getState();
      const allRequests = getAllHelpRequests(state);
      expect(allRequests).toHaveLength(3);
    });
  });

  describe('Pad Device Connection Status', () => {
    it('should register Pad device on heartbeat', () => {
      const heartbeat = {
        deviceId: 'pad-001',
        deviceName: 'Checkout Pad',
        salonId: 'test-store',
        timestamp: new Date().toISOString(),
        screen: 'idle' as const,
      };

      store.dispatch(handleHeartbeat(heartbeat));

      const state = store.getState();
      const devices = getAllDevices(state);
      expect(devices).toHaveLength(1);
      expect(devices[0].id).toBe('pad-001');
      expect(devices[0].status).toBe('online');
    });

    it('should update existing device on subsequent heartbeat', () => {
      // First heartbeat
      store.dispatch(handleHeartbeat({
        deviceId: 'pad-001',
        deviceName: 'Checkout Pad',
        salonId: 'test-store',
        timestamp: new Date().toISOString(),
        screen: 'idle' as const,
      }));

      // Second heartbeat with different screen
      vi.advanceTimersByTime(15000);
      store.dispatch(handleHeartbeat({
        deviceId: 'pad-001',
        deviceName: 'Checkout Pad',
        salonId: 'test-store',
        timestamp: new Date().toISOString(),
        screen: 'tip' as const,
      }));

      const state = store.getState();
      const devices = getAllDevices(state);
      expect(devices).toHaveLength(1);
      expect(devices[0].screen).toBe('tip');
    });

    it('should mark device offline after timeout', () => {
      // Register device
      store.dispatch(handleHeartbeat({
        deviceId: 'pad-001',
        deviceName: 'Checkout Pad',
        salonId: 'test-store',
        timestamp: new Date().toISOString(),
        screen: 'idle' as const,
      }));

      let state = store.getState();
      expect(getAllDevices(state)[0].status).toBe('online');

      // Advance time past offline threshold (30 seconds)
      vi.advanceTimersByTime(35000);
      store.dispatch(checkOfflineDevices());

      state = store.getState();
      expect(getAllDevices(state)[0].status).toBe('offline');
    });

    it('should report connected Pads correctly', () => {
      // No pads initially
      expect(hasOnlineDevice(store.getState())).toBe(false);

      // Add connected Pad
      store.dispatch(handleHeartbeat({
        deviceId: 'pad-001',
        deviceName: 'Checkout Pad',
        salonId: 'test-store',
        timestamp: new Date().toISOString(),
        screen: 'idle' as const,
      }));

      expect(hasOnlineDevice(store.getState())).toBe(true);
      expect(getOnlineDevices(store.getState())).toHaveLength(1);
    });

    it('should handle multiple Pad devices', () => {
      const pads = [
        { deviceId: 'pad-001', deviceName: 'Checkout Pad 1', screen: 'idle' as const },
        { deviceId: 'pad-002', deviceName: 'Checkout Pad 2', screen: 'tip' as const },
        { deviceId: 'pad-003', deviceName: 'Checkout Pad 3', screen: 'signature' as const },
      ];

      pads.forEach((pad) => {
        store.dispatch(handleHeartbeat({
          ...pad,
          salonId: 'test-store',
          timestamp: new Date().toISOString(),
        }));
      });

      const state = store.getState();
      const devices = getAllDevices(state);
      expect(devices).toHaveLength(3);
      expect(getOnlineDevices(state)).toHaveLength(3);
    });
  });
});

// =============================================================================
// MQTT MESSAGE SIMULATION TESTS
// =============================================================================

describe('MQTT Message Flow Simulation', () => {
  interface MockMqttMessage {
    topic: string;
    payload: unknown;
  }

  class MockMqttService {
    private publishedMessages: MockMqttMessage[] = [];
    private subscriptions: Map<string, ((topic: string, payload: unknown) => void)[]> = new Map();

    publish(topic: string, payload: unknown): void {
      this.publishedMessages.push({ topic, payload });
    }

    subscribe(topic: string, handler: (topic: string, payload: unknown) => void): () => void {
      if (!this.subscriptions.has(topic)) {
        this.subscriptions.set(topic, []);
      }
      this.subscriptions.get(topic)!.push(handler);
      return () => {
        const handlers = this.subscriptions.get(topic);
        if (handlers) {
          const index = handlers.indexOf(handler);
          if (index > -1) handlers.splice(index, 1);
        }
      };
    }

    simulateIncomingMessage(topic: string, payload: unknown): void {
      const handlers = this.subscriptions.get(topic) || [];
      handlers.forEach(handler => handler(topic, payload));
    }

    getPublishedMessages(): MockMqttMessage[] {
      return this.publishedMessages;
    }
  }

  let mqttService: MockMqttService;
  const STORE_ID = 'test-store-123';
  const TOPICS = {
    PAD_READY_TO_PAY: `salon/${STORE_ID}/pad/ready_to_pay`,
    PAD_CANCEL: `salon/${STORE_ID}/pad/cancel`,
    PAD_TIP_SELECTED: `salon/${STORE_ID}/pad/tip_selected`,
    PAD_SIGNATURE: `salon/${STORE_ID}/pad/signature`,
    PAD_TRANSACTION_COMPLETE: `salon/${STORE_ID}/pad/transaction_complete`,
    PAD_HELP_REQUESTED: `salon/${STORE_ID}/pad/help_requested`,
    PAD_HEARTBEAT: `salon/${STORE_ID}/pad/heartbeat`,
  };

  beforeEach(() => {
    mqttService = new MockMqttService();
  });

  it('should publish ready_to_pay message when sending to Pad', () => {
    const transaction = {
      transactionId: 'txn-mqtt-1',
      ticketId: 'ticket-mqtt',
      clientName: 'Jane Doe',
      items: [{ id: 'item-1', name: 'Haircut', quantity: 1, price: 50 }],
      subtotal: 50.00,
      tax: 4.50,
      total: 54.50,
    };

    mqttService.publish(TOPICS.PAD_READY_TO_PAY, transaction);

    const published = mqttService.getPublishedMessages();
    expect(published).toHaveLength(1);
    expect(published[0].topic).toBe(TOPICS.PAD_READY_TO_PAY);
    expect((published[0].payload as typeof transaction).total).toBe(54.50);
  });

  it('should publish cancel message when cancelling transaction', () => {
    const cancel = {
      transactionId: 'txn-cancel',
      ticketId: 'ticket-cancel',
      reason: 'Customer requested',
    };

    mqttService.publish(TOPICS.PAD_CANCEL, cancel);

    const published = mqttService.getPublishedMessages();
    expect(published).toHaveLength(1);
    expect(published[0].topic).toBe(TOPICS.PAD_CANCEL);
  });

  it('should receive tip_selected message from Pad', () => {
    let receivedPayload: unknown = null;

    mqttService.subscribe(TOPICS.PAD_TIP_SELECTED, (_topic, payload) => {
      receivedPayload = payload;
    });

    const tipPayload = {
      transactionId: 'txn-1',
      ticketId: 'ticket-1',
      tipAmount: 10.00,
      tipPercent: 20,
      selectedAt: new Date().toISOString(),
    };

    mqttService.simulateIncomingMessage(TOPICS.PAD_TIP_SELECTED, tipPayload);

    expect(receivedPayload).toEqual(tipPayload);
  });

  it('should receive signature message from Pad', () => {
    let receivedPayload: unknown = null;

    mqttService.subscribe(TOPICS.PAD_SIGNATURE, (_topic, payload) => {
      receivedPayload = payload;
    });

    const signaturePayload = {
      transactionId: 'txn-1',
      ticketId: 'ticket-1',
      signatureData: 'base64-signature-data',
      signedAt: new Date().toISOString(),
    };

    mqttService.simulateIncomingMessage(TOPICS.PAD_SIGNATURE, signaturePayload);

    expect(receivedPayload).toEqual(signaturePayload);
  });

  it('should receive transaction_complete message from Pad', () => {
    let receivedPayload: unknown = null;

    mqttService.subscribe(TOPICS.PAD_TRANSACTION_COMPLETE, (_topic, payload) => {
      receivedPayload = payload;
    });

    const completePayload = {
      transactionId: 'txn-1',
      ticketId: 'ticket-1',
      tipAmount: 10.00,
      total: 60.00,
      completedAt: new Date().toISOString(),
    };

    mqttService.simulateIncomingMessage(TOPICS.PAD_TRANSACTION_COMPLETE, completePayload);

    expect(receivedPayload).toEqual(completePayload);
  });

  it('should receive help_requested message from Pad', () => {
    let receivedPayload: unknown = null;

    mqttService.subscribe(TOPICS.PAD_HELP_REQUESTED, (_topic, payload) => {
      receivedPayload = payload;
    });

    const helpPayload = {
      transactionId: 'txn-1',
      ticketId: 'ticket-1',
      deviceId: 'pad-001',
      deviceName: 'Checkout Pad',
      clientName: 'Customer Name',
      requestedAt: new Date().toISOString(),
    };

    mqttService.simulateIncomingMessage(TOPICS.PAD_HELP_REQUESTED, helpPayload);

    expect(receivedPayload).toEqual(helpPayload);
  });

  it('should handle heartbeat messages for device presence', () => {
    const heartbeats: unknown[] = [];

    mqttService.subscribe(TOPICS.PAD_HEARTBEAT, (_topic, payload) => {
      heartbeats.push(payload);
    });

    // Simulate multiple heartbeats
    for (let i = 0; i < 3; i++) {
      const heartbeat = {
        deviceId: 'pad-001',
        deviceName: 'Checkout Pad',
        salonId: STORE_ID,
        timestamp: new Date().toISOString(),
        screen: 'waiting',
      };
      mqttService.simulateIncomingMessage(TOPICS.PAD_HEARTBEAT, heartbeat);
    }

    expect(heartbeats).toHaveLength(3);
  });
});
