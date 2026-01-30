'use client';

import { AnnouncementBarContainer } from '@/components/promotions/AnnouncementBarContainer';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { ChatButton } from '@/components/chat/ChatButton';
import { ChatDrawer } from '@/components/chat/ChatDrawer';
import { useChatToggle } from '@/hooks/useChatToggle';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen, open, close } = useChatToggle();

  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBarContainer />
      <Header />
      <main className="flex-1">{children}</main>
      <BottomNav />
      <ChatButton onClick={open} />
      <ChatDrawer isOpen={isOpen} onClose={close} />
    </div>
  );
}
