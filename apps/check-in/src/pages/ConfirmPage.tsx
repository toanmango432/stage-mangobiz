import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Clock, DollarSign, User, Users, Scissors, Sparkles } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { createCheckIn } from '../store/slices/checkinSlice';
import { useMqtt } from '../providers/MqttProvider';
import { useAnalytics } from '../hooks/useAnalytics';
import { formatPrice, formatDuration } from '../utils';

export function ConfirmPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { publish } = useMqtt();
  const { trackCheckinCompleted, getFlowDuration } = useAnalytics();

  const {
    currentClient,
    isNewClient,
    selectedServices,
    technicianPreference,
    guests,
    checkInStatus,
    checkInError,
  } = useAppSelector((state) => state.checkin);

  const { storeId, deviceId } = useAppSelector((state) => state.auth);
  const technicians = useAppSelector((state) => state.technicians.technicians);

  const guestDuration = guests.reduce((sum, g) => sum + g.services.reduce((s, svc) => s + svc.durationMinutes, 0), 0);
  const guestPrice = guests.reduce((sum, g) => sum + g.services.reduce((s, svc) => s + svc.price, 0), 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0) + guestDuration;
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0) + guestPrice;

  const selectedTechnician =
    technicianPreference === 'anyone'
      ? null
      : technicians.find((t) => t.id === technicianPreference);

  const technicianName = selectedTechnician?.displayName || 'Next Available';

  const loyaltyPoints = currentClient?.loyaltyPoints ?? 0;
  const loyaltyPointsToNextReward = currentClient?.loyaltyPointsToNextReward ?? 100;
  const progressPercentage = Math.min(100, (loyaltyPoints / (loyaltyPoints + loyaltyPointsToNextReward)) * 100);

  useEffect(() => {
    if (!currentClient || selectedServices.length === 0) {
      navigate('/');
    }
  }, [currentClient, selectedServices, navigate]);

  const handleConfirm = async () => {
    if (!storeId || !deviceId) {
      console.error('Missing storeId or deviceId');
      return;
    }

    const result = await dispatch(createCheckIn({ storeId, deviceId }));

    if (createCheckIn.fulfilled.match(result)) {
      const checkIn = result.payload;

      trackCheckinCompleted({
        checkInId: checkIn.id,
        checkInNumber: checkIn.checkInNumber,
        isNewClient: isNewClient,
        serviceCount: checkIn.services.length,
        totalPrice,
        guestCount: checkIn.guests.length,
        flowDurationMs: getFlowDuration(),
      });

      await publish(`salon/${storeId}/checkin/new`, {
        checkInId: checkIn.id,
        checkInNumber: checkIn.checkInNumber,
        clientId: checkIn.clientId,
        clientName: checkIn.clientName,
        services: checkIn.services,
        technicianPreference: checkIn.technicianPreference,
        guests: checkIn.guests,
        checkedInAt: checkIn.checkedInAt,
      });

      navigate('/success');
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (!currentClient) {
    return null;
  }

  return (
    <div className="kiosk-mode min-h-screen bg-[#faf9f7] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#1a5f4a]/8 to-transparent" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-[#d4a853]/10 to-transparent" />
      </div>

      {/* Main Content - Horizontal Layout */}
      <div className="relative z-10 min-h-screen flex flex-row">
        {/* LEFT - Review Summary */}
        <div className="w-[55%] flex flex-col p-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-[#6b7280] hover:text-[#1a5f4a] transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-['Work_Sans']">Back</span>
            </button>
          </div>

          <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#1f2937] mb-2">
            Review Your Check-In
          </h1>
          <p className="font-['Work_Sans'] text-[#6b7280] mb-8">
            Please confirm everything looks correct
          </p>

          {/* Error Message */}
          {checkInError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="font-['Work_Sans'] text-red-700">{checkInError}</p>
            </div>
          )}

          {/* Cards */}
          <div className="space-y-4 flex-1 overflow-y-auto">
            {/* Client Card */}
            <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#e8f5f0] rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-[#1a5f4a]" />
                </div>
                <div>
                  <h3 className="font-['Plus_Jakarta_Sans'] font-semibold text-[#1f2937]">
                    {currentClient.firstName} {currentClient.lastName}
                  </h3>
                  <p className="font-['Work_Sans'] text-sm text-[#6b7280]">
                    {isNewClient ? 'New Client' : 'Returning Client'}
                  </p>
                </div>
              </div>
            </div>

            {/* Services Card */}
            <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#e8f5f0] rounded-xl flex items-center justify-center">
                  <Scissors className="w-5 h-5 text-[#1a5f4a]" />
                </div>
                <h3 className="font-['Plus_Jakarta_Sans'] font-semibold text-[#1f2937]">
                  Services ({selectedServices.length})
                </h3>
              </div>

              <div className="space-y-2">
                {selectedServices.map((service) => (
                  <div
                    key={service.serviceId}
                    className="flex items-center justify-between py-2 border-b border-[#f3f4f6] last:border-0"
                  >
                    <div>
                      <p className="font-['Work_Sans'] font-medium text-[#1f2937]">
                        {service.serviceName}
                      </p>
                      <p className="font-['Work_Sans'] text-sm text-[#6b7280]">
                        {formatDuration(service.durationMinutes)}
                      </p>
                    </div>
                    <span className="font-['Plus_Jakarta_Sans'] font-semibold text-[#1f2937]">
                      {formatPrice(service.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Technician Card */}
            <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#e8f5f0] rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-[#1a5f4a]" />
                </div>
                <div>
                  <h3 className="font-['Plus_Jakarta_Sans'] font-semibold text-[#1f2937]">
                    Technician
                  </h3>
                  <p className="font-['Work_Sans'] text-[#6b7280]">{technicianName}</p>
                </div>
              </div>
            </div>

            {/* Guests Card */}
            {guests.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#fdf8eb] rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-[#d4a853]" />
                  </div>
                  <div>
                    <h3 className="font-['Plus_Jakarta_Sans'] font-semibold text-[#1f2937]">
                      Guests ({guests.length})
                    </h3>
                    <p className="font-['Work_Sans'] text-sm text-[#6b7280]">
                      Additional {guests.length === 1 ? 'person' : 'people'} in your party
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {guests.map((guest, index) => (
                    <div
                      key={guest.id}
                      className="flex items-start gap-3 py-3 border-b border-[#f3f4f6] last:border-0 last:pb-0"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-[#d4a853] to-[#c49a4a] rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold font-['Plus_Jakarta_Sans']">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-['Work_Sans'] font-medium text-[#1f2937]">
                          {guest.name}
                        </p>
                        {guest.services.length > 0 ? (
                          <div className="mt-1 space-y-1">
                            {guest.services.map((svc) => (
                              <div
                                key={svc.serviceId}
                                className="flex items-center justify-between text-sm"
                              >
                                <span className="font-['Work_Sans'] text-[#6b7280]">
                                  {svc.serviceName} ({formatDuration(svc.durationMinutes)})
                                </span>
                                <span className="font-['Work_Sans'] text-[#1f2937]">
                                  {formatPrice(svc.price)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="font-['Work_Sans'] text-sm text-[#9ca3af] italic">
                            No services selected
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT - Confirmation Panel */}
        <div className="w-[45%] bg-gradient-to-br from-[#1a5f4a] to-[#154d3c] p-8 flex flex-col justify-center">
          <div className="max-w-sm mx-auto">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
              <Check className="w-10 h-10 text-white" />
            </div>

            <h2 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-white mb-2">
              Ready to Check In!
            </h2>
            <p className="font-['Work_Sans'] text-white/80 mb-8">
              {isNewClient ? 'Welcome to our salon!' : 'Great to see you again!'}
            </p>

            {/* Summary */}
            <div className="bg-white/10 rounded-2xl p-5 mb-6">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/20">
                <div className="flex items-center gap-2 text-white/80">
                  <Clock className="w-4 h-4" />
                  <span className="font-['Work_Sans'] text-sm">Est. Duration</span>
                </div>
                <span className="font-['Plus_Jakarta_Sans'] font-semibold text-white">
                  {formatDuration(totalDuration)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/80">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-['Work_Sans'] text-sm">Est. Total</span>
                </div>
                <span className="font-['Plus_Jakarta_Sans'] font-bold text-2xl text-white">
                  {formatPrice(totalPrice)}
                </span>
              </div>
            </div>

            {/* Loyalty Points */}
            {!isNewClient && (
              <div className="bg-gradient-to-r from-[#d4a853]/20 to-[#c49a4a]/20 rounded-2xl p-4 mb-8 border border-[#d4a853]/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-white">
                    <Sparkles className="w-4 h-4 text-[#d4a853]" />
                    <span className="font-['Work_Sans'] text-sm">Loyalty Points</span>
                  </div>
                  <span className="font-['Plus_Jakarta_Sans'] font-bold text-[#d4a853]">
                    {loyaltyPoints} pts
                  </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                  <div
                    className="bg-[#d4a853] h-2 rounded-full transition-all"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <p className="font-['Work_Sans'] text-xs text-white/70 text-center">
                  {loyaltyPointsToNextReward} pts to next reward
                </p>
              </div>
            )}

            {/* Confirm Button */}
            <button
              onClick={handleConfirm}
              disabled={checkInStatus === 'submitting'}
              className="w-full py-5 rounded-2xl bg-white text-[#1a5f4a] font-['Plus_Jakarta_Sans'] text-lg font-bold shadow-xl hover:bg-[#f9fafb] transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
              aria-label="Confirm and check in"
            >
              {checkInStatus === 'submitting' ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#1a5f4a]/30 border-t-[#1a5f4a] rounded-full animate-spin" />
                  Checking In...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Confirm & Check In
                </>
              )}
            </button>

            <p className="font-['Work_Sans'] text-sm text-white/60 text-center mt-4">
              By checking in, you agree to our service policies
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmPage;
