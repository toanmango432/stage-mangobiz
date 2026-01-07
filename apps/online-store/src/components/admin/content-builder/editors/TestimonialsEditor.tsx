import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { MessageSquare } from 'lucide-react';
import type { PageSection } from '@/types/content-builder';

const testimonialsSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  layout: z.enum(['carousel', 'grid']),
  limit: z.number().min(1).max(12),
  showRating: z.boolean(),
});

type TestimonialsFormData = z.infer<typeof testimonialsSchema>;

interface TestimonialsEditorProps {
  section: PageSection;
  onUpdate: (settings: Record<string, any>) => void;
  onClose: () => void;
}

export const TestimonialsEditor: React.FC<TestimonialsEditorProps> = ({
  section,
  onUpdate,
  onClose,
}) => {
  const form = useForm<TestimonialsFormData>({
    resolver: zodResolver(testimonialsSchema),
    defaultValues: {
      title: section.settings.title || 'What Our Clients Say',
      layout: section.settings.layout || 'carousel',
      limit: section.settings.limit || 6,
      showRating: section.settings.showRating !== false,
    },
  });

  const onSubmit = (data: TestimonialsFormData) => {
    onUpdate(data);
    onClose();
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5" />
          <span>Edit Testimonials Section</span>
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
                      placeholder="What Our Clients Say"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="layout"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Layout</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select layout" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="carousel">Carousel</SelectItem>
                      <SelectItem value="grid">Grid</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose how testimonials are displayed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Reviews</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={12}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum number of testimonials to display (1-12)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="showRating"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Show Star Rating</FormLabel>
                    <FormDescription>
                      Display star ratings with testimonials
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
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
