import { Eye, User, Calendar, Clock, DollarSign } from 'lucide-react';
import type { Ticket } from '../../types';
import type { LocalAppointment } from '../../types/appointment';

interface SalesMobileCardProps {
  item: Ticket | LocalAppointment;
  type: 'ticket' | 'appointment';
  onView: () => void;
}

export function SalesMobileCard({ item, type, onView }: SalesMobileCardProps) {
  const isTicket = type === 'ticket';
  const ticket = isTicket ? (item as Ticket) : null;
  const appointment = !isTicket ? (item as LocalAppointment) : null;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'scheduled': 'bg-gradient-to-br from-sky-50 to-sky-100 text-sky-700 border-sky-200',
      'checked-in': 'bg-gradient-to-br from-yellow-50 to-yellow-100 text-yellow-700 border-yellow-200',
      'in-service': 'bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700 border-purple-200',
      'in-progress': 'bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700 border-purple-200',
      'completed': 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200 shadow-sm shadow-emerald-100',
      'cancelled': 'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-600 border-slate-200',
      'no-show': 'bg-gradient-to-br from-rose-50 to-rose-100 text-rose-700 border-rose-200',
      'new': 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 border-blue-200',
      'pending': 'bg-gradient-to-br from-amber-50 to-amber-100 text-amber-700 border-amber-200'
    };
    return colors[status] || 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-600 border-gray-200';
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      onClick={onView}
      className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-lg transition-all duration-200 active:scale-[0.98] cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 transition-all duration-200 cursor-pointer">
            <User className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-900 truncate">
              {item.clientName || 'Walk-in Customer'}
            </h3>
            {item.clientPhone && (
              <p className="text-sm text-gray-600 font-medium">{item.clientPhone}</p>
            )}
          </div>
        </div>
        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(item.status)}`}>
          {item.status}
        </span>
      </div>

      {/* Details Grid */}
      <div className="space-y-2">
        {/* Date & Time */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span className="text-gray-900 font-medium">
            {isTicket
              ? formatDate(ticket!.createdAt)
              : formatDate(appointment!.scheduledStartTime)}
          </span>
          <Clock className="w-4 h-4 text-gray-500 ml-2 flex-shrink-0" />
          <span className="text-gray-900 font-medium">
            {isTicket
              ? formatTime(ticket!.createdAt)
              : `${formatTime(appointment!.scheduledStartTime)} - ${formatTime(appointment!.scheduledEndTime)}`}
          </span>
        </div>

        {/* Staff */}
        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span className="text-gray-900 font-medium">
            {isTicket
              ? (ticket as any).techName || 'Unassigned'
              : appointment!.staffName || 'Unassigned'}
          </span>
        </div>

        {/* Services */}
        {isTicket && ticket!.services && ticket!.services.length > 0 && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">{ticket!.services.length} service{ticket!.services.length > 1 ? 's' : ''}</span>
            {': '}
            <span className="truncate">
              {ticket!.services.map(s => s.serviceName).join(', ')}
            </span>
          </div>
        )}
        {!isTicket && appointment!.services && appointment!.services.length > 0 && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">{appointment!.services.length} service{appointment!.services.length > 1 ? 's' : ''}</span>
            {': '}
            <span className="truncate">
              {appointment!.services.map(s => s.serviceName).join(', ')}
            </span>
          </div>
        )}

        {/* Total (for tickets) */}
        {isTicket && ticket!.total && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-sm text-gray-600">Total</span>
            <span className="text-lg font-bold text-gray-900 flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              {ticket!.total.toFixed(2)}
            </span>
          </div>
        )}

        {/* Source (for appointments) */}
        {!isTicket && appointment!.source && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-sm text-gray-600">Source</span>
            <span className="text-sm font-medium text-gray-900 capitalize">
              {appointment!.source}
            </span>
          </div>
        )}
      </div>

      {/* Action */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        {/* Add icon animation */}
        <style>{`
          @keyframes rotateIcon {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(15deg);
            }
          }
          .icon-action-mobile:hover {
            animation: rotateIcon 0.3s ease-in-out alternate infinite;
          }
        `}</style>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 hover:shadow-sm transition-all duration-200 font-semibold text-sm active:scale-95"
        >
          <Eye className="w-4 h-4 icon-action-mobile" />
          View Details
        </button>
      </div>
    </div>
  );
}
