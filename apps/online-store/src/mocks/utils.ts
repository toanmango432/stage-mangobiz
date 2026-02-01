/**
 * Mock Server Utilities
 *
 * Shared helper functions for MSW handlers
 */

/**
 * Simulate network latency
 * @param min Minimum delay in ms (default: 100)
 * @param max Maximum delay in ms (default: 300)
 */
export async function delay(min = 100, max = 300): Promise<void> {
  const latency = min + Math.random() * (max - min);
  await new Promise((resolve) => setTimeout(resolve, latency));
}

/**
 * Simulate random server errors based on MOCK_TURBULENCE setting
 * @param probability Error probability (0-1, default: 0.01 = 1%)
 * @returns true if an error should be simulated
 */
export function errorResponse(probability = 0.01): boolean {
  // Check for MOCK_TURBULENCE global (defined in vite config or test setup)
  const turbulenceEnabled =
    typeof __MOCK_TURBULENCE__ !== 'undefined' && __MOCK_TURBULENCE__;

  if (turbulenceEnabled && Math.random() < probability) {
    return true;
  }
  return false;
}

// Note: __MOCK_TURBULENCE__ is declared in src/types/globals.d.ts
