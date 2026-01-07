// Notification Service - Handles real notification triggers
import { useNotifications } from '@/contexts/NotificationContext';
import type { Notification, NotificationType, NotificationChannel } from '@/types/notification';

export class NotificationService {
  private static instance: NotificationService;
  private addNotification: ((notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void) | null = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Initialize with notification context
  initialize(addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void) {
    this.addNotification = addNotification;
  }

  // Booking-related notifications
  notifyBookingConfirmed(bookingData: {
    bookingId: string;
    clientName: string;
    serviceName: string;
    date: string;
    time: string;
  }) {
    this.addNotification?.({
      type: 'success',
      title: 'Booking Confirmed!',
      message: `Your ${bookingData.serviceName} appointment is confirmed for ${bookingData.date} at ${bookingData.time}`,
      channel: 'in-app',
      actionUrl: `/bookings/${bookingData.bookingId}`,
      actionLabel: 'View Details',
      metadata: {
        bookingId: bookingData.bookingId,
        clientName: bookingData.clientName,
        serviceName: bookingData.serviceName,
        date: bookingData.date,
        time: bookingData.time
      }
    });
  }

  notifyBookingReminder(bookingData: {
    bookingId: string;
    clientName: string;
    serviceName: string;
    date: string;
    time: string;
    hoursUntil: number;
  }) {
    this.addNotification?.({
      type: 'info',
      title: 'Appointment Reminder',
      message: `Don't forget! You have a ${bookingData.serviceName} appointment in ${bookingData.hoursUntil} hours (${bookingData.date} at ${bookingData.time})`,
      channel: 'in-app',
      actionUrl: `/bookings/${bookingData.bookingId}`,
      actionLabel: 'View Details',
      metadata: {
        bookingId: bookingData.bookingId,
        clientName: bookingData.clientName,
        serviceName: bookingData.serviceName,
        date: bookingData.date,
        time: bookingData.time,
        hoursUntil: bookingData.hoursUntil
      }
    });
  }

  notifyBookingCancelled(bookingData: {
    bookingId: string;
    clientName: string;
    serviceName: string;
    date: string;
    time: string;
    reason?: string;
  }) {
    this.addNotification?.({
      type: 'warning',
      title: 'Booking Cancelled',
      message: `Your ${bookingData.serviceName} appointment for ${bookingData.date} at ${bookingData.time} has been cancelled${bookingData.reason ? `: ${bookingData.reason}` : ''}`,
      channel: 'in-app',
      actionUrl: '/book',
      actionLabel: 'Book Again',
      metadata: {
        bookingId: bookingData.bookingId,
        clientName: bookingData.clientName,
        serviceName: bookingData.serviceName,
        date: bookingData.date,
        time: bookingData.time,
        reason: bookingData.reason
      }
    });
  }

  // Order-related notifications
  notifyOrderConfirmed(orderData: {
    orderId: string;
    clientName: string;
    total: number;
    items: Array<{ name: string; quantity: number }>;
  }) {
    this.addNotification?.({
      type: 'success',
      title: 'Order Confirmed!',
      message: `Your order #${orderData.orderId} for $${orderData.total.toFixed(2)} has been confirmed and is being processed`,
      channel: 'in-app',
      actionUrl: `/orders/${orderData.orderId}`,
      actionLabel: 'View Order',
      metadata: {
        orderId: orderData.orderId,
        clientName: orderData.clientName,
        total: orderData.total,
        items: orderData.items
      }
    });
  }

  notifyOrderShipped(orderData: {
    orderId: string;
    clientName: string;
    trackingNumber?: string;
    estimatedDelivery: string;
  }) {
    this.addNotification?.({
      type: 'info',
      title: 'Order Shipped!',
      message: `Your order #${orderData.orderId} has been shipped${orderData.trackingNumber ? ` (Tracking: ${orderData.trackingNumber})` : ''}. Estimated delivery: ${orderData.estimatedDelivery}`,
      channel: 'in-app',
      actionUrl: `/orders/${orderData.orderId}`,
      actionLabel: 'Track Order',
      metadata: {
        orderId: orderData.orderId,
        clientName: orderData.clientName,
        trackingNumber: orderData.trackingNumber,
        estimatedDelivery: orderData.estimatedDelivery
      }
    });
  }

  notifyOrderDelivered(orderData: {
    orderId: string;
    clientName: string;
    deliveredAt: string;
  }) {
    this.addNotification?.({
      type: 'success',
      title: 'Order Delivered!',
      message: `Your order #${orderData.orderId} was delivered on ${orderData.deliveredAt}. We hope you love your purchase!`,
      channel: 'in-app',
      actionUrl: `/orders/${orderData.orderId}`,
      actionLabel: 'View Order',
      metadata: {
        orderId: orderData.orderId,
        clientName: orderData.clientName,
        deliveredAt: orderData.deliveredAt
      }
    });
  }

  // Promotion and announcement notifications
  notifyPromotion(promotionData: {
    promotionId: string;
    title: string;
    description: string;
    discount: string;
    expiresAt: string;
  }) {
    this.addNotification?.({
      type: 'promotion',
      title: 'Special Offer!',
      message: `${promotionData.title}: ${promotionData.description} - ${promotionData.discount} off! Expires ${promotionData.expiresAt}`,
      channel: 'in-app',
      actionUrl: `/promotions/${promotionData.promotionId}`,
      actionLabel: 'View Offer',
      expiresAt: promotionData.expiresAt,
      metadata: {
        promotionId: promotionData.promotionId,
        title: promotionData.title,
        description: promotionData.description,
        discount: promotionData.discount,
        expiresAt: promotionData.expiresAt
      }
    });
  }

  notifyAnnouncement(announcementData: {
    announcementId: string;
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high';
  }) {
    this.addNotification?.({
      type: 'announcement',
      title: announcementData.title,
      message: announcementData.message,
      channel: 'in-app',
      actionUrl: `/announcements/${announcementData.announcementId}`,
      actionLabel: 'Read More',
      metadata: {
        announcementId: announcementData.announcementId,
        title: announcementData.title,
        message: announcementData.message,
        priority: announcementData.priority
      }
    });
  }

  // System notifications
  notifySystemUpdate(updateData: {
    version: string;
    features: string[];
    breakingChanges?: string[];
  }) {
    this.addNotification?.({
      type: 'info',
      title: 'System Update Available',
      message: `Version ${updateData.version} is now available with new features: ${updateData.features.join(', ')}`,
      channel: 'in-app',
      actionUrl: '/updates',
      actionLabel: 'Learn More',
      metadata: {
        version: updateData.version,
        features: updateData.features,
        breakingChanges: updateData.breakingChanges
      }
    });
  }

  notifyMaintenance(maintenanceData: {
    startTime: string;
    endTime: string;
    affectedServices: string[];
  }) {
    this.addNotification?.({
      type: 'warning',
      title: 'Scheduled Maintenance',
      message: `We'll be performing maintenance from ${maintenanceData.startTime} to ${maintenanceData.endTime}. Some services may be temporarily unavailable.`,
      channel: 'in-app',
      actionUrl: '/status',
      actionLabel: 'Check Status',
      metadata: {
        startTime: maintenanceData.startTime,
        endTime: maintenanceData.endTime,
        affectedServices: maintenanceData.affectedServices
      }
    });
  }

  // Generic notification method
  notify(type: NotificationType, title: string, message: string, options?: {
    channel?: NotificationChannel;
    actionUrl?: string;
    actionLabel?: string;
    expiresAt?: string;
    metadata?: Record<string, any>;
  }) {
    this.addNotification?.({
      type,
      title,
      message,
      channel: options?.channel || 'in-app',
      actionUrl: options?.actionUrl,
      actionLabel: options?.actionLabel,
      expiresAt: options?.expiresAt,
      metadata: options?.metadata
    });
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();