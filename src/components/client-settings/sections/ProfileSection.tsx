import React from 'react';
import type { EnhancedClient, ClientGender, ClientSource } from '../types';
import { genderLabels, sourceLabels } from '../constants';
import {
  Card,
  Input,
  Select,
  Toggle,
  Avatar,
  Badge,
  PhoneIcon,
  MailIcon,
  CalendarIcon,
} from '../components/SharedComponents';

interface ProfileSectionProps {
  client: EnhancedClient;
  onChange: (updates: Partial<EnhancedClient>) => void;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({ client, onChange }) => {
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

  return (
    <div className="space-y-6">
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
          <Toggle
            label="Block Client"
            description="Prevent this client from booking appointments"
            checked={client.isBlocked}
            onChange={(v) => onChange({ isBlocked: v })}
          />
          {client.isBlocked && (
            <Input
              label="Block Reason"
              value={client.blockReason || ''}
              onChange={(v) => onChange({ blockReason: v })}
              placeholder="Enter reason for blocking"
            />
          )}
        </div>
      </Card>
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

export default ProfileSection;
