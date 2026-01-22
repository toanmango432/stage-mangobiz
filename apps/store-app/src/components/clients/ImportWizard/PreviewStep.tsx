/**
 * PreviewStep - Phase 3 Import Wizard Step 3
 * Handles preview and import execution.
 *
 * Features:
 * - Show import summary: total rows, valid rows, invalid rows
 * - Duplicate detection by phone or email
 * - Options for duplicates: Skip, Update, Create New
 * - Download invalid rows as CSV
 * - Import button with confirmation
 * - Progress bar during import
 * - Success summary with counts
 */

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/Badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Label } from '@/components/ui/label';
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
  Upload,
  Check,
  AlertCircle,
  Download,
  Users,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectStoreId } from '@/store/slices/authSlice';
import { selectClients } from '@/store/slices/clientsSlice/selectors';
import { createClient, updateClient } from '@/store/slices/clientsSlice/thunks';
import type { ParsedFileData } from './UploadStep';
import type { ColumnMapping } from './MappingStep';
import type { Client, ClientTag, ClientNote, ClientSource } from '@/types/client';

// ==================== TYPES ====================

export type DuplicateAction = 'skip' | 'update' | 'create_new';

export interface ValidationResult {
  rowIndex: number;
  row: Record<string, string>;
  isValid: boolean;
  errors: string[];
  isDuplicate: boolean;
  duplicateOf?: Client;
  mappedData: Partial<Client>;
}

export interface PreviewStepProps {
  /** Parsed file data */
  fileData: ParsedFileData;
  /** Column mapping from previous step */
  mapping: ColumnMapping[];
  /** Callback for back button */
  onBack?: () => void;
  /** Callback when import completes */
  onComplete?: (results: ImportResults) => void;
}

export interface ImportResults {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
}

// ==================== HELPERS ====================

const BATCH_SIZE = 50;

/**
 * Validate a phone number (basic validation)
 */
function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10;
}

/**
 * Validate an email address
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Normalize phone for comparison
 */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10);
}

/**
 * Normalize email for comparison
 */
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Apply mapping to row data and create client-like object
 */
function applyMapping(
  row: Record<string, string>,
  mapping: ColumnMapping[]
): Partial<Client> {
  const result: Record<string, unknown> = {};

  for (const m of mapping) {
    if (m.targetField && row[m.sourceColumn]) {
      const value = row[m.sourceColumn].trim();
      if (value) {
        // Handle special fields
        if (m.targetField === 'tags') {
          // Split tags by comma
          result.tags = value.split(',').map((t) => t.trim()).filter(Boolean);
        } else if (['address', 'city', 'state', 'zipCode'].includes(m.targetField)) {
          // Build address object
          if (!result.address) {
            result.address = {};
          }
          const addressField = m.targetField === 'zipCode' ? 'zip' : m.targetField;
          (result.address as Record<string, string>)[addressField] = value;
        } else {
          result[m.targetField] = value;
        }
      }
    }
  }

  return result as Partial<Client>;
}

/**
 * Download data as CSV file
 */
function downloadCSV(rows: Record<string, string>[], filename: string) {
  if (rows.length === 0) return;

  const columns = Object.keys(rows[0]);
  const csvContent = [
    columns.join(','),
    ...rows.map((row) =>
      columns.map((col) => {
        const value = row[col] || '';
        // Escape quotes and wrap in quotes if contains comma or quote
        if (value.includes(',') || value.includes('"')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

// ==================== COMPONENT ====================

export function PreviewStep({
  fileData,
  mapping,
  onBack,
  onComplete,
}: PreviewStepProps) {
  const dispatch = useAppDispatch();
  const storeId = useAppSelector(selectStoreId);
  const existingClients = useAppSelector(selectClients);

  const [duplicateAction, setDuplicateAction] = useState<DuplicateAction>('skip');
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResults, setImportResults] = useState<ImportResults | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Build lookup maps for duplicate detection
  const existingByPhone = useMemo(() => {
    const map = new Map<string, Client>();
    for (const client of existingClients) {
      if (client.phone) {
        map.set(normalizePhone(client.phone), client);
      }
    }
    return map;
  }, [existingClients]);

  const existingByEmail = useMemo(() => {
    const map = new Map<string, Client>();
    for (const client of existingClients) {
      if (client.email) {
        map.set(normalizeEmail(client.email), client);
      }
    }
    return map;
  }, [existingClients]);

  // Validate all rows
  const validationResults = useMemo<ValidationResult[]>(() => {
    return fileData.rows.map((row, rowIndex) => {
      const errors: string[] = [];
      const mappedData = applyMapping(row, mapping);

      // Check required fields
      if (!mappedData.firstName) {
        errors.push('First name is required');
      }
      if (!mappedData.lastName) {
        errors.push('Last name is required');
      }

      // Validate phone if provided
      if (mappedData.phone && !isValidPhone(mappedData.phone)) {
        errors.push('Invalid phone number');
      }

      // Validate email if provided
      if (mappedData.email && !isValidEmail(mappedData.email)) {
        errors.push('Invalid email address');
      }

      // Check for duplicates
      let isDuplicate = false;
      let duplicateOf: Client | undefined;

      if (mappedData.phone) {
        const existing = existingByPhone.get(normalizePhone(mappedData.phone));
        if (existing) {
          isDuplicate = true;
          duplicateOf = existing;
        }
      }

      if (!isDuplicate && mappedData.email) {
        const existing = existingByEmail.get(normalizeEmail(mappedData.email));
        if (existing) {
          isDuplicate = true;
          duplicateOf = existing;
        }
      }

      return {
        rowIndex,
        row,
        isValid: errors.length === 0,
        errors,
        isDuplicate,
        duplicateOf,
        mappedData,
      };
    });
  }, [fileData.rows, mapping, existingByPhone, existingByEmail]);

  // Summary stats
  const stats = useMemo(() => {
    const total = validationResults.length;
    const valid = validationResults.filter((r) => r.isValid).length;
    const invalid = total - valid;
    const duplicates = validationResults.filter((r) => r.isDuplicate).length;
    const uniqueValid = validationResults.filter((r) => r.isValid && !r.isDuplicate).length;

    return { total, valid, invalid, duplicates, uniqueValid };
  }, [validationResults]);

  // Invalid rows for download
  const invalidRows = useMemo(() => {
    return validationResults
      .filter((r) => !r.isValid)
      .map((r) => ({
        ...r.row,
        _errors: r.errors.join('; '),
      }));
  }, [validationResults]);

  const handleDownloadInvalid = () => {
    downloadCSV(invalidRows, 'invalid_rows.csv');
  };

  const handleImport = useCallback(async () => {
    if (!storeId) {
      setImportError('Store ID not found. Please try again.');
      return;
    }

    setIsImporting(true);
    setProgress(0);
    setImportError(null);

    const results: ImportResults = {
      total: stats.total,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
    };

    const validRows = validationResults.filter((r) => r.isValid);
    const totalToProcess = validRows.length;

    // Process in batches
    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
      const batch = validRows.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (result) => {
          try {
            if (result.isDuplicate) {
              // Handle duplicate based on action
              switch (duplicateAction) {
                case 'skip':
                  results.skipped++;
                  return;
                case 'update':
                  if (result.duplicateOf) {
                    await dispatch(
                      updateClient({
                        id: result.duplicateOf.id,
                        updates: result.mappedData,
                      })
                    ).unwrap();
                    results.updated++;
                  }
                  return;
                case 'create_new':
                  // Fall through to create
                  break;
              }
            }

            // Create new client
            // Convert string tags to ClientTag[] format
            const tagsArray = result.mappedData.tags as unknown as string[] | undefined;
            const clientTags: ClientTag[] | undefined = tagsArray?.map((tag, idx) => ({
              id: `import-tag-${idx}`,
              name: tag,
              color: '#6B7280',
            }));

            // Convert string notes to ClientNote[] format
            const notesStr = result.mappedData.notes as unknown as string | undefined;
            const clientNotes: ClientNote[] | undefined = notesStr ? [{
              id: `import-note-0`,
              date: new Date().toISOString(),
              content: notesStr,
              type: 'general',
              isPrivate: false,
              createdBy: 'import',
            }] : undefined;

            const newClient: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'> = {
              storeId,
              firstName: result.mappedData.firstName || '',
              lastName: result.mappedData.lastName || '',
              phone: result.mappedData.phone || '',
              email: result.mappedData.email,
              birthday: result.mappedData.birthday,
              tags: clientTags,
              notes: clientNotes,
              address: result.mappedData.address,
              sourceDetails: result.mappedData.sourceDetails as string | undefined,
              isBlocked: false,
              isVip: false,
            };

            await dispatch(createClient(newClient)).unwrap();
            results.created++;
          } catch (error) {
            console.error('[PreviewStep] Error importing row:', error);
            results.errors++;
          }
        })
      );

      // Update progress
      const processed = Math.min(i + BATCH_SIZE, totalToProcess);
      setProgress(Math.round((processed / totalToProcess) * 100));
    }

    // Add invalid rows to skipped
    results.skipped += stats.invalid;

    setIsImporting(false);
    setImportResults(results);
    onComplete?.(results);
  }, [
    storeId,
    validationResults,
    duplicateAction,
    stats,
    dispatch,
    onComplete,
  ]);

  // Import completed view
  if (importResults) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Import Complete</h2>
          <p className="text-sm text-gray-500 mt-1">
            Your client data has been imported successfully.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{importResults.total}</p>
            <p className="text-sm text-gray-500">Total Rows</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{importResults.created}</p>
            <p className="text-sm text-gray-500">Created</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{importResults.updated}</p>
            <p className="text-sm text-gray-500">Updated</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-500">{importResults.skipped}</p>
            <p className="text-sm text-gray-500">Skipped</p>
          </div>
        </div>

        {importResults.errors > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              {importResults.errors} row{importResults.errors !== 1 ? 's' : ''} failed to import.
              Please check the data and try again.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-center pt-4">
          <Button onClick={() => window.location.reload()}>
            <Check className="w-4 h-4 mr-2" />
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Review & Import</h2>
        <p className="text-sm text-gray-500 mt-1">
          Review the import summary and configure duplicate handling.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-500">Total Rows</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-500">Valid</span>
          </div>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.valid}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-sm text-gray-500">Invalid</span>
          </div>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.invalid}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-gray-500">Duplicates</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.duplicates}</p>
        </div>
      </div>

      {/* Invalid Rows Alert */}
      {stats.invalid > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              {stats.invalid} row{stats.invalid !== 1 ? 's' : ''} have validation errors and will be skipped.
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadInvalid}
              className="ml-4"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Invalid Rows
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Duplicate Handling */}
      {stats.duplicates > 0 && (
        <div className="border rounded-lg p-4 bg-yellow-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">
                {stats.duplicates} Duplicate{stats.duplicates !== 1 ? 's' : ''} Found
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                These clients already exist in your database (matched by phone or email).
              </p>

              <div className="mt-3">
                <Label htmlFor="duplicate-action" className="text-sm font-medium">
                  How should we handle duplicates?
                </Label>
                <Select
                  value={duplicateAction}
                  onValueChange={(v) => setDuplicateAction(v as DuplicateAction)}
                >
                  <SelectTrigger id="duplicate-action" className="w-full max-w-xs mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skip">Skip duplicates</SelectItem>
                    <SelectItem value="update">Update existing records</SelectItem>
                    <SelectItem value="create_new">Create as new clients</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Table - First 5 valid rows */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Preview (First 5 Valid Rows)</h3>
        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>First Name</TableHead>
                <TableHead>Last Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {validationResults
                .filter((r) => r.isValid)
                .slice(0, 5)
                .map((result) => (
                  <TableRow key={result.rowIndex}>
                    <TableCell>
                      {result.isDuplicate ? (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                          Duplicate
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          New
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{result.mappedData.firstName || '-'}</TableCell>
                    <TableCell>{result.mappedData.lastName || '-'}</TableCell>
                    <TableCell>{result.mappedData.phone || '-'}</TableCell>
                    <TableCell>{result.mappedData.email || '-'}</TableCell>
                  </TableRow>
                ))}
              {stats.valid === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                    No valid rows to preview
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Import Error */}
      {importError && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{importError}</AlertDescription>
        </Alert>
      )}

      {/* Progress Bar */}
      {isImporting && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Importing clients...</span>
            <span className="text-gray-900 font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t">
        {onBack && (
          <Button variant="outline" onClick={onBack} disabled={isImporting}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
        <div className="flex-1" />
        <Button
          onClick={handleImport}
          disabled={isImporting || stats.valid === 0}
        >
          {isImporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Import {stats.uniqueValid + (duplicateAction !== 'skip' ? stats.duplicates : 0)} Client
              {stats.uniqueValid + (duplicateAction !== 'skip' ? stats.duplicates : 0) !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default PreviewStep;
