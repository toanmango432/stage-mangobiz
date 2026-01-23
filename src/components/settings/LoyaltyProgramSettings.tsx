/**
 * Loyalty Program Settings Component
 * Allows owners to configure the loyalty program
 */

import { useState, useEffect } from 'react';
import { Gift, Save, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchLoyaltyProgram,
  updateLoyaltyProgram,
  selectLoyaltyProgram,
  selectProgramLoading,
} from '@/store/slices/loyaltySlice';
import { storeAuthManager } from '@/services/storeAuthManager';
import type { LoyaltyProgram } from '@/types/client';

interface LoyaltyProgramSettingsProps {
  className?: string;
}

// Expiration options in months
const EXPIRATION_OPTIONS = [
  { value: 'never', label: 'Never' },
  { value: '6', label: '6 months' },
  { value: '12', label: '12 months' },
  { value: '24', label: '24 months' },
] as const;

export function LoyaltyProgramSettings({ className }: LoyaltyProgramSettingsProps) {
  const dispatch = useAppDispatch();
  const program = useAppSelector(selectLoyaltyProgram);
  const loading = useAppSelector(selectProgramLoading);

  const [formData, setFormData] = useState({
    pointsPerDollar: 1,
    eligibleServices: true,
    eligibleProducts: true,
    eligibleGiftCards: false,
    includeTax: false,
    pointsExpiration: 'never' as 'never' | '6' | '12' | '24',
    isActive: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load program on mount
  useEffect(() => {
    const session = storeAuthManager.getState();
    if (session.store?.storeId) {
      dispatch(fetchLoyaltyProgram(session.store.storeId));
    }
  }, [dispatch]);

  // Update form when program loads
  useEffect(() => {
    if (program) {
      setFormData({
        pointsPerDollar: program.pointsPerDollar,
        eligibleServices: program.eligibleCategories.services,
        eligibleProducts: program.eligibleCategories.products,
        eligibleGiftCards: program.eligibleCategories.giftCards,
        includeTax: program.includeTax,
        pointsExpiration: program.pointsExpirationMonths === null 
          ? 'never' 
          : String(program.pointsExpirationMonths) as '6' | '12' | '24',
        isActive: program.isActive,
      });
    }
  }, [program]);

  // Track changes
  useEffect(() => {
    if (!program) return;
    
    const changed = 
      formData.pointsPerDollar !== program.pointsPerDollar ||
      formData.eligibleServices !== program.eligibleCategories.services ||
      formData.eligibleProducts !== program.eligibleCategories.products ||
      formData.eligibleGiftCards !== program.eligibleCategories.giftCards ||
      formData.includeTax !== program.includeTax ||
      formData.isActive !== program.isActive ||
      (formData.pointsExpiration === 'never' && program.pointsExpirationMonths !== null) ||
      (formData.pointsExpiration !== 'never' && Number(formData.pointsExpiration) !== program.pointsExpirationMonths);

    setHasChanges(changed);
  }, [formData, program]);

  const handleSave = async () => {
    if (!program) {
      toast({
        variant: 'destructive',
        title: 'No Program Found',
        description: 'Please create a loyalty program first.',
      });
      return;
    }

    // Validation
    if (formData.pointsPerDollar <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Points',
        description: 'Points per dollar must be greater than 0.',
      });
      return;
    }

    if (!formData.eligibleServices && !formData.eligibleProducts && !formData.eligibleGiftCards) {
      toast({
        variant: 'destructive',
        title: 'No Categories Selected',
        description: 'At least one category must be eligible for points.',
      });
      return;
    }

    setIsSaving(true);

    try {
      const updates: Partial<LoyaltyProgram> = {
        pointsPerDollar: formData.pointsPerDollar,
        eligibleCategories: {
          services: formData.eligibleServices,
          products: formData.eligibleProducts,
          giftCards: formData.eligibleGiftCards,
        },
        includeTax: formData.includeTax,
        pointsExpirationMonths: formData.pointsExpiration === 'never' 
          ? null 
          : Number(formData.pointsExpiration),
        isActive: formData.isActive,
      };

      await dispatch(updateLoyaltyProgram({ id: program.id, updates })).unwrap();

      setHasChanges(false);

      toast({
        title: 'Settings Saved',
        description: 'Loyalty program settings have been updated.',
      });
    } catch (error) {
      console.error('[LoyaltyProgramSettings] Failed to save:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not save settings. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (program) {
      setFormData({
        pointsPerDollar: program.pointsPerDollar,
        eligibleServices: program.eligibleCategories.services,
        eligibleProducts: program.eligibleCategories.products,
        eligibleGiftCards: program.eligibleCategories.giftCards,
        includeTax: program.includeTax,
        pointsExpiration: program.pointsExpirationMonths === null 
          ? 'never' 
          : String(program.pointsExpirationMonths) as '6' | '12' | '24',
        isActive: program.isActive,
      });
    }
  };

  if (loading && !program) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading loyalty program...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gift className="w-5 h-5" />
          Loyalty Program Settings
        </CardTitle>
        <CardDescription>
          Configure how customers earn and redeem loyalty points
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Program */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable Loyalty Program</Label>
            <p className="text-xs text-muted-foreground">
              Turn the loyalty program on or off
            </p>
          </div>
          <Switch
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
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
            value={formData.pointsPerDollar}
            onChange={(e) => setFormData({ ...formData, pointsPerDollar: parseFloat(e.target.value) || 0 })}
            className="w-full max-w-xs"
          />
          <p className="text-xs text-muted-foreground">
            How many points customers earn per dollar spent
          </p>
        </div>

        {/* Eligible Categories */}
        <div className="space-y-3">
          <Label>Eligible Categories</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Select which purchases earn loyalty points
          </p>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="eligible-services"
                checked={formData.eligibleServices}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, eligibleServices: Boolean(checked) })
                }
              />
              <Label htmlFor="eligible-services" className="font-normal cursor-pointer">
                Services
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="eligible-products"
                checked={formData.eligibleProducts}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, eligibleProducts: Boolean(checked) })
                }
              />
              <Label htmlFor="eligible-products" className="font-normal cursor-pointer">
                Products
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="eligible-gift-cards"
                checked={formData.eligibleGiftCards}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, eligibleGiftCards: Boolean(checked) })
                }
              />
              <Label htmlFor="eligible-gift-cards" className="font-normal cursor-pointer">
                Gift Cards
              </Label>
            </div>
          </div>
        </div>

        {/* Include Tax */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Include Tax in Points Calculation</Label>
            <p className="text-xs text-muted-foreground">
              Calculate points based on total including tax
            </p>
          </div>
          <Switch
            checked={formData.includeTax}
            onCheckedChange={(checked) => setFormData({ ...formData, includeTax: checked })}
          />
        </div>

        {/* Points Expiration */}
        <div className="space-y-2">
          <Label htmlFor="points-expiration">Points Expiration</Label>
          <Select
            value={formData.pointsExpiration}
            onValueChange={(value) => 
              setFormData({ ...formData, pointsExpiration: value as typeof formData.pointsExpiration })
            }
          >
            <SelectTrigger id="points-expiration" className="w-full max-w-xs">
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
            How long points remain valid after earning
          </p>
        </div>

        {/* Save/Cancel Buttons */}
        <div className="flex items-center gap-3 pt-4">
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
              onClick={handleReset}
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
