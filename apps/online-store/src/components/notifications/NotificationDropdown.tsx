'use client';

import { useState } from 'react';
import { Check, X, Settings, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationItem } from './NotificationItem';
import { NotificationPreferences } from './NotificationPreferences';
import { useNotifications } from '@/contexts/NotificationContext';
import type { Notification } from '@/types/notification';

interface NotificationDropdownProps {
  onClose: () => void;
}

export const NotificationDropdown = ({ onClose }: NotificationDropdownProps) => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'preferences'>('notifications');
  const {
    notifications,
    stats,
    markAllAsRead,
    clearAll,
    markAsRead,
    deleteNotification
  } = useNotifications();

  const unreadNotifications = notifications.filter(n => !n.read);
  const recentNotifications = notifications.slice(0, 10);

  return (
    <div className="absolute right-0 top-12 w-80 z-50">
      <Card className="shadow-lg border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Notifications</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('preferences')}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {stats.unread > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {stats.unread} unread notification{stats.unread !== 1 ? 's' : ''}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
              >
                <Check className="h-4 w-4 mr-2" />
                Mark all read
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-2 mx-4 mb-4">
              <TabsTrigger value="notifications">
                All ({stats.total})
              </TabsTrigger>
              <TabsTrigger value="preferences">
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notifications" className="space-y-0">
              <ScrollArea className="h-96">
                {recentNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <div className="text-4xl mb-2">🔔</div>
                    <p className="text-sm">No notifications yet</p>
                    <p className="text-xs">We'll notify you when something important happens</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {recentNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={() => markAsRead(notification.id)}
                        onDelete={() => deleteNotification(notification.id)}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>

              {notifications.length > 0 && (
                <div className="border-t p-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAll}
                    className="w-full text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear all notifications
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="preferences" className="p-4">
              <NotificationPreferences />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};




