import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Sparkles, Clock, DollarSign, Search, Loader2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchServices } from '../store/slices';
import { addSelectedService, removeSelectedService } from '../store/slices/checkinSlice';
import { useAnalytics } from '../hooks/useAnalytics';
import { dataService } from '../services/dataService';
import { UpsellCard } from '../components/UpsellCard';
import type { Service, CheckInService } from '../types';

export function ServicesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const { trackServicesSelected } = useAnalytics();
  const usedSearchRef = useRef(false);
  const clientId = searchParams.get('clientId') || '';
  const phone = searchParams.get('phone') || '';
  const isNewClient = searchParams.get('new') === 'true';

  const { categories, isLoading, error } = useAppSelector((state) => state.services);
  const selectedServices = useAppSelector((state) => state.checkin.selectedServices);

  const [activeCategory, setActiveCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [upsellServices, setUpsellServices] = useState<Service[]>([]);

  useEffect(() => {
    dispatch(fetchServices());
  }, [dispatch]);

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  useEffect(() => {
    const fetchUpsells = async () => {
      if (selectedServices.length > 0) {
        const serviceIds = selectedServices.map((s) => s.serviceId);
        const upsells = await dataService.upsells.getForServices(serviceIds);
        setUpsellServices(upsells);
      } else {
        setUpsellServices([]);
      }
    };
    fetchUpsells();
  }, [selectedServices]);

  const currentCategory = categories.find((c) => c.id === activeCategory) || categories[0];

  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) {
      return currentCategory?.services || [];
    }

    const query = searchQuery.toLowerCase();
    const allServices: Service[] = categories.flatMap((cat) => cat.services);
    return allServices.filter((s) => s.name.toLowerCase().includes(query));
  }, [searchQuery, currentCategory, categories]);

  const toggleService = (service: Service) => {
    const isSelected = selectedServices.some((s) => s.serviceId === service.id);
    if (isSelected) {
      dispatch(removeSelectedService(service.id));
    } else {
      const checkInService: CheckInService = {
        serviceId: service.id,
        serviceName: service.name,
        price: service.price,
        durationMinutes: service.durationMinutes,
      };
      dispatch(addSelectedService(checkInService));
    }
  };

  const handleUpsellAdd = (service: Service) => {
    const checkInService: CheckInService = {
      serviceId: service.id,
      serviceName: service.name,
      price: service.price,
      durationMinutes: service.durationMinutes,
    };
    dispatch(addSelectedService(checkInService));
  };

  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

  const handleContinue = () => {
    trackServicesSelected({
      serviceCount: selectedServices.length,
      services: selectedServices.map((s) => ({
        serviceId: s.serviceId,
        serviceName: s.serviceName,
        price: s.price,
      })),
      totalPrice,
      totalDuration,
      usedSearch: usedSearchRef.current,
    });
    const servicesParam = selectedServices.map((s) => s.serviceId).join(',');
    navigate(
      `/technician?clientId=${clientId}&phone=${phone}&services=${servicesParam}${isNewClient ? '&new=true' : ''}`
    );
  };

  const handleBack = () => {
    if (isNewClient) {
      navigate(`/signup?phone=${phone}`);
    } else {
      navigate(`/verify?phone=${phone}`);
    }
  };

  if (isLoading && categories.length === 0) {
    return (
      <div className="kiosk-mode min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#1a5f4a] animate-spin mx-auto mb-4" />
          <p className="font-['Work_Sans'] text-[#6b7280]">Loading services...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="kiosk-mode min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <p className="font-['Work_Sans'] text-[#ef4444] mb-4">{error}</p>
          <button
            onClick={() => dispatch(fetchServices())}
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
            <h1 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#1f2937]">Select Your Services</h1>
            <p className="font-['Work_Sans'] text-sm text-[#6b7280]">Choose one or more services</p>
          </div>

          <div className="w-20" />
        </header>

        {/* Content Area */}
        <div className="flex-1 flex">
          {/* Left - Category Tabs */}
          <div className="w-[200px] border-r border-[#e5e7eb] bg-white p-4">
            {/* Search Box */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.length > 0) {
                      usedSearchRef.current = true;
                    }
                  }}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#e5e7eb] font-['Work_Sans'] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5f4a]/20 focus:border-[#1a5f4a]"
                />
              </div>
            </div>

            <div className="space-y-2">
              {categories.map((category) => {
                const isActive = category.id === activeCategory && !searchQuery;
                const hasSelection = category.services.some((s) =>
                  selectedServices.some((sel) => sel.serviceId === s.id)
                );

                return (
                  <button
                    key={category.id}
                    onClick={() => {
                      setActiveCategory(category.id);
                      setSearchQuery('');
                    }}
                    className={`
                      w-full px-4 py-3 rounded-xl text-left font-['Work_Sans'] transition-all
                      flex items-center gap-3
                      ${isActive ? 'bg-[#1a5f4a] text-white shadow-md' : 'text-[#4b5563] hover:bg-[#f3f4f6]'}
                    `}
                  >
                    <span className="font-medium">{category.name}</span>
                    {hasSelection && !isActive && <div className="ml-auto w-2 h-2 rounded-full bg-[#1a5f4a]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center - Services Grid */}
          <div className="flex-1 p-6 overflow-y-auto">
            {searchQuery && (
              <p className="font-['Work_Sans'] text-sm text-[#6b7280] mb-4">
                Showing results for "{searchQuery}" ({filteredServices.length} found)
              </p>
            )}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServices.map((service) => {
                const isSelected = selectedServices.some((s) => s.serviceId === service.id);

                return (
                  <button
                    key={service.id}
                    onClick={() => toggleService(service)}
                    className={`
                      p-5 rounded-2xl text-left transition-all duration-200 border-2 min-h-[120px]
                      ${
                        isSelected
                          ? 'bg-[#e8f5f0] border-[#1a5f4a] shadow-md'
                          : 'bg-white border-[#e5e7eb] hover:border-[#1a5f4a]/50 hover:shadow-sm'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-['Plus_Jakarta_Sans'] font-semibold text-[#1f2937] text-lg">
                        {service.name}
                      </h3>
                      <div
                        className={`
                        w-6 h-6 rounded-full flex items-center justify-center transition-all flex-shrink-0
                        ${isSelected ? 'bg-[#1a5f4a] text-white' : 'border-2 border-[#d1d5db]'}
                      `}
                      >
                        {isSelected && <Check className="w-4 h-4" />}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm font-['Work_Sans'] text-[#6b7280]">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{service.durationMinutes} min</span>
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

            {/* Upsell Cards Section */}
            {upsellServices.length > 0 && !searchQuery && (
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-[#d4a853]" />
                  <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-[#1f2937]">
                    Popular Add-Ons
                  </h3>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {upsellServices.map((service) => (
                    <UpsellCard
                      key={service.id}
                      service={service}
                      onAdd={handleUpsellAdd}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right - Summary */}
          <div className="w-[300px] border-l border-[#e5e7eb] bg-white p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[#d4a853]" />
              <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-[#1f2937]">Your Selection</h2>
            </div>

            {selectedServices.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="font-['Work_Sans'] text-[#9ca3af] text-center">Select services from the list</p>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-3 overflow-y-auto">
                  {selectedServices.map((service) => (
                    <div key={service.serviceId} className="flex items-center justify-between p-3 bg-[#f9fafb] rounded-xl">
                      <div>
                        <p className="font-['Work_Sans'] font-medium text-[#1f2937] text-sm">{service.serviceName}</p>
                        <p className="font-['Work_Sans'] text-xs text-[#6b7280]">{service.durationMinutes} min</p>
                      </div>
                      <span className="font-['Plus_Jakarta_Sans'] font-semibold text-[#1f2937]">${service.price}</span>
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
                ${
                  selectedServices.length > 0
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
