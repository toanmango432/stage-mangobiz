import { useEffect, type ReactNode } from 'react';
import { useAppSelector } from '../store';

interface AccessibilityProviderProps {
  children: ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const { largeTextMode, reducedMotionMode, highContrastMode } = useAppSelector(
    (state) => state.accessibility
  );

  useEffect(() => {
    const root = document.documentElement;

    if (largeTextMode) {
      root.classList.add('large-text-mode');
    } else {
      root.classList.remove('large-text-mode');
    }

    if (reducedMotionMode) {
      root.classList.add('reduced-motion-mode');
    } else {
      root.classList.remove('reduced-motion-mode');
    }

    if (highContrastMode) {
      root.classList.add('high-contrast-mode');
    } else {
      root.classList.remove('high-contrast-mode');
    }
  }, [largeTextMode, reducedMotionMode, highContrastMode]);

  return <>{children}</>;
}

export default AccessibilityProvider;
