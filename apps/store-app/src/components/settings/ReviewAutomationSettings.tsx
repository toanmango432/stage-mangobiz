/**
 * Review Automation Settings Component
 * Allows store owners to configure review request automation
 */

import { useState, useEffect } from 'react';
import { MessageSquare, Save, Check, Send } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { toast } from '@/hooks/use-toast';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchReviewSettings,
  updateReviewSettings,
  sendReviewRequest,
  selectReviewSettings,
  selectSettingsLoading,
  selectSettingsError,
  selectSendingRequest,
} from '@/store/slices/reviewsSlice';
import { storeAuthManager } from '@/services/storeAuthManager';
import type { ReviewSettings } from '@/types/review';
import { createDefaultReviewSettings } from '@/types/review';

const DELAY_OPTIONS = [
  { value: '1', label: '1 hour' },
  { value: '2', label: '2 hours' },
  { value: '4', label: '4 hours' },
  { value: '24', label: '24 hours' },
  { value: '48', label: '48 hours' },
] as const;

interface ReviewAutomationSettingsProps {
  className?: string;
}

export function ReviewAutomationSettings({ className }: ReviewAutomationSettingsProps) {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectReviewSettings);
  const loading = useAppSelector(selectSettingsLoading);
  const error = useAppSelector(selectSettingsError);
  const sendingTest = useAppSelector(selectSendingRequest);

  const [autoRequestReviews, setAutoRequestReviews] = useState(true);
  const [requestDelayHours, setRequestDelayHours] = useState('24');
  const [sendReminders, setSendReminders] = useState(true);
  const [reminderIntervalDays, setReminderIntervalDays] = useState(3);
  const [googleUrl, setGoogleUrl] = useState('');
  const [yelpUrl, setYelpUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const session = storeAuthManager.getState();
    if (session.store?.storeId) {
      dispatch(fetchReviewSettings(session.store.storeId));
    }
  }, [dispatch]);

  // Populate form when settings load
  useEffect(() => {
    if (settings) {
      setAutoRequestReviews(settings.autoRequestReviews);
      setRequestDelayHours(String(settings.requestDelayHours));
      setSendReminders(settings.sendReminders);
      setReminderIntervalDays(settings.reminderIntervalDays);
      // Platform URLs would be in a platforms object if we had them
      // For now, leaving blank as we don't have this in the ReviewSettings type yet
    } else {
      // Use defaults if no settings exist
      const defaults = createDefaultReviewSettings();
      setAutoRequestReviews(defaults.autoRequestReviews);
      setRequestDelayHours(String(defaults.requestDelayHours));
      setSendReminders(defaults.sendReminders);
      setReminderIntervalDays(defaults.reminderIntervalDays);
    }
  }, [settings]);

  // Track changes
  useEffect(() => {
    if (!settings) {
      setHasChanges(false);
      return;
    }

    const changed =
      autoRequestReviews !== settings.autoRequestReviews ||
      Number(requestDelayHours) !== settings.requestDelayHours ||
      sendReminders !== settings.sendReminders ||
      reminderIntervalDays !== settings.reminderIntervalDays;

    setHasChanges(changed);
  }, [settings, autoRequestReviews, requestDelayHours, sendReminders, reminderIntervalDays]);

  const handleSave = async () => {
    if (reminderIntervalDays <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Reminder interval must be greater than 0 days.',
      });
      return;
    }

    setIsSaving(true);

    try {
      const session = storeAuthManager.getState();
      if (!session.store?.storeId) {
        throw new Error('No store session found');
      }

      const updatedSettings: ReviewSettings = {
        ...(settings || createDefaultReviewSettings()),
        autoRequestReviews,
        requestDelayHours: Number(requestDelayHours),
        sendReminders,
        reminderIntervalDays,
      };

      await dispatch(updateReviewSettings({
        storeId: session.store.storeId,
        settings: updatedSettings,
      })).unwrap();

      toast({
        title: 'Settings Saved',
        description: 'Review automation settings have been updated.',
      });

      setHasChanges(false);
    } catch (err) {
      console.error('[ReviewAutomationSettings] Failed to save:', err);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not save review automation settings. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (settings) {
      setAutoRequestReviews(settings.autoRequestReviews);
      setRequestDelayHours(String(settings.requestDelayHours));
      setSendReminders(settings.sendReminders);
      setReminderIntervalDays(settings.reminderIntervalDays);
    }
  };

  const handleTestSend = async () => {
    // This would require a test client ID and appointment ID
    // For now, just show a toast that the feature is available
    toast({
      title: 'Test Send',
      description: 'Test send feature coming soon. Configure settings and use the manual send option from client profiles.',
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="w-5 h-5" />
          Review Request Automation
        </CardTitle>
        <CardDescription>
          Automatically request reviews from clients after appointments.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Auto-Send */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-request-enabled">Enable Automatic Review Requests</Label>
            <p className="text-sm text-muted-foreground">
              Send review requests automatically after checkout
            </p>
          </div>
          <Switch
            id="auto-request-enabled"
            checked={autoRequestReviews}
            onCheckedChange={setAutoRequestReviews}
          />
        </div>

        {/* Delay After Checkout */}
        <div className="space-y-2">
          <Label htmlFor="delay-select">Delay After Checkout</Label>
          <Select value={requestDelayHours} onValueChange={setRequestDelayHours}>
            <SelectTrigger id="delay-select" className="w-full max-w-xs">
              <SelectValue placeholder="Select delay..." />
            </SelectTrigger>
            <SelectContent>
              {DELAY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Wait this long after checkout before sending the review request
          </p>
        </div>

        {/* Send Reminder */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="send-reminders">Send Reminders</Label>
            <p className="text-sm text-muted-foreground">
              Send a follow-up reminder if client has not responded
            </p>
          </div>
          <Switch
            id="send-reminders"
            checked={sendReminders}
            onCheckedChange={setSendReminders}
          />
        </div>

        {/* Reminder Days (only show if reminders enabled) */}
        {sendReminders && (
          <div className="space-y-2">
            <Label htmlFor="reminder-days">Days Until Reminder</Label>
            <Input
              id="reminder-days"
              type="number"
              min="1"
              value={reminderIntervalDays}
              onChange={(e) => setReminderIntervalDays(parseInt(e.target.value) || 1)}
              className="w-full max-w-xs"
            />
            <p className="text-xs text-muted-foreground">
              Send a reminder after this many days if no response
            </p>
          </div>
        )}

        {/* Platform URLs Section */}
        <div className="space-y-4 pt-4 border-t">
          <div className="space-y-1">
            <Label className="text-base">Review Platform URLs</Label>
            <p className="text-sm text-muted-foreground">
              Add links to your business profiles on review platforms
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="google-url">Google Business Profile</Label>
            <Input
              id="google-url"
              type="url"
              placeholder="https://g.page/your-business/review"
              value={googleUrl}
              onChange={(e) => setGoogleUrl(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="yelp-url">Yelp</Label>
            <Input
              id="yelp-url"
              type="url"
              placeholder="https://www.yelp.com/biz/your-business"
              value={yelpUrl}
              onChange={(e) => setYelpUrl(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="facebook-url">Facebook</Label>
            <Input
              id="facebook-url"
              type="url"
              placeholder="https://www.facebook.com/your-page/reviews"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Test Send Button */}
        <div className="pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleTestSend}
            disabled={sendingTest || !autoRequestReviews}
            className="gap-2"
          >
            <Send className="w-4 h-4" />
            {sendingTest ? 'Sending...' : 'Test Send'}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Send a test review request to verify your settings
          </p>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving || loading}
            className="gap-2"
          >
            {isSaving ? (
              <>Saving...</>
            ) : hasChanges ? (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Saved
              </>
            )}
          </Button>
          {hasChanges && (
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
