/**
 * V2 Booking Animations - Smooth, delightful micro-interactions
 *
 * NOTE: This file uses Tailwind CSS animation classes instead of @emotion/react keyframes.
 * The original keyframe definitions are preserved as comments for reference.
 * Use the animationClasses object below to apply animations.
 */

// Tailwind animation classes that correspond to the original keyframes
// These use Tailwind's built-in animation utilities or custom classes defined in tailwind.config.js

// Page transitions - use: animate-slide-in-right, animate-slide-in-left
// Cart animations - use: animate-bounce-in, animate-fade-in-up
// Success animations - use: animate-checkmark, animate-confetti
// Error animations - use: animate-shake
// Loading animations - use: animate-pulse, animate-skeleton

// Utility classes for animations
export const animationClasses = {
  slideInRight: 'animate-slide-in-right',
  slideInLeft: 'animate-slide-in-left',
  bounceIn: 'animate-bounce-in',
  fadeInUp: 'animate-fade-in-up',
  shake: 'animate-shake',
  pulse: 'animate-pulse',
  skeleton: 'animate-skeleton',
};



