import React from 'react';
import type { TeamMemberProfile } from '../types';
import { Card, SectionHeader, Input, Textarea, Button, Avatar, Badge, Divider } from '../components/SharedComponents';

interface ProfileSectionProps {
  profile: TeamMemberProfile;
  isActive: boolean;
  onChange: (profile: TeamMemberProfile) => void;
  onToggleActive: () => void;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  profile,
  isActive,
  onChange,
  onToggleActive,
}) => {
  const updateProfile = (field: keyof TeamMemberProfile, value: string) => {
    onChange({ ...profile, [field]: value });
  };

  const updateEmergencyContact = (field: string, value: string) => {
    onChange({
      ...profile,
      emergencyContact: {
        ...profile.emergencyContact!,
        [field]: value,
      },
    });
  };

  const updateAddress = (field: string, value: string) => {
    onChange({
      ...profile,
      address: {
        ...profile.address!,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <Card padding="lg" className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-cyan-500 to-teal-400" />

        <div className="relative">
          {/* Avatar and Status */}
          <div className="flex items-end gap-4 mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-white">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={`${profile.firstName} ${profile.lastName}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {profile.firstName[0]}{profile.lastName[0]}
                    </span>
                  </div>
                )}
              </div>
              <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                <CameraIcon className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <div className="flex-1 pb-2">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">
                  {profile.firstName} {profile.lastName}
                </h2>
                <Badge
                  variant={isActive ? 'success' : 'error'}
                  dot
                  dotColor={isActive ? '#66BB6A' : '#EF5350'}
                >
                  {isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mt-1">{profile.title || profile.displayName}</p>
            </div>

            <Button
              variant={isActive ? 'outline' : 'primary'}
              size="sm"
              onClick={onToggleActive}
            >
              {isActive ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Basic Information */}
      <Card padding="lg">
        <SectionHeader
          title="Basic Information"
          subtitle="Personal details and contact information"
          icon={<UserIcon className="w-5 h-5" />}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="First Name"
            value={profile.firstName}
            onChange={(value) => updateProfile('firstName', value)}
            required
          />
          <Input
            label="Last Name"
            value={profile.lastName}
            onChange={(value) => updateProfile('lastName', value)}
            required
          />
          <Input
            label="Display Name"
            value={profile.displayName}
            onChange={(value) => updateProfile('displayName', value)}
            placeholder="How they appear on bookings"
          />
          <Input
            label="Title / Position"
            value={profile.title || ''}
            onChange={(value) => updateProfile('title', value)}
            placeholder="e.g., Senior Stylist"
          />
          <Input
            label="Email"
            type="email"
            value={profile.email}
            onChange={(value) => updateProfile('email', value)}
            required
            prefix={<MailIcon className="w-4 h-4" />}
          />
          <Input
            label="Phone"
            type="tel"
            value={profile.phone}
            onChange={(value) => updateProfile('phone', value)}
            required
            prefix={<PhoneIcon className="w-4 h-4" />}
          />
          <Input
            label="Employee ID"
            value={profile.employeeId || ''}
            onChange={(value) => updateProfile('employeeId', value)}
            placeholder="Optional"
          />
          <Input
            label="Date of Birth"
            type="text"
            value={profile.dateOfBirth || ''}
            onChange={(value) => updateProfile('dateOfBirth', value)}
            placeholder="MM/DD/YYYY"
          />
          <div className="md:col-span-2">
            <Input
              label="Hire Date"
              type="text"
              value={profile.hireDate || ''}
              onChange={(value) => updateProfile('hireDate', value)}
              placeholder="MM/DD/YYYY"
            />
          </div>
        </div>
      </Card>

      {/* Bio / About */}
      <Card padding="lg">
        <SectionHeader
          title="About"
          subtitle="Bio that appears on online booking profile"
          icon={<DocumentIcon className="w-5 h-5" />}
        />

        <Textarea
          label="Bio"
          value={profile.bio || ''}
          onChange={(value) => updateProfile('bio', value)}
          placeholder="Tell clients about this team member's experience, specialties, and what makes them unique..."
          rows={5}
          maxLength={500}
        />

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 flex items-start gap-2">
            <InfoIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              This bio will be displayed on your online booking page. Keep it friendly and professional
              to help clients choose the right team member for their needs.
            </span>
          </p>
        </div>
      </Card>

      {/* Address */}
      <Card padding="lg">
        <SectionHeader
          title="Address"
          subtitle="Home address for records"
          icon={<LocationIcon className="w-5 h-5" />}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Input
              label="Street Address"
              value={profile.address?.street || ''}
              onChange={(value) => updateAddress('street', value)}
              placeholder="123 Main St"
            />
          </div>
          <Input
            label="City"
            value={profile.address?.city || ''}
            onChange={(value) => updateAddress('city', value)}
            placeholder="City"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="State"
              value={profile.address?.state || ''}
              onChange={(value) => updateAddress('state', value)}
              placeholder="CA"
            />
            <Input
              label="ZIP Code"
              value={profile.address?.zipCode || ''}
              onChange={(value) => updateAddress('zipCode', value)}
              placeholder="90210"
            />
          </div>
        </div>
      </Card>

      {/* Emergency Contact */}
      <Card padding="lg">
        <SectionHeader
          title="Emergency Contact"
          subtitle="Person to contact in case of emergency"
          icon={<AlertIcon className="w-5 h-5" />}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Input
            label="Contact Name"
            value={profile.emergencyContact?.name || ''}
            onChange={(value) => updateEmergencyContact('name', value)}
            placeholder="Full name"
          />
          <Input
            label="Phone Number"
            type="tel"
            value={profile.emergencyContact?.phone || ''}
            onChange={(value) => updateEmergencyContact('phone', value)}
            placeholder="(555) 123-4567"
          />
          <Input
            label="Relationship"
            value={profile.emergencyContact?.relationship || ''}
            onChange={(value) => updateEmergencyContact('relationship', value)}
            placeholder="e.g., Spouse, Parent"
          />
        </div>
      </Card>

      {/* Danger Zone */}
      <Card padding="lg" className="border-red-200">
        <SectionHeader
          title="Danger Zone"
          subtitle="Irreversible actions"
          icon={<WarningIcon className="w-5 h-5 text-red-500" />}
        />

        <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
          <div>
            <h4 className="font-medium text-red-800">Delete Team Member</h4>
            <p className="text-sm text-red-600 mt-0.5">
              Permanently remove this team member and all associated data
            </p>
          </div>
          <Button variant="danger" size="sm">
            Delete
          </Button>
        </div>
      </Card>
    </div>
  );
};

// Icons
const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const CameraIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const MailIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const PhoneIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const DocumentIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const LocationIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const AlertIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const WarningIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

export default ProfileSection;
