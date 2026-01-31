'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { ShoppingBag } from 'lucide-react';
import type { PageSection } from '@/types/content-builder';

const productsSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  columns: z.number().min(2).max(4),
  limit: z.number().min(1).max(20),
});

type ProductsFormData = z.infer<typeof productsSchema>;

interface ProductsEditorProps {
  section: PageSection;
  onUpdate: (settings: Record<string, any>) => void;
  onClose: () => void;
}

export const ProductsEditor: React.FC<ProductsEditorProps> = ({
  section,
  onUpdate,
  onClose,
}) => {
  const form = useForm<ProductsFormData>({
    resolver: zodResolver(productsSchema),
    defaultValues: {
      title: section.settings.title || 'Shop Products',
      description: section.settings.description || 'Premium beauty products',
      columns: section.settings.columns || 4,
      limit: section.settings.limit || 8,
    },
  });

  const onSubmit = (data: ProductsFormData) => {
    onUpdate(data);
    onClose();
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ShoppingBag className="h-5 w-5" />
          <span>Edit Products Grid</span>
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
                      placeholder="Shop Products"
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
                      placeholder="Premium beauty products"
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
              name="columns"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Columns</FormLabel>
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
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Number of products per row
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
                  <FormLabel>Number of Products</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum number of products to display (1-20)
                  </FormDescription>
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
