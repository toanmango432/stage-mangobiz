import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, User, Shuffle } from 'lucide-react';

// Mock technicians data
const TECHNICIANS = [
  { id: 't1', name: 'Lisa', status: 'available', avatar: null, specialty: 'Nail Art Expert' },
  { id: 't2', name: 'Mike', status: 'busy', avatar: null, specialty: 'Classic Nails' },
  { id: 't3', name: 'Sarah', status: 'available', avatar: null, specialty: 'Lash Extensions' },
  { id: 't4', name: 'Jenny', status: 'working', avatar: null, specialty: 'Full Service' },
  { id: 't5', name: 'Kevin', status: 'available', avatar: null, specialty: 'Pedicure Specialist' },
  { id: 't6', name: 'Amy', status: 'busy', avatar: null, specialty: 'Waxing & Skincare' },
];

type TechnicianStatus = 'available' | 'busy' | 'working';

const STATUS_CONFIG: Record<TechnicianStatus, { label: string; color: string; bgColor: string }> = {
  available: { label: 'Available', color: 'text-[#22c55e]', bgColor: 'bg-[#dcfce7]' },
  busy: { label: 'With Client', color: 'text-[#f59e0b]', bgColor: 'bg-[#fef3c7]' },
  working: { label: 'Almost Done', color: 'text-[#3b82f6]', bgColor: 'bg-[#dbeafe]' },
};

export function TechnicianPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('clientId') || '';
  const phone = searchParams.get('phone') || '';
  const services = searchParams.get('services') || '';
  const isNewClient = searchParams.get('new') === 'true';

  const [selectedTechnician, setSelectedTechnician] = useState<string | null>(null);
  const [noPreference, setNoPreference] = useState(false);

  const handleSelect = (techId: string) => {
    setNoPreference(false);
    setSelectedTechnician(techId);
  };

  const handleNoPreference = () => {
    setNoPreference(true);
    setSelectedTechnician(null);
  };

  const handleContinue = () => {
    const techParam = noPreference ? 'any' : selectedTechnician;
    navigate(`/guests?clientId=${clientId}&phone=${phone}&services=${services}&technician=${techParam}${isNewClient ? '&new=true' : ''}`);
  };

  const handleBack = () => {
    navigate(`/services?clientId=${clientId}&phone=${phone}${isNewClient ? '&new=true' : ''}`);
  };

  const isValid = selectedTechnician || noPreference;

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
              Choose Your Technician
            </h1>
            <p className="font-['Work_Sans'] text-sm text-[#6b7280]">
              Select who you'd like to see today
            </p>
          </div>

          <div className="w-20" />
        </header>

        {/* Content */}
        <div className="flex-1 flex flex-col p-8">
          {/* No Preference Option */}
          <button
            onClick={handleNoPreference}
            className={`
              mb-6 p-5 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4
              ${noPreference
                ? 'bg-[#e8f5f0] border-[#1a5f4a] shadow-md'
                : 'bg-white border-[#e5e7eb] hover:border-[#1a5f4a]/50'
              }
            `}
          >
            <div className={`
              w-14 h-14 rounded-full flex items-center justify-center
              ${noPreference ? 'bg-[#1a5f4a]' : 'bg-[#f3f4f6]'}
            `}>
              <Shuffle className={`w-6 h-6 ${noPreference ? 'text-white' : 'text-[#6b7280]'}`} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-['Plus_Jakarta_Sans'] font-semibold text-[#1f2937] text-lg">
                No Preference
              </h3>
              <p className="font-['Work_Sans'] text-sm text-[#6b7280]">
                Let us assign the next available technician
              </p>
            </div>
            <div className={`
              w-6 h-6 rounded-full flex items-center justify-center transition-all
              ${noPreference
                ? 'bg-[#1a5f4a] text-white'
                : 'border-2 border-[#d1d5db]'
              }
            `}>
              {noPreference && <Check className="w-4 h-4" />}
            </div>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-[#e5e7eb]" />
            <span className="font-['Work_Sans'] text-sm text-[#9ca3af]">or choose a technician</span>
            <div className="flex-1 h-px bg-[#e5e7eb]" />
          </div>

          {/* Technicians Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
            {TECHNICIANS.map(tech => {
              const isSelected = selectedTechnician === tech.id;
              const status = STATUS_CONFIG[tech.status as TechnicianStatus];

              return (
                <button
                  key={tech.id}
                  onClick={() => handleSelect(tech.id)}
                  className={`
                    p-5 rounded-2xl text-left transition-all duration-200 border-2 flex flex-col
                    ${isSelected
                      ? 'bg-[#e8f5f0] border-[#1a5f4a] shadow-md'
                      : 'bg-white border-[#e5e7eb] hover:border-[#1a5f4a]/50 hover:shadow-sm'
                    }
                  `}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#1a5f4a] to-[#154d3c] rounded-full flex items-center justify-center shadow-md">
                      <span className="text-white text-xl font-bold font-['Plus_Jakarta_Sans']">
                        {tech.name.charAt(0)}
                      </span>
                    </div>
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
                    {tech.name}
                  </h3>
                  <p className="font-['Work_Sans'] text-sm text-[#6b7280] mb-3">
                    {tech.specialty}
                  </p>

                  <div className="mt-auto">
                    <span className={`
                      inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium font-['Work_Sans']
                      ${status.bgColor} ${status.color}
                    `}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        tech.status === 'available' ? 'bg-[#22c55e]' :
                        tech.status === 'busy' ? 'bg-[#f59e0b]' : 'bg-[#3b82f6]'
                      }`} />
                      {status.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <footer className="p-6 border-t border-[#e5e7eb] bg-white">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="font-['Work_Sans'] text-sm text-[#6b7280]">
              {isValid ? (
                noPreference ? (
                  <span className="flex items-center gap-2">
                    <Shuffle className="w-4 h-4" />
                    Next available technician
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {TECHNICIANS.find(t => t.id === selectedTechnician)?.name}
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
                flex items-center gap-2 transition-all duration-300
                ${isValid
                  ? 'bg-[#1a5f4a] text-white shadow-lg shadow-[#1a5f4a]/25 hover:bg-[#154d3c] active:scale-[0.98]'
                  : 'bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed'
                }
              `}
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
