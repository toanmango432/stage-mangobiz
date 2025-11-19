/**
 * Unified Paper Ticket Design System
 * Shared styles for all ticket components to ensure consistency
 */

import { CSSProperties } from 'react';

// Paper color palette
export const paperColors = {
  // Paper backgrounds (from ServiceTicketCard)
  ivory: '#FFFCF7',
  cream: '#FFFBF5',
  vanilla: '#FFF9F0',
  warmBeige: '#FFF8E8',

  // Border colors
  borderBase: '#e8dcc8',
  borderDusty: '#d4b896',

  // Text colors
  primaryText: '#1a1614',
  secondaryText: '#6B5948', // Improved contrast from #8b7968
  tertiaryText: '#6b5d52',

  // Perforation color
  perforation: '#c4b5a0',

  // State colors for borders
  states: {
    waiting: '#CD7854',      // Terracotta (warm earth tone, preserves paper feel)
    waitingGlow: '#E39876',  // Light terracotta for pulse
    inService: '#10B981',    // Green
    pending: '#6B7280',      // Gray
    completed: '#10B981',    // Green
    cancelled: '#EF4444',    // Red
  }
};

// Shadow definitions
export const paperShadows = {
  // Card shadows by view mode
  compact: '0 1px 3px rgba(139, 92, 46, 0.12), 0 2px 4px rgba(139, 92, 46, 0.08)',
  normal: '0 2px 4px rgba(139, 92, 46, 0.12), 0 4px 6px rgba(139, 92, 46, 0.08)',
  gridNormal: `
    inset 0 0.5px 0 rgba(255,255,255,0.70),
    inset 0 -0.8px 1px rgba(0,0,0,0.05),
    0.5px 0.5px 0 rgba(255,255,255,0.80),
    -3px 0 8px rgba(0,0,0,0.08),
    2px 3px 4px rgba(0,0,0,0.04),
    4px 8px 12px rgba(0,0,0,0.08)
  `,

  // Edge shadow for paper thickness
  edgeThickness: 'inset 3px 0 4px rgba(0,0,0,0.20), inset 6px 0 8px rgba(0,0,0,0.12)',

  // Wrap-around ticket number badge (6 layers!)
  wrapBadge: `
    2px 0 6px rgba(139, 92, 46, 0.15),
    1.5px 0 3px rgba(139, 92, 46, 0.12),
    1px 0 1.5px rgba(139, 92, 46, 0.10),
    inset 0 1.5px 0 rgba(255, 255, 255, 1),
    inset 0 -1.5px 2px rgba(139, 92, 46, 0.08),
    inset -1.5px 0 1.5px rgba(255, 255, 255, 0.6)
  `,

  // Hover shadows
  hoverCompact: '0 2px 6px rgba(139, 92, 46, 0.15), 0 4px 8px rgba(139, 92, 46, 0.10)',
  hoverNormal: '0 4px 8px rgba(139, 92, 46, 0.15), 0 8px 12px rgba(139, 92, 46, 0.10)',
};

// Paper gradients
export const paperGradients = {
  // Main paper background
  background: 'linear-gradient(145deg, #FFFCF7 0%, #FFFBF5 40%, #FFF9F0 100%)',

  // Notch gradients
  notchLeft: 'linear-gradient(to right, #f8f3eb, #f5f0e8)',
  notchRight: 'linear-gradient(to left, #f8f3eb, #f5f0e8)',

  // Badge gradient
  wrapBadge: 'linear-gradient(135deg, #ffffff 0%, #fffcf7 50%, #fffbf5 100%)',

  // Texture overlays
  lineTexture: 'repeating-linear-gradient(90deg, transparent 0px, rgba(180, 150, 110, 0.03) 1px, transparent 2px)',
  crossTexture: `
    repeating-linear-gradient(90deg, transparent 0px, rgba(180, 150, 110, 0.03) 1px, transparent 2px, transparent 3px),
    repeating-linear-gradient(0deg, transparent 0px, rgba(180, 150, 110, 0.03) 1px, transparent 2px, transparent 3px)
  `,
};

// Animation timings
export const paperAnimations = {
  duration: {
    fast: '200ms',
    normal: '300ms',
    slow: '500ms',
  },
  easing: {
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    out: 'ease-out',
  }
};

// Perforation configurations
export const perforationConfig = {
  compact: {
    count: 12,
    size: '1.5px',
    opacity: 0.2,
  },
  normal: {
    count: 15,
    size: '2px',
    opacity: 0.2,
  },
  gridNormal: {
    count: 20,
    size: '3px',
    opacity: 0.25,
  },
};

// Notch configurations
export const notchConfig = {
  compact: {
    size: '6px',
    position: '3px',
    shadow: 'none',
  },
  normal: {
    size: '8px',
    position: '4px',
    shadow: 'inset -1px 0 2px rgba(139, 92, 46, 0.10)',
  },
  gridNormal: {
    size: '12px',
    position: '6px',
    shadow: 'inset -2px 0 3px rgba(139, 92, 46, 0.10)',
  },
};

// State-based border styles
export const stateBorderStyles = {
  waiting: {
    border: `2px solid ${paperColors.states.waiting}`,
    boxShadow: `0 0 0 1px rgba(205, 120, 84, 0.1)`,
    animation: 'terracottaPulse 2s ease-in-out infinite',
  },
  inService: {
    border: `2px solid ${paperColors.states.inService}`,
    boxShadow: 'none',
    animation: 'none',
  },
  pending: {
    border: `2px dashed ${paperColors.states.pending}`,
    boxShadow: 'none',
    animation: 'none',
  },
  completed: {
    border: `2px solid ${paperColors.states.completed}`,
    boxShadow: '0 0 0 1px rgba(16, 185, 129, 0.1)',
    animation: 'none',
  },
  cancelled: {
    border: `2px solid ${paperColors.states.cancelled}`,
    boxShadow: 'none',
    animation: 'none',
    opacity: 0.7,
  },
};

// Get styles for specific view mode
export const getViewModeStyles = (viewMode: 'compact' | 'normal' | 'gridNormal' | 'gridCompact') => {
  const baseMode = viewMode === 'gridCompact' ? 'compact' : viewMode;

  return {
    shadow: paperShadows[baseMode as keyof typeof paperShadows] || paperShadows.normal,
    perforation: perforationConfig[baseMode as keyof typeof perforationConfig] || perforationConfig.normal,
    notch: notchConfig[baseMode as keyof typeof notchConfig] || notchConfig.normal,
    padding: viewMode === 'compact' ? '8px' : viewMode === 'gridCompact' ? '12px' : '16px',
    borderRadius: viewMode.includes('grid') ? '12px' : '8px',
  };
};

// Get animation styles for hover
export const getHoverStyles = (viewMode: string): CSSProperties => {
  const isGrid = viewMode.includes('grid');
  const rotation = isGrid ? '0.5deg' : '0.2deg';
  const translateY = isGrid ? '-2px' : '-1px';

  return {
    transform: `translateY(${translateY}) rotate(${rotation})`,
    transition: `all ${isGrid ? paperAnimations.duration.slow : paperAnimations.duration.normal} ${paperAnimations.easing.out}`,
  };
};

// Export CSS animation keyframes as a string for injection
export const paperKeyframes = `
  @keyframes terracottaPulse {
    0%, 100% {
      border-color: ${paperColors.states.waiting};
      box-shadow: 0 0 0 1px rgba(205, 120, 84, 0.1);
    }
    50% {
      border-color: ${paperColors.states.waitingGlow};
      box-shadow: 0 0 0 2px rgba(205, 120, 84, 0.15);
    }
  }

  @keyframes paperShine {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }

  @keyframes printTicket {
    from { clip-path: inset(0 100% 0 0); }
    to { clip-path: inset(0 0 0 0); }
  }

  @keyframes stampComplete {
    0% { transform: scale(1.5) rotate(-5deg); opacity: 0; }
    50% { transform: scale(1.1) rotate(2deg); opacity: 1; }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
  }
`;