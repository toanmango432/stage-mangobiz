/**
 * Referral Program Settings Component
 * Allows store owners to configure the referral program
 */

import { useState, useEffect } from 'react';
import { Users, Save, Check } from 'lucide-react';
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
import { useAppDispatch } from '@/store/hooks';
import {
  fetchReferralSettings,
  updateReferralSettings,
} from '@/store/slices/clientsSlice';
import { storeAuthManager } from '@/services/storeAuthManager';
import type { ReferralRewardType, ReferralDiscountType } from '@/types/client';

const REWARD_TYPE_OPTIONS: Array<{ value: ReferralRewardType; label: string }> = [
  { value: 'points', label: 'Loyalty Points' },
  { value: 'credit', label: 'Account Credit ($)' },
  { value: 'discount', label: 'Fixed Discount ($)' },
  { value: 'percentage', label: 'Percentage Discount (%)' },
] as const;

const DISCOUNT_TYPE_OPTIONS: Array<{ value: ReferralDiscountType; label: string }> = [
  { value: 'percentage', label: 'Percentage Off (%)' },
  { value: 'fixed', label: 'Fixed Amount Off ($)' },
] as const;

const EXPIRATION_OPTIONS = [
  { value: 'never', label: 'Never' },
  { value: '30', label: '30 days' },
  { value: '60', label: '60 days' },
  { value: '90', label: '90 days' },
  { value: '180', label: '180 days' },
  { value: '365', label: '1 year' },
] as const;

interface ReferralProgramSettingsProps {
  className?: string;
}

export function ReferralProgramSettings({ className }: ReferralProgramSettingsProps) {
  const dispatch = useAppDispatch();

  const [enabled, setEnabled] = useState(false);
  const [referrerRewardType, setReferrerRewardType] = useState<ReferralRewardType>('points');
  const [referrerRewardValue, setReferrerRewardValue] = useState(100);
  const [refereeDiscountType, setRefereeDiscountType] = useState<ReferralDiscountType>('percentage');
  const [refereeDiscountValue, setRefereeDiscountValue] = useState(10);
  const [expirationDays, setExpirationDays] = useState<string>('never');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialSettings, setInitialSettings] = useState<{
    enabled: boolean;
    referrerRewardType: ReferralRewardType;
    referrerRewardValue: number;
    refereeDiscountType: ReferralDiscountType;
    refereeDiscountValue: number;
    expirationDays: string;
  } | null>(null);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const session = storeAuthManager.getState();
        if (!session.store?.storeId) {
          throw new Error('No store session found');
        }

        setIsLoading(true);
        const result = await dispatch(fetchReferralSettings({ storeId: session.store.storeId })).unwrap();

        if (result) {
          const expDays = result.expiresDays === null ? 'never' : String(result.expiresDays);

          setEnabled(result.enabled);
          setReferrerRewardType(result.referrerRewardType);
          setReferrerRewardValue(result.referrerRewardValue);
          setRefereeDiscountType(result.refereeDiscountType);
          setRefereeDiscountValue(result.refereeDiscountValue);
          setExpirationDays(expDays);

          setInitialSettings({
            enabled: result.enabled,
            referrerRewardType: result.referrerRewardType,
            referrerRewardValue: result.referrerRewardValue,
            refereeDiscountType: result.refereeDiscountType,
            refereeDiscountValue: result.refereeDiscountValue,
            expirationDays: expDays,
          });
        } else {
          // Use defaults
          const defaultSettings = {
            enabled: false,
            referrerRewardType: 'points' as ReferralRewardType,
            referrerRewardValue: 100,
            refereeDiscountType: 'percentage' as ReferralDiscountType,
            refereeDiscountValue: 10,
            expirationDays: 'never',
          };

          setEnabled(defaultSettings.enabled);
          setReferrerRewardType(defaultSettings.referrerRewardType);
          setReferrerRewardValue(defaultSettings.referrerRewardValue);
          setRefereeDiscountType(defaultSettings.refereeDiscountType);
          setRefereeDiscountValue(defaultSettings.refereeDiscountValue);
          setExpirationDays(defaultSettings.expirationDays);
          setInitialSettings(defaultSettings);
        }
      } catch (err) {
        console.error('[ReferralProgramSettings] Failed to load:', err);
        toast({
          variant: 'destructive',
          title: 'Load Failed',
          description: 'Could not load referral program settings.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [dispatch]);

  // Track changes
  useEffect(() => {
    if (!initialSettings) {
      setHasChanges(false);
      return;
    }

    const changed =
      enabled !== initialSettings.enabled ||
      referrerRewardType !== initialSettings.referrerRewardType ||
      referrerRewardValue !== initialSettings.referrerRewardValue ||
      refereeDiscountType !== initialSettings.refereeDiscountType ||
      refereeDiscountValue !== initialSettings.refereeDiscountValue ||
      expirationDays !== initialSettings.expirationDays;

    setHasChanges(changed);
  }, [
    initialSettings,
    enabled,
    referrerRewardType,
    referrerRewardValue,
    refereeDiscountType,
    refereeDiscountValue,
    expirationDays,
  ]);

  const handleSave = async () => {
    if (referrerRewardValue <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Referrer reward value must be greater than 0.',
      });
      return;
    }

    if (refereeDiscountValue <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'New client discount value must be greater than 0.',
      });
      return;
    }

    setIsSaving(true);

    try {
      const session = storeAuthManager.getState();
      if (!session.store?.storeId) {
        throw new Error('No store session found');
      }

      const expDays = expirationDays === 'never' ? null : parseInt(expirationDays);

      await dispatch(updateReferralSettings({
        storeId: session.store.storeId,
        enabled,
        expiresDays: expDays,
        referrerRewardType,
        referrerRewardValue,
        refereeDiscountType,
        refereeDiscountValue,
      })).unwrap();

      toast({
        title: 'Settings Saved',
        description: 'Referral program settings have been updated.',
      });

      // Update initial settings to match current state
      setInitialSettings({
        enabled,
        referrerRewardType,
        referrerRewardValue,
        refereeDiscountType,
        refereeDiscountValue,
        expirationDays,
      });
      setHasChanges(false);
    } catch (err) {
      console.error('[ReferralProgramSettings] Failed to save:', err);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not save referral program settings. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (initialSettings) {
      setEnabled(initialSettings.enabled);
      setReferrerRewardType(initialSettings.referrerRewardType);
      setReferrerRewardValue(initialSettings.referrerRewardValue);
      setRefereeDiscountType(initialSettings.refereeDiscountType);
      setRefereeDiscountValue(initialSettings.refereeDiscountValue);
      setExpirationDays(initialSettings.expirationDays);
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5" />
            Referral Program
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="w-5 h-5" />
          Referral Program
        </CardTitle>
        <CardDescription>
          Configure your referral program to reward clients for bringing in new business.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Program */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="program-enabled">Enable Referral Program</Label>
            <p className="text-sm text-muted-foreground">
              Allow clients to refer new customers and earn rewards
            </p>
          </div>
          <Switch
            id="program-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        {/* Referrer Rewards Section */}
        <div className="space-y-4 pt-4 border-t">
          <div className="space-y-1">
            <Label className="text-base">Referrer Reward</Label>
            <p className="text-sm text-muted-foreground">
              Reward for the existing client who refers a new client
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referrer-reward-type">Reward Type</Label>
            <Select
              value={referrerRewardType}
              onValueChange={(value) => setReferrerRewardType(value as ReferralRewardType)}
            >
              <SelectTrigger id="referrer-reward-type" className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REWARD_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referrer-reward-value">
              Reward Value
              {referrerRewardType === 'points' && ' (points)'}
              {referrerRewardType === 'credit' && ' ($)'}
              {referrerRewardType === 'discount' && ' ($)'}
              {referrerRewardType === 'percentage' && ' (%)'}
            </Label>
            <Input
              id="referrer-reward-value"
              type="number"
              min="0"
              step={referrerRewardType === 'percentage' ? '1' : '0.01'}
              value={referrerRewardValue}
              onChange={(e) => setReferrerRewardValue(parseFloat(e.target.value) || 0)}
              className="w-full max-w-xs"
            />
            <p className="text-xs text-muted-foreground">
              {referrerRewardType === 'points' && 'Number of loyalty points to award'}
              {referrerRewardType === 'credit' && 'Dollar amount added to account credit'}
              {referrerRewardType === 'discount' && 'Fixed dollar amount off next visit'}
              {referrerRewardType === 'percentage' && 'Percentage discount on next visit'}
            </p>
          </div>
        </div>

        {/* New Client Discount Section */}
        <div className="space-y-4 pt-4 border-t">
          <div className="space-y-1">
            <Label className="text-base">New Client Discount</Label>
            <p className="text-sm text-muted-foreground">
              Discount for the new client being referred
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referee-discount-type">Discount Type</Label>
            <Select
              value={refereeDiscountType}
              onValueChange={(value) => setRefereeDiscountType(value as ReferralDiscountType)}
            >
              <SelectTrigger id="referee-discount-type" className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DISCOUNT_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referee-discount-value">
              Discount Value
              {refereeDiscountType === 'percentage' && ' (%)'}
              {refereeDiscountType === 'fixed' && ' ($)'}
            </Label>
            <Input
              id="referee-discount-value"
              type="number"
              min="0"
              step={refereeDiscountType === 'percentage' ? '1' : '0.01'}
              value={refereeDiscountValue}
              onChange={(e) => setRefereeDiscountValue(parseFloat(e.target.value) || 0)}
              className="w-full max-w-xs"
            />
            <p className="text-xs text-muted-foreground">
              {refereeDiscountType === 'percentage' && 'Percentage off first visit'}
              {refereeDiscountType === 'fixed' && 'Fixed dollar amount off first visit'}
            </p>
          </div>
        </div>

        {/* Expiration Settings */}
        <div className="space-y-2 pt-4 border-t">
          <Label htmlFor="expiration-days">Referral Code Expiration</Label>
          <Select value={expirationDays} onValueChange={setExpirationDays}>
            <SelectTrigger id="expiration-days" className="w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXPIRATION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            How long referral codes remain valid after being used
          </p>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving || isLoading}
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
      </CardContent>
    </Card>
  );
}
