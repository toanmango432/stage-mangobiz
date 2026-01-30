/**
 * Animation Utilities
 * Helper functions and constants for smooth animations
 */

import { premiumDesignSystem } from '../constants/premiumDesignSystem';

// ============================================================================
// ANIMATION CLASSES (Tailwind)
// ============================================================================

export const animationClasses = {
  // Fade animations
  fadeIn: 'animate-fade-in',

  // Slide animations
  slideUp: 'animate-slide-up',
  slideDown: 'animate-slide-down',
  slideLeft: 'animate-slide-left',
  slideRight: 'animate-slide-in-right',

  // Scale animations
  scaleIn: 'animate-scale-in',
  scaleSpring: 'animate-scale-spring',

  // Other
  pulseSlow: 'animate-pulse-slow',

  // Transitions
  transition: {
    instant: 'transition-all duration-100',
    fast: 'transition-all duration-200',
    normal: 'transition-all duration-300',
    slow: 'transition-all duration-500',
    verySlow: 'transition-all duration-800',
  },

  // Easing
  easing: {
    smooth: 'ease-smooth',
    spring: 'ease-spring',
    elastic: 'ease-elastic',
  },

  // Hover effects
  hover: {
    lift: 'hover:-translate-y-0.5 hover:shadow-md transition-all duration-200',
    liftLarge: 'hover:-translate-y-1 hover:shadow-lg transition-all duration-200',
    scale: 'hover:scale-105 transition-transform duration-200',
    scaleSmall: 'hover:scale-102 transition-transform duration-200',
    opacity: 'hover:opacity-80 transition-opacity duration-200',
    brighten: 'hover:brightness-110 transition-all duration-200',
  },

  // Active/Press effects
  active: {
    press: 'active:scale-[0.98]',
    pressSmall: 'active:scale-[0.99]',
  },
};

// ============================================================================
// CSS-IN-JS ANIMATION HELPERS
// ============================================================================

/**
 * Get CSS transition string
 */
export function transition(
  properties: string | string[] = 'all',
  duration: keyof typeof premiumDesignSystem.animation.duration = 'normal',
  easing: keyof typeof premiumDesignSystem.animation.easing = 'easeInOut'
): string {
  const props = Array.isArray(properties) ? properties.join(', ') : properties;
  const dur = premiumDesignSystem.animation.duration[duration];
  const ease = premiumDesignSystem.animation.easing[easing];

  return `${props} ${dur} ${ease}`;
}

/**
 * Get keyframe animation string
 */
export function keyframeAnimation(
  name: string,
  duration = '300ms',
  easing = 'ease-out',
  delay = '0ms',
  fillMode = 'forwards'
): string {
  return `${name} ${duration} ${easing} ${delay} ${fillMode}`;
}

// ============================================================================
// STAGGERED ANIMATION HELPERS
// ============================================================================

/**
 * Generate stagger delay for list items
 * @param index - Item index
 * @param baseDelay - Base delay in ms
 * @returns Delay in ms
 */
export function staggerDelay(index: number, baseDelay = 50): number {
  return index * baseDelay;
}

/**
 * Generate CSS delay string for stagger effect
 */
export function staggerDelayStyle(index: number, baseDelay = 50): React.CSSProperties {
  return {
    animationDelay: `${staggerDelay(index, baseDelay)}ms`,
  };
}

// ============================================================================
// SPRING ANIMATION CALCULATOR
// ============================================================================

export interface SpringConfig {
  stiffness?: number;
  damping?: number;
  mass?: number;
}

/**
 * Calculate spring animation values (for use with CSS or JS animations)
 * Based on physics simulation
 */
export function calculateSpring(config: SpringConfig = {}) {
  const {
    stiffness = 170,
    damping = 26,
    mass = 1,
  } = config;

  const omega = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));

  return {
    duration: Math.floor((2 * Math.PI) / omega),
    easing: zeta >= 1
      ? 'cubic-bezier(0.4, 0.0, 0.2, 1)' // Critically damped
      : 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Under-damped (bouncy)
  };
}

// ============================================================================
// SCROLL ANIMATIONS
// ============================================================================

/**
 * Smooth scroll to element
 */
export function scrollToElement(
  element: HTMLElement | null,
  options: ScrollIntoViewOptions = {
    behavior: 'smooth',
    block: 'center',
  }
) {
  if (!element) return;
  element.scrollIntoView(options);
}

/**
 * Smooth scroll to top
 */
export function scrollToTop(smooth = true) {
  window.scrollTo({
    top: 0,
    behavior: smooth ? 'smooth' : 'auto',
  });
}

// ============================================================================
// INTERSECTION OBSERVER HELPERS (for scroll-triggered animations)
// ============================================================================

export interface ScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;  // Animate only once
}

/**
 * Create intersection observer for scroll animations
 */
export function createScrollAnimation(
  callback: (entry: IntersectionObserverEntry) => void,
  options: ScrollAnimationOptions = {}
): IntersectionObserver {
  const {
    threshold = 0.1,
    rootMargin = '0px',
    once = true,
  } = options;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback(entry);
          if (once) {
            observer.unobserve(entry.target);
          }
        }
      });
    },
    {
      threshold,
      rootMargin,
    }
  );

  return observer;
}

// ============================================================================
// LOADING ANIMATIONS
// ============================================================================

/**
 * Skeleton loading pulse classes
 */
export const skeletonClasses = 'animate-pulse bg-gray-200 rounded';

/**
 * Spinner component data (can be used with inline SVG)
 */
export const spinnerAnimation = {
  className: 'animate-spin',
  svg: `
    <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  `,
};

// ============================================================================
// MICRO-INTERACTION HELPERS
// ============================================================================

/**
 * Haptic feedback (for supported devices)
 */
export function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  if ('vibrate' in navigator) {
    const duration = type === 'light' ? 10 : type === 'medium' ? 20 : 30;
    navigator.vibrate(duration);
  }
}

/**
 * Visual feedback - brief highlight effect
 */
export function highlightElement(element: HTMLElement, duration = 300) {
  element.classList.add('ring-2', 'ring-brand-500', 'ring-offset-2');
  setTimeout(() => {
    element.classList.remove('ring-2', 'ring-brand-500', 'ring-offset-2');
  }, duration);
}

// ============================================================================
// GPU-ACCELERATED ANIMATION HELPERS (Phase 8)
// ============================================================================

/**
 * GPU-accelerated CSS properties
 * These properties are composited on the GPU for 60fps performance
 * ONLY use transform and opacity for animations - avoid layout-triggering properties
 */
export const gpuAnimations = {
  /**
   * Fade in animation (GPU accelerated)
   */
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    style: { willChange: 'opacity' } as React.CSSProperties,
  },

  /**
   * Fade out animation (GPU accelerated)
   */
  fadeOut: {
    initial: { opacity: 1 },
    animate: { opacity: 0 },
    style: { willChange: 'opacity' } as React.CSSProperties,
  },

  /**
   * Slide up animation (GPU accelerated)
   */
  slideUp: {
    initial: { transform: 'translate3d(0, 20px, 0)', opacity: 0 },
    animate: { transform: 'translate3d(0, 0, 0)', opacity: 1 },
    style: { willChange: 'transform, opacity' } as React.CSSProperties,
  },

  /**
   * Slide down animation (GPU accelerated)
   */
  slideDown: {
    initial: { transform: 'translate3d(0, -20px, 0)', opacity: 0 },
    animate: { transform: 'translate3d(0, 0, 0)', opacity: 1 },
    style: { willChange: 'transform, opacity' } as React.CSSProperties,
  },

  /**
   * Scale animation (GPU accelerated)
   */
  scaleIn: {
    initial: { transform: 'scale3d(0.95, 0.95, 1)', opacity: 0 },
    animate: { transform: 'scale3d(1, 1, 1)', opacity: 1 },
    style: { willChange: 'transform, opacity' } as React.CSSProperties,
  },

  /**
   * Modal entrance animation (GPU accelerated)
   */
  modalEnter: {
    initial: { transform: 'translate3d(0, 10px, 0) scale3d(0.98, 0.98, 1)', opacity: 0 },
    animate: { transform: 'translate3d(0, 0, 0) scale3d(1, 1, 1)', opacity: 1 },
    style: { willChange: 'transform, opacity' } as React.CSSProperties,
  },

  /**
   * Card hover lift (GPU accelerated)
   */
  cardHover: {
    initial: { transform: 'translate3d(0, 0, 0)' },
    hover: { transform: 'translate3d(0, -2px, 0)' },
    style: { willChange: 'transform' } as React.CSSProperties,
  },

  /**
   * Button press animation (GPU accelerated)
   */
  buttonPress: {
    initial: { transform: 'scale3d(1, 1, 1)' },
    pressed: { transform: 'scale3d(0.98, 0.98, 1)' },
    style: { willChange: 'transform' } as React.CSSProperties,
  },
};

/**
 * CSS transition strings optimized for GPU
 * These use transform and opacity only for smooth 60fps animations
 */
export const gpuTransitions = {
  fast: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1), opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)',
};

/**
 * Tailwind classes for GPU-accelerated animations
 * These use only transform and opacity properties
 */
export const gpuAnimationClasses = {
  // Transitions (GPU optimized)
  transitionGpu: 'transition-[transform,opacity] duration-200 ease-out',
  transitionGpuFast: 'transition-[transform,opacity] duration-150 ease-out',
  transitionGpuSlow: 'transition-[transform,opacity] duration-300 ease-out',

  // Hover effects (GPU optimized)
  hoverLiftGpu: 'hover:-translate-y-0.5 transition-transform duration-200',
  hoverScaleGpu: 'hover:scale-105 transition-transform duration-200',

  // Press effects (GPU optimized)
  pressGpu: 'active:scale-[0.98] transition-transform duration-100',

  // Will-change hints (use sparingly)
  willChangeTransform: 'will-change-transform',
  willChangeOpacity: 'will-change-[opacity]',
  willChangeAuto: 'will-change-auto',
};

/**
 * Apply will-change temporarily during animation
 * IMPORTANT: Remove will-change after animation to free GPU memory
 */
export function withWillChange(
  element: HTMLElement | null,
  properties: string,
  callback: () => void,
  duration = 300
): void {
  if (!element) return;

  element.style.willChange = properties;
  callback();

  setTimeout(() => {
    element.style.willChange = 'auto';
  }, duration + 50); // Add small buffer
}

/**
 * Check if animations should be reduced for performance
 */
export function shouldReduceAnimations(): boolean {
  // Check user preference
  if (prefersReducedMotion()) return true;

  // Check for low-end device (simple heuristic)
  if (typeof navigator !== 'undefined' && 'hardwareConcurrency' in navigator) {
    if ((navigator as Navigator & { hardwareConcurrency: number }).hardwareConcurrency <= 2) {
      return true;
    }
  }

  return false;
}

// ============================================================================
// PERFORMANCE HELPERS
// ============================================================================

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get animation duration based on user preference
 */
export function getAnimationDuration(defaultDuration: number): number {
  return prefersReducedMotion() ? 0 : defaultDuration;
}

/**
 * Conditionally apply animation class
 */
export function animateIf(
  condition: boolean,
  animationClass: string,
  fallbackClass = ''
): string {
  if (prefersReducedMotion()) return fallbackClass;
  return condition ? animationClass : fallbackClass;
}

// ============================================================================
// REACT HOOKS (optional - for future use)
// ============================================================================

/**
 * Custom hook for mounting animation
 * Usage: const { mounted, animating } = useMountAnimation(300);
 * 
 * Note: This function is commented out because it requires React to be imported.
 * To use this hook, copy it into your component file and import React there.
 */

/*
import { useState, useEffect } from 'react';

export function useMountAnimation(duration: number = 300) {
  const [mounted, setMounted] = useState(false);
  const [animating, setAnimating] = useState(true);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      setAnimating(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  return { mounted, animating };
}
*/

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  classes: animationClasses,
  transition,
  keyframeAnimation,
  staggerDelay,
  staggerDelayStyle,
  calculateSpring,
  scrollToElement,
  scrollToTop,
  createScrollAnimation,
  skeleton: skeletonClasses,
  spinner: spinnerAnimation,
  triggerHaptic,
  highlightElement,
  prefersReducedMotion,
  getAnimationDuration,
  animateIf,
  // Phase 8: GPU-accelerated animations
  gpuAnimations,
  gpuTransitions,
  gpuAnimationClasses,
  withWillChange,
  shouldReduceAnimations,
};
