import React from 'react';
import type { BasicInfo, LoginCredentials } from '../types';

interface SuccessSectionProps {
  basics: BasicInfo;
  loginCredentials: LoginCredentials;
  inviteLink: string;
}

export const SuccessSection: React.FC<SuccessSectionProps> = ({
  basics,
  loginCredentials,
  inviteLink,
}) => {
  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    const btn = document.getElementById('copy-invite-btn');
    if (btn) {
      btn.textContent = 'Copied!';
      setTimeout(() => {
        btn.textContent = 'Copy';
      }, 2000);
    }
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent(`Set up your ${basics.firstName}, account`);
    const body = encodeURIComponent(`Hi ${basics.firstName},\n\nYou've been added as a team member. Please click the link below to set up your login credentials:\n\n${inviteLink}\n\nThis link will allow you to create your password and PIN.`);
    window.open(`mailto:${basics.email}?subject=${subject}&body=${body}`);
  };

  const handleSendSMS = () => {
    const text = encodeURIComponent(`Hi ${basics.firstName}, set up your account here: ${inviteLink}`);
    window.open(`sms:${basics.phone}?body=${text}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center py-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
          <CheckCircleIcon className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Team Member Created!
        </h3>
        <p className="text-gray-600">
          {basics.firstName} {basics.lastName} has been added to your team.
        </p>
      </div>

      {/* Invite Link Section */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
        <div className="flex items-start gap-3 mb-4">
          <SendIcon className="w-6 h-6 text-purple-600 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-purple-900">Share Setup Link</h4>
            <p className="text-sm text-purple-700 mt-1">
              Send this link to {basics.firstName} so they can set up their own password and PIN.
            </p>
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            readOnly
            value={inviteLink}
            className="w-full px-4 py-3 pr-24 bg-white border border-purple-200 rounded-lg text-sm text-gray-700 font-mono"
          />
          <button
            type="button"
            onClick={handleCopyLink}
            id="copy-invite-btn"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors flex items-center gap-1"
          >
            <CopyIcon className="w-4 h-4" />
            Copy
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSendEmail}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <MailIcon className="w-4 h-4" />
            Send via Email
          </button>
          <button
            type="button"
            onClick={handleSendSMS}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <PhoneIcon className="w-4 h-4" />
            Send via SMS
          </button>
        </div>
      </div>

      {/* Credentials Info */}
      <div className="space-y-3">
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-start gap-3">
            <LockIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="text-sm font-medium text-green-800">PIN is ready to use</h5>
              <p className="text-xs text-green-700 mt-1">
                {basics.firstName}'s PIN is already active. They can use it to access restricted features right away.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <InfoIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="text-sm font-medium text-amber-800">Password setup required</h5>
              <p className="text-xs text-amber-700 mt-1">
                This link expires in 7 days. The member needs to set their password before they can sign in.
              </p>
            </div>
          </div>
        </div>

        {loginCredentials.sendNotification && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-start gap-3">
              <MailIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="text-sm font-medium text-blue-800">Credentials sent</h5>
                <p className="text-xs text-blue-700 mt-1">
                  {basics.firstName} will receive their PIN and setup link via {loginCredentials.notificationMethod === 'both' ? 'email and SMS' : loginCredentials.notificationMethod}.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Icons
const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
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

const LockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default SuccessSection;
