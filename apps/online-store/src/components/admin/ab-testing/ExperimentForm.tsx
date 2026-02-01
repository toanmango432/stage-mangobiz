'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Settings, 
  Target,
  Users,
  Calendar,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ABTestExperiment, TestType, TestStatus } from '@/types/ab-test';

const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Variant name is required'),
  description: z.string().optional(),
  weight: z.number().min(1).max(100),
  config: z.record(z.any()).optional()
});

const experimentSchema = z.object({
  name: z.string().min(1, 'Experiment name is required'),
  description: z.string().optional(),
  type: z.enum(['promotion', 'hero', 'cta', 'pricing', 'layout', 'content', 'other']),
  targetAudience: z.string().optional(),
  variants: z.array(variantSchema).min(2, 'At least 2 variants are required'),
  successMetric: z.string().min(1, 'Success metric is required'),
  minimumDetectableEffect: z.number().min(0.01).max(1),
  confidenceLevel: z.number().min(0.8).max(0.99),
  maxDuration: z.number().min(1).max(365),
  autoConclude: z.boolean().default(true)
});

type ExperimentFormData = z.infer<typeof experimentSchema>;

interface ExperimentFormProps {
  experiment?: ABTestExperiment;
  onSave: (experiment: Omit<ABTestExperiment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const TEST_TYPES = [
  { value: 'promotion', label: 'Promotion', description: 'Test different promotional offers' },
  { value: 'hero', label: 'Hero Section', description: 'Test hero section headlines and CTAs' },
  { value: 'cta', label: 'Call-to-Action', description: 'Test button text and placement' },
  { value: 'pricing', label: 'Pricing Display', description: 'Test pricing presentation' },
  { value: 'layout', label: 'Layout', description: 'Test different page layouts' },
  { value: 'content', label: 'Content', description: 'Test different content variations' },
  { value: 'other', label: 'Other', description: 'Custom experiment type' }
];

const SUCCESS_METRICS = [
  { value: 'conversion', label: 'Conversion Rate', description: 'Percentage of visitors who convert' },
  { value: 'click_through', label: 'Click-Through Rate', description: 'Percentage who click on CTA' },
  { value: 'engagement', label: 'Engagement Rate', description: 'Time spent or interactions' },
  { value: 'signup', label: 'Signup Rate', description: 'Percentage who sign up' },
  { value: 'purchase', label: 'Purchase Rate', description: 'Percentage who make a purchase' }
];

export const ExperimentForm: React.FC<ExperimentFormProps> = ({
  experiment,
  onSave,
  onCancel
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Convert ABTestExperiment.targetAudience object to string for form
  const getTargetAudienceString = (): string => {
    if (!experiment?.targetAudience) return '';
    const { segments } = experiment.targetAudience;
    return segments?.join(', ') || '';
  };

  const form = useForm<ExperimentFormData>({
    resolver: zodResolver(experimentSchema),
    defaultValues: {
      name: experiment?.name || '',
      description: experiment?.description || '',
      type: experiment?.type || 'promotion',
      targetAudience: getTargetAudienceString(),
      variants: experiment?.variants || [
        { name: 'Control', description: 'Original version', weight: 50, config: {} },
        { name: 'Variant A', description: 'Test version', weight: 50, config: {} }
      ],
      successMetric: experiment?.successMetrics?.primary || 'conversion',
      minimumDetectableEffect: experiment?.minimumDetectableEffect || 0.05,
      confidenceLevel: experiment?.confidenceLevel || 0.95,
      maxDuration: experiment?.maxDuration || 30,
      autoConclude: experiment?.autoConclude ?? true
    }
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'variants'
  });

  const addVariant = () => {
    const variantCount = fields.length;
    append({
      name: `Variant ${String.fromCharCode(65 + variantCount)}`,
      description: '',
      weight: Math.floor(100 / (variantCount + 1)),
      config: {}
    });
  };

  const duplicateVariant = (index: number) => {
    const variant = fields[index];
    append({
      name: `${variant.name} Copy`,
      description: variant.description,
      weight: variant.weight,
      config: { ...variant.config }
    });
  };

  const normalizeWeights = () => {
    const variants = form.getValues('variants');
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    
    if (totalWeight !== 100) {
      const normalizedVariants = variants.map(variant => ({
        ...variant,
        weight: Math.round((variant.weight / totalWeight) * 100)
      }));
      
      // Ensure total is exactly 100
      const newTotal = normalizedVariants.reduce((sum, v) => sum + v.weight, 0);
      if (newTotal !== 100) {
        normalizedVariants[0].weight += (100 - newTotal);
      }
      
      form.setValue('variants', normalizedVariants);
    }
  };

  const onSubmit = async (data: ExperimentFormData) => {
    setIsSubmitting(true);
    try {
      // Normalize weights before saving
      normalizeWeights();

      // Convert form data to ABTestExperiment format
      const experimentData: Omit<ABTestExperiment, 'id' | 'createdAt' | 'updatedAt'> = {
        name: data.name,
        description: data.description || '',
        type: data.type,
        status: 'draft' as TestStatus,
        variants: data.variants.map((variant, index) => ({
          id: variant.id || `variant-${index}`,
          name: variant.name,
          description: variant.description || '',
          weight: variant.weight,
          config: variant.config || {},
          visitors: 0,
          conversions: 0
        })),
        // Convert string targetAudience to object format
        targetAudience: data.targetAudience ? {
          segments: data.targetAudience.split(',').map(s => s.trim()).filter(Boolean)
        } : undefined,
        // Convert successMetric string to successMetrics object
        successMetrics: {
          primary: data.successMetric
        },
        minimumDetectableEffect: data.minimumDetectableEffect,
        confidenceLevel: data.confidenceLevel,
        maxDuration: data.maxDuration,
        autoConclude: data.autoConclude
      };

      onSave(experimentData);
    } catch (error) {
      console.error('Failed to save experiment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = form.watch('type');
  const variants = form.watch('variants');
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5" />
          <span>{experiment ? 'Edit Experiment' : 'Create A/B Test'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experiment Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Hero CTA Test" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Test Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select test type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TEST_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-sm text-gray-500">{type.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what you're testing and why..."
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetAudience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Audience (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., New visitors, Mobile users" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Variants */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Test Variants</h3>
                <div className="flex items-center space-x-2">
                  <Badge variant={totalWeight === 100 ? "default" : "destructive"}>
                    Total Weight: {totalWeight}%
                  </Badge>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addVariant}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Variant
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Variant {index + 1}</h4>
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => duplicateVariant(index)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {fields.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`variants.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Variant name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`variants.${index}.weight`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Weight (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                max="100"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`variants.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input placeholder="Brief description" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Test Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Test Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="successMetric"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Success Metric</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select success metric" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SUCCESS_METRICS.map((metric) => (
                            <SelectItem key={metric.value} value={metric.value}>
                              <div>
                                <div className="font-medium">{metric.label}</div>
                                <div className="text-sm text-gray-500">{metric.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confidenceLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confidence Level</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseFloat(value))} 
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0.90">90% (0.10 p-value)</SelectItem>
                          <SelectItem value="0.95">95% (0.05 p-value)</SelectItem>
                          <SelectItem value="0.99">99% (0.01 p-value)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="minimumDetectableEffect"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Detectable Effect</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0.01" 
                          max="1"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0.05)}
                        />
                      </FormControl>
                      <p className="text-sm text-gray-500">
                        Minimum improvement to detect (e.g., 0.05 = 5%)
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Duration (days)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          max="365"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="autoConclude"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Auto-conclude when significant
                      </FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Automatically end the test when statistical significance is reached
                      </div>
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
            </div>

            {/* Sample Size Estimation */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Sample Size Estimation</h4>
                <p className="text-blue-700 text-sm">
                  Based on your configuration, you'll need approximately{' '}
                  <strong>
                    {Math.ceil(
                      (2 * Math.pow(1.96, 2) * 0.5 * 0.5) / 
                      Math.pow(form.watch('minimumDetectableEffect'), 2)
                    )}
                  </strong>{' '}
                  visitors per variant to detect a{' '}
                  {(form.watch('minimumDetectableEffect') * 100).toFixed(1)}% improvement with{' '}
                  {(form.watch('confidenceLevel') * 100).toFixed(0)}% confidence.
                </p>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || totalWeight !== 100}
              >
                {isSubmitting ? 'Saving...' : (experiment ? 'Update' : 'Create')} Experiment
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
