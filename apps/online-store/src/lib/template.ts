/**
 * Template Client
 * Main interface for loading and managing templates
 */

import { Template } from '@/types/template';
import {
  getActiveTemplate,
  getTemplateSections,
  type StorefrontTemplate,
  type TemplateSection,
} from '@/lib/storage/templateStorage';
import {
  publishTemplate as apiPublishTemplate,
  fetchAllTemplates,
  fetchTemplateById,
} from '@/lib/api/templates';

/**
 * Get the currently published template with sections
 * Falls back to default if API fails
 */
export async function getPublishedTemplate(): Promise<{ template: StorefrontTemplate; sections: TemplateSection[] }> {
  try {
    const template = getActiveTemplate();
    if (!template) {
      throw new Error('No active template found');
    }
    const sections = getTemplateSections(template.id);
    return { template, sections };
  } catch (error) {
    console.error('Failed to fetch published template:', error);
    // Fallback to importing the default template directly
    const defaultTemplate = await import('@/lib/seeds/templates/salon-showcase.json');
    const template: StorefrontTemplate = {
      id: defaultTemplate.default.id,
      name: defaultTemplate.default.name,
      description: defaultTemplate.default.description || '',
      flowStyle: defaultTemplate.default.flowStyle as 'BookingFirst' | 'RetailFirst' | 'MembershipForward',
      isActive: true,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const sections: TemplateSection[] = defaultTemplate.default.sections.map((s: any) => ({
      ...s,
      templateId: template.id,
      isVisible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    return { template, sections };
  }
}

/**
 * Get list of all available templates
 */
export async function getTemplatesList(): Promise<StorefrontTemplate[]> {
  try {
    return await fetchAllTemplates();
  } catch (error) {
    console.error('Failed to fetch templates list:', error);
    return [];
  }
}

/**
 * Get a specific template by ID
 */
export async function getTemplateById(id: string): Promise<StorefrontTemplate | null> {
  try {
    return await fetchTemplateById(id);
  } catch (error) {
    console.error(`Failed to fetch template ${id}:`, error);
    return null;
  }
}

/**
 * Publish a template (set as active)
 * Admin touchpoint for template switching
 */
export async function publishTemplate(templateId: string): Promise<{ success: boolean; message?: string }> {
  try {
    return await apiPublishTemplate(templateId);
  } catch (error) {
    console.error('Failed to publish template:', error);
    return {
      success: false,
      message: 'Failed to publish template',
    };
  }
}

/**
 * Get the ID of the currently published template
 * Useful for admin UI to show which template is active
 */
export function getCurrentTemplateId(): string {
  const template = getActiveTemplate();
  return template?.id || 'salon-showcase';
}

/**
 * Get sections for a template
 */
export function getSectionsByTemplate(templateId: string): TemplateSection[] {
  return getTemplateSections(templateId);
}

/**
 * Get visible sections only
 */
export function getVisibleSections(templateId: string): TemplateSection[] {
  return getTemplateSections(templateId).filter(s => s.isVisible);
}

/**
 * Get section props
 */
export function getSectionProps(sectionId: string): Record<string, any> {
  const template = getActiveTemplate();
  if (!template) return {};
  const sections = getTemplateSections(template.id);
  const section = sections.find(s => s.id === sectionId);
  return section?.props || {};
}
