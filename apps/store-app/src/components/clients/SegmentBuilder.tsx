/**
 * SegmentBuilder - Phase 3 Client Segment Builder
 * Allows managers to build custom client segments with filter conditions.
 *
 * Features:
 * - Add filter conditions (field, operator, value)
 * - Support multiple fields: visitSummary, loyaltyTier, tags, etc.
 * - AND/OR group logic
 * - Live count of matching clients
 * - Save segment with name and description
 */

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Trash2, Users, Save, X, Filter, Loader2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectStoreId, selectMemberId } from '@/store/slices/authSlice';
import { selectClients } from '@/store/slices/clientsSlice';
import { createCustomSegment } from '@/store/slices/clientsSlice';
import { filterClientsByCustomSegment } from '@/constants/segmentationConfig';
import type {
  SegmentFilterCondition,
  SegmentFilterField,
  SegmentComparisonOperator,
  CustomSegment,
  Client,
} from '@/types/client';

// ==================== CONSTANTS ====================

const FIELD_OPTIONS: { value: SegmentFilterField; label: string; type: 'number' | 'string' | 'date' | 'boolean' | 'array' }[] = [
  { value: 'visitSummary.totalVisits', label: 'Total Visits', type: 'number' },
  { value: 'visitSummary.totalSpent', label: 'Total Spent ($)', type: 'number' },
  { value: 'visitSummary.averageTicket', label: 'Average Ticket ($)', type: 'number' },
  { value: 'visitSummary.lastVisitDate', label: 'Last Visit Date', type: 'date' },
  { value: 'visitSummary.noShowCount', label: 'No-Show Count', type: 'number' },
  { value: 'visitSummary.lateCancelCount', label: 'Late Cancel Count', type: 'number' },
  { value: 'loyaltyInfo.tier', label: 'Loyalty Tier', type: 'string' },
  { value: 'loyaltyInfo.pointsBalance', label: 'Points Balance', type: 'number' },
  { value: 'membership.hasMembership', label: 'Has Membership', type: 'boolean' },
  { value: 'source', label: 'Source', type: 'string' },
  { value: 'gender', label: 'Gender', type: 'string' },
  { value: 'tags', label: 'Tags', type: 'array' },
  { value: 'isVip', label: 'Is VIP', type: 'boolean' },
  { value: 'isBlocked', label: 'Is Blocked', type: 'boolean' },
  { value: 'createdAt', label: 'Created Date', type: 'date' },
];

const OPERATORS_BY_TYPE: Record<string, { value: SegmentComparisonOperator; label: string }[]> = {
  number: [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'greater_or_equal', label: 'Greater or Equal' },
    { value: 'less_or_equal', label: 'Less or Equal' },
  ],
  string: [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Not Contains' },
    { value: 'is_empty', label: 'Is Empty' },
    { value: 'is_not_empty', label: 'Is Not Empty' },
  ],
  date: [
    { value: 'equals', label: 'Equals' },
    { value: 'greater_than', label: 'After' },
    { value: 'less_than', label: 'Before' },
    { value: 'is_empty', label: 'Is Empty' },
    { value: 'is_not_empty', label: 'Is Not Empty' },
  ],
  boolean: [
    { value: 'equals', label: 'Is' },
  ],
  array: [
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does Not Contain' },
    { value: 'is_empty', label: 'Is Empty' },
    { value: 'is_not_empty', label: 'Is Not Empty' },
  ],
};

const SEGMENT_COLORS = ['#22c55e', '#3b82f6', '#f97316', '#a855f7', '#ef4444', '#06b6d4', '#eab308'];

// ==================== TYPES ====================

interface SegmentBuilderProps {
  /** Optional existing segment to edit */
  initialSegment?: CustomSegment;
  /** Callback when segment is saved */
  onSave?: (segment: CustomSegment) => void;
  /** Callback when cancelled */
  onCancel?: () => void;
}

// ==================== COMPONENT ====================

export function SegmentBuilder({ initialSegment, onSave, onCancel }: SegmentBuilderProps) {
  const dispatch = useAppDispatch();
  const storeId = useAppSelector(selectStoreId);
  const memberId = useAppSelector(selectMemberId);
  const allClients = useAppSelector(selectClients) as Client[];

  // Segment metadata
  const [name, setName] = useState(initialSegment?.name || '');
  const [description, setDescription] = useState(initialSegment?.description || '');
  const [color, setColor] = useState(initialSegment?.color || SEGMENT_COLORS[0]);

  // Filter state
  const [logic, setLogic] = useState<'and' | 'or'>(initialSegment?.filters.logic || 'and');
  const [conditions, setConditions] = useState<SegmentFilterCondition[]>(
    initialSegment?.filters.conditions as SegmentFilterCondition[] || []
  );

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build segment for preview
  const previewSegment: CustomSegment = useMemo(() => ({
    id: initialSegment?.id || 'preview',
    storeId: storeId || '',
    name: name || 'Preview',
    description,
    color,
    filters: { logic, conditions },
    isActive: true,
    createdBy: initialSegment?.createdBy || 'preview',
    syncStatus: 'synced',
    createdAt: initialSegment?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }), [initialSegment, storeId, name, description, color, logic, conditions]);

  // Calculate matching client count
  const matchingClients = useMemo(() => {
    if (conditions.length === 0) return [];
    return filterClientsByCustomSegment(allClients, previewSegment);
  }, [allClients, previewSegment, conditions]);

  const addCondition = useCallback(() => {
    const newCondition: SegmentFilterCondition = {
      field: 'visitSummary.totalVisits',
      operator: 'greater_than',
      value: 0,
    };
    setConditions((prev) => [...prev, newCondition]);
  }, []);

  const updateCondition = useCallback((index: number, updates: Partial<SegmentFilterCondition>) => {
    setConditions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };
      return updated;
    });
  }, []);

  const removeCondition = useCallback((index: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = async () => {
    if (!storeId || !name.trim()) {
      setError('Please enter a segment name.');
      return;
    }
    if (conditions.length === 0) {
      setError('Please add at least one filter condition.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const result = await dispatch(
        createCustomSegment({
          storeId,
          name: name.trim(),
          description: description.trim(),
          color,
          filters: { logic, conditions },
          createdBy: memberId || 'unknown',
        })
      ).unwrap();

      onSave?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save segment.');
    } finally {
      setIsSaving(false);
    }
  };

  const getFieldType = (field: SegmentFilterField) => {
    return FIELD_OPTIONS.find((f) => f.value === field)?.type || 'string';
  };

  return (
    <div className="space-y-4">
      {/* Segment Name & Description */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="segment-name">Segment Name</Label>
          <Input
            id="segment-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., High Spenders"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="segment-desc">Description (optional)</Label>
          <Input
            id="segment-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Clients who spent over $500"
          />
        </div>
      </div>

      {/* Color Picker */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Color:</span>
        {SEGMENT_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`w-6 h-6 rounded-full border-2 transition-transform ${
              color === c ? 'border-gray-800 scale-110' : 'border-transparent hover:scale-105'
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      {/* Filter Logic Toggle */}
      <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
        <Filter className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Match clients where</span>
        <Select value={logic} onValueChange={(v) => setLogic(v as 'and' | 'or')}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="and">ALL</SelectItem>
            <SelectItem value="or">ANY</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-500">of the following conditions are met:</span>
      </div>

      {/* Filter Conditions */}
      <div className="space-y-2">
        {conditions.map((condition, index) => {
          const fieldType = getFieldType(condition.field);
          const operators = OPERATORS_BY_TYPE[fieldType] || OPERATORS_BY_TYPE.string;

          return (
            <div key={index} className="flex items-center gap-2 p-2 bg-white border rounded-lg">
              {/* Field Select */}
              <Select value={condition.field} onValueChange={(v) => updateCondition(index, { field: v as SegmentFilterField })}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Operator Select */}
              <Select value={condition.operator} onValueChange={(v) => updateCondition(index, { operator: v as SegmentComparisonOperator })}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {operators.map((op) => (
                    <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Value Input (hide for is_empty/is_not_empty) */}
              {!['is_empty', 'is_not_empty'].includes(condition.operator) && (
                fieldType === 'boolean' ? (
                  <Select value={String(condition.value)} onValueChange={(v) => updateCondition(index, { value: v === 'true' })}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={String(condition.value)}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateCondition(index, { value: fieldType === 'number' ? Number(val) : val });
                    }}
                    type={fieldType === 'number' ? 'number' : fieldType === 'date' ? 'date' : 'text'}
                    className="w-32"
                    placeholder="Value"
                  />
                )
              )}

              {/* Remove Button */}
              <Button variant="ghost" size="sm" onClick={() => removeCondition(index)}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          );
        })}

        {/* Add Condition Button */}
        <Button variant="secondary" size="sm" onClick={addCondition} className="w-full">
          <Plus className="w-4 h-4 mr-2" /> Add Condition
        </Button>
      </div>

      {/* Live Preview */}
      <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">
            {conditions.length === 0
              ? 'Add conditions to preview matching clients'
              : `${matchingClients.length} client${matchingClients.length !== 1 ? 's' : ''} match this segment`}
          </span>
        </div>
        {conditions.length > 0 && (
          <Badge style={{ backgroundColor: color }}>{matchingClients.length}</Badge>
        )}
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2 border-t">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}><X className="w-4 h-4 mr-2" />Cancel</Button>
        )}
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Segment
        </Button>
      </div>
    </div>
  );
}

export default SegmentBuilder;
