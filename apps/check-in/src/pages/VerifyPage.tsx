import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Calendar, Sparkles, ArrowRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchClientByPhone, clearPhoneSearch } from '../store/slices/clientSlice';
import { formatPhone } from '../utils';
import { useAnalytics } from '../hooks/useAnalytics';

export function VerifyPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const phone = searchParams.get('phone') || '';
  const { trackPhoneEntered } = useAnalytics();
  const lookupStartRef = useRef<number>(Date.now());
  const trackedRef = useRef(false);

  const { phoneSearchResult, currentClient } = useAppSelector((state) => state.client);
  const { status, client } = phoneSearchResult;

  useEffect(() => {
    if (!phone || phone.length !== 10) {
      navigate('/');
      return;
    }

    lookupStartRef.current = Date.now();
    dispatch(fetchClientByPhone(phone));

    return () => {
      dispatch(clearPhoneSearch());
    };
  }, [phone, navigate, dispatch]);

  useEffect(() => {
    if ((status === 'found' || status === 'not_found') && !trackedRef.current) {
      trackedRef.current = true;
      const lookupDurationMs = Date.now() - lookupStartRef.current;
      trackPhoneEntered({
        isReturningClient: status === 'found',
        lookupDurationMs,
      });
    }
  }, [status, trackPhoneEntered]);

  const handleNewClient = () => {
    navigate(`/signup?phone=${phone}`);
  };

  const handleWalkIn = () => {
    const clientId = currentClient?.id || client?.id;
    navigate(`/services?clientId=${clientId}&phone=${phone}`);
  };



  const handleNotMe = () => {
    dispatch(clearPhoneSearch());
    navigate('/');
  };

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="kiosk-mode min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#1a5f4a]/20 border-t-[#1a5f4a] rounded-full animate-spin mx-auto mb-6" />
          <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#1f2937] mb-2">
            Looking you up...
          </h2>
          <p className="font-['Work_Sans'] text-[#6b7280]">
            {formatPhone(phone)}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="kiosk-mode min-h-screen bg-[#faf9f7] flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-[#fef2f2] rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-[#ef4444]" />
          </div>

          <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-[#1f2937] mb-3">
            Oops!
          </h1>
          <p className="font-['Work_Sans'] text-[#6b7280] text-lg mb-8">
            Something went wrong. Please try again.
          </p>

          <button
            onClick={handleNotMe}
            className="w-full py-4 rounded-2xl bg-[#1a5f4a] text-white font-['Plus_Jakarta_Sans'] text-lg font-semibold shadow-lg shadow-[#1a5f4a]/25 hover:bg-[#154d3c] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            Try Again
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  if (status === 'not_found') {
    return (
      <div className="kiosk-mode min-h-screen bg-[#faf9f7] flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-[#fdf8eb] rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-[#d4a853]" />
          </div>

          <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-[#1f2937] mb-3">
            Welcome! 👋
          </h1>
          <p className="font-['Work_Sans'] text-[#6b7280] text-lg mb-2">
            We don't have this number on file yet
          </p>
          <p className="font-['Work_Sans'] text-[#9ca3af] mb-8">
            {formatPhone(phone)}
          </p>

          <button
            onClick={handleNewClient}
            className="w-full py-4 rounded-2xl bg-[#1a5f4a] text-white font-['Plus_Jakarta_Sans'] text-lg font-semibold shadow-lg shadow-[#1a5f4a]/25 hover:bg-[#154d3c] transition-all active:scale-[0.98] flex items-center justify-center gap-2 mb-4"
          >
            Create Account & Continue
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={handleNotMe}
            className="font-['Work_Sans'] text-[#6b7280] hover:text-[#1a5f4a] transition-colors"
          >
            ← Use a different number
          </button>
        </div>
      </div>
    );
  }

  const displayClient = currentClient || client;
  if (!displayClient) {
    return null;
  }

  const formatLastVisit = (date: string | undefined): string => {
    if (!date) return 'First visit';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return date;
    }
  };

  return (
    <div className="kiosk-mode min-h-screen bg-[#faf9f7] flex items-center justify-center p-8">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-[#1a5f4a] to-[#154d3c] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-3xl font-bold font-['Plus_Jakarta_Sans']">
              {displayClient.firstName.charAt(0)}
            </span>
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-[#1f2937] mb-1">
            Welcome back, {displayClient.firstName}! 👋
          </h1>
          <p className="font-['Work_Sans'] text-[#6b7280]">
            Great to see you again
          </p>
        </div>

        {displayClient.lastVisitAt && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#e8f5f0] rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#1a5f4a]" />
              </div>
              <div>
                <p className="font-['Work_Sans'] text-sm text-[#6b7280]">Last visit</p>
                <p className="font-['Plus_Jakarta_Sans'] font-semibold text-[#1f2937]">
                  {formatLastVisit(displayClient.lastVisitAt)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-[#fdf8eb] to-[#fef9f3] rounded-2xl p-4 mb-6 border border-[#d4a853]/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-[#d4a853]" />
              <span className="font-['Work_Sans'] text-[#92742d]">Loyalty Points</span>
            </div>
            <span className="font-['Plus_Jakarta_Sans'] font-bold text-[#92742d]">
              {displayClient.loyaltyPoints || 0} pts
            </span>
          </div>
          {displayClient.loyaltyPointsToNextReward && displayClient.loyaltyPointsToNextReward > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs font-['Work_Sans'] text-[#92742d]/70 mb-1">
                <span>Progress to next reward</span>
                <span>{displayClient.loyaltyPointsToNextReward} pts to go</span>
              </div>
              <div className="w-full bg-[#d4a853]/20 rounded-full h-2">
                <div
                  className="bg-[#d4a853] h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, ((displayClient.loyaltyPoints || 0) / ((displayClient.loyaltyPoints || 0) + displayClient.loyaltyPointsToNextReward)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleWalkIn}
          className="w-full py-4 rounded-2xl bg-[#1a5f4a] text-white font-['Plus_Jakarta_Sans'] text-lg font-semibold shadow-lg shadow-[#1a5f4a]/25 hover:bg-[#154d3c] transition-all active:scale-[0.98] flex items-center justify-center gap-2 mb-4"
        >
          Select Services
          <ArrowRight className="w-5 h-5" />
        </button>

        <button
          onClick={handleNotMe}
          className="w-full font-['Work_Sans'] text-[#6b7280] hover:text-[#1a5f4a] transition-colors py-2"
        >
          Not me? Use a different number
        </button>
      </div>
    </div>
  );
}

export default VerifyPage;
