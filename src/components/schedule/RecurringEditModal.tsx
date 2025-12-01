/**
 * RecurringEditModal Component
 * Modal for choosing how to handle edits/deletes of recurring blocked time entries
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, CalendarRange, Trash2, X } from 'lucide-react';

export type RecurringEditAction = 'this' | 'thisAndFuture' | 'all';

interface RecurringEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entryName: string;
  entryDate: string;
  actionType: 'edit' | 'delete';
  onSelectAction: (action: RecurringEditAction) => void;
}

export function RecurringEditModal({
  open,
  onOpenChange,
  entryName,
  entryDate,
  actionType,
  onSelectAction,
}: RecurringEditModalProps) {
  const isDelete = actionType === 'delete';

  const handleAction = (action: RecurringEditAction) => {
    onSelectAction(action);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isDelete ? (
              <Trash2 className="h-5 w-5 text-destructive" />
            ) : (
              <Calendar className="h-5 w-5" />
            )}
            {isDelete ? 'Delete Recurring Event' : 'Edit Recurring Event'}
          </DialogTitle>
          <DialogDescription>
            This is a recurring event. How would you like to {isDelete ? 'delete' : 'edit'} "{entryName}"?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {/* This occurrence only */}
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3 px-4"
            onClick={() => handleAction('this')}
          >
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="font-medium">
                  {isDelete ? 'Delete this event only' : 'Edit this event only'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Only {entryDate} will be {isDelete ? 'deleted' : 'changed'}
                </p>
              </div>
            </div>
          </Button>

          {/* This and future occurrences */}
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3 px-4"
            onClick={() => handleAction('thisAndFuture')}
          >
            <div className="flex items-start gap-3">
              <CalendarRange className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="font-medium">
                  {isDelete ? 'Delete this and future events' : 'Edit this and future events'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {entryDate} and all following occurrences will be {isDelete ? 'deleted' : 'changed'}
                </p>
              </div>
            </div>
          </Button>

          {/* All occurrences */}
          <Button
            variant={isDelete ? 'destructive' : 'outline'}
            className="w-full justify-start h-auto py-3 px-4"
            onClick={() => handleAction('all')}
          >
            <div className="flex items-start gap-3">
              {isDelete ? (
                <Trash2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
              ) : (
                <CalendarRange className="h-5 w-5 mt-0.5 flex-shrink-0" />
              )}
              <div className="text-left">
                <p className="font-medium">
                  {isDelete ? 'Delete all events' : 'Edit all events'}
                </p>
                <p className="text-sm text-muted-foreground">
                  All occurrences in the series will be {isDelete ? 'deleted' : 'changed'}
                </p>
              </div>
            </div>
          </Button>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default RecurringEditModal;
