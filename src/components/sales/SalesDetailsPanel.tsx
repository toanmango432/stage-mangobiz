import { X, ChevronLeft, ChevronRight, User, Calendar, Clock, DollarSign, CreditCard } from 'lucide-react';
import { useEffect } from 'react';
import type { Ticket } from '../../types';
import type { LocalAppointment } from '../../types/appointment';

interface SalesDetailsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  data: Ticket | LocalAppointment | null;
  type: 'ticket' | 'appointment';
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export function SalesDetailsPanel({
  isOpen,
  onClose,
  data,
  type,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext
}: SalesDetailsPanelProps) {
  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when panel is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!data) return null;

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'scheduled': 'bg-blue-100 text-blue-800 border-blue-200',
      'checked-in': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'in-service': 'bg-purple-100 text-purple-800 border-purple-200',
      'in-progress': 'bg-purple-100 text-purple-800 border-purple-200',
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'cancelled': 'bg-gray-100 text-gray-800 border-gray-200',
      'no-show': 'bg-red-100 text-red-800 border-red-200',
      'new': 'bg-blue-100 text-blue-800 border-blue-200',
      'pending': 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const isTicket = type === 'ticket';
  const ticket = isTicket ? (data as Ticket) : null;
  const appointment = !isTicket ? (data as LocalAppointment) : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-white">
                {isTicket ? 'Ticket Details' : 'Appointment Details'}
              </h2>
              {data.id && (
                <span className="text-sm text-blue-100">
                  #{String(data.id).slice(0, 8)}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close panel"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Client Info */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                Client Information
              </h3>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {data.clientName || 'Walk-in Customer'}
                  </h4>
                  {data.clientPhone && (
                    <p className="text-gray-600 mt-1">{data.clientPhone}</p>
                  )}
                  <div className="mt-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(data.status)}`}>
                      {data.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Date & Time (for appointments) */}
            {appointment && (
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                  Appointment Schedule
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="text-gray-900 font-medium">
                        {formatDate(appointment.scheduledStartTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Time</p>
                      <p className="text-gray-900 font-medium">
                        {formatTime(appointment.scheduledStartTime)} - {formatTime(appointment.scheduledEndTime)}
                      </p>
                    </div>
                  </div>
                  {appointment.source && (
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Source</p>
                        <p className="text-gray-900 font-medium capitalize">{appointment.source}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Staff Assignment */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                Staff Assignment
              </h3>
              <div className="space-y-2">
                {isTicket && ticket ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {(ticket as any).techName?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium">
                        {(ticket as any).techName || 'Unassigned'}
                      </p>
                      <p className="text-sm text-gray-500">Technician</p>
                    </div>
                  </div>
                ) : appointment ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {appointment.staffName?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium">
                        {appointment.staffName || 'Unassigned'}
                      </p>
                      <p className="text-sm text-gray-500">Staff Member</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Services */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                Services
              </h3>
              <div className="space-y-3">
                {isTicket && ticket?.services ? (
                  ticket.services.map((service, index) => (
                    <div key={index} className="flex justify-between items-start bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium">{service.serviceName}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span>{service.staffName}</span>
                          <span>•</span>
                          <span>{service.duration} min</span>
                        </div>
                      </div>
                      <p className="text-gray-900 font-semibold">${service.price.toFixed(2)}</p>
                    </div>
                  ))
                ) : appointment?.services ? (
                  appointment.services.map((service, index) => (
                    <div key={index} className="flex justify-between items-start bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium">{service.serviceName}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span>{service.staffName}</span>
                          <span>•</span>
                          <span>{service.duration} min</span>
                        </div>
                      </div>
                      <p className="text-gray-900 font-semibold">${service.price.toFixed(2)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No services listed</p>
                )}
              </div>
            </div>

            {/* Payment Summary (for tickets) */}
            {isTicket && ticket && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                  Payment Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span>${ticket.subtotal.toFixed(2)}</span>
                  </div>
                  {ticket.discount > 0 && (
                    <div className="flex justify-between text-gray-700">
                      <span>Discount</span>
                      <span className="text-red-600">-${ticket.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-700">
                    <span>Tax</span>
                    <span>${ticket.tax.toFixed(2)}</span>
                  </div>
                  {ticket.tip > 0 && (
                    <div className="flex justify-between text-gray-700">
                      <span>Tip</span>
                      <span>${ticket.tip.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-green-300 pt-2 mt-2">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Total</span>
                      <span>${ticket.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {((appointment as any)?.notes || (ticket as any)?.discountReason) && (
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                  Notes
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {(appointment as any)?.notes || (ticket as any)?.discountReason || 'No notes'}
                </p>
              </div>
            )}

            {/* Timestamps */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                Timestamps
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Created</span>
                  <span className="text-gray-900">
                    {formatDate(data.createdAt)} at {formatTime(data.createdAt)}
                  </span>
                </div>
                {ticket?.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Completed</span>
                    <span className="text-gray-900">
                      {formatDate(ticket.completedAt)} at {formatTime(ticket.completedAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer with Navigation */}
          {(hasPrevious || hasNext) && (
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <button
                  onClick={onPrevious}
                  disabled={!hasPrevious}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-sm font-medium">Previous</span>
                </button>
                <button
                  onClick={onNext}
                  disabled={!hasNext}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-sm font-medium">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
