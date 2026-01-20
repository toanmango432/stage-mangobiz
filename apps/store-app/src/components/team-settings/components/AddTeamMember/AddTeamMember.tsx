import React from 'react';
import type { TeamMemberSettings } from '../../types';
import { Button } from '../SharedComponents';

// Import extracted types and constants
import { WIZARD_STEPS as STEPS } from './constants';
import {
  BasicInfoSection,
  ContactSection,
  ScheduleSection,
  ServicesSection,
  ReviewSection,
  SuccessSection,
} from './components';
import { useTeamMemberForm } from './hooks';

interface AddTeamMemberProps {
  onClose: () => void;
  onSave: (member: TeamMemberSettings) => void;
  existingEmails?: string[];
}

export const AddTeamMember: React.FC<AddTeamMemberProps> = ({ onClose, onSave, existingEmails = [] }) => {
  const {
    // State
    currentStep,
    isSubmitting,
    basics,
    loginCredentials,
    showPassword,
    showPin,
    inviteLink,
    workingHours,
    services,
    errors,

    // Setters
    setBasics,
    setLoginCredentials,
    setShowPassword,
    setShowPin,

    // Handlers
    handleNext,
    handleBack,
    handleSubmit,
    toggleWorkingDay,
    updateShiftTime,
    toggleService,
    toggleAllServices,

    // Computed
    getRoleColor,
    dynamicRoleLabels,
  } = useTeamMemberForm({ existingEmails, onSave });

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 to-brand-500 px-6 py-5 text-white flex-shrink-0">
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
            <>
              <BasicInfoSection
                basics={basics}
                onBasicsChange={setBasics}
                errors={errors}
                getRoleColor={getRoleColor}
                dynamicRoleLabels={dynamicRoleLabels}
              />
              <ContactSection
                loginCredentials={loginCredentials}
                onCredentialsChange={setLoginCredentials}
                errors={errors}
                showPin={showPin}
                onShowPinChange={setShowPin}
                showPassword={showPassword}
                onShowPasswordChange={setShowPassword}
                email={basics.email}
              />
            </>
          )}

          {/* Step 2: Schedule */}
          {currentStep === 'schedule' && (
            <ScheduleSection
              workingHours={workingHours}
              onToggleWorkingDay={toggleWorkingDay}
              onUpdateShiftTime={updateShiftTime}
            />
          )}

          {/* Step 3: Services */}
          {currentStep === 'services' && (
            <ServicesSection
              services={services}
              onToggleService={toggleService}
              onToggleAllServices={toggleAllServices}
            />
          )}

          {/* Step 4: Review */}
          {currentStep === 'review' && (
            <ReviewSection
              basics={basics}
              loginCredentials={loginCredentials}
              workingHours={workingHours}
              services={services}
              getRoleColor={getRoleColor}
              dynamicRoleLabels={dynamicRoleLabels}
            />
          )}

          {/* Step 5: Success (Invite Link) */}
          {currentStep === 'success' && inviteLink && (
            <SuccessSection
              basics={basics}
              loginCredentials={loginCredentials}
              inviteLink={inviteLink}
            />
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
          <div>
            {currentStep !== 'basics' && currentStep !== 'success' && (
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
            {currentStep === 'success' ? (
              <Button onClick={onClose} variant="primary">
                Done
              </Button>
            ) : (
              <>
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
              </>
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
