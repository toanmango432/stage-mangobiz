import { AnnouncementBarContainer } from '@/components/promotions/AnnouncementBarContainer';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { ChatToggleWrapper } from '@/components/ChatToggleWrapper';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBarContainer />
      <Header />
      <main className="flex-1">{children}</main>
      <BottomNav />
      <ChatToggleWrapper />
    </div>
  );
}
