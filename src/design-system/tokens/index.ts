/**
 * Design System - Tokens Export
 * Central export for all design tokens
 */

// Import all tokens
import { BOOK_COLORS, getStatusColor, getCategoryColor, getSourceColor, getClientTypeColor, getValueColor } from './colors';
import { BOOK_TYPOGRAPHY, TEXT_STYLES, TRUNCATE_STYLES, getTextStyle } from './typography';
import { BOOK_SPACING, SEMANTIC_SPACING, RESPONSIVE_SPACING, getResponsiveSpacing } from './spacing';
import { BOOK_SHADOWS, COLORED_SHADOWS, FOCUS_RINGS, ELEVATION, COMPONENT_SHADOWS, getComponentShadow } from './shadows';
import { BOOK_RADIUS, COMPONENT_RADIUS, getComponentRadius } from './radius';

// Export all tokens
export {
  // Colors
  BOOK_COLORS,
  getStatusColor,
  getCategoryColor,
  getSourceColor,
  getClientTypeColor,
  getValueColor,

  // Typography
  BOOK_TYPOGRAPHY,
  TEXT_STYLES,
  TRUNCATE_STYLES,
  getTextStyle,

  // Spacing
  BOOK_SPACING,
  SEMANTIC_SPACING,
  RESPONSIVE_SPACING,
  getResponsiveSpacing,

  // Shadows
  BOOK_SHADOWS,
  COLORED_SHADOWS,
  FOCUS_RINGS,
  ELEVATION,
  COMPONENT_SHADOWS,
  getComponentShadow,

  // Radius
  BOOK_RADIUS,
  COMPONENT_RADIUS,
  getComponentRadius,
};

// Export types
export type {
  StatusKey,
  CategoryKey,
  SourceKey,
  ClientTypeKey,
} from './colors';

export type {
  FontSize,
  FontWeight,
  LineHeight,
  TextStyleCategory,
} from './typography';

export type {
  SpacingKey,
  SemanticSpacingKey,
} from './spacing';

export type {
  ShadowKey,
  ElevationKey,
  ComponentShadowKey,
} from './shadows';

export type {
  RadiusKey,
  ComponentRadiusKey,
} from './radius';

/**
 * Complete Design Token Object
 * Use this for accessing all tokens in one place
 */
export const DesignTokens = {
  colors: BOOK_COLORS,
  typography: BOOK_TYPOGRAPHY,
  textStyles: TEXT_STYLES,
  spacing: BOOK_SPACING,
  semanticSpacing: SEMANTIC_SPACING,
  shadows: BOOK_SHADOWS,
  elevation: ELEVATION,
  radius: BOOK_RADIUS,
  componentRadius: COMPONENT_RADIUS,
} as const;

/**
 * Quick access helpers
 */
export const tokens = {
  // Color helpers
  color: (key: keyof typeof BOOK_COLORS) => BOOK_COLORS[key],
  status: getStatusColor,
  category: getCategoryColor,
  source: getSourceColor,
  clientType: getClientTypeColor,
  value: getValueColor,

  // Spacing helpers
  space: (key: keyof typeof BOOK_SPACING) => BOOK_SPACING[key],
  gap: (key: keyof typeof SEMANTIC_SPACING) => SEMANTIC_SPACING[key],

  // Shadow helpers
  shadow: (key: keyof typeof BOOK_SHADOWS) => BOOK_SHADOWS[key],
  elevation: (key: keyof typeof ELEVATION) => ELEVATION[key],
  componentShadow: getComponentShadow,

  // Radius helpers
  radius: (key: keyof typeof BOOK_RADIUS) => BOOK_RADIUS[key],
  componentRadius: getComponentRadius,

  // Typography helpers
  text: getTextStyle,
  font: (key: keyof typeof BOOK_TYPOGRAPHY.fontSize) => BOOK_TYPOGRAPHY.fontSize[key],
  weight: (key: keyof typeof BOOK_TYPOGRAPHY.fontWeight) => BOOK_TYPOGRAPHY.fontWeight[key],
} as const;
