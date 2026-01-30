/**
 * AddOnSelector Component
 *
 * Displays add-on groups and options for a service at checkout.
 * Filters add-on groups by applicability (service ID or category ID).
 * Enforces selection rules (minSelections, maxSelections, required groups).
 *
 * @see US-056 - Create AddOnSelector component for checkout
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/Badge';
import { Clock, DollarSign, AlertCircle, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { addOnGroupsService, addOnOptionsService } from '@/services/domain/catalogDataService';
import type { AddOnGroup, AddOnOption } from '@/types';

/**
 * Selected add-on for callback
 */
export interface SelectedAddOn {
  optionId: string;
  groupId: string;
  name: string;
  price: number;
  duration: number;
}

export interface AddOnSelectorProps {
  /** Service ID to filter applicable add-on groups */
  serviceId: string;
  /** Category ID to filter applicable add-on groups (for broader applicability) */
  categoryId?: string;
  /** Store ID for data fetching */
  storeId: string;
  /** Callback when add-on selection changes */
  onAddOnsChange: (selectedAddOns: SelectedAddOn[]) => void;
  /** Optional: class name for custom styling */
  className?: string;
  /** Optional: initially selected add-on option IDs */
  initialSelectedIds?: string[];
}

/**
 * Add-on group with its options loaded
 */
interface AddOnGroupWithOptions extends AddOnGroup {
  options: AddOnOption[];
}

/**
 * AddOnSelector - Displays add-on options for a service at checkout.
 *
 * Features:
 * - Loads applicable add-on groups via catalogDataService
 * - Filters by applicableToAll OR applicableServiceIds/CategoryIds
 * - Enforces minSelections/maxSelections per group
 * - Shows required groups prominently
 * - Supports single (radio) and multiple (checkbox) selection modes
 */
export function AddOnSelector({
  serviceId,
  categoryId,
  storeId,
  onAddOnsChange,
  className,
  initialSelectedIds = [],
}: AddOnSelectorProps) {
  const [groups, setGroups] = useState<AddOnGroupWithOptions[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track selected options per group: { groupId: [optionId, ...] }
  const [selectedByGroup, setSelectedByGroup] = useState<Record<string, string[]>>({});

  // Load add-on groups and their options
  useEffect(() => {
    let mounted = true;

    async function loadAddOns() {
      try {
        setIsLoading(true);
        setError(null);

        // Get applicable add-on groups for this service
        const applicableGroups = await addOnGroupsService.getForService(storeId, serviceId, categoryId);

        // Filter to active groups only
        const activeGroups = applicableGroups.filter(g => g.isActive);

        // Load options for each group
        const groupsWithOptions: AddOnGroupWithOptions[] = await Promise.all(
          activeGroups.map(async (group) => {
            const options = await addOnOptionsService.getByGroup(group.id);
            return {
              ...group,
              options: options.filter(o => o.isActive).sort((a, b) => a.displayOrder - b.displayOrder),
            };
          })
        );

        // Sort groups by displayOrder
        groupsWithOptions.sort((a, b) => a.displayOrder - b.displayOrder);

        if (mounted) {
          setGroups(groupsWithOptions);

          // Initialize selections from initialSelectedIds
          if (initialSelectedIds.length > 0) {
            const initialSelections: Record<string, string[]> = {};
            for (const group of groupsWithOptions) {
              const groupOptionIds = group.options.map(o => o.id);
              const selectedInGroup = initialSelectedIds.filter(id => groupOptionIds.includes(id));
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
          console.error('Failed to load add-ons:', err);
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
  }, [storeId, serviceId, categoryId, initialSelectedIds]);

  // Build selected add-ons array from selectedByGroup
  const selectedAddOns = useMemo((): SelectedAddOn[] => {
    const result: SelectedAddOn[] = [];
    for (const group of groups) {
      const selectedIds = selectedByGroup[group.id] || [];
      for (const optionId of selectedIds) {
        const option = group.options.find(o => o.id === optionId);
        if (option) {
          result.push({
            optionId: option.id,
            groupId: group.id,
            name: option.name,
            price: option.price,
            duration: option.duration,
          });
        }
      }
    }
    return result;
  }, [groups, selectedByGroup]);

  // Notify parent when selection changes
  useEffect(() => {
    if (!isLoading) {
      onAddOnsChange(selectedAddOns);
    }
  }, [selectedAddOns, onAddOnsChange, isLoading]);

  // Handle single selection (radio group)
  const handleSingleSelect = useCallback((groupId: string, optionId: string) => {
    setSelectedByGroup(prev => ({
      ...prev,
      [groupId]: optionId ? [optionId] : [],
    }));
  }, []);

  // Handle multiple selection (checkboxes)
  const handleMultiSelect = useCallback((groupId: string, optionId: string, checked: boolean, maxSelections?: number) => {
    setSelectedByGroup(prev => {
      const current = prev[groupId] || [];

      if (checked) {
        // Add option if not at max
        if (maxSelections && current.length >= maxSelections) {
          return prev; // At max, don't add
        }
        return {
          ...prev,
          [groupId]: [...current, optionId],
        };
      } else {
        // Remove option
        return {
          ...prev,
          [groupId]: current.filter(id => id !== optionId),
        };
      }
    });
  }, []);

  // Check if a group has validation errors
  const getGroupValidationError = useCallback((group: AddOnGroupWithOptions): string | null => {
    const selected = selectedByGroup[group.id] || [];

    if (group.isRequired && selected.length < group.minSelections) {
      if (group.minSelections === 1) {
        return 'Selection required';
      }
      return `Select at least ${group.minSelections}`;
    }

    return null;
  }, [selectedByGroup]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading add-ons...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('flex items-center justify-center py-8 text-destructive', className)}>
        <AlertCircle className="h-5 w-5 mr-2" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  // No add-ons available
  if (groups.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      <Label className="text-sm font-medium text-muted-foreground">
        Add-ons
      </Label>

      {groups.map((group) => (
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
  );
}

/**
 * Individual add-on group card
 */
interface AddOnGroupCardProps {
  group: AddOnGroupWithOptions;
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
      'p-4',
      validationError && 'border-destructive'
    )}>
      {/* Group header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{group.name}</span>
          {group.isRequired && (
            <Badge variant="secondary" className="text-xs">
              Required
            </Badge>
          )}
        </div>
        {group.maxSelections && group.selectionMode === 'multiple' && (
          <span className="text-xs text-muted-foreground">
            Select up to {group.maxSelections}
          </span>
        )}
      </div>

      {/* Group description */}
      {group.description && (
        <p className="text-xs text-muted-foreground mb-3">{group.description}</p>
      )}

      {/* Validation error */}
      {validationError && (
        <div className="flex items-center gap-1 text-xs text-destructive mb-3">
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
        'flex items-center p-3 rounded-md border cursor-pointer transition-colors',
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-muted-foreground/30'
      )}
    >
      <RadioGroupItem
        value={option.id}
        id={option.id}
        className="mr-3"
      />
      <OptionContent option={option} isSelected={isSelected} />
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
        'flex items-center p-3 rounded-md border cursor-pointer transition-colors',
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-muted-foreground/30',
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
      <OptionContent option={option} isSelected={isSelected} />
    </Label>
  );
}

/**
 * Shared option content (name, price, duration)
 */
interface OptionContentProps {
  option: AddOnOption;
  isSelected: boolean;
}

function OptionContent({ option, isSelected }: OptionContentProps) {
  return (
    <>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm truncate">
            {option.name}
          </span>
        </div>

        {option.description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {option.description}
          </p>
        )}

        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          {option.duration > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              +{option.duration}m
            </span>
          )}
          <span className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            +${option.price.toFixed(2)}
          </span>
        </div>
      </div>

      {isSelected && (
        <div className="ml-2">
          <Check className="h-4 w-4 text-primary" />
        </div>
      )}
    </>
  );
}

export default AddOnSelector;
