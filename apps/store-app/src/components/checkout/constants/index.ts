/**
 * Checkout Module Constants
 */

export { MOCK_OPEN_TICKETS, KEYBOARD_HINTS_DISMISSED_KEY } from "./mockData";

/**
 * Default tax rate for checkout calculations
 * Note: This is used as a fallback. Production code should use catalogSettings.defaultTaxRate from Redux.
 * The checkout component receives tax rate from catalogSettings via props/hooks.
 */
export const DEFAULT_TAX_RATE = 0.085;
