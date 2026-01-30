import { lazy, ComponentType, Suspense, ReactNode } from 'react';

/**
 * Create a lazy-loaded component with a loading fallback
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: ReactNode
) {
  const LazyComponent = lazy(importFunc);

  return (props: any) => (
    <Suspense fallback={fallback || <LoadingFallback />}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

/**
 * Default loading fallback component
 */
export const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="flex flex-col items-center gap-2">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

/**
 * Page loading fallback with full height
 */
export const PageLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center gap-2">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="text-muted-foreground">Loading page...</p>
    </div>
  </div>
);

/**
 * Preload a lazy-loaded component
 */
export function preloadComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
): void {
  importFunc();
}

/**
 * Create a lazy-loaded route component
 */
export function lazyRoute<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) {
  return lazyLoad(importFunc, <PageLoadingFallback />);
}

/**
 * Dynamically import and execute a function
 */
export async function dynamicImport<T = any>(
  modulePath: string
): Promise<T> {
  try {
    const module = await import(/* @vite-ignore */ modulePath);
    return module.default || module;
  } catch (error) {
    console.error(`Failed to import module: ${modulePath}`, error);
    throw error;
  }
}

/**
 * Create a component with retry logic for failed chunk loads
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  maxRetries: number = 3
) {
  return lazy(async () => {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await importFunc();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Chunk load failed (attempt ${i + 1}/${maxRetries}):`, error);
        
        // Wait before retrying (exponential backoff)
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }

    throw lastError;
  });
}

