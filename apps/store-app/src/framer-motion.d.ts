/**
 * Framer Motion type declarations
 *
 * This file provides type augmentations for framer-motion 12.x to fix
 * TypeScript compatibility issues with motion component props.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import 'framer-motion';
import type { HTMLAttributes, ReactNode, Key, CSSProperties, MouseEventHandler, FocusEventHandler, RefAttributes } from 'react';

declare module 'framer-motion' {
  // Re-export PanInfo which was removed in v12
  export interface PanInfo {
    point: { x: number; y: number };
    delta: { x: number; y: number };
    offset: { x: number; y: number };
    velocity: { x: number; y: number };
  }

  // Override motion components to accept standard HTML props
  interface MotionDivProps extends HTMLAttributes<HTMLDivElement> {
    initial?: any;
    animate?: any;
    exit?: any;
    transition?: any;
    variants?: any;
    layout?: any;
    layoutId?: string;
    whileHover?: any;
    whileTap?: any;
    whileFocus?: any;
    whileInView?: any;
    whileDrag?: any;
    drag?: boolean | 'x' | 'y';
    dragConstraints?: any;
    dragElastic?: number | boolean;
    dragMomentum?: boolean;
    onDragStart?: any;
    onDrag?: any;
    onDragEnd?: any;
    children?: ReactNode;
    key?: Key | null;
    className?: string;
    style?: CSSProperties;
    onClick?: MouseEventHandler;
    onMouseEnter?: MouseEventHandler;
    onMouseLeave?: MouseEventHandler;
    onFocus?: FocusEventHandler;
    onBlur?: FocusEventHandler;
    'data-staff-id'?: string;
    'data-testid'?: string;
  }

  interface MotionButtonProps extends HTMLAttributes<HTMLButtonElement> {
    initial?: any;
    animate?: any;
    exit?: any;
    transition?: any;
    variants?: any;
    whileHover?: any;
    whileTap?: any;
    children?: ReactNode;
    key?: Key | null;
    className?: string;
    style?: CSSProperties;
    onClick?: MouseEventHandler;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
  }

  interface MotionSpanProps extends HTMLAttributes<HTMLSpanElement> {
    initial?: any;
    animate?: any;
    exit?: any;
    transition?: any;
    variants?: any;
    children?: ReactNode;
    key?: Key | null;
    className?: string;
    style?: CSSProperties;
  }

  // Extend the motion namespace
  export namespace motion {
    export const div: React.ForwardRefExoticComponent<MotionDivProps & RefAttributes<HTMLDivElement>>;
    export const button: React.ForwardRefExoticComponent<MotionButtonProps & RefAttributes<HTMLButtonElement>>;
    export const span: React.ForwardRefExoticComponent<MotionSpanProps & RefAttributes<HTMLSpanElement>>;
  }

  // Reorder component types
  interface ReorderItemProps<T> extends HTMLAttributes<HTMLLIElement> {
    value: T;
    initial?: any;
    animate?: any;
    exit?: any;
    transition?: any;
    variants?: any;
    layout?: any;
    layoutId?: string;
    whileHover?: any;
    whileTap?: any;
    whileDrag?: any;
    drag?: boolean | 'x' | 'y';
    dragConstraints?: any;
    dragElastic?: number | boolean;
    children?: ReactNode;
    key?: Key | null;
    className?: string;
    style?: CSSProperties;
    'data-testid'?: string;
  }

  interface ReorderGroupProps<T> extends HTMLAttributes<HTMLUListElement> {
    values: T[];
    onReorder: (newOrder: T[]) => void;
    axis?: 'x' | 'y';
    as?: any;
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
    layoutScroll?: boolean;
    layout?: any;
  }

  export namespace Reorder {
    export function Item<T>(props: ReorderItemProps<T> & RefAttributes<HTMLLIElement>): JSX.Element;
    export function Group<T>(props: ReorderGroupProps<T> & RefAttributes<HTMLUListElement>): JSX.Element;
  }
}
