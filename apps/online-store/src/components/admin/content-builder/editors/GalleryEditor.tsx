import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ImageIcon, Grid } from 'lucide-react';
import type { PageSection } from '@/types/content-builder';

const gallerySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  columns: z.number().min(2).max(5),
  limit: z.number().min(1).max(24),
});

type GalleryFormData = z.infer<typeof gallerySchema>;

interface GalleryEditorProps {
  section: PageSection;
  onUpdate: (settings: Record<string, any>) => void;
  onClose: () => void;
}

export const GalleryEditor: React.FC<GalleryEditorProps> = ({
  section,
  onUpdate,
  onClose,
}) => {
  const form = useForm<GalleryFormData>({
    resolver: zodResolver(gallerySchema),
    defaultValues: {
      title: section.settings.title || 'Our Work',
      columns: section.settings.columns || 4,
      limit: section.settings.limit || 12,
    },
  });

  const onSubmit = (data: GalleryFormData) => {
    onUpdate(data);
    onClose();
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ImageIcon className="h-5 w-5" />
          <span>Edit Gallery Section</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Section Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Our Work"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="columns"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Columns</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select columns" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="2">2 Columns</SelectItem>
                        <SelectItem value="3">3 Columns</SelectItem>
                        <SelectItem value="4">4 Columns</SelectItem>
                        <SelectItem value="5">5 Columns</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Images</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="24"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Grid className="h-4 w-4" />
                <Label className="text-sm font-medium">Preview Layout</Label>
              </div>
              <div className="text-xs text-muted-foreground">
                {form.watch('columns')} columns × {Math.ceil((form.watch('limit') || 12) / (form.watch('columns') || 4))} rows
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};