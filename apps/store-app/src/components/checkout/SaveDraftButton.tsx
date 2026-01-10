import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { saveDraft } from '@/store/slices/checkoutSlice';
import { Button } from '@/components/ui/Button';
import { Save, Loader2, Check } from 'lucide-react';

export interface SaveDraftButtonProps {
  ticketId: string;
  userId: string;
  disabled?: boolean;
  onSaveComplete?: () => void;
}

/**
 * Button to manually save the current ticket as a draft.
 * Shows loading state during save and success feedback.
 */
export default function SaveDraftButton({
  ticketId,
  userId,
  disabled = false,
  onSaveComplete,
}: SaveDraftButtonProps) {
  const dispatch = useAppDispatch();
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const lastAutoSave = useAppSelector((state) => state.checkout.lastAutoSave);

  const handleSaveDraft = async () => {
    if (isSaving || disabled) return;

    setIsSaving(true);
    try {
      await dispatch(
        saveDraft({
          ticketId,
          updates: {},
          userId,
        })
      ).unwrap();

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      onSaveComplete?.();
    } catch (error) {
      console.error('Failed to save draft:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSaveDraft}
        disabled={disabled || isSaving}
        className="min-w-[100px]"
        data-testid="save-draft-button"
      >
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : showSuccess ? (
          <>
            <Check className="h-4 w-4 mr-2 text-green-500" />
            Saved
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </>
        )}
      </Button>
      {lastAutoSave && !isSaving && !showSuccess && (
        <span className="text-xs text-muted-foreground">
          Last saved: {new Date(lastAutoSave).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
