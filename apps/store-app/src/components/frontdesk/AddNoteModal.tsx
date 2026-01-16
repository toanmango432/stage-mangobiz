import { useState, useEffect, useRef, memo } from 'react';
import { StickyNote, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import { useAppDispatch } from '@/store/hooks';
import { addTicketNote } from '@/store/slices/uiTicketsSlice';

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  ticketNumber: number;
  clientName: string;
  currentNote?: string;
  /** @deprecated Use Redux dispatch instead. Kept for backward compatibility. */
  onSave?: (ticketId: string, note: string) => void;
}

function AddNoteModalComponent({
  isOpen,
  onClose,
  ticketId,
  ticketNumber,
  clientName,
  currentNote = '',
  onSave,
}: AddNoteModalProps) {
  const dispatch = useAppDispatch();
  const [note, setNote] = useState(currentNote);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset note when modal opens with new content
  useEffect(() => {
    if (isOpen) {
      setNote(currentNote);
      setIsSubmitting(false);
      // Focus textarea after modal opens
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen, currentNote]);

  const handleSave = async () => {
    const trimmedNote = note.trim();
    if (!trimmedNote) return;

    setIsSubmitting(true);
    try {
      // Dispatch to Redux
      await dispatch(addTicketNote({ ticketId, text: trimmedNote })).unwrap();
      toast.success('Note added successfully');

      // Call legacy onSave callback if provided (backward compatibility)
      if (onSave) {
        onSave(ticketId, trimmedNote);
      }

      onClose();
    } catch (error) {
      console.error('Failed to add note:', error);
      toast.error('Failed to add note. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Save on Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    // Close on Escape
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const hasChanges = note.trim() !== (currentNote?.trim() || '');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-amber-600" />
            {currentNote ? 'Edit Note' : 'Add Note'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Ticket info */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="font-semibold text-gray-900">#{ticketNumber}</span>
            <span>•</span>
            <span>{clientName}</span>
          </div>

          {/* Note textarea */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a note about this ticket..."
              disabled={isSubmitting}
              className="w-full h-32 px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              maxLength={500}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {note.length}/500
            </div>
          </div>

          {/* Keyboard hint */}
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            <span>Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-mono">Cmd+Enter</kbd> to save</span>
          </p>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSubmitting || (!hasChanges && !note.trim())}
              className="px-4 bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                currentNote ? 'Update Note' : 'Add Note'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const AddNoteModal = memo(AddNoteModalComponent);
export default AddNoteModal;
