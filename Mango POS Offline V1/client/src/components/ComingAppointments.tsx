import { useEffect, useState, useRef } from 'react';
import { useTickets } from '../hooks/useTicketsCompat';
import { Clock, ChevronLeft, ChevronRight, User, Calendar, Tag, Plus, Star, AlertCircle, CreditCard, MessageSquare, ChevronDown, ChevronUp, MoreVertical, FileText, DollarSign, Pencil } from 'lucide-react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
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
export function ComingAppointments({
  isMinimized = false,
  onToggleMinimize,
  isMobile = false,
  headerStyles
}: ComingAppointmentsProps) {
  const {
    comingAppointments = []
  } = useTickets();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTimeframe, setActiveTimeframe] = useState<'next1Hour' | 'next3Hours' | 'later'>('next1Hour');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({
    late: false,
    within1Hour: false,
    within3Hours: false,
    moreThan3Hours: false
  });
  const [activeAppointment, setActiveAppointment] = useState<any>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  // Updated color tokens for more premium Apple-like styling
  const colorTokens = {
    primary: '#34C759',
    bg: 'bg-[#F8FAFC]',
    headerBg: 'bg-[#F0FDFA]',
    text: 'text-[#0EA5A0]/80',
    border: 'ring-[#10B981]/30',
    iconBg: 'bg-[#10B981]/20',
    hoverBg: 'hover:bg-[#F9FAFB]',
    hoverText: 'hover:text-[#0EA5A0]',
    dropdownHover: 'hover:bg-[#F9FAFB]',
    checkColor: 'text-[#10B981]/80',
    // Apple-like status colors
    statusColors: {
      booked: '#007AFF',
      checkedIn: '#34C759',
      inService: '#FF9500',
      completed: '#8E8E93',
      cancelled: '#FF3B30',
      noShow: '#FF3B30',
      late: '#FF3B30'
    },
    // Frosted glass effect colors
    glass: {
      bg: 'bg-white/80 backdrop-blur-sm',
      border: 'border border-white/20',
      shadow: 'shadow-sm'
    }
  };
  // Toggle row expansion
  const toggleRowExpansion = (rowId: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
  };
  // Handle appointment click to show action menu
  const handleAppointmentClick = (appointment: any, event: React.MouseEvent) => {
    event.stopPropagation();
    setActiveAppointment(appointment);
    setShowActionMenu(true);
  };
  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setShowActionMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);
  // Group appointments by time buckets based on active timeframe
  // Filter out checked-in clients
  const groupAppointmentsByTimeBuckets = () => {
    const now = currentTime.getTime();
    const buckets = {
      late: [] as any[],
      within1Hour: [] as any[],
      within3Hours: [] as any[],
      moreThan3Hours: [] as any[]
    };
    // Filter out checked-in clients first
    const filteredAppointments = comingAppointments.filter(appointment => appointment.status?.toLowerCase() !== 'checked-in' && appointment.status?.toLowerCase() !== 'in-service');
    filteredAppointments.forEach(appointment => {
      const appointmentTime = new Date(appointment.appointmentTime).getTime();
      const minutesDiff = Math.floor((appointmentTime - now) / (1000 * 60));
      // First check if appointment is late, regardless of active timeframe
      if (minutesDiff < 0) {
        buckets['late'].push({
          ...appointment,
          minutesUntil: minutesDiff
        });
        return;
      }
      // Filter appointments based on active timeframe
      const isInTimeframe = activeTimeframe === 'next1Hour' && minutesDiff <= 60 || activeTimeframe === 'next3Hours' && minutesDiff <= 180 || activeTimeframe === 'later' && minutesDiff > 0; // 'later' shows all future appointments
      if (isInTimeframe) {
        if (minutesDiff <= 60) {
          buckets['within1Hour'].push({
            ...appointment,
            minutesUntil: minutesDiff
          });
        } else if (minutesDiff <= 180) {
          buckets['within3Hours'].push({
            ...appointment,
            minutesUntil: minutesDiff
          });
        } else {
          buckets['moreThan3Hours'].push({
            ...appointment,
            minutesUntil: minutesDiff
          });
        }
      }
    });
    // Sort by time within each bucket
    Object.keys(buckets).forEach(key => {
      buckets[key as keyof typeof buckets].sort((a, b) => a.minutesUntil - b.minutesUntil);
    });
    return buckets;
  };
  // Check if an appointment is late
  const isAppointmentLate = (appointment: any): boolean => {
    const now = currentTime.getTime();
    const appointmentTime = new Date(appointment.appointmentTime).getTime();
    return appointmentTime < now;
  };
  // Format minutes until appointment
  const formatMinutesUntil = (minutes: number): string => {
    if (minutes < 0) {
      return `${Math.abs(minutes)}m late`;
    }
    if (minutes < 60) {
      return `in ${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `in ${hours}h`;
    }
    return `in ${hours}h ${remainingMinutes}m`;
  };
  // Get status color based on appointment status
  const getStatusColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'booked':
        return colorTokens.statusColors.booked;
      case 'checked-in':
        return colorTokens.statusColors.checkedIn;
      case 'in-service':
        return colorTokens.statusColors.inService;
      case 'completed':
        return colorTokens.statusColors.completed;
      case 'cancelled':
        return colorTokens.statusColors.cancelled;
      case 'no-show':
        return colorTokens.statusColors.noShow;
      default:
        return colorTokens.statusColors.booked;
    }
  };
  // Get bucket label
  const getBucketLabel = (bucketId: string): string => {
    switch (bucketId) {
      case 'late':
        return 'Late';
      case 'within1Hour':
        return 'Within 1 Hour';
      case 'within3Hours':
        return 'Within 3 Hours';
      case 'moreThan3Hours':
        return 'More than 3 Hours';
      default:
        return '';
    }
  };
  // Get count of VIP appointments in a bucket
  const getVipCount = (bucketAppointments: any[]): number => {
    return bucketAppointments.filter(appt => appt.isVip).length;
  };
  const appointmentBuckets = groupAppointmentsByTimeBuckets();
  // Render minimized view - updated with Apple-like design
  if (isMinimized) {
    return <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out">
        {/* Minimized vertical sidebar - clean and functional */}
        <div className="h-full flex flex-col items-center py-2 relative">
          {/* Header area with Add button */}
          <div className="w-full px-2 pb-2 flex flex-col items-center border-b border-gray-100">
            {/* Add button - clean style */}
            <Tippy content="Add appointment">
              <button className="w-full p-1.5 rounded-md border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors mb-2" aria-label="Add appointment">
                <Plus size={14} className="text-gray-600 mx-auto" />
              </button>
            </Tippy>
            {/* Icon */}
            <div className="text-gray-400 mb-1">
              <Clock size={14} />
            </div>
            {/* Label */}
            <div className="text-[10px] text-gray-500 font-medium">
              Coming
            </div>
          </div>
          {/* Time slots with counts - showing hours starting 1 hour before current time */}
          <div className="flex-1 flex flex-col items-center space-y-3 py-3 px-1 overflow-auto max-h-[60vh] no-scrollbar" ref={el => {
          // Auto-scroll to current hour when component mounts
          if (el) {
            const currentHourEl = el.querySelector('.current-hour');
            if (currentHourEl) {
              // Use setTimeout to ensure DOM is fully rendered
              setTimeout(() => {
                currentHourEl.scrollIntoView({
                  behavior: 'auto',
                  block: 'center'
                });
              }, 100);
            }
          }
        }}>
            {(() => {
            // Get current hour and the hour before it
            const currentHour = currentTime.getHours();
            const startHour = currentHour - 1;
            // Create an array of 12 consecutive hours starting from 1 hour before current time
            return Array.from({
              length: 12
            }, (_, i) => {
              // Calculate the hour, handling wraparound for 24-hour format
              const hour = (startHour + i + 24) % 24;
              return hour;
            }).map(hour => {
              const isCurrentHour = currentTime.getHours() === hour;
              const hourAppointments = comingAppointments.filter(appt => new Date(appt.appointmentTime).getHours() === hour);
              const hasLate = hourAppointments.some(appt => isAppointmentLate(appt));
              const count = hourAppointments.length;
              return <div key={hour} className={`flex flex-col items-center cursor-pointer transition-colors w-full py-2 ${isCurrentHour ? 'current-hour bg-gray-50' : hasLate ? 'bg-red-50' : 'hover:bg-gray-50'}`} onClick={onToggleMinimize}>
                    {/* Hour label - compact */}
                    <div className="text-[10px] text-gray-500 mb-1">
                      {hour === 0 ? '12A' : hour === 12 ? '12P' : hour < 12 ? `${hour}A` : `${hour - 12}P`}
                    </div>
                    {/* Count - BIG and prominent */}
                    <div className={`text-base font-semibold ${
                      isCurrentHour ? 'text-gray-900' : 
                      hasLate ? 'text-red-600' : 
                      count > 0 ? 'text-gray-700' : 'text-gray-300'
                    }`}>
                      {count}
                    </div>
                  </div>;
            });
          })()}
          </div>
          {/* Bottom section with expand button */}
          <div className="w-full px-2 pt-2 mt-auto border-t border-gray-100">
            <Tippy content="Expand section">
              <button className="w-full p-1 rounded hover:bg-gray-50 transition-colors flex items-center justify-center" onClick={onToggleMinimize} aria-expanded="false" aria-controls="coming-appointments-content">
                <ChevronLeft size={14} className="text-gray-400" />
              </button>
            </Tippy>
          </div>
        </div>
      </div>;
  }
  return <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden h-full transition-all duration-300 ease-in-out">
      {/* Section header - clean and simple */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200 sticky top-0 z-10 h-[40px]">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-gray-400" />
          <span className="text-sm text-gray-600">Coming Appt</span>
          <span className="text-xs text-gray-400">({comingAppointments.filter(appt => appt.status?.toLowerCase() !== 'checked-in' && appt.status?.toLowerCase() !== 'in-service').length})</span>
        </div>
        <div className="flex items-center gap-1">
          {/* Add Appointment button - clean style */}
          <Tippy content="Add appointment">
            <button className="p-1.5 rounded-md border border-gray-200 hover:bg-white hover:border-gray-300 transition-colors">
              <Plus size={14} className="text-gray-600" />
            </button>
          </Tippy>
          <Tippy content="Minimize section">
            <button className="p-1.5 rounded-md hover:bg-gray-100 transition-colors" onClick={onToggleMinimize} aria-expanded="true" aria-controls="coming-appointments-content">
              <ChevronRight size={14} className="text-gray-400" />
            </button>
          </Tippy>
        </div>
      </div>
      {/* Description header */}

      {/* Timeframe tabs - simple and clean */}
      <div className="flex border-b border-gray-200 bg-white">
        <button className={`flex-1 py-2 text-xs font-medium transition-colors ${activeTimeframe === 'next1Hour' ? 'text-gray-900 border-b-2 border-gray-400' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTimeframe('next1Hour')}>
          Next 1 Hour
        </button>
        <button className={`flex-1 py-2 text-xs font-medium transition-colors ${activeTimeframe === 'next3Hours' ? 'text-gray-900 border-b-2 border-gray-400' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTimeframe('next3Hours')}>
          Next 3 Hours
        </button>
        <button className={`flex-1 py-2 text-xs font-medium transition-colors ${activeTimeframe === 'later' ? 'text-gray-900 border-b-2 border-gray-400' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTimeframe('later')}>
          Later
        </button>
      </div>
      {/* Appointments content - with refined styling */}
      <div id="coming-appointments-content" className="flex-1 overflow-auto px-4 py-3">
        {Object.keys(appointmentBuckets).some(key => appointmentBuckets[key as keyof typeof appointmentBuckets].length > 0) ? <div className="space-y-4">
            {/* Late appointments - always shown at the top */}
            {appointmentBuckets['late'].length > 0 && <div className="rounded-lg overflow-hidden border border-l-2 border-l-red-500 border-gray-200 bg-white">
                {/* Bucket header - clean */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => toggleRowExpansion('late')}>
                  <span className="text-xs font-medium text-gray-700">Late</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {appointmentBuckets['late'].length} • {getVipCount(appointmentBuckets['late']) > 0 && `${getVipCount(appointmentBuckets['late'])} VIP`}
                    </span>
                    {expandedRows['late'] ? <ChevronUp size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
                  </div>
                </div>
                {/* Collapsed view - simple dots */}
                {!expandedRows['late'] && appointmentBuckets['late'].length > 0}
                {/* Expanded view - simplified appointment list */}
                {expandedRows['late'] && <div className="divide-y divide-gray-100">
                    {appointmentBuckets['late'].map((appointment, index) => {
              const appointmentTime = new Date(appointment.appointmentTime);
              const technicianFirstName = appointment.technician ? appointment.technician.split(' ')[0].toUpperCase() : '';
              return <div key={appointment.id || index} className="group px-3 py-2 hover:bg-gray-50 transition-colors cursor-pointer relative" onClick={e => handleAppointmentClick(appointment, e)}>
                          {/* Single action button - hover only */}
                          <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded transition-opacity" onClick={e => {
                      e.stopPropagation();
                      console.log('More clicked for', appointment.clientName);
                    }}>
                            <MoreVertical size={12} className="text-gray-400" />
                          </button>
                          {/* Time - smaller, quieter */}
                          <div className="text-xs text-gray-500 mb-0.5">
                            {appointmentTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} • Late {Math.abs(appointment.minutesUntil)}m
                          </div>
                          {/* Name - compact */}
                          <div className="text-sm text-gray-900 mb-0.5 flex items-center gap-1">
                            {appointment.clientName?.split(' ')[0] || 'Guest'}
                            {appointment.isVip && <Star size={10} className="text-yellow-500" />}
                          </div>
                          {/* Service + Staff */}
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span className="truncate max-w-[150px]">{appointment.service} • {appointment.duration || '45m'}</span>
                            {appointment.technician && <span className="text-xs px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: appointment.techColor || '#9CA3AF' }}>
                                {technicianFirstName}
                              </span>}
                          </div>
                        </div>;
            })}
                  </div>}
              </div>}
            {/* Within 1 Hour */}
            {appointmentBuckets['within1Hour'].length > 0 && <div className="rounded-lg overflow-hidden border border-gray-200 bg-white">
                {/* Bucket header - clean */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => toggleRowExpansion('within1Hour')}>
                  <span className="text-xs font-medium text-gray-700">Within 1 Hour</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {appointmentBuckets['within1Hour'].length} • {getVipCount(appointmentBuckets['within1Hour']) > 0 && `${getVipCount(appointmentBuckets['within1Hour'])} VIP`}
                    </span>
                    {expandedRows['within1Hour'] ? <ChevronUp size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
                  </div>
                </div>
                {/* Collapsed view - simple dots */}
                {!expandedRows['within1Hour'] && appointmentBuckets['within1Hour'].length > 0}
                {/* Expanded view - simplified appointment list */}
                {expandedRows['within1Hour'] && <div className="divide-y divide-gray-100">
                    {appointmentBuckets['within1Hour'].map((appointment, index) => {
              const appointmentTime = new Date(appointment.appointmentTime);
              const technicianFirstName = appointment.technician ? appointment.technician.split(' ')[0].toUpperCase() : '';
              return <div key={appointment.id || index} className="group px-3 py-2 hover:bg-gray-50 transition-colors cursor-pointer relative" onClick={e => handleAppointmentClick(appointment, e)}>
                            {/* Single action button - hover only */}
                            <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded transition-opacity" onClick={e => {
                      e.stopPropagation();
                      console.log('More clicked for', appointment.clientName);
                    }}>
                              <MoreVertical size={12} className="text-gray-400" />
                            </button>
                            {/* Time - smaller, quieter */}
                            <div className="text-xs text-gray-500 mb-0.5">
                              {appointmentTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} • in {appointment.minutesUntil}m
                            </div>
                            {/* Name - compact */}
                            <div className="text-sm text-gray-900 mb-0.5 flex items-center gap-1">
                              {appointment.clientName?.split(' ')[0] || 'Guest'}
                              {appointment.isVip && <Star size={10} className="text-yellow-500" />}
                            </div>
                            {/* Service + Staff */}
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span className="truncate max-w-[150px]">{appointment.service} • {appointment.duration || '45m'}</span>
                              {appointment.technician && <span className="text-xs px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: appointment.techColor || '#9CA3AF' }}>
                                  {technicianFirstName}
                                </span>}
                            </div>
                          </div>;
            })}
                  </div>}
              </div>}
            {/* Within 3 Hours */}
            {appointmentBuckets['within3Hours'].length > 0 && <div className="rounded-lg overflow-hidden border border-gray-200 bg-white">
                {/* Bucket header - clean */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => toggleRowExpansion('within3Hours')}>
                  <span className="text-xs font-medium text-gray-700">Within 3 Hours</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {appointmentBuckets['within3Hours'].length} • {getVipCount(appointmentBuckets['within3Hours']) > 0 && `${getVipCount(appointmentBuckets['within3Hours'])} VIP`}
                    </span>
                    {expandedRows['within3Hours'] ? <ChevronUp size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
                  </div>
                </div>
                {/* Collapsed view - simple dots */}
                {!expandedRows['within3Hours'] && appointmentBuckets['within3Hours'].length > 0}
                {/* Expanded view - simplified appointment list */}
                {expandedRows['within3Hours'] && <div className="divide-y divide-gray-100">
                    {appointmentBuckets['within3Hours'].map((appointment, index) => {
              const appointmentTime = new Date(appointment.appointmentTime);
              const technicianFirstName = appointment.technician ? appointment.technician.split(' ')[0].toUpperCase() : '';
              return <div key={appointment.id || index} className="group px-3 py-2 hover:bg-gray-50 transition-colors cursor-pointer relative" onClick={e => handleAppointmentClick(appointment, e)}>
                            {/* Single action button - hover only */}
                            <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded transition-opacity" onClick={e => {
                      e.stopPropagation();
                      console.log('More clicked for', appointment.clientName);
                    }}>
                              <MoreVertical size={12} className="text-gray-400" />
                            </button>
                            {/* Time - smaller, quieter */}
                            <div className="text-xs text-gray-500 mb-0.5">
                              {appointmentTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} • {formatMinutesUntil(appointment.minutesUntil)}
                            </div>
                            {/* Name - compact */}
                            <div className="text-sm text-gray-900 mb-0.5 flex items-center gap-1">
                              {appointment.clientName?.split(' ')[0] || 'Guest'}
                              {appointment.isVip && <Star size={10} className="text-yellow-500" />}
                            </div>
                            {/* Service + Staff */}
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span className="truncate max-w-[150px]">{appointment.service} • {appointment.duration || '45m'}</span>
                              {appointment.technician && <span className="text-xs px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: appointment.techColor || '#9CA3AF' }}>
                                  {technicianFirstName}
                                </span>}
                            </div>
                          </div>;
            })}
                  </div>}
              </div>}
            {/* More than 3 Hours */}
            {appointmentBuckets['moreThan3Hours'].length > 0 && <div className="rounded-xl overflow-hidden border border-gray-200/50 bg-white/80 backdrop-blur-sm">
                {/* Bucket header with refined styling - simplified */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/50 cursor-pointer bg-[#F9F9FB] rounded-t-xl" onClick={() => toggleRowExpansion('moreThan3Hours')} style={{
            transition: 'all 0.15s ease'
          }}>
                  <div className="flex items-center">
                    <h3 className="text-sm font-semibold text-[#1C1C1E]">
                      Later Today
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Simplified counts */}
                    <div className="text-xs text-gray-600">
                      {appointmentBuckets['moreThan3Hours'].length} Appts
                      {getVipCount(appointmentBuckets['moreThan3Hours']) > 0 && ` • ${getVipCount(appointmentBuckets['moreThan3Hours'])} VIP`}
                    </div>
                    {/* Expand/collapse indicator */}
                    <div>
                      {expandedRows['moreThan3Hours'] ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                    </div>
                  </div>
                </div>
                {/* Collapsed view - simple dots */}
                {!expandedRows['moreThan3Hours'] && appointmentBuckets['moreThan3Hours'].length > 0}
                {/* Expanded view - simplified appointment list */}
                {expandedRows['moreThan3Hours'] && <div className="divide-y divide-[#E5E5EA]">
                    {appointmentBuckets['moreThan3Hours'].map((appointment, index) => {
              const appointmentTime = new Date(appointment.appointmentTime);
              // Extract first name from technician
              const technicianFirstName = appointment.technician ? appointment.technician.split(' ')[0].toUpperCase() : '';
              return <div key={appointment.id || index} className="px-4 py-[10px] bg-white/80 backdrop-blur-sm hover:bg-white/50 transition-all duration-150 cursor-pointer relative" onClick={e => handleAppointmentClick(appointment, e)} onMouseEnter={() => handleAppointmentMouseEnter(appointment)} onMouseLeave={handleAppointmentMouseLeave}>
                            {/* Action icons in top right */}
                            <div className="absolute top-2 right-1.5 flex space-x-0.5 z-10">
                              <Tippy content="Add/View Notes">
                                <button className="p-0.5 text-[#8E8E93]/70 hover:text-[#8E8E93] hover:bg-[#F2F2F7]/60 rounded-full transition-colors" onClick={e => {
                      e.stopPropagation();
                      console.log('Notes clicked for', appointment.clientName);
                    }}>
                                  <FileText size={14} strokeWidth={1.5} />
                                </button>
                              </Tippy>
                              <Tippy content="Deposit Info">
                                <button className="p-0.5 text-[#8E8E93]/70 hover:text-[#8E8E93] hover:bg-[#F2F2F7]/60 rounded-full transition-colors" onClick={e => {
                      e.stopPropagation();
                      console.log('Deposit clicked for', appointment.clientName);
                    }}>
                                  <CreditCard size={14} strokeWidth={1.5} />
                                </button>
                              </Tippy>
                              <Tippy content="Edit Appointment">
                                <button className="p-0.5 text-[#8E8E93]/70 hover:text-[#8E8E93] hover:bg-[#F2F2F7]/60 rounded-full transition-colors" onClick={e => {
                      e.stopPropagation();
                      console.log('Edit clicked for', appointment.clientName);
                    }}>
                                  <Pencil size={14} strokeWidth={1.5} />
                                </button>
                              </Tippy>
                            </div>
                            <div className="flex items-center mb-1">
                              {/* Time */}
                              <div className="mr-3">
                                <div className="text-sm font-semibold">
                                  {appointmentTime.toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                                </div>
                                <div className="text-xs text-[#8E8E93]">
                                  {formatMinutesUntil(appointment.minutesUntil)}
                                </div>
                              </div>
                              {/* Client name with VIP indicator */}
                              <div className="text-sm font-medium text-[#1C1C1E] flex items-center">
                                {appointment.clientName?.split(' ')[0] || 'Guest'}
                                {appointment.isVip && <Star size={12} className="ml-1 text-[#FF9500]" />}
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-[#8E8E93] mt-1">
                              <div className="flex items-center">
                                {/* Service and duration */}
                                <span className="truncate max-w-[150px]">
                                  {appointment.service}
                                </span>
                                <span className="mx-1">•</span>
                                <span>{appointment.duration || '45m'}</span>
                              </div>
                              {/* Staff name badge */}
                              {appointment.technician && <div className="px-2 py-0.5 rounded-full text-white text-xs font-semibold" style={{
                    backgroundColor: appointment.techColor || '#8E8E93'
                  }}>
                                  {technicianFirstName}
                                </div>}
                            </div>
                          </div>;
            })}
                  </div>}
              </div>}
          </div> : <div className="flex flex-col items-center justify-center h-full p-6">
            <div className="bg-[#F0FDFA] p-3 rounded-full mb-3">
              <Clock size={24} className="text-[#0EA5A0]/70" />
            </div>
            <h3 className="text-base font-medium text-gray-600 mb-1">
              No upcoming appointments
            </h3>
            <p className="text-xs text-gray-400 text-center max-w-xs">
              There are no more appointments scheduled for today.
            </p>
          </div>}
      </div>
      {/* Action Menu - appears when an appointment is clicked */}
      {showActionMenu && activeAppointment && <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center transition-all duration-200" onClick={() => setShowActionMenu(false)}>
          <div ref={actionMenuRef} className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all duration-300 ease-in-out animate-slide-up sm:animate-fade-in" style={{
        maxWidth: '380px'
      }} onClick={e => e.stopPropagation()}>
            {/* Modal header with client name, service and time */}
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-[#1C1C1E] mb-1">
                {activeAppointment.clientName?.split(' ')[0] || 'Guest'}
                {activeAppointment.isVip && <Star size={14} className="ml-1.5 text-[#FF9500] inline-block" />}
              </h3>
              <div className="text-[15px] text-gray-700 font-medium">
                {/* Truncate service name if too long */}
                {activeAppointment.service?.length > 25 ? `${activeAppointment.service.substring(0, 25)}...` : activeAppointment.service}{' '}
                •{' '}
                {new Date(activeAppointment.appointmentTime).toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit'
            })}
                {activeAppointment.duration && ` (${activeAppointment.duration})`}
              </div>
            </div>
            {/* Action buttons with icons */}
            <div className="py-2">
              {/* Check-In (Green, Primary) */}
              <button className="w-full text-left px-6 py-3.5 text-[15px] font-medium text-[#34C759] hover:bg-[#F2FFF5] transition-colors flex items-center">
                <div className="w-10 h-10 rounded-full bg-[#34C759]/10 flex items-center justify-center mr-3">
                  <User size={18} className="text-[#34C759]" />
                </div>
                Check-In
              </button>
              {/* Edit Appointment (Blue, Neutral) */}
              <button className="w-full text-left px-6 py-3.5 text-[15px] font-medium text-[#007AFF] hover:bg-[#F0F7FF] transition-colors flex items-center border-t border-gray-100">
                <div className="w-10 h-10 rounded-full bg-[#007AFF]/10 flex items-center justify-center mr-3">
                  <Calendar size={18} className="text-[#007AFF]" />
                </div>
                Edit Appointment
              </button>
              {/* Cancel/Reschedule (Red, Destructive) */}
              <button className="w-full text-left px-6 py-3.5 text-[15px] font-medium text-[#FF3B30] hover:bg-[#FFF5F5] transition-colors flex items-center border-t border-gray-100">
                <div className="w-10 h-10 rounded-full bg-[#FF3B30]/10 flex items-center justify-center mr-3">
                  <AlertCircle size={18} className="text-[#FF3B30]" />
                </div>
                Cancel / Reschedule
              </button>
              {/* Add Note (Gray, Neutral) */}
              <button className="w-full text-left px-6 py-3.5 text-[15px] font-medium text-[#8E8E93] hover:bg-gray-50 transition-colors flex items-center border-t border-gray-100">
                <div className="w-10 h-10 rounded-full bg-[#8E8E93]/10 flex items-center justify-center mr-3">
                  <MessageSquare size={18} className="text-[#8E8E93]" />
                </div>
                Add Note
              </button>
            </div>
            {/* Close button */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button className="w-full py-3 rounded-2xl bg-gray-200 text-[#1C1C1E] text-[15px] font-medium hover:bg-gray-300 transition-colors" onClick={() => setShowActionMenu(false)}>
                Close
              </button>
            </div>
          </div>
        </div>}
    </div>;
}