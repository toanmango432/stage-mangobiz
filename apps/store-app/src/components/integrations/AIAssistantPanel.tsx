/**
 * AIAssistantPanel Component
 *
 * Floating AI Assistant button that opens a chat panel powered by Mango Connect SDK.
 * Only renders when Connect is enabled and the aiAssistant feature is active.
 *
 * Note: SDK modules are rendered into a container div using the SDK's React instance
 * to avoid React version conflicts between the host app and the SDK.
 */

import { useState, useEffect, useRef } from 'react';
import { Bot, X, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useConnectSDK } from '@/hooks/useConnectSDK';
import { useConnectConfig } from '@/hooks/useConnectConfig';
import { ShadowDOMContainer } from './ShadowDOMContainer';
import { getSDKCSSUrl } from '@/providers/ConnectSDKProvider';

/**
 * AI Assistant floating panel component
 */
export function AIAssistantPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { sdkModule, loading, error, retry, renderInContainer } = useConnectSDK();
  const { config } = useConnectConfig();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Close panel on Escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    panelRef.current?.focus();

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Render SDK module into container when panel is open
  useEffect(() => {
    // Cleanup previous render
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    // Don't render if panel is closed, no container, or SDK not loaded
    if (!isOpen || !containerRef.current || !sdkModule?.AIAssistantModule) {
      return;
    }

    // Render the AIAssistantModule into the container
    const cleanup = renderInContainer(
      containerRef.current,
      sdkModule.AIAssistantModule
    );
    cleanupRef.current = cleanup;

    // Cleanup on unmount or when panel closes
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [isOpen, sdkModule, renderInContainer]);

  // Don't render if Connect is disabled or AI Assistant feature is off
  if (!config.enabled || !config.features.aiAssistant) {
    return null;
  }

  // Render panel content based on state
  function renderPanelContent() {
    if (loading) {
      return (
        <div className="h-full flex flex-col items-center justify-center gap-3" role="status" aria-live="polite">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Loading AI Assistant...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="h-full flex flex-col items-center justify-center gap-3 p-4" role="alert" aria-live="assertive">
          <AlertCircle className="h-10 w-10 text-destructive" aria-hidden="true" />
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Unable to load AI Assistant</p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={retry}>Try again</Button>
        </div>
      );
    }

    if (!sdkModule) {
      return (
        <div className="h-full flex flex-col items-center justify-center gap-3 p-4">
          <Bot className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center">AI Assistant is not available at the moment.</p>
        </div>
      );
    }

    // Container for SDK module - wrapped in ShadowDOMContainer to isolate SDK CSS
    return (
      <ShadowDOMContainer cssUrl={getSDKCSSUrl()} className="h-full w-full">
        <div ref={containerRef} className="h-full w-full" />
      </ShadowDOMContainer>
    );
  }

  return (
    <>
      {/* Floating Button */}
      <Button
        ref={buttonRef}
        variant="default"
        size="icon"
        className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
        aria-expanded={isOpen}
        aria-controls="ai-assistant-panel"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </Button>

      {/* Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          id="ai-assistant-panel"
          className="fixed bottom-20 right-4 z-50 w-[400px] h-[500px] bg-background border rounded-lg shadow-lg flex flex-col overflow-hidden"
          role="dialog"
          aria-label="AI Assistant"
          aria-modal="true"
          tabIndex={-1}
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
            {renderPanelContent()}
          </div>
        </div>
      )}
    </>
  );
}

export default AIAssistantPanel;
