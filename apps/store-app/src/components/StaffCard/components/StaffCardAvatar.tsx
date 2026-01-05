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
        {/* Glowing Ring Container */}
        <div
          className={`absolute inset-0 rounded-full transition-all duration-500 ${isBusy ? 'opacity-100' : 'opacity-0'
            }`}
          style={{
            boxShadow: '0 0 15px 2px rgba(225, 29, 72, 0.4), inset 0 0 10px rgba(225, 29, 72, 0.2)',
            border: '2px solid rgba(225, 29, 72, 0.5)',
            transform: 'scale(1.1)',
          }}
        />

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
            className={`object-cover bg-white relative z-10 transition-all duration-500 ${isBusy ? 'grayscale contrast-125 brightness-90' : ''
              } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            style={{
              width: size,
              height: size,
              borderRadius,
              border: isBusy ? '2px solid white' : `${borderWidth} solid white`,
              boxShadow: isBusy ? 'none' : '0 20px 40px -12px rgba(0,0,0,0.25), 0 8px 16px -8px rgba(0,0,0,0.3)',
              willChange: 'filter, transform',
              contain: 'layout style paint',
            }}
            // Responsive images for different pixel densities
            srcSet={`${src}&w=140&dpr=1 1x, ${src}&w=140&dpr=2 2x`}
          />
        ) : (
          // Error Fallback
          <div
            className="flex items-center justify-center bg-gray-300 text-gray-600 font-bold text-2xl relative z-10"
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

        {/* BUSY Badge - Premium Jewel Style */}
        {isBusy && !isUltra && (
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 z-20">
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full shadow-lg border border-white/20 backdrop-blur-sm"
              style={{
                background: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)',
                boxShadow: '0 4px 12px rgba(225, 29, 72, 0.3)',
              }}
            >
              <CircleDot size={10} className="text-white animate-pulse" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">
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
