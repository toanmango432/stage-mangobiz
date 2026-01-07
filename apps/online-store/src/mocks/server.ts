import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Set up MSW server for Node environment (SSR, tests)
export const server = setupServer(...handlers);

// Start the server only in standalone mode
export function startMockServer() {
  if (__MODE__ === 'standalone') {
    console.log('🚀 Starting MSW server in standalone mode');
    server.listen({
      onUnhandledRequest: 'warn',
    });
  }
}

// Stop the server
export function stopMockServer() {
  server.close();
}

// Reset handlers (useful for tests)
export function resetMockHandlers() {
  server.resetHandlers();
}
