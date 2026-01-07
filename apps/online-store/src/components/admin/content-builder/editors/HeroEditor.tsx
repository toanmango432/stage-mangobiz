import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ImageIcon, Link, Type, Palette } from 'lucide-react';
import type { PageSection } from '@/types/content-builder';

const heroSchema = z.object({
  headline: z.string().min(1, 'Headline is required'),
  subheadline: z.string().optional(),
  image: z.string().min(1, 'Image is required'),
  ctaText: z.string().min(1, 'CTA text is required'),
  ctaLink: z.string().min(1, 'CTA link is required'),
  height: z.enum(['small', 'medium', 'large']),
});

type HeroFormData = z.infer<typeof heroSchema>;

interface HeroEditorProps {
  section: PageSection;
  onUpdate: (settings: Record<string, any>) => void;
  onClose: () => void;
}

export const HeroEditor: React.FC<HeroEditorProps> = ({
  section,
  onUpdate,
  onClose,
}) => {
  const form = useForm<HeroFormData>({
    resolver: zodResolver(heroSchema),
    defaultValues: {
      headline: section.settings.headline || 'Welcome to our salon',
      subheadline: section.settings.subheadline || 'Experience luxury beauty services',
      image: section.settings.image || '/src/assets/hero-salon.jpg',
      ctaText: section.settings.ctaText || 'Book Now',
      ctaLink: section.settings.ctaLink || '/book',
      height: section.settings.height || 'large',
    },
  });

  const onSubmit = (data: HeroFormData) => {
    onUpdate(data);
    onClose();
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, you'd upload to a CDN
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        form.setValue('image', result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Type className="h-5 w-5" />
          <span>Edit Hero Section</span>
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
                      placeholder="Enter main headline"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subheadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subheadline</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter supporting text"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <Label>Background Image</Label>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Input
                    placeholder="Image URL or path"
                    {...form.register('image')}
                  />
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    className="flex items-center space-x-2"
                  >
                    <ImageIcon className="h-4 w-4" />
                    <span>Upload</span>
                  </Button>
                </div>
              </div>
              {form.watch('image') && (
                <div className="mt-2">
                  <img
                    src={form.watch('image')}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ctaText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CTA Button Text</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Book Now"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ctaLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CTA Link</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Link className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="/book"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="height"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Section Height</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select height" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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