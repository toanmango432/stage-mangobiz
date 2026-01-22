/**
 * AIAssistantPanel Component
 *
 * Floating AI Assistant button that opens a chat panel powered by Mango Connect SDK.
 * Only renders when Connect is enabled and the aiAssistant feature is active.
 *
 * Features:
 * - Floating button in bottom-right corner
 * - Expandable panel with AI Assistant module
 * - Loading and error states
 * - Self-contained visibility logic based on feature flags
 */

import { useState } from 'react';
import { Bot, X, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useConnectSDK } from '@/hooks/useConnectSDK';
import { useConnectConfig } from '@/hooks/useConnectConfig';

/**
 * AI Assistant floating panel component
 *
 * Displays a floating button that expands into an AI chat panel.
 * Self-manages visibility based on Connect feature flags.
 */
export function AIAssistantPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { sdk, loading, error, retry } = useConnectSDK();
  const { config } = useConnectConfig();

  // Don't render if Connect is disabled or AI Assistant feature is off
  if (!config.enabled || !config.features.aiAssistant) {
    return null;
  }

  const togglePanel = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Floating Button */}
      <Button
        variant="default"
        size="icon"
        className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full shadow-lg"
        onClick={togglePanel}
        aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Bot className="h-5 w-5" />
        )}
      </Button>

      {/* Panel */}
      {isOpen && (
        <div
          className="fixed bottom-20 right-4 z-50 w-[400px] h-[500px] bg-background border rounded-lg shadow-lg flex flex-col overflow-hidden"
          role="dialog"
          aria-label="AI Assistant"
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground">AI Assistant</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              aria-label="Close panel"
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-hidden">
            {/* Loading State */}
            {loading && (
              <div className="h-full flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Loading AI Assistant...
                </p>
              </div>
            )}

            {/* Error State */}
            {!loading && error && (
              <div className="h-full flex flex-col items-center justify-center gap-3 p-4">
                <AlertCircle className="h-10 w-10 text-destructive" />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    Unable to load AI Assistant
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{error}</p>
                </div>
                <Button variant="outline" size="sm" onClick={retry}>
                  Try again
                </Button>
              </div>
            )}

            {/* SDK Not Available */}
            {!loading && !error && !sdk && (
              <div className="h-full flex flex-col items-center justify-center gap-3 p-4">
                <Bot className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center">
                  AI Assistant is not available at the moment.
                </p>
              </div>
            )}

            {/* AI Assistant Module */}
            {!loading && !error && sdk && (
              <sdk.AIAssistantModule />
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default AIAssistantPanel;
