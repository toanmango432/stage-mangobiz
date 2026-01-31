'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Notification, NotificationPreferences, NotificationStats } from '@/types/notification';

interface NotificationContextType {
  notifications: Notification[];
  stats: NotificationStats;
  preferences: NotificationPreferences | null;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  clearAll: () => void;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const STORAGE_KEY = 'mango-notifications';
const PREFERENCES_KEY = 'mango-notification-preferences';

const defaultPreferences: NotificationPreferences = {
  userId: 'anonymous',
  channels: {
    inApp: true,
    email: false,
    push: false,
    sms: false
  },
  types: {
    info: true,
    success: true,
    warning: true,
    error: true,
    promotion: true,
    announcement: true,
    booking: true,
    order: true
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  }
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  // Load notifications and preferences from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const loadNotifications = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Filter out expired notifications
          const now = new Date();
          const valid = parsed.filter((n: Notification) => 
            !n.expiresAt || new Date(n.expiresAt) > now
          );
          setNotifications(valid);
        }
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    };

    const loadPreferences = () => {
      try {
        const stored = localStorage.getItem(PREFERENCES_KEY);
        if (stored) {
          setPreferences(JSON.parse(stored));
        } else {
          setPreferences(defaultPreferences);
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
        setPreferences(defaultPreferences);
      }
    };

    loadNotifications();
    loadPreferences();
  }, []);

  // Save notifications to localStorage when they change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (notifications.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    }
  }, [notifications]);

  // Save preferences to localStorage when they change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (preferences) {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    }
  }, [preferences]);

  const addNotification = (notificationData: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    // Check if user wants this type of notification
    if (preferences && !preferences.types[notificationData.type]) {
      return;
    }

    // Check quiet hours
    if (preferences?.quietHours.enabled) {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM
      const { start, end } = preferences.quietHours;
      
      if (start > end) {
        // Overnight quiet hours (e.g., 22:00 to 08:00)
        if (currentTime >= start || currentTime <= end) {
          return;
        }
      } else {
        // Same day quiet hours (e.g., 12:00 to 14:00)
        if (currentTime >= start && currentTime <= end) {
          return;
        }
      }
    }

    const notification: Notification = {
      ...notificationData,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => [notification, ...prev]);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const clearAll = () => {
    setNotifications([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const updatePreferences = (newPreferences: Partial<NotificationPreferences>) => {
    if (preferences) {
      setPreferences({ ...preferences, ...newPreferences });
    }
  };

  const refreshNotifications = () => {
    if (typeof window === 'undefined') return;
    // In a real app, this would fetch from the server
    // For now, we just reload from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setNotifications(parsed);
      }
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    }
  };

  // Calculate stats
  const stats: NotificationStats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    byType: notifications.reduce((acc, notification) => {
      acc[notification.type] = (acc[notification.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byChannel: notifications.reduce((acc, notification) => {
      acc[notification.channel] = (acc[notification.channel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  const value: NotificationContextType = {
    notifications,
    stats,
    preferences,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    updatePreferences,
    refreshNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
