import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, User, Scissors, DollarSign, Edit3, AlertCircle, Check } from 'lucide-react';

// Mock appointment data - will come from API
const MOCK_APPOINTMENT = {
  id: 'apt1',
  date: 'Today',
  time: '2:30 PM',
  services: [
    { id: 's1', name: 'Gel Manicure', duration: 45, price: 40 },
    { id: 's2', name: 'Classic Pedicure', duration: 45, price: 35 },
  ],
  technician: { id: 't1', name: 'Lisa', specialty: 'Nail Art Expert' },
  totalDuration: 90,
  totalPrice: 75,
};

// Salon policy for editing - will come from config
const EDIT_POLICY = {
  allowEditing: true, // false = "Please see front desk"
  allowServiceEdit: true,
  allowTechnicianEdit: true,
  allowTimeEdit: false, // Time changes usually need staff
};

export function AppointmentConfirmPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('clientId') || '';
  const appointmentId = searchParams.get('appointmentId') || '';

  const [isSubmitting, setIsSubmitting] = useState(false);

  // In real app, fetch appointment data
  const appointment = MOCK_APPOINTMENT;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Navigate to guest addition
    navigate(`/guests?clientId=${clientId}&appointmentId=${appointmentId}&services=${appointment.services.map(s => s.id).join(',')}&technician=${appointment.technician.id}`);
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleEditServices = () => {
    if (EDIT_POLICY.allowServiceEdit) {
      navigate(`/services?clientId=${clientId}&appointmentId=${appointmentId}&editing=true`);
    }
  };

  const handleEditTechnician = () => {
    if (EDIT_POLICY.allowTechnicianEdit) {
      const servicesParam = appointment.services.map(s => s.id).join(',');
      navigate(`/technician?clientId=${clientId}&appointmentId=${appointmentId}&services=${servicesParam}&editing=true`);
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
      <div className="relative z-10 min-h-screen flex flex-row">
        {/* LEFT - Appointment Details */}
        <div className="w-[55%] flex flex-col p-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-[#6b7280] hover:text-[#1a5f4a] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-['Work_Sans']">Back</span>
            </button>
          </div>

          <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#1f2937] mb-2">
            Your Appointment
          </h1>
          <p className="font-['Work_Sans'] text-[#6b7280] mb-8">
            Please confirm your appointment details
          </p>

          {/* Appointment Card */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm overflow-hidden flex-1">
            {/* Date/Time Header */}
            <div className="bg-gradient-to-r from-[#1a5f4a] to-[#2d7a5f] p-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="font-['Plus_Jakarta_Sans'] text-white/80 text-sm">Appointment</p>
                  <p className="font-['Plus_Jakarta_Sans'] text-white text-2xl font-bold">
                    {appointment.date} at {appointment.time}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Services Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Scissors className="w-5 h-5 text-[#1a5f4a]" />
                    <h3 className="font-['Plus_Jakarta_Sans'] font-semibold text-[#1f2937]">
                      Services
                    </h3>
                  </div>
                  {EDIT_POLICY.allowEditing && EDIT_POLICY.allowServiceEdit && (
                    <button
                      onClick={handleEditServices}
                      className="flex items-center gap-1 text-sm text-[#1a5f4a] hover:underline font-['Work_Sans']"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {appointment.services.map(service => (
                    <div key={service.id} className="flex items-center justify-between p-3 bg-[#f9fafb] rounded-xl">
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

              {/* Technician Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-[#1a5f4a]" />
                    <h3 className="font-['Plus_Jakarta_Sans'] font-semibold text-[#1f2937]">
                      Technician
                    </h3>
                  </div>
                  {EDIT_POLICY.allowEditing && EDIT_POLICY.allowTechnicianEdit && (
                    <button
                      onClick={handleEditTechnician}
                      className="flex items-center gap-1 text-sm text-[#1a5f4a] hover:underline font-['Work_Sans']"
                    >
                      <Edit3 className="w-4 h-4" />
                      Change
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-4 p-4 bg-[#f9fafb] rounded-xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#1a5f4a] to-[#154d3c] rounded-full flex items-center justify-center">
                    <span className="text-white text-lg font-bold font-['Plus_Jakarta_Sans']">
                      {appointment.technician.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-['Plus_Jakarta_Sans'] font-semibold text-[#1f2937]">
                      {appointment.technician.name}
                    </p>
                    <p className="font-['Work_Sans'] text-sm text-[#6b7280]">
                      {appointment.technician.specialty}
                    </p>
                  </div>
                </div>
              </div>

              {/* Time Edit Note */}
              {EDIT_POLICY.allowEditing && !EDIT_POLICY.allowTimeEdit && (
                <div className="flex items-start gap-3 p-4 bg-[#fef3c7] rounded-xl">
                  <AlertCircle className="w-5 h-5 text-[#d97706] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-['Work_Sans'] text-sm text-[#92400e]">
                      Need to change the time? Please see the front desk for assistance.
                    </p>
                  </div>
                </div>
              )}

              {/* No Editing Allowed */}
              {!EDIT_POLICY.allowEditing && (
                <div className="flex items-start gap-3 p-4 bg-[#f3f4f6] rounded-xl">
                  <AlertCircle className="w-5 h-5 text-[#6b7280] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-['Work_Sans'] text-sm text-[#4b5563]">
                      Need to make changes? Please see the front desk for assistance.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT - Confirmation Panel */}
        <div className="w-[45%] bg-gradient-to-br from-[#1a5f4a] to-[#154d3c] p-8 flex flex-col justify-center">
          <div className="max-w-sm mx-auto">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
              <Check className="w-10 h-10 text-white" />
            </div>

            <h2 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-white mb-2">
              Ready to Check In?
            </h2>
            <p className="font-['Work_Sans'] text-white/80 mb-8">
              Confirm your appointment and we'll have you all set!
            </p>

            {/* Summary */}
            <div className="bg-white/10 rounded-2xl p-5 mb-8">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/20">
                <div className="flex items-center gap-2 text-white/80">
                  <Clock className="w-4 h-4" />
                  <span className="font-['Work_Sans'] text-sm">Duration</span>
                </div>
                <span className="font-['Plus_Jakarta_Sans'] font-semibold text-white">
                  {appointment.totalDuration} min
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/80">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-['Work_Sans'] text-sm">Est. Total</span>
                </div>
                <span className="font-['Plus_Jakarta_Sans'] font-bold text-2xl text-white">
                  ${appointment.totalPrice}
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
                  Confirming...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Confirm & Check In
                </>
              )}
            </button>

            <p className="font-['Work_Sans'] text-sm text-white/60 text-center mt-4">
              You can add guests on the next screen
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppointmentConfirmPage;
