// Content Builder Types

export type SectionType =
  | 'hero'
  | 'services-grid'
  | 'products-grid'
  | 'testimonials'
  | 'gallery'
  | 'team'
  | 'cta'
  | 'features'
  | 'stats'
  | 'faq'
  | 'contact'
  | 'newsletter';

export interface SectionConfig {
  id: string;
  type: SectionType;
  name: string;
  description: string;
  icon: string;
  category: 'content' | 'commerce' | 'social' | 'layout';
  schema: SectionSchema;
  defaults: Record<string, any>;
  preview?: string;
}

export interface SectionSchema {
  properties: Record<string, SchemaProperty>;
  required?: string[];
}

export interface SchemaProperty {
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'image' | 'color' | 'array';
  label: string;
  description?: string;
  default?: any;
  options?: Array<{ label: string; value: string | number }>;
  min?: number;
  max?: number;
  placeholder?: string;
}

export interface PageSection {
  id: string;
  type: SectionType;
  order: number;
  enabled: boolean;
  settings: Record<string, any>;
}

export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  sections: PageSection[];
  theme?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DragItem {
  id: string;
  type: SectionType;
  index: number;
}

