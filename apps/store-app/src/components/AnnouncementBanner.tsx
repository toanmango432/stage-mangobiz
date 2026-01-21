/**
 * AnnouncementBanner Component
 * Displays active announcements at the top of the POS app
 *
 * Features:
 * - Auto-fetches active announcements from Supabase
 * - Supports dismiss and acknowledge actions
 * - Different styles based on severity (info, success, warning, error)
 * - Shows one announcement at a time with navigation if multiple
 */

import { useEffect } from 'react';
import { X, Info, CheckCircle, AlertTriangle, AlertCircle, ExternalLink } from 'lucide-react';
import { useBannerAnnouncements } from '../hooks/useAnnouncements';
import { recordAnnouncementView, recordCtaClick } from '../services/announcementService';

// Severity styling configuration
const SEVERITY_STYLES = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: Info,
    iconColor: 'text-blue-500',
    buttonBg: 'bg-blue-600 hover:bg-blue-700',
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: CheckCircle,
    iconColor: 'text-green-500',
    buttonBg: 'bg-green-600 hover:bg-green-700',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    icon: AlertTriangle,
    iconColor: 'text-yellow-500',
    buttonBg: 'bg-yellow-600 hover:bg-yellow-700',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: AlertCircle,
    iconColor: 'text-red-500',
    buttonBg: 'bg-red-600 hover:bg-red-700',
  },
  neutral: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-800',
    icon: Info,
    iconColor: 'text-gray-500',
    buttonBg: 'bg-gray-600 hover:bg-gray-700',
  },
};

interface AnnouncementBannerProps {
  className?: string;
}

export function AnnouncementBanner({ className = '' }: AnnouncementBannerProps) {
  const { banners, dismiss, isLoading } = useBannerAnnouncements();

  // Get the first (highest priority) banner
  const announcement = banners[0];

  // Record view when announcement is shown
  useEffect(() => {
    if (announcement) {
      recordAnnouncementView(announcement.id, 'in_app_banner');
    }
  }, [announcement?.id]);

  // Auto-dismiss non-critical dismissible banners after 10 seconds
  useEffect(() => {
    if (
      announcement &&
      announcement.behavior.dismissible &&
      !announcement.behavior.requireAcknowledgment &&
      announcement.priority !== 'critical'
    ) {
      const timer = setTimeout(() => {
        dismiss(announcement.id, false);
      }, 10000); // 10 seconds

      return () => clearTimeout(timer);
    }
  }, [announcement?.id, announcement?.behavior?.dismissible, announcement?.behavior?.requireAcknowledgment, announcement?.priority, dismiss]);

  // Don't render anything if no announcements or still loading
  if (isLoading || !announcement) {
    return null;
  }

  const styles = SEVERITY_STYLES[announcement.severity] || SEVERITY_STYLES.info;
  const Icon = styles.icon;

  const handleDismiss = () => {
    dismiss(announcement.id, false);
  };

  const handleAcknowledge = () => {
    dismiss(announcement.id, true);
  };

  const handleCtaClick = (cta: { label: string; url?: string; action?: string }) => {
    recordCtaClick(announcement.id, cta.label, 'in_app_banner');

    if (cta.url) {
      window.open(cta.url, '_blank', 'noopener,noreferrer');
    } else if (cta.action) {
      // Handle internal actions
      switch (cta.action) {
        case 'upgrade':
          // Navigate to upgrade page
          window.dispatchEvent(new CustomEvent('navigate-to-module', { detail: 'license' }));
          break;
        case 'settings':
          window.dispatchEvent(new CustomEvent('navigate-to-module', { detail: 'more' }));
          break;
        default:
          console.log('Unknown action:', cta.action);
      }
    }
  };

  return (
    <div
      className={`${styles.bg} ${styles.border} border-b px-4 py-2.5 ${className}`}
      role="alert"
    >
      <div className="flex items-center gap-3 max-w-7xl mx-auto">
        {/* Icon */}
        <Icon className={`w-5 h-5 flex-shrink-0 ${styles.iconColor}`} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={`font-semibold text-sm ${styles.text}`}>
              {announcement.content.title}
            </h4>
            {announcement.priority === 'critical' && (
              <span className="px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
                Critical
              </span>
            )}
          </div>
          <p className={`text-sm ${styles.text} opacity-90 line-clamp-1`}>
            {announcement.content.summary || announcement.content.body}
          </p>
        </div>

        {/* CTAs */}
        {announcement.content.ctas && announcement.content.ctas.length > 0 && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {announcement.content.ctas.map((cta, idx) => (
              <button
                key={idx}
                onClick={() => handleCtaClick(cta)}
                className={`
                  px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
                  ${cta.style === 'primary'
                    ? `${styles.buttonBg} text-white`
                    : cta.style === 'secondary'
                    ? `bg-white ${styles.text} border ${styles.border}`
                    : `${styles.text} hover:underline`
                  }
                `}
              >
                {cta.label}
                {cta.url && <ExternalLink className="w-3 h-3 ml-1 inline" />}
              </button>
            ))}
          </div>
        )}

        {/* Acknowledge button if required */}
        {announcement.behavior.requireAcknowledgment && (
          <button
            onClick={handleAcknowledge}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg ${styles.buttonBg} text-white flex-shrink-0`}
          >
            I Understand
          </button>
        )}

        {/* Multiple announcements indicator */}
        {banners.length > 1 && (
          <span className={`text-xs ${styles.text} opacity-70 flex-shrink-0`}>
            1 of {banners.length}
          </span>
        )}

        {/* Close button */}
        {announcement.behavior.dismissible && !announcement.behavior.requireAcknowledgment && (
          <button
            onClick={handleDismiss}
            className={`p-1 rounded-lg ${styles.text} opacity-60 hover:opacity-100 hover:bg-white/50 transition-all flex-shrink-0`}
            aria-label="Dismiss announcement"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default AnnouncementBanner;
