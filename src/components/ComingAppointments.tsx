import { useEffect, useState, useRef, memo } from 'react';
import { useTickets } from '../hooks/useTicketsCompat';
import { Clock, ChevronLeft, ChevronRight, User, Calendar, Tag, Plus, Star, AlertCircle, CreditCard, MessageSquare, ChevronDown, ChevronUp, MoreVertical, FileText, DollarSign, Pencil } from 'lucide-react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { FrontDeskSettingsData } from './frontdesk-settings/types';

interface ComingAppointmentsProps {
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  isMobile?: boolean;
  hideHeader?: boolean;
  settings?: FrontDeskSettingsData;
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
export const ComingAppointments = memo(function ComingAppointments({
  isMinimized = false,
  onToggleMinimize,
  isMobile = false,
  hideHeader = false,
  settings,
  headerStyles
}: ComingAppointmentsProps) {
  const {
    comingAppointments = []
  } = useTickets();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTimeframe, setActiveTimeframe] = useState<'next1Hour' | 'next3Hours' | 'later'>('next1Hour');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({
    late: true,          // Expanded by default - high urgency
    within1Hour: true,   // Expanded by default - high priority
    within3Hours: false, // Collapsed by default - lower priority
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

  // Calculate metrics for pill badges
  const lateCount = appointmentBuckets.late.length;
  const nextCount = appointmentBuckets.within1Hour.length;
  const laterCount = appointmentBuckets.within3Hours.length + appointmentBuckets.moreThan3Hours.length;

  return <div className={`flex-1 bg-white ${!hideHeader ? 'border-l border-l-gray-200' : ''} flex flex-col transition-all duration-300 ease-in-out`}>
      {/* Header - Hide on mobile when MobileTabBar shows metrics */}
      {!hideHeader && (
        <div className="px-3 py-2 border-b border-gray-200 flex-shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                <Clock size={14} strokeWidth={2.5} className="text-sky-600" />
              </div>
              <h2 className="text-[13px] font-medium text-slate-600">Coming</h2>
              <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                {comingAppointments.filter(appt => appt.status?.toLowerCase() !== 'checked-in' && appt.status?.toLowerCase() !== 'in-service').length}
              </span>
              {lateCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-semibold flex items-center gap-1">
                  <span>Late</span>
                  <span>{lateCount}</span>
                </span>
              )}
              {nextCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-semibold flex items-center gap-1">
                  <span>Next</span>
                  <span>{nextCount}</span>
                </span>
              )}
              {laterCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-gray-50 text-gray-600 text-[10px] font-semibold flex items-center gap-1">
                  <span>Later</span>
                  <span>{laterCount}</span>
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
      )}

      {/* Content - Collapsible (always show when header is hidden) */}
      {(hideHeader || !isMinimized) && <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">

      {/* Timeframe tabs - simple and clean */}
      <div className="flex border-b border-gray-200 bg-white flex-shrink-0">
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
      <div id="coming-appointments-content" className="flex-1 overflow-auto px-4 pt-3 pb-4">
        {Object.keys(appointmentBuckets).some(key => appointmentBuckets[key as keyof typeof appointmentBuckets].length > 0) ? <div className="space-y-3">
            {/* Late appointments - always shown at the top */}
            {appointmentBuckets['late'].length > 0 && <div className="rounded-lg overflow-hidden border border-red-200 bg-white shadow-sm">
                {/* Bucket header - red accent for urgency */}
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-red-100 cursor-pointer hover:bg-red-50/50 transition-colors bg-red-50/30" onClick={() => toggleRowExpansion('late')}>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-semibold text-red-700">Late</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-red-600">
                      {appointmentBuckets['late'].length}{getVipCount(appointmentBuckets['late']) > 0 && ` - ${getVipCount(appointmentBuckets['late'])} VIP`}
                    </span>
                    {expandedRows['late'] ? <ChevronUp size={14} className="text-red-500" strokeWidth={2.5} /> : <ChevronDown size={14} className="text-red-500" strokeWidth={2.5} />}
                  </div>
                </div>
                {/* Collapsed view - simple dots */}
                {!expandedRows['late'] && appointmentBuckets['late'].length > 0}
                {/* Expanded view - simplified appointment list with animation */}
                {expandedRows['late'] && <div className="divide-y divide-red-100 animate-in fade-in slide-in-from-top-2 duration-200">
                    {appointmentBuckets['late'].map((appointment, index) => {
              const appointmentTime = new Date(appointment.appointmentTime);
              const technicianFirstName = appointment.technician ? appointment.technician.split(' ')[0].toUpperCase() : '';
              return <div key={appointment.id || index} className="group px-3 py-2.5 hover:bg-red-50/30 transition-all duration-150 cursor-pointer relative" onClick={e => handleAppointmentClick(appointment, e)}>
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
            {appointmentBuckets['within1Hour'].length > 0 && <div className="rounded-lg overflow-hidden border border-blue-200 bg-white shadow-sm">
                {/* Bucket header - blue accent for next hour */}
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-blue-100 cursor-pointer hover:bg-blue-50/50 transition-colors bg-blue-50/30" onClick={() => toggleRowExpansion('within1Hour')}>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-semibold text-blue-700">Next Hour</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-blue-600">
                      {appointmentBuckets['within1Hour'].length}{getVipCount(appointmentBuckets['within1Hour']) > 0 && ` - ${getVipCount(appointmentBuckets['within1Hour'])} VIP`}
                    </span>
                    {expandedRows['within1Hour'] ? <ChevronUp size={14} className="text-blue-500" strokeWidth={2.5} /> : <ChevronDown size={14} className="text-blue-500" strokeWidth={2.5} />}
                  </div>
                </div>
                {/* Collapsed view - simple dots */}
                {!expandedRows['within1Hour'] && appointmentBuckets['within1Hour'].length > 0}
                {/* Expanded view - simplified appointment list with animation */}
                {expandedRows['within1Hour'] && <div className="divide-y divide-blue-100 animate-in fade-in slide-in-from-top-2 duration-200">
                    {appointmentBuckets['within1Hour'].map((appointment, index) => {
              const appointmentTime = new Date(appointment.appointmentTime);
              const technicianFirstName = appointment.technician ? appointment.technician.split(' ')[0].toUpperCase() : '';
              return <div key={appointment.id || index} className="group px-3 py-2.5 hover:bg-blue-50/30 transition-all duration-150 cursor-pointer relative" onClick={e => handleAppointmentClick(appointment, e)}>
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
            {/* Later (combines 3+ hours) */}
            {(appointmentBuckets['within3Hours'].length > 0 || appointmentBuckets['moreThan3Hours'].length > 0) && <div className="rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
                {/* Bucket header - gray for later appointments */}
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors bg-gray-50/50" onClick={() => toggleRowExpansion('within3Hours')}>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-gray-400 rounded-full"></div>
                    <span className="text-sm font-semibold text-gray-700">Later</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-600">
                      {appointmentBuckets['within3Hours'].length + appointmentBuckets['moreThan3Hours'].length}{(getVipCount(appointmentBuckets['within3Hours']) + getVipCount(appointmentBuckets['moreThan3Hours'])) > 0 && ` - ${getVipCount(appointmentBuckets['within3Hours']) + getVipCount(appointmentBuckets['moreThan3Hours'])} VIP`}
                    </span>
                    {expandedRows['within3Hours'] ? <ChevronUp size={14} className="text-gray-500" strokeWidth={2.5} /> : <ChevronDown size={14} className="text-gray-500" strokeWidth={2.5} />}
                  </div>
                </div>
                {/* Collapsed view - simple dots */}
                {!expandedRows['within3Hours'] && (appointmentBuckets['within3Hours'].length > 0 || appointmentBuckets['moreThan3Hours'].length > 0)}
                {/* Expanded view - show both within3Hours and moreThan3Hours with animation */}
                {expandedRows['within3Hours'] && <div className="divide-y divide-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
                    {[...appointmentBuckets['within3Hours'], ...appointmentBuckets['moreThan3Hours']].map((appointment, index) => {
              const appointmentTime = new Date(appointment.appointmentTime);
              const technicianFirstName = appointment.technician ? appointment.technician.split(' ')[0].toUpperCase() : '';
              return <div key={appointment.id || index} className="group px-3 py-2.5 hover:bg-gray-50/80 transition-all duration-150 cursor-pointer relative" onClick={e => handleAppointmentClick(appointment, e)}>
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
            {/* More than 3 Hours - Now combined with "Later" bucket above */}
            {false && appointmentBuckets['moreThan3Hours'].length > 0 && <div className="rounded-xl overflow-hidden border border-gray-200/50 bg-white/80 backdrop-blur-sm">
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
              return <div key={appointment.id || index} className="px-4 py-[10px] bg-white/80 backdrop-blur-sm hover:bg-white/50 transition-all duration-150 cursor-pointer relative" onClick={e => handleAppointmentClick(appointment, e)}>
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
      </div>}
    </div>;
});