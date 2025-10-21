import React, { useEffect, useState, useRef } from 'react';
import { useTickets } from '../context/TicketContext';
import { Clock, ChevronLeft, ChevronRight, Maximize2, Minimize2, User, Calendar, Tag, Plus, Settings, Star, AlertCircle, CreditCard, MessageSquare, ChevronDown, ChevronUp, MoreHorizontal, FileText, DollarSign, Edit, Pencil } from 'lucide-react';
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
  // New state for appointment hover details
  const [hoveredAppointment, setHoveredAppointment] = useState<any>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
  // Handle mouse enter for appointment hover details
  const handleAppointmentMouseEnter = (appointment: any) => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // Set a small delay before showing the hover details
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredAppointment(appointment);
    }, 300);
  };
  // Handle mouse leave for appointment hover details
  const handleAppointmentMouseLeave = () => {
    // Clear the timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // Hide the hover details
    setHoveredAppointment(null);
  };
  // Render minimized view - updated with Apple-like design
  if (isMinimized) {
    return <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/80 flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out">
        {/* Minimized vertical sidebar with improved Apple-like design */}
        <div className="h-full flex flex-col items-center py-3 relative">
          {/* Header area with title and settings */}
          <div className="w-full px-2 pb-2 flex flex-col items-center border-b border-gray-100/80">
            <div className="flex items-center justify-between w-full mb-2">
              <Tippy content="Add appointment">
                <button className="p-1.5 rounded-md bg-[#10B981]/10 text-[#0EA5A0]/80 hover:bg-[#10B981]/20 transition-all duration-200 ring-1 ring-[#10B981]/20" aria-label="Add appointment">
                  <Plus size={14} className="opacity-80 hover:opacity-100" />
                </button>
              </Tippy>
              <Tippy content="Settings">
                <button className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-[#F0FDFA]/80 transition-all duration-200"></button>
              </Tippy>
            </div>
            {/* Top section with icon - Apple-like subtle styling */}
            <div className="bg-[#F0FDFA] text-[#0EA5A0]/80 p-2 rounded-full my-2 shadow-sm ring-1 ring-[#10B981]/20">
              <Clock size={16} />
            </div>
            {/* Vertical text */}
            <div className="transform -rotate-90 origin-center whitespace-nowrap font-medium text-gray-600 tracking-wide my-3" style={{
            fontSize: '13px',
            letterSpacing: '0.05em'
          }}>
              Coming Appt
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
              return <div key={hour} className={`flex flex-col items-center cursor-pointer transition-all duration-200 w-full px-1 py-1.5 rounded-md ${isCurrentHour ? 'current-hour bg-[#F0FDFA]/90 border-l-2 border-[#10B981]/60 shadow-sm' : hasLate ? 'bg-[#FFF1F0]/90 border-l-2 border-[#FF3B30]/60 shadow-sm' : hourAppointments.length ? 'hover:bg-gray-50/80' : 'opacity-70 hover:bg-gray-50/50'}`} onClick={onToggleMinimize}>
                    <div className={`text-xs font-medium 
                        ${isCurrentHour ? 'text-[#10B981]' : hasLate ? 'text-[#FF3B30]' : 'text-gray-600'}`}>
                      {hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour < 12 ? `${hour} AM` : `${hour - 12} PM`}
                    </div>
                    <div className={`mt-1 text-xs px-2 py-0.5 rounded-full
                        ${isCurrentHour ? 'text-[#10B981] ring-1 ring-[#10B981]/40 bg-[#10B981]/10' : hasLate ? 'text-[#FF3B30] ring-1 ring-[#FF3B30]/40 bg-[#FF3B30]/10' : hourAppointments.length ? 'text-gray-500 ring-1 ring-gray-200 bg-gray-50/80' : 'text-gray-400 ring-1 ring-gray-200/80 bg-gray-50/50'}`}>
                      {hourAppointments.length || 0}
                    </div>
                  </div>;
            });
          })()}
          </div>
          {/* Bottom section with expand button and quick add */}
          <div className="w-full px-2 pt-2 flex flex-col items-center gap-2 mt-auto border-t border-gray-100/80">
            <Tippy content="Expand section">
              <button className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50/80 transition-all duration-200 w-full flex items-center justify-center" onClick={onToggleMinimize} aria-expanded="false" aria-controls="coming-appointments-content">
                <ChevronLeft size={14} className="opacity-70 hover:opacity-100" />
              </button>
            </Tippy>
          </div>
          {/* Left border accent - subtle gradient */}
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#10B981]/30 to-[#10B981]/50"></div>
        </div>
      </div>;
  }
  return <div className="bg-[#F8FAFC]/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/80 flex flex-col overflow-hidden h-full transition-all duration-300 ease-in-out">
      {/* Section header - Apple-like styling with sticky Add Appointment button */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#F0FDFA]/90 backdrop-blur-sm border-b border-gray-200/80 sticky top-0 z-10 h-[50px]">
        <div className="flex items-center">
          <div className="mr-3 text-[#0EA5A0]/80">
            <Clock size={16} className="opacity-70" />
          </div>
          <h2 className="text-[15px] font-medium text-gray-700">Coming Appt</h2>
          <div className="ml-2 bg-[#10B981]/20 text-[#0EA5A0] text-xs font-medium px-2.5 py-0.5 rounded-full ring-1 ring-[#10B981]/30 shadow-sm">
            {comingAppointments.filter(appt => appt.status?.toLowerCase() !== 'checked-in' && appt.status?.toLowerCase() !== 'in-service').length}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* Add Appointment button moved to top right */}
          <Tippy content="Add appointment">
            <button className="p-1.5 rounded-md bg-[#10B981]/10 text-[#0EA5A0]/80 hover:bg-[#10B981]/20 transition-all duration-200 ring-1 ring-[#10B981]/20">
              <Plus size={14} className="opacity-80 hover:opacity-100" />
            </button>
          </Tippy>
          <Tippy content="Minimize section">
            <button className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-[#F0FDFA]/80 transition-all duration-200" onClick={onToggleMinimize} aria-expanded="true" aria-controls="coming-appointments-content">
              <ChevronRight size={14} className="opacity-70 hover:opacity-100" />
            </button>
          </Tippy>
        </div>
      </div>
      {/* Description header */}

      {/* Updated timeframe tabs with refined styling */}
      <div className="flex border-b border-[#E5E5EA] bg-white/90 backdrop-blur-sm">
        <button className={`flex-1 py-[10px] text-xs font-medium transition-all duration-150 ${activeTimeframe === 'next1Hour' ? 'text-[#34C759] border-b-2 border-[#34C759] font-semibold' : 'text-[#8E8E93] hover:text-[#636366]'}`} onClick={() => setActiveTimeframe('next1Hour')}>
          Next 1 Hour
        </button>
        <button className={`flex-1 py-[10px] text-xs font-medium transition-all duration-150 ${activeTimeframe === 'next3Hours' ? 'text-[#34C759] border-b-2 border-[#34C759] font-semibold' : 'text-[#8E8E93] hover:text-[#636366]'}`} onClick={() => setActiveTimeframe('next3Hours')}>
          Next 3 Hours
        </button>
        <button className={`flex-1 py-[10px] text-xs font-medium transition-all duration-150 ${activeTimeframe === 'later' ? 'text-[#34C759] border-b-2 border-[#34C759] font-semibold' : 'text-[#8E8E93] hover:text-[#636366]'}`} onClick={() => setActiveTimeframe('later')}>
          Later
        </button>
      </div>
      {/* Appointments content - with refined styling */}
      <div id="coming-appointments-content" className="flex-1 overflow-auto px-4 py-3">
        {Object.keys(appointmentBuckets).some(key => appointmentBuckets[key as keyof typeof appointmentBuckets].length > 0) ? <div className="space-y-4">
            {/* Late appointments - always shown at the top */}
            {appointmentBuckets['late'].length > 0 && <div className="rounded-xl overflow-hidden border border-l-[3px] border-l-[#FF3B30] border-gray-200/50 bg-white/80 backdrop-blur-sm">
                {/* Bucket header with refined styling - simplified */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/50 cursor-pointer bg-[#F9F9FB] rounded-t-xl" onClick={() => toggleRowExpansion('late')} style={{
            transition: 'all 0.15s ease'
          }}>
                  <div className="flex items-center">
                    <h3 className="text-sm font-semibold text-[#1C1C1E]">
                      Late
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Simplified counts */}
                    <div className="text-xs text-gray-600">
                      {appointmentBuckets['late'].length} Appts
                      {getVipCount(appointmentBuckets['late']) > 0 && ` • ${getVipCount(appointmentBuckets['late'])} VIP`}
                    </div>
                    {/* Expand/collapse indicator */}
                    <div>
                      {expandedRows['late'] ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                    </div>
                  </div>
                </div>
                {/* Collapsed view - simple dots */}
                {!expandedRows['late'] && appointmentBuckets['late'].length > 0}
                {/* Expanded view - simplified appointment list */}
                {expandedRows['late'] && <div className="divide-y divide-[#E5E5EA]">
                    {appointmentBuckets['late'].map((appointment, index) => {
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
                            {/* Time and countdown */}
                            <div className="mr-3">
                              <div className="text-sm font-semibold">
                                {appointmentTime.toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                              </div>
                              <div className="text-xs text-[#FF3B30] font-medium">
                                Late • {Math.abs(appointment.minutesUntil)}m
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
            {/* Within 1 Hour */}
            {appointmentBuckets['within1Hour'].length > 0 && <div className="rounded-xl overflow-hidden border border-gray-200/50 bg-white/80 backdrop-blur-sm">
                {/* Bucket header with refined styling - simplified */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/50 cursor-pointer bg-[#F9F9FB] rounded-t-xl" onClick={() => toggleRowExpansion('within1Hour')} style={{
            transition: 'all 0.15s ease'
          }}>
                  <div className="flex items-center">
                    <h3 className="text-sm font-semibold text-[#1C1C1E]">
                      Within 1 Hour
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Simplified counts */}
                    <div className="text-xs text-gray-600">
                      {appointmentBuckets['within1Hour'].length} Appts
                      {getVipCount(appointmentBuckets['within1Hour']) > 0 && ` • ${getVipCount(appointmentBuckets['within1Hour'])} VIP`}
                    </div>
                    {/* Expand/collapse indicator */}
                    <div>
                      {expandedRows['within1Hour'] ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                    </div>
                  </div>
                </div>
                {/* Collapsed view - simple dots */}
                {!expandedRows['within1Hour'] && appointmentBuckets['within1Hour'].length > 0}
                {/* Expanded view - simplified appointment list */}
                {expandedRows['within1Hour'] && <div className="divide-y divide-[#E5E5EA]">
                    {appointmentBuckets['within1Hour'].map((appointment, index) => {
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
                                  in {appointment.minutesUntil}m
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
            {/* Within 3 Hours */}
            {appointmentBuckets['within3Hours'].length > 0 && <div className="rounded-xl overflow-hidden border border-gray-200/50 bg-white/80 backdrop-blur-sm">
                {/* Bucket header with refined styling - simplified */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/50 cursor-pointer bg-[#F9F9FB] rounded-t-xl" onClick={() => toggleRowExpansion('within3Hours')} style={{
            transition: 'all 0.15s ease'
          }}>
                  <div className="flex items-center">
                    <h3 className="text-sm font-semibold text-[#1C1C1E]">
                      Within 3 Hours
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Simplified counts */}
                    <div className="text-xs text-gray-600">
                      {appointmentBuckets['within3Hours'].length} Appts
                      {getVipCount(appointmentBuckets['within3Hours']) > 0 && ` • ${getVipCount(appointmentBuckets['within3Hours'])} VIP`}
                    </div>
                    {/* Expand/collapse indicator */}
                    <div>
                      {expandedRows['within3Hours'] ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                    </div>
                  </div>
                </div>
                {/* Collapsed view - simple dots */}
                {!expandedRows['within3Hours'] && appointmentBuckets['within3Hours'].length > 0}
                {/* Expanded view - simplified appointment list */}
                {expandedRows['within3Hours'] && <div className="divide-y divide-[#E5E5EA]">
                    {appointmentBuckets['within3Hours'].map((appointment, index) => {
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
      {/* Appointment Hover Details Popover */}
      {hoveredAppointment && <div className="fixed z-50 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/70 p-3 w-64" style={{
      top: `${window.event ? (window.event as MouseEvent).clientY + 10 : 0}px`,
      left: `${window.event ? (window.event as MouseEvent).clientX + 10 : 0}px`
    }}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-800 flex items-center">
              {hoveredAppointment.clientName}
              {hoveredAppointment.isVip && <Star size={12} className="ml-1.5 text-[#FF9500]" />}
            </h4>
            <div className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
              {new Date(hoveredAppointment.appointmentTime).toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit'
          })}
            </div>
          </div>
          <div className="space-y-1.5 text-xs text-gray-600">
            <div className="flex items-center">
              <Tag size={12} className="mr-1.5 text-gray-500" />
              <span className="font-medium">Service:</span>
              <span className="ml-1.5">{hoveredAppointment.service}</span>
            </div>
            <div className="flex items-center">
              <Clock size={12} className="mr-1.5 text-gray-500" />
              <span className="font-medium">Duration:</span>
              <span className="ml-1.5">{hoveredAppointment.duration}</span>
            </div>
            {hoveredAppointment.technician && <div className="flex items-center">
                <User size={12} className="mr-1.5 text-gray-500" />
                <span className="font-medium">Staff:</span>
                <span className="ml-1.5">{hoveredAppointment.technician}</span>
              </div>}
            <div className="flex items-center">
              <DollarSign size={12} className="mr-1.5 text-gray-500" />
              <span className="font-medium">Deposit:</span>
              <span className="ml-1.5">
                {hoveredAppointment.hasPaymentHold ? 'Required' : 'Not Required'}
              </span>
            </div>
            {hoveredAppointment.hasNotes && <div className="flex items-start mt-1">
                <FileText size={12} className="mr-1.5 mt-0.5 text-gray-500" />
                <div>
                  <span className="font-medium">Notes:</span>
                  <p className="mt-0.5 text-gray-500 line-clamp-2">
                    {hoveredAppointment.hasNotes ? 'Has additional notes...' : 'No notes'}
                  </p>
                </div>
              </div>}
          </div>
        </div>}
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