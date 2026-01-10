import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  loadDrafts,
  deleteDraft,
  resumeDraft,
  selectDrafts,
  selectDraftsLoading,
  selectDraftsError,
  DraftSale,
} from '@/store/slices/checkoutSlice';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FileText, Clock, User, DollarSign, Trash2, Play, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface DraftSalesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  onResumeDraft: (draft: DraftSale) => void;
}

/**
 * Drawer component that lists all saved draft sales.
 * Allows users to resume or delete drafts.
 */
export default function DraftSalesDrawer({
  open,
  onOpenChange,
  storeId,
  onResumeDraft,
}: DraftSalesDrawerProps) {
  const dispatch = useAppDispatch();
  const drafts = useAppSelector(selectDrafts);
  const isLoading = useAppSelector(selectDraftsLoading);
  const error = useAppSelector(selectDraftsError);

  useEffect(() => {
    if (open && storeId) {
      dispatch(loadDrafts(storeId));
    }
  }, [open, storeId, dispatch]);

  const handleResume = async (draft: DraftSale) => {
    try {
      await dispatch(resumeDraft(draft.ticketId)).unwrap();
      onResumeDraft(draft);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to resume draft:', error);
    }
  };

  const handleDelete = async (ticketId: string) => {
    try {
      await dispatch(deleteDraft(ticketId)).unwrap();
    } catch (error) {
      console.error('Failed to delete draft:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getTimeRemaining = (expiresAt?: string) => {
    if (!expiresAt) return null;
    const expiry = new Date(expiresAt);
    if (expiry < new Date()) return 'Expired';
    return `Expires ${formatDistanceToNow(expiry, { addSuffix: true })}`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]" data-testid="draft-sales-drawer">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Saved Drafts
          </SheetTitle>
          <SheetDescription>
            Resume a previous ticket or delete drafts you no longer need.
          </SheetDescription>
        </SheetHeader>

        <Separator className="my-4" />

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>Failed to load drafts</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : drafts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No saved drafts</p>
            <p className="text-sm">Drafts you save will appear here</p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-3 pr-4">
              {drafts.map((draft) => (
                <Card
                  key={draft.ticketId}
                  className="p-4 hover:bg-accent/50 transition-colors"
                  data-testid={`draft-item-${draft.ticketId}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {draft.clientName || 'Walk-in'}
                      </h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        Saved {formatDistanceToNow(new Date(draft.lastSavedAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="mb-1">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {formatCurrency(draft.totalAmount)}
                      </Badge>
                      {draft.expiresAt && (
                        <p className="text-xs text-muted-foreground">
                          {getTimeRemaining(draft.expiresAt)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Staff: {draft.staffName}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(draft.ticketId)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        data-testid={`delete-draft-${draft.ticketId}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleResume(draft)}
                        data-testid={`resume-draft-${draft.ticketId}`}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Resume
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
