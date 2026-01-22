/**
 * UploadStep - Phase 3 Import Wizard Step 1
 * Handles file upload for client import (CSV/Excel).
 *
 * Features:
 * - Drag-and-drop file upload zone
 * - Accept CSV and Excel files (.csv, .xlsx, .xls)
 * - Parse file and detect columns
 * - Show file name and row count
 * - 'Continue' button to next step
 * - Error handling for invalid files
 */

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/Badge';
import {
  Upload,
  FileSpreadsheet,
  Check,
  X,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

// ==================== TYPES ====================

export interface ParsedFileData {
  fileName: string;
  fileType: 'csv' | 'xlsx' | 'xls';
  columns: string[];
  rows: Record<string, string>[];
  rowCount: number;
}

interface UploadStepProps {
  /** Callback when file is parsed and ready */
  onFileReady: (data: ParsedFileData) => void;
  /** Callback when continue is clicked */
  onContinue?: () => void;
  /** Callback when cancel is clicked */
  onCancel?: () => void;
}

// ==================== HELPERS ====================

/**
 * Parse CSV string into rows
 * Simple CSV parser - handles quotes and commas
 */
function parseCSV(text: string): { columns: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) {
    return { columns: [], rows: [] };
  }

  // Parse header row
  const columns = parseCSVLine(lines[0]);

  // Parse data rows
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length > 0) {
      const row: Record<string, string> = {};
      columns.forEach((col, idx) => {
        row[col] = values[idx] || '';
      });
      rows.push(row);
    }
  }

  return { columns, rows };
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Validate file type
 */
function getFileType(fileName: string): 'csv' | 'xlsx' | 'xls' | null {
  const ext = fileName.toLowerCase().split('.').pop();
  if (ext === 'csv') return 'csv';
  if (ext === 'xlsx') return 'xlsx';
  if (ext === 'xls') return 'xls';
  return null;
}

// ==================== COMPONENT ====================

export function UploadStep({ onFileReady, onContinue, onCancel }: UploadStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedFileData | null>(null);

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setParsedData(null);

    try {
      const fileType = getFileType(file.name);

      if (!fileType) {
        throw new Error('Invalid file type. Please upload a CSV or Excel file.');
      }

      if (fileType === 'xlsx' || fileType === 'xls') {
        // For Excel files, we need xlsx library
        // For now, show a message about Excel support
        throw new Error('Excel file support requires additional setup. Please use CSV format for now.');
      }

      // Read CSV file
      const text = await file.text();
      const { columns, rows } = parseCSV(text);

      if (columns.length === 0) {
        throw new Error('Could not detect columns in the file. Make sure the first row contains column headers.');
      }

      if (rows.length === 0) {
        throw new Error('No data rows found in the file.');
      }

      const data: ParsedFileData = {
        fileName: file.name,
        fileType,
        columns,
        rows,
        rowCount: rows.length,
      };

      setParsedData(data);
      onFileReady(data);
    } catch (err) {
      console.error('[UploadStep] Error processing file:', err);
      setError(err instanceof Error ? err.message : 'Failed to process file.');
    } finally {
      setIsProcessing(false);
    }
  }, [onFileReady]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setParsedData(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Upload Client Data</h2>
        <p className="text-sm text-gray-500 mt-1">
          Upload a CSV file containing your client data. The first row should contain column headers.
        </p>
      </div>

      {/* Upload Zone */}
      {!parsedData && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragging
              ? 'border-brand-500 bg-brand-50'
              : 'border-gray-300 hover:border-gray-400'
            }
            ${isProcessing ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
          `}
          onClick={!isProcessing ? handleBrowseClick : undefined}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />

          {isProcessing ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
              <p className="text-sm text-gray-600">Processing file...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                <Upload className="w-6 h-6 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Drag and drop your file here, or{' '}
                  <span className="text-brand-600 underline">browse</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supports CSV files (Excel support coming soon)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* File Preview */}
      {parsedData && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{parsedData.fileName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-xs">
                    {parsedData.fileType.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {parsedData.rowCount} row{parsedData.rowCount !== 1 ? 's' : ''} &bull;{' '}
                    {parsedData.columns.length} column{parsedData.columns.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRemoveFile}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Column Preview */}
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-500 mb-2">Detected Columns:</p>
            <div className="flex flex-wrap gap-1.5">
              {parsedData.columns.slice(0, 10).map((col, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {col}
                </Badge>
              ))}
              {parsedData.columns.length > 10 && (
                <Badge variant="outline" className="text-xs">
                  +{parsedData.columns.length - 10} more
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <div className="flex-1" />
        <Button
          onClick={onContinue}
          disabled={!parsedData}
        >
          Continue
          <Check className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

export default UploadStep;
