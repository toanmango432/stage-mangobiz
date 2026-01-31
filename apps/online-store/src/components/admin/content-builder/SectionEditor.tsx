'use client';

import { useState, useEffect } from 'react';
import { Save, Eye, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SECTION_CONFIGS } from '@/lib/content-builder/section-configs';
import type { PageSection, SectionConfig } from '@/types/content-builder';

interface SectionEditorProps {
  section: PageSection;
  onSave: (section: PageSection) => void;
  onPreview: (section: PageSection) => void;
  onReset: () => void;
}

export const SectionEditor = ({ section, onSave, onPreview, onReset }: SectionEditorProps) => {
  const [settings, setSettings] = useState(section.settings);
  const [hasChanges, setHasChanges] = useState(false);

  const sectionConfig = SECTION_CONFIGS[section.type];
  if (!sectionConfig) {
    return <div>Section configuration not found</div>;
  }

  useEffect(() => {
    setHasChanges(JSON.stringify(settings) !== JSON.stringify(section.settings));
  }, [settings, section.settings]);

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    onSave({
      ...section,
      settings
    });
    setHasChanges(false);
  };

  const handleReset = () => {
    setSettings(section.settings);
    setHasChanges(false);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{sectionConfig.name}</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPreview({ ...section, settings })}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={!hasChanges}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{sectionConfig.description}</p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Section Settings */}
        <div className="space-y-4">
          <h4 className="font-medium">Section Settings</h4>
          <div className="space-y-4">
            {Object.entries(sectionConfig.schema.properties).map(([key, property]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key} className="text-sm font-medium">
                  {property.label}
                  {sectionConfig.schema.required?.includes(key) && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </Label>
                
                {property.description && (
                  <p className="text-xs text-muted-foreground">{property.description}</p>
                )}

                <SectionField
                  property={property}
                  value={settings[key] ?? property.default}
                  onChange={(value) => handleSettingChange(key, value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Section Status */}
        <div className="space-y-4">
          <h4 className="font-medium">Section Status</h4>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enabled" className="text-sm font-medium">Enabled</Label>
              <p className="text-xs text-muted-foreground">
                Show this section on the page
              </p>
            </div>
            <Switch
              id="enabled"
              checked={section.enabled}
              onCheckedChange={(checked) => onSave({ ...section, enabled: checked })}
            />
          </div>
        </div>

        {/* Change Indicator */}
        {hasChanges && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              You have unsaved changes. Click Save to apply them.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface SectionFieldProps {
  property: any;
  value: any;
  onChange: (value: any) => void;
}

const SectionField = ({ property, value, onChange }: SectionFieldProps) => {
  switch (property.type) {
    case 'text':
      return (
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={property.placeholder}
        />
      );

    case 'textarea':
      return (
        <Textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={property.placeholder}
          rows={3}
        />
      );

    case 'number':
      return (
        <Input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value))}
          min={property.min}
          max={property.max}
          placeholder={property.placeholder}
        />
      );

    case 'boolean':
      return (
        <Switch
          checked={value || false}
          onCheckedChange={onChange}
        />
      );

    case 'select':
      return (
        <Select value={value?.toString()} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder={property.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {property.options?.map((option: any) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'color':
      return (
        <div className="flex items-center gap-2">
          <Input
            type="color"
            value={value || '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className="w-16 h-10 p-1"
          />
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#000000"
            className="flex-1"
          />
        </div>
      );

    case 'image':
      return (
        <div className="space-y-2">
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={property.placeholder || 'Enter image URL'}
          />
          {value && (
            <div className="w-full h-32 bg-muted rounded-lg overflow-hidden">
              <img
                src={value}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
      );

    default:
      return (
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={property.placeholder}
        />
      );
  }
};
