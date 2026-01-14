/**
 * StaffDetailsPanel - Side panel showing staff member details
 * Shows current tickets, upcoming appointments, today's stats, and quick actions
 */

import { useCallback, useEffect, useMemo } from 'react';
import {
  X,
  Clock,
  Calendar,
  Ticket,
  Plus,
  StickyNote,
  UserCog,
  CreditCard,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { selectServiceTickets, selectCompletedTickets, type UITicket } from '@/store/slices/uiTicketsSlice';
import { selectAllAppointments } from '@/store/slices/appointmentsSlice';
import type { LocalAppointment } from '@/types/appointment';

interface StaffDetailsPanelProps {
  staff: {
    id: string | number;
    name: string;
    image?: string;
    status: 'ready' | 'busy' | 'off';
    clockInTime?: string;
    turnCount?: number;
    totalSalesAmount?: number;
    ticketsServicedCount?: number;
  };
  onClose: () => void;
  onAddTicket?: (staffId: number) => void;
  onAddNote?: (staffId: number) => void;
  onEditTeam?: (staffId: number) => void;
  onQuickCheckout?: (staffId: number, ticketId?: number) => void;
}

export function StaffDetailsPanel({
  staff,
  onClose,
  onAddTicket,
  onAddNote,
  onEditTeam,
  onQuickCheckout,
}: StaffDetailsPanelProps) {
  // Get ticket and appointment data from Redux
  const inServiceTickets = useAppSelector(selectServiceTickets);
  const completedTickets = useAppSelector(selectCompletedTickets);
  const allAppointments = useAppSelector(selectAllAppointments);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Get staff's current tickets
  const staffTickets = useMemo(() => {
    return inServiceTickets.filter((ticket: UITicket) => {
      const ticketStaffId = ticket.techId || ticket.assignedTo?.id;
      return ticketStaffId === String(staff.id) || ticketStaffId === staff.id;
    });
  }, [inServiceTickets, staff.id]);

  // Get staff's completed tickets for today
  const todayCompletedTickets = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return completedTickets.filter((ticket: UITicket) => {
      const ticketStaffId = ticket.techId || ticket.assignedTo?.id;
      if (ticketStaffId !== String(staff.id) && ticketStaffId !== staff.id) {
        return false;
      }

      // Check if completed today
      const completedTime = ticket.updatedAt
        ? (typeof ticket.updatedAt === 'string' ? new Date(ticket.updatedAt) : ticket.updatedAt)
        : null;
      if (!completedTime) return false;

      return completedTime >= today;
    });
  }, [completedTickets, staff.id]);

  // Get staff's upcoming appointments
  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return allAppointments
      .filter((apt: LocalAppointment) => {
        if (apt.staffId !== String(staff.id) && apt.staffId !== staff.id) {
          return false;
        }

        const validStatuses = ['scheduled', 'confirmed', 'pending'];
        if (!validStatuses.includes(apt.status)) {
          return false;
        }

        const aptTime = new Date(apt.scheduledStartTime);
        return aptTime > now && aptTime <= endOfDay;
      })
      .sort((a, b) => {
        return new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime();
      })
      .slice(0, 5); // Show up to 5 upcoming appointments
  }, [allAppointments, staff.id]);

  // Calculate today's stats
  const todayStats = useMemo(() => {
    const totalRevenue = todayCompletedTickets.reduce((sum, ticket) => {
      // Try to get total from ticket data
      const ticketTotal = (ticket as any).total || 0;
      return sum + ticketTotal;
    }, 0);

    return {
      ticketsCompleted: todayCompletedTickets.length,
      ticketsInService: staffTickets.length,
      upcomingAppointments: upcomingAppointments.length,
      revenue: staff.totalSalesAmount || totalRevenue,
      turnCount: staff.turnCount || 0,
    };
  }, [todayCompletedTickets, staffTickets, upcomingAppointments, staff.totalSalesAmount, staff.turnCount]);

  // Get numeric staff ID for action callbacks
  const numericStaffId = useMemo(() => {
    return typeof staff.id === 'string'
      ? parseInt(staff.id.replace(/\D/g, '')) || 0
      : staff.id;
  }, [staff.id]);

  // Format time display
  const formatTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }, []);

  // Get status badge styling
  const getStatusBadge = () => {
    switch (staff.status) {
      case 'busy':
        return { bg: 'bg-red-100', text: 'text-red-700', label: 'Busy' };
      case 'ready':
        return { bg: 'bg-green-100', text: 'text-green-700', label: 'Ready' };
      case 'off':
        return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Off' };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-[80] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-[380px] max-w-full bg-white shadow-2xl z-[90] flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-teal-50 to-teal-100/70">
          <div className="flex items-center gap-3">
            {staff.image ? (
              <img
                src={staff.image}
                alt={staff.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow">
                {staff.name.charAt(0)}
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold text-gray-900">{staff.name}</h3>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                  {statusBadge.label}
                </span>
                {staff.clockInTime && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock size={12} />
                    {formatTime(staff.clockInTime)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-teal-100 rounded-lg transition-colors"
            aria-label="Close panel"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Today's Stats */}
          <div className="p-4 border-b">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <TrendingUp size={16} className="text-teal-600" />
              Today's Stats
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-gray-900">{todayStats.turnCount}</div>
                <div className="text-xs text-gray-500">Turns</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-gray-900">{todayStats.ticketsCompleted}</div>
                <div className="text-xs text-gray-500">Completed</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-teal-600">
                  ${todayStats.revenue.toFixed(0)}
                </div>
                <div className="text-xs text-gray-500">Revenue</div>
              </div>
            </div>
          </div>

          {/* Current Tickets */}
          {staffTickets.length > 0 && (
            <div className="p-4 border-b">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Ticket size={16} className="text-red-500" />
                Current Tickets ({staffTickets.length})
              </h4>
              <div className="space-y-2">
                {staffTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="bg-red-50 border border-red-100 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {ticket.clientName || 'Walk-in'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {ticket.service || 'Service'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">
                          {ticket.duration || '30min'}
                        </div>
                        {onQuickCheckout && (
                          <button
                            onClick={() => onQuickCheckout(numericStaffId, Number(ticket.id))}
                            className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                          >
                            Checkout →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Appointments */}
          <div className="p-4 border-b">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Calendar size={16} className="text-blue-500" />
              Upcoming Appointments ({upcomingAppointments.length})
            </h4>
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-2">
                {upcomingAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="bg-blue-50 border border-blue-100 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {apt.clientName || 'Client'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {apt.services?.[0]?.serviceName || 'Service'}
                          {apt.services && apt.services.length > 1 && ` +${apt.services.length - 1}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-blue-600">
                          {formatTime(apt.scheduledStartTime)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {apt.services?.reduce((sum, s) => sum + (s.duration || 0), 0) || 30}min
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                <Calendar className="mx-auto mb-2 opacity-40" size={24} />
                No upcoming appointments
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <AlertCircle size={16} className="text-gray-500" />
              Quick Actions
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {onAddTicket && (
                <button
                  onClick={() => onAddTicket(numericStaffId)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg transition-colors"
                >
                  <Plus size={18} />
                  <span className="font-medium text-sm">Add Ticket</span>
                </button>
              )}
              {onAddNote && (
                <button
                  onClick={() => onAddNote(numericStaffId)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors"
                >
                  <StickyNote size={18} />
                  <span className="font-medium text-sm">Add Note</span>
                </button>
              )}
              {onEditTeam && (
                <button
                  onClick={() => onEditTeam(numericStaffId)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors"
                >
                  <UserCog size={18} />
                  <span className="font-medium text-sm">Edit Staff</span>
                </button>
              )}
              {onQuickCheckout && staffTickets.length > 0 && (
                <button
                  onClick={() => onQuickCheckout(numericStaffId, Number(staffTickets[0].id))}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors"
                >
                  <CreditCard size={18} />
                  <span className="font-medium text-sm">Checkout</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
