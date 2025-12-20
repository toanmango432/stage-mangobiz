import React, { useState } from 'react';
import type { ClientFormResponse } from '@/types';
import { Button, Badge, Card } from './SharedComponents';

interface ConsultationFormsCardProps {
  formResponses: ClientFormResponse[];
  onViewResponse: (response: ClientFormResponse) => void;
  onSendForm?: (templateId: string) => void;
  onResendForm?: (responseId: string) => void;
  availableTemplates?: { id: string; name: string }[];
  canManage?: boolean;
}

export const ConsultationFormsCard: React.FC<ConsultationFormsCardProps> = ({
  formResponses,
  onViewResponse,
  onSendForm,
  onResendForm,
  availableTemplates = [],
  canManage = true,
}) => {
  const [showSendForm, setShowSendForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusInfo = (status: ClientFormResponse['status']) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', variant: 'warning' as const, icon: ClockIcon };
      case 'completed':
        return { label: 'Completed', variant: 'success' as const, icon: CheckIcon };
      case 'expired':
        return { label: 'Expired', variant: 'error' as const, icon: XIcon };
      default:
        return { label: status, variant: 'default' as const, icon: DocumentIcon };
    }
  };

  const sortedResponses = [...formResponses].sort((a, b) => {
    // Sort by status (pending first), then by date
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime();
  });

  const pendingCount = formResponses.filter(r => r.status === 'pending').length;

  const handleSendForm = () => {
    if (selectedTemplate && onSendForm) {
      onSendForm(selectedTemplate);
      setSelectedTemplate('');
      setShowSendForm(false);
    }
  };

  return (
    <Card
      title="Consultation Forms"
      description="Medical history and consent documents"
      actions={
        canManage && availableTemplates.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => setShowSendForm(!showSendForm)}>
            <SendIcon className="w-4 h-4" />
            Send Form
          </Button>
        )
      }
    >
      {/* Pending Alert */}
      {pendingCount > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <ClockIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              {pendingCount} Form{pendingCount > 1 ? 's' : ''} Awaiting Completion
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              Client has pending forms that need to be completed before their appointment.
            </p>
          </div>
        </div>
      )}

      {/* Send Form Panel */}
      {showSendForm && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Send New Form</h4>
          <div className="flex gap-3">
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">Select a form template...</option>
              {availableTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSendForm}
              disabled={!selectedTemplate}
            >
              Send
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowSendForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Form Responses List */}
      {sortedResponses.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <DocumentIcon className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">No consultation forms</p>
          {canManage && availableTemplates.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              Send a form to collect client information
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedResponses.map((response) => {
            const statusInfo = getStatusInfo(response.status);
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={response.id}
                className={`
                  p-4 rounded-lg border transition-colors
                  ${response.status === 'pending'
                    ? 'bg-yellow-50 border-yellow-200'
                    : response.status === 'expired'
                      ? 'bg-gray-50 border-gray-200'
                      : 'bg-white border-gray-200'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                      ${response.status === 'completed'
                        ? 'bg-green-100'
                        : response.status === 'pending'
                          ? 'bg-yellow-100'
                          : 'bg-gray-100'
                      }
                    `}>
                      <StatusIcon className={`w-5 h-5 ${
                        response.status === 'completed'
                          ? 'text-green-600'
                          : response.status === 'pending'
                            ? 'text-yellow-600'
                            : 'text-gray-500'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {response.templateName || 'Consultation Form'}
                        </span>
                        <Badge variant={statusInfo.variant} size="sm">
                          {statusInfo.label}
                        </Badge>
                      </div>

                      <div className="text-sm text-gray-500 space-y-1">
                        <p className="flex items-center gap-1">
                          <SendIcon className="w-3.5 h-3.5" />
                          Sent: {formatDate(response.sentAt)}
                        </p>
                        {response.completedAt && (
                          <p className="flex items-center gap-1">
                            <CheckIcon className="w-3.5 h-3.5 text-green-500" />
                            Completed: {formatDate(response.completedAt)}
                          </p>
                        )}
                        {response.signatureImage && (
                          <p className="flex items-center gap-1 text-green-600">
                            <SignatureIcon className="w-3.5 h-3.5" />
                            Signed
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {response.status === 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewResponse(response)}
                      >
                        <EyeIcon className="w-4 h-4" />
                        View
                      </Button>
                    )}
                    {response.status === 'pending' && onResendForm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onResendForm(response.id)}
                      >
                        <RefreshIcon className="w-4 h-4" />
                        Resend
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Consultation forms help collect important medical and consent information before appointments.
        </p>
      </div>
    </Card>
  );
};

// Icons
const DocumentIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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

const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const EyeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const RefreshIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const SignatureIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

export default ConsultationFormsCard;
