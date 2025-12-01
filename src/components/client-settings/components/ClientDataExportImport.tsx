import React, { useState, useRef } from 'react';
import type { Client } from '../../../types';
import { Button, Badge } from './SharedComponents';

// Export formats
export type ExportFormat = 'csv' | 'json' | 'excel';

interface ExportOptions {
  format: ExportFormat;
  includeFields: string[];
  filename?: string;
}

// Field definitions for export
const EXPORT_FIELDS = [
  { key: 'id', label: 'ID', category: 'basic' },
  { key: 'firstName', label: 'First Name', category: 'basic' },
  { key: 'lastName', label: 'Last Name', category: 'basic' },
  { key: 'phone', label: 'Phone', category: 'basic' },
  { key: 'email', label: 'Email', category: 'basic' },
  { key: 'birthday', label: 'Birthday', category: 'basic' },
  { key: 'gender', label: 'Gender', category: 'basic' },
  { key: 'address.street', label: 'Street', category: 'address' },
  { key: 'address.city', label: 'City', category: 'address' },
  { key: 'address.state', label: 'State', category: 'address' },
  { key: 'address.zipCode', label: 'Zip Code', category: 'address' },
  { key: 'source', label: 'Source', category: 'marketing' },
  { key: 'loyaltyInfo.tier', label: 'Loyalty Tier', category: 'loyalty' },
  { key: 'loyaltyInfo.pointsBalance', label: 'Points Balance', category: 'loyalty' },
  { key: 'loyaltyInfo.lifetimePoints', label: 'Lifetime Points', category: 'loyalty' },
  { key: 'loyaltyInfo.referralCode', label: 'Referral Code', category: 'loyalty' },
  { key: 'visitSummary.totalVisits', label: 'Total Visits', category: 'history' },
  { key: 'visitSummary.totalSpent', label: 'Total Spent', category: 'history' },
  { key: 'visitSummary.lastVisitDate', label: 'Last Visit', category: 'history' },
  { key: 'visitSummary.averageTicket', label: 'Average Ticket', category: 'history' },
  { key: 'isVip', label: 'VIP Status', category: 'status' },
  { key: 'isBlocked', label: 'Blocked', category: 'status' },
  { key: 'tags', label: 'Tags', category: 'other' },
  { key: 'createdAt', label: 'Created Date', category: 'system' },
];

const FIELD_CATEGORIES = [
  { key: 'basic', label: 'Basic Info' },
  { key: 'address', label: 'Address' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'loyalty', label: 'Loyalty' },
  { key: 'history', label: 'Visit History' },
  { key: 'status', label: 'Status' },
  { key: 'other', label: 'Other' },
  { key: 'system', label: 'System' },
];

// Helper to get nested value
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Convert clients to CSV
function clientsToCSV(clients: Client[], fields: string[]): string {
  const headers = fields.map(f => EXPORT_FIELDS.find(ef => ef.key === f)?.label || f);
  const rows = clients.map(client => {
    return fields.map(field => {
      let value = getNestedValue(client, field);
      if (value === undefined || value === null) return '';
      if (typeof value === 'boolean') return value ? 'Yes' : 'No';
      if (Array.isArray(value)) return value.map(v => v.name || v).join('; ');
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    });
  });

  const escapeCSV = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  return [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\n');
}

// Convert clients to JSON
function clientsToJSON(clients: Client[], fields: string[]): string {
  const filteredClients = clients.map(client => {
    const filtered: Record<string, any> = {};
    fields.forEach(field => {
      const value = getNestedValue(client, field);
      if (value !== undefined) {
        filtered[field] = value;
      }
    });
    return filtered;
  });
  return JSON.stringify(filteredClients, null, 2);
}

// Download helper
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Export function
export function exportClients(clients: Client[], options: ExportOptions) {
  const { format, includeFields, filename } = options;
  const timestamp = new Date().toISOString().split('T')[0];
  const baseFilename = filename || `clients-export-${timestamp}`;

  switch (format) {
    case 'csv': {
      const csv = clientsToCSV(clients, includeFields);
      downloadFile(csv, `${baseFilename}.csv`, 'text/csv;charset=utf-8');
      break;
    }
    case 'json': {
      const json = clientsToJSON(clients, includeFields);
      downloadFile(json, `${baseFilename}.json`, 'application/json');
      break;
    }
    case 'excel': {
      // For Excel, we generate CSV with BOM for Excel compatibility
      const csv = '\uFEFF' + clientsToCSV(clients, includeFields);
      downloadFile(csv, `${baseFilename}.csv`, 'text/csv;charset=utf-8');
      break;
    }
  }
}

// Export Modal Component
interface ClientExportModalProps {
  clients: Client[];
  selectedClientIds?: string[];
  onClose: () => void;
}

export const ClientExportModal: React.FC<ClientExportModalProps> = ({
  clients,
  selectedClientIds,
  onClose,
}) => {
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [selectedFields, setSelectedFields] = useState<string[]>(
    EXPORT_FIELDS.filter(f => ['basic', 'loyalty', 'history'].includes(f.category)).map(f => f.key)
  );
  const [exportScope, setExportScope] = useState<'all' | 'selected'>(
    selectedClientIds && selectedClientIds.length > 0 ? 'selected' : 'all'
  );

  const clientsToExport = exportScope === 'selected' && selectedClientIds
    ? clients.filter(c => selectedClientIds.includes(c.id))
    : clients;

  const toggleField = (field: string) => {
    setSelectedFields(prev =>
      prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const toggleCategory = (category: string) => {
    const categoryFields = EXPORT_FIELDS.filter(f => f.category === category).map(f => f.key);
    const allSelected = categoryFields.every(f => selectedFields.includes(f));

    if (allSelected) {
      setSelectedFields(prev => prev.filter(f => !categoryFields.includes(f)));
    } else {
      setSelectedFields(prev => [...new Set([...prev, ...categoryFields])]);
    }
  };

  const handleExport = () => {
    exportClients(clientsToExport, {
      format,
      includeFields: selectedFields,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-cyan-50 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                <ExportIcon className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Export Clients</h2>
                <p className="text-sm text-gray-500">
                  {clientsToExport.length} client{clientsToExport.length !== 1 ? 's' : ''} will be exported
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <CloseIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Export Scope */}
          {selectedClientIds && selectedClientIds.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Export Scope</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setExportScope('all')}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                    exportScope === 'all'
                      ? 'border-cyan-500 bg-cyan-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-gray-900">All Clients</p>
                  <p className="text-sm text-gray-500">{clients.length} clients</p>
                </button>
                <button
                  onClick={() => setExportScope('selected')}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                    exportScope === 'selected'
                      ? 'border-cyan-500 bg-cyan-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-gray-900">Selected Only</p>
                  <p className="text-sm text-gray-500">{selectedClientIds.length} selected</p>
                </button>
              </div>
            </div>
          )}

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'csv', label: 'CSV', desc: 'Comma-separated values' },
                { value: 'excel', label: 'Excel', desc: 'Excel-compatible CSV' },
                { value: 'json', label: 'JSON', desc: 'JavaScript Object Notation' },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFormat(f.value as ExportFormat)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    format === f.value
                      ? 'border-cyan-500 bg-cyan-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-gray-900">{f.label}</p>
                  <p className="text-xs text-gray-500">{f.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Field Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fields to Export ({selectedFields.length} selected)
            </label>
            <div className="space-y-4 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
              {FIELD_CATEGORIES.map((category) => {
                const categoryFields = EXPORT_FIELDS.filter(f => f.category === category.key);
                const selectedInCategory = categoryFields.filter(f => selectedFields.includes(f.key)).length;
                const allSelected = selectedInCategory === categoryFields.length;

                return (
                  <div key={category.key}>
                    <button
                      onClick={() => toggleCategory(category.key)}
                      className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2 hover:text-gray-900"
                    >
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={() => {}}
                        className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                      />
                      {category.label}
                      <span className="text-xs text-gray-400">
                        ({selectedInCategory}/{categoryFields.length})
                      </span>
                    </button>
                    <div className="grid grid-cols-2 gap-2 ml-6">
                      {categoryFields.map((field) => (
                        <label
                          key={field.key}
                          className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900"
                        >
                          <input
                            type="checkbox"
                            checked={selectedFields.includes(field.key)}
                            onChange={() => toggleField(field.key)}
                            className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                          />
                          {field.label}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
          <p className="text-sm text-gray-500">
            Exporting {clientsToExport.length} client{clientsToExport.length !== 1 ? 's' : ''} with {selectedFields.length} fields
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleExport}
              disabled={selectedFields.length === 0}
            >
              <DownloadIcon className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Import Modal Component
interface ClientImportModalProps {
  onImport: (clients: Partial<Client>[]) => Promise<void>;
  onClose: () => void;
}

export const ClientImportModal: React.FC<ClientImportModalProps> = ({
  onImport,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Partial<Client>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'complete'>('upload');
  const [importResult, setImportResult] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrors([]);

    try {
      const content = await selectedFile.text();
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'json') {
        const data = JSON.parse(content);
        const clients = Array.isArray(data) ? data : [data];
        setParsedData(clients);
        setStep('preview');
      } else if (fileExtension === 'csv') {
        const clients = parseCSV(content);
        setParsedData(clients);
        setStep('preview');
      } else {
        setErrors(['Unsupported file format. Please use CSV or JSON.']);
      }
    } catch (error) {
      setErrors(['Failed to parse file. Please check the format.']);
    }
  };

  const parseCSV = (content: string): Partial<Client>[] => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const clients: Partial<Client>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const client: Partial<Client> = {};

      headers.forEach((header, index) => {
        const value = values[index]?.trim();
        if (!value) return;

        // Map common headers to client fields
        const fieldMap: Record<string, string> = {
          'first name': 'firstName',
          'last name': 'lastName',
          'phone': 'phone',
          'email': 'email',
          'birthday': 'birthday',
          'gender': 'gender',
        };

        const fieldKey = fieldMap[header.toLowerCase()] || header;
        (client as any)[fieldKey] = value;
      });

      if (client.firstName || client.lastName || client.phone) {
        clients.push(client);
      }
    }

    return clients;
  };

  const parseCSVLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);
    return values;
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      await onImport(parsedData);
      setImportResult({ success: parsedData.length, failed: 0 });
      setStep('complete');
    } catch (error) {
      setErrors(['Import failed. Please try again.']);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-green-50 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <ImportIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Import Clients</h2>
                <p className="text-sm text-gray-500">
                  {step === 'upload' && 'Upload a CSV or JSON file'}
                  {step === 'preview' && `${parsedData.length} clients ready to import`}
                  {step === 'complete' && 'Import complete'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <CloseIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-cyan-400 hover:bg-cyan-50/50 transition-colors"
              >
                <UploadIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-700 font-medium">Click to upload or drag and drop</p>
                <p className="text-sm text-gray-500 mt-1">CSV or JSON files supported</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Format Guide */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-3">Expected Format</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-600 mb-1">CSV Headers:</p>
                    <code className="text-xs bg-gray-200 px-2 py-1 rounded">
                      First Name, Last Name, Phone, Email, Birthday
                    </code>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600 mb-1">JSON Format:</p>
                    <code className="text-xs bg-gray-200 px-2 py-1 rounded block">
                      {`[{ "firstName": "John", "lastName": "Doe", "phone": "..." }]`}
                    </code>
                  </div>
                </div>
              </div>

              {/* Errors */}
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  {errors.map((error, i) => (
                    <p key={i} className="text-sm text-red-600">{error}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Review before importing</p>
                  <p className="text-xs text-yellow-600 mt-1">
                    Please verify the data below is correct before proceeding
                  </p>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-gray-600">#</th>
                        <th className="px-4 py-2 text-left text-gray-600">Name</th>
                        <th className="px-4 py-2 text-left text-gray-600">Phone</th>
                        <th className="px-4 py-2 text-left text-gray-600">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {parsedData.slice(0, 50).map((client, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-500">{i + 1}</td>
                          <td className="px-4 py-2 font-medium text-gray-900">
                            {client.firstName} {client.lastName}
                          </td>
                          <td className="px-4 py-2 text-gray-600">{client.phone || '-'}</td>
                          <td className="px-4 py-2 text-gray-600">{client.email || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedData.length > 50 && (
                  <div className="px-4 py-2 bg-gray-50 text-sm text-gray-500 text-center">
                    Showing 50 of {parsedData.length} records
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckIcon className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Import Complete!</h3>
              <p className="text-gray-600">
                Successfully imported {importResult.success} clients
              </p>
              {importResult.failed > 0 && (
                <p className="text-red-600 text-sm mt-2">
                  {importResult.failed} records failed to import
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3 flex-shrink-0">
          {step === 'upload' && (
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          )}
          {step === 'preview' && (
            <>
              <Button variant="ghost" onClick={() => { setStep('upload'); setFile(null); setParsedData([]); }}>
                Back
              </Button>
              <Button variant="primary" onClick={handleImport} disabled={importing}>
                {importing ? 'Importing...' : `Import ${parsedData.length} Clients`}
              </Button>
            </>
          )}
          {step === 'complete' && (
            <Button variant="primary" onClick={onClose}>Done</Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Icons
const ExportIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const ImportIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const AlertIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

export default ClientExportModal;
