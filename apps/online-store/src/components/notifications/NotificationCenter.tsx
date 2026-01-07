import React, { useState } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Bell, 
  Check, 
  X, 
  Filter, 
  Search, 
  MoreVertical,
  Calendar,
  Clock,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationItem } from './NotificationItem';
import { NotificationPreferences } from './NotificationPreferences';
import type { Notification, NotificationType } from '@/types/notification';

type FilterType = 'all' | 'unread' | 'read';
type SortType = 'newest' | 'oldest' | 'type';

export const NotificationCenter: React.FC = () => {
  const {
    notifications,
    stats,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll
  } = useNotifications();

  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<NotificationType | 'all'>('all');
  const [showPreferences, setShowPreferences] = useState(false);

  // Filter and sort notifications
  const filteredNotifications = notifications
    .filter(notification => {
      // Filter by read status
      if (filter === 'unread' && notification.read) return false;
      if (filter === 'read' && !notification.read) return false;

      // Filter by type
      if (selectedType !== 'all' && notification.type !== selectedType) return false;

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          notification.title.toLowerCase().includes(query) ||
          notification.message.toLowerCase().includes(query)
        );
      }

      return true;
    })
    .sort((a, b) => {
      switch (sort) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'promotion': return '🎉';
      case 'announcement': return '📢';
      case 'booking': return '📅';
      case 'order': return '📦';
      default: return '🔔';
    }
  };

  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      case 'promotion': return 'text-purple-600 bg-purple-100';
      case 'announcement': return 'text-orange-600 bg-orange-100';
      case 'booking': return 'text-indigo-600 bg-indigo-100';
      case 'order': return 'text-pink-600 bg-pink-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (showPreferences) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Notification Preferences</h2>
          <Button
            variant="outline"
            onClick={() => setShowPreferences(false)}
          >
            <X className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <NotificationPreferences />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Bell className="h-6 w-6" />
            <span>Notifications</span>
            {stats.unread > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.unread}
              </Badge>
            )}
          </h2>
          <p className="text-muted-foreground">
            {stats.total} total notifications
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowPreferences(true)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Preferences
          </Button>
          {stats.unread > 0 && (
            <Button
              variant="outline"
              onClick={markAllAsRead}
            >
              <Check className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="outline"
              onClick={clearAll}
              className="text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Unread</p>
                <p className="text-2xl font-bold">{stats.unread}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Check className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Read</p>
                <p className="text-2xl font-bold">{stats.total - stats.unread}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Today</p>
                <p className="text-2xl font-bold">
                  {notifications.filter(n => 
                    new Date(n.createdAt).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedType} onValueChange={(value) => setSelectedType(value as NotificationType | 'all')}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="booking">Booking</SelectItem>
                  <SelectItem value="order">Order</SelectItem>
                  <SelectItem value="promotion">Promotion</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sort} onValueChange={(value) => setSort(value as SortType)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="type">Type</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No notifications found</p>
              <p className="text-sm">
                {searchQuery || selectedType !== 'all' || filter !== 'all' 
                  ? 'Try adjusting your filters'
                  : 'You\'re all caught up!'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={() => markAsRead(notification.id)}
                  onDelete={() => deleteNotification(notification.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};