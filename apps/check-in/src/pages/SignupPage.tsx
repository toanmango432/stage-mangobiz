import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { ArrowLeft, ArrowRight, User, Mail, MapPin, Shield, X, MessageSquare } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { createClient, fetchClientByPhone } from '../store/slices/clientSlice';
import { formatPhone } from '../utils';

const registrationSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name too long'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name too long'),
  email: z
    .string()
    .email('Invalid email format')
    .optional()
    .or(z.literal('')),
  zipCode: z
    .string()
    .regex(/^\d{5}$/, 'Zip code must be 5 digits')
    .optional()
    .or(z.literal('')),
  smsOptIn: z.boolean(),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

export function SignupPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const phone = searchParams.get('phone') || '';

  const { isLoading, error: reduxError } = useAppSelector((state) => state.client);

  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<RegistrationFormData>({
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      zipCode: '',
      smsOptIn: true,
    },
  });

  const smsOptIn = watch('smsOptIn');

  const onSubmit = async (data: RegistrationFormData) => {
    setDuplicateError(null);

    const normalizedPhone = phone.replace(/\D/g, '');
    const existingClient = await dispatch(fetchClientByPhone(normalizedPhone));

    if (existingClient.payload) {
      setDuplicateError('A client with this phone number already exists');
      return;
    }

    const result = await dispatch(
      createClient({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: normalizedPhone,
        email: data.email || undefined,
        zipCode: data.zipCode || undefined,
        smsOptIn: data.smsOptIn,
      })
    );

    if (createClient.fulfilled.match(result)) {
      const clientId = result.payload.id;
      navigate(`/services?clientId=${clientId}&phone=${phone}&new=true`);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const displayError = duplicateError || reduxError;

  return (
    <div className="kiosk-mode min-h-screen bg-[#faf9f7] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#1a5f4a]/8 to-transparent" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-[#d4a853]/10 to-transparent" />
      </div>

      {/* Main Content - Horizontal Layout */}
      <div className="relative z-10 min-h-screen flex flex-row">
        {/* LEFT PANEL - Welcome Message */}
        <div className="w-[40%] flex flex-col p-8 justify-center bg-gradient-to-br from-[#1a5f4a] to-[#154d3c]">
          <div className="max-w-sm">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
              <User className="w-8 h-8 text-white" />
            </div>

            <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-white mb-3">
              Let's get you set up! ✨
            </h1>

            <p className="font-['Work_Sans'] text-white/80 text-lg mb-6">
              Just a few quick details and you'll be ready to check in.
            </p>

            <div className="bg-white/10 rounded-xl p-4">
              <p className="font-['Work_Sans'] text-white/60 text-sm mb-1">Your phone number</p>
              <p className="font-['Plus_Jakarta_Sans'] text-white font-semibold text-lg">
                {formatPhone(phone)}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Form */}
        <div className="w-[60%] flex flex-col p-8">
          {/* Header */}
          <header className="flex items-center justify-between mb-8">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-[#6b7280] hover:text-[#1a5f4a] transition-colors min-h-[44px] min-w-[44px]"
              aria-label="Go back to welcome screen"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-['Work_Sans']">Back</span>
            </button>
          </header>

          {/* Form */}
          <div className="flex-1 flex items-center justify-center">
            <form onSubmit={handleSubmit(onSubmit)} className="max-w-md w-full space-y-5">
              {/* Error Banner */}
              {displayError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 font-['Work_Sans'] text-sm">{displayError}</p>
                </div>
              )}

              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block font-['Work_Sans'] text-sm font-medium text-[#4b5563] mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="firstName"
                  type="text"
                  {...register('firstName', {
                    required: 'First name is required',
                    maxLength: { value: 50, message: 'First name too long' },
                  })}
                  placeholder="Enter your first name"
                  aria-invalid={!!errors.firstName}
                  aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                  className={`
                    w-full px-4 py-4 rounded-xl border-2 font-['Work_Sans'] text-lg
                    transition-all duration-200 outline-none min-h-[56px]
                    ${errors.firstName
                      ? 'border-red-300 bg-red-50'
                      : 'border-[#e5e7eb] focus:border-[#1a5f4a] bg-white'
                    }
                  `}
                />
                {errors.firstName && (
                  <p id="firstName-error" className="mt-1 text-sm text-red-500 font-['Work_Sans']">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className="block font-['Work_Sans'] text-sm font-medium text-[#4b5563] mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="lastName"
                  type="text"
                  {...register('lastName', {
                    required: 'Last name is required',
                    maxLength: { value: 50, message: 'Last name too long' },
                  })}
                  placeholder="Enter your last name"
                  aria-invalid={!!errors.lastName}
                  aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                  className={`
                    w-full px-4 py-4 rounded-xl border-2 font-['Work_Sans'] text-lg
                    transition-all duration-200 outline-none min-h-[56px]
                    ${errors.lastName
                      ? 'border-red-300 bg-red-50'
                      : 'border-[#e5e7eb] focus:border-[#1a5f4a] bg-white'
                    }
                  `}
                />
                {errors.lastName && (
                  <p id="lastName-error" className="mt-1 text-sm text-red-500 font-['Work_Sans']">
                    {errors.lastName.message}
                  </p>
                )}
              </div>

              {/* Email (Optional) */}
              <div>
                <label htmlFor="email" className="block font-['Work_Sans'] text-sm font-medium text-[#4b5563] mb-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email <span className="text-[#9ca3af]">(optional)</span>
                  </div>
                </label>
                <input
                  id="email"
                  type="email"
                  {...register('email', {
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Invalid email format',
                    },
                  })}
                  placeholder="you@example.com"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  className={`
                    w-full px-4 py-4 rounded-xl border-2 font-['Work_Sans'] text-lg
                    transition-all duration-200 outline-none min-h-[56px]
                    ${errors.email
                      ? 'border-red-300 bg-red-50'
                      : 'border-[#e5e7eb] focus:border-[#1a5f4a] bg-white'
                    }
                  `}
                />
                {errors.email && (
                  <p id="email-error" className="mt-1 text-sm text-red-500 font-['Work_Sans']">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Zip Code (Optional) */}
              <div>
                <label htmlFor="zipCode" className="block font-['Work_Sans'] text-sm font-medium text-[#4b5563] mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Zip Code <span className="text-[#9ca3af]">(optional)</span>
                  </div>
                </label>
                <input
                  id="zipCode"
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  {...register('zipCode', {
                    pattern: {
                      value: /^\d{5}$/,
                      message: 'Zip code must be 5 digits',
                    },
                    setValueAs: (v: string) => v.replace(/\D/g, ''),
                  })}
                  placeholder="12345"
                  aria-invalid={!!errors.zipCode}
                  aria-describedby={errors.zipCode ? 'zipCode-error' : undefined}
                  className={`
                    w-full px-4 py-4 rounded-xl border-2 font-['Work_Sans'] text-lg
                    transition-all duration-200 outline-none min-h-[56px]
                    ${errors.zipCode
                      ? 'border-red-300 bg-red-50'
                      : 'border-[#e5e7eb] focus:border-[#1a5f4a] bg-white'
                    }
                  `}
                />
                {errors.zipCode && (
                  <p id="zipCode-error" className="mt-1 text-sm text-red-500 font-['Work_Sans']">
                    {errors.zipCode.message}
                  </p>
                )}
              </div>

              {/* SMS Opt-In Checkbox */}
              <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-4">
                <label htmlFor="smsOptIn" className="flex items-start gap-3 cursor-pointer">
                  <div className="relative flex items-center justify-center min-w-[24px] min-h-[24px] mt-0.5">
                    <input
                      id="smsOptIn"
                      type="checkbox"
                      {...register('smsOptIn')}
                      className="sr-only peer"
                    />
                    <div className={`
                      w-6 h-6 rounded-md border-2 transition-all duration-200 flex items-center justify-center
                      ${smsOptIn
                        ? 'bg-[#1a5f4a] border-[#1a5f4a]'
                        : 'bg-white border-[#d1d5db]'
                      }
                    `}>
                      {smsOptIn && (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="w-4 h-4 text-[#1a5f4a]" />
                      <span className="font-['Plus_Jakarta_Sans'] font-semibold text-[#1a5f4a]">
                        Text me when it's my turn
                      </span>
                    </div>
                    <p className="font-['Work_Sans'] text-sm text-[#6b7280]">
                      Receive SMS notifications about your queue status and when you're called.
                      Message and data rates may apply. You can opt out anytime.
                    </p>
                  </div>
                </label>
              </div>

              {/* Privacy Policy Link */}
              <div className="flex items-start gap-2 text-[#9ca3af]">
                <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="font-['Work_Sans'] text-sm">
                  By creating an account, you agree to our{' '}
                  <button
                    type="button"
                    onClick={() => setShowPrivacyModal(true)}
                    className="text-[#1a5f4a] underline hover:text-[#154d3c] transition-colors"
                  >
                    Privacy Policy
                  </button>
                  . We never share your information with third parties.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isValid || isLoading}
                aria-busy={isLoading}
                className={`
                  w-full py-4 rounded-xl font-['Plus_Jakarta_Sans'] text-lg font-semibold
                  flex items-center justify-center gap-2 min-h-[56px]
                  transition-all duration-300 active:scale-[0.98]
                  ${isValid && !isLoading
                    ? 'bg-[#1a5f4a] text-white shadow-lg shadow-[#1a5f4a]/25 hover:bg-[#154d3c]'
                    : 'bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed'
                  }
                `}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Create Account & Continue
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-modal-title"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-[#e5e7eb]">
              <h2 id="privacy-modal-title" className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#1f2937]">
                Privacy Policy
              </h2>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="p-2 hover:bg-[#f3f4f6] rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close privacy policy"
              >
                <X className="w-5 h-5 text-[#6b7280]" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4 font-['Work_Sans'] text-[#4b5563]">
                <section>
                  <h3 className="font-['Plus_Jakarta_Sans'] font-semibold text-[#1f2937] mb-2">
                    Information We Collect
                  </h3>
                  <p className="text-sm">
                    We collect your name, phone number, and email address to provide you with
                    check-in services and notify you when it's your turn.
                  </p>
                </section>

                <section>
                  <h3 className="font-['Plus_Jakarta_Sans'] font-semibold text-[#1f2937] mb-2">
                    How We Use Your Information
                  </h3>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Process your check-in and manage your queue position</li>
                    <li>Send SMS notifications about your appointment status</li>
                    <li>Improve our services and customer experience</li>
                    <li>Maintain records of your visits for loyalty programs</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-['Plus_Jakarta_Sans'] font-semibold text-[#1f2937] mb-2">
                    Data Protection
                  </h3>
                  <p className="text-sm">
                    Your personal information is stored securely and encrypted. We never sell
                    or share your data with third-party advertisers.
                  </p>
                </section>

                <section>
                  <h3 className="font-['Plus_Jakarta_Sans'] font-semibold text-[#1f2937] mb-2">
                    SMS Communications
                  </h3>
                  <p className="text-sm">
                    By opting in to SMS notifications, you consent to receive text messages
                    about your queue status. Message and data rates may apply. Reply STOP to
                    unsubscribe at any time.
                  </p>
                </section>

                <section>
                  <h3 className="font-['Plus_Jakarta_Sans'] font-semibold text-[#1f2937] mb-2">
                    Your Rights
                  </h3>
                  <p className="text-sm">
                    You have the right to access, correct, or delete your personal information.
                    Contact us to exercise these rights.
                  </p>
                </section>
              </div>
            </div>
            <div className="p-6 border-t border-[#e5e7eb]">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="w-full py-3 bg-[#1a5f4a] text-white rounded-xl font-['Plus_Jakarta_Sans'] font-semibold
                  hover:bg-[#154d3c] transition-colors min-h-[48px]"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SignupPage;
