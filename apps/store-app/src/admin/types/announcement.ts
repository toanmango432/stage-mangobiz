/**
 * Enhanced Announcement Types
 * Multi-channel notification system for effective user communication
 *
 * Best Practices Implemented:
 * - Multiple delivery channels (banner, modal, toast, email)
 * - Granular targeting (tier, role, behavior, specific tenants)
 * - Rich content support (markdown, images, CTAs)
 * - Comprehensive tracking (views, dismissals, clicks)
 * - Flexible scheduling and frequency controls
 */

// ============================================================================
// DELIVERY CHANNELS
// ============================================================================

/** How the announcement is delivered to users */
export type DeliveryChannel =
  | 'in_app_banner'      // Top banner in the app
  | 'in_app_modal'       // Modal popup (for critical announcements)
  | 'in_app_toast'       // Toast notification (temporary)
  | 'dashboard_widget'   // Widget on dashboard
  | 'login_screen'       // Show on login page
  | 'email';             // Send via email

/** Channel-specific configuration */
export interface ChannelConfig {
  in_app_banner?: {
    position: 'top' | 'bottom';
    sticky: boolean;              // Stays visible while scrolling
  };
  in_app_modal?: {
    size: 'small' | 'medium' | 'large';
    backdrop: boolean;            // Show dark backdrop
    closeOnBackdrop: boolean;     // Close when clicking backdrop
  };
  in_app_toast?: {
    position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    duration: number;             // Auto-dismiss after ms (0 = manual)
  };
  dashboard_widget?: {
    showIcon: boolean;
    collapsible: boolean;
  };
  email?: {
    subject?: string;             // Custom email subject
    replyTo?: string;             // Reply-to address
    includeUnsubscribe: boolean;
  };
}

// ============================================================================
// ANNOUNCEMENT CATEGORIES
// ============================================================================

/** Category determines the purpose and default styling */
export type AnnouncementCategory =
  | 'feature_update'     // New features or improvements
  | 'maintenance'        // Scheduled maintenance windows
  | 'security'           // Security alerts and advisories
  | 'promotion'          // Promotions, discounts, upgrades
  | 'tip'                // Tips, tutorials, how-tos
  | 'policy'             // Policy or terms updates
  | 'urgent'             // Critical alerts requiring immediate attention
  | 'general';           // General announcements

// ============================================================================
// SEVERITY / PRIORITY
// ============================================================================

/** Visual severity level */
export type AnnouncementSeverity =
  | 'info'       // Blue - informational
  | 'success'    // Green - positive news
  | 'warning'    // Yellow - attention needed
  | 'error'      // Red - critical issue
  | 'neutral';   // Gray - neutral tone

/** Priority affects display order and behavior */
export type AnnouncementPriority =
  | 'low'        // Can be easily dismissed
  | 'normal'     // Standard priority
  | 'high'       // Shown prominently
  | 'critical';  // Cannot be easily dismissed, shown first

// ============================================================================
// TARGETING
// ============================================================================

/** Who should see this announcement */
export interface AnnouncementTargeting {
  // Tier-based targeting
  tiers: ('all' | 'free' | 'basic' | 'professional' | 'enterprise')[];

  // Role-based targeting (within each tenant)
  roles: ('all' | 'owner' | 'manager' | 'staff')[];

  // Specific tenant IDs (empty = all tenants matching tier)
  specificTenantIds?: string[];

  // Behavior-based targeting
  behavior?: {
    newUsers?: boolean;           // Users created in last 30 days
    inactiveUsers?: boolean;      // No login in last 14 days
    trialUsers?: boolean;         // Users on trial
    expiringLicenses?: boolean;   // Licenses expiring in 30 days
  };

  // Feature-based targeting
  features?: {
    hasFeature?: string[];        // Users with these features enabled
    lacksFeature?: string[];      // Users without these features
  };
}

// ============================================================================
// CONTENT
// ============================================================================

/** Call-to-action button */
export interface AnnouncementCTA {
  label: string;                  // Button text
  url?: string;                   // External link
  action?: string;                // Internal action (e.g., 'upgrade', 'settings')
  style: 'primary' | 'secondary' | 'link';
  trackClicks: boolean;           // Track click events
}

/** Rich content for announcements */
export interface AnnouncementContent {
  title: string;
  body: string;                   // Supports markdown
  summary?: string;               // Short version for toasts/widgets
  imageUrl?: string;              // Hero image
  iconEmoji?: string;             // Custom emoji icon
  ctas?: AnnouncementCTA[];       // Action buttons (max 2 recommended)
}

// ============================================================================
// DISPLAY BEHAVIOR
// ============================================================================

/** How the announcement behaves */
export interface DisplayBehavior {
  dismissible: boolean;           // Can user dismiss it?
  requireAcknowledgment: boolean; // Must click "I understand" to dismiss
  showOnce: boolean;              // Only show once per user
  frequency?: {
    maxViews: number;             // Max times to show (0 = unlimited)
    cooldownHours: number;        // Hours between showings
  };
  // Scheduling
  startsAt?: Date;                // When to start showing
  expiresAt?: Date;               // When to stop showing
  // Time-based display
  showDuringHours?: {
    start: number;                // Hour (0-23)
    end: number;                  // Hour (0-23)
    timezone?: string;            // Timezone (default: tenant's timezone)
  };
}

// ============================================================================
// TRACKING & ANALYTICS
// ============================================================================

/** Tracking data for an announcement */
export interface AnnouncementStats {
  totalViews: number;
  uniqueViews: number;
  dismissals: number;
  acknowledgments: number;
  ctaClicks: Record<string, number>;  // CTA label -> click count
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
}

/** Individual user interaction record */
export interface AnnouncementInteraction {
  id: string;
  announcementId: string;
  tenantId: string;
  userId?: string;                // Member ID if known
  storeId?: string;
  action: 'view' | 'dismiss' | 'acknowledge' | 'cta_click' | 'email_open' | 'email_click';
  ctaLabel?: string;              // Which CTA was clicked
  channel: DeliveryChannel;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// STATUS
// ============================================================================

export type AnnouncementStatus =
  | 'draft'       // Not yet published
  | 'scheduled'   // Scheduled for future
  | 'active'      // Currently showing
  | 'paused'      // Temporarily paused
  | 'expired'     // Past expiry date
  | 'archived';   // Manually archived

// ============================================================================
// MAIN ANNOUNCEMENT TYPE
// ============================================================================

export interface Announcement {
  id: string;

  // Content
  content: AnnouncementContent;

  // Classification
  category: AnnouncementCategory;
  severity: AnnouncementSeverity;
  priority: AnnouncementPriority;

  // Delivery
  channels: DeliveryChannel[];
  channelConfig?: ChannelConfig;

  // Targeting
  targeting: AnnouncementTargeting;

  // Behavior
  behavior: DisplayBehavior;

  // Status
  status: AnnouncementStatus;

  // Stats (denormalized for quick access)
  stats: AnnouncementStats;

  // Metadata
  tags?: string[];
  internalNotes?: string;         // Admin-only notes

  // Audit
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  archivedAt?: Date;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateAnnouncementInput {
  content: AnnouncementContent;
  category: AnnouncementCategory;
  severity?: AnnouncementSeverity;
  priority?: AnnouncementPriority;
  channels: DeliveryChannel[];
  channelConfig?: ChannelConfig;
  targeting: AnnouncementTargeting;
  behavior: Partial<DisplayBehavior>;
  tags?: string[];
  internalNotes?: string;
}

export interface UpdateAnnouncementInput {
  content?: Partial<AnnouncementContent>;
  category?: AnnouncementCategory;
  severity?: AnnouncementSeverity;
  priority?: AnnouncementPriority;
  channels?: DeliveryChannel[];
  channelConfig?: ChannelConfig;
  targeting?: Partial<AnnouncementTargeting>;
  behavior?: Partial<DisplayBehavior>;
  status?: AnnouncementStatus;
  tags?: string[];
  internalNotes?: string;
}

// ============================================================================
// UI CONFIGURATION
// ============================================================================

export const CATEGORY_CONFIG: Record<AnnouncementCategory, {
  label: string;
  icon: string;
  defaultSeverity: AnnouncementSeverity;
  defaultChannels: DeliveryChannel[];
}> = {
  feature_update: {
    label: 'Feature Update',
    icon: 'sparkles',
    defaultSeverity: 'success',
    defaultChannels: ['in_app_banner', 'dashboard_widget'],
  },
  maintenance: {
    label: 'Maintenance',
    icon: 'wrench',
    defaultSeverity: 'warning',
    defaultChannels: ['in_app_banner', 'email'],
  },
  security: {
    label: 'Security Alert',
    icon: 'shield-alert',
    defaultSeverity: 'error',
    defaultChannels: ['in_app_modal', 'email'],
  },
  promotion: {
    label: 'Promotion',
    icon: 'gift',
    defaultSeverity: 'info',
    defaultChannels: ['in_app_toast', 'dashboard_widget'],
  },
  tip: {
    label: 'Tip & Tutorial',
    icon: 'lightbulb',
    defaultSeverity: 'info',
    defaultChannels: ['dashboard_widget'],
  },
  policy: {
    label: 'Policy Update',
    icon: 'file-text',
    defaultSeverity: 'neutral',
    defaultChannels: ['in_app_modal', 'email'],
  },
  urgent: {
    label: 'Urgent Alert',
    icon: 'alert-triangle',
    defaultSeverity: 'error',
    defaultChannels: ['in_app_modal', 'in_app_banner', 'email'],
  },
  general: {
    label: 'General',
    icon: 'megaphone',
    defaultSeverity: 'info',
    defaultChannels: ['in_app_banner'],
  },
};

export const SEVERITY_CONFIG: Record<AnnouncementSeverity, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconColor: string;
}> = {
  info: {
    label: 'Information',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-500',
  },
  success: {
    label: 'Success',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    iconColor: 'text-green-500',
  },
  warning: {
    label: 'Warning',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    iconColor: 'text-yellow-500',
  },
  error: {
    label: 'Critical',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-500',
  },
  neutral: {
    label: 'Neutral',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    iconColor: 'text-gray-500',
  },
};

export const PRIORITY_CONFIG: Record<AnnouncementPriority, {
  label: string;
  order: number;
  description: string;
}> = {
  low: {
    label: 'Low',
    order: 1,
    description: 'Can be easily dismissed, shown last',
  },
  normal: {
    label: 'Normal',
    order: 2,
    description: 'Standard priority',
  },
  high: {
    label: 'High',
    order: 3,
    description: 'Shown prominently',
  },
  critical: {
    label: 'Critical',
    order: 4,
    description: 'Cannot be easily dismissed, shown first',
  },
};

export const CHANNEL_CONFIG: Record<DeliveryChannel, {
  label: string;
  icon: string;
  description: string;
}> = {
  in_app_banner: {
    label: 'In-App Banner',
    icon: 'layout-top',
    description: 'Persistent banner at top of the application',
  },
  in_app_modal: {
    label: 'Modal Popup',
    icon: 'maximize-2',
    description: 'Popup dialog that requires attention',
  },
  in_app_toast: {
    label: 'Toast Notification',
    icon: 'bell',
    description: 'Temporary notification that auto-dismisses',
  },
  dashboard_widget: {
    label: 'Dashboard Widget',
    icon: 'layout-dashboard',
    description: 'Card displayed on the dashboard',
  },
  login_screen: {
    label: 'Login Screen',
    icon: 'log-in',
    description: 'Shown on the login page before sign-in',
  },
  email: {
    label: 'Email',
    icon: 'mail',
    description: 'Sent via email to users',
  },
};

export const TARGET_TIER_LABELS: Record<string, string> = {
  all: 'All Tiers',
  free: 'Free',
  basic: 'Basic',
  professional: 'Professional',
  enterprise: 'Enterprise',
};

export const TARGET_ROLE_LABELS: Record<string, string> = {
  all: 'All Roles',
  owner: 'Owners',
  manager: 'Managers',
  staff: 'Staff',
};

// ============================================================================
// LEGACY COMPATIBILITY (for migration)
// ============================================================================

/** @deprecated Use AnnouncementSeverity instead */
export type AnnouncementType = AnnouncementSeverity;

/** @deprecated Use targeting.tiers instead */
export type AnnouncementTarget = 'all' | 'free' | 'basic' | 'professional' | 'enterprise';

// Legacy config for backward compatibility during migration
export const ANNOUNCEMENT_TYPE_CONFIG = SEVERITY_CONFIG;
export const ANNOUNCEMENT_TARGET_LABELS = TARGET_TIER_LABELS;
