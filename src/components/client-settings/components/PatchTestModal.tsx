import React, { useState, useEffect } from 'react';
import type { PatchTest, PatchTestResult } from '@/types';
import { Button, Input, Select, Textarea } from './SharedComponents';

interface PatchTestModalProps {
  clientId: string;
  existingTest?: PatchTest;
  serviceOptions: { value: string; label: string }[];
  staffName: string;
  onSave: (test: Omit<PatchTest, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>) => void;
  onClose: () => void;
}

const RESULT_OPTIONS: { value: PatchTestResult; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'text-yellow-600' },
  { value: 'pass', label: 'Pass', color: 'text-green-600' },
  { value: 'fail', label: 'Fail', color: 'text-red-600' },
];

export const PatchTestModal: React.FC<PatchTestModalProps> = ({
  clientId,
  existingTest,
  serviceOptions,
  staffName,
  onSave,
  onClose,
}) => {
  const [serviceId, setServiceId] = useState(existingTest?.serviceId || '');
  const [serviceName, setServiceName] = useState(existingTest?.serviceName || '');
  const [testDate, setTestDate] = useState(
    existingTest?.testDate?.split('T')[0] || new Date().toISOString().split('T')[0]
  );
  const [result, setResult] = useState<PatchTestResult>(existingTest?.result || 'pending');
  const [expiresAt, setExpiresAt] = useState(
    existingTest?.expiresAt?.split('T')[0] || getDefaultExpiryDate()
  );
  const [notes, setNotes] = useState(existingTest?.notes || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update service name when service is selected
  useEffect(() => {
    if (serviceId) {
      const selected = serviceOptions.find(s => s.value === serviceId);
      if (selected) {
        setServiceName(selected.label);
      }
    }
  }, [serviceId, serviceOptions]);

  function getDefaultExpiryDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() + 6); // Default 6 months expiry
    return date.toISOString().split('T')[0];
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!serviceId) {
      newErrors.serviceId = 'Please select a service';
    }
    if (!testDate) {
      newErrors.testDate = 'Please enter a test date';
    }
    if (!expiresAt) {
      newErrors.expiresAt = 'Please enter an expiry date';
    } else if (new Date(expiresAt) <= new Date(testDate)) {
      newErrors.expiresAt = 'Expiry date must be after test date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    onSave({
      clientId,
      serviceId,
      serviceName,
      testDate: new Date(testDate).toISOString(),
      result,
      expiresAt: new Date(expiresAt).toISOString(),
      performedBy: 'current-user', // Would come from auth context
      performedByName: staffName,
      notes: notes.trim() || undefined,
    });
  };

  const isExpired = new Date(expiresAt) < new Date();
  const daysUntilExpiry = Math.ceil(
    (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-purple-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <TestTubeIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {existingTest ? 'Edit Patch Test' : 'New Patch Test'}
                </h2>
                <p className="text-sm text-gray-500">Record patch test results</p>
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
        <div className="p-6 space-y-4">
          {/* Service Selection */}
          <Select
            label="Service"
            value={serviceId}
            onChange={setServiceId}
            options={serviceOptions}
            placeholder="Select service requiring patch test..."
            required
          />
          {errors.serviceId && (
            <p className="text-xs text-red-500 -mt-3">{errors.serviceId}</p>
          )}

          {/* Test Date */}
          <Input
            label="Test Date"
            type="date"
            value={testDate}
            onChange={setTestDate}
            required
            error={errors.testDate}
          />

          {/* Result */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Result <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {RESULT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setResult(option.value)}
                  className={`
                    px-4 py-3 rounded-lg border-2 transition-all text-center
                    ${result === option.value
                      ? option.value === 'pass'
                        ? 'border-green-500 bg-green-50'
                        : option.value === 'fail'
                          ? 'border-red-500 bg-red-50'
                          : 'border-yellow-500 bg-yellow-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <span className={`font-medium ${result === option.value ? option.color : 'text-gray-700'}`}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Expiry Date */}
          <Input
            label="Expires On"
            type="date"
            value={expiresAt}
            onChange={setExpiresAt}
            required
            error={errors.expiresAt}
          />

          {/* Expiry Warning */}
          {expiresAt && (
            <div className={`text-xs ${isExpired ? 'text-red-600' : daysUntilExpiry <= 14 ? 'text-orange-600' : 'text-gray-500'}`}>
              {isExpired
                ? 'This test has expired'
                : daysUntilExpiry <= 14
                  ? `Expires in ${daysUntilExpiry} days`
                  : `Valid for ${daysUntilExpiry} days`
              }
            </div>
          )}

          {/* Notes */}
          <Textarea
            label="Notes (Optional)"
            value={notes}
            onChange={setNotes}
            placeholder="Any additional notes about the patch test..."
            rows={2}
          />

          {/* Performed By */}
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <UserIcon className="w-4 h-4" />
            Performed by: <span className="font-medium text-gray-700">{staffName}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            {existingTest ? 'Update Test' : 'Save Test'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Icons
const TestTubeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export default PatchTestModal;
