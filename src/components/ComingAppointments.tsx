import { useEffect, useState, useRef, memo } from 'react';
import { useTickets } from '../hooks/useTicketsCompat';
import { Clock, Star, ChevronDown, ChevronUp, MoreHorizontal } from 'lucide-react';
import { abbreviateService } from '../utils/serviceAbbreviations';
import { AppointmentPopover } from './AppointmentPopover';

interface ComingAppointmentsProps {
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  isMobile?: boolean;
  headerStyles?: {
    bg: string;
    accentColor: string;
    iconColor: string;
    activeIconColor: string;
    titleColor: string;
    borderColor: string;
    counterBg: string;
    counterText: string;
  };
}

interface GroupedAppointments {
  critical: any[];  // Late (< 0 min)
  immediate: any[]; // 0-30 min
  soon: any[];      // 30min-2hr
  later: any[];     // 2hr+
}

export const ComingAppointments = memo(function ComingAppointments({
  isMinimized = false,
  onToggleMinimize,
  isMobile = false,
  headerStyles
}: ComingAppointmentsProps) {
  const { comingAppointments = [] } = useTickets();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lateExpanded, setLateExpanded] = useState(false);
  const [laterExpanded, setLaterExpanded] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const nextAppointmentRef = useRef<HTMLDivElement>(null);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll to next appointment when time changes
  useEffect(() => {
    if (scrollContainerRef.current && nextAppointmentRef.current) {
      nextAppointmentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [currentTime, comingAppointments]);

  // Auto-group appointments by urgency
  const groupByUrgency = (): GroupedAppointments => {
    const now = currentTime.getTime();
    const groups: GroupedAppointments = {
      critical: [],
      immediate: [],
      soon: [],
      later: []
    };

    // Filter out checked-in/in-service appointments
    const filtered = comingAppointments.filter(
      appt => appt.status?.toLowerCase() !== 'checked-in' &&
              appt.status?.toLowerCase() !== 'in-service'
    );

    filtered.forEach(appointment => {
      const appointmentTime = new Date(appointment.appointmentTime).getTime();
      const minutesDiff = Math.floor((appointmentTime - now) / (1000 * 60));

      const apptWithTime = { ...appointment, minutesUntil: minutesDiff };

      if (minutesDiff < 0) {
        groups.critical.push(apptWithTime);
      } else if (minutesDiff < 30) {
        groups.immediate.push(apptWithTime);
      } else if (minutesDiff < 120) {
        groups.soon.push(apptWithTime);
      } else {
        groups.later.push(apptWithTime);
      }
    });

    // Sort by time within each group
    Object.keys(groups).forEach(key => {
      groups[key as keyof GroupedAppointments].sort((a, b) => a.minutesUntil - b.minutesUntil);
    });

    return groups;
  };

  const grouped = groupByUrgency();
  const totalCount = grouped.critical.length + grouped.immediate.length + grouped.soon.length + grouped.later.length;
  const lateCount = grouped.critical.length;
  const laterCount = grouped.later.length;

  // Handle card click
  const handleCardClick = (appointment: any) => {
    setSelectedAppointment(appointment);
  };

  // Popover action handlers
  const handleCheckIn = (appointment: any) => {
    console.log('Check in:', appointment);
    // TODO: Implement check-in logic
  };

  const handleEdit = (appointment: any) => {
    console.log('Edit:', appointment);
    // TODO: Implement edit logic
  };

  const handleCancel = (appointment: any) => {
    console.log('Cancel:', appointment);
    // TODO: Implement cancel logic
  };

  const handleAddNote = (appointment: any) => {
    console.log('Add note:', appointment);
    // TODO: Implement add note logic
  };

  // Get card style based on time proximity
  const getCardStyle = (minutesUntil: number) => {
    if (minutesUntil < 0) {
      return 'border-l-2 border-red-500 bg-red-50/30';
    } else if (minutesUntil < 15) {
      return 'border-l-2 border-orange-400 bg-orange-50/20';
    } else if (minutesUntil < 30) {
      return 'border-l-2 border-blue-400/40';
    }
    return '';
  };

  // Render ultra-compact 2-row card
  const AppointmentCard = ({
    appointment,
    variant = 'default',
    isNextAppointment = false
  }: {
    appointment: any;
    variant?: 'late' | 'default';
    isNextAppointment?: boolean;
  }) => {
    const appointmentTime = new Date(appointment.appointmentTime);
    const firstName = appointment.clientName?.split(' ')[0] || 'Guest';
    const staffFirstName = appointment.technician ? appointment.technician.split(' ')[0].toUpperCase() : '';
    const serviceAbbrev = abbreviateService(appointment.service);

    return (
      <div
        ref={isNextAppointment ? nextAppointmentRef : null}
        className={`px-2 py-1.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${getCardStyle(appointment.minutesUntil)}`}
        onClick={() => handleCardClick(appointment)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick(appointment);
          }
        }}
      >
        {/* Row 1: Time + Client + VIP */}
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] font-semibold text-gray-900">
            {appointmentTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </span>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-medium text-gray-700 truncate max-w-[100px]">
              {firstName}
            </span>
            {appointment.isVip && <Star size={8} className="text-yellow-500 flex-shrink-0" fill="currentColor" />}
          </div>
        </div>

        {/* Row 2: Service + Staff */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-500 truncate flex-1 mr-2">
            {serviceAbbrev}
          </span>
          {staffFirstName && (
            <span className="text-[10px] font-semibold text-gray-600 uppercase flex-shrink-0">
              {staffFirstName}
            </span>
          )}
        </div>
      </div>
    );
  };

  // Main view (both minimized and expanded)
  return (
    <div className="bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header - Always visible with metrics */}
      <div className="px-3 py-2 border-b border-gray-200 flex-shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
              <Clock size={14} strokeWidth={2.5} className="text-sky-600" />
            </div>
            <h2 className="text-[13px] font-medium text-slate-600">Coming</h2>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
              {totalCount}
            </span>
            {lateCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-semibold flex items-center gap-1">
                <span>Late</span>
                <span>{lateCount}</span>
              </span>
            )}
            {grouped.immediate.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-semibold flex items-center gap-1">
                <span>Next</span>
                <span>{grouped.immediate.length}</span>
              </span>
            )}
          </div>

          <button
            onClick={onToggleMinimize}
            className="h-7 w-7 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100/60 transition-all duration-200"
            aria-label={isMinimized ? "Expand section" : "Collapse section"}
          >
            {isMinimized ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {/* Content - only show when not minimized */}
      {!isMinimized && (
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        {totalCount === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-full px-4 py-8">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Clock size={20} className="text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 text-center">
              No upcoming appointments
            </p>
          </div>
        ) : (
          <div>
            {/* Critical (Late) - Collapsible, red accent */}
            {grouped.critical.length > 0 && (
              <div>
                <button
                  onClick={() => setLateExpanded(!lateExpanded)}
                  className="w-full px-2 py-1.5 flex items-center justify-between bg-red-50 border-b border-red-100 hover:bg-red-100/50 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span className="text-[10px] font-bold text-red-700 uppercase">
                      Late ({lateCount})
                    </span>
                  </div>
                  <ChevronDown size={10} className={`text-red-500 transition-transform ${lateExpanded ? 'rotate-180' : ''}`} />
                </button>

                {lateExpanded && grouped.critical.map((apt) => (
                  <div key={apt.id} className="border-l-2 border-red-500">
                    <AppointmentCard appointment={apt} variant="late" />
                  </div>
                ))}
              </div>
            )}

            {/* Immediate (0-30 min) - Always visible */}
            {grouped.immediate.map((apt, index) => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                isNextAppointment={index === 0}
              />
            ))}

            {/* Soon (30min-2hr) - Always visible if < 5, else show count */}
            {grouped.soon.length > 0 && (
              grouped.soon.length <= 5 ? (
                grouped.soon.map((apt) => (
                  <AppointmentCard key={apt.id} appointment={apt} />
                ))
              ) : (
                <>
                  {grouped.soon.slice(0, 3).map((apt) => (
                    <AppointmentCard key={apt.id} appointment={apt} />
                  ))}
                  <div className="px-2 py-2 text-[10px] text-gray-500 text-center bg-gray-50/50 border-b border-gray-100">
                    + {grouped.soon.length - 3} more soon
                  </div>
                </>
              )
            )}

            {/* Later (2hr+) - Collapsed by default */}
            {grouped.later.length > 0 && (
              <div>
                <button
                  onClick={() => setLaterExpanded(!laterExpanded)}
                  className="w-full px-2 py-2 flex items-center justify-between hover:bg-gray-50 border-b border-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <MoreHorizontal size={12} className="text-gray-400" />
                    <span className="text-[10px] text-gray-500">
                      {laterCount} more later
                    </span>
                  </div>
                  {laterExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                </button>

                {laterExpanded && grouped.later.map((apt) => (
                  <AppointmentCard key={apt.id} appointment={apt} />
                ))}
              </div>
            )}
          </div>
        )}
        </div>
      )}

      {/* Appointment Popover */}
      {selectedAppointment && (
        <AppointmentPopover
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onCheckIn={handleCheckIn}
          onEdit={handleEdit}
          onCancel={handleCancel}
          onAddNote={handleAddNote}
        />
      )}
    </div>
  );
});
