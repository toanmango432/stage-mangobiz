/**
 * Framer Motion type augmentation for v12 compatibility
 * Fixes HTMLMotionProps type mismatch between framer-motion v12 and React types
 *
 * The issue is that framer-motion v12's types are incompatible with some React
 * configurations. This augmentation allows motion components to accept standard props.
 */

import 'framer-motion';

// Augment framer-motion module to fix type compatibility
declare module 'framer-motion' {
  interface MotionProps {
    initial?: object | string | boolean;
    animate?: object | string;
    exit?: object | string;
    transition?: object;
    variants?: object;
    whileHover?: object | string;
    whileTap?: object | string;
    whileFocus?: object | string;
    whileDrag?: object | string;
    whileInView?: object | string;
    viewport?: object;
    onAnimationStart?: () => void;
    onAnimationComplete?: () => void;
    layout?: boolean | 'position' | 'size';
    layoutId?: string;
    drag?: boolean | 'x' | 'y';
    dragConstraints?: object;
    dragElastic?: number | boolean;
    dragMomentum?: boolean;
    key?: string | number;
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
  }

  // Make motion.div and other elements accept MotionProps
  interface HTMLMotionProps<TagName extends keyof React.JSX.IntrinsicElements>
    extends MotionProps,
      Omit<React.ComponentPropsWithoutRef<TagName>, keyof MotionProps> {}
}
