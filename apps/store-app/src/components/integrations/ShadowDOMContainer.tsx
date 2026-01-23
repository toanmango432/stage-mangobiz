/**
 * ShadowDOMContainer Component
 *
 * Provides CSS isolation for external SDK components by rendering them inside a Shadow DOM.
 * This prevents external CSS (like the Mango Connect SDK CSS) from affecting the host app's styles.
 *
 * Usage:
 * ```tsx
 * <ShadowDOMContainer cssUrl="https://example.com/sdk.css">
 *   <SDKComponent />
 * </ShadowDOMContainer>
 * ```
 */

import { useRef, useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ShadowDOMContainerProps {
  /** URL of the CSS to load inside the shadow DOM */
  cssUrl?: string;
  /** Children to render inside the shadow DOM */
  children: ReactNode;
  /** Additional class names for the host container */
  className?: string;
}

export function ShadowDOMContainer({ cssUrl, children, className = '' }: ShadowDOMContainerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null);
  const [mountPoint, setMountPoint] = useState<HTMLDivElement | null>(null);

  // Create shadow root on mount - setState in effect is intentional for Shadow DOM initialization
  useEffect(() => {
    if (!hostRef.current) return;

    // Get or create shadow root
    const shadow = hostRef.current.shadowRoot ?? hostRef.current.attachShadow({ mode: 'open' });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShadowRoot(shadow);
  }, []);

  // Load CSS and create mount point inside shadow root
  useEffect(() => {
    if (!shadowRoot) return;

    // Clear existing content
    while (shadowRoot.firstChild) {
      shadowRoot.removeChild(shadowRoot.firstChild);
    }

    // Add CSS if URL provided
    if (cssUrl) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = cssUrl;
      shadowRoot.appendChild(link);
    }

    // Add base styles
    const baseStyles = document.createElement('style');
    baseStyles.textContent = `
      :host { display: block; width: 100%; height: 100%; }
      .shadow-mount { width: 100%; height: 100%; }
    `;
    shadowRoot.appendChild(baseStyles);

    // Create mount point for React portal
    const mount = document.createElement('div');
    mount.className = 'shadow-mount';
    shadowRoot.appendChild(mount);

    // Setting state here is intentional - Shadow DOM setup requires synchronous
    // mount point creation before we can portal children into it
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMountPoint(mount);
  }, [shadowRoot, cssUrl]);

  return (
    <div ref={hostRef} className={className}>
      {mountPoint && createPortal(children, mountPoint)}
    </div>
  );
}

export default ShadowDOMContainer;
