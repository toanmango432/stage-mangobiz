/**
 * Form Template Builder
 * PRD Reference: 2.3.4 Consultation Forms - Form Template Configuration
 *
 * Allows staff to:
 * - Create and edit form templates
 * - Add/remove/reorder sections
 * - Configure section types
 * - Preview the form
 */

import React, { useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type {
  FormTemplate,
  FormSection,
  FormSectionType,
  FormSendMode,
  FormFrequency,
} from '../../types/form';
import { FormCompletionPortal } from './FormCompletionPortal';

interface FormBuilderProps {
  template?: FormTemplate;
  onSave: (template: Omit<FormTemplate, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>) => Promise<void>;
  onCancel: () => void;
  storeId: string;
  availableServices?: { id: string; name: string }[];
}

// Section type options
const SECTION_TYPES: { type: FormSectionType; label: string; description: string; icon: string }[] = [
  { type: 'info_text', label: 'Information Text', description: 'Display-only text or instructions', icon: '📝' },
  { type: 'text_input', label: 'Text Input', description: 'Single or multi-line text field', icon: '✏️' },
  { type: 'single_choice', label: 'Single Choice', description: 'Radio buttons for one selection', icon: '🔘' },
  { type: 'multi_choice', label: 'Multiple Choice', description: 'Checkboxes for multiple selections', icon: '☑️' },
  { type: 'date_picker', label: 'Date Picker', description: 'Date selection field', icon: '📅' },
  { type: 'number_input', label: 'Number Input', description: 'Numeric value field', icon: '🔢' },
  { type: 'consent_checkbox', label: 'Consent Checkbox', description: 'Agreement checkbox with text', icon: '✅' },
  { type: 'signature', label: 'Signature', description: 'Electronic signature capture', icon: '✍️' },
  { type: 'client_details', label: 'Client Details', description: 'Pre-filled client information', icon: '👤' },
];

export const FormBuilder: React.FC<FormBuilderProps> = ({
  template,
  onSave,
  onCancel,
  storeId,
  availableServices = [],
}) => {
  // Form state
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [sendMode, setSendMode] = useState<FormSendMode>(template?.sendMode || 'manual');
  const [frequency, setFrequency] = useState<FormFrequency>(template?.frequency || 'once');
  const [linkedServiceIds, setLinkedServiceIds] = useState<string[]>(template?.linkedServiceIds || []);
  const [requiresSignature, setRequiresSignature] = useState(template?.requiresSignature ?? true);
  const [sendBeforeHours, setSendBeforeHours] = useState(template?.sendBeforeHours || 24);
  const [sections, setSections] = useState<FormSection[]>(template?.sections || []);
  const [isActive, setIsActive] = useState(template?.isActive ?? true);

  // UI state
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get selected section
  const selectedSection = useMemo(() =>
    sections.find(s => s.id === selectedSectionId),
    [sections, selectedSectionId]
  );

  // Sorted sections
  const sortedSections = useMemo(() =>
    [...sections].sort((a, b) => a.order - b.order),
    [sections]
  );

  // Add new section
  const handleAddSection = useCallback((type: FormSectionType) => {
    const newSection: FormSection = {
      id: uuidv4(),
      type,
      label: getDefaultLabel(type),
      required: type !== 'info_text',
      config: getDefaultConfig(type),
      order: sections.length + 1,
    };

    setSections(prev => [...prev, newSection]);
    setSelectedSectionId(newSection.id);
    setShowAddSection(false);
  }, [sections.length]);

  // Update section
  const handleUpdateSection = useCallback((id: string, updates: Partial<FormSection>) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  // Delete section
  const handleDeleteSection = useCallback((id: string) => {
    setSections(prev => prev.filter(s => s.id !== id));
    if (selectedSectionId === id) {
      setSelectedSectionId(null);
    }
  }, [selectedSectionId]);

  // Move section up
  const handleMoveUp = useCallback((id: string) => {
    setSections(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex(s => s.id === id);
      if (index <= 0) return prev;

      const newSections = [...sorted];
      [newSections[index - 1].order, newSections[index].order] =
        [newSections[index].order, newSections[index - 1].order];
      return newSections;
    });
  }, []);

  // Move section down
  const handleMoveDown = useCallback((id: string) => {
    setSections(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex(s => s.id === id);
      if (index < 0 || index >= sorted.length - 1) return prev;

      const newSections = [...sorted];
      [newSections[index].order, newSections[index + 1].order] =
        [newSections[index + 1].order, newSections[index].order];
      return newSections;
    });
  }, []);

  // Validate form
  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Form name is required';
    }

    if (sections.length === 0) {
      newErrors.sections = 'Add at least one section';
    }

    if (sendMode === 'automatic' && linkedServiceIds.length === 0) {
      newErrors.linkedServices = 'Select at least one service for automatic forms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, sections, sendMode, linkedServiceIds]);

  // Save form
  const handleSave = useCallback(async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      await onSave({
        storeId,
        name: name.trim(),
        description: description.trim() || undefined,
        sendMode,
        frequency: sendMode === 'automatic' ? frequency : undefined,
        linkedServiceIds: sendMode === 'automatic' ? linkedServiceIds : undefined,
        requiresSignature,
        sendBeforeHours: sendMode === 'automatic' ? sendBeforeHours : undefined,
        reminderEnabled: sendMode === 'automatic',
        reminderIntervalHours: 12,
        expirationHours: 72,
        sections,
        isActive,
        isBuiltIn: false,
      });
    } finally {
      setIsSaving(false);
    }
  }, [validate, name, description, sendMode, frequency, linkedServiceIds, requiresSignature, sendBeforeHours, sections, isActive, storeId, onSave]);

  // Preview template
  const previewTemplate = useMemo((): FormTemplate => ({
    id: 'preview',
    storeId,
    name: name || 'Untitled Form',
    description,
    sendMode,
    frequency,
    linkedServiceIds,
    requiresSignature,
    sendBeforeHours,
    sections,
    isActive,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncStatus: 'local',
  }), [name, description, sendMode, frequency, linkedServiceIds, requiresSignature, sendBeforeHours, sections, isActive, storeId]);

  if (showPreview) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900/50">
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setShowPreview(false)}
            className="px-4 py-2 bg-white rounded-lg shadow-lg font-medium text-gray-700 hover:bg-gray-50"
          >
            Close Preview
          </button>
        </div>
        <FormCompletionPortal
          template={previewTemplate}
          clientInfo={{
            name: 'John Doe',
            email: 'john@example.com',
            phone: '(555) 123-4567',
          }}
          onSubmit={async () => { setShowPreview(false); }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Left Panel - Sections List */}
      <div className="w-80 border-r border-gray-200 bg-gray-50 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-white">
          <h2 className="font-semibold text-gray-900">Form Sections</h2>
          <p className="text-sm text-gray-500 mt-1">{sections.length} sections</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {sortedSections.map((section, index) => (
            <div
              key={section.id}
              onClick={() => setSelectedSectionId(section.id)}
              className={`
                p-3 rounded-lg border cursor-pointer transition-all
                ${selectedSectionId === section.id
                  ? 'border-cyan-500 bg-cyan-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {SECTION_TYPES.find(t => t.type === section.type)?.icon || '📄'}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{section.label}</p>
                    <p className="text-xs text-gray-500">
                      {SECTION_TYPES.find(t => t.type === section.type)?.label}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleMoveUp(section.id); }}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleMoveDown(section.id); }}
                    disabled={index === sortedSections.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>
          ))}

          {sections.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No sections yet</p>
              <p className="text-xs mt-1">Click "Add Section" to get started</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-white">
          <button
            onClick={() => setShowAddSection(true)}
            className="w-full py-2 px-4 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors"
          >
            + Add Section
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {template ? 'Edit Form Template' : 'Create Form Template'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPreview(true)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Preview
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">Basic Information</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Form Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., COVID-19 Health Screening"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description shown to clients"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={requiresSignature}
                      onChange={(e) => setRequiresSignature(e.target.checked)}
                      className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500"
                    />
                    <span className="text-sm text-gray-700">Requires signature</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Send Mode */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">Delivery Settings</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Send Mode</label>
                  <div className="flex gap-4">
                    <label className={`
                      flex-1 p-4 border rounded-lg cursor-pointer transition-colors
                      ${sendMode === 'manual' ? 'border-cyan-500 bg-cyan-50' : 'border-gray-200'}
                    `}>
                      <input
                        type="radio"
                        name="sendMode"
                        value="manual"
                        checked={sendMode === 'manual'}
                        onChange={() => setSendMode('manual')}
                        className="sr-only"
                      />
                      <p className="font-medium text-gray-900">Manual</p>
                      <p className="text-sm text-gray-500 mt-1">Send on-demand to specific clients</p>
                    </label>

                    <label className={`
                      flex-1 p-4 border rounded-lg cursor-pointer transition-colors
                      ${sendMode === 'automatic' ? 'border-cyan-500 bg-cyan-50' : 'border-gray-200'}
                    `}>
                      <input
                        type="radio"
                        name="sendMode"
                        value="automatic"
                        checked={sendMode === 'automatic'}
                        onChange={() => setSendMode('automatic')}
                        className="sr-only"
                      />
                      <p className="font-medium text-gray-900">Automatic</p>
                      <p className="text-sm text-gray-500 mt-1">Send before linked service appointments</p>
                    </label>
                  </div>
                </div>

                {sendMode === 'automatic' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Linked Services *
                      </label>
                      <div className="space-y-2 max-h-40 overflow-y-auto p-2 border border-gray-300 rounded-lg">
                        {availableServices.map(service => (
                          <label key={service.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={linkedServiceIds.includes(service.id)}
                              onChange={(e) => {
                                setLinkedServiceIds(prev =>
                                  e.target.checked
                                    ? [...prev, service.id]
                                    : prev.filter(id => id !== service.id)
                                );
                              }}
                              className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500"
                            />
                            <span className="text-sm text-gray-700">{service.name}</span>
                          </label>
                        ))}
                        {availableServices.length === 0 && (
                          <p className="text-sm text-gray-500">No services available</p>
                        )}
                      </div>
                      {errors.linkedServices && (
                        <p className="text-sm text-red-600 mt-1">{errors.linkedServices}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Send Before (hours)
                        </label>
                        <input
                          type="number"
                          value={sendBeforeHours}
                          onChange={(e) => setSendBeforeHours(Number(e.target.value))}
                          min={1}
                          max={168}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Frequency
                        </label>
                        <select
                          value={frequency}
                          onChange={(e) => setFrequency(e.target.value as FormFrequency)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                          <option value="every_time">Every appointment</option>
                          <option value="once">Once only</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Selected Section Editor */}
            {selectedSection && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Edit Section</h3>
                  <button
                    onClick={() => handleDeleteSection(selectedSection.id)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>

                <SectionEditor
                  section={selectedSection}
                  onUpdate={(updates) => handleUpdateSection(selectedSection.id, updates)}
                />
              </div>
            )}

            {errors.sections && (
              <p className="text-sm text-red-600 text-center">{errors.sections}</p>
            )}
          </div>
        </div>
      </div>

      {/* Add Section Modal */}
      {showAddSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Add Section</h3>
              <button
                onClick={() => setShowAddSection(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-3">
                {SECTION_TYPES.map((sectionType) => (
                  <button
                    key={sectionType.type}
                    onClick={() => handleAddSection(sectionType.type)}
                    className="p-4 border border-gray-200 rounded-lg text-left hover:border-cyan-500 hover:bg-cyan-50 transition-colors"
                  >
                    <span className="text-2xl">{sectionType.icon}</span>
                    <p className="font-medium text-gray-900 mt-2">{sectionType.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{sectionType.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Section Editor Component
interface SectionEditorProps {
  section: FormSection;
  onUpdate: (updates: Partial<FormSection>) => void;
}

const SectionEditor: React.FC<SectionEditorProps> = ({ section, onUpdate }) => {
  const updateConfig = (configUpdates: Record<string, unknown>) => {
    onUpdate({ config: { ...section.config, ...configUpdates } });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
        <input
          type="text"
          value={section.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
        <input
          type="text"
          value={section.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Help text shown below the label"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      {section.type !== 'info_text' && section.type !== 'client_details' && (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={section.required}
            onChange={(e) => onUpdate({ required: e.target.checked })}
            className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500"
          />
          <span className="text-sm text-gray-700">Required field</span>
        </label>
      )}

      {/* Type-specific config */}
      {section.type === 'info_text' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content (Markdown)</label>
          <textarea
            value={(section.config as { content?: string })?.content || ''}
            onChange={(e) => updateConfig({ content: e.target.value })}
            rows={4}
            placeholder="## Heading&#10;&#10;Your content here..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-sm"
          />
        </div>
      )}

      {section.type === 'text_input' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder</label>
            <input
              type="text"
              value={(section.config as { placeholder?: string })?.placeholder || ''}
              onChange={(e) => updateConfig({ placeholder: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={(section.config as { multiline?: boolean })?.multiline || false}
              onChange={(e) => updateConfig({ multiline: e.target.checked })}
              className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500"
            />
            <span className="text-sm text-gray-700">Multi-line input</span>
          </label>
        </div>
      )}

      {(section.type === 'single_choice' || section.type === 'multi_choice') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Options (one per line)</label>
          <textarea
            value={((section.config as { options?: string[] })?.options || []).join('\n')}
            onChange={(e) => updateConfig({ options: e.target.value.split('\n').filter(o => o.trim()) })}
            rows={4}
            placeholder="Option 1&#10;Option 2&#10;Option 3"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      )}

      {section.type === 'consent_checkbox' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Consent Text</label>
          <textarea
            value={(section.config as { consentText?: string })?.consentText || ''}
            onChange={(e) => updateConfig({ consentText: e.target.value })}
            rows={3}
            placeholder="I agree to the terms and conditions..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      )}

      {section.type === 'client_details' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Fields to display</label>
          <div className="space-y-2">
            {['name', 'email', 'phone', 'birthday', 'address'].map(field => (
              <label key={field} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={((section.config as { fields?: string[] })?.fields || []).includes(field)}
                  onChange={(e) => {
                    const currentFields = (section.config as { fields?: string[] })?.fields || [];
                    const newFields = e.target.checked
                      ? [...currentFields, field]
                      : currentFields.filter(f => f !== field);
                    updateConfig({ fields: newFields });
                  }}
                  className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500"
                />
                <span className="text-sm text-gray-700 capitalize">{field}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions
function getDefaultLabel(type: FormSectionType): string {
  const labels: Record<FormSectionType, string> = {
    info_text: 'Information',
    text_input: 'Text Field',
    single_choice: 'Select One',
    multi_choice: 'Select All That Apply',
    date_picker: 'Select Date',
    number_input: 'Enter Number',
    file_upload: 'Upload File',
    consent_checkbox: 'Consent Agreement',
    signature: 'Your Signature',
    client_details: 'Your Information',
  };
  return labels[type];
}

function getDefaultConfig(type: FormSectionType): FormSection['config'] {
  const configs: Record<FormSectionType, FormSection['config']> = {
    info_text: { content: '## Section Title\n\nYour content here.', variant: 'default' },
    text_input: { placeholder: '', multiline: false },
    single_choice: { options: ['Option 1', 'Option 2', 'Option 3'] },
    multi_choice: { options: ['Option 1', 'Option 2', 'Option 3'] },
    date_picker: { format: 'date' },
    number_input: {},
    file_upload: { acceptedTypes: ['jpg', 'png', 'pdf'], maxSizeMB: 10 },
    consent_checkbox: { consentText: 'I agree to the terms and conditions.' },
    signature: {},
    client_details: { fields: ['name', 'email', 'phone'] },
  };
  return configs[type];
}

export default FormBuilder;
