import React, { useState } from 'react';
import type { EnhancedClient, ClientGender, ClientSource, EmergencyContact } from '../types';
import type { BlockReason } from '@/types';
import { genderLabels, sourceLabels } from '../constants';
import {
  Card,
  Input,
  Select,
  Toggle,
  Avatar,
  Badge,
  Button,
  PhoneIcon,
  MailIcon,
  CalendarIcon,
} from '../components/SharedComponents';
import { StaffAlertBanner } from '../components/StaffAlertBanner';
import { BlockClientModal } from '../components/BlockClientModal';

interface ProfileSectionProps {
  client: EnhancedClient;
  onChange: (updates: Partial<EnhancedClient>) => void;
  onSetStaffAlert?: (message: string) => void;
  onClearStaffAlert?: () => void;
  onBlockClient?: (reason: BlockReason, note?: string) => void;
  onUnblockClient?: () => void;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  client,
  onChange,
  onSetStaffAlert,
  onClearStaffAlert,
  onBlockClient,
  onUnblockClient,
}) => {
  const [showBlockModal, setShowBlockModal] = useState(false);

  const updateContact = (field: string, value: string) => {
    onChange({
      contact: { ...client.contact, [field]: value },
    });
  };

  const updateAddress = (field: string, value: string) => {
    onChange({
      address: { ...client.address, [field]: value },
    });
  };

  const updateEmergencyContact = (index: number, field: keyof EmergencyContact, value: string) => {
    const contacts = [...(client.emergencyContact ? [client.emergencyContact] : [])];
    if (contacts[index]) {
      contacts[index] = { ...contacts[index], [field]: value };
      onChange({ emergencyContact: contacts[0] });
    }
  };

  const addEmergencyContact = () => {
    onChange({
      emergencyContact: { name: '', phone: '', relationship: '' },
    });
  };

  const removeEmergencyContact = () => {
    onChange({ emergencyContact: undefined });
  };

  const handleSetStaffAlert = (message: string) => {
    if (onSetStaffAlert) {
      onSetStaffAlert(message);
    }
  };

  const handleClearStaffAlert = () => {
    if (onClearStaffAlert) {
      onClearStaffAlert();
    }
  };

  const handleBlock = (reason: BlockReason, note?: string) => {
    if (onBlockClient) {
      onBlockClient(reason, note);
    }
    setShowBlockModal(false);
  };

  const handleUnblock = () => {
    if (onUnblockClient) {
      onUnblockClient();
    }
    setShowBlockModal(false);
  };

  const genderOptions = Object.entries(genderLabels).map(([value, label]) => ({
    value,
    label,
  }));

  const sourceOptions = Object.entries(sourceLabels).map(([value, label]) => ({
    value,
    label,
  }));

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Convert client's staffAlert to the expected format if needed
  const staffAlert = client.staffAlert ? {
    message: typeof client.staffAlert === 'string' ? client.staffAlert : (client.staffAlert as any).message,
    createdAt: typeof client.staffAlert === 'object' ? (client.staffAlert as any).createdAt : new Date().toISOString(),
    createdBy: typeof client.staffAlert === 'object' ? (client.staffAlert as any).createdBy : '',
    createdByName: typeof client.staffAlert === 'object' ? (client.staffAlert as any).createdByName : 'Staff',
  } : undefined;

  return (
    <div className="space-y-6">
      {/* Staff Alert Banner - High Visibility */}
      {(onSetStaffAlert || staffAlert) && (
        <StaffAlertBanner
          alert={staffAlert}
          onSetAlert={handleSetStaffAlert}
          onClearAlert={handleClearStaffAlert}
          canEdit={!!onSetStaffAlert}
        />
      )}

      {/* Blocked Client Warning */}
      {client.isBlocked && (
        <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <BlockIcon className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-800">Client is Blocked</h3>
              <p className="text-sm text-red-600 mt-1">
                This client cannot book appointments.
                {client.blockReason && ` Reason: ${client.blockReason}`}
              </p>
              {onUnblockClient && (
                <button
                  onClick={() => setShowBlockModal(true)}
                  className="mt-2 text-sm font-medium text-red-700 hover:text-red-800 underline"
                >
                  Manage block status
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <Card>
        <div className="flex items-start gap-6">
          <div className="relative">
            <Avatar
              src={client.avatar}
              name={`${client.firstName} ${client.lastName}`}
              size="xl"
            />
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50">
              <CameraIcon className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-semibold text-gray-900">
                {client.firstName} {client.lastName}
              </h2>
              {client.isVip && (
                <Badge variant="warning" size="sm">VIP</Badge>
              )}
              {client.isBlocked && (
                <Badge variant="error" size="sm">Blocked</Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <PhoneIcon className="w-4 h-4 text-gray-400" />
                {client.contact.phone}
              </div>
              {client.contact.email && (
                <div className="flex items-center gap-1.5">
                  <MailIcon className="w-4 h-4 text-gray-400" />
                  {client.contact.email}
                </div>
              )}
              {client.birthday && (
                <div className="flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-gray-400" />
                  {formatDate(client.birthday)}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-500">Client since</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(client.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total visits</p>
                <p className="text-sm font-medium text-gray-900">
                  {client.visitSummary.totalVisits}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total spent</p>
                <p className="text-sm font-medium text-gray-900">
                  ${client.visitSummary.totalSpent.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Basic Information */}
      <Card title="Basic Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="First Name"
            value={client.firstName}
            onChange={(v) => onChange({ firstName: v })}
            required
          />
          <Input
            label="Last Name"
            value={client.lastName}
            onChange={(v) => onChange({ lastName: v })}
            required
          />
          <Input
            label="Display Name / Nickname"
            value={client.displayName || ''}
            onChange={(v) => onChange({ displayName: v })}
            placeholder="How they like to be called"
          />
          <Select
            label="Gender"
            value={client.gender || ''}
            onChange={(v) => onChange({ gender: v as ClientGender })}
            options={genderOptions}
            placeholder="Select gender"
          />
          <Input
            label="Birthday"
            value={client.birthday || ''}
            onChange={(v) => onChange({ birthday: v })}
            type="date"
          />
        </div>
      </Card>

      {/* Contact Information */}
      <Card title="Contact Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Phone Number"
            value={client.contact.phone}
            onChange={(v) => updateContact('phone', v)}
            type="tel"
            required
          />
          <Select
            label="Phone Type"
            value={client.contact.phoneType}
            onChange={(v) => updateContact('phoneType', v)}
            options={[
              { value: 'mobile', label: 'Mobile' },
              { value: 'home', label: 'Home' },
              { value: 'work', label: 'Work' },
            ]}
          />
          <Input
            label="Email"
            value={client.contact.email || ''}
            onChange={(v) => updateContact('email', v)}
            type="email"
            placeholder="email@example.com"
          />
          <Input
            label="Alternate Phone"
            value={client.contact.alternatePhone || ''}
            onChange={(v) => updateContact('alternatePhone', v)}
            type="tel"
            placeholder="(555) 123-4567"
          />
        </div>
      </Card>

      {/* Address */}
      <Card title="Address">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Street Address"
            value={client.address?.street || ''}
            onChange={(v) => updateAddress('street', v)}
            placeholder="123 Main Street"
            className="md:col-span-2"
          />
          <Input
            label="Apt/Suite"
            value={client.address?.apt || ''}
            onChange={(v) => updateAddress('apt', v)}
            placeholder="Apt 4B"
          />
          <Input
            label="City"
            value={client.address?.city || ''}
            onChange={(v) => updateAddress('city', v)}
            placeholder="Los Angeles"
          />
          <Input
            label="State"
            value={client.address?.state || ''}
            onChange={(v) => updateAddress('state', v)}
            placeholder="CA"
          />
          <Input
            label="ZIP Code"
            value={client.address?.zipCode || ''}
            onChange={(v) => updateAddress('zipCode', v)}
            placeholder="90001"
          />
        </div>
      </Card>

      {/* Emergency Contact */}
      <Card title="Emergency Contact">
        {client.emergencyContact ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Contact Name"
                value={client.emergencyContact.name}
                onChange={(v) => updateEmergencyContact(0, 'name', v)}
                placeholder="John Doe"
                required
              />
              <Input
                label="Phone Number"
                value={client.emergencyContact.phone}
                onChange={(v) => updateEmergencyContact(0, 'phone', v)}
                type="tel"
                placeholder="(555) 123-4567"
                required
              />
              <Input
                label="Relationship"
                value={client.emergencyContact.relationship}
                onChange={(v) => updateEmergencyContact(0, 'relationship', v)}
                placeholder="Spouse, Parent, etc."
                required
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={removeEmergencyContact}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Remove Emergency Contact
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <EmergencyIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-3">
              No emergency contact on file
            </p>
            <Button variant="secondary" size="sm" onClick={addEmergencyContact}>
              Add Emergency Contact
            </Button>
          </div>
        )}
      </Card>

      {/* Source & Referral */}
      <Card title="How They Found You">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Source"
            value={client.source || ''}
            onChange={(v) => onChange({ source: v as ClientSource })}
            options={sourceOptions}
            placeholder="Select source"
          />
          {client.source === 'referral' && (
            <Input
              label="Referred By"
              value={client.referredByClientName || ''}
              onChange={(v) => onChange({ referredByClientName: v })}
              placeholder="Enter referrer's name"
            />
          )}
        </div>
      </Card>

      {/* Status Settings */}
      <Card title="Client Status">
        <div className="space-y-4">
          <Toggle
            label="VIP Client"
            description="Mark this client as a VIP for priority service"
            checked={client.isVip}
            onChange={(v) => onChange({ isVip: v })}
          />

          {/* Block/Unblock with modal */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Block Status</p>
              <p className="text-sm text-gray-500">
                {client.isBlocked
                  ? 'This client is blocked from booking'
                  : 'Client can book appointments normally'
                }
              </p>
            </div>
            <button
              onClick={() => setShowBlockModal(true)}
              className={`
                px-4 py-2 text-sm font-medium rounded-lg transition-colors
                ${client.isBlocked
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                }
              `}
            >
              {client.isBlocked ? 'Unblock Client' : 'Block Client'}
            </button>
          </div>
        </div>
      </Card>

      {/* Block Client Modal */}
      {showBlockModal && (
        <BlockClientModal
          clientName={`${client.firstName} ${client.lastName}`}
          isBlocked={client.isBlocked}
          currentReason={client.blockReason as any}
          currentNote={client.blockReason}
          onBlock={handleBlock}
          onUnblock={handleUnblock}
          onClose={() => setShowBlockModal(false)}
        />
      )}
    </div>
  );
};

// Camera Icon
const CameraIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// Block Icon
const BlockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);

// Emergency Icon
const EmergencyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
);

export default ProfileSection;
