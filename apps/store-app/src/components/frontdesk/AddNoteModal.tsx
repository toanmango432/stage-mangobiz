import { useState, useEffect, useRef, memo } from 'react';
import { StickyNote, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  ticketNumber: number;
  clientName: string;
  currentNote?: string;
  onSave: (ticketId: string, note: string) => void;
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
  const [note, setNote] = useState(currentNote);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset note when modal opens with new content
  useEffect(() => {
    if (isOpen) {
      setNote(currentNote);
      // Focus textarea after modal opens
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen, currentNote]);

  const handleSave = () => {
    onSave(ticketId, note.trim());
    onClose();
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
              className="w-full h-32 px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
              className="px-4"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges && !note.trim()}
              className="px-4 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {currentNote ? 'Update Note' : 'Add Note'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const AddNoteModal = memo(AddNoteModalComponent);
export default AddNoteModal;
