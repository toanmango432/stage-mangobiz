import { useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock, User, Scissors, MoreVertical } from 'lucide-react';

interface AppointmentBlock {
  id: string;
  clientName: string;
  serviceName: string;
  staffName: string;
  startTime: Date;
  duration: number; // in minutes
  status: 'scheduled' | 'checked-in' | 'in-service' | 'completed' | 'cancelled';
  staffId: string;
}

interface DayScheduleProps {
  selectedDate: Date;
  staff: Array<{ id: string; name: string; photo?: string }>;
  appointments: AppointmentBlock[];
  onAppointmentClick: (appointment: AppointmentBlock) => void;
  onTimeSlotClick: (staffId: string, time: Date) => void;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM
const SLOT_HEIGHT = 60; // pixels per hour

export function DaySchedule({ 
  selectedDate, 
  staff, 
  appointments,
  onAppointmentClick,
  onTimeSlotClick 
}: DayScheduleProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to current time on mount
  useEffect(() => {
    const now = new Date();
    const currentHour = now.getHours();
    if (currentHour >= 8 && currentHour <= 20 && scrollRef.current) {
      const scrollPosition = (currentHour - 8) * SLOT_HEIGHT;
      scrollRef.current.scrollTop = scrollPosition - 100;
    }
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 border-blue-300 text-blue-900';
      case 'checked-in': return 'bg-green-100 border-green-300 text-green-900';
      case 'in-service': return 'bg-orange-100 border-orange-300 text-orange-900';
      case 'completed': return 'bg-purple-100 border-purple-300 text-purple-900';
      case 'cancelled': return 'bg-gray-100 border-gray-300 text-gray-500';
      default: return 'bg-gray-100 border-gray-300 text-gray-900';
    }
  };

  const getAppointmentPosition = (appointment: AppointmentBlock) => {
    const startHour = appointment.startTime.getHours();
    const startMinute = appointment.startTime.getMinutes();
    const top = ((startHour - 8) * SLOT_HEIGHT) + (startMinute / 60 * SLOT_HEIGHT);
    const height = (appointment.duration / 60) * SLOT_HEIGHT;
    return { top, height };
  };

  return (
    <div className="flex h-full bg-white">
      {/* Time column */}
      <div className="w-20 flex-shrink-0 border-r border-gray-200 bg-gray-50">
        <div className="h-12 border-b border-gray-200"></div>
        {HOURS.map((hour) => (
          <div key={hour} className="h-[60px] border-b border-gray-200 flex items-start justify-end pr-3 pt-1">
            <span className="text-xs font-medium text-gray-500">
              {format(new Date().setHours(hour, 0), 'h a')}
            </span>
          </div>
        ))}
      </div>

      {/* Staff columns */}
      <div className="flex-1 overflow-x-auto" ref={scrollRef}>
        <div className="flex min-w-full">
          {staff.map((staffMember) => {
            const staffAppointments = appointments.filter(apt => apt.staffId === staffMember.id);
            
            return (
              <div key={staffMember.id} className="flex-1 min-w-[200px] border-r border-gray-200 last:border-r-0">
                {/* Staff header */}
                <div className="h-12 border-b border-gray-200 flex items-center px-3 bg-gray-50 sticky top-0 z-10">
                  <div className="flex items-center gap-2">
                    {staffMember.photo ? (
                      <img src={staffMember.photo} alt={staffMember.name} className="w-6 h-6 rounded-full" />
                    ) : (
                      <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full flex items-center justify-center">
                        <User className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <span className="text-sm font-semibold text-gray-900">{staffMember.name}</span>
                  </div>
                </div>

                {/* Time slots */}
                <div className="relative">
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="h-[60px] border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        const slotTime = new Date(selectedDate);
                        slotTime.setHours(hour, 0, 0, 0);
                        onTimeSlotClick(staffMember.id, slotTime);
                      }}
                    >
                      {/* 15-minute grid lines */}
                      <div className="absolute inset-x-0 top-[15px] border-t border-gray-100"></div>
                      <div className="absolute inset-x-0 top-[30px] border-t border-gray-100"></div>
                      <div className="absolute inset-x-0 top-[45px] border-t border-gray-100"></div>
                    </div>
                  ))}

                  {/* Appointments */}
                  {staffAppointments.map((appointment) => {
                    const { top, height } = getAppointmentPosition(appointment);
                    const statusColor = getStatusColor(appointment.status);

                    return (
                      <div
                        key={appointment.id}
                        className={`absolute left-1 right-1 rounded-lg border-l-4 ${statusColor} p-2 cursor-pointer hover:shadow-md transition-all z-20`}
                        style={{ top: `${top}px`, height: `${height}px` }}
                        onClick={() => onAppointmentClick(appointment)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{appointment.clientName}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Scissors className="w-3 h-3 opacity-60" />
                              <p className="text-xs truncate">{appointment.serviceName}</p>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 opacity-60" />
                              <p className="text-xs">{appointment.duration} min</p>
                            </div>
                          </div>
                          <button className="p-1 hover:bg-black/5 rounded">
                            <MoreVertical className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Current time indicator */}
                  {(() => {
                    const now = new Date();
                    const currentHour = now.getHours();
                    const currentMinute = now.getMinutes();
                    
                    if (currentHour >= 8 && currentHour <= 20) {
                      const top = ((currentHour - 8) * SLOT_HEIGHT) + (currentMinute / 60 * SLOT_HEIGHT);
                      
                      return (
                        <div className="absolute left-0 right-0 z-30" style={{ top: `${top}px` }}>
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <div className="flex-1 h-0.5 bg-red-500"></div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
