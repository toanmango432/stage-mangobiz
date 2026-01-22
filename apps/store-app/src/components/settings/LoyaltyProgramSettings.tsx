/**
 * Loyalty Program Settings Component
 * Allows store owners to configure the loyalty program
 */

import { useState, useEffect } from 'react';
import { Award, Save, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
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
  fetchLoyaltyProgram,
  updateLoyaltyProgram,
  selectLoyaltyProgram,
  selectProgramLoading,
  selectProgramError,
} from '@/store/slices/loyaltySlice';
import { storeAuthManager } from '@/services/storeAuthManager';
import type { LoyaltyProgram } from '@/types/client';
import { supabase } from '@/services/supabase/client';

const EXPIRATION_OPTIONS = [
  { value: 'never', label: 'Never Expire' },
  { value: '6', label: '6 Months' },
  { value: '12', label: '12 Months' },
  { value: '24', label: '24 Months' },
] as const;

const CATEGORY_OPTIONS = [
  { value: 'services', label: 'Services' },
  { value: 'products', label: 'Products' },
  { value: 'gift_cards', label: 'Gift Cards' },
] as const;

interface LoyaltyProgramSettingsProps {
  className?: string;
}

export function LoyaltyProgramSettings({ className }: LoyaltyProgramSettingsProps) {
  const dispatch = useAppDispatch();
  const program = useAppSelector(selectLoyaltyProgram);
  const loading = useAppSelector(selectProgramLoading);
  const error = useAppSelector(selectProgramError);

  const [pointsPerDollar, setPointsPerDollar] = useState(1);
  const [eligibleCategories, setEligibleCategories] = useState<string[]>(['services', 'products']);
  const [includeTax, setIncludeTax] = useState(false);
  const [expirationValue, setExpirationValue] = useState('never');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load program on mount
  useEffect(() => {
    const session = storeAuthManager.getState();
    if (session.store?.storeId) {
      dispatch(fetchLoyaltyProgram(session.store.storeId));
    }
  }, [dispatch]);

  // Populate form when program loads
  useEffect(() => {
    if (program) {
      setPointsPerDollar(program.pointsPerDollar);
      setEligibleCategories(program.eligibleCategories);
      setIncludeTax(program.includeTax);
      setIsActive(program.isActive);

      // Convert expiration months to dropdown value
      if (!program.pointsExpirationMonths) {
        setExpirationValue('never');
      } else {
        setExpirationValue(String(program.pointsExpirationMonths));
      }
    }
  }, [program]);

  // Track changes
  useEffect(() => {
    if (!program) {
      setHasChanges(false);
      return;
    }

    const expirationMonths = expirationValue === 'never' ? null : Number(expirationValue);
    const changed =
      pointsPerDollar !== program.pointsPerDollar ||
      JSON.stringify(eligibleCategories.sort()) !== JSON.stringify(program.eligibleCategories.sort()) ||
      includeTax !== program.includeTax ||
      expirationMonths !== program.pointsExpirationMonths ||
      isActive !== program.isActive;

    setHasChanges(changed);
  }, [program, pointsPerDollar, eligibleCategories, includeTax, expirationValue, isActive]);

  const handleCategoryToggle = (category: string) => {
    setEligibleCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleSave = async () => {
    if (pointsPerDollar <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Points per dollar must be greater than 0.',
      });
      return;
    }

    if (eligibleCategories.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'At least one category must be selected.',
      });
      return;
    }

    setIsSaving(true);

    try {
      const session = storeAuthManager.getState();
      if (!session.store?.storeId) {
        throw new Error('No store session found');
      }

      const expirationMonths = expirationValue === 'never' ? null : Number(expirationValue);

      // If program exists, update it
      if (program) {
        const updates: Partial<LoyaltyProgram> = {
          pointsPerDollar,
          eligibleCategories,
          includeTax,
          pointsExpirationMonths: expirationMonths,
          isActive,
        };

        await dispatch(updateLoyaltyProgram({ id: program.id, updates })).unwrap();

        toast({
          title: 'Settings Saved',
          description: 'Loyalty program settings have been updated.',
        });
      } else {
        // Create new program if none exists
        const { data, error: createError } = await supabase
          .from('loyalty_programs')
          .insert({
            store_id: session.store.storeId,
            name: 'Loyalty Program',
            points_per_dollar: pointsPerDollar,
            eligible_categories: eligibleCategories,
            include_tax: includeTax,
            points_expiration_months: expirationMonths,
            is_active: isActive,
          })
          .select()
          .single();

        if (createError) throw createError;

        // Refresh program
        await dispatch(fetchLoyaltyProgram(session.store.storeId));

        toast({
          title: 'Program Created',
          description: 'Loyalty program has been created.',
        });
      }

      setHasChanges(false);
    } catch (err) {
      console.error('[LoyaltyProgramSettings] Failed to save:', err);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not save loyalty program settings. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (program) {
      setPointsPerDollar(program.pointsPerDollar);
      setEligibleCategories(program.eligibleCategories);
      setIncludeTax(program.includeTax);
      setIsActive(program.isActive);

      if (!program.pointsExpirationMonths) {
        setExpirationValue('never');
      } else {
        setExpirationValue(String(program.pointsExpirationMonths));
      }
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Award className="w-5 h-5" />
          Loyalty Program Settings
        </CardTitle>
        <CardDescription>
          Configure how customers earn and redeem loyalty points.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="program-enabled">Enable Loyalty Program</Label>
            <p className="text-sm text-muted-foreground">
              Turn the loyalty program on or off for your store
            </p>
          </div>
          <Switch
            id="program-enabled"
            checked={isActive}
            onCheckedChange={setIsActive}
          />
        </div>

        {/* Points Per Dollar */}
        <div className="space-y-2">
          <Label htmlFor="points-per-dollar">Points Per Dollar Spent</Label>
          <Input
            id="points-per-dollar"
            type="number"
            min="0.1"
            step="0.1"
            value={pointsPerDollar}
            onChange={(e) => setPointsPerDollar(parseFloat(e.target.value) || 0)}
            className="w-full max-w-xs"
          />
          <p className="text-xs text-muted-foreground">
            Example: 1 point per dollar means a $100 purchase earns 100 points
          </p>
        </div>

        {/* Eligible Categories */}
        <div className="space-y-2">
          <Label>Eligible Purchase Categories</Label>
          <div className="space-y-3">
            {CATEGORY_OPTIONS.map((category) => (
              <div key={category.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category.value}`}
                  checked={eligibleCategories.includes(category.value)}
                  onCheckedChange={() => handleCategoryToggle(category.value)}
                />
                <label
                  htmlFor={`category-${category.value}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {category.label}
                </label>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Select which types of purchases earn loyalty points
          </p>
        </div>

        {/* Include Tax Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="include-tax">Include Tax in Points Calculation</Label>
            <p className="text-sm text-muted-foreground">
              Calculate points on pre-tax or post-tax amount
            </p>
          </div>
          <Switch
            id="include-tax"
            checked={includeTax}
            onCheckedChange={setIncludeTax}
          />
        </div>

        {/* Points Expiration */}
        <div className="space-y-2">
          <Label htmlFor="expiration-select">Points Expiration</Label>
          <Select value={expirationValue} onValueChange={setExpirationValue}>
            <SelectTrigger id="expiration-select" className="w-full max-w-xs">
              <SelectValue placeholder="Select expiration..." />
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
            Points will expire after the selected period of inactivity
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
