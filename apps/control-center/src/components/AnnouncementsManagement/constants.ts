/**
 * Announcements Management Constants
 */

import {
  Megaphone,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Wrench,
  Bell,
  Mail,
  LayoutDashboard,
  LogIn,
  Maximize2,
  LayoutPanelTop,
  Sparkles,
  ShieldAlert,
  Gift,
  Lightbulb,
  FileText,
} from 'lucide-react';
import type {
  AnnouncementCategory,
  AnnouncementSeverity,
  AnnouncementStatus,
  DeliveryChannel,
} from '@/types';

// Category Icons
export const CATEGORY_ICONS: Record<AnnouncementCategory, typeof Sparkles> = {
  feature_update: Sparkles,
  maintenance: Wrench,
  security: ShieldAlert,
  promotion: Gift,
  tip: Lightbulb,
  policy: FileText,
  urgent: AlertTriangle,
  general: Megaphone,
};

// Severity Icons
export const SEVERITY_ICONS: Record<AnnouncementSeverity, typeof Info> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  neutral: Info,
};

// Channel Icons
export const CHANNEL_ICONS: Record<DeliveryChannel, typeof Bell> = {
  in_app_banner: LayoutPanelTop,
  in_app_modal: Maximize2,
  in_app_toast: Bell,
  dashboard_widget: LayoutDashboard,
  login_screen: LogIn,
  email: Mail,
};

// Status Configuration
export const STATUS_CONFIG: Record<AnnouncementStatus, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Draft', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  scheduled: { label: 'Scheduled', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  active: { label: 'Active', color: 'text-green-600', bgColor: 'bg-green-100' },
  paused: { label: 'Paused', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  expired: { label: 'Expired', color: 'text-gray-500', bgColor: 'bg-gray-100' },
  archived: { label: 'Archived', color: 'text-gray-400', bgColor: 'bg-gray-50' },
};
