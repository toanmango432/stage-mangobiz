import { useState, useEffect } from 'react';
import { X, AlertCircle, AlertTriangle, Info, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Announcement } from '@/types/announcement';
import { Link } from 'react-router-dom';

interface AnnouncementBarProps {
  announcement: Announcement;
}

export const AnnouncementBar = ({ announcement }: AnnouncementBarProps) => {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(`announcement_dismissed_${announcement.id}`);
    setIsDismissed(dismissed === 'true');
  }, [announcement.id]);

  const handleDismiss = () => {
    localStorage.setItem(`announcement_dismissed_${announcement.id}`, 'true');
    setIsDismissed(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleDismiss();
    }
  };

  if (isDismissed) return null;

  const priorityStyles = {
    urgent: 'bg-red-600 text-white border-red-700',
    important: 'bg-yellow-500 text-black border-yellow-600',
    normal: 'bg-blue-600 text-white border-blue-700',
    info: 'bg-muted text-muted-foreground border-border',
  };

  const priorityIcons = {
    urgent: AlertCircle,
    important: AlertTriangle,
    normal: Bell,
    info: Info,
  };

  const Icon = priorityIcons[announcement.priority];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`sticky top-0 z-50 w-full border-b ${priorityStyles[announcement.priority]} animate-slide-in-down`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xs font-medium uppercase tracking-wide opacity-90 flex-shrink-0">
              {announcement.category}
            </span>
            <span className="text-sm font-medium truncate">
              {announcement.title}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className={`text-xs ${
              announcement.priority === 'important' ? 'text-black hover:bg-yellow-600' : 'hover:bg-white/20'
            }`}
          >
            <Link to="/updates">View</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className={`h-8 w-8 p-0 ${
              announcement.priority === 'important' ? 'text-black hover:bg-yellow-600' : 'hover:bg-white/20'
            }`}
            aria-label="Dismiss announcement"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
