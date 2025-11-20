import { Tag } from 'lucide-react';
import { PremiumColors } from '../../../constants/premiumDesignTokens';

interface ClientInfoProps {
  clientName: string;
  clientType: string;
  service: string;
  additionalServices?: number;
  lastVisitDate?: Date | null;
}

/**
 * ClientInfo Component
 *
 * Displays client name with VIP/note icons, last visit info, and service.
 * Matches In-Service ticket design exactly.
 */
export function ClientInfo({
  clientName,
  clientType,
  service,
  additionalServices = 0,
  lastVisitDate,
}: ClientInfoProps) {
  // Helper flags for icons
  const isFirstVisit = clientType === 'New';
  const hasStar = clientType === 'VIP';
  // Note: We don't have notes field yet, but keeping structure for future

  // Format last visit date
  const getLastVisitText = () => {
    if (!lastVisitDate || isFirstVisit) {
      return 'First Visit';
    }

    const now = new Date();
    const lastVisit = new Date(lastVisitDate);
    const diffMs = now.getTime() - lastVisit.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    }
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return months === 1 ? '1 month ago' : `${months} months ago`;
    }
    const years = Math.floor(diffDays / 365);
    return years === 1 ? '1 year ago' : `${years} years ago`;
  };

  return (
    <div className="px-2 sm:px-3 md:px-4 pt-2 sm:pt-3 md:pt-3 pb-1 sm:pb-2">
      {/* Client Name with Icons */}
      <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
        <span
          className="text-sm sm:text-base md:text-lg font-bold text-[#1a1614] truncate tracking-tight"
        >
          {clientName}
        </span>
        {hasStar && (
          <span className="text-xs sm:text-sm md:text-base flex-shrink-0">⭐</span>
        )}
        {/* Note icon placeholder - can add when notes field is available */}
        {/* {hasNote && <span className="text-xs sm:text-sm md:text-base flex-shrink-0">📋</span>} */}
      </div>

      {/* Last Visit Text */}
      <div
        className="text-[9px] sm:text-[10px] md:text-xs font-medium tracking-wide mb-1.5 sm:mb-2"
        style={{ color: '#6b5d52' }}
      >
        {getLastVisitText()}
      </div>

      {/* Service */}
      <div className="flex items-center gap-1.5">
        <Tag
          size={12}
          style={{ color: PremiumColors.text.secondary }}
        />
        <span
          className="truncate text-xs sm:text-sm md:text-base font-semibold leading-snug tracking-tight"
          style={{ color: '#1a1614' }}
        >
          {service}
          {additionalServices > 0 && (
            <span className="ml-1 text-[9px] bg-gray-100 px-1 rounded-sm border border-gray-200">
              +{additionalServices}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
