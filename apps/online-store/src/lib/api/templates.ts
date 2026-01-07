/**
 * Templates API - Admin CRUD operations for templates
 * Uses localStorage for data persistence
 */

import {
  getAllTemplates,
  getTemplateById,
  createTemplate as storageCreateTemplate,
  updateTemplate as storageUpdateTemplate,
  deleteTemplate as storageDeleteTemplate,
  activateTemplate as storageActivateTemplate,
  getTemplateSections,
  updateTemplateSection as storageUpdateSection,
  reorderSections as storageReorderSections,
  addSection as storageAddSection,
  removeSection as storageRemoveSection,
  seedTemplateSections,
  type StorefrontTemplate,
  type TemplateSection,
} from '@/lib/storage/templateStorage';
import { Section } from '@/types/template';

/**
 * Get all templates
 */
export async function fetchAllTemplates(): Promise<StorefrontTemplate[]> {
  return getAllTemplates();
}

/**
 * Get template by ID
 */
export async function fetchTemplateById(id: string): Promise<StorefrontTemplate | null> {
  return getTemplateById(id);
}

/**
 * Create new template
 */
export async function createTemplate(
  data: Omit<StorefrontTemplate, 'createdAt' | 'updatedAt' | 'version'>
): Promise<StorefrontTemplate> {
  return storageCreateTemplate(data);
}

/**
 * Update template
 */
export async function updateTemplate(
  id: string,
  data: Partial<StorefrontTemplate>
): Promise<StorefrontTemplate | null> {
  return storageUpdateTemplate(id, data);
}

/**
 * Delete template
 */
export async function deleteTemplate(id: string): Promise<{ success: boolean; message?: string }> {
  const success = storageDeleteTemplate(id);
  return {
    success,
    message: success ? 'Template deleted successfully' : 'Failed to delete template (cannot delete active template)',
  };
}

/**
 * Publish template (set as active)
 */
export async function publishTemplate(id: string): Promise<{ success: boolean; message?: string }> {
  const success = storageActivateTemplate(id);
  return {
    success,
    message: success ? 'Template published successfully' : 'Failed to publish template',
  };
}

/**
 * Duplicate template
 */
export async function duplicateTemplate(id: string): Promise<StorefrontTemplate | null> {
  const template = getTemplateById(id);
  if (!template) return null;

  const sections = getTemplateSections(id);

  // Create new template
  const newTemplate = storageCreateTemplate({
    id: `${template.id}-copy-${Date.now()}`,
    name: `${template.name} (Copy)`,
    description: template.description,
    flowStyle: template.flowStyle,
    isActive: false,
  });

  // Duplicate sections
  sections.forEach((section) => {
    storageAddSection(newTemplate.id, {
      kind: section.kind,
      props: section.props,
    });
  });

  return newTemplate;
}

/**
 * Get template sections
 */
export async function fetchTemplateSections(templateId: string): Promise<TemplateSection[]> {
  return getTemplateSections(templateId);
}

/**
 * Update section
 */
export async function updateSection(
  sectionId: string,
  data: Partial<TemplateSection>
): Promise<TemplateSection | null> {
  return storageUpdateSection(sectionId, data);
}

/**
 * Reorder sections
 */
export async function reorderSections(templateId: string, sectionIds: string[]): Promise<void> {
  return storageReorderSections(templateId, sectionIds);
}

/**
 * Add section
 */
export async function addSection(
  templateId: string,
  sectionData: Omit<Section, 'id' | 'order'>
): Promise<TemplateSection> {
  return storageAddSection(templateId, sectionData);
}

/**
 * Remove section
 */
export async function removeSection(sectionId: string): Promise<{ success: boolean }> {
  const success = storageRemoveSection(sectionId);
  return { success };
}

/**
 * Import template from JSON
 */
export async function importTemplateFromJSON(
  templateData: any
): Promise<{ template: StorefrontTemplate; sections: TemplateSection[] }> {
  // Create template
  const template = storageCreateTemplate({
    id: templateData.id || `template-${Date.now()}`,
    name: templateData.name,
    description: templateData.description || '',
    flowStyle: templateData.flowStyle,
    isActive: false,
  });

  // Seed sections
  if (templateData.sections && Array.isArray(templateData.sections)) {
    seedTemplateSections(template.id, templateData.sections);
  }

  const sections = getTemplateSections(template.id);

  return { template, sections };
}
