import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Clock, Sparkles, Gift, Home, Users } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { resetCheckin } from '../store/slices/checkinSlice';
import { useQueueMqtt } from '../hooks/useQueueMqtt';

export function SuccessPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useQueueMqtt();

  const {
    lastCheckIn,
    checkInNumber,
    queuePosition,
    estimatedWaitMinutes,
    technicianPreference,
    guests,
    isNewClient,
    currentClient,
    queueStatus,
  } = useAppSelector((state) => state.checkin);

  const technicians = useAppSelector((state) => state.technicians.technicians);

  const [showConfetti, setShowConfetti] = useState(true);

  const selectedTechnician =
    technicianPreference === 'anyone'
      ? null
      : technicians.find((t) => t.id === technicianPreference);

  const technicianName = selectedTechnician?.displayName || 'Next Available Technician';

  const loyaltyPoints = currentClient?.loyaltyPoints ?? 0;
  const loyaltyPointsToNextReward = currentClient?.loyaltyPointsToNextReward ?? 100;

  const displayCheckInNumber = checkInNumber || lastCheckIn?.checkInNumber || '---';
  const displayQueuePosition = queuePosition ?? lastCheckIn?.queuePosition ?? 1;
  const displayEstimatedWait = estimatedWaitMinutes ?? lastCheckIn?.estimatedWaitMinutes ?? 0;
  const calculatedWait = displayEstimatedWait > 0 ? displayEstimatedWait : displayQueuePosition * 8;
  const totalInQueue = queueStatus?.totalInQueue ?? displayQueuePosition;

  useEffect(() => {
    if (!lastCheckIn && !checkInNumber) {
      navigate('/');
      return;
    }

    const timer = setTimeout(() => {
      dispatch(resetCheckin());
      navigate('/');
    }, 30000);

    return () => clearTimeout(timer);
  }, [navigate, dispatch, lastCheckIn, checkInNumber]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleDone = () => {
    dispatch(resetCheckin());
    navigate('/');
  };

  return (
    <div className="kiosk-mode min-h-screen bg-[#faf9f7] relative overflow-hidden">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-50">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-fall"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <div
                className="w-3 h-3 rounded-sm"
                style={{
                  backgroundColor: ['#1a5f4a', '#d4a853', '#22c55e', '#f59e0b'][
                    Math.floor(Math.random() * 4)
                  ],
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#1a5f4a]/8 to-transparent" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-[#d4a853]/10 to-transparent" />
      </div>

      {/* Main Content - Horizontal Layout */}
      <div className="relative z-10 min-h-screen flex flex-row">
        {/* LEFT - Success Message */}
        <div className="w-[55%] flex flex-col items-center justify-center p-8">
          {/* Success Icon */}
          <div className="relative mb-8">
            <div className="w-28 h-28 bg-gradient-to-br from-[#22c55e] to-[#16a34a] rounded-full flex items-center justify-center shadow-xl animate-bounce-subtle">
              <Check className="w-14 h-14 text-white" strokeWidth={3} />
            </div>
            <div className="absolute -top-2 -right-2 w-10 h-10 bg-[#d4a853] rounded-full flex items-center justify-center animate-ping-slow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>

          <h1 className="font-['Plus_Jakarta_Sans'] text-4xl font-bold text-[#1f2937] mb-3 text-center">
            You're Checked In!
          </h1>
          <p className="font-['Work_Sans'] text-lg text-[#6b7280] text-center mb-8">
            {guests.length > 0
              ? `Welcome! You and your ${guests.length} guest${guests.length > 1 ? 's' : ''} are all set.`
              : "Please have a seat. We'll call you shortly!"}
          </p>

          {/* Check-in Number */}
          <div className="bg-white rounded-3xl border-2 border-[#1a5f4a] p-8 shadow-lg mb-8 text-center">
            <p className="font-['Work_Sans'] text-sm text-[#6b7280] mb-2">Your Check-In Number</p>
            <p className="font-['Plus_Jakarta_Sans'] text-6xl font-bold text-[#1a5f4a]">
              {displayCheckInNumber}
            </p>
          </div>

          {/* Queue Visual Indicator */}
          {totalInQueue > 0 && (
            <div className="mb-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#6b7280]" />
                  <span className="font-['Work_Sans'] text-sm text-[#6b7280]">Queue Status</span>
                </div>
                <span className="font-['Work_Sans'] text-sm text-[#6b7280]">
                  {totalInQueue} waiting
                </span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(totalInQueue, 10) }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-2 rounded-full transition-colors ${
                      i < displayQueuePosition
                        ? 'bg-[#1a5f4a]'
                        : i === displayQueuePosition - 1
                          ? 'bg-[#d4a853] animate-pulse'
                          : 'bg-[#e5e7eb]'
                    }`}
                    aria-label={i === displayQueuePosition - 1 ? 'Your position' : undefined}
                  />
                ))}
                {totalInQueue > 10 && (
                  <span className="font-['Work_Sans'] text-xs text-[#6b7280] ml-1">+{totalInQueue - 10}</span>
                )}
              </div>
            </div>
          )}

          {/* Queue Info */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="flex items-center gap-2 justify-center mb-1">
                <Clock className="w-5 h-5 text-[#6b7280]" />
                <span className="font-['Work_Sans'] text-sm text-[#6b7280]">Est. Wait</span>
              </div>
              <p className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#1f2937]">
                ~{calculatedWait}
                <span className="text-lg font-normal text-[#9ca3af]"> ±5 min</span>
              </p>
            </div>

            <div className="w-px h-12 bg-[#e5e7eb]" />

            <div className="text-center">
              <p className="font-['Work_Sans'] text-sm text-[#6b7280] mb-1">Queue Position</p>
              <p className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#1f2937]">
                #{displayQueuePosition}
              </p>
            </div>

            <div className="w-px h-12 bg-[#e5e7eb]" />

            <div className="text-center">
              <p className="font-['Work_Sans'] text-sm text-[#6b7280] mb-1">Technician</p>
              <p className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#1f2937]">
                {technicianName}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT - Loyalty & Actions */}
        <div className="w-[45%] bg-gradient-to-br from-[#1a5f4a] to-[#154d3c] p-8 flex flex-col justify-center">
          <div className="max-w-sm mx-auto">
            {/* Loyalty Card */}
            <div className="bg-gradient-to-br from-[#d4a853] to-[#c49a4a] rounded-3xl p-6 mb-8 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-white text-lg">
                    Loyalty Rewards
                  </h3>
                  <p className="font-['Work_Sans'] text-white/80 text-sm">Keep earning points!</p>
                </div>
              </div>

              <div className="bg-white/20 rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-['Work_Sans'] text-white/80 text-sm">Current Points</span>
                  <span className="font-['Plus_Jakarta_Sans'] font-bold text-white text-2xl">
                    {loyaltyPoints}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-3 bg-white/30 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${((loyaltyPoints % 500) / 500) * 100}%` }}
                  />
                </div>

                <p className="font-['Work_Sans'] text-white/80 text-sm text-center">
                  <span className="font-semibold text-white">{loyaltyPointsToNextReward}</span>{' '}
                  points to next reward!
                </p>
              </div>

              <div className="flex items-center gap-2 text-white/80">
                <Sparkles className="w-4 h-4" />
                <span className="font-['Work_Sans'] text-sm">Earn 10 points per $1 spent</span>
              </div>
            </div>

            {/* Thank You Message */}
            <div className="text-center mb-8">
              <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-white mb-2">
                {isNewClient ? 'Welcome!' : 'Thank You!'}
              </h2>
              <p className="font-['Work_Sans'] text-white/80">
                {isNewClient
                  ? "We're excited to have you. Enjoy your first visit!"
                  : 'We appreciate you choosing us. Enjoy your visit!'}
              </p>
            </div>

            {/* Done Button */}
            <button
              onClick={handleDone}
              className="w-full py-5 rounded-2xl bg-white text-[#1a5f4a] font-['Plus_Jakarta_Sans'] text-lg font-bold shadow-xl hover:bg-[#f9fafb] transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              aria-label="Done"
            >
              <Home className="w-5 h-5" />
              Done
            </button>

            <p className="font-['Work_Sans'] text-sm text-white/60 text-center mt-4">
              This screen will reset in 30 seconds
            </p>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        .animate-fall {
          animation: fall 3s linear forwards;
        }

        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }

        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          75%, 100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}

export default SuccessPage;
