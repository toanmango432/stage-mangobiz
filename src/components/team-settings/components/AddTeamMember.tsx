import React, { useState, useCallback } from 'react';
import type {
  TeamMemberSettings,
  StaffRole,
  WorkingDay,
  ServicePricing
} from '../types';
import {
  teamSettingsTokens,
  defaultWorkingHours,
  dayNames,
  mockServices
} from '../constants';
import { Button, Toggle } from './SharedComponents';
import { allDefaultRoles } from '../../role-settings/constants';
import { isValidEmail } from '../validation/validate';

// Generate dynamic role labels from role-settings
const getDynamicRoleLabels = (): Record<string, string> => {
  const labels: Record<string, string> = {};
  allDefaultRoles.forEach(role => {
    labels[role.id] = role.name;
  });
  return labels;
};

const dynamicRoleLabels = getDynamicRoleLabels();

// UUID v4 generator
function generateUUID(): string {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface AddTeamMemberProps {
  onClose: () => void;
  onSave: (member: TeamMemberSettings) => void;
  existingEmails?: string[];
}

type WizardStep = 'basics' | 'schedule' | 'services' | 'review';

interface BasicInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: StaffRole;
  title: string;
  bio: string;
}

const STEPS: { id: WizardStep; label: string; description: string }[] = [
  { id: 'basics', label: 'Basic Info', description: 'Personal details & role' },
  { id: 'schedule', label: 'Schedule', description: 'Working hours' },
  { id: 'services', label: 'Services', description: 'Assign services' },
  { id: 'review', label: 'Review', description: 'Confirm & create' },
];

export const AddTeamMember: React.FC<AddTeamMemberProps> = ({ onClose, onSave, existingEmails = [] }) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('basics');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [basics, setBasics] = useState<BasicInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'stylist',
    title: '',
    bio: '',
  });

  const [workingHours, setWorkingHours] = useState<WorkingDay[]>(defaultWorkingHours);
  const [services, setServices] = useState<ServicePricing[]>(
    mockServices.map(s => ({ ...s, canPerform: false }))
  );

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateBasics = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!basics.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (basics.firstName.length > 100) {
      newErrors.firstName = 'First name must be 100 characters or less';
    }
    if (!basics.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (basics.lastName.length > 100) {
      newErrors.lastName = 'Last name must be 100 characters or less';
    }
    if (!basics.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(basics.email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (existingEmails.map(e => e.toLowerCase()).includes(basics.email.trim().toLowerCase())) {
      newErrors.email = 'This email is already in use by another team member';
    }
    if (!basics.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (basics.phone.length > 20) {
      newErrors.phone = 'Phone must be 20 characters or less';
    }
    if (basics.bio && basics.bio.length > 1000) {
      newErrors.bio = 'Bio must be 1000 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [basics, existingEmails]);

  const handleNext = () => {
    if (currentStep === 'basics') {
      if (!validateBasics()) return;
      setCurrentStep('schedule');
    } else if (currentStep === 'schedule') {
      setCurrentStep('services');
    } else if (currentStep === 'services') {
      setCurrentStep('review');
    }
  };

  const handleBack = () => {
    if (currentStep === 'schedule') {
      setCurrentStep('basics');
    } else if (currentStep === 'services') {
      setCurrentStep('schedule');
    } else if (currentStep === 'review') {
      setCurrentStep('services');
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const now = new Date().toISOString();
    const memberId = generateUUID();
    const deviceId = typeof window !== 'undefined' ? `device-${window.navigator.userAgent.slice(0, 10)}` : 'web';

    // Create the new team member with all sync fields
    const newMember: TeamMemberSettings = {
      // Syncable entity fields
      id: memberId,
      tenantId: 'default-tenant',
      storeId: 'default-store',
      syncStatus: 'local',
      version: 1,
      vectorClock: { [deviceId]: 1 },
      lastSyncedVersion: 0,
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
      createdByDevice: deviceId,
      lastModifiedBy: 'system',
      lastModifiedByDevice: deviceId,
      isDeleted: false,

      // Profile
      profile: {
        id: memberId,
        firstName: basics.firstName.trim(),
        lastName: basics.lastName.trim(),
        displayName: `${basics.firstName.trim()} ${basics.lastName.trim()[0]}.`,
        email: basics.email.trim().toLowerCase(),
        phone: basics.phone.trim(),
        title: basics.title?.trim() || dynamicRoleLabels[basics.role],
        bio: basics.bio?.trim(),
        hireDate: new Date().toISOString().split('T')[0],
      },
      services: services,
      workingHours: {
        regularHours: workingHours,
        timeOffRequests: [],
        scheduleOverrides: [],
        defaultBreakDuration: 30,
        autoScheduleBreaks: true,
      },
      permissions: {
        role: basics.role,
        permissions: [],
        canAccessAdminPortal: ['owner', 'manager'].includes(basics.role),
        canAccessReports: ['owner', 'manager', 'senior_stylist'].includes(basics.role),
        canModifyPrices: ['owner', 'manager'].includes(basics.role),
        canProcessRefunds: ['owner', 'manager'].includes(basics.role),
        canDeleteRecords: ['owner', 'manager'].includes(basics.role),
        canManageTeam: ['owner', 'manager'].includes(basics.role),
        canViewOthersCalendar: true,
        canBookForOthers: ['owner', 'manager', 'receptionist'].includes(basics.role),
        canEditOthersAppointments: ['owner', 'manager'].includes(basics.role),
        pinRequired: true,
      },
      commission: {
        type: 'percentage',
        basePercentage: 40,
        productCommission: 10,
        tipHandling: 'keep_all',
      },
      payroll: {
        payPeriod: 'bi-weekly',
      },
      onlineBooking: {
        isBookableOnline: true,
        showOnWebsite: true,
        showOnApp: true,
        maxAdvanceBookingDays: 30,
        minAdvanceBookingHours: 2,
        bufferBetweenAppointments: 10,
        bufferType: 'after',
        allowDoubleBooking: false,
        maxConcurrentAppointments: 1,
        requireDeposit: false,
        autoAcceptBookings: true,
        acceptNewClients: true,
        displayOrder: 99,
      },
      notifications: {
        email: {
          appointmentReminders: true,
          appointmentChanges: true,
          newBookings: true,
          cancellations: true,
          dailySummary: false,
          weeklySummary: false,
          marketingEmails: false,
          systemUpdates: true,
        },
        sms: {
          appointmentReminders: true,
          appointmentChanges: true,
          newBookings: true,
          cancellations: true,
          urgentAlerts: true,
        },
        push: {
          appointmentReminders: true,
          newBookings: true,
          messages: true,
          teamUpdates: true,
        },
        reminderTiming: {
          firstReminder: 24,
        },
      },
      performanceGoals: {},
      isActive: true,
    };

    try {
      onSave(newMember);
    } catch (error) {
      console.error('Failed to save new team member:', error);
      setErrors({ submit: 'Failed to save team member. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  // Get role color from dynamic roles or fallback to static tokens
  const getRoleColor = (roleId: string) => {
    const roleDef = allDefaultRoles.find(r => r.id === roleId);
    if (roleDef) {
      // Convert Tailwind classes to color values
      const bgMatch = roleDef.color.bg.match(/bg-(\w+)-(\d+)/);
      const textMatch = roleDef.color.text.match(/text-(\w+)-(\d+)/);
      const borderMatch = roleDef.color.border.match(/border-(\w+)-(\d+)/);

      if (bgMatch && textMatch && borderMatch) {
        // Return color token values for dynamic styling
        const colorMap: Record<string, string> = {
          'amber-100': '#fef3c7', 'amber-700': '#b45309', 'amber-300': '#fcd34d',
          'purple-100': '#f3e8ff', 'purple-700': '#7c3aed', 'purple-300': '#c4b5fd',
          'blue-100': '#dbeafe', 'blue-700': '#1d4ed8', 'blue-300': '#93c5fd',
          'cyan-100': '#cffafe', 'cyan-700': '#0e7490', 'cyan-300': '#67e8f9',
          'teal-100': '#ccfbf1', 'teal-700': '#0f766e', 'teal-300': '#5eead4',
          'green-100': '#dcfce7', 'green-700': '#15803d', 'green-300': '#86efac',
          'pink-100': '#fce7f3', 'pink-700': '#be185d', 'pink-300': '#f9a8d4',
          'gray-100': '#f3f4f6', 'gray-700': '#374151', 'gray-300': '#d1d5db',
        };

        return {
          bg: colorMap[`${bgMatch[1]}-${bgMatch[2]}`] || '#cffafe',
          text: colorMap[`${textMatch[1]}-${textMatch[2]}`] || '#0e7490',
          border: colorMap[`${borderMatch[1]}-${borderMatch[2]}`] || '#67e8f9',
        };
      }
    }
    // Fallback to static tokens
    return teamSettingsTokens.roleColors[roleId as StaffRole] || teamSettingsTokens.roleColors.stylist;
  };

  const toggleWorkingDay = (dayIndex: number) => {
    setWorkingHours(prev => prev.map((day, i) =>
      i === dayIndex
        ? {
            ...day,
            isWorking: !day.isWorking,
            shifts: !day.isWorking ? [{ startTime: '09:00', endTime: '18:00' }] : []
          }
        : day
    ));
  };

  const updateShiftTime = (dayIndex: number, field: 'startTime' | 'endTime', value: string) => {
    setWorkingHours(prev => prev.map((day, i) =>
      i === dayIndex && day.shifts[0]
        ? { ...day, shifts: [{ ...day.shifts[0], [field]: value }] }
        : day
    ));
  };

  const toggleService = (serviceId: string) => {
    setServices(prev => prev.map(s =>
      s.serviceId === serviceId ? { ...s, canPerform: !s.canPerform } : s
    ));
  };

  const toggleAllServices = (category: string, enabled: boolean) => {
    setServices(prev => prev.map(s =>
      s.serviceCategory === category ? { ...s, canPerform: enabled } : s
    ));
  };

  const selectedServicesCount = services.filter(s => s.canPerform).length;
  const workingDaysCount = workingHours.filter(d => d.isWorking).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-5 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Add New Team Member</h2>
              <p className="text-cyan-100 text-sm mt-0.5">
                {STEPS[currentStepIndex].description}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="mt-5 flex items-center gap-2">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex items-center gap-2">
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                      transition-all duration-300
                      ${index < currentStepIndex
                        ? 'bg-white text-cyan-600'
                        : index === currentStepIndex
                          ? 'bg-white text-cyan-600 ring-4 ring-white/30'
                          : 'bg-white/30 text-white'
                      }
                    `}
                  >
                    {index < currentStepIndex ? (
                      <CheckIcon className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className={`text-sm font-medium hidden sm:block ${
                    index <= currentStepIndex ? 'text-white' : 'text-white/60'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 ${
                    index < currentStepIndex ? 'bg-white' : 'bg-white/30'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Basic Info */}
          {currentStep === 'basics' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Avatar Placeholder */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
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
                    onChange={(e) => setBasics({ ...basics, firstName: e.target.value })}
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
                    onChange={(e) => setBasics({ ...basics, lastName: e.target.value })}
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
                      onChange={(e) => setBasics({ ...basics, email: e.target.value })}
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
                      onChange={(e) => setBasics({ ...basics, phone: e.target.value })}
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
                        onClick={() => setBasics({ ...basics, role: roleDef.id as StaffRole })}
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
                  onChange={(e) => setBasics({ ...basics, title: e.target.value })}
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
                  onChange={(e) => setBasics({ ...basics, bio: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all resize-none"
                  placeholder="A short bio that will appear on the online booking profile..."
                />
              </div>
            </div>
          )}

          {/* Step 2: Schedule */}
          {currentStep === 'schedule' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-cyan-50 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                    <CalendarIcon className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-cyan-900">Set Working Hours</h3>
                    <p className="text-sm text-cyan-700 mt-0.5">
                      Configure the regular weekly schedule. You can always adjust this later.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {workingHours.map((day, index) => (
                  <div
                    key={index}
                    className={`
                      p-4 rounded-xl border-2 transition-all
                      ${day.isWorking
                        ? 'bg-white border-cyan-200 shadow-sm'
                        : 'bg-gray-50 border-transparent'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Toggle
                          enabled={day.isWorking}
                          onChange={() => toggleWorkingDay(index)}
                        />
                        <span className={`font-medium ${day.isWorking ? 'text-gray-900' : 'text-gray-400'}`}>
                          {dayNames[index]}
                        </span>
                      </div>

                      {day.isWorking && day.shifts[0] && (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={day.shifts[0].startTime}
                            onChange={(e) => updateShiftTime(index, 'startTime', e.target.value)}
                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          />
                          <span className="text-gray-400">to</span>
                          <input
                            type="time"
                            value={day.shifts[0].endTime}
                            onChange={(e) => updateShiftTime(index, 'endTime', e.target.value)}
                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          />
                        </div>
                      )}

                      {!day.isWorking && (
                        <span className="text-sm text-gray-400">Day off</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Schedule Summary */}
              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Working days per week:</span>
                  <span className="font-semibold text-gray-900">{workingDaysCount} days</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Services */}
          {currentStep === 'services' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-purple-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <ScissorsIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-purple-900">Assign Services</h3>
                    <p className="text-sm text-purple-700 mt-0.5">
                      Select the services this team member can perform. Pricing can be customized later.
                    </p>
                  </div>
                </div>
              </div>

              {/* Group services by category */}
              {['hair', 'nails', 'skin', 'massage', 'waxing', 'makeup'].map(category => {
                const categoryServices = services.filter(s => s.serviceCategory === category);
                if (categoryServices.length === 0) return null;

                const allSelected = categoryServices.every(s => s.canPerform);
                const someSelected = categoryServices.some(s => s.canPerform);
                const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

                return (
                  <div key={category} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div
                      className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleAllServices(category, !allSelected)}
                          className={`
                            w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                            ${allSelected
                              ? 'bg-cyan-500 border-cyan-500'
                              : someSelected
                                ? 'bg-cyan-200 border-cyan-400'
                                : 'border-gray-300'
                            }
                          `}
                        >
                          {(allSelected || someSelected) && (
                            <CheckIcon className="w-3 h-3 text-white" />
                          )}
                        </button>
                        <span className="font-medium text-gray-900">{categoryName} Services</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {categoryServices.filter(s => s.canPerform).length} / {categoryServices.length}
                      </span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {categoryServices.map(service => (
                        <button
                          key={service.serviceId}
                          onClick={() => toggleService(service.serviceId)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`
                                w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                                ${service.canPerform
                                  ? 'bg-cyan-500 border-cyan-500'
                                  : 'border-gray-300'
                                }
                              `}
                            >
                              {service.canPerform && (
                                <CheckIcon className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <span className={service.canPerform ? 'text-gray-900' : 'text-gray-600'}>
                              {service.serviceName}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-500">{service.defaultDuration} min</span>
                            <span className="text-gray-900 font-medium">${service.defaultPrice}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Services Summary */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Services assigned:</span>
                  <span className="font-semibold text-gray-900">{selectedServicesCount} services</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 'review' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-green-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-green-900">Almost Done!</h3>
                    <p className="text-sm text-green-700 mt-0.5">
                      Review the details below and click "Create Team Member" to finish.
                    </p>
                  </div>
                </div>
              </div>

              {/* Profile Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-5">
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {basics.firstName[0]}{basics.lastName[0]}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {basics.firstName} {basics.lastName}
                    </h3>
                    <p className="text-gray-600 mt-0.5">
                      {basics.title || dynamicRoleLabels[basics.role]}
                    </p>
                    <div className="mt-2">
                      <span
                        className="inline-flex px-3 py-1 rounded-full text-sm font-medium"
                        style={{
                          backgroundColor: getRoleColor(basics.role).bg,
                          color: getRoleColor(basics.role).text,
                        }}
                      >
                        {dynamicRoleLabels[basics.role]}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Contact Info */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Contact Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MailIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{basics.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <PhoneIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{basics.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Schedule Summary */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Schedule</h4>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-900 font-medium">
                      {workingDaysCount} days per week
                    </p>
                    <p className="text-xs text-gray-500">
                      {workingHours
                        .filter(d => d.isWorking)
                        .map(d => dayNames[d.dayOfWeek].slice(0, 3))
                        .join(', ')
                      }
                    </p>
                  </div>
                </div>

                {/* Services Summary */}
                <div className="bg-gray-50 rounded-xl p-4 col-span-2">
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Assigned Services</h4>
                  {selectedServicesCount > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {services
                        .filter(s => s.canPerform)
                        .slice(0, 8)
                        .map(s => (
                          <span
                            key={s.serviceId}
                            className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-sm text-gray-700"
                          >
                            {s.serviceName}
                          </span>
                        ))
                      }
                      {selectedServicesCount > 8 && (
                        <span className="px-2.5 py-1 bg-cyan-50 text-cyan-700 rounded-lg text-sm font-medium">
                          +{selectedServicesCount - 8} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No services assigned yet</p>
                  )}
                </div>
              </div>

              {/* Bio */}
              {basics.bio && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Bio</h4>
                  <p className="text-sm text-gray-700">{basics.bio}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
          <div>
            {currentStep !== 'basics' && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>

            {currentStep !== 'review' ? (
              <Button onClick={handleNext} variant="primary">
                Continue
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                variant="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <SpinnerIcon className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlusIcon className="w-4 h-4 mr-2" />
                    Create Team Member
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Icons
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);

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

const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ScissorsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
  </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ArrowLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const ArrowRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

const UserPlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
);

const SpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

export default AddTeamMember;
