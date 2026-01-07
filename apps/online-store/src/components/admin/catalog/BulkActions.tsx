import { Button } from "@/components/ui/button";
import { Trash2, Eye, EyeOff } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface BulkActionsProps {
  selectedCount: number;
  onDelete: () => void;
  onShowOnline?: () => void;
  onHideOnline?: () => void;
  onClear: () => void;
}

export const BulkActions = ({
  selectedCount,
  onDelete,
  onShowOnline,
  onHideOnline,
  onClear,
}: BulkActionsProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (selectedCount === 0) return null;

  const handleDelete = () => {
    onDelete();
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
        <span className="text-sm font-medium">
          {selectedCount} item{selectedCount > 1 ? "s" : ""} selected
        </span>
        <div className="flex gap-2 ml-auto">
          {onShowOnline && (
            <Button variant="outline" size="sm" onClick={onShowOnline}>
              <Eye className="h-4 w-4 mr-2" />
              Show Online
            </Button>
          )}
          {onHideOnline && (
            <Button variant="outline" size="sm" onClick={onHideOnline}>
              <EyeOff className="h-4 w-4 mr-2" />
              Hide Online
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear
          </Button>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} items?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
