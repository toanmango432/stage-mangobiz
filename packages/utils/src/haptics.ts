/**
 * Haptics Utility
 *
 * Provides haptic feedback for touch interactions on supported devices.
 * Falls back gracefully on devices that don't support vibration.
 */

// Check if device supports haptic feedback
const supportsHaptics = typeof navigator !== 'undefined' && 'vibrate' in navigator;

/**
 * Trigger haptic feedback
 * @param pattern - Vibration pattern in milliseconds (single number or array)
 */
function vibrate(pattern: number | number[]): void {
  if (supportsHaptics) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Silently fail if vibration is not supported
    }
  }
}

/**
 * Haptic feedback presets for different interaction types
 */
export const haptics = {
  /**
   * Light haptic - for subtle UI feedback
   * Use for: button taps, toggle switches, selections
   */
  light: () => vibrate(10),

  /**
   * Medium haptic - for standard interactions
   * Use for: navigation changes, successful actions
   */
  medium: () => vibrate(20),

  /**
   * Heavy haptic - for significant actions
   * Use for: confirmation dialogs, important state changes
   */
  heavy: () => vibrate(30),

  /**
   * Success haptic - two-beat pattern
   * Use for: payment success, form submission, task completion
   */
  success: () => vibrate([10, 50, 20]),

  /**
   * Error haptic - strong single pulse
   * Use for: validation errors, failed actions, warnings
   */
  error: () => vibrate([50, 30, 50]),

  /**
   * Warning haptic - attention-getting pattern
   * Use for: destructive action confirmations
   */
  warning: () => vibrate([30, 50, 30]),

  /**
   * Selection haptic - very subtle
   * Use for: list item selection, tab changes, menu items
   */
  selection: () => vibrate(5),

  /**
   * Impact haptic - for collisions/drops
   * Use for: drag and drop, calendar slot selection
   */
  impact: () => vibrate(15),

  /**
   * Notification haptic - attention pattern
   * Use for: new notifications, alerts
   */
  notification: () => vibrate([10, 100, 10, 100, 10]),

  /**
   * Custom haptic - provide your own pattern
   * @param pattern - Duration in ms, or array of [vibrate, pause, vibrate, ...]
   */
  custom: (pattern: number | number[]) => vibrate(pattern),

  /**
   * Check if haptics are supported on this device
   */
  isSupported: () => supportsHaptics,
};

/**
 * React hook for haptic feedback
 *
 * @example
 * ```tsx
 * function PayButton() {
 *   const triggerHaptic = useHaptic('success');
 *
 *   const handlePay = () => {
 *     processPayment();
 *     triggerHaptic();
 *   };
 *
 *   return <button onClick={handlePay}>Pay</button>;
 * }
 * ```
 */
export function useHaptic(type: keyof Omit<typeof haptics, 'custom' | 'isSupported'>) {
  return () => haptics[type]();
}

/**
 * Higher-order function to add haptic feedback to any handler
 *
 * @example
 * ```tsx
 * <button onClick={withHaptic(handleClick, 'light')}>
 *   Click me
 * </button>
 * ```
 */
export function withHaptic<T extends (...args: any[]) => any>(
  handler: T,
  type: keyof Omit<typeof haptics, 'custom' | 'isSupported'> = 'light'
): T {
  return ((...args: Parameters<T>) => {
    haptics[type]();
    return handler(...args);
  }) as T;
}

export default haptics;
