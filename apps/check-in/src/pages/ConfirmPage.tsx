import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Clock, DollarSign, User, Users, Scissors } from 'lucide-react';

// Mock service lookup - in real app, would come from context or API
const SERVICE_MAP: Record<string, { name: string; duration: number; price: number }> = {
  s1: { name: 'Classic Manicure', duration: 30, price: 25 },
  s2: { name: 'Gel Manicure', duration: 45, price: 40 },
  s3: { name: 'Classic Pedicure', duration: 45, price: 35 },
  s4: { name: 'Gel Pedicure', duration: 60, price: 55 },
  s5: { name: 'Mani + Pedi Combo', duration: 75, price: 60 },
  s6: { name: 'Eyebrow Wax', duration: 15, price: 15 },
  s7: { name: 'Lip Wax', duration: 10, price: 10 },
  s8: { name: 'Full Face Wax', duration: 30, price: 35 },
  s9: { name: 'Underarm Wax', duration: 15, price: 20 },
  s10: { name: 'Classic Lash Extensions', duration: 90, price: 120 },
  s11: { name: 'Volume Lash Extensions', duration: 120, price: 180 },
  s12: { name: 'Lash Lift & Tint', duration: 60, price: 75 },
  s13: { name: 'Express Facial', duration: 30, price: 45 },
  s14: { name: 'Deep Cleansing Facial', duration: 60, price: 85 },
  s15: { name: 'Anti-Aging Facial', duration: 75, price: 120 },
};

const TECHNICIAN_MAP: Record<string, string> = {
  t1: 'Lisa',
  t2: 'Mike',
  t3: 'Sarah',
  t4: 'Jenny',
  t5: 'Kevin',
  t6: 'Amy',
  any: 'Next Available',
};

export function ConfirmPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('clientId') || '';
  const phone = searchParams.get('phone') || '';
  const servicesParam = searchParams.get('services') || '';
  const technician = searchParams.get('technician') || 'any';
  const guests = parseInt(searchParams.get('guests') || '0', 10);
  const isNewClient = searchParams.get('new') === 'true';

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parse services
  const serviceIds = servicesParam.split(',').filter(Boolean);
  const selectedServices = serviceIds.map(id => ({ id, ...SERVICE_MAP[id] })).filter(s => s.name);

  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

  const technicianName = TECHNICIAN_MAP[technician] || 'Next Available';

  const handleConfirm = async () => {
    setIsSubmitting(true);

    // Simulate API call to submit check-in
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Navigate to success page
    navigate(`/success?clientId=${clientId}&technician=${technician}&guests=${guests}`);
  };

  const handleBack = () => {
    navigate(`/guests?clientId=${clientId}&phone=${phone}&services=${servicesParam}&technician=${technician}${isNewClient ? '&new=true' : ''}`);
  };

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

          {/* Cards */}
          <div className="space-y-4 flex-1 overflow-y-auto">
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
                {selectedServices.map(service => (
                  <div key={service.id} className="flex items-center justify-between py-2 border-b border-[#f3f4f6] last:border-0">
                    <div>
                      <p className="font-['Work_Sans'] font-medium text-[#1f2937]">{service.name}</p>
                      <p className="font-['Work_Sans'] text-sm text-[#6b7280]">{service.duration} min</p>
                    </div>
                    <span className="font-['Plus_Jakarta_Sans'] font-semibold text-[#1f2937]">
                      ${service.price}
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
            {guests > 0 && (
              <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#fdf8eb] rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-[#d4a853]" />
                  </div>
                  <div>
                    <h3 className="font-['Plus_Jakarta_Sans'] font-semibold text-[#1f2937]">
                      Guests
                    </h3>
                    <p className="font-['Work_Sans'] text-[#6b7280]">
                      {guests} additional {guests === 1 ? 'person' : 'people'}
                    </p>
                  </div>
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
            <div className="bg-white/10 rounded-2xl p-5 mb-8">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/20">
                <div className="flex items-center gap-2 text-white/80">
                  <Clock className="w-4 h-4" />
                  <span className="font-['Work_Sans'] text-sm">Est. Duration</span>
                </div>
                <span className="font-['Plus_Jakarta_Sans'] font-semibold text-white">
                  {totalDuration} min
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/80">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-['Work_Sans'] text-sm">Est. Total</span>
                </div>
                <span className="font-['Plus_Jakarta_Sans'] font-bold text-2xl text-white">
                  ${totalPrice}
                </span>
              </div>
            </div>

            {/* Confirm Button */}
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="w-full py-5 rounded-2xl bg-white text-[#1a5f4a] font-['Plus_Jakarta_Sans'] text-lg font-bold shadow-xl hover:bg-[#f9fafb] transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
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
