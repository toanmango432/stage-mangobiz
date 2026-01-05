import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { EnhancedClient, ClientSource, ClientGender } from '../types';
import { defaultClient, sourceLabels, genderLabels } from '../constants';
import { Button, Input, Select, Textarea, Toggle, XIcon } from './SharedComponents';

interface AddClientProps {
  onClose: () => void;
  onSave: (client: EnhancedClient) => void;
  salonId?: string;
}

export const AddClient: React.FC<AddClientProps> = ({
  onClose,
  onSave,
  salonId = 'salon-1',
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    birthday: '',
    gender: '' as ClientGender | '',
    source: 'walk_in' as ClientSource,
    sourceDetails: '',
    notes: '',
    allowMarketing: false,
    allowSms: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is edited
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\s\-()+ ]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const now = new Date().toISOString();
    const newClient: EnhancedClient = {
      id: uuidv4(),
      salonId,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      displayName: `${formData.firstName.trim()} ${formData.lastName.trim().charAt(0)}.`,
      gender: formData.gender || undefined,
      birthday: formData.birthday || undefined,
      contact: {
        phone: formData.phone.trim(),
        phoneType: 'mobile',
        email: formData.email.trim() || undefined,
        preferredContact: 'sms',
      },
      source: formData.source,
      sourceDetails: formData.sourceDetails || undefined,
      communicationPreferences: {
        ...defaultClient.communicationPreferences!,
        allowMarketing: formData.allowMarketing,
        allowSms: formData.allowSms,
      },
      loyaltyInfo: {
        ...defaultClient.loyaltyInfo!,
        memberSince: now,
        referralCode: `${formData.firstName.toUpperCase().slice(0, 4)}${new Date().getFullYear()}`,
      },
      visitSummary: { ...defaultClient.visitSummary! },
      notes: formData.notes
        ? [
            {
              id: uuidv4(),
              date: now,
              content: formData.notes,
              type: 'general' as const,
              isPrivate: false,
              createdBy: 'system',
              createdByName: 'System',
            },
          ]
        : undefined,
      tags: [{ id: 'tag-new', name: 'New Client', color: '#10B981' }],
      isVip: false,
      isBlocked: false,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
    };

    onSave(newClient);
  };

  const sourceOptions = Object.entries(sourceLabels).map(([value, label]) => ({
    value,
    label,
  }));

  const genderOptions = Object.entries(genderLabels).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Add New Client</h2>
            <p className="text-sm text-gray-500">Enter client information</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-5">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Basic Information
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={formData.firstName}
                  onChange={(v) => handleChange('firstName', v)}
                  placeholder="Enter first name"
                  error={errors.firstName}
                  required
                />
                <Input
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(v) => handleChange('lastName', v)}
                  placeholder="Enter last name"
                  error={errors.lastName}
                  required
                />
              </div>

              <Input
                label="Phone Number"
                value={formData.phone}
                onChange={(v) => handleChange('phone', v)}
                placeholder="(555) 123-4567"
                type="tel"
                error={errors.phone}
                required
              />

              <Input
                label="Email"
                value={formData.email}
                onChange={(v) => handleChange('email', v)}
                placeholder="email@example.com"
                type="email"
                error={errors.email}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Birthday"
                  value={formData.birthday}
                  onChange={(v) => handleChange('birthday', v)}
                  type="date"
                />
                <Select
                  label="Gender"
                  value={formData.gender}
                  onChange={(v) => handleChange('gender', v)}
                  options={genderOptions}
                  placeholder="Select..."
                />
              </div>
            </div>

            {/* Source Section */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                How did they find you?
              </h3>

              <Select
                label="Source"
                value={formData.source}
                onChange={(v) => handleChange('source', v)}
                options={sourceOptions}
              />

              {(formData.source === 'referral' || formData.source === 'other') && (
                <Input
                  label={formData.source === 'referral' ? 'Referred by' : 'Details'}
                  value={formData.sourceDetails}
                  onChange={(v) => handleChange('sourceDetails', v)}
                  placeholder={
                    formData.source === 'referral'
                      ? "Enter referrer's name"
                      : 'Provide details'
                  }
                />
              )}
            </div>

            {/* Notes Section */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Notes
              </h3>

              <Textarea
                label="Initial Notes"
                value={formData.notes}
                onChange={(v) => handleChange('notes', v)}
                placeholder="Add any notes about this client (allergies, preferences, etc.)"
                rows={3}
              />
            </div>

            {/* Communication Preferences */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Communication Preferences
              </h3>

              <Toggle
                label="Allow SMS Reminders"
                description="Send appointment reminders via text message"
                checked={formData.allowSms}
                onChange={(v) => handleChange('allowSms', v)}
              />

              <Toggle
                label="Allow Marketing Messages"
                description="Send promotional offers and updates"
                checked={formData.allowMarketing}
                onChange={(v) => handleChange('allowMarketing', v)}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Add Client
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddClient;
