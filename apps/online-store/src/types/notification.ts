// Notification Types

export type NotificationType = 
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'promotion'
  | 'announcement'
  | 'booking'
  | 'order';

export type NotificationChannel = 
  | 'in-app'
  | 'email'
  | 'push'
  | 'sms';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  channel: NotificationChannel;
  read: boolean;
  createdAt: string;
  expiresAt?: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  userId: string;
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  types: {
    [K in NotificationType]: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
    timezone: string;
  };
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  channel: NotificationChannel;
  subject?: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  variables: string[]; // Template variables like {{name}}, {{amount}}
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byChannel: Record<NotificationChannel, number>;
}




