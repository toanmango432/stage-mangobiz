import { useState, useEffect, useRef } from 'react';

/**
 * Hook to detect status changes and trigger a brief animation
 * Used on ticket cards to provide visual feedback when status changes
 *
 * @param currentStatus - The current status of the ticket
 * @param animationDuration - How long the animation state should be active (default 500ms)
 * @returns Object with isAnimating boolean to apply animation class
 */
export function useStatusChangeAnimation(
  currentStatus: string | undefined,
  animationDuration: number = 500
): { isAnimating: boolean } {
  const [isAnimating, setIsAnimating] = useState(false);
  const previousStatusRef = useRef<string | undefined>(currentStatus);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip animation on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      previousStatusRef.current = currentStatus;
      return;
    }

    // Check if status actually changed
    if (previousStatusRef.current !== currentStatus) {
      // Trigger animation
      setIsAnimating(true);
      previousStatusRef.current = currentStatus;

      // Clear animation after duration
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, animationDuration);

      return () => clearTimeout(timer);
    }
  }, [currentStatus, animationDuration]);

  return { isAnimating };
}
