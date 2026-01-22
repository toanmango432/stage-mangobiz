/**
 * Loyalty Tier Configuration Component
 * Allows store owners to create and manage loyalty tiers with drag-to-reorder functionality
 */

import { useState, useEffect, useMemo } from 'react';
import { GripVertical, Plus, Trash2, Save, X, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchLoyaltyProgram,
  fetchLoyaltyTiers,
  createLoyaltyTier,
  updateLoyaltyTier,
  deleteLoyaltyTier,
  selectLoyaltyProgram,
  selectLoyaltyTiers,
  selectTiersLoading,
  selectTiersError,
} from '@/store/slices/loyaltySlice';
import { storeAuthManager } from '@/services/storeAuthManager';
import type { LoyaltyTierConfig } from '@/types/client';

// Drag and drop
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TierFormData {
  name: string;
  thresholdPoints: number;
  benefits: {
    percentageDiscount?: number;
    freeShipping?: boolean;
    earlyAccess?: boolean;
    priorityBooking?: boolean;
    birthdayBonus?: number;
  };
}

interface SortableTierItemProps {
  tier: LoyaltyTierConfig;
  index: number;
  onEdit: (tier: LoyaltyTierConfig) => void;
  onDelete: (tier: LoyaltyTierConfig) => void;
}

// Sortable tier item component
function SortableTierItem({ tier, index, onEdit, onDelete }: SortableTierItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tier.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  const hasDiscountBenefit = tier.benefits.percentageDiscount && tier.benefits.percentageDiscount > 0;
  const activeBenefits = [
    hasDiscountBenefit && `${tier.benefits.percentageDiscount}% discount`,
    tier.benefits.freeShipping && 'Free shipping',
    tier.benefits.earlyAccess && 'Early access',
    tier.benefits.priorityBooking && 'Priority booking',
    tier.benefits.birthdayBonus && `$${tier.benefits.birthdayBonus} birthday bonus`,
  ].filter(Boolean);

  return (
    <div
      ref={setNodeRef}
      style={style as React.CSSProperties}
      className="relative group bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
        title="Drag to reorder"
      >
        <GripVertical size={16} className="text-gray-400" />
      </div>

      {/* Content */}
      <div className="ml-8 flex items-start justify-between">
        <div className="flex-1 space-y-2">
          {/* Tier header */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold">
              {index + 1}
            </div>
            <div>
              <h4 className="text-base font-semibold text-gray-900">{tier.name}</h4>
              <p className="text-sm text-gray-500">
                {tier.thresholdPoints.toLocaleString()} points required
              </p>
            </div>
          </div>

          {/* Benefits */}
          {activeBenefits.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {activeBenefits.map((benefit, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-800"
                >
                  {benefit}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 ml-4">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(tier)}
            className="text-gray-600 hover:text-gray-900"
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(tier)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface LoyaltyTierConfigProps {
  className?: string;
}

export function LoyaltyTierConfig({ className }: LoyaltyTierConfigProps) {
  const dispatch = useAppDispatch();
  const program = useAppSelector(selectLoyaltyProgram);
  const tiers = useAppSelector(selectLoyaltyTiers);
  const loading = useAppSelector(selectTiersLoading);
  const error = useAppSelector(selectTiersError);

  const [localTiers, setLocalTiers] = useState<LoyaltyTierConfig[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTier, setEditingTier] = useState<LoyaltyTierConfig | null>(null);
  const [formData, setFormData] = useState<TierFormData>({
    name: '',
    thresholdPoints: 0,
    benefits: {},
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load program and tiers on mount
  useEffect(() => {
    const session = storeAuthManager.getState();
    if (session.store?.storeId) {
      dispatch(fetchLoyaltyProgram(session.store.storeId));
      if (program?.id) {
        dispatch(fetchLoyaltyTiers(program.id));
      }
    }
  }, [dispatch, program?.id]);

  // Update local tiers when Redux tiers change
  useEffect(() => {
    setLocalTiers([...tiers].sort((a, b) => a.tierOrder - b.tierOrder));
  }, [tiers]);

  // Sorted tier IDs for DndContext
  const tierIds = useMemo(() => localTiers.map(t => t.id), [localTiers]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = localTiers.findIndex(t => t.id === active.id);
    const newIndex = localTiers.findIndex(t => t.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Optimistically update local state
    const reorderedTiers = arrayMove(localTiers, oldIndex, newIndex);
    setLocalTiers(reorderedTiers);

    // Update tier orders in database
    try {
      const updatePromises = reorderedTiers.map((tier, index) => {
        if (tier.tierOrder !== index) {
          return dispatch(updateLoyaltyTier({
            id: tier.id,
            updates: { tierOrder: index },
          })).unwrap();
        }
        return Promise.resolve(tier);
      });

      await Promise.all(updatePromises);

      toast({
        title: 'Tiers Reordered',
        description: 'Loyalty tier order has been updated.',
      });
    } catch (err) {
      console.error('[LoyaltyTierConfig] Failed to reorder tiers:', err);
      // Revert on error
      setLocalTiers([...tiers].sort((a, b) => a.tierOrder - b.tierOrder));
      toast({
        variant: 'destructive',
        title: 'Reorder Failed',
        description: 'Could not update tier order. Please try again.',
      });
    }
  };

  const handleAddNew = () => {
    setIsEditing(true);
    setEditingTier(null);
    setFormData({
      name: '',
      thresholdPoints: 0,
      benefits: {},
    });
  };

  const handleEdit = (tier: LoyaltyTierConfig) => {
    setIsEditing(true);
    setEditingTier(tier);
    setFormData({
      name: tier.name,
      thresholdPoints: tier.thresholdPoints,
      benefits: { ...tier.benefits },
    });
  };

  const handleDelete = async (tier: LoyaltyTierConfig) => {
    if (!confirm(`Are you sure you want to delete the "${tier.name}" tier?`)) {
      return;
    }

    try {
      await dispatch(deleteLoyaltyTier(tier.id)).unwrap();
      toast({
        title: 'Tier Deleted',
        description: `${tier.name} has been removed.`,
      });
    } catch (err) {
      console.error('[LoyaltyTierConfig] Failed to delete tier:', err);
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: 'Could not delete tier. Please try again.',
      });
    }
  };

  const handleSaveTier = async () => {
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
        description: 'Tier name is required.',
      });
      return;
    }

    if (formData.thresholdPoints < 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Threshold points must be 0 or greater.',
      });
      return;
    }

    try {
      if (editingTier) {
        // Update existing tier
        await dispatch(updateLoyaltyTier({
          id: editingTier.id,
          updates: {
            name: formData.name,
            thresholdPoints: formData.thresholdPoints,
            benefits: formData.benefits,
          },
        })).unwrap();

        toast({
          title: 'Tier Updated',
          description: `${formData.name} has been updated.`,
        });
      } else {
        // Create new tier
        const nextOrder = localTiers.length;
        await dispatch(createLoyaltyTier({
          programId: program.id,
          name: formData.name,
          thresholdPoints: formData.thresholdPoints,
          benefits: formData.benefits,
          tierOrder: nextOrder,
        })).unwrap();

        toast({
          title: 'Tier Created',
          description: `${formData.name} has been added.`,
        });
      }

      setIsEditing(false);
      setEditingTier(null);
      setFormData({ name: '', thresholdPoints: 0, benefits: {} });
    } catch (err) {
      console.error('[LoyaltyTierConfig] Failed to save tier:', err);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not save tier. Please try again.',
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingTier(null);
    setFormData({ name: '', thresholdPoints: 0, benefits: {} });
  };

  if (!program) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Award className="w-5 h-5" />
            Loyalty Tiers
          </CardTitle>
          <CardDescription>
            Please create a loyalty program first to configure tiers.
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
              <Award className="w-5 h-5" />
              Loyalty Tiers
            </CardTitle>
            <CardDescription>
              Create and manage tiers to reward your most loyal customers. Drag to reorder.
            </CardDescription>
          </div>
          {!isEditing && (
            <Button onClick={handleAddNew} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Tier
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tier List with Drag & Drop */}
        {!isEditing && localTiers.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={tierIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {localTiers.map((tier, index) => (
                  <SortableTierItem
                    key={tier.id}
                    tier={tier}
                    index={index}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Empty State */}
        {!isEditing && localTiers.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
            <Award className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 mb-4">No tiers configured yet</p>
            <Button onClick={handleAddNew} className="gap-2">
              <Plus className="w-4 h-4" />
              Create First Tier
            </Button>
          </div>
        )}

        {/* Edit/Create Form */}
        {isEditing && (
          <div className="border border-gray-200 rounded-lg p-6 space-y-4 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingTier ? 'Edit Tier' : 'Create New Tier'}
            </h3>

            {/* Tier Name */}
            <div className="space-y-2">
              <Label htmlFor="tier-name">Tier Name</Label>
              <Input
                id="tier-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Bronze, Silver, Gold"
              />
            </div>

            {/* Threshold Points */}
            <div className="space-y-2">
              <Label htmlFor="threshold-points">Points Required</Label>
              <Input
                id="threshold-points"
                type="number"
                min="0"
                step="100"
                value={formData.thresholdPoints}
                onChange={(e) => setFormData({ ...formData, thresholdPoints: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-gray-500">
                Customers need this many points to reach this tier
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-3">
              <Label>Tier Benefits</Label>

              {/* Percentage Discount */}
              <div className="space-y-2">
                <Label htmlFor="percentage-discount" className="text-sm font-normal">
                  Percentage Discount (%)
                </Label>
                <Input
                  id="percentage-discount"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={formData.benefits.percentageDiscount || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    benefits: {
                      ...formData.benefits,
                      percentageDiscount: parseInt(e.target.value) || undefined,
                    },
                  })}
                  placeholder="0"
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="free-shipping"
                    checked={formData.benefits.freeShipping || false}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      benefits: {
                        ...formData.benefits,
                        freeShipping: checked === true,
                      },
                    })}
                  />
                  <label htmlFor="free-shipping" className="text-sm">
                    Free Shipping
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="early-access"
                    checked={formData.benefits.earlyAccess || false}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      benefits: {
                        ...formData.benefits,
                        earlyAccess: checked === true,
                      },
                    })}
                  />
                  <label htmlFor="early-access" className="text-sm">
                    Early Access to New Services
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="priority-booking"
                    checked={formData.benefits.priorityBooking || false}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      benefits: {
                        ...formData.benefits,
                        priorityBooking: checked === true,
                      },
                    })}
                  />
                  <label htmlFor="priority-booking" className="text-sm">
                    Priority Booking
                  </label>
                </div>
              </div>

              {/* Birthday Bonus */}
              <div className="space-y-2">
                <Label htmlFor="birthday-bonus" className="text-sm font-normal">
                  Birthday Bonus ($)
                </Label>
                <Input
                  id="birthday-bonus"
                  type="number"
                  min="0"
                  step="5"
                  value={formData.benefits.birthdayBonus || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    benefits: {
                      ...formData.benefits,
                      birthdayBonus: parseInt(e.target.value) || undefined,
                    },
                  })}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={handleSaveTier} disabled={loading} className="gap-2">
                <Save className="w-4 h-4" />
                {editingTier ? 'Update Tier' : 'Create Tier'}
              </Button>
              <Button variant="outline" onClick={handleCancelEdit} disabled={loading} className="gap-2">
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Visual Tier Progression Preview */}
        {!isEditing && localTiers.length > 0 && (
          <div className="mt-8 pt-6 border-t">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Tier Progression</h4>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {localTiers.map((tier, index) => (
                <div key={tier.id} className="flex items-center">
                  <div className="flex flex-col items-center min-w-[120px]">
                    <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold mb-2">
                      {index + 1}
                    </div>
                    <p className="text-xs font-medium text-gray-900 text-center">{tier.name}</p>
                    <p className="text-xs text-gray-500 text-center">
                      {tier.thresholdPoints.toLocaleString()} pts
                    </p>
                  </div>
                  {index < localTiers.length - 1 && (
                    <div className="w-8 h-0.5 bg-purple-300 mb-8 mx-2" />
                  )}
                </div>
              ))}
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
