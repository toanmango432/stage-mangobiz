import { useState, useEffect, useRef, memo } from 'react';
import { StickyNote, MessageSquare, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AddStaffNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffId: number;
  staffName: string;
  currentNote?: string;
  onSave: (staffId: number, note: string) => void;
}

function AddStaffNoteModalComponent({
  isOpen,
  onClose,
  staffId,
  staffName,
  currentNote = '',
  onSave,
}: AddStaffNoteModalProps) {
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
    onSave(staffId, note.trim());
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
            <StickyNote className="w-5 h-5 text-teal-600" />
            {currentNote ? 'Edit Staff Note' : 'Add Staff Note'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Staff info */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <User className="w-4 h-4 text-teal-600" />
            <span className="font-semibold text-gray-900">{staffName}</span>
          </div>

          {/* Note textarea */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a note about this team member..."
              className="w-full h-32 px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
              className="px-4 bg-teal-600 hover:bg-teal-700 text-white"
            >
              {currentNote ? 'Update Note' : 'Add Note'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const AddStaffNoteModal = memo(AddStaffNoteModalComponent);
export default AddStaffNoteModal;
