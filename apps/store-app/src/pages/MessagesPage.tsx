/**
 * MessagesPage Component
 *
 * Page for viewing and managing client conversations via the Mango Connect SDK.
 * Renders the SDK's ConversationsModule when loaded, with loading and error states.
 *
 * Note: SDK modules are rendered into a container div using the SDK's React instance
 * to avoid React version conflicts between the host app and the SDK.
 */

import { useRef, useEffect } from 'react';
import { AlertCircle, Loader2, MessageSquare } from 'lucide-react';
import { useConnectSDK } from '@/hooks/useConnectSDK';
import { Button } from '@/components/ui/Button';

/**
 * Messages page for client conversations
 *
 * Uses the Connect SDK to render the ConversationsModule.
 * Handles loading, error, and unloaded states gracefully.
 */
export function MessagesPage() {
  const { sdkModule, loading, error, retry, renderInContainer } = useConnectSDK();
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Render SDK module into container when ready
  useEffect(() => {
    // Cleanup previous render
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    // Don't render if no container, SDK not loaded, or SDK has no ConversationsModule
    if (!containerRef.current || !sdkModule?.ConversationsModule) {
      return;
    }

    // Render the ConversationsModule into the container
    const cleanup = renderInContainer(
      containerRef.current,
      sdkModule.ConversationsModule
    );
    cleanupRef.current = cleanup;

    // Cleanup on unmount
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [sdkModule, renderInContainer]);

  // Loading state - show spinner while SDK loads
  if (loading) {
    return (
      <div
        className="h-full flex flex-col items-center justify-center gap-4"
        role="status"
        aria-live="polite"
        aria-label="Loading messages"
      >
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Loading messages...</p>
      </div>
    );
  }

  // Error state - show error message with retry button
  if (error) {
    return (
      <div
        className="h-full flex flex-col items-center justify-center gap-4"
        role="alert"
        aria-live="assertive"
      >
        <AlertCircle className="h-12 w-12 text-destructive" aria-hidden="true" />
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">
            Unable to load messages
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>
        <Button variant="outline" onClick={retry}>
          Try again
        </Button>
      </div>
    );
  }

  // SDK not loaded state - Connect may be disabled
  if (!sdkModule) {
    return (
      <div
        className="h-full flex flex-col items-center justify-center gap-4"
        role="status"
        aria-label="Messages not available"
      >
        <MessageSquare className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">
            Messages not available
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Mango Connect is not enabled for this store.
          </p>
        </div>
      </div>
    );
  }

  // Render container for SDK module
  return (
    <main className="h-full flex flex-col" role="main" aria-label="Messages">
      <div ref={containerRef} className="h-full w-full" />
    </main>
  );
}

export default MessagesPage;
