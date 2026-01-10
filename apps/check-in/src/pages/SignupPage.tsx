import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, User, Mail, MapPin, Check } from 'lucide-react';

function formatPhone(digits: string): string {
  if (digits.length !== 10) return digits;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function SignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const phone = searchParams.get('phone') || '';

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    zipCode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (form.firstName.length > 50) {
      newErrors.firstName = 'First name too long';
    }

    if (!form.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (form.lastName.length > 50) {
      newErrors.lastName = 'Last name too long';
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (form.zipCode && !/^\d{5}$/.test(form.zipCode)) {
      newErrors.zipCode = 'Zip code must be 5 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    // Simulate API call to create client
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock client ID
    const clientId = 'new-' + Date.now();

    // Navigate to services
    navigate(`/services?clientId=${clientId}&phone=${phone}&new=true`);
  };

  const handleBack = () => {
    navigate('/');
  };

  const isValid = form.firstName.trim() && form.lastName.trim();

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
              className="flex items-center gap-2 text-[#6b7280] hover:text-[#1a5f4a] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-['Work_Sans']">Back</span>
            </button>
          </header>

          {/* Form */}
          <div className="flex-1 flex items-center justify-center">
            <div className="max-w-md w-full space-y-5">
              {/* First Name */}
              <div>
                <label className="block font-['Work_Sans'] text-sm font-medium text-[#4b5563] mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  placeholder="Enter your first name"
                  className={`
                    w-full px-4 py-4 rounded-xl border-2 font-['Work_Sans'] text-lg
                    transition-all duration-200 outline-none
                    ${errors.firstName
                      ? 'border-red-300 bg-red-50'
                      : 'border-[#e5e7eb] focus:border-[#1a5f4a] bg-white'
                    }
                  `}
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-500 font-['Work_Sans']">{errors.firstName}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block font-['Work_Sans'] text-sm font-medium text-[#4b5563] mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  placeholder="Enter your last name"
                  className={`
                    w-full px-4 py-4 rounded-xl border-2 font-['Work_Sans'] text-lg
                    transition-all duration-200 outline-none
                    ${errors.lastName
                      ? 'border-red-300 bg-red-50'
                      : 'border-[#e5e7eb] focus:border-[#1a5f4a] bg-white'
                    }
                  `}
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-500 font-['Work_Sans']">{errors.lastName}</p>
                )}
              </div>

              {/* Email (Optional) */}
              <div>
                <label className="block font-['Work_Sans'] text-sm font-medium text-[#4b5563] mb-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email <span className="text-[#9ca3af]">(optional)</span>
                  </div>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className={`
                    w-full px-4 py-4 rounded-xl border-2 font-['Work_Sans'] text-lg
                    transition-all duration-200 outline-none
                    ${errors.email
                      ? 'border-red-300 bg-red-50'
                      : 'border-[#e5e7eb] focus:border-[#1a5f4a] bg-white'
                    }
                  `}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500 font-['Work_Sans']">{errors.email}</p>
                )}
              </div>

              {/* Zip Code (Optional) */}
              <div>
                <label className="block font-['Work_Sans'] text-sm font-medium text-[#4b5563] mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Zip Code <span className="text-[#9ca3af]">(optional)</span>
                  </div>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  value={form.zipCode}
                  onChange={(e) => setForm({ ...form, zipCode: e.target.value.replace(/\D/g, '') })}
                  placeholder="12345"
                  className={`
                    w-full px-4 py-4 rounded-xl border-2 font-['Work_Sans'] text-lg
                    transition-all duration-200 outline-none
                    ${errors.zipCode
                      ? 'border-red-300 bg-red-50'
                      : 'border-[#e5e7eb] focus:border-[#1a5f4a] bg-white'
                    }
                  `}
                />
                {errors.zipCode && (
                  <p className="mt-1 text-sm text-red-500 font-['Work_Sans']">{errors.zipCode}</p>
                )}
              </div>

              {/* Privacy Note */}
              <div className="flex items-start gap-2 text-[#9ca3af]">
                <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="font-['Work_Sans'] text-sm">
                  We never share your information with third parties.
                </p>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={!isValid || isSubmitting}
                className={`
                  w-full py-4 rounded-xl font-['Plus_Jakarta_Sans'] text-lg font-semibold
                  flex items-center justify-center gap-2
                  transition-all duration-300 active:scale-[0.98]
                  ${isValid
                    ? 'bg-[#1a5f4a] text-white shadow-lg shadow-[#1a5f4a]/25 hover:bg-[#154d3c]'
                    : 'bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed'
                  }
                `}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Create Account & Continue
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
