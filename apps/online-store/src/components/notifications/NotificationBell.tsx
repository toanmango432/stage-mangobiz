import { useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NotificationDropdown } from './NotificationDropdown';
import { useNotifications } from '@/contexts/NotificationContext';

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { stats } = useNotifications();

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        {stats.unread > 0 ? (
          <BellRing className="h-5 w-5" />
        ) : (
          <Bell className="h-5 w-5" />
        )}
        
        {stats.unread > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {stats.unread > 99 ? '99+' : stats.unread}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <NotificationDropdown onClose={() => setIsOpen(false)} />
      )}
    </div>
  );
};




