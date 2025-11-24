/**
 * StaffCardAvatar Component
 * Optimized avatar display with lazy loading and status indicators
 */

import React, { useState } from 'react';
import { CircleDot } from 'lucide-react';

interface StaffCardAvatarProps {
  src: string;
  alt: string;
  size: string;
  borderRadius: string;
  borderWidth: string;
  isBusy: boolean;
  isUltra: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Avatar component with:
 * - Lazy loading
 * - Loading placeholder
 * - Error fallback
 * - Grayscale effect for busy state (CSS-based for performance)
 * - Responsive sizing
 */
export const StaffCardAvatar = React.memo<StaffCardAvatarProps>(
  ({
    src,
    alt,
    size,
    borderRadius,
    borderWidth,
    isBusy,
    isUltra,
    onLoad,
    onError,
  }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    const handleLoad = () => {
      setImageLoaded(true);
      onLoad?.();
    };

    const handleError = () => {
      setImageError(true);
      onError?.();
    };

    return (
      <div
        className="relative mb-2 group-hover:scale-[1.02] transition-transform duration-300"
        style={{ width: size, height: size }}
      >
        {/* Loading Placeholder */}
        {!imageLoaded && !imageError && (
          <div
            className="absolute inset-0 bg-gray-200 animate-pulse rounded-full"
            style={{
              width: size,
              height: size,
              borderRadius,
              border: `${borderWidth} solid white`,
            }}
          />
        )}

        {/* Avatar Image */}
        {!imageError ? (
          <img
            src={src}
            alt={alt}
            loading="lazy"
            onLoad={handleLoad}
            onError={handleError}
            className={`object-cover shadow-lg bg-white relative z-10 transition-opacity duration-300 ${
              isBusy ? 'grayscale' : ''
            } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            style={{
              width: size,
              height: size,
              borderRadius,
              border: `${borderWidth} solid white`,
              boxShadow: '0 8px 24px -6px rgba(0,0,0,0.15)',
              // Performance optimization: isolate grayscale effect
              willChange: isBusy ? 'filter' : 'auto',
              contain: 'layout style paint',
            }}
            // Responsive images for different pixel densities
            srcSet={`${src}&w=140&dpr=1 1x, ${src}&w=140&dpr=2 2x`}
          />
        ) : (
          // Error Fallback
          <div
            className="flex items-center justify-center bg-gray-300 text-gray-600 font-bold text-2xl"
            style={{
              width: size,
              height: size,
              borderRadius,
              border: `${borderWidth} solid white`,
            }}
          >
            {alt.charAt(0).toUpperCase()}
          </div>
        )}

        {/* BUSY Badge - Below Avatar */}
        {isBusy && !isUltra && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 z-20">
            <div className="flex items-center gap-1 bg-rose-600 text-white px-2.5 py-0.5 rounded-full shadow-md border-2 border-white">
              <CircleDot size={10} className="animate-pulse" />
              <span className="text-[9px] font-bold uppercase tracking-wide">
                Busy
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

StaffCardAvatar.displayName = 'StaffCardAvatar';
