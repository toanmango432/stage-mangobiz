/**
 * ServiceFormConfig - Phase 3 Form Configuration for Services
 * Allows managers to configure auto-send forms for services.
 *
 * Features:
 * - Multi-select dropdown for form templates
 * - Show selected forms as tags/chips
 * - Remove form from selection
 * - Info text explaining auto-send behavior
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Plus, X, Info, Loader2 } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { selectStoreId } from '@/store/slices/authSlice';
import { supabase } from '@/services/supabase/client';

interface FormTemplateOption {
  id: string;
  name: string;
  description?: string;
  category?: string;
}

interface ServiceFormConfigProps {
  /** Currently selected form template IDs */
  selectedFormIds: string[];
  /** Callback when selection changes */
  onChange: (formIds: string[]) => void;
  /** Optional label override */
  label?: string;
  /** Optional help text override */
  helpText?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
}

export function ServiceFormConfig({
  selectedFormIds,
  onChange,
  label = 'Auto-Send Forms',
  helpText = 'Forms selected here will be automatically sent to clients when this service is booked.',
  disabled = false,
}: ServiceFormConfigProps) {
  const storeId = useAppSelector(selectStoreId);

  const [templates, setTemplates] = useState<FormTemplateOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch form templates
  useEffect(() => {
    if (!storeId) return;

    const fetchTemplates = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('form_templates')
          .select('id, name, description, category')
          .eq('store_id', storeId)
          .eq('is_active', true)
          .order('name');

        if (fetchError) {
          console.error('[ServiceFormConfig] Error fetching templates:', fetchError);
          setError('Failed to load form templates.');
          return;
        }

        setTemplates(data || []);
      } catch (err) {
        console.error('[ServiceFormConfig] Unexpected error:', err);
        setError('Failed to load form templates.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, [storeId]);

  // Get available templates (not yet selected)
  const availableTemplates = useMemo(() => {
    return templates.filter((t) => !selectedFormIds.includes(t.id));
  }, [templates, selectedFormIds]);

  // Get selected template details
  const selectedTemplates = useMemo(() => {
    return selectedFormIds
      .map((id) => templates.find((t) => t.id === id))
      .filter((t): t is FormTemplateOption => t !== undefined);
  }, [templates, selectedFormIds]);

  const handleAddForm = (formId: string) => {
    if (!selectedFormIds.includes(formId)) {
      onChange([...selectedFormIds, formId]);
    }
  };

  const handleRemoveForm = (formId: string) => {
    onChange(selectedFormIds.filter((id) => id !== formId));
  };

  return (
    <div className="space-y-3">
      {/* Label */}
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-gray-500" />
        <label className="text-sm font-medium text-gray-700">{label}</label>
      </div>

      {/* Selected Forms - Chips/Tags */}
      {selectedTemplates.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTemplates.map((template) => (
            <Badge
              key={template.id}
              variant="secondary"
              className="flex items-center gap-1.5 py-1 px-2 text-sm"
            >
              <span>{template.name}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveForm(template.id)}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5 transition-colors"
                  aria-label={`Remove ${template.name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Add Form Dropdown */}
      {!disabled && (
        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 p-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading forms...
            </div>
          ) : error ? (
            <Alert variant="destructive" className="p-2">
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          ) : availableTemplates.length === 0 && selectedFormIds.length === 0 ? (
            <p className="text-sm text-gray-500">No form templates available.</p>
          ) : availableTemplates.length === 0 ? (
            <p className="text-sm text-gray-500">All available forms have been added.</p>
          ) : (
            <Select onValueChange={handleAddForm}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Add a form..." />
              </SelectTrigger>
              <SelectContent>
                {availableTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      <Plus className="w-3.5 h-3.5 text-gray-400" />
                      <span>{template.name}</span>
                      {template.category && (
                        <Badge variant="outline" className="text-xs ml-1">
                          {template.category}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Info Text */}
      {helpText && (
        <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-md">
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>{helpText}</span>
        </div>
      )}
    </div>
  );
}

export default ServiceFormConfig;
