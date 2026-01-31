'use client';

import { ChatButton } from '@/components/chat/ChatButton';
import { ChatDrawer } from '@/components/chat/ChatDrawer';
import { useChatToggle } from '@/hooks/useChatToggle';

/**
 * Client Component wrapper for chat functionality.
 * Encapsulates the chat toggle state so the parent layout
 * can remain a Server Component.
 */
export const ChatToggleWrapper = () => {
  const { isOpen, open, close } = useChatToggle();

  return (
    <>
      <ChatButton onClick={open} />
      <ChatDrawer isOpen={isOpen} onClose={close} />
    </>
  );
};
