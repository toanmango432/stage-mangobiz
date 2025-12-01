import React from 'react';
import type { ClientFormResponse, FormTemplate, FormSection } from '../../../types';
import { Button, Badge } from './SharedComponents';

interface FormResponseViewerProps {
  response: ClientFormResponse;
  template?: FormTemplate;
  onClose: () => void;
  onPrint?: () => void;
}

export const FormResponseViewer: React.FC<FormResponseViewerProps> = ({
  response,
  template,
  onClose,
  onPrint,
}) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const renderFieldValue = (section: FormSection, value: any) => {
    if (value === undefined || value === null || value === '') {
      return <span className="text-gray-400 italic">Not provided</span>;
    }

    switch (section.type) {
      case 'single_choice':
        return <span>{value}</span>;

      case 'multi_choice':
        if (Array.isArray(value)) {
          return (
            <div className="flex flex-wrap gap-1">
              {value.map((item, idx) => (
                <Badge key={idx} variant="info" size="sm">
                  {item}
                </Badge>
              ))}
            </div>
          );
        }
        return <span>{value}</span>;

      case 'consent_checkbox':
        return (
          <div className="flex items-center gap-2">
            {value ? (
              <>
                <CheckIcon className="w-4 h-4 text-green-500" />
                <span className="text-green-600">Agreed</span>
              </>
            ) : (
              <>
                <XIcon className="w-4 h-4 text-red-500" />
                <span className="text-red-600">Not agreed</span>
              </>
            )}
          </div>
        );

      case 'date_picker':
        return <span>{new Date(value).toLocaleDateString()}</span>;

      case 'file_upload':
        return (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline">
            View uploaded file
          </a>
        );

      case 'signature':
        return value ? (
          <img src={value} alt="Signature" className="max-h-16 border border-gray-200 rounded" />
        ) : (
          <span className="text-gray-400 italic">No signature</span>
        );

      default:
        return <span className="whitespace-pre-wrap">{String(value)}</span>;
    }
  };

  // Use template sections if available, otherwise show raw responses
  const sections = template?.sections || [];
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-cyan-50 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                <DocumentIcon className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {response.templateName || 'Consultation Form'}
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Badge
                    variant={response.status === 'completed' ? 'success' : response.status === 'pending' ? 'warning' : 'error'}
                    size="sm"
                  >
                    {response.status.charAt(0).toUpperCase() + response.status.slice(1)}
                  </Badge>
                  {response.completedAt && (
                    <span>Completed {formatDate(response.completedAt)}</span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <CloseIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Signature Section */}
          {response.signatureImage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-green-800">Digitally Signed</p>
                  <p className="text-xs text-green-600 mt-1">
                    Signed on {response.completedAt ? formatDate(response.completedAt) : 'N/A'}
                    {response.completedBy === 'client' ? ' by client' : ' by staff'}
                  </p>
                  <div className="mt-3 p-2 bg-white rounded border border-green-200">
                    <img
                      src={response.signatureImage}
                      alt="Client signature"
                      className="max-h-20"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Responses */}
          {sortedSections.length > 0 ? (
            <div className="space-y-6">
              {sortedSections.map((section) => {
                // Skip info text sections in the viewer
                if (section.type === 'info_text') return null;
                // Skip client_details as that's auto-filled
                if (section.type === 'client_details') return null;

                const value = response.responses[section.id];

                return (
                  <div key={section.id} className="border-b border-gray-100 pb-4 last:border-0">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {section.label}
                      {section.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <div className="text-gray-900">
                      {renderFieldValue(section, value)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Fallback: show raw responses if no template available
            <div className="space-y-4">
              <p className="text-sm text-gray-500 mb-4">Form responses:</p>
              {Object.entries(response.responses).map(([key, value]) => (
                <div key={key} className="border-b border-gray-100 pb-4 last:border-0">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </label>
                  <div className="text-gray-900">
                    {typeof value === 'boolean' ? (
                      value ? 'Yes' : 'No'
                    ) : Array.isArray(value) ? (
                      value.join(', ')
                    ) : (
                      String(value)
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Metadata */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Form Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Sent</p>
                <p className="text-gray-900">{formatDate(response.sentAt)}</p>
              </div>
              {response.completedAt && (
                <div>
                  <p className="text-gray-500">Completed</p>
                  <p className="text-gray-900">{formatDate(response.completedAt)}</p>
                </div>
              )}
              <div>
                <p className="text-gray-500">Completed By</p>
                <p className="text-gray-900">
                  {response.completedBy === 'client' ? 'Client' : 'Staff Member'}
                </p>
              </div>
              {response.ipAddress && (
                <div>
                  <p className="text-gray-500">IP Address</p>
                  <p className="text-gray-900 font-mono text-xs">{response.ipAddress}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3 flex-shrink-0">
          {onPrint && (
            <Button variant="outline" onClick={onPrint}>
              <PrintIcon className="w-4 h-4" />
              Print
            </Button>
          )}
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

// Icons
const DocumentIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PrintIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
  </svg>
);

export default FormResponseViewer;
