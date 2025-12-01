import { useRef, useCallback, useEffect, useState } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface GestureOptions {
  threshold?: number; // Minimum distance to trigger swipe (default: 50)
  velocity?: number; // Minimum velocity to trigger swipe (default: 0.5)
  preventScroll?: boolean; // Prevent default scroll behavior during swipe
  edgeSwipeOnly?: boolean; // Only trigger swipe from screen edges (default: false)
  edgeThreshold?: number; // Pixels from edge to trigger (default: 30)
}

interface SwipeState {
  startX: number;
  startY: number;
  startTime: number;
  isSwiping: boolean;
  direction: 'left' | 'right' | 'up' | 'down' | null;
  isFromEdge: boolean; // Track if swipe started from screen edge
}

/**
 * useSwipeGestures Hook
 *
 * Provides swipe gesture detection for navigation and actions.
 * Supports left, right, up, and down swipes.
 *
 * @example
 * ```tsx
 * const { handlers, isSwiping } = useSwipeGestures({
 *   onSwipeLeft: () => goToNextTab(),
 *   onSwipeRight: () => goToPrevTab(),
 * });
 *
 * return <div {...handlers}>Content</div>;
 * ```
 */
export function useSwipeGestures(
  swipeHandlers: SwipeHandlers,
  options: GestureOptions = {}
) {
  const {
    threshold = 50,
    velocity = 0.5, // Increased from 0.3 for better scroll detection
    preventScroll = false,
    edgeSwipeOnly = false,
    edgeThreshold = 30
  } = options;

  const swipeState = useRef<SwipeState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    isSwiping: false,
    direction: null,
    isFromEdge: false,
  });

  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const screenWidth = window.innerWidth;

    // Check if touch started from screen edge
    const isFromLeftEdge = touch.clientX <= edgeThreshold;
    const isFromRightEdge = touch.clientX >= screenWidth - edgeThreshold;
    const isFromEdge = isFromLeftEdge || isFromRightEdge;

    swipeState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      isSwiping: false,
      direction: null,
      isFromEdge,
    };
  }, [edgeThreshold]);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      const { startX, startY } = swipeState.current;

      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;

      // Determine if this is a horizontal or vertical swipe
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (!swipeState.current.isSwiping && (absX > 10 || absY > 10)) {
        swipeState.current.isSwiping = true;
        setIsSwiping(true);

        // Determine direction
        if (absX > absY) {
          swipeState.current.direction = deltaX > 0 ? 'right' : 'left';
          if (preventScroll) {
            e.preventDefault();
          }
        } else {
          swipeState.current.direction = deltaY > 0 ? 'down' : 'up';
        }
      }

      // Calculate progress (0 to 1)
      if (swipeState.current.isSwiping) {
        const distance =
          swipeState.current.direction === 'left' ||
          swipeState.current.direction === 'right'
            ? absX
            : absY;
        setSwipeProgress(Math.min(distance / threshold, 1));
      }
    },
    [threshold, preventScroll]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!swipeState.current.isSwiping) {
        setIsSwiping(false);
        setSwipeProgress(0);
        return;
      }

      const touch = e.changedTouches[0];
      const { startX, startY, startTime, direction, isFromEdge } = swipeState.current;

      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      const deltaTime = Date.now() - startTime;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      const distance = Math.max(absX, absY);

      // Calculate velocity (pixels per millisecond)
      const swipeVelocity = distance / deltaTime;

      // Check if swipe meets threshold or velocity requirements
      const meetsThreshold = distance >= threshold;
      const meetsVelocity = swipeVelocity >= velocity;

      // If edgeSwipeOnly is enabled, only trigger if swipe started from edge
      const edgeCheck = !edgeSwipeOnly || isFromEdge;

      if ((meetsThreshold || meetsVelocity) && edgeCheck) {
        switch (direction) {
          case 'left':
            swipeHandlers.onSwipeLeft?.();
            break;
          case 'right':
            swipeHandlers.onSwipeRight?.();
            break;
          case 'up':
            swipeHandlers.onSwipeUp?.();
            break;
          case 'down':
            swipeHandlers.onSwipeDown?.();
            break;
        }
      }

      // Reset state
      swipeState.current = {
        startX: 0,
        startY: 0,
        startTime: 0,
        isSwiping: false,
        direction: null,
        isFromEdge: false,
      };
      setIsSwiping(false);
      setSwipeProgress(0);
    },
    [swipeHandlers, threshold, velocity, edgeSwipeOnly]
  );

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    isSwiping,
    swipeProgress,
    swipeDirection: swipeState.current.direction,
  };
}

/**
 * usePullToRefresh Hook
 *
 * Implements pull-to-refresh functionality for scrollable containers.
 *
 * @example
 * ```tsx
 * const { handlers, isRefreshing, pullProgress } = usePullToRefresh({
 *   onRefresh: async () => {
 *     await fetchData();
 *   },
 * });
 *
 * return (
 *   <div {...handlers}>
 *     {isRefreshing && <RefreshIndicator />}
 *     <Content />
 *   </div>
 * );
 * ```
 */
export function usePullToRefresh(options: {
  onRefresh: () => Promise<void>;
  threshold?: number;
  resistance?: number;
}) {
  const { onRefresh, threshold = 80, resistance = 2.5 } = options;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const [translateY, setTranslateY] = useState(0);

  const startY = useRef(0);
  const isPulling = useRef(false);
  const containerRef = useRef<HTMLElement | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return;

    const container = e.currentTarget as HTMLElement;
    containerRef.current = container;

    // Only activate if at top of scroll
    if (container.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isPulling.current || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      if (diff > 0) {
        // Apply resistance to make it feel natural
        const adjustedDiff = diff / resistance;
        setTranslateY(Math.min(adjustedDiff, threshold * 1.5));
        setPullProgress(Math.min(diff / threshold, 1));
        e.preventDefault();
      }
    },
    [isRefreshing, threshold, resistance]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullProgress >= 1) {
      setIsRefreshing(true);
      setTranslateY(threshold / resistance);

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setTranslateY(0);
        setPullProgress(0);
      }
    } else {
      setTranslateY(0);
      setPullProgress(0);
    }
  }, [pullProgress, onRefresh, threshold, resistance]);

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    isRefreshing,
    pullProgress,
    translateY,
  };
}

/**
 * useLongPress Hook
 *
 * Detects long press gestures for contextual actions.
 *
 * @example
 * ```tsx
 * const { handlers, isPressed } = useLongPress({
 *   onLongPress: () => openContextMenu(),
 *   duration: 500,
 * });
 *
 * return <div {...handlers}>Hold me</div>;
 * ```
 */
export function useLongPress(options: {
  onLongPress: () => void;
  onClick?: () => void;
  duration?: number;
}) {
  const { onLongPress, onClick, duration = 500 } = options;

  const [isPressed, setIsPressed] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const start = useCallback(() => {
    isLongPress.current = false;
    setIsPressed(true);

    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress();
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(20);
      }
    }, duration);
  }, [onLongPress, duration]);

  const stop = useCallback(
    (shouldTriggerClick = true) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      setIsPressed(false);

      if (shouldTriggerClick && !isLongPress.current && onClick) {
        onClick();
      }
    },
    [onClick]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    handlers: {
      onTouchStart: start,
      onTouchEnd: () => stop(true),
      onTouchCancel: () => stop(false),
      onMouseDown: start,
      onMouseUp: () => stop(true),
      onMouseLeave: () => stop(false),
    },
    isPressed,
  };
}
