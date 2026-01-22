/**
 * MessagesPage Component
 *
 * Page for viewing and managing client conversations via the Mango Connect SDK.
 * Renders the SDK's ConversationsModule when loaded, with loading and error states.
 */

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
  const { sdkModule, loading, error, retry } = useConnectSDK();

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

  // Render the SDK's ConversationsModule
  return (
    <main className="h-full flex flex-col" role="main" aria-label="Messages">
      <sdkModule.ConversationsModule />
    </main>
  );
}

export default MessagesPage;
