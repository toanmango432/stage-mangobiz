'use client';

import { useState, useEffect } from 'react';
import { Save, Bell, Mail, Smartphone, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotifications } from '@/contexts/NotificationContext';
import type { NotificationPreferences, NotificationType } from '@/types/notification';

export const NotificationPreferences = () => {
  const { preferences, updatePreferences } = useNotifications();
  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);

  useEffect(() => {
    if (localPreferences && preferences) {
      setHasChanges(JSON.stringify(localPreferences) !== JSON.stringify(preferences));
    }
  }, [localPreferences, preferences]);

  if (!localPreferences) {
    return <div>Loading preferences...</div>;
  }

  const handleChannelChange = (channel: keyof typeof localPreferences.channels, value: boolean) => {
    setLocalPreferences(prev => ({
      ...prev!,
      channels: {
        ...prev!.channels,
        [channel]: value
      }
    }));
  };

  const handleTypeChange = (type: NotificationType, value: boolean) => {
    setLocalPreferences(prev => ({
      ...prev!,
      types: {
        ...prev!.types,
        [type]: value
      }
    }));
  };

  const handleQuietHoursChange = (field: string, value: any) => {
    setLocalPreferences(prev => ({
      ...prev!,
      quietHours: {
        ...prev!.quietHours,
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    updatePreferences(localPreferences);
    setHasChanges(false);
  };

  const channelConfigs = [
    { key: 'inApp', label: 'In-App Notifications', icon: Bell, description: 'Show notifications in the app' },
    { key: 'email', label: 'Email Notifications', icon: Mail, description: 'Send notifications via email' },
    { key: 'push', label: 'Push Notifications', icon: Smartphone, description: 'Browser push notifications' },
    { key: 'sms', label: 'SMS Notifications', icon: MessageSquare, description: 'Text message notifications' }
  ] as const;

  const notificationTypes: Array<{ key: NotificationType; label: string; description: string }> = [
    { key: 'info', label: 'General Information', description: 'Updates and general information' },
    { key: 'success', label: 'Success Messages', description: 'Confirmation and success notifications' },
    { key: 'warning', label: 'Warnings', description: 'Important warnings and alerts' },
    { key: 'error', label: 'Errors', description: 'Error messages and issues' },
    { key: 'promotion', label: 'Promotions', description: 'Special offers and discounts' },
    { key: 'announcement', label: 'Announcements', description: 'Important announcements' },
    { key: 'booking', label: 'Booking Updates', description: 'Appointment and booking notifications' },
    { key: 'order', label: 'Order Updates', description: 'Purchase and order notifications' }
  ];

  return (
    <div className="space-y-6">
      {/* Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notification Channels</CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose how you want to receive notifications
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {channelConfigs.map(({ key, label, icon: Icon, description }) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor={key} className="text-sm font-medium">
                    {label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </div>
              <Switch
                id={key}
                checked={localPreferences.channels[key]}
                onCheckedChange={(checked) => handleChannelChange(key, checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notification Types</CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose which types of notifications you want to receive
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationTypes.map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <Label htmlFor={key} className="text-sm font-medium">
                  {label}
                </Label>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <Switch
                id={key}
                checked={localPreferences.types[key]}
                onCheckedChange={(checked) => handleTypeChange(key, checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quiet Hours</CardTitle>
          <p className="text-sm text-muted-foreground">
            Set times when you don't want to receive notifications
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="quiet-hours-enabled" className="text-sm font-medium">
                Enable Quiet Hours
              </Label>
              <p className="text-xs text-muted-foreground">
                Pause notifications during specified times
              </p>
            </div>
            <Switch
              id="quiet-hours-enabled"
              checked={localPreferences.quietHours.enabled}
              onCheckedChange={(checked) => handleQuietHoursChange('enabled', checked)}
            />
          </div>

          {localPreferences.quietHours.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-time" className="text-sm font-medium">
                  Start Time
                </Label>
                <Select
                  value={localPreferences.quietHours.start}
                  onValueChange={(value) => handleQuietHoursChange('start', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return (
                        <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                          {hour}:00
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="end-time" className="text-sm font-medium">
                  End Time
                </Label>
                <Select
                  value={localPreferences.quietHours.end}
                  onValueChange={(value) => handleQuietHoursChange('end', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return (
                        <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                          {hour}:00
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      {hasChanges && (
        <div className="flex justify-end">
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Preferences
          </Button>
        </div>
      )}
    </div>
  );
};




