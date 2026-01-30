'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  X, 
  ExternalLink, 
  Clock, 
  MoreVertical,
  Calendar,
  Package,
  Megaphone,
  Gift,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types/notification';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: () => void;
  onDelete: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info': return <Info className="h-4 w-4 text-blue-600" />;
      case 'promotion': return <Gift className="h-4 w-4 text-purple-600" />;
      case 'announcement': return <Megaphone className="h-4 w-4 text-orange-600" />;
      case 'booking': return <Calendar className="h-4 w-4 text-indigo-600" />;
      case 'order': return <Package className="h-4 w-4 text-pink-600" />;
      default: return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-l-green-500 bg-green-50';
      case 'error': return 'border-l-red-500 bg-red-50';
      case 'warning': return 'border-l-yellow-500 bg-yellow-50';
      case 'info': return 'border-l-blue-500 bg-blue-50';
      case 'promotion': return 'border-l-purple-500 bg-purple-50';
      case 'announcement': return 'border-l-orange-500 bg-orange-50';
      case 'booking': return 'border-l-indigo-500 bg-indigo-50';
      case 'order': return 'border-l-pink-500 bg-pink-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    
    return date.toLocaleDateString();
  };

  const handleActionClick = () => {
    if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank');
    }
    if (!notification.read) {
      onMarkAsRead();
    }
  };

  return (
    <div
      className={cn(
        'p-4 border-l-4 transition-all duration-200 hover:shadow-sm',
        getTypeColor(notification.type),
        !notification.read && 'bg-opacity-100',
        notification.read && 'opacity-75'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start space-x-3">
        {/* Type Icon */}
        <div className="flex-shrink-0 mt-1">
          {getTypeIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className={cn(
                  'text-sm font-medium',
                  !notification.read && 'font-semibold'
                )}>
                  {notification.title}
                </h4>
                {!notification.read && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                )}
                <Badge 
                  variant="secondary" 
                  className="text-xs"
                >
                  {notification.type}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-600 mb-2">
                {notification.message}
              </p>

              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(notification.createdAt)}</span>
                </div>
                
                {notification.expiresAt && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>Expires {formatTime(notification.expiresAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1 ml-2">
              {notification.actionUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleActionClick}
                  className="h-8 px-2 text-xs"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  {notification.actionLabel || 'View'}
                </Button>
              )}

              {!notification.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMarkAsRead}
                  className="h-8 w-8 p-0"
                  title="Mark as read"
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                title="Delete notification"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Metadata */}
          {notification.metadata && Object.keys(notification.metadata).length > 0 && (
            <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-xs text-gray-600">
              <details>
                <summary className="cursor-pointer hover:text-gray-800">
                  Details
                </summary>
                <pre className="mt-1 whitespace-pre-wrap">
                  {JSON.stringify(notification.metadata, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};