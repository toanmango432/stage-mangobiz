/**
 * Organization Client Sharing Settings Component
 *
 * Allows organization admins to configure client data sharing
 * between multiple locations in the same organization (Tier 2).
 *
 * Sharing modes:
 * - Full: All client data shared across all org locations
 * - Selective: Configurable categories of data shared
 * - Isolated: Only safety data shared (always on)
 *
 * @see docs/architecture/MULTI_STORE_CLIENT_SPEC.md
 */

import { useState, useEffect } from 'react';
import { Building2, Save, Check, Shield, AlertTriangle, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { toast } from '@/hooks/use-toast';
import { useAppSelector } from '@/store/hooks';
import { supabase } from '@/services/supabase/client';
import { storeAuthManager } from '@/services/storeAuthManager';

/**
 * Sharing mode options
 */
const SHARING_MODE_OPTIONS = [
  {
    value: 'full',
    label: 'Full Sharing',
    description: 'All client data shared across all organization locations',
  },
  {
    value: 'selective',
    label: 'Selective Sharing',
    description: 'Choose which categories of data to share',
  },
  {
    value: 'isolated',
    label: 'Isolated (Safety Only)',
    description: 'Only critical safety data shared between locations',
  },
] as const;

/**
 * Data categories that can be shared
 */
const DATA_CATEGORIES = [
  {
    key: 'profiles',
    label: 'Basic Profile',
    description: 'Name, phone, email, birthdate',
    alwaysOn: false,
  },
  {
    key: 'safetyData',
    label: 'Safety Data',
    description: 'Allergies, blocks, staff alerts',
    alwaysOn: true, // Safety data always shared
  },
  {
    key: 'visitHistory',
    label: 'Visit History',
    description: 'Past appointments and services',
    alwaysOn: false,
  },
  {
    key: 'staffNotes',
    label: 'Staff Notes',
    description: 'Internal notes about the client',
    alwaysOn: false,
  },
  {
    key: 'loyaltyData',
    label: 'Loyalty Points',
    description: 'Points balance, tier status, history',
    alwaysOn: false,
  },
  {
    key: 'walletData',
    label: 'Wallet & Credits',
    description: 'Gift cards, store credits, packages',
    alwaysOn: false,
  },
] as const;

/**
 * Scope options for loyalty/gift cards/memberships
 */
const SCOPE_OPTIONS = [
  { value: 'location', label: 'Per Location', description: 'Each location has its own balance' },
  { value: 'organization', label: 'Organization-Wide', description: 'Balance shared across all locations' },
] as const;

/**
 * Client sharing settings type (matches database JSONB)
 */
interface ClientSharingSettings {
  sharingMode: 'full' | 'selective' | 'isolated';
  sharedCategories: {
    profiles: boolean;
    safetyData: boolean;
    visitHistory: boolean;
    staffNotes: boolean;
    loyaltyData: boolean;
    walletData: boolean;
  };
  loyaltyScope: 'location' | 'organization';
  giftCardScope: 'location' | 'organization';
  membershipScope: 'location' | 'organization';
  allowCrossLocationBooking: boolean;
}

/**
 * Default settings
 */
const DEFAULT_SETTINGS: ClientSharingSettings = {
  sharingMode: 'isolated',
  sharedCategories: {
    profiles: false,
    safetyData: true,
    visitHistory: false,
    staffNotes: false,
    loyaltyData: false,
    walletData: false,
  },
  loyaltyScope: 'location',
  giftCardScope: 'location',
  membershipScope: 'location',
  allowCrossLocationBooking: false,
};

interface OrganizationClientSharingProps {
  className?: string;
}

export function OrganizationClientSharing({ className }: OrganizationClientSharingProps) {
  // Auth state
  const memberRole = useAppSelector((state) => state.auth.member?.role);
  const storeId = useAppSelector((state) => state.auth.store?.storeId);

  // Local state
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [locationCount, setLocationCount] = useState(0);
  const [settings, setSettings] = useState<ClientSharingSettings>(DEFAULT_SETTINGS);
  const [originalSettings, setOriginalSettings] = useState<ClientSharingSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Check if user has admin permissions
  const isOrgAdmin = memberRole === 'owner' || memberRole === 'admin';

  // Load organization data on mount
  useEffect(() => {
    async function loadOrganization() {
      if (!storeId) {
        setLoading(false);
        return;
      }

      try {
        setError(null);

        // Get store's organization
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('organization_id')
          .eq('id', storeId)
          .single();

        if (storeError) throw storeError;

        if (!storeData?.organization_id) {
          // Store is not part of an organization
          setOrganizationId(null);
          setLoading(false);
          return;
        }

        setOrganizationId(storeData.organization_id);

        // Get organization details and sharing settings
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('id, name, client_sharing_settings')
          .eq('id', storeData.organization_id)
          .single();

        if (orgError) throw orgError;

        setOrganizationName(orgData.name);

        // Parse settings (merge with defaults for any missing fields)
        const dbSettings = orgData.client_sharing_settings as Partial<ClientSharingSettings> || {};
        const mergedSettings: ClientSharingSettings = {
          ...DEFAULT_SETTINGS,
          ...dbSettings,
          sharedCategories: {
            ...DEFAULT_SETTINGS.sharedCategories,
            ...(dbSettings.sharedCategories || {}),
            safetyData: true, // Always enforce safety data sharing
          },
        };

        setSettings(mergedSettings);
        setOriginalSettings(mergedSettings);

        // Count locations in organization
        const { count, error: countError } = await supabase
          .from('stores')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', storeData.organization_id);

        if (!countError && count !== null) {
          setLocationCount(count);
        }
      } catch (err) {
        console.error('[OrganizationClientSharing] Load error:', err);
        setError('Failed to load organization settings');
      } finally {
        setLoading(false);
      }
    }

    loadOrganization();
  }, [storeId]);

  // Track changes
  useEffect(() => {
    const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(changed);
  }, [settings, originalSettings]);

  // Handle sharing mode change
  const handleSharingModeChange = (mode: string) => {
    const newMode = mode as ClientSharingSettings['sharingMode'];
    setSettings((prev) => {
      let newCategories = { ...prev.sharedCategories };

      if (newMode === 'full') {
        // Full mode: enable all categories
        newCategories = {
          profiles: true,
          safetyData: true,
          visitHistory: true,
          staffNotes: true,
          loyaltyData: true,
          walletData: true,
        };
      } else if (newMode === 'isolated') {
        // Isolated mode: only safety data
        newCategories = {
          profiles: false,
          safetyData: true,
          visitHistory: false,
          staffNotes: false,
          loyaltyData: false,
          walletData: false,
        };
      }
      // Selective mode: keep current category settings

      return {
        ...prev,
        sharingMode: newMode,
        sharedCategories: newCategories,
      };
    });
  };

  // Handle category toggle
  const handleCategoryToggle = (key: string, enabled: boolean) => {
    setSettings((prev) => ({
      ...prev,
      sharedCategories: {
        ...prev.sharedCategories,
        [key]: enabled,
      },
    }));
  };

  // Handle scope change
  const handleScopeChange = (scopeKey: 'loyaltyScope' | 'giftCardScope' | 'membershipScope', value: string) => {
    setSettings((prev) => ({
      ...prev,
      [scopeKey]: value as 'location' | 'organization',
    }));
  };

  // Handle cross-location booking toggle
  const handleCrossLocationBookingToggle = (enabled: boolean) => {
    setSettings((prev) => ({
      ...prev,
      allowCrossLocationBooking: enabled,
    }));
  };

  // Save settings
  const handleSave = async () => {
    if (!organizationId || !isOrgAdmin) return;

    setSaving(true);
    setError(null);

    try {
      // Ensure safety data is always enabled
      const settingsToSave = {
        ...settings,
        sharedCategories: {
          ...settings.sharedCategories,
          safetyData: true,
        },
      };

      const { error: updateError } = await supabase
        .from('organizations')
        .update({ client_sharing_settings: settingsToSave })
        .eq('id', organizationId);

      if (updateError) throw updateError;

      setOriginalSettings(settingsToSave);
      setHasChanges(false);

      toast({
        title: 'Settings Saved',
        description: 'Client sharing settings have been updated.',
      });
    } catch (err) {
      console.error('[OrganizationClientSharing] Save error:', err);
      setError('Failed to save settings. Please try again.');
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not save client sharing settings.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Cancel changes
  const handleCancel = () => {
    setSettings(originalSettings);
    setHasChanges(false);
  };

  // Loading state
  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="py-10">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // No organization state
  if (!organizationId) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5" />
            Multi-Location Client Sharing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted">
            <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Not Part of an Organization</p>
              <p className="text-sm text-muted-foreground mt-1">
                This store is not part of a multi-location organization.
                Contact support to set up organization-level features.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Not admin state
  if (!isOrgAdmin) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5" />
            Multi-Location Client Sharing
          </CardTitle>
          <CardDescription>
            {organizationName} ({locationCount} location{locationCount !== 1 ? 's' : ''})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Admin Access Required
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Only organization owners and admins can modify client sharing settings.
              </p>
            </div>
          </div>

          {/* Show current mode (read-only) */}
          <div className="mt-4 p-4 rounded-lg border">
            <p className="text-sm font-medium">Current Sharing Mode</p>
            <p className="text-sm text-muted-foreground capitalize mt-1">
              {settings.sharingMode === 'full' && 'Full Sharing - All client data shared'}
              {settings.sharingMode === 'selective' && 'Selective Sharing - Some data categories shared'}
              {settings.sharingMode === 'isolated' && 'Isolated - Only safety data shared'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="w-5 h-5" />
          Multi-Location Client Sharing
        </CardTitle>
        <CardDescription>
          Configure how client data is shared between {organizationName} locations
          ({locationCount} location{locationCount !== 1 ? 's' : ''})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sharing Mode */}
        <div className="space-y-2">
          <Label htmlFor="sharing-mode">Sharing Mode</Label>
          <Select value={settings.sharingMode} onValueChange={handleSharingModeChange}>
            <SelectTrigger id="sharing-mode" className="w-full max-w-md">
              <SelectValue placeholder="Select sharing mode..." />
            </SelectTrigger>
            <SelectContent>
              {SHARING_MODE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div>
                    <span>{option.label}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      - {option.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Safety Data Notice */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/30">
          <Shield className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              Safety Data Always Shared
            </p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              For client safety, allergies, blocks, and staff alerts are always
              synchronized across all organization locations regardless of sharing mode.
            </p>
          </div>
        </div>

        {/* Data Categories (only show for selective mode) */}
        {settings.sharingMode === 'selective' && (
          <div className="space-y-4">
            <div>
              <Label className="text-base">Shared Data Categories</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Select which types of client data to share across locations
              </p>
            </div>

            <div className="space-y-3 pl-1">
              {DATA_CATEGORIES.map((category) => (
                <div key={category.key} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor={`category-${category.key}`}
                      className={category.alwaysOn ? 'text-muted-foreground' : ''}
                    >
                      {category.label}
                      {category.alwaysOn && (
                        <span className="ml-2 text-xs text-green-600">(Required)</span>
                      )}
                    </Label>
                    <p className="text-xs text-muted-foreground">{category.description}</p>
                  </div>
                  <Switch
                    id={`category-${category.key}`}
                    checked={settings.sharedCategories[category.key as keyof typeof settings.sharedCategories]}
                    onCheckedChange={(checked) => handleCategoryToggle(category.key, checked)}
                    disabled={category.alwaysOn}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loyalty/Wallet Scope Settings (only for full or selective with those enabled) */}
        {(settings.sharingMode === 'full' ||
          (settings.sharingMode === 'selective' && settings.sharedCategories.loyaltyData)) && (
          <div className="space-y-4 pt-4 border-t">
            <div>
              <Label className="text-base">Loyalty Points Scope</Label>
              <p className="text-sm text-muted-foreground mt-1">
                How loyalty points are tracked across locations
              </p>
            </div>

            <Select
              value={settings.loyaltyScope}
              onValueChange={(value) => handleScopeChange('loyaltyScope', value)}
            >
              <SelectTrigger className="w-full max-w-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCOPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <span>{option.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        - {option.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {(settings.sharingMode === 'full' ||
          (settings.sharingMode === 'selective' && settings.sharedCategories.walletData)) && (
          <div className="space-y-4">
            <div>
              <Label className="text-base">Gift Card Scope</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Whether gift cards can be used at any location
              </p>
            </div>

            <Select
              value={settings.giftCardScope}
              onValueChange={(value) => handleScopeChange('giftCardScope', value)}
            >
              <SelectTrigger className="w-full max-w-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCOPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <span>{option.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        - {option.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Cross-Location Booking */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="space-y-0.5">
            <Label htmlFor="cross-location-booking">Allow Cross-Location Booking</Label>
            <p className="text-sm text-muted-foreground">
              Let clients book appointments at any organization location
            </p>
          </div>
          <Switch
            id="cross-location-booking"
            checked={settings.allowCrossLocationBooking}
            onCheckedChange={handleCrossLocationBookingToggle}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Save/Cancel Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="gap-2"
          >
            {saving ? (
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
              disabled={saving}
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
