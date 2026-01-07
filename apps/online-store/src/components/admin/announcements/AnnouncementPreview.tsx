import { AlertCircle, AlertTriangle, Info, Bell } from 'lucide-react';
import { AnnouncementPriority, AnnouncementCategory } from '@/types/announcement';

interface AnnouncementPreviewProps {
  title: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  content: string;
}

export const AnnouncementPreview = ({ title, category, priority, content }: AnnouncementPreviewProps) => {
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

  const Icon = priorityIcons[priority];

  return (
    <div className={`w-full border-b ${priorityStyles[priority]} p-4 rounded-lg`}>
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xs font-medium uppercase tracking-wide opacity-90 flex-shrink-0">
            {category}
          </span>
          <span className="text-sm font-medium truncate">
            {title}
          </span>
        </div>
      </div>
      {content && (
        <p className="text-sm mt-2 line-clamp-2 opacity-90">
          {content}
        </p>
      )}
    </div>
  );
};
