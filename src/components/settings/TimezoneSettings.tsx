/**
 * Timezone Settings Component
 * Allows users to view and update their store's timezone
 */

import { useState, useEffect } from 'react';
import { Globe, Save, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { toast } from '@/hooks/use-toast';
import { getStoreTimezone, setStoreTimezone, isValidTimezone } from '@/utils/dateUtils';
import { supabase } from '@/services/supabase/client';
import { storeAuthManager } from '@/services/storeAuthManager';

// Common US/North American timezones (IANA format)
const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (ET)', offset: 'UTC-5/-4' },
  { value: 'America/Chicago', label: 'Central Time (CT)', offset: 'UTC-6/-5' },
  { value: 'America/Denver', label: 'Mountain Time (MT)', offset: 'UTC-7/-6' },
  { value: 'America/Phoenix', label: 'Arizona (No DST)', offset: 'UTC-7' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: 'UTC-8/-7' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)', offset: 'UTC-9/-8' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)', offset: 'UTC-10' },
  { value: 'America/Puerto_Rico', label: 'Atlantic Time (AST)', offset: 'UTC-4' },
] as const;

interface TimezoneSettingsProps {
  className?: string;
}

export function TimezoneSettings({ className }: TimezoneSettingsProps) {
  const [currentTimezone, setCurrentTimezone] = useState<string>('');
  const [selectedTimezone, setSelectedTimezone] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load current timezone on mount
  useEffect(() => {
    const tz = getStoreTimezone();
    setCurrentTimezone(tz);
    setSelectedTimezone(tz);
  }, []);

  // Track changes
  useEffect(() => {
    setHasChanges(selectedTimezone !== currentTimezone && selectedTimezone !== '');
  }, [selectedTimezone, currentTimezone]);

  const handleTimezoneChange = (value: string) => {
    setSelectedTimezone(value);
  };

  const handleSave = async () => {
    if (!selectedTimezone || !isValidTimezone(selectedTimezone)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Timezone',
        description: 'Please select a valid timezone.',
      });
      return;
    }

    setIsSaving(true);

    try {
      // Get current store session
      const session = storeAuthManager.getState();
      if (!session.store?.storeId) {
        throw new Error('No store session found');
      }

      // Update timezone in Supabase
      const { error } = await supabase
        .from('stores')
        .update({ timezone: selectedTimezone })
        .eq('id', session.store.storeId);

      if (error) {
        throw error;
      }

      // Update local timezone setting
      setStoreTimezone(selectedTimezone);

      // Update localStorage for offline support
      localStorage.setItem('mango_store_timezone', selectedTimezone);

      // Update current state
      setCurrentTimezone(selectedTimezone);
      setHasChanges(false);

      toast({
        title: 'Timezone Updated',
        description: `Store timezone set to ${getTimezoneLabel(selectedTimezone)}`,
      });
    } catch (error) {
      console.error('[TimezoneSettings] Failed to update timezone:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not update timezone. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getTimezoneLabel = (value: string): string => {
    const option = TIMEZONE_OPTIONS.find(tz => tz.value === value);
    return option ? option.label : value;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Globe className="w-5 h-5" />
          Store Timezone
        </CardTitle>
        <CardDescription>
          Set your store's timezone for accurate appointment scheduling and time display.
          All appointments will be shown in this timezone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="timezone-select">Timezone</Label>
          <Select value={selectedTimezone} onValueChange={handleTimezoneChange}>
            <SelectTrigger id="timezone-select" className="w-full max-w-md">
              <SelectValue placeholder="Select timezone..." />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONE_OPTIONS.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  <div className="flex items-center justify-between gap-4">
                    <span>{tz.label}</span>
                    <span className="text-xs text-muted-foreground">{tz.offset}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Current: {getTimezoneLabel(currentTimezone)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
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
              onClick={() => setSelectedTimezone(currentTimezone)}
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export { TIMEZONE_OPTIONS };
