/**
 * MappingStep - Phase 3 Import Wizard Step 2
 * Handles mapping CSV columns to client fields.
 *
 * Features:
 * - Show source columns from uploaded file
 * - Dropdown to map each to client field
 * - Required fields highlighted (firstName, lastName)
 * - Auto-detect common column names
 * - Preview first 3 rows with mapping applied
 * - 'Back' and 'Continue' buttons
 */

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/Badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import type { ParsedFileData } from './UploadStep';

// ==================== TYPES ====================

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string | null;
}

export interface MappingStepProps {
  /** Parsed file data from upload step */
  fileData: ParsedFileData;
  /** Initial mapping (if returning from next step) */
  initialMapping?: ColumnMapping[];
  /** Callback when mapping is complete */
  onMappingComplete: (mapping: ColumnMapping[]) => void;
  /** Callback for back button */
  onBack?: () => void;
  /** Callback when continue is clicked */
  onContinue?: () => void;
}

// ==================== CONSTANTS ====================

/** Client fields available for mapping */
const CLIENT_FIELDS = [
  { value: 'firstName', label: 'First Name', required: true },
  { value: 'lastName', label: 'Last Name', required: true },
  { value: 'email', label: 'Email', required: false },
  { value: 'phone', label: 'Phone', required: false },
  { value: 'birthday', label: 'Birthday', required: false },
  { value: 'tags', label: 'Tags', required: false },
  { value: 'notes', label: 'Notes', required: false },
  { value: 'address', label: 'Address', required: false },
  { value: 'city', label: 'City', required: false },
  { value: 'state', label: 'State', required: false },
  { value: 'zipCode', label: 'Zip Code', required: false },
  { value: 'sourceDetails', label: 'Referral Source', required: false },
] as const;

/** Common column name patterns for auto-detection */
const AUTO_DETECT_PATTERNS: Record<string, RegExp[]> = {
  firstName: [/^first\s*name$/i, /^fname$/i, /^given\s*name$/i, /^first$/i],
  lastName: [/^last\s*name$/i, /^lname$/i, /^surname$/i, /^family\s*name$/i, /^last$/i],
  email: [/^e?mail$/i, /^email\s*address$/i],
  phone: [/^phone$/i, /^mobile$/i, /^cell$/i, /^phone\s*number$/i, /^telephone$/i],
  birthday: [/^birth\s*day$/i, /^dob$/i, /^date\s*of\s*birth$/i, /^birthday$/i],
  tags: [/^tags?$/i, /^labels?$/i, /^categories?$/i],
  notes: [/^notes?$/i, /^comments?$/i, /^remarks?$/i],
  address: [/^address$/i, /^street$/i, /^address\s*1$/i],
  city: [/^city$/i, /^town$/i],
  state: [/^state$/i, /^province$/i, /^region$/i],
  zipCode: [/^zip$/i, /^zip\s*code$/i, /^postal$/i, /^postal\s*code$/i],
  sourceDetails: [/^referral$/i, /^source$/i, /^how\s*did\s*you\s*hear$/i],
};

// ==================== HELPERS ====================

/**
 * Auto-detect field mapping based on column name
 */
function autoDetectField(columnName: string): string | null {
  const normalizedName = columnName.trim();

  for (const [field, patterns] of Object.entries(AUTO_DETECT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedName)) {
        return field;
      }
    }
  }

  // Check for "Name" which could be firstName or full name
  if (/^name$/i.test(normalizedName)) {
    return 'firstName';
  }

  return null;
}

/**
 * Generate initial mapping with auto-detection
 */
function generateInitialMapping(columns: string[]): ColumnMapping[] {
  const usedFields = new Set<string>();

  return columns.map((col) => {
    const detectedField = autoDetectField(col);

    // Only use auto-detected field if not already used
    if (detectedField && !usedFields.has(detectedField)) {
      usedFields.add(detectedField);
      return { sourceColumn: col, targetField: detectedField };
    }

    return { sourceColumn: col, targetField: null };
  });
}

// ==================== COMPONENT ====================

export function MappingStep({
  fileData,
  initialMapping,
  onMappingComplete,
  onBack,
  onContinue,
}: MappingStepProps) {
  const [mapping, setMapping] = useState<ColumnMapping[]>(() => {
    if (initialMapping && initialMapping.length > 0) {
      return initialMapping;
    }
    return generateInitialMapping(fileData.columns);
  });

  const [autoDetectedCount, setAutoDetectedCount] = useState(0);

  // Count auto-detected fields on initial load
  useEffect(() => {
    if (!initialMapping) {
      const count = mapping.filter((m) => m.targetField !== null).length;
      setAutoDetectedCount(count);
    }
  }, []);

  // Check for required fields
  const validationState = useMemo(() => {
    const mappedFields = new Set(
      mapping.filter((m) => m.targetField).map((m) => m.targetField)
    );

    const missingRequired = CLIENT_FIELDS
      .filter((f) => f.required && !mappedFields.has(f.value))
      .map((f) => f.label);

    return {
      isValid: missingRequired.length === 0,
      missingRequired,
    };
  }, [mapping]);

  // Get available fields for a dropdown (excluding already mapped fields)
  const getAvailableFields = (currentMapping: ColumnMapping) => {
    const usedFields = new Set(
      mapping
        .filter((m) => m.targetField && m.sourceColumn !== currentMapping.sourceColumn)
        .map((m) => m.targetField)
    );

    return CLIENT_FIELDS.filter((f) => !usedFields.has(f.value));
  };

  const handleFieldChange = (sourceColumn: string, targetField: string | null) => {
    const newMapping = mapping.map((m) =>
      m.sourceColumn === sourceColumn
        ? { ...m, targetField: targetField === 'skip' ? null : targetField }
        : m
    );
    setMapping(newMapping);
    onMappingComplete(newMapping);
  };

  const handleContinue = () => {
    onMappingComplete(mapping);
    onContinue?.();
  };

  // Preview rows (first 3)
  const previewRows = fileData.rows.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Map Columns</h2>
        <p className="text-sm text-gray-500 mt-1">
          Match the columns from your file to client fields.
        </p>
      </div>

      {/* Auto-detect notification */}
      {autoDetectedCount > 0 && (
        <Alert className="bg-brand-50 border-brand-200">
          <Sparkles className="w-4 h-4 text-brand-600" />
          <AlertDescription className="text-brand-700">
            Auto-detected {autoDetectedCount} column{autoDetectedCount !== 1 ? 's' : ''} based on common naming patterns.
          </AlertDescription>
        </Alert>
      )}

      {/* Validation Error */}
      {!validationState.isValid && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Required fields missing: {validationState.missingRequired.join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Column Mapping */}
      <div className="border rounded-lg divide-y">
        <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 font-medium text-sm text-gray-700">
          <div>Source Column</div>
          <div>Map To</div>
        </div>

        {mapping.map((m) => {
          const availableFields = getAvailableFields(m);
          const isRequired = CLIENT_FIELDS.find((f) => f.value === m.targetField)?.required;

          return (
            <div key={m.sourceColumn} className="grid grid-cols-2 gap-4 p-3 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{m.sourceColumn}</span>
                {m.targetField && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
              </div>

              <Select
                value={m.targetField || 'skip'}
                onValueChange={(value) => handleFieldChange(m.sourceColumn, value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Skip this column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="skip">
                    <span className="text-gray-400">Skip this column</span>
                  </SelectItem>
                  {availableFields.map((field) => (
                    <SelectItem key={field.value} value={field.value}>
                      <div className="flex items-center gap-2">
                        <span>{field.label}</span>
                        {field.required && (
                          <Badge variant="outline" className="text-xs text-red-500 border-red-200">
                            Required
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                  {/* Show current selection if it's already used */}
                  {m.targetField && !availableFields.find((f) => f.value === m.targetField) && (
                    <SelectItem value={m.targetField}>
                      <div className="flex items-center gap-2">
                        <span>
                          {CLIENT_FIELDS.find((f) => f.value === m.targetField)?.label || m.targetField}
                        </span>
                        {isRequired && (
                          <Badge variant="outline" className="text-xs text-red-500 border-red-200">
                            Required
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>

      {/* Preview Table */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Preview (First 3 Rows)</h3>
        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {mapping
                  .filter((m) => m.targetField)
                  .map((m) => (
                    <TableHead key={m.sourceColumn} className="whitespace-nowrap">
                      {CLIENT_FIELDS.find((f) => f.value === m.targetField)?.label || m.targetField}
                    </TableHead>
                  ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={mapping.filter((m) => m.targetField).length || 1}
                    className="text-center text-gray-500 py-8"
                  >
                    No data to preview
                  </TableCell>
                </TableRow>
              ) : (
                previewRows.map((row, idx) => (
                  <TableRow key={idx}>
                    {mapping
                      .filter((m) => m.targetField)
                      .map((m) => (
                        <TableCell key={m.sourceColumn} className="whitespace-nowrap">
                          {row[m.sourceColumn] || '-'}
                        </TableCell>
                      ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {mapping.filter((m) => m.targetField).length === 0 && (
          <p className="text-sm text-gray-500 mt-2 text-center">
            Map at least one column to see preview
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
        <div className="flex-1" />
        <Button
          onClick={handleContinue}
          disabled={!validationState.isValid}
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

export default MappingStep;
