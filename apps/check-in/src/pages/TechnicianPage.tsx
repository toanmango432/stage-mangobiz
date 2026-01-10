import { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, User, Shuffle, Star, Clock } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchTechnicians } from '../store/slices/technicianSlice';
import { setTechnicianPreference } from '../store/slices/checkinSlice';
import { useTechnicianMqtt } from '../hooks/useTechnicianMqtt';
import type { Technician, TechnicianStatus } from '../types';

const STATUS_CONFIG: Record<TechnicianStatus, { label: string; color: string; bgColor: string; dotColor: string }> = {
  available: { label: 'Available', color: 'text-[#22c55e]', bgColor: 'bg-[#dcfce7]', dotColor: 'bg-[#22c55e]' },
  with_client: { label: 'With Client', color: 'text-[#f59e0b]', bgColor: 'bg-[#fef3c7]', dotColor: 'bg-[#f59e0b]' },
  on_break: { label: 'On Break', color: 'text-[#6b7280]', bgColor: 'bg-[#f3f4f6]', dotColor: 'bg-[#6b7280]' },
  unavailable: { label: 'Unavailable', color: 'text-[#ef4444]', bgColor: 'bg-[#fee2e2]', dotColor: 'bg-[#ef4444]' },
};

export function TechnicianPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('clientId') || '';
  const phone = searchParams.get('phone') || '';
  const services = searchParams.get('services') || '';
  const isNewClient = searchParams.get('new') === 'true';

  const { technicians, isLoading, error } = useAppSelector((state) => state.technicians);
  const technicianPreference = useAppSelector((state) => state.checkin.technicianPreference);
  const selectedServices = useAppSelector((state) => state.checkin.selectedServices);

  useTechnicianMqtt();

  useEffect(() => {
    dispatch(fetchTechnicians() as never);
  }, [dispatch]);

  const selectedServiceIds = useMemo(() => {
    if (services) {
      return services.split(',');
    }
    return selectedServices.map((s) => s.serviceId);
  }, [services, selectedServices]);

  const qualifiedTechnicians = useMemo(() => {
    if (selectedServiceIds.length === 0) {
      return technicians;
    }
    return technicians.filter((tech) =>
      selectedServiceIds.some((serviceId) => tech.serviceIds.includes(serviceId))
    );
  }, [technicians, selectedServiceIds]);

  const sortedTechnicians = useMemo(() => {
    return [...qualifiedTechnicians].sort((a, b) => {
      const statusOrder: Record<TechnicianStatus, number> = {
        available: 0,
        with_client: 1,
        on_break: 2,
        unavailable: 3,
      };
      return statusOrder[a.status] - statusOrder[b.status];
    });
  }, [qualifiedTechnicians]);

  const handleSelect = (techId: string) => {
    dispatch(setTechnicianPreference(techId));
  };

  const handleNoPreference = () => {
    dispatch(setTechnicianPreference('anyone'));
  };

  const handleContinue = () => {
    const techParam = technicianPreference === 'anyone' ? 'any' : technicianPreference;
    navigate(`/guests?clientId=${clientId}&phone=${phone}&services=${services}&technician=${techParam}${isNewClient ? '&new=true' : ''}`);
  };

  const handleBack = () => {
    navigate(`/services?clientId=${clientId}&phone=${phone}${isNewClient ? '&new=true' : ''}`);
  };

  const isNoPreference = technicianPreference === 'anyone';
  const selectedTechnician = technicians.find((t) => t.id === technicianPreference);
  const isValid = technicianPreference !== '';

  const renderTechnicianCard = (tech: Technician) => {
    const isSelected = technicianPreference === tech.id;
    const status = STATUS_CONFIG[tech.status];

    return (
      <button
        key={tech.id}
        onClick={() => handleSelect(tech.id)}
        className={`
          p-5 rounded-2xl text-left transition-all duration-200 border-2 flex flex-col min-h-[180px]
          ${isSelected
            ? 'bg-[#e8f5f0] border-[#1a5f4a] shadow-md'
            : 'bg-white border-[#e5e7eb] hover:border-[#1a5f4a]/50 hover:shadow-sm'
          }
        `}
        aria-label={`Select ${tech.displayName}`}
        aria-pressed={isSelected}
      >
        <div className="flex items-start justify-between mb-3">
          {tech.photoUrl ? (
            <img
              src={tech.photoUrl}
              alt={tech.displayName}
              className="w-14 h-14 rounded-full object-cover shadow-md"
            />
          ) : (
            <div className="w-14 h-14 bg-gradient-to-br from-[#1a5f4a] to-[#154d3c] rounded-full flex items-center justify-center shadow-md">
              <span className="text-white text-xl font-bold font-['Plus_Jakarta_Sans']">
                {tech.firstName.charAt(0)}
              </span>
            </div>
          )}
          <div className={`
            w-6 h-6 rounded-full flex items-center justify-center transition-all
            ${isSelected
              ? 'bg-[#1a5f4a] text-white'
              : 'border-2 border-[#d1d5db]'
            }
          `}>
            {isSelected && <Check className="w-4 h-4" />}
          </div>
        </div>

        <h3 className="font-['Plus_Jakarta_Sans'] font-semibold text-[#1f2937] text-lg mb-1">
          {tech.displayName}
        </h3>

        {tech.estimatedWaitMinutes !== undefined && tech.status !== 'available' && (
          <p className="font-['Work_Sans'] text-sm text-[#6b7280] mb-2 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            ~{tech.estimatedWaitMinutes} min wait
          </p>
        )}

        <div className="mt-auto">
          <span className={`
            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium font-['Work_Sans']
            ${status.bgColor} ${status.color}
          `}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />
            {status.label}
          </span>
        </div>
      </button>
    );
  };

  if (isLoading && technicians.length === 0) {
    return (
      <div className="kiosk-mode min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1a5f4a] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-['Work_Sans'] text-[#6b7280]">Loading technicians...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="kiosk-mode min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="font-['Work_Sans'] text-[#ef4444] mb-4">{error}</p>
          <button
            onClick={() => dispatch(fetchTechnicians() as never)}
            className="px-6 py-3 bg-[#1a5f4a] text-white rounded-xl font-['Plus_Jakarta_Sans'] font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

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
            className="flex items-center gap-2 text-[#6b7280] hover:text-[#1a5f4a] transition-colors min-w-[80px]"
            aria-label="Go back to services"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-['Work_Sans']">Back</span>
          </button>

          <div className="text-center">
            <h1 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#1f2937]">
              Choose Your Technician
            </h1>
            <p className="font-['Work_Sans'] text-sm text-[#6b7280]">
              Select who you'd like to see today
            </p>
          </div>

          <div className="w-20" />
        </header>

        {/* Content */}
        <div className="flex-1 flex flex-col p-8 overflow-y-auto">
          {/* No Preference Option with Recommended Badge */}
          <button
            onClick={handleNoPreference}
            className={`
              mb-6 p-5 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4
              ${isNoPreference
                ? 'bg-[#e8f5f0] border-[#1a5f4a] shadow-md'
                : 'bg-white border-[#e5e7eb] hover:border-[#1a5f4a]/50'
              }
            `}
            aria-label="Let us assign the next available technician"
            aria-pressed={isNoPreference}
          >
            <div className={`
              w-14 h-14 rounded-full flex items-center justify-center
              ${isNoPreference ? 'bg-[#1a5f4a]' : 'bg-[#f3f4f6]'}
            `}>
              <Shuffle className={`w-6 h-6 ${isNoPreference ? 'text-white' : 'text-[#6b7280]'}`} />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-['Plus_Jakarta_Sans'] font-semibold text-[#1f2937] text-lg">
                  Anyone Available
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#fef3c7] text-[#d97706] text-xs font-medium font-['Work_Sans']">
                  <Star className="w-3 h-3" />
                  Recommended
                </span>
              </div>
              <p className="font-['Work_Sans'] text-sm text-[#6b7280]">
                Let us assign the next available technician for faster service
              </p>
            </div>
            <div className={`
              w-6 h-6 rounded-full flex items-center justify-center transition-all
              ${isNoPreference
                ? 'bg-[#1a5f4a] text-white'
                : 'border-2 border-[#d1d5db]'
              }
            `}>
              {isNoPreference && <Check className="w-4 h-4" />}
            </div>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-[#e5e7eb]" />
            <span className="font-['Work_Sans'] text-sm text-[#9ca3af]">
              or choose a technician ({sortedTechnicians.length} available for your services)
            </span>
            <div className="flex-1 h-px bg-[#e5e7eb]" />
          </div>

          {/* Technicians Grid */}
          {sortedTechnicians.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
              {sortedTechnicians.map(renderTechnicianCard)}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <User className="w-12 h-12 text-[#9ca3af] mx-auto mb-4" />
                <p className="font-['Work_Sans'] text-[#6b7280]">
                  No technicians available for the selected services.
                </p>
                <p className="font-['Work_Sans'] text-sm text-[#9ca3af] mt-2">
                  Please select "Anyone Available" to proceed.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="p-6 border-t border-[#e5e7eb] bg-white">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="font-['Work_Sans'] text-sm text-[#6b7280]">
              {isValid ? (
                isNoPreference ? (
                  <span className="flex items-center gap-2">
                    <Shuffle className="w-4 h-4" />
                    Next available technician
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {selectedTechnician?.displayName}
                  </span>
                )
              ) : (
                'Select a technician to continue'
              )}
            </div>

            <button
              onClick={handleContinue}
              disabled={!isValid}
              className={`
                px-8 py-4 rounded-xl font-['Plus_Jakarta_Sans'] font-semibold
                flex items-center gap-2 transition-all duration-300 min-h-[56px]
                ${isValid
                  ? 'bg-[#1a5f4a] text-white shadow-lg shadow-[#1a5f4a]/25 hover:bg-[#154d3c] active:scale-[0.98]'
                  : 'bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed'
                }
              `}
              aria-label="Continue to next step"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default TechnicianPage;
