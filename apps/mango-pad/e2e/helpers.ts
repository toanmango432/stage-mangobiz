/**
 * E2E Test Helpers
 * Utilities for simulating MQTT messages and managing test state
 */

import { type Page } from '@playwright/test';

export interface TransactionPayload {
  transactionId: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  staffName: string;
  items: { name: string; price: number; quantity: number; type: 'service' | 'product' }[];
  subtotal: number;
  tax: number;
  discount?: number;
  total: number;
  loyaltyPoints?: number;
  suggestedTips: number[];
  showReceiptOptions: boolean;
  terminalType?: 'pax' | 'dejavoo' | 'clover' | 'generic';
}

export async function waitForStoreReady(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const store = (window as unknown as { __REDUX_STORE__?: unknown }).__REDUX_STORE__;
      return !!store;
    },
    { timeout: 15000 }
  );
}

export interface PaymentResultPayload {
  success: boolean;
  cardLast4?: string;
  authCode?: string;
  failureReason?: string;
}

export const mockTransaction: TransactionPayload = {
  transactionId: 'test-txn-001',
  clientId: 'client-001',
  clientName: 'Jane Doe',
  clientEmail: 'jane@example.com',
  clientPhone: '+1 555-123-4567',
  staffName: 'Maria Smith',
  items: [
    { name: 'Haircut', price: 45.00, quantity: 1, type: 'service' },
    { name: 'Color Treatment', price: 85.00, quantity: 1, type: 'service' },
    { name: 'Shampoo (Retail)', price: 25.00, quantity: 1, type: 'product' },
  ],
  subtotal: 155.00,
  tax: 13.18,
  total: 168.18,
  loyaltyPoints: 168,
  suggestedTips: [18, 20, 25, 30],
  showReceiptOptions: true,
  terminalType: 'pax',
};

export const mockPaymentSuccess: PaymentResultPayload = {
  success: true,
  cardLast4: '4242',
  authCode: 'A12345',
};

export const mockPaymentFailure: PaymentResultPayload = {
  success: false,
  failureReason: 'Card declined - insufficient funds',
};

export async function dispatchReduxAction(page: Page, action: { type: string; payload?: unknown }): Promise<void> {
  await page.evaluate((act) => {
    const store = (window as unknown as { __REDUX_STORE__?: { dispatch: (a: unknown) => void } }).__REDUX_STORE__;
    if (store) {
      store.dispatch(act);
    }
  }, action);
}

export async function getReduxState(page: Page): Promise<unknown> {
  return page.evaluate(() => {
    const store = (window as unknown as { __REDUX_STORE__?: { getState: () => unknown } }).__REDUX_STORE__;
    return store ? store.getState() : null;
  });
}

export async function setMqttConnected(page: Page): Promise<void> {
  await waitForStoreReady(page);
  await dispatchReduxAction(page, {
    type: 'pad/setMqttConnectionStatus',
    payload: 'connected',
  });
  await dispatchReduxAction(page, {
    type: 'ui/setShowReconnecting',
    payload: false,
  });
}

export async function simulateReadyToPay(page: Page, transaction?: Partial<TransactionPayload>): Promise<void> {
  await waitForStoreReady(page);
  await setMqttConnected(page);
  const payload = { ...mockTransaction, ...transaction };
  await dispatchReduxAction(page, {
    type: 'transaction/setTransaction',
    payload,
  });
  await dispatchReduxAction(page, {
    type: 'pad/setScreen',
    payload: 'order-review',
  });
}

export async function simulatePaymentResult(page: Page, success: boolean): Promise<void> {
  const result = success ? mockPaymentSuccess : mockPaymentFailure;
  await dispatchReduxAction(page, {
    type: 'transaction/setPaymentResult',
    payload: {
      ...result,
      processedAt: new Date().toISOString(),
    },
  });
  await dispatchReduxAction(page, {
    type: 'pad/setScreen',
    payload: 'result',
  });
}

export async function simulateCancel(page: Page): Promise<void> {
  await dispatchReduxAction(page, { type: 'transaction/clearTransaction' });
  await dispatchReduxAction(page, { type: 'pad/resetToIdle' });
}

export async function waitForScreen(page: Page, screen: string): Promise<void> {
  await page.waitForFunction(
    (expectedScreen) => {
      const store = (window as unknown as { __REDUX_STORE__?: { getState: () => { pad: { currentScreen: string } } } }).__REDUX_STORE__;
      return store?.getState()?.pad?.currentScreen === expectedScreen;
    },
    screen,
    { timeout: 10000 }
  );
}

export async function getCurrentScreen(page: Page): Promise<string> {
  return page.evaluate(() => {
    const store = (window as unknown as { __REDUX_STORE__?: { getState: () => { pad: { currentScreen: string } } } }).__REDUX_STORE__;
    return store?.getState()?.pad?.currentScreen ?? 'unknown';
  });
}

export async function exposeReduxStore(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.addEventListener('DOMContentLoaded', () => {
      const checkStore = () => {
        const root = document.getElementById('root');
        if (root) {
          const reactRoot = (root as unknown as { _reactRootContainer?: { _internalRoot?: { current?: { memoizedState?: { element?: { props?: { store?: unknown } } } } } } })._reactRootContainer;
          if (reactRoot?._internalRoot?.current?.memoizedState?.element?.props?.store) {
            (window as unknown as { __REDUX_STORE__?: unknown }).__REDUX_STORE__ = 
              reactRoot._internalRoot.current.memoizedState.element.props.store;
          }
        }
        if (!(window as unknown as { __REDUX_STORE__?: unknown }).__REDUX_STORE__) {
          setTimeout(checkStore, 100);
        }
      };
      checkStore();
    });
  });
}
