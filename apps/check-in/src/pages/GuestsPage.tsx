import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Users,
  User,
  X,
  Phone,
  Scissors,
  Check,
  Clock,
  DollarSign,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addGuest, removeGuest, updateGuest, setPartyPreference } from '../store/slices/checkinSlice';
import type { CheckInGuest, CheckInService, PartyPreference, ServiceCategory } from '../types';

const MAX_GUESTS = 6;

interface GuestFormData {
  name: string;
  phone: string;
}

interface GuestServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  guest: CheckInGuest;
  categories: ServiceCategory[];
  onSave: (services: CheckInService[], technicianPreference: string) => void;
}

function GuestServiceModal({ isOpen, onClose, guest, categories, onSave }: GuestServiceModalProps) {
  const [selectedServices, setSelectedServices] = useState<CheckInService[]>(guest.services);
  const [techPref, setTechPref] = useState<string>(guest.technicianPreference);

  if (!isOpen) return null;

  const toggleService = (service: { id: string; name: string; price: number; durationMinutes: number }) => {
    const exists = selectedServices.find(s => s.serviceId === service.id);
    if (exists) {
      setSelectedServices(selectedServices.filter(s => s.serviceId !== service.id));
    } else {
      setSelectedServices([
        ...selectedServices,
        {
          serviceId: service.id,
          serviceName: service.name,
          price: service.price,
          durationMinutes: service.durationMinutes,
        },
      ]);
    }
  };

  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#e5e7eb]">
          <h2 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#1f2937]">
            Services for {guest.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[#f3f4f6] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-[#6b7280]" />
          </button>
        </div>

        {/* Service List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {categories.map(category => (
            <div key={category.id}>
              <h3 className="font-['Work_Sans'] text-sm font-medium text-[#6b7280] mb-2">
                {category.name}
              </h3>
              <div className="space-y-2">
                {category.services.map(service => {
                  const isSelected = selectedServices.some(s => s.serviceId === service.id);
                  return (
                    <button
                      key={service.id}
                      onClick={() => toggleService(service)}
                      className={`
                        w-full p-4 rounded-xl text-left transition-all duration-200 border-2 flex items-center justify-between
                        ${isSelected
                          ? 'bg-[#e8f5f0] border-[#1a5f4a]'
                          : 'bg-white border-[#e5e7eb] hover:border-[#1a5f4a]/50'
                        }
                      `}
                    >
                      <div>
                        <p className="font-['Work_Sans'] font-medium text-[#1f2937]">
                          {service.name}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-[#6b7280]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {service.durationMinutes} min
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5" />
                            ${service.price}
                          </span>
                        </div>
                      </div>
                      <div className={`
                        w-6 h-6 rounded-full flex items-center justify-center transition-all
                        ${isSelected ? 'bg-[#1a5f4a] text-white' : 'border-2 border-[#d1d5db]'}
                      `}>
                        {isSelected && <Check className="w-4 h-4" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Technician Preference */}
          <div className="pt-4 border-t border-[#e5e7eb]">
            <h3 className="font-['Work_Sans'] text-sm font-medium text-[#6b7280] mb-3">
              Technician Preference
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => setTechPref('anyone')}
                className={`
                  flex-1 py-3 px-4 rounded-xl text-center transition-all border-2
                  ${techPref === 'anyone'
                    ? 'bg-[#e8f5f0] border-[#1a5f4a] text-[#1a5f4a]'
                    : 'bg-white border-[#e5e7eb] text-[#6b7280] hover:border-[#1a5f4a]/50'
                  }
                `}
              >
                <span className="font-['Work_Sans'] font-medium">Anyone</span>
              </button>
              <button
                onClick={() => setTechPref('same')}
                className={`
                  flex-1 py-3 px-4 rounded-xl text-center transition-all border-2
                  ${techPref === 'same'
                    ? 'bg-[#e8f5f0] border-[#1a5f4a] text-[#1a5f4a]'
                    : 'bg-white border-[#e5e7eb] text-[#6b7280] hover:border-[#1a5f4a]/50'
                  }
                `}
              >
                <span className="font-['Work_Sans'] font-medium">Same as Me</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#e5e7eb] bg-[#f9fafb]">
          {selectedServices.length > 0 && (
            <div className="flex justify-between mb-4 font-['Work_Sans'] text-sm">
              <span className="text-[#6b7280]">
                {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} • {totalDuration} min
              </span>
              <span className="font-semibold text-[#1f2937]">${totalPrice}</span>
            </div>
          )}
          <button
            onClick={() => onSave(selectedServices, techPref)}
            disabled={selectedServices.length === 0}
            className={`
              w-full py-4 rounded-xl font-['Plus_Jakarta_Sans'] font-semibold
              flex items-center justify-center gap-2 transition-all duration-300
              ${selectedServices.length > 0
                ? 'bg-[#1a5f4a] text-white shadow-lg shadow-[#1a5f4a]/25 hover:bg-[#154d3c] active:scale-[0.98]'
                : 'bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed'
              }
            `}
          >
            <Check className="w-5 h-5" />
            Save Services
          </button>
        </div>
      </div>
    </div>
  );
}

export function GuestsPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { guests, partyPreference, selectedServices: mainClientServices, currentClient } = useAppSelector((state) => state.checkin);
  const { categories } = useAppSelector((state) => state.services);

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<GuestFormData>({ name: '', phone: '' });
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);

  const canAddMore = guests.length < MAX_GUESTS;

  const handleAddGuest = () => {
    if (!formData.name.trim()) return;

    const newGuest: CheckInGuest = {
      id: `guest-${Date.now()}`,
      name: formData.name.trim(),
      clientId: undefined,
      services: [], // Start with no services, will add via modal
      technicianPreference: 'anyone',
    };

    dispatch(addGuest(newGuest));
    setFormData({ name: '', phone: '' });
    setShowAddForm(false);
    // Open service modal for the new guest
    setEditingGuestId(newGuest.id);
  };

  const handleRemoveGuest = (guestId: string) => {
    dispatch(removeGuest(guestId));
  };

  const handleSaveGuestServices = (guestId: string, services: CheckInService[], techPref: string) => {
    const guest = guests.find(g => g.id === guestId);
    if (guest) {
      dispatch(updateGuest({
        ...guest,
        services,
        technicianPreference: techPref === 'same' ? 'anyone' : techPref,
      }));
    }
    setEditingGuestId(null);
  };

  const handlePartyPreferenceChange = (pref: PartyPreference) => {
    dispatch(setPartyPreference(pref));
  };

  const handleContinue = () => {
    navigate('/confirm');
  };

  const handleBack = () => {
    navigate(-1);
  };

  const totalPartySize = 1 + guests.length;
  const totalServices = mainClientServices.length + guests.reduce((sum, g) => sum + g.services.length, 0);
  const totalPrice =
    mainClientServices.reduce((sum, s) => sum + s.price, 0) +
    guests.reduce((sum, g) => sum + g.services.reduce((s, svc) => s + svc.price, 0), 0);

  const editingGuest = guests.find(g => g.id === editingGuestId);

  // Check if we should redirect if no client selected
  if (!currentClient) {
    navigate('/');
    return null;
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
            className="flex items-center gap-2 text-[#6b7280] hover:text-[#1a5f4a] transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-['Work_Sans']">Back</span>
          </button>

          <div className="text-center">
            <h1 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#1f2937]">
              Bringing Anyone?
            </h1>
            <p className="font-['Work_Sans'] text-sm text-[#6b7280]">
              Add guests who are joining you today
            </p>
          </div>

          <button
            onClick={handleContinue}
            className="font-['Work_Sans'] text-[#1a5f4a] hover:text-[#154d3c] font-medium transition-colors"
          >
            Skip
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 flex flex-col md:flex-row p-6 gap-6 overflow-hidden">
          {/* Left - Guest List */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Main Client Card */}
            <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5 mb-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-[#1a5f4a] to-[#154d3c] rounded-full flex items-center justify-center shadow-md">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-['Plus_Jakarta_Sans'] font-semibold text-[#1f2937]">
                    {currentClient.firstName} {currentClient.lastName}
                  </h3>
                  <p className="font-['Work_Sans'] text-sm text-[#6b7280]">
                    {mainClientServices.length} service{mainClientServices.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-['Plus_Jakarta_Sans'] font-semibold text-[#1f2937]">
                    ${mainClientServices.reduce((sum, s) => sum + s.price, 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Guests List */}
            <div className="flex-1 overflow-y-auto space-y-3">
              {guests.map((guest, index) => (
                <div
                  key={guest.id}
                  className="bg-white rounded-2xl border border-[#e5e7eb] p-5 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#d4a853] to-[#c49a4a] rounded-full flex items-center justify-center shadow-md">
                      <span className="text-white font-['Plus_Jakarta_Sans'] font-bold text-lg">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-['Plus_Jakarta_Sans'] font-semibold text-[#1f2937] truncate">
                        {guest.name}
                      </h3>
                      {guest.services.length > 0 ? (
                        <p className="font-['Work_Sans'] text-sm text-[#6b7280]">
                          {guest.services.length} service{guest.services.length !== 1 ? 's' : ''} • ${guest.services.reduce((sum, s) => sum + s.price, 0)}
                        </p>
                      ) : (
                        <button
                          onClick={() => setEditingGuestId(guest.id)}
                          className="font-['Work_Sans'] text-sm text-[#1a5f4a] underline hover:text-[#154d3c]"
                        >
                          Add services
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingGuestId(guest.id)}
                        className="p-2 rounded-xl hover:bg-[#f3f4f6] text-[#6b7280] hover:text-[#1a5f4a] transition-colors"
                        aria-label={`Edit services for ${guest.name}`}
                      >
                        <Scissors className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleRemoveGuest(guest.id)}
                        className="p-2 rounded-xl hover:bg-red-50 text-[#6b7280] hover:text-red-500 transition-colors"
                        aria-label={`Remove ${guest.name}`}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Service chips */}
                  {guest.services.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {guest.services.map(service => (
                        <span
                          key={service.serviceId}
                          className="px-3 py-1 bg-[#f3f4f6] rounded-full text-xs font-['Work_Sans'] text-[#6b7280]"
                        >
                          {service.serviceName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Add Guest Form */}
              {showAddForm ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-[#1a5f4a] p-5">
                  <h4 className="font-['Plus_Jakarta_Sans'] font-semibold text-[#1f2937] mb-4">
                    New Guest
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="font-['Work_Sans'] text-sm text-[#6b7280] block mb-1">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Guest's name"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#e5e7eb] font-['Work_Sans'] focus:outline-none focus:ring-2 focus:ring-[#1a5f4a]/20 focus:border-[#1a5f4a]"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div>
                      <label className="font-['Work_Sans'] text-sm text-[#6b7280] block mb-1">
                        Phone <span className="text-[#9ca3af]">(optional)</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="(555) 555-5555"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#e5e7eb] font-['Work_Sans'] focus:outline-none focus:ring-2 focus:ring-[#1a5f4a]/20 focus:border-[#1a5f4a]"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowAddForm(false);
                          setFormData({ name: '', phone: '' });
                        }}
                        className="flex-1 py-3 rounded-xl border border-[#e5e7eb] font-['Work_Sans'] text-[#6b7280] hover:bg-[#f3f4f6] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddGuest}
                        disabled={!formData.name.trim()}
                        className={`
                          flex-1 py-3 rounded-xl font-['Plus_Jakarta_Sans'] font-semibold
                          flex items-center justify-center gap-2 transition-all
                          ${formData.name.trim()
                            ? 'bg-[#1a5f4a] text-white hover:bg-[#154d3c]'
                            : 'bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed'
                          }
                        `}
                      >
                        <Plus className="w-5 h-5" />
                        Add Guest
                      </button>
                    </div>
                  </div>
                </div>
              ) : canAddMore ? (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full p-5 rounded-2xl border-2 border-dashed border-[#e5e7eb] hover:border-[#1a5f4a]/50 transition-colors flex items-center justify-center gap-3 text-[#6b7280] hover:text-[#1a5f4a]"
                >
                  <Plus className="w-6 h-6" />
                  <span className="font-['Work_Sans'] font-medium">Add Guest</span>
                </button>
              ) : (
                <p className="text-center font-['Work_Sans'] text-sm text-[#9ca3af] py-4">
                  Maximum {MAX_GUESTS} guests per check-in
                </p>
              )}
            </div>
          </div>

          {/* Right - Summary Panel */}
          <div className="w-full md:w-[320px] bg-white rounded-2xl border border-[#e5e7eb] p-6 flex flex-col shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-[#d4a853]" />
              <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-[#1f2937]">
                Party Summary
              </h2>
            </div>

            {/* Party Size */}
            <div className="bg-[#f9fafb] rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-['Work_Sans'] text-[#6b7280]">Party Size</span>
                <span className="font-['Plus_Jakarta_Sans'] font-semibold text-[#1f2937]">
                  {totalPartySize} {totalPartySize === 1 ? 'person' : 'people'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-['Work_Sans'] text-[#6b7280]">Total Services</span>
                <span className="font-['Plus_Jakarta_Sans'] font-semibold text-[#1f2937]">
                  {totalServices}
                </span>
              </div>
            </div>

            {/* Party Preference */}
            {guests.length > 0 && (
              <div className="mb-6">
                <label className="font-['Work_Sans'] text-sm text-[#6b7280] block mb-3">
                  Service Order Preference
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() => handlePartyPreferenceChange('together')}
                    className={`
                      w-full p-4 rounded-xl text-left transition-all border-2 flex items-center gap-3
                      ${partyPreference === 'together'
                        ? 'bg-[#e8f5f0] border-[#1a5f4a]'
                        : 'bg-white border-[#e5e7eb] hover:border-[#1a5f4a]/50'
                      }
                    `}
                  >
                    <div className={`
                      w-5 h-5 rounded-full flex items-center justify-center
                      ${partyPreference === 'together' ? 'bg-[#1a5f4a] text-white' : 'border-2 border-[#d1d5db]'}
                    `}>
                      {partyPreference === 'together' && <Check className="w-3 h-3" />}
                    </div>
                    <div>
                      <p className="font-['Work_Sans'] font-medium text-[#1f2937]">Serve Together</p>
                      <p className="font-['Work_Sans'] text-xs text-[#6b7280]">Everyone at the same time</p>
                    </div>
                  </button>
                  <button
                    onClick={() => handlePartyPreferenceChange('sequence')}
                    className={`
                      w-full p-4 rounded-xl text-left transition-all border-2 flex items-center gap-3
                      ${partyPreference === 'sequence'
                        ? 'bg-[#e8f5f0] border-[#1a5f4a]'
                        : 'bg-white border-[#e5e7eb] hover:border-[#1a5f4a]/50'
                      }
                    `}
                  >
                    <div className={`
                      w-5 h-5 rounded-full flex items-center justify-center
                      ${partyPreference === 'sequence' ? 'bg-[#1a5f4a] text-white' : 'border-2 border-[#d1d5db]'}
                    `}>
                      {partyPreference === 'sequence' && <Check className="w-3 h-3" />}
                    </div>
                    <div>
                      <p className="font-['Work_Sans'] font-medium text-[#1f2937]">In Order</p>
                      <p className="font-['Work_Sans'] text-xs text-[#6b7280]">One after another</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Price */}
            <div className="mt-auto pt-4 border-t border-[#e5e7eb]">
              <div className="flex items-center justify-between mb-4">
                <span className="font-['Work_Sans'] text-[#6b7280]">Est. Total</span>
                <span className="font-['Plus_Jakarta_Sans'] font-bold text-xl text-[#1f2937]">
                  ${totalPrice}
                </span>
              </div>

              <button
                onClick={handleContinue}
                className="w-full py-4 rounded-xl bg-[#1a5f4a] text-white font-['Plus_Jakarta_Sans'] font-semibold shadow-lg shadow-[#1a5f4a]/25 hover:bg-[#154d3c] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Continue to Review
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Guest Service Modal */}
      {editingGuest && (
        <GuestServiceModal
          isOpen={!!editingGuestId}
          onClose={() => setEditingGuestId(null)}
          guest={editingGuest}
          categories={categories}
          onSave={(services, techPref) => handleSaveGuestServices(editingGuest.id, services, techPref)}
        />
      )}
    </div>
  );
}

export default GuestsPage;
