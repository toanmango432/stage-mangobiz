import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Megaphone } from 'lucide-react';
import type { PageSection } from '@/types/content-builder';

const ctaSchema = z.object({
  headline: z.string().min(1, 'Headline is required'),
  description: z.string().optional(),
  buttonText: z.string().min(1, 'Button text is required'),
  buttonLink: z.string().min(1, 'Button link is required'),
  backgroundColor: z.string().min(1, 'Background color is required'),
});

type CTAFormData = z.infer<typeof ctaSchema>;

interface CTAEditorProps {
  section: PageSection;
  onUpdate: (settings: Record<string, any>) => void;
  onClose: () => void;
}

export const CTAEditor: React.FC<CTAEditorProps> = ({
  section,
  onUpdate,
  onClose,
}) => {
  const form = useForm<CTAFormData>({
    resolver: zodResolver(ctaSchema),
    defaultValues: {
      headline: section.settings.headline || 'Ready to transform your look?',
      description: section.settings.description || 'Book your appointment today and experience the difference',
      buttonText: section.settings.buttonText || 'Book Now',
      buttonLink: section.settings.buttonLink || '/book',
      backgroundColor: section.settings.backgroundColor || '#8b5cf6',
    },
  });

  const onSubmit = (data: CTAFormData) => {
    onUpdate(data);
    onClose();
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Megaphone className="h-5 w-5" />
          <span>Edit Call to Action</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="headline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Headline</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter headline"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter description"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="buttonText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Button Text</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter button text"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="buttonLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Button Link</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="/book"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="backgroundColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Background Color</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        className="w-16 h-10 p-1"
                        {...field}
                      />
                      <Input
                        placeholder="#8b5cf6"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
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
