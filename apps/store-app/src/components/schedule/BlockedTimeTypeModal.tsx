/**
 * BlockedTimeTypeModal Component
 * Modal for creating/editing blocked time types
 */

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Save, X } from 'lucide-react';
import { useBlockedTimeTypeMutations, type ScheduleContext } from '@/hooks/useSchedule';
import type { BlockedTimeType, CreateBlockedTimeTypeInput, UpdateBlockedTimeTypeInput } from '@/types/schedule';

// Predefined emoji options for blocked time types
const EMOJI_OPTIONS = ['☕', '🍔', '📅', '📚', '🏃', '🏥', '🚗', '✈️', '🔧', '💼', '🎯', '⏰'];

// Predefined color options
const COLOR_OPTIONS = [
  '#6B7280', // gray
  '#EF4444', // red
  '#F97316', // orange
  '#EAB308', // yellow
  '#22C55E', // green
  '#06B6D4', // cyan
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#64748B', // slate
];

interface BlockedTimeTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: ScheduleContext;
  editingType?: BlockedTimeType | null;
  onSuccess?: () => void;
}

export function BlockedTimeTypeModal({
  open,
  onOpenChange,
  context,
  editingType,
  onSuccess,
}: BlockedTimeTypeModalProps) {
  const { create, update, loading } = useBlockedTimeTypeMutations(context);
  const isEditing = !!editingType;

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('☕');
  const [color, setColor] = useState('#6B7280');
  const [isPaid, setIsPaid] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes or editing type changes
  useEffect(() => {
    if (open) {
      if (editingType) {
        setName(editingType.name);
        setDescription(editingType.description || '');
        setEmoji(editingType.emoji);
        setColor(editingType.color);
        setIsPaid(editingType.isPaid);
        setIsActive(editingType.isActive);
        setRequiresApproval(editingType.requiresApproval);
      } else {
        setName('');
        setDescription('');
        setEmoji('☕');
        setColor('#6B7280');
        setIsPaid(false);
        setIsActive(true);
        setRequiresApproval(false);
      }
      setError(null);
    }
  }, [open, editingType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      if (isEditing && editingType) {
        const updates: UpdateBlockedTimeTypeInput = {
          name: name.trim(),
          description: description.trim() || undefined,
          emoji,
          color,
          isPaid,
          isActive,
          requiresApproval,
        };
        await update(editingType.id, updates);
      } else {
        const input: CreateBlockedTimeTypeInput = {
          name: name.trim(),
          description: description.trim() || undefined,
          emoji,
          color,
          isPaid,
          requiresApproval,
        };
        await create(input);
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save blocked time type');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Edit Blocked Time Type' : 'Create Blocked Time Type'}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Update the details for this blocked time type.'
              : 'Create a new category for blocking staff time.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Break, Meeting, Training"
              disabled={editingType?.isSystemDefault}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
            />
          </div>

          {/* Emoji Picker */}
          <div className="space-y-2">
            <Label>Emoji</Label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`w-10 h-10 rounded-lg border-2 text-xl flex items-center justify-center transition-colors ${
                    emoji === e
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${
                    color === c ? 'border-primary scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                style={{ backgroundColor: `${color}20`, color: color }}
              >
                {emoji}
              </div>
              <div>
                <p className="font-medium">{name || 'Type Name'}</p>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isPaid">Paid Time</Label>
                <p className="text-sm text-muted-foreground">Staff gets paid during this blocked time</p>
              </div>
              <Switch
                id="isPaid"
                checked={isPaid}
                onCheckedChange={setIsPaid}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="requiresApproval">Requires Approval</Label>
                <p className="text-sm text-muted-foreground">Manager must approve this type of blocked time</p>
              </div>
              <Switch
                id="requiresApproval"
                checked={requiresApproval}
                onCheckedChange={setRequiresApproval}
              />
            </div>

            {isEditing && (
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isActive">Active</Label>
                  <p className="text-sm text-muted-foreground">Show this type when blocking time</p>
                </div>
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            )}
          </div>

          <SheetFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? 'Save Changes' : 'Create Type'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export default BlockedTimeTypeModal;
