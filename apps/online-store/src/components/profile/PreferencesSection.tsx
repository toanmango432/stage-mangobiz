import { User } from "@/types/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, MessageSquare, Clock } from "lucide-react";

interface PreferencesSectionProps {
  user: User;
  onUpdate: (updates: Partial<User>) => void;
}

export const PreferencesSection = ({ user, onUpdate }: PreferencesSectionProps) => {
  const updateNotificationPreference = (key: keyof User['preferences']['notifications'], value: boolean) => {
    onUpdate({
      preferences: {
        ...user.preferences,
        notifications: {
          ...user.preferences.notifications,
          [key]: value,
        },
      },
    });
  };

  const updateCommunicationPreference = (key: keyof User['preferences']['communication'], value: string) => {
    onUpdate({
      preferences: {
        ...user.preferences,
        communication: {
          ...user.preferences.communication,
          [key]: value,
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-notif">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive updates via email</p>
            </div>
            <Switch
              id="email-notif"
              checked={user.preferences.notifications.email}
              onCheckedChange={(checked) => updateNotificationPreference('email', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sms-notif">SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive text messages</p>
            </div>
            <Switch
              id="sms-notif"
              checked={user.preferences.notifications.sms}
              onCheckedChange={(checked) => updateNotificationPreference('sms', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="booking-reminders">Booking Reminders</Label>
              <p className="text-sm text-muted-foreground">Get reminded about appointments</p>
            </div>
            <Switch
              id="booking-reminders"
              checked={user.preferences.notifications.bookingReminders}
              onCheckedChange={(checked) => updateNotificationPreference('bookingReminders', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="promotional">Promotional Emails</Label>
              <p className="text-sm text-muted-foreground">Special offers and discounts</p>
            </div>
            <Switch
              id="promotional"
              checked={user.preferences.notifications.promotional}
              onCheckedChange={(checked) => updateNotificationPreference('promotional', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="newsletter">Newsletter</Label>
              <p className="text-sm text-muted-foreground">Monthly updates and tips</p>
            </div>
            <Switch
              id="newsletter"
              checked={user.preferences.notifications.newsletter}
              onCheckedChange={(checked) => updateNotificationPreference('newsletter', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Communication Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="preferred-method">Preferred Contact Method</Label>
            <Select
              value={user.preferences.communication.preferredMethod}
              onValueChange={(value) => updateCommunicationPreference('preferredMethod', value)}
            >
              <SelectTrigger id="preferred-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="language">Language Preference</Label>
            <Select
              value={user.preferences.communication.language}
              onValueChange={(value) => updateCommunicationPreference('language', value)}
            >
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Service Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Service preferences will be available soon. You'll be able to select preferred staff members, favorite services, and appointment time preferences.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
