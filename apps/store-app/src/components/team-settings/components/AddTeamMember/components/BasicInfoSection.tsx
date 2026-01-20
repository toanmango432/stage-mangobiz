/**
 * BasicInfoSection Component
 *
 * Renders the basic information form section of the Add Team Member wizard:
 * - Avatar placeholder
 * - Name fields (first name, last name)
 * - Contact fields (email, phone)
 * - Role selection
 * - Job title (optional)
 * - Bio (optional)
 */
import React from 'react';
import type { StaffRole } from '../../../types';
import type { BasicInfo } from '../types';
import { allDefaultRoles } from '../../../../role-settings/constants';

interface BasicInfoSectionProps {
  basics: BasicInfo;
  onBasicsChange: (basics: BasicInfo) => void;
  errors: Record<string, string>;
  getRoleColor: (roleId: string) => { bg: string; text: string; border: string };
  dynamicRoleLabels: Record<string, string>;
}

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  basics,
  onBasicsChange,
  errors,
  getRoleColor,
  dynamicRoleLabels,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Avatar Placeholder */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 to-brand-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {basics.firstName && basics.lastName
              ? `${basics.firstName[0]}${basics.lastName[0]}`.toUpperCase()
              : <UserIcon className="w-10 h-10" />
            }
          </div>
          <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200">
            <CameraIcon className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Name Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={basics.firstName}
            onChange={(e) => onBasicsChange({ ...basics, firstName: e.target.value })}
            className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all ${
              errors.firstName ? 'border-red-300 bg-red-50' : 'border-gray-200'
            }`}
            placeholder="Enter first name"
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={basics.lastName}
            onChange={(e) => onBasicsChange({ ...basics, lastName: e.target.value })}
            className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all ${
              errors.lastName ? 'border-red-300 bg-red-50' : 'border-gray-200'
            }`}
            placeholder="Enter last name"
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
          )}
        </div>
      </div>

      {/* Contact Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={basics.email}
              onChange={(e) => onBasicsChange({ ...basics, email: e.target.value })}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all ${
                errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
              placeholder="email@example.com"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Phone <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              value={basics.phone}
              onChange={(e) => onBasicsChange({ ...basics, phone: e.target.value })}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all ${
                errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
              placeholder="(555) 123-4567"
            />
          </div>
          {errors.phone && (
            <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
          )}
        </div>
      </div>

      {/* Role Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Role <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {allDefaultRoles.map((roleDef) => {
            const colors = getRoleColor(roleDef.id);
            const isSelected = basics.role === roleDef.id;
            return (
              <button
                key={roleDef.id}
                onClick={() => onBasicsChange({ ...basics, role: roleDef.id as StaffRole })}
                className={`
                  px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all
                  ${isSelected
                    ? 'border-current shadow-md scale-[1.02]'
                    : 'border-transparent hover:scale-[1.01]'
                  }
                `}
                style={{
                  backgroundColor: isSelected ? colors.bg : '#f9fafb',
                  color: isSelected ? colors.text : '#6b7280',
                  borderColor: isSelected ? colors.border : 'transparent',
                }}
              >
                {roleDef.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Job Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Job Title <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={basics.title}
          onChange={(e) => onBasicsChange({ ...basics, title: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
          placeholder={`e.g. ${dynamicRoleLabels[basics.role]}, Lead Colorist, etc.`}
        />
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Bio <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={basics.bio}
          onChange={(e) => onBasicsChange({ ...basics, bio: e.target.value })}
          rows={3}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all resize-none"
          placeholder="A short bio that will appear on the online booking profile..."
        />
      </div>
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

export default BasicInfoSection;
