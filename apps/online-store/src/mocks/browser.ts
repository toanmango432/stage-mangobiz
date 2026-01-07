import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Set up MSW worker for browser environment
export const worker = setupWorker(...handlers);

// Start the worker only in standalone mode
export async function startMockWorker() {
  if (typeof window !== 'undefined') {
    console.log('🚀 Starting MSW worker in standalone mode');
    console.log('🔍 Environment check - window:', typeof window !== 'undefined', 'mode:', typeof __MODE__ !== 'undefined' ? __MODE__ : 'undefined');
    try {
      await worker.start({
        onUnhandledRequest: 'warn',
      });
      console.log('✅ MSW worker started successfully');
    } catch (error) {
      console.error('❌ Failed to start MSW worker:', error);
    }
  } else {
    console.log('⚠️ MSW worker not started - window not available');
  }
}

// Stop the worker
export function stopMockWorker() {
  if (typeof window !== 'undefined') {
    worker.stop();
  }
}
