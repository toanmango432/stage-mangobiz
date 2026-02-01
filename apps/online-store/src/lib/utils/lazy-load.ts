// Lazy Loading Utilities using Intersection Observer

interface LazyLoadOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Create an Intersection Observer for lazy loading
 */
export function createLazyLoadObserver(
  callback: (entry: IntersectionObserverEntry) => void,
  options: LazyLoadOptions = {}
): IntersectionObserver {
  const {
    root = null,
    rootMargin = '50px',
    threshold = 0.01
  } = options;

  if (typeof IntersectionObserver === 'undefined') {
    // Fallback for browsers without IntersectionObserver
    console.warn('IntersectionObserver not supported');
    return {
      observe: () => {},
      unobserve: () => {},
      disconnect: () => {},
      takeRecords: () => [],
      root: null,
      rootMargin: '',
      thresholds: [],
    } as unknown as IntersectionObserver;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback(entry);
      }
    });
  }, {
    root,
    rootMargin,
    threshold
  });

  return observer;
}

/**
 * Lazy load an image
 */
export function lazyLoadImage(
  img: HTMLImageElement,
  options: LazyLoadOptions = {}
): () => void {
  const { onLoad, onError } = options;

  const observer = createLazyLoadObserver((entry) => {
    const target = entry.target as HTMLImageElement;
    
    // Get the actual image source
    const src = target.dataset.src;
    const srcset = target.dataset.srcset;
    
    if (!src && !srcset) {
      observer.unobserve(target);
      return;
    }

    // Load the image
    if (srcset) {
      target.srcset = srcset;
    }
    if (src) {
      target.src = src;
    }

    // Handle load/error events
    target.onload = () => {
      target.classList.add('loaded');
      target.classList.remove('loading');
      onLoad?.();
      observer.unobserve(target);
    };

    target.onerror = () => {
      target.classList.add('error');
      target.classList.remove('loading');
      onError?.();
      observer.unobserve(target);
    };
  }, options);

  img.classList.add('loading');
  observer.observe(img);

  // Return cleanup function
  return () => {
    observer.unobserve(img);
    observer.disconnect();
  };
}

/**
 * Lazy load multiple images
 */
export function lazyLoadImages(
  selector: string = 'img[data-src]',
  options: LazyLoadOptions = {}
): () => void {
  const images = document.querySelectorAll<HTMLImageElement>(selector);
  const cleanups: Array<() => void> = [];

  images.forEach((img) => {
    const cleanup = lazyLoadImage(img, options);
    cleanups.push(cleanup);
  });

  // Return cleanup function for all observers
  return () => {
    cleanups.forEach(cleanup => cleanup());
  };
}

/**
 * Generate blur-up placeholder data URL
 */
export function generateBlurPlaceholder(width: number = 10, height: number = 10): string {
  // Create a tiny canvas for blur effect
  if (typeof document === 'undefined') {
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Fill with gradient for blur effect
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#e5e7eb');
  gradient.addColorStop(1, '#d1d5db');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  return canvas.toDataURL('image/png');
}

/**
 * Generate responsive image srcset
 */
export function generateSrcSet(
  baseUrl: string,
  widths: number[] = [320, 640, 768, 1024, 1280, 1536]
): string {
  // In a real app, you'd have different image sizes generated
  // For now, we'll just reference the same image at different widths
  return widths.map(width => `${baseUrl} ${width}w`).join(', ');
}

/**
 * Get optimal image size based on viewport
 */
export function getOptimalImageSize(): number {
  if (typeof window === 'undefined') return 1280;

  const width = window.innerWidth;
  
  if (width <= 320) return 320;
  if (width <= 640) return 640;
  if (width <= 768) return 768;
  if (width <= 1024) return 1024;
  if (width <= 1280) return 1280;
  return 1536;
}

