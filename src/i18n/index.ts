/**
 * Internationalization Entry Point
 *
 * Central export for all i18n string modules.
 * Each module contains strings for a specific feature area.
 */

export { strings as frontDeskStrings, getString as getFrontDeskString } from './frontdesk';
export type { StringKeys as FrontDeskStringKeys } from './frontdesk';
