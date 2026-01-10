import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Plus, Minus, Users, User } from 'lucide-react';

const MAX_GUESTS = 5;

export function GuestsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('clientId') || '';
  const phone = searchParams.get('phone') || '';
  const services = searchParams.get('services') || '';
  const technician = searchParams.get('technician') || '';
  const isNewClient = searchParams.get('new') === 'true';

  const [guestCount, setGuestCount] = useState(0);

  const handleIncrement = () => {
    if (guestCount < MAX_GUESTS) {
      setGuestCount(prev => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (guestCount > 0) {
      setGuestCount(prev => prev - 1);
    }
  };

  const handleContinue = () => {
    navigate(`/confirm?clientId=${clientId}&phone=${phone}&services=${services}&technician=${technician}&guests=${guestCount}${isNewClient ? '&new=true' : ''}`);
  };

  const handleBack = () => {
    navigate(`/technician?clientId=${clientId}&phone=${phone}&services=${services}${isNewClient ? '&new=true' : ''}`);
  };

  const handleSkip = () => {
    navigate(`/confirm?clientId=${clientId}&phone=${phone}&services=${services}&technician=${technician}&guests=0${isNewClient ? '&new=true' : ''}`);
  };

  return (
    <div className="kiosk-mode min-h-screen bg-[#faf9f7] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#1a5f4a]/8 to-transparent" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-[#d4a853]/10 to-transparent" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-6 border-b border-[#e5e7eb]">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-[#6b7280] hover:text-[#1a5f4a] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-['Work_Sans']">Back</span>
          </button>

          <div className="text-center">
            <h1 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#1f2937]">
              Bringing Anyone?
            </h1>
            <p className="font-['Work_Sans'] text-sm text-[#6b7280]">
              Let us know if you have guests today
            </p>
          </div>

          <button
            onClick={handleSkip}
            className="font-['Work_Sans'] text-[#6b7280] hover:text-[#1a5f4a] transition-colors"
          >
            Skip
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full text-center">
            {/* Icon */}
            <div className="w-24 h-24 bg-gradient-to-br from-[#1a5f4a] to-[#2d7a5f] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
              <Users className="w-12 h-12 text-white" />
            </div>

            <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#1f2937] mb-2">
              {guestCount === 0 ? 'Just you today?' : `You + ${guestCount} guest${guestCount > 1 ? 's' : ''}`}
            </h2>
            <p className="font-['Work_Sans'] text-[#6b7280] mb-8">
              {guestCount === 0
                ? "That's perfectly fine! Tap + if you're bringing friends or family."
                : "Great! We'll get everyone checked in together."
              }
            </p>

            {/* Counter */}
            <div className="flex items-center justify-center gap-6 mb-8">
              <button
                onClick={handleDecrement}
                disabled={guestCount === 0}
                className={`
                  w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-200
                  ${guestCount === 0
                    ? 'bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed'
                    : 'bg-white border-2 border-[#e5e7eb] text-[#1f2937] hover:border-[#1a5f4a] hover:text-[#1a5f4a] active:scale-95'
                  }
                `}
              >
                <Minus className="w-6 h-6" />
              </button>

              <div className="w-32 h-24 bg-white rounded-2xl border-2 border-[#e5e7eb] flex items-center justify-center shadow-inner">
                <span className="font-['Plus_Jakarta_Sans'] text-5xl font-bold text-[#1f2937]">
                  {guestCount}
                </span>
              </div>

              <button
                onClick={handleIncrement}
                disabled={guestCount >= MAX_GUESTS}
                className={`
                  w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-200
                  ${guestCount >= MAX_GUESTS
                    ? 'bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed'
                    : 'bg-[#1a5f4a] text-white shadow-lg shadow-[#1a5f4a]/25 hover:bg-[#154d3c] active:scale-95'
                  }
                `}
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>

            {/* Guest avatars preview */}
            {guestCount > 0 && (
              <div className="flex items-center justify-center gap-2 mb-8">
                {/* Main client */}
                <div className="w-12 h-12 bg-gradient-to-br from-[#1a5f4a] to-[#154d3c] rounded-full flex items-center justify-center shadow-md ring-2 ring-white">
                  <User className="w-5 h-5 text-white" />
                </div>

                {/* Guests */}
                {Array.from({ length: guestCount }).map((_, i) => (
                  <div
                    key={i}
                    className="w-12 h-12 bg-gradient-to-br from-[#d4a853] to-[#c49a4a] rounded-full flex items-center justify-center shadow-md ring-2 ring-white -ml-3"
                    style={{ zIndex: guestCount - i }}
                  >
                    <User className="w-5 h-5 text-white" />
                  </div>
                ))}
              </div>
            )}

            <p className="font-['Work_Sans'] text-sm text-[#9ca3af]">
              Maximum {MAX_GUESTS} guests per check-in
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="p-6 border-t border-[#e5e7eb] bg-white">
          <div className="flex items-center justify-center">
            <button
              onClick={handleContinue}
              className="px-12 py-4 rounded-xl bg-[#1a5f4a] text-white font-['Plus_Jakarta_Sans'] font-semibold shadow-lg shadow-[#1a5f4a]/25 hover:bg-[#154d3c] transition-all active:scale-[0.98] flex items-center gap-2"
            >
              Continue to Review
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default GuestsPage;
