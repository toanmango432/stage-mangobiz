/**
 * AddOnsSelector Component for Online Store
 *
 * Displays add-on groups and options for a service during booking.
 * Loads real catalog data from catalogSyncService instead of mock data.
 * Mobile-optimized UI with touch-friendly interactions.
 *
 * @see US-069 - Create AddOnsSelector for Online Store
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { BookingFormData } from '@/types/booking';
import { cn } from '@/lib/utils';
import { Plus, Sparkles, Clock, Loader2, AlertCircle } from 'lucide-react';
import { getAddOnGroups, type AddOnGroup, type AddOnOption } from '@/lib/services/catalogSyncService';

interface AddOnsSelectorProps {
  formData: Partial<BookingFormData>;
  updateFormData: (data: Partial<BookingFormData>) => void;
  onNext: () => void;
  storeId: string; // Required for fetching add-ons
  serviceId: string; // Service ID to filter applicable add-ons
  categoryId?: string; // Optional category ID for broader applicability
}

export const AddOnsSelector = ({
  formData,
  updateFormData,
  onNext,
  storeId,
  serviceId,
  categoryId
}: AddOnsSelectorProps) => {
  const [addOnGroups, setAddOnGroups] = useState<AddOnGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track selected options per group: { groupId: optionId[] }
  const [selectedByGroup, setSelectedByGroup] = useState<Record<string, string[]>>({});

  // Load add-on groups from catalogSyncService
  useEffect(() => {
    let mounted = true;

    async function loadAddOns() {
      try {
        setIsLoading(true);
        setError(null);

        const groups = await getAddOnGroups(storeId, serviceId, categoryId);

        if (mounted) {
          setAddOnGroups(groups);

          // Initialize selections from formData if available
          if (formData.addOns && formData.addOns.length > 0) {
            const initialSelections: Record<string, string[]> = {};
            for (const group of groups) {
              const selectedInGroup = formData.addOns
                .filter(addon => group.options.some(opt => opt.id === addon.id))
                .map(addon => addon.id);
              if (selectedInGroup.length > 0) {
                initialSelections[group.id] = selectedInGroup;
              }
            }
            setSelectedByGroup(initialSelections);
          }
        }
      } catch (err) {
        if (mounted) {
          setError('Failed to load add-ons');
          console.error('[AddOnsSelector] Failed to load add-ons:', err);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadAddOns();

    return () => {
      mounted = false;
    };
  }, [storeId, serviceId, categoryId, formData.addOns]);

  // Build selected add-ons array from selectedByGroup
  const getSelectedAddOns = (): any[] => {
    const result: any[] = [];
    for (const group of addOnGroups) {
      const selectedIds = selectedByGroup[group.id] || [];
      for (const optionId of selectedIds) {
        const option = group.options.find(o => o.id === optionId);
        if (option) {
          result.push({
            id: option.id,
            name: option.name,
            description: option.description,
            price: option.price,
            duration: option.duration,
            icon: 'sparkles', // For compatibility with existing booking types
          });
        }
      }
    }
    return result;
  };

  const selectedAddOns = getSelectedAddOns();
  const totalAdditionalCost = selectedAddOns.reduce((sum, addon) => sum + addon.price, 0);
  const totalAdditionalTime = selectedAddOns.reduce((sum, addon) => sum + addon.duration, 0);

  // Handle single selection (radio group)
  const handleSingleSelect = (groupId: string, optionId: string) => {
    const newSelections = {
      ...selectedByGroup,
      [groupId]: optionId ? [optionId] : [],
    };
    setSelectedByGroup(newSelections);

    // Update formData
    updateFormData({ addOns: buildAddOnsFromSelections(newSelections) });
  };

  // Handle multiple selection (checkboxes)
  const handleMultiSelect = (groupId: string, optionId: string, checked: boolean, maxSelections?: number) => {
    const current = selectedByGroup[groupId] || [];

    let newGroupSelection: string[];
    if (checked) {
      // Add option if not at max
      if (maxSelections && current.length >= maxSelections) {
        return; // At max, don't add
      }
      newGroupSelection = [...current, optionId];
    } else {
      // Remove option
      newGroupSelection = current.filter(id => id !== optionId);
    }

    const newSelections = {
      ...selectedByGroup,
      [groupId]: newGroupSelection,
    };
    setSelectedByGroup(newSelections);

    // Update formData
    updateFormData({ addOns: buildAddOnsFromSelections(newSelections) });
  };

  // Build add-ons array for formData from selections
  const buildAddOnsFromSelections = (selections: Record<string, string[]>): any[] => {
    const result: any[] = [];
    for (const group of addOnGroups) {
      const selectedIds = selections[group.id] || [];
      for (const optionId of selectedIds) {
        const option = group.options.find(o => o.id === optionId);
        if (option) {
          result.push({
            id: option.id,
            name: option.name,
            description: option.description,
            price: option.price,
            duration: option.duration,
            icon: 'sparkles',
          });
        }
      }
    }
    return result;
  };

  // Check if a group has validation errors
  const getGroupValidationError = (group: AddOnGroup): string | null => {
    const selected = selectedByGroup[group.id] || [];

    if (group.isRequired && selected.length < group.minSelections) {
      if (group.minSelections === 1) {
        return 'Selection required';
      }
      return `Select at least ${group.minSelections}`;
    }

    return null;
  };

  // Check if all required groups are satisfied
  const canProceed = addOnGroups.every(group => !getGroupValidationError(group));

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-3 text-sm text-muted-foreground">Loading add-ons...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Enhance Your Experience</h3>
          <p className="text-sm text-muted-foreground">
            Add extra services to make your appointment even more special
          </p>
        </div>

        <div className="flex items-center justify-center py-8 text-destructive">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span className="text-sm">{error}</span>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="ghost" onClick={onNext}>
            Skip Add-ons
          </Button>
          <Button onClick={onNext} size="lg">
            Continue
          </Button>
        </div>
      </div>
    );
  }

  // No add-ons available - allow skip
  if (addOnGroups.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Enhance Your Experience</h3>
          <p className="text-sm text-muted-foreground">
            No add-ons available for this service
          </p>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onNext} size="lg">
            Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Enhance Your Experience</h3>
        <p className="text-sm text-muted-foreground">
          Add extra services to make your appointment even more special
        </p>
      </div>

      <div className="space-y-4">
        {addOnGroups.map((group) => (
          <AddOnGroupCard
            key={group.id}
            group={group}
            selectedOptionIds={selectedByGroup[group.id] || []}
            onSingleSelect={handleSingleSelect}
            onMultiSelect={handleMultiSelect}
            validationError={getGroupValidationError(group)}
          />
        ))}
      </div>

      {selectedAddOns.length > 0 && (
        <Card className="bg-gradient-card border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Additional Services</p>
                <p className="font-semibold">
                  {selectedAddOns.length} add-on{selectedAddOns.length !== 1 ? 's' : ''} selected
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Extra Time & Cost</p>
                <p className="font-semibold text-primary">
                  +${totalAdditionalCost} (+{totalAdditionalTime} min)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center pt-4 border-t">
        <Button variant="ghost" onClick={onNext}>
          Skip Add-ons
        </Button>
        <Button
          onClick={onNext}
          size="lg"
          disabled={!canProceed}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

/**
 * Individual add-on group card
 */
interface AddOnGroupCardProps {
  group: AddOnGroup;
  selectedOptionIds: string[];
  onSingleSelect: (groupId: string, optionId: string) => void;
  onMultiSelect: (groupId: string, optionId: string, checked: boolean, maxSelections?: number) => void;
  validationError: string | null;
}

function AddOnGroupCard({
  group,
  selectedOptionIds,
  onSingleSelect,
  onMultiSelect,
  validationError,
}: AddOnGroupCardProps) {
  const isSingleSelection = group.selectionMode === 'single';

  return (
    <Card className={cn(
      'border-2 transition-colors',
      validationError && 'border-destructive',
      group.isRequired && !validationError && 'border-primary/30'
    )}>
      <CardContent className="p-4">
        {/* Group header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{group.name}</span>
            {group.isRequired && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                Required
              </span>
            )}
          </div>
          {group.maxSelections && group.selectionMode === 'multiple' && (
            <span className="text-xs text-muted-foreground">
              Up to {group.maxSelections}
            </span>
          )}
        </div>

        {/* Group description */}
        {group.description && (
          <p className="text-xs text-muted-foreground mb-3">{group.description}</p>
        )}

        {/* Validation error */}
        {validationError && (
          <div className="flex items-center gap-1 text-xs text-destructive mb-3 bg-destructive/10 p-2 rounded">
            <AlertCircle className="h-3 w-3" />
            {validationError}
          </div>
        )}

        {/* Options - Single selection (radio) */}
        {isSingleSelection ? (
          <RadioGroup
            value={selectedOptionIds[0] || ''}
            onValueChange={(value) => onSingleSelect(group.id, value)}
            className="space-y-2"
          >
            {group.options.map((option) => (
              <AddOnOptionRadio
                key={option.id}
                option={option}
                isSelected={selectedOptionIds.includes(option.id)}
              />
            ))}
          </RadioGroup>
        ) : (
          /* Options - Multiple selection (checkboxes) */
          <div className="space-y-2">
            {group.options.map((option) => (
              <AddOnOptionCheckbox
                key={option.id}
                option={option}
                isSelected={selectedOptionIds.includes(option.id)}
                onCheckedChange={(checked) =>
                  onMultiSelect(group.id, option.id, checked, group.maxSelections)
                }
                disabled={
                  !selectedOptionIds.includes(option.id) &&
                  group.maxSelections !== undefined &&
                  selectedOptionIds.length >= group.maxSelections
                }
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Single selection option (radio button)
 */
interface AddOnOptionRadioProps {
  option: AddOnOption;
  isSelected: boolean;
}

function AddOnOptionRadio({ option, isSelected }: AddOnOptionRadioProps) {
  return (
    <Label
      htmlFor={option.id}
      className={cn(
        'flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all active:scale-[0.98]',
        isSelected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border hover:border-primary/30 hover:bg-accent/5'
      )}
    >
      <RadioGroupItem
        value={option.id}
        id={option.id}
        className="mr-3"
      />
      <OptionContent option={option} />
    </Label>
  );
}

/**
 * Multiple selection option (checkbox)
 */
interface AddOnOptionCheckboxProps {
  option: AddOnOption;
  isSelected: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

function AddOnOptionCheckbox({ option, isSelected, onCheckedChange, disabled }: AddOnOptionCheckboxProps) {
  return (
    <Label
      htmlFor={`checkbox-${option.id}`}
      className={cn(
        'flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all active:scale-[0.98]',
        isSelected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border hover:border-primary/30 hover:bg-accent/5',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <Checkbox
        id={`checkbox-${option.id}`}
        checked={isSelected}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="mr-3"
      />
      <OptionContent option={option} />
    </Label>
  );
}

/**
 * Shared option content (name, price, duration)
 */
interface OptionContentProps {
  option: AddOnOption;
}

function OptionContent({ option }: OptionContentProps) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-medium text-sm truncate">
          {option.name}
        </span>
        <Plus className="h-3 w-3 text-primary flex-shrink-0" />
      </div>

      {option.description && (
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
          {option.description}
        </p>
      )}

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1 font-semibold text-primary">
          +${option.price.toFixed(2)}
        </span>
        {option.duration > 0 && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            +{option.duration}min
          </span>
        )}
      </div>
    </div>
  );
}
