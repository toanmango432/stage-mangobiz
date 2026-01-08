/**
 * Form Completion Portal
 * PRD Reference: 2.3.4 Consultation Forms - Form Completion
 *
 * Client-facing form that:
 * - Renders form sections dynamically
 * - Handles validation
 * - Supports draft save
 * - Mobile-optimized design
 */

import React, { useState, useCallback, useMemo } from 'react';
import DOMPurify from 'dompurify';
import type {
  FormTemplate,
  FormSection,
  FormFieldValue,
  SignatureData,
} from '../../types/form';
import { SignatureCapture } from './SignatureCapture';

interface FormCompletionPortalProps {
  template: FormTemplate;
  initialResponses?: Record<string, FormFieldValue>;
  clientInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    birthday?: string;
    address?: string;
  };
  onSubmit: (responses: Record<string, FormFieldValue>, signature?: SignatureData) => Promise<void>;
  onSaveDraft?: (responses: Record<string, FormFieldValue>) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const FormCompletionPortal: React.FC<FormCompletionPortalProps> = ({
  template,
  initialResponses = {},
  clientInfo,
  onSubmit,
  onSaveDraft,
  onCancel,
  isLoading = false,
}) => {
  const [responses, setResponses] = useState<Record<string, FormFieldValue>>(initialResponses);
  const [signature, setSignature] = useState<SignatureData | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sort sections by order
  const sections = useMemo(() =>
    [...template.sections].sort((a, b) => a.order - b.order),
    [template.sections]
  );

  // Validate a single field
  const validateField = useCallback((section: FormSection, value: FormFieldValue): string | null => {
    if (section.required) {
      if (value === null || value === undefined) {
        return `${section.label} is required`;
      }
      if (typeof value === 'string' && value.trim() === '') {
        return `${section.label} is required`;
      }
      if (Array.isArray(value) && value.length === 0) {
        return `Please select at least one option`;
      }
    }

    // Type-specific validation
    if (section.type === 'text_input' && section.config) {
      const config = section.config as { minLength?: number; maxLength?: number };
      const strValue = String(value || '');
      if (config.minLength && strValue.length < config.minLength) {
        return `Minimum ${config.minLength} characters required`;
      }
      if (config.maxLength && strValue.length > config.maxLength) {
        return `Maximum ${config.maxLength} characters allowed`;
      }
    }

    if (section.type === 'number_input' && section.config && value !== null) {
      const config = section.config as { min?: number; max?: number };
      const numValue = Number(value);
      if (config.min !== undefined && numValue < config.min) {
        return `Minimum value is ${config.min}`;
      }
      if (config.max !== undefined && numValue > config.max) {
        return `Maximum value is ${config.max}`;
      }
    }

    if (section.type === 'multi_choice' && section.config && Array.isArray(value)) {
      const config = section.config as { minSelections?: number; maxSelections?: number };
      if (config.minSelections && value.length < config.minSelections) {
        return `Select at least ${config.minSelections} options`;
      }
      if (config.maxSelections && value.length > config.maxSelections) {
        return `Select at most ${config.maxSelections} options`;
      }
    }

    return null;
  }, []);

  // Validate all fields
  const validateAll = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    for (const section of sections) {
      if (section.type === 'info_text' || section.type === 'client_details') continue;

      const error = validateField(section, responses[section.id]);
      if (error) {
        newErrors[section.id] = error;
      }
    }

    // Validate signature if required
    if (template.requiresSignature && !signature) {
      newErrors['signature'] = 'Signature is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [sections, responses, signature, template.requiresSignature, validateField]);

  // Handle field change
  const handleFieldChange = useCallback((sectionId: string, value: FormFieldValue) => {
    setResponses(prev => ({ ...prev, [sectionId]: value }));

    // Clear error when field changes
    if (errors[sectionId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[sectionId];
        return newErrors;
      });
    }
  }, [errors]);

  // Handle submit
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAll()) {
      // Scroll to first error
      const firstErrorId = Object.keys(errors)[0];
      if (firstErrorId) {
        document.getElementById(`section-${firstErrorId}`)?.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(responses, signature || undefined);
    } finally {
      setIsSubmitting(false);
    }
  }, [validateAll, errors, responses, signature, onSubmit]);

  // Handle save draft
  const handleSaveDraft = useCallback(() => {
    onSaveDraft?.(responses);
  }, [responses, onSaveDraft]);

  // Render a section
  const renderSection = (section: FormSection) => {
    const error = errors[section.id];
    const value = responses[section.id];

    switch (section.type) {
      case 'info_text': {
        const config = section.config as { content: string; variant?: string };
        return (
          <div className={`
            p-4 rounded-lg border
            ${config.variant === 'warning' ? 'bg-yellow-50 border-yellow-200' :
              config.variant === 'info' ? 'bg-blue-50 border-blue-200' :
              'bg-gray-50 border-gray-200'}
          `}>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(
                  config.content
                    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-0 mb-2">$1</h2>')
                    .replace(/^### (.+)$/gm, '<h3 class="text-md font-medium mt-2 mb-1">$1</h3>')
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n- /g, '<br/>• ')
                    .replace(/\n/g, '<br/>'),
                  { ALLOWED_TAGS: ['h2', 'h3', 'strong', 'br', 'p', 'span'], ALLOWED_ATTR: ['class'] }
                )
              }}
            />
          </div>
        );
      }

      case 'client_details': {
        const config = section.config as { fields: string[] };
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            {config.fields.includes('name') && clientInfo?.name && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                <p className="text-gray-900">{clientInfo.name}</p>
              </div>
            )}
            {config.fields.includes('email') && clientInfo?.email && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                <p className="text-gray-900">{clientInfo.email}</p>
              </div>
            )}
            {config.fields.includes('phone') && clientInfo?.phone && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                <p className="text-gray-900">{clientInfo.phone}</p>
              </div>
            )}
            {config.fields.includes('birthday') && clientInfo?.birthday && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Birthday</label>
                <p className="text-gray-900">{clientInfo.birthday}</p>
              </div>
            )}
          </div>
        );
      }

      case 'text_input': {
        const config = section.config as { placeholder?: string; multiline?: boolean };
        return config.multiline ? (
          <textarea
            value={String(value || '')}
            onChange={(e) => handleFieldChange(section.id, e.target.value)}
            placeholder={config.placeholder}
            rows={4}
            className={`
              w-full px-4 py-3 border rounded-lg resize-none
              focus:outline-none focus:ring-2 focus:ring-cyan-500
              ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'}
            `}
          />
        ) : (
          <input
            type="text"
            value={String(value || '')}
            onChange={(e) => handleFieldChange(section.id, e.target.value)}
            placeholder={config.placeholder}
            className={`
              w-full px-4 py-3 border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-cyan-500
              ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'}
            `}
          />
        );
      }

      case 'single_choice': {
        const config = section.config as { options: string[] };
        return (
          <div className="space-y-2">
            {config.options.map((option) => (
              <label
                key={option}
                className={`
                  flex items-center p-4 border rounded-lg cursor-pointer transition-colors
                  ${value === option
                    ? 'border-cyan-500 bg-cyan-50'
                    : 'border-gray-200 hover:border-gray-300'}
                `}
              >
                <input
                  type="radio"
                  name={section.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleFieldChange(section.id, e.target.value)}
                  className="w-4 h-4 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="ml-3 text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );
      }

      case 'multi_choice': {
        const config = section.config as { options: string[] };
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {config.options.map((option) => (
              <label
                key={option}
                className={`
                  flex items-center p-4 border rounded-lg cursor-pointer transition-colors
                  ${selectedValues.includes(option)
                    ? 'border-cyan-500 bg-cyan-50'
                    : 'border-gray-200 hover:border-gray-300'}
                `}
              >
                <input
                  type="checkbox"
                  value={option}
                  checked={selectedValues.includes(option)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...selectedValues, option]
                      : selectedValues.filter(v => v !== option);
                    handleFieldChange(section.id, newValues);
                  }}
                  className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500"
                />
                <span className="ml-3 text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );
      }

      case 'date_picker': {
        return (
          <input
            type="date"
            value={String(value || '')}
            onChange={(e) => handleFieldChange(section.id, e.target.value)}
            className={`
              w-full px-4 py-3 border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-cyan-500
              ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'}
            `}
          />
        );
      }

      case 'number_input': {
        const config = section.config as { min?: number; max?: number; step?: number; unit?: string };
        return (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={value !== null && value !== undefined ? String(value) : ''}
              onChange={(e) => handleFieldChange(section.id, e.target.value ? Number(e.target.value) : null)}
              min={config.min}
              max={config.max}
              step={config.step}
              className={`
                flex-1 px-4 py-3 border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-cyan-500
                ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'}
              `}
            />
            {config.unit && (
              <span className="text-gray-500">{config.unit}</span>
            )}
          </div>
        );
      }

      case 'consent_checkbox': {
        const config = section.config as { consentText: string; linkText?: string; linkUrl?: string };
        return (
          <label className={`
            flex items-start p-4 border rounded-lg cursor-pointer transition-colors
            ${value ? 'border-green-500 bg-green-50' : error ? 'border-red-300' : 'border-gray-200'}
          `}>
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => handleFieldChange(section.id, e.target.checked)}
              className="w-5 h-5 mt-0.5 text-green-600 rounded focus:ring-green-500"
            />
            <div className="ml-3">
              <span className="text-gray-700">{config.consentText}</span>
              {config.linkText && config.linkUrl && (
                <a
                  href={config.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 text-cyan-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {config.linkText}
                </a>
              )}
            </div>
          </label>
        );
      }

      case 'signature': {
        return (
          <SignatureCapture
            value={signature || undefined}
            onChange={setSignature}
            label={section.label}
            required={section.required}
          />
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-900">{template.name}</h1>
          {template.description && (
            <p className="text-sm text-gray-500 mt-1">{template.description}</p>
          )}
        </div>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {sections.map((section) => (
            <div
              key={section.id}
              id={`section-${section.id}`}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              {/* Section Header */}
              {section.type !== 'info_text' && (
                <div className="mb-4">
                  <h3 className="text-base font-medium text-gray-900">
                    {section.label}
                    {section.required && <span className="text-red-500 ml-1">*</span>}
                  </h3>
                  {section.description && (
                    <p className="text-sm text-gray-500 mt-1">{section.description}</p>
                  )}
                </div>
              )}

              {/* Section Content */}
              {renderSection(section)}

              {/* Error Message */}
              {errors[section.id] && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors[section.id]}
                </p>
              )}
            </div>
          ))}

          {/* Signature Section (if required but not in sections) */}
          {template.requiresSignature && !sections.some(s => s.type === 'signature') && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <SignatureCapture
                value={signature || undefined}
                onChange={setSignature}
                required
              />
              {errors['signature'] && (
                <p className="mt-2 text-sm text-red-600">{errors['signature']}</p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className={`
              flex-1 py-4 px-6 rounded-xl font-medium text-white
              ${isSubmitting || isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-cyan-600 hover:bg-cyan-700'}
              transition-colors
            `}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Submitting...
              </span>
            ) : (
              'Submit Form'
            )}
          </button>

          {onSaveDraft && (
            <button
              type="button"
              onClick={handleSaveDraft}
              className="py-4 px-6 rounded-xl font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Save Draft
            </button>
          )}

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="py-4 px-6 rounded-xl font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-400">
          <p>This form is secured and your information is protected.</p>
          <p className="mt-1">Powered by Mango POS</p>
        </div>
      </form>
    </div>
  );
};

export default FormCompletionPortal;
