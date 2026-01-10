import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Sparkles, Clock, Delete, ChevronRight, Check, X, Gift } from 'lucide-react';

// ============================================================================
// STORE CONFIG - Will come from API/Context
// ============================================================================
const STORE_CONFIG = {
  name: 'Luxe Nail Spa',
  logo: null,
};

// ============================================================================
// PROMO CONFIG - Editable from Admin/Control Center
// ============================================================================
const CURRENT_PROMO = {
  active: true,
  type: 'special' as 'special' | 'announcement' | 'reward',
  headline: 'Holiday Glow-Up',
  message: 'Get a FREE paraffin treatment with any manicure this week!',
  subtext: 'Limited time offer • Mention at checkout',
  emoji: '🎁',
  bgGradient: 'from-[#1a5f4a] to-[#2d7a5f]', // Can be customized
  accentColor: '#d4a853',
};

// ============================================================================
// AGREEMENT CONFIG - Editable from Admin/Control Center
// ============================================================================
const AGREEMENT_CONFIG = {
  enabled: true,
  shortText: 'I agree to the salon policies and service terms',
  fullAgreement: {
    title: 'Check-In Agreement',
    lastUpdated: '2024-01-15',
    sections: [
      {
        heading: 'Appointment & Cancellation Policy',
        content: 'We kindly request 24 hours notice for cancellations or rescheduling. Late arrivals may result in shortened service time or rescheduling. No-shows may be subject to a fee for future bookings.',
      },
      {
        heading: 'Service Expectations',
        content: 'Our technicians will consult with you before beginning any service. Please communicate any allergies, sensitivities, or preferences. Results may vary based on individual nail/skin conditions.',
      },
      {
        heading: 'Health & Safety',
        content: 'Please inform us of any health conditions that may affect your service. We maintain strict sanitation standards and use hospital-grade disinfection on all tools.',
      },
      {
        heading: 'Payment & Gratuity',
        content: 'Payment is due at time of service. We accept cash, credit cards, and digital payments. Gratuity is appreciated but not required.',
      },
      {
        heading: 'Personal Belongings',
        content: 'Please keep valuables secure. We are not responsible for lost or damaged personal items.',
      },
    ],
  },
};

// Idle timeout
const IDLE_TIMEOUT_MS = 60000;
const IDLE_WARNING_MS = 45000;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatPhone(digits: string): string {
  if (!digits) return '';
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

export function WelcomeScreen() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [greeting] = useState(getGreeting());
  const [showIdleWarning, setShowIdleWarning] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(false);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(true); // Auto-selected
  const [showAgreement, setShowAgreement] = useState(false);

  const isComplete = phone.length === 10 && agreedToTerms;

  const resetActivity = useCallback(() => {
    setLastActivity(Date.now());
    setShowIdleWarning(false);
  }, []);

  // Idle timeout
  useEffect(() => {
    const interval = setInterval(() => {
      const idle = Date.now() - lastActivity;
      if (idle >= IDLE_TIMEOUT_MS) {
        setPhone('');
        setAgreedToTerms(true);
        setShowIdleWarning(false);
        setLastActivity(Date.now());
      } else if (idle >= IDLE_WARNING_MS && phone.length > 0) {
        setShowIdleWarning(true);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastActivity, phone.length]);

  // Activity listeners
  useEffect(() => {
    const events = ['touchstart', 'mousedown', 'keydown'];
    events.forEach(e => document.addEventListener(e, resetActivity, { passive: true }));
    return () => events.forEach(e => document.removeEventListener(e, resetActivity));
  }, [resetActivity]);

  const handleKey = (key: string) => {
    resetActivity();
    setPressedKey(key);
    setTimeout(() => setPressedKey(null), 150);
    if (phone.length < 10) {
      setPhone(p => p + key);
    }
  };

  const handleDelete = () => {
    resetActivity();
    setPressedKey('delete');
    setTimeout(() => setPressedKey(null), 150);
    setPhone(p => p.slice(0, -1));
  };

  const handleContinue = () => {
    if (!isComplete) return;
    setIsLoading(true);
    navigate(`/verify?phone=${phone}`);
  };

  const handleQR = () => {
    resetActivity();
    navigate('/qr-scan');
  };

  return (
    <div className="kiosk-mode min-h-screen bg-[#faf9f7] relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#1a5f4a]/8 to-transparent" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-[#d4a853]/10 to-transparent" />
      </div>

      {/* Main Horizontal Layout */}
      <div className="relative z-10 min-h-screen flex flex-row">

        {/* LEFT PANEL - Branding & Promo */}
        <div className="w-[45%] flex flex-col p-8 justify-between">

          {/* Store Brand */}
          <header className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1a5f4a] to-[#154d3c] shadow-lg shadow-[#1a5f4a]/20 flex items-center justify-center">
              <span className="text-white text-xl font-bold font-['Plus_Jakarta_Sans']">
                {STORE_CONFIG.name.charAt(0)}
              </span>
            </div>
            <div>
              <span className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#1f2937] block leading-tight">
                {STORE_CONFIG.name}
              </span>
              <span className="font-['Work_Sans'] text-sm text-[#1a5f4a] font-medium">
                {greeting}! 👋
              </span>
            </div>
          </header>

          {/* PROMO SECTION - Bold & Attractive */}
          {CURRENT_PROMO.active && (
            <div className="flex-1 flex items-center py-8">
              <div className={`w-full rounded-3xl bg-gradient-to-br ${CURRENT_PROMO.bgGradient} p-8 shadow-xl shadow-[#1a5f4a]/20 relative overflow-hidden`}>
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10">
                  {/* Promo Badge */}
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4">
                    <Gift className="w-4 h-4 text-[#d4a853]" />
                    <span className="font-['Plus_Jakarta_Sans'] text-xs font-semibold text-white uppercase tracking-wider">
                      Special Offer
                    </span>
                  </div>

                  {/* Main Promo Content */}
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                      <span className="text-4xl">{CURRENT_PROMO.emoji}</span>
                    </div>
                    <div className="flex-1">
                      <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-white mb-2 leading-tight">
                        {CURRENT_PROMO.headline}
                      </h2>
                      <p className="font-['Work_Sans'] text-white/90 text-lg leading-relaxed mb-3">
                        {CURRENT_PROMO.message}
                      </p>
                      <p className="font-['Work_Sans'] text-white/60 text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#d4a853]" />
                        {CURRENT_PROMO.subtext}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <footer>
            <p className="font-['Work_Sans'] text-xs text-[#9ca3af]">
              Powered by <span className="font-semibold text-[#6b7280]">Mango</span>
            </p>
          </footer>
        </div>

        {/* RIGHT PANEL - Check-in Form */}
        <div className="w-[55%] flex flex-col justify-center p-8 bg-white/50 backdrop-blur-sm border-l border-[#e5e7eb]/50">
          <div className="max-w-md mx-auto w-full">

            {/* Header with QR Option */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#1f2937]">
                  Check In
                </h1>
                <p className="font-['Work_Sans'] text-[#6b7280]">
                  Enter your phone number
                </p>
              </div>
              <button
                onClick={handleQR}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#e5e7eb] text-[#1a5f4a] hover:bg-[#f9fafb] hover:border-[#1a5f4a]/20 transition-all active:scale-95 shadow-sm"
              >
                <QrCode className="w-5 h-5" />
                <span className="text-sm font-medium font-['Work_Sans']">Scan QR</span>
              </button>
            </div>

            {/* Phone Display */}
            <div className="mb-5">
              <div
                className="bg-white rounded-2xl shadow-sm border-2 p-5 text-center min-h-[76px] flex items-center justify-center transition-all duration-200"
                style={{ borderColor: phone.length > 0 ? '#1a5f4a' : '#e5e7eb' }}
              >
                {phone.length > 0 ? (
                  <span className="font-['Plus_Jakarta_Sans'] text-4xl font-bold text-[#1f2937] tracking-wider">
                    {formatPhone(phone)}
                  </span>
                ) : (
                  <span className="font-['Plus_Jakarta_Sans'] text-4xl font-medium text-[#d1d5db] tracking-wider">
                    ___-___-____
                  </span>
                )}
              </div>
            </div>

            {/* Compact Keypad for Horizontal */}
            <div className="grid grid-cols-3 gap-2.5 mb-5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  onClick={() => handleKey(num)}
                  disabled={phone.length >= 10}
                  className={`
                    h-14 rounded-xl font-['Plus_Jakarta_Sans'] text-xl font-semibold
                    bg-white shadow-sm border border-[#e5e7eb]
                    transition-all duration-150 ease-out
                    hover:bg-[#f9fafb] hover:border-[#1a5f4a]/20 hover:shadow
                    active:scale-95 active:bg-[#e8f5f0]
                    disabled:opacity-40 disabled:cursor-not-allowed
                    ${pressedKey === num ? 'scale-95 bg-[#e8f5f0] border-[#1a5f4a]/30' : ''}
                  `}
                >
                  {num}
                </button>
              ))}
              <div className="h-14" />
              <button
                onClick={() => handleKey('0')}
                disabled={phone.length >= 10}
                className={`
                  h-14 rounded-xl font-['Plus_Jakarta_Sans'] text-xl font-semibold
                  bg-white shadow-sm border border-[#e5e7eb]
                  transition-all duration-150 ease-out
                  hover:bg-[#f9fafb] hover:border-[#1a5f4a]/20 hover:shadow
                  active:scale-95 active:bg-[#e8f5f0]
                  disabled:opacity-40 disabled:cursor-not-allowed
                  ${pressedKey === '0' ? 'scale-95 bg-[#e8f5f0] border-[#1a5f4a]/30' : ''}
                `}
              >
                0
              </button>
              <button
                onClick={handleDelete}
                disabled={phone.length === 0}
                className={`
                  h-14 rounded-xl flex items-center justify-center
                  bg-[#f3f4f6] border border-transparent
                  transition-all duration-150 ease-out
                  hover:bg-[#e5e7eb]
                  active:scale-95
                  disabled:opacity-30 disabled:cursor-not-allowed
                  ${pressedKey === 'delete' ? 'scale-95 bg-[#e5e7eb]' : ''}
                `}
              >
                <Delete className="w-5 h-5 text-[#6b7280]" />
              </button>
            </div>

            {/* Agreement Checkbox */}
            {AGREEMENT_CONFIG.enabled && (
              <div className="mb-5">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <button
                    type="button"
                    onClick={() => setAgreedToTerms(!agreedToTerms)}
                    className={`
                      w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                      transition-all duration-200
                      ${agreedToTerms
                        ? 'bg-[#1a5f4a] border-[#1a5f4a]'
                        : 'bg-white border-[#d1d5db] group-hover:border-[#1a5f4a]/50'
                      }
                    `}
                  >
                    {agreedToTerms && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                  </button>
                  <span className="font-['Work_Sans'] text-sm text-[#4b5563] leading-relaxed">
                    {AGREEMENT_CONFIG.shortText}{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAgreement(true);
                      }}
                      className="text-[#1a5f4a] font-medium underline underline-offset-2 hover:text-[#154d3c]"
                    >
                      View terms
                    </button>
                  </span>
                </label>
              </div>
            )}

            {/* Continue Button */}
            <button
              onClick={handleContinue}
              disabled={!isComplete || isLoading}
              className={`
                w-full py-4 rounded-xl font-['Plus_Jakarta_Sans'] text-lg font-semibold
                flex items-center justify-center gap-2
                transition-all duration-300 ease-out
                ${isComplete
                  ? 'bg-[#1a5f4a] text-white shadow-lg shadow-[#1a5f4a]/25 hover:bg-[#154d3c] hover:shadow-xl active:scale-[0.98]'
                  : 'bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed'
                }
              `}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Continue
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Agreement Modal */}
      {showAgreement && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl animate-slide-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#e5e7eb]">
              <div>
                <h2 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#1f2937]">
                  {AGREEMENT_CONFIG.fullAgreement.title}
                </h2>
                <p className="font-['Work_Sans'] text-sm text-[#6b7280]">
                  Last updated: {AGREEMENT_CONFIG.fullAgreement.lastUpdated}
                </p>
              </div>
              <button
                onClick={() => setShowAgreement(false)}
                className="w-10 h-10 rounded-xl bg-[#f3f4f6] hover:bg-[#e5e7eb] flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-[#6b7280]" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {AGREEMENT_CONFIG.fullAgreement.sections.map((section, index) => (
                <div key={index}>
                  <h3 className="font-['Plus_Jakarta_Sans'] font-semibold text-[#1f2937] mb-2">
                    {section.heading}
                  </h3>
                  <p className="font-['Work_Sans'] text-[#4b5563] leading-relaxed">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[#e5e7eb] flex gap-3">
              <button
                onClick={() => setShowAgreement(false)}
                className="flex-1 py-3 rounded-xl font-['Plus_Jakarta_Sans'] font-semibold bg-[#f3f4f6] text-[#4b5563] hover:bg-[#e5e7eb] transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setAgreedToTerms(true);
                  setShowAgreement(false);
                }}
                className="flex-1 py-3 rounded-xl font-['Plus_Jakarta_Sans'] font-semibold bg-[#1a5f4a] text-white hover:bg-[#154d3c] transition-colors"
              >
                I Agree
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Idle Warning Modal */}
      {showIdleWarning && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-6">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-slide-up">
            <div className="w-16 h-16 rounded-full bg-[#fdf8eb] flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-[#d4a853]" />
            </div>
            <h2 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#1f2937] mb-2">
              Still there?
            </h2>
            <p className="font-['Work_Sans'] text-[#6b7280] mb-6">
              Tap anywhere to continue
            </p>
            <button
              onClick={resetActivity}
              className="w-full py-3.5 rounded-xl bg-[#1a5f4a] text-white font-['Plus_Jakarta_Sans'] font-semibold hover:bg-[#154d3c] transition-colors"
            >
              I'm here
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default WelcomeScreen;
