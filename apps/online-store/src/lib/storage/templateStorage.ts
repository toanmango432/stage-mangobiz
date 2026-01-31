/**
 * Template Storage - localStorage CRUD operations for templates
 * Mock data only - no Supabase
 */

import { Template, Section } from '@/types/template';

const STORAGE_KEYS = {
  TEMPLATES: 'mango-templates',
  ACTIVE_TEMPLATE_ID: 'mango-active-template-id',
  TEMPLATE_SECTIONS: 'mango-template-sections',
};

export interface StorefrontTemplate {
  id: string;
  name: string;
  description: string;
  flowStyle: 'BookingFirst' | 'RetailFirst' | 'MembershipForward';
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateSection extends Section {
  templateId: string;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Initialize template storage with default data
 */
export function initializeTemplateStorage(): void {
  if (typeof window === 'undefined') return;

  const templates = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
  if (!templates) {
    // Create default "Salon Showcase" template
    const defaultTemplate: StorefrontTemplate = {
      id: 'salon-showcase',
      name: 'Salon Showcase',
      description: 'Complete salon website with team, reviews, and gallery',
      flowStyle: 'BookingFirst',
      isActive: true,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify([defaultTemplate]));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TEMPLATE_ID, 'salon-showcase');
  }
}

/**
 * Get the currently active template
 */
export function getActiveTemplate(): StorefrontTemplate | null {
  if (typeof window === 'undefined') return null;
  
  const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_TEMPLATE_ID);
  if (!activeId) return null;

  const templates = getAllTemplates();
  return templates.find(t => t.id === activeId) || null;
}

/**
 * Get all templates
 */
export function getAllTemplates(): StorefrontTemplate[] {
  if (typeof window === 'undefined') return [];
  
  const data = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
  return data ? JSON.parse(data) : [];
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): StorefrontTemplate | null {
  const templates = getAllTemplates();
  return templates.find(t => t.id === id) || null;
}

/**
 * Create new template
 */
export function createTemplate(data: Omit<StorefrontTemplate, 'createdAt' | 'updatedAt' | 'version'>): StorefrontTemplate {
  const templates = getAllTemplates();
  const newTemplate: StorefrontTemplate = {
    ...data,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  templates.push(newTemplate);
  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  return newTemplate;
}

/**
 * Update template
 */
export function updateTemplate(id: string, data: Partial<StorefrontTemplate>): StorefrontTemplate | null {
  const templates = getAllTemplates();
  const index = templates.findIndex(t => t.id === id);
  
  if (index === -1) return null;

  templates[index] = {
    ...templates[index],
    ...data,
    updatedAt: new Date().toISOString(),
    version: templates[index].version + 1,
  };

  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  return templates[index];
}

/**
 * Delete template
 */
export function deleteTemplate(id: string): boolean {
  const templates = getAllTemplates();
  const template = templates.find(t => t.id === id);
  
  // Cannot delete active template
  if (template?.isActive) {
    console.warn('Cannot delete active template');
    return false;
  }

  const filtered = templates.filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(filtered));

  // Also delete associated sections
  const sections = getAllSections();
  const filteredSections = sections.filter(s => s.templateId !== id);
  localStorage.setItem(STORAGE_KEYS.TEMPLATE_SECTIONS, JSON.stringify(filteredSections));

  return true;
}

/**
 * Activate template
 */
export function activateTemplate(id: string): boolean {
  const templates = getAllTemplates();
  const template = templates.find(t => t.id === id);
  
  if (!template) return false;

  // Deactivate all templates
  const updated = templates.map(t => ({
    ...t,
    isActive: t.id === id,
    updatedAt: t.id === id ? new Date().toISOString() : t.updatedAt,
  }));

  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(updated));
  localStorage.setItem(STORAGE_KEYS.ACTIVE_TEMPLATE_ID, id);
  
  return true;
}

/**
 * Get all sections
 */
function getAllSections(): TemplateSection[] {
  if (typeof window === 'undefined') return [];
  
  const data = localStorage.getItem(STORAGE_KEYS.TEMPLATE_SECTIONS);
  return data ? JSON.parse(data) : [];
}

/**
 * Get sections for a specific template
 */
export function getTemplateSections(templateId: string): TemplateSection[] {
  if (typeof window === 'undefined') return [];
  
  const sections = getAllSections();
  return sections
    .filter(s => s.templateId === templateId)
    .sort((a, b) => a.order - b.order);
}

/**
 * Update template section
 */
export function updateTemplateSection(sectionId: string, data: Partial<TemplateSection>): TemplateSection | null {
  const sections = getAllSections();
  const index = sections.findIndex(s => s.id === sectionId);
  
  if (index === -1) return null;

  sections[index] = {
    ...sections[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEYS.TEMPLATE_SECTIONS, JSON.stringify(sections));
  return sections[index];
}

/**
 * Reorder sections
 */
export function reorderSections(templateId: string, sectionIds: string[]): void {
  const sections = getAllSections();
  const templateSections = sections.filter(s => s.templateId === templateId);
  
  // Update order based on array position
  sectionIds.forEach((id, index) => {
    const section = templateSections.find(s => s.id === id);
    if (section) {
      section.order = index + 1;
      section.updatedAt = new Date().toISOString();
    }
  });

  localStorage.setItem(STORAGE_KEYS.TEMPLATE_SECTIONS, JSON.stringify(sections));
}

/**
 * Add section to template
 */
export function addSection(templateId: string, sectionData: Omit<Section, 'id' | 'order'>): TemplateSection {
  const sections = getAllSections();
  const templateSections = sections.filter(s => s.templateId === templateId);
  const maxOrder = templateSections.length > 0 ? Math.max(...templateSections.map(s => s.order)) : 0;

  const newSection: TemplateSection = {
    id: `section-${Date.now()}`,
    templateId,
    kind: sectionData.kind,
    order: maxOrder + 1,
    props: sectionData.props || {},
    isVisible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  sections.push(newSection);
  localStorage.setItem(STORAGE_KEYS.TEMPLATE_SECTIONS, JSON.stringify(sections));
  return newSection;
}

/**
 * Remove section
 */
export function removeSection(sectionId: string): boolean {
  const sections = getAllSections();
  const filtered = sections.filter(s => s.id !== sectionId);
  localStorage.setItem(STORAGE_KEYS.TEMPLATE_SECTIONS, JSON.stringify(filtered));
  return true;
}

/**
 * Seed sections from template JSON
 */
export function seedTemplateSections(templateId: string, sections: Section[]): void {
  const allSections = getAllSections();
  
  // Remove existing sections for this template
  const filtered = allSections.filter(s => s.templateId !== templateId);
  
  // Add new sections
  const newSections: TemplateSection[] = sections.map(section => ({
    ...section,
    templateId,
    isVisible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  filtered.push(...newSections);
  localStorage.setItem(STORAGE_KEYS.TEMPLATE_SECTIONS, JSON.stringify(filtered));
}
