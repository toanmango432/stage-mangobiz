import { useState, useEffect, useRef } from 'react';
import { lazyLoadImage, generateBlurPlaceholder, generateSrcSet } from '@/lib/utils/lazy-load';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  lazy?: boolean;
  blur?: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

/**
 * Optimized Image Component with lazy loading, blur-up, and responsive images
 */
export const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  lazy = true,
  blur = true,
  sizes,
  priority = false,
  className,
  ...props
}: OptimizedImageProps) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const blurPlaceholder = blur ? generateBlurPlaceholder() : undefined;

  useEffect(() => {
    // Don't lazy load if priority or lazy is disabled
    if (!lazy || priority || !imgRef.current) {
      return;
    }

    const cleanup = lazyLoadImage(imgRef.current, {
      onLoad: () => setIsLoaded(true),
      onError: () => setHasError(true)
    });

    return cleanup;
  }, [lazy, priority]);

  // Generate srcset for responsive images
  const srcSet = src && !hasError ? generateSrcSet(src) : undefined;

  // Default sizes if not provided
  const imageSizes = sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

  return (
    <div 
      className={cn('relative overflow-hidden', className)}
      style={{ 
        aspectRatio: width && height ? `${width} / ${height}` : undefined 
      }}
    >
      {/* Blur placeholder */}
      {blur && !isLoaded && !hasError && (
        <img
          src={blurPlaceholder}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-sm"
          aria-hidden="true"
        />
      )}

      {/* Main image */}
      <img
        ref={imgRef}
        data-src={lazy && !priority ? src : undefined}
        data-srcset={lazy && !priority ? srcSet : undefined}
        src={!lazy || priority ? src : blurPlaceholder}
        srcSet={!lazy || priority ? srcSet : undefined}
        sizes={imageSizes}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          hasError && 'opacity-50'
        )}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        {...props}
      />

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="text-sm text-muted-foreground">Failed to load image</span>
        </div>
      )}

      {/* Loading state */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
};

