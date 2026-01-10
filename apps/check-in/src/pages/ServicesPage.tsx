import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Sparkles, Clock, DollarSign } from 'lucide-react';

// Mock services data - will be replaced with actual API call
const SERVICE_CATEGORIES = [
  {
    id: 'nails',
    name: 'Nails',
    emoji: '💅',
    services: [
      { id: 's1', name: 'Classic Manicure', duration: 30, price: 25 },
      { id: 's2', name: 'Gel Manicure', duration: 45, price: 40 },
      { id: 's3', name: 'Classic Pedicure', duration: 45, price: 35 },
      { id: 's4', name: 'Gel Pedicure', duration: 60, price: 55 },
      { id: 's5', name: 'Mani + Pedi Combo', duration: 75, price: 60 },
    ],
  },
  {
    id: 'waxing',
    name: 'Waxing',
    emoji: '✨',
    services: [
      { id: 's6', name: 'Eyebrow Wax', duration: 15, price: 15 },
      { id: 's7', name: 'Lip Wax', duration: 10, price: 10 },
      { id: 's8', name: 'Full Face Wax', duration: 30, price: 35 },
      { id: 's9', name: 'Underarm Wax', duration: 15, price: 20 },
    ],
  },
  {
    id: 'lashes',
    name: 'Lashes',
    emoji: '👁️',
    services: [
      { id: 's10', name: 'Classic Lash Extensions', duration: 90, price: 120 },
      { id: 's11', name: 'Volume Lash Extensions', duration: 120, price: 180 },
      { id: 's12', name: 'Lash Lift & Tint', duration: 60, price: 75 },
    ],
  },
  {
    id: 'skincare',
    name: 'Skincare',
    emoji: '🧴',
    services: [
      { id: 's13', name: 'Express Facial', duration: 30, price: 45 },
      { id: 's14', name: 'Deep Cleansing Facial', duration: 60, price: 85 },
      { id: 's15', name: 'Anti-Aging Facial', duration: 75, price: 120 },
    ],
  },
];

export function ServicesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('clientId') || '';
  const phone = searchParams.get('phone') || '';
  const isNewClient = searchParams.get('new') === 'true';

  const [activeCategory, setActiveCategory] = useState(SERVICE_CATEGORIES[0].id);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const currentCategory = SERVICE_CATEGORIES.find(c => c.id === activeCategory) || SERVICE_CATEGORIES[0];

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const getSelectedServicesDetails = () => {
    const selected: { id: string; name: string; duration: number; price: number }[] = [];
    SERVICE_CATEGORIES.forEach(cat => {
      cat.services.forEach(service => {
        if (selectedServices.includes(service.id)) {
          selected.push(service);
        }
      });
    });
    return selected;
  };

  const selectedDetails = getSelectedServicesDetails();
  const totalDuration = selectedDetails.reduce((sum, s) => sum + s.duration, 0);
  const totalPrice = selectedDetails.reduce((sum, s) => sum + s.price, 0);

  const handleContinue = () => {
    const servicesParam = selectedServices.join(',');
    navigate(`/technician?clientId=${clientId}&phone=${phone}&services=${servicesParam}${isNewClient ? '&new=true' : ''}`);
  };

  const handleBack = () => {
    if (isNewClient) {
      navigate(`/signup?phone=${phone}`);
    } else {
      navigate(`/verify?phone=${phone}`);
    }
  };

  return (
    <div className="kiosk-mode min-h-screen bg-[#faf9f7] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#1a5f4a]/8 to-transparent" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-[#d4a853]/10 to-transparent" />
      </div>

      {/* Main Content - Horizontal Layout */}
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
              Select Your Services
            </h1>
            <p className="font-['Work_Sans'] text-sm text-[#6b7280]">
              Choose one or more services
            </p>
          </div>

          <div className="w-20" />
        </header>

        {/* Content Area */}
        <div className="flex-1 flex">
          {/* Left - Category Tabs */}
          <div className="w-[200px] border-r border-[#e5e7eb] bg-white p-4">
            <div className="space-y-2">
              {SERVICE_CATEGORIES.map(category => {
                const isActive = category.id === activeCategory;
                const hasSelection = category.services.some(s => selectedServices.includes(s.id));

                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`
                      w-full px-4 py-3 rounded-xl text-left font-['Work_Sans'] transition-all
                      flex items-center gap-3
                      ${isActive
                        ? 'bg-[#1a5f4a] text-white shadow-md'
                        : 'text-[#4b5563] hover:bg-[#f3f4f6]'
                      }
                    `}
                  >
                    <span className="text-xl">{category.emoji}</span>
                    <span className="font-medium">{category.name}</span>
                    {hasSelection && !isActive && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-[#1a5f4a]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center - Services Grid */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {currentCategory.services.map(service => {
                const isSelected = selectedServices.includes(service.id);

                return (
                  <button
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={`
                      p-5 rounded-2xl text-left transition-all duration-200 border-2
                      ${isSelected
                        ? 'bg-[#e8f5f0] border-[#1a5f4a] shadow-md'
                        : 'bg-white border-[#e5e7eb] hover:border-[#1a5f4a]/50 hover:shadow-sm'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-['Plus_Jakarta_Sans'] font-semibold text-[#1f2937] text-lg">
                        {service.name}
                      </h3>
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

                    <div className="flex items-center gap-4 text-sm font-['Work_Sans'] text-[#6b7280]">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{service.duration} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span>${service.price}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right - Summary */}
          <div className="w-[300px] border-l border-[#e5e7eb] bg-white p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[#d4a853]" />
              <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-[#1f2937]">
                Your Selection
              </h2>
            </div>

            {selectedDetails.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="font-['Work_Sans'] text-[#9ca3af] text-center">
                  Select services from the list
                </p>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-3 overflow-y-auto">
                  {selectedDetails.map(service => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between p-3 bg-[#f9fafb] rounded-xl"
                    >
                      <div>
                        <p className="font-['Work_Sans'] font-medium text-[#1f2937] text-sm">
                          {service.name}
                        </p>
                        <p className="font-['Work_Sans'] text-xs text-[#6b7280]">
                          {service.duration} min
                        </p>
                      </div>
                      <span className="font-['Plus_Jakarta_Sans'] font-semibold text-[#1f2937]">
                        ${service.price}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#e5e7eb] pt-4 mt-4">
                  <div className="flex justify-between mb-2 font-['Work_Sans'] text-sm">
                    <span className="text-[#6b7280]">Est. Duration</span>
                    <span className="text-[#1f2937] font-medium">{totalDuration} min</span>
                  </div>
                  <div className="flex justify-between font-['Work_Sans']">
                    <span className="text-[#6b7280]">Est. Total</span>
                    <span className="text-[#1f2937] font-bold text-lg">${totalPrice}</span>
                  </div>
                </div>
              </>
            )}

            <button
              onClick={handleContinue}
              disabled={selectedServices.length === 0}
              className={`
                mt-6 w-full py-4 rounded-xl font-['Plus_Jakarta_Sans'] font-semibold
                flex items-center justify-center gap-2 transition-all duration-300
                ${selectedServices.length > 0
                  ? 'bg-[#1a5f4a] text-white shadow-lg shadow-[#1a5f4a]/25 hover:bg-[#154d3c] active:scale-[0.98]'
                  : 'bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed'
                }
              `}
            >
              Choose Technician
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ServicesPage;
