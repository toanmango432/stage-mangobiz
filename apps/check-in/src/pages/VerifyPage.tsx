import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Calendar, Sparkles, ArrowRight } from 'lucide-react';

// Mock client lookup - will be replaced with actual API call
async function lookupClient(phone: string): Promise<{
  found: boolean;
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    lastVisit?: string;
    loyaltyPoints: number;
    avatar?: string;
  };
  todayAppointment?: {
    id: string;
    time: string;
    services: string[];
    technician: string;
  };
}> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Mock: phone ending in 1234 = existing client with appointment
  // Phone ending in 5678 = existing client, no appointment
  // Otherwise = new client
  if (phone.endsWith('1234')) {
    return {
      found: true,
      client: {
        id: 'c1',
        firstName: 'Sarah',
        lastName: 'Johnson',
        phone,
        email: 'sarah@email.com',
        lastVisit: '2024-12-20',
        loyaltyPoints: 450,
      },
      todayAppointment: {
        id: 'apt1',
        time: '2:30 PM',
        services: ['Gel Manicure', 'Pedicure'],
        technician: 'Lisa',
      },
    };
  } else if (phone.endsWith('5678')) {
    return {
      found: true,
      client: {
        id: 'c2',
        firstName: 'Mike',
        lastName: 'Chen',
        phone,
        lastVisit: '2024-11-15',
        loyaltyPoints: 280,
      },
    };
  }

  return { found: false };
}

function formatPhone(digits: string): string {
  if (digits.length !== 10) return digits;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function VerifyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const phone = searchParams.get('phone') || '';

  const [status, setStatus] = useState<'loading' | 'found' | 'not-found' | 'appointment'>('loading');
  const [client, setClient] = useState<any>(null);
  const [appointment, setAppointment] = useState<any>(null);

  useEffect(() => {
    if (!phone || phone.length !== 10) {
      navigate('/');
      return;
    }

    lookupClient(phone).then(result => {
      if (result.found && result.client) {
        setClient(result.client);
        if (result.todayAppointment) {
          setAppointment(result.todayAppointment);
          setStatus('appointment');
        } else {
          setStatus('found');
        }
      } else {
        setStatus('not-found');
      }
    });
  }, [phone, navigate]);

  const handleNewClient = () => {
    navigate(`/signup?phone=${phone}`);
  };

  const handleWalkIn = () => {
    navigate(`/services?clientId=${client?.id}&phone=${phone}`);
  };

  const handleConfirmAppointment = () => {
    navigate(`/appointment?clientId=${client?.id}&appointmentId=${appointment?.id}`);
  };

  const handleNotMe = () => {
    navigate('/');
  };

  // Loading state
  if (status === 'loading') {
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

  // New client - not found
  if (status === 'not-found') {
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

  // Existing client with appointment
  if (status === 'appointment' && client && appointment) {
    return (
      <div className="kiosk-mode min-h-screen bg-[#faf9f7] flex items-center justify-center p-8">
        <div className="max-w-lg w-full">
          {/* Welcome Back */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-[#1a5f4a] to-[#154d3c] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-white text-3xl font-bold font-['Plus_Jakarta_Sans']">
                {client.firstName.charAt(0)}
              </span>
            </div>
            <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-[#1f2937] mb-1">
              Welcome back, {client.firstName}! 🎉
            </h1>
            <p className="font-['Work_Sans'] text-[#6b7280]">
              We found your appointment for today
            </p>
          </div>

          {/* Appointment Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-[#e5e7eb] p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#e8f5f0] rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#1a5f4a]" />
              </div>
              <div>
                <p className="font-['Plus_Jakarta_Sans'] font-semibold text-[#1f2937]">
                  Today at {appointment.time}
                </p>
                <p className="font-['Work_Sans'] text-sm text-[#6b7280]">
                  with {appointment.technician}
                </p>
              </div>
            </div>

            <div className="border-t border-[#e5e7eb] pt-4">
              <p className="font-['Work_Sans'] text-sm text-[#6b7280] mb-2">Services:</p>
              <div className="flex flex-wrap gap-2">
                {appointment.services.map((service: string, i: number) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-[#f3f4f6] rounded-lg font-['Work_Sans'] text-sm text-[#4b5563]"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Loyalty Points */}
          <div className="bg-gradient-to-r from-[#fdf8eb] to-[#fef9f3] rounded-2xl p-4 mb-6 border border-[#d4a853]/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-[#d4a853]" />
                <span className="font-['Work_Sans'] text-[#92742d]">Loyalty Points</span>
              </div>
              <span className="font-['Plus_Jakarta_Sans'] font-bold text-[#92742d]">
                {client.loyaltyPoints} pts
              </span>
            </div>
          </div>

          {/* Actions */}
          <button
            onClick={handleConfirmAppointment}
            className="w-full py-4 rounded-2xl bg-[#1a5f4a] text-white font-['Plus_Jakarta_Sans'] text-lg font-semibold shadow-lg shadow-[#1a5f4a]/25 hover:bg-[#154d3c] transition-all active:scale-[0.98] flex items-center justify-center gap-2 mb-4"
          >
            Confirm & Check In
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

  // Existing client, walk-in (no appointment)
  return (
    <div className="kiosk-mode min-h-screen bg-[#faf9f7] flex items-center justify-center p-8">
      <div className="max-w-lg w-full">
        {/* Welcome Back */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-[#1a5f4a] to-[#154d3c] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-3xl font-bold font-['Plus_Jakarta_Sans']">
              {client?.firstName?.charAt(0) || 'G'}
            </span>
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-[#1f2937] mb-1">
            Welcome back, {client?.firstName}! 👋
          </h1>
          <p className="font-['Work_Sans'] text-[#6b7280]">
            Great to see you again
          </p>
        </div>

        {/* Last Visit Info */}
        {client?.lastVisit && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-4 mb-4">
            <p className="font-['Work_Sans'] text-sm text-[#6b7280]">
              Last visit: <span className="text-[#1f2937] font-medium">{client.lastVisit}</span>
            </p>
          </div>
        )}

        {/* Loyalty Points */}
        <div className="bg-gradient-to-r from-[#fdf8eb] to-[#fef9f3] rounded-2xl p-4 mb-6 border border-[#d4a853]/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-[#d4a853]" />
              <span className="font-['Work_Sans'] text-[#92742d]">Loyalty Points</span>
            </div>
            <span className="font-['Plus_Jakarta_Sans'] font-bold text-[#92742d]">
              {client?.loyaltyPoints || 0} pts
            </span>
          </div>
        </div>

        {/* Actions */}
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
