/**
 * Loyalty Reward Configuration Component
 * Allows store owners to create and manage loyalty rewards
 */

import { useState, useEffect } from 'react';
import { Gift, Plus, Trash2, Save, X, Edit } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchLoyaltyProgram,
  fetchLoyaltyRewards,
  createLoyaltyReward,
  updateLoyaltyReward,
  deleteLoyaltyReward,
  selectLoyaltyProgram,
  selectLoyaltyRewards,
  selectRewardsLoading,
  selectRewardsError,
} from '@/store/slices/loyaltySlice';
import { storeAuthManager } from '@/services/storeAuthManager';
import type { LoyaltyRewardConfig as LoyaltyRewardType, RewardType } from '@/types/client';

interface RewardFormData {
  name: string;
  description: string;
  pointsRequired: number;
  rewardType: RewardType;
  rewardValue: number;
  expiresDays: number | null;
}

interface RewardCardProps {
  reward: LoyaltyRewardType;
  onEdit: (reward: LoyaltyRewardType) => void;
  onDelete: (reward: LoyaltyRewardType) => void;
}

// Individual reward card component
function RewardCard({ reward, onEdit, onDelete }: RewardCardProps) {
  const getRewardTypeLabel = (type: RewardType): string => {
    const labels: Record<RewardType, string> = {
      discount: 'Fixed Discount',
      percentage: 'Percentage Off',
      free_service: 'Free Service',
      free_product: 'Free Product',
    };
    return labels[type];
  };

  const getRewardValueDisplay = (type: RewardType, value: number): string => {
    if (type === 'discount') return `$${value} off`;
    if (type === 'percentage') return `${value}% off`;
    if (type === 'free_service') return 'Free service';
    if (type === 'free_product') return 'Free product';
    return '';
  };

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          {/* Reward header */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-gray-900">{reward.name}</h4>
              <p className="text-sm text-gray-500">
                {reward.pointsRequired.toLocaleString()} points
              </p>
            </div>
          </div>

          {/* Description */}
          {reward.description && (
            <p className="text-sm text-gray-600 ml-13">{reward.description}</p>
          )}

          {/* Reward details */}
          <div className="flex flex-wrap gap-2 ml-13">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800">
              {getRewardTypeLabel(reward.rewardType)}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-800">
              {getRewardValueDisplay(reward.rewardType, reward.rewardValue)}
            </span>
            {reward.expiresDays && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800">
                Expires in {reward.expiresDays} days
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 ml-4">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(reward)}
            className="text-gray-600 hover:text-gray-900"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(reward)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface LoyaltyRewardConfigProps {
  className?: string;
}

export function LoyaltyRewardConfig({ className }: LoyaltyRewardConfigProps) {
  const dispatch = useAppDispatch();
  const program = useAppSelector(selectLoyaltyProgram);
  const rewards = useAppSelector(selectLoyaltyRewards);
  const loading = useAppSelector(selectRewardsLoading);
  const error = useAppSelector(selectRewardsError);

  const [isEditing, setIsEditing] = useState(false);
  const [editingReward, setEditingReward] = useState<LoyaltyRewardType | null>(null);
  const [formData, setFormData] = useState<RewardFormData>({
    name: '',
    description: '',
    pointsRequired: 0,
    rewardType: 'discount',
    rewardValue: 0,
    expiresDays: null,
  });

  // Load program and rewards on mount
  useEffect(() => {
    const session = storeAuthManager.getState();
    if (session.store?.storeId) {
      dispatch(fetchLoyaltyProgram(session.store.storeId));
      if (program?.id) {
        dispatch(fetchLoyaltyRewards(program.id));
      }
    }
  }, [dispatch, program?.id]);

  const handleAddNew = () => {
    setIsEditing(true);
    setEditingReward(null);
    setFormData({
      name: '',
      description: '',
      pointsRequired: 0,
      rewardType: 'discount',
      rewardValue: 0,
      expiresDays: null,
    });
  };

  const handleEdit = (reward: LoyaltyRewardType) => {
    setIsEditing(true);
    setEditingReward(reward);
    setFormData({
      name: reward.name,
      description: reward.description || '',
      pointsRequired: reward.pointsRequired,
      rewardType: reward.rewardType,
      rewardValue: reward.rewardValue,
      expiresDays: reward.expiresDays || null,
    });
  };

  const handleDelete = async (reward: LoyaltyRewardType) => {
    if (!confirm(`Are you sure you want to delete the "${reward.name}" reward?`)) {
      return;
    }

    try {
      await dispatch(deleteLoyaltyReward(reward.id)).unwrap();
      toast({
        title: 'Reward Deleted',
        description: `${reward.name} has been removed.`,
      });
    } catch (err) {
      console.error('[LoyaltyRewardConfig] Failed to delete reward:', err);
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: 'Could not delete reward. Please try again.',
      });
    }
  };

  const handleSaveReward = async () => {
    if (!program) {
      toast({
        variant: 'destructive',
        title: 'No Program',
        description: 'Please create a loyalty program first.',
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Reward name is required.',
      });
      return;
    }

    if (formData.pointsRequired <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Points required must be greater than 0.',
      });
      return;
    }

    if (formData.rewardValue <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Reward value must be greater than 0.',
      });
      return;
    }

    try {
      if (editingReward) {
        // Update existing reward
        await dispatch(updateLoyaltyReward({
          id: editingReward.id,
          updates: {
            name: formData.name,
            description: formData.description || undefined,
            pointsRequired: formData.pointsRequired,
            rewardType: formData.rewardType,
            rewardValue: formData.rewardValue,
            expiresDays: formData.expiresDays || undefined,
          },
        })).unwrap();

        toast({
          title: 'Reward Updated',
          description: `${formData.name} has been updated.`,
        });
      } else {
        // Create new reward
        await dispatch(createLoyaltyReward({
          programId: program.id,
          name: formData.name,
          description: formData.description || undefined,
          pointsRequired: formData.pointsRequired,
          rewardType: formData.rewardType,
          rewardValue: formData.rewardValue,
          eligibleItems: [], // Can be enhanced later to select specific items
          expiresDays: formData.expiresDays || undefined,
          isActive: true,
        })).unwrap();

        toast({
          title: 'Reward Created',
          description: `${formData.name} has been added.`,
        });
      }

      setIsEditing(false);
      setEditingReward(null);
      setFormData({
        name: '',
        description: '',
        pointsRequired: 0,
        rewardType: 'discount',
        rewardValue: 0,
        expiresDays: null,
      });
    } catch (err) {
      console.error('[LoyaltyRewardConfig] Failed to save reward:', err);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not save reward. Please try again.',
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingReward(null);
    setFormData({
      name: '',
      description: '',
      pointsRequired: 0,
      rewardType: 'discount',
      rewardValue: 0,
      expiresDays: null,
    });
  };

  if (!program) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gift className="w-5 h-5" />
            Loyalty Rewards
          </CardTitle>
          <CardDescription>
            Please create a loyalty program first to configure rewards.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gift className="w-5 h-5" />
              Loyalty Rewards
            </CardTitle>
            <CardDescription>
              Create and manage rewards that customers can redeem with their points.
            </CardDescription>
          </div>
          {!isEditing && (
            <Button onClick={handleAddNew} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Reward
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Reward List */}
        {!isEditing && rewards.length > 0 && (
          <div className="space-y-3">
            {rewards.map((reward) => (
              <RewardCard
                key={reward.id}
                reward={reward}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isEditing && rewards.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
            <Gift className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 mb-4">No rewards configured yet</p>
            <Button onClick={handleAddNew} className="gap-2">
              <Plus className="w-4 h-4" />
              Create First Reward
            </Button>
          </div>
        )}

        {/* Edit/Create Form */}
        {isEditing && (
          <div className="border border-gray-200 rounded-lg p-6 space-y-4 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingReward ? 'Edit Reward' : 'Create New Reward'}
            </h3>

            {/* Reward Name */}
            <div className="space-y-2">
              <Label htmlFor="reward-name">Reward Name</Label>
              <Input
                id="reward-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., $10 Off Next Visit, Free Haircut"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="reward-description">Description (Optional)</Label>
              <Textarea
                id="reward-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional details about this reward..."
                rows={2}
              />
            </div>

            {/* Points Required */}
            <div className="space-y-2">
              <Label htmlFor="points-required">Points Required</Label>
              <Input
                id="points-required"
                type="number"
                min="1"
                step="10"
                value={formData.pointsRequired}
                onChange={(e) => setFormData({ ...formData, pointsRequired: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-gray-500">
                Customers must have at least this many points to redeem
              </p>
            </div>

            {/* Reward Type */}
            <div className="space-y-2">
              <Label htmlFor="reward-type">Reward Type</Label>
              <Select
                value={formData.rewardType}
                onValueChange={(value: RewardType) => setFormData({ ...formData, rewardType: value })}
              >
                <SelectTrigger id="reward-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discount">Fixed Discount ($X off)</SelectItem>
                  <SelectItem value="percentage">Percentage (X% off)</SelectItem>
                  <SelectItem value="free_service">Free Service</SelectItem>
                  <SelectItem value="free_product">Free Product</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reward Value */}
            <div className="space-y-2">
              <Label htmlFor="reward-value">
                {formData.rewardType === 'discount' && 'Discount Amount ($)'}
                {formData.rewardType === 'percentage' && 'Percentage Off (%)'}
                {(formData.rewardType === 'free_service' || formData.rewardType === 'free_product') && 'Value ($)'}
              </Label>
              <Input
                id="reward-value"
                type="number"
                min="0"
                step={formData.rewardType === 'percentage' ? '1' : '5'}
                max={formData.rewardType === 'percentage' ? '100' : undefined}
                value={formData.rewardValue}
                onChange={(e) => setFormData({ ...formData, rewardValue: parseFloat(e.target.value) || 0 })}
              />
              {formData.rewardType === 'percentage' && (
                <p className="text-xs text-gray-500">Enter 1-100 for percentage discount</p>
              )}
            </div>

            {/* Expiration */}
            <div className="space-y-2">
              <Label htmlFor="expires-days">Expires After (Days)</Label>
              <Input
                id="expires-days"
                type="number"
                min="0"
                step="1"
                value={formData.expiresDays || ''}
                onChange={(e) => setFormData({ ...formData, expiresDays: parseInt(e.target.value) || null })}
                placeholder="Leave empty for no expiration"
              />
              <p className="text-xs text-gray-500">
                Days after redemption before reward expires (optional)
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={handleSaveReward} disabled={loading} className="gap-2">
                <Save className="w-4 h-4" />
                {editingReward ? 'Update Reward' : 'Create Reward'}
              </Button>
              <Button variant="outline" onClick={handleCancelEdit} disabled={loading} className="gap-2">
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
