'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useCreateAnnouncement, useUpdateAnnouncement } from '@/hooks/useAnnouncements';
import { toast } from '@/hooks/use-toast';
import { Announcement, AnnouncementCategory, AnnouncementPriority } from '@/types/announcement';
import { AnnouncementPreview } from './AnnouncementPreview';

const announcementSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters').max(500, 'Content must be less than 500 characters'),
  category: z.enum(['hours', 'services', 'staff', 'policies', 'events']),
  priority: z.enum(['urgent', 'important', 'normal', 'info']),
  placement: z.enum(['global_bar', 'home_banner', 'updates_page_only', 'hidden']),
  pinned: z.boolean().default(false),
  startsAt: z.string(),
  endsAt: z.string().optional(),
});

type AnnouncementFormData = z.infer<typeof announcementSchema>;

interface AnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcement?: Announcement | null;
}

export const AnnouncementDialog = ({ open, onOpenChange, announcement }: AnnouncementDialogProps) => {
  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();
  const isEditing = !!announcement;

  const form = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: '',
      content: '',
      category: 'hours',
      priority: 'normal',
      placement: 'global_bar',
      pinned: false,
      startsAt: new Date().toISOString().split('T')[0],
      endsAt: '',
    },
  });

  useEffect(() => {
    if (announcement) {
      form.reset({
        title: announcement.title,
        content: announcement.content,
        category: announcement.category,
        priority: announcement.priority,
        placement: 'global_bar', // Default, would need to be stored in announcement type
        pinned: false,
        startsAt: announcement.startsAt.split('T')[0],
        endsAt: announcement.endsAt ? announcement.endsAt.split('T')[0] : '',
      });
    } else {
      form.reset({
        title: '',
        content: '',
        category: 'hours',
        priority: 'normal',
        placement: 'global_bar',
        pinned: false,
        startsAt: new Date().toISOString().split('T')[0],
        endsAt: '',
      });
    }
  }, [announcement, form]);

  const onSubmit = async (data: AnnouncementFormData) => {
    const payload: any = {
      title: data.title,
      content: data.content,
      category: data.category,
      priority: data.priority,
      placement: data.placement,
      pinned: data.pinned,
      startsAt: new Date(data.startsAt).toISOString(),
      endsAt: data.endsAt ? new Date(data.endsAt).toISOString() : undefined,
    };

    if (isEditing) {
      updateAnnouncement.mutate(
        { id: announcement.id, updates: payload },
        {
          onSuccess: () => {
            toast({ title: 'Announcement updated' });
            onOpenChange(false);
          },
          onError: (error) => {
            toast({ title: 'Failed to update', description: error.message, variant: 'destructive' });
          },
        }
      );
    } else {
      createAnnouncement.mutate(payload, {
        onSuccess: () => {
          toast({ title: 'Announcement created' });
          onOpenChange(false);
        },
        onError: (error) => {
          toast({ title: 'Failed to create', description: error.message, variant: 'destructive' });
        },
      });
    }
  };

  const watchedValues = form.watch();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Announcement' : 'Create New Announcement'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update announcement details' : 'Create a new announcement for your store'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {/* Title */}
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...form.register('title')}
                placeholder="Holiday Hours: Closed Dec 25-26"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.title.message}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={form.watch('category')} onValueChange={(v) => form.setValue('category', v as AnnouncementCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="services">Services</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="policies">Policies</SelectItem>
                  <SelectItem value="events">Events</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div>
              <Label>Priority *</Label>
              <RadioGroup value={form.watch('priority')} onValueChange={(v) => form.setValue('priority', v as AnnouncementPriority)}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                  <div className="flex items-center space-x-2 border rounded-lg p-3">
                    <RadioGroupItem value="info" id="info" />
                    <Label htmlFor="info" className="cursor-pointer">Info</Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3">
                    <RadioGroupItem value="normal" id="normal" />
                    <Label htmlFor="normal" className="cursor-pointer">Normal</Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3">
                    <RadioGroupItem value="important" id="important" />
                    <Label htmlFor="important" className="cursor-pointer">Important</Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3">
                    <RadioGroupItem value="urgent" id="urgent" />
                    <Label htmlFor="urgent" className="cursor-pointer">Urgent</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Content */}
            <div>
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                {...form.register('content')}
                placeholder="Our salon will be closed on December 25th and 26th for the holidays..."
                rows={4}
              />
              {form.formState.errors.content && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.content.message}</p>
              )}
            </div>

            <Separator />

            {/* Display Settings */}
            <div>
              <Label>Display Settings</Label>
              <p className="text-sm text-muted-foreground mb-3">Where to show this announcement</p>
              <RadioGroup value={form.watch('placement')} onValueChange={(v) => form.setValue('placement', v as any)}>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 border rounded-lg p-3">
                    <RadioGroupItem value="global_bar" id="global_bar" />
                    <Label htmlFor="global_bar" className="cursor-pointer flex-1">
                      Global Bar (sticky top bar, all pages)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3">
                    <RadioGroupItem value="home_banner" id="home_banner" />
                    <Label htmlFor="home_banner" className="cursor-pointer flex-1">
                      Home Banner (banner block on home page)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3">
                    <RadioGroupItem value="updates_page_only" id="updates_page_only" />
                    <Label htmlFor="updates_page_only" className="cursor-pointer flex-1">
                      Updates Page Only
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3">
                    <RadioGroupItem value="hidden" id="hidden" />
                    <Label htmlFor="hidden" className="cursor-pointer flex-1">
                      Hidden (draft mode)
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Pin to Top */}
            {(form.watch('placement') === 'global_bar' || form.watch('placement') === 'home_banner') && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="pinned"
                  checked={form.watch('pinned')}
                  onCheckedChange={(v) => form.setValue('pinned', v)}
                />
                <Label htmlFor="pinned" className="cursor-pointer">
                  Pin to top (always show first)
                </Label>
              </div>
            )}

            <Separator />

            {/* Scheduling */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startsAt">Start Date *</Label>
                <Input
                  id="startsAt"
                  type="date"
                  {...form.register('startsAt')}
                />
              </div>
              <div>
                <Label htmlFor="endsAt">End Date (optional)</Label>
                <Input
                  id="endsAt"
                  type="date"
                  {...form.register('endsAt')}
                />
              </div>
            </div>

            <Separator />

            {/* Preview */}
            <div>
              <Label>Preview</Label>
              <div className="mt-2">
                <AnnouncementPreview
                  title={watchedValues.title || 'Announcement Title'}
                  category={watchedValues.category}
                  priority={watchedValues.priority}
                  content={watchedValues.content || 'Announcement content...'}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createAnnouncement.isPending || updateAnnouncement.isPending}>
              {isEditing ? 'Update' : 'Create'} Announcement
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
