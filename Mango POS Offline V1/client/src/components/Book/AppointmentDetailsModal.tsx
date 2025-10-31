/**
 * Appointment Details Modal
 * View, edit, and manage existing appointments
 */

import { useState } from 'react';
import { X, Edit2, Check, XCircle, Clock, Phone, Mail, MessageSquare, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';
import { LocalAppointment } from '../../types/appointment';

interface AppointmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: LocalAppointment | null;
  onEdit?: (appointment: LocalAppointment) => void;
  onStatusChange?: (appointmentId: string, newStatus: string) => void;
  onCancel?: (appointmentId: string) => void;
  onNoShow?: (appointmentId: string) => void;
}

const statusConfig = {
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-800', icon: Calendar },
  'checked-in': { label: 'Checked In', color: 'bg-teal-100 text-teal-800', icon: Check },
  'in-service': { label: 'In Service', color: 'bg-green-100 text-green-800', icon: Clock },
  completed: { label: 'Completed', color: 'bg-gray-100 text-gray-800', icon: Check },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
  'no-show': { label: 'No Show', color: 'bg-orange-100 text-orange-800', icon: XCircle },
};

export function AppointmentDetailsModal({
  isOpen,
  onClose,
  appointment,
  onEdit,
  onStatusChange,
  onCancel,
  onNoShow,
}: AppointmentDetailsModalProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [notes, setNotes] = useState('');

  if (!isOpen || !appointment) return null;

  const statusInfo = statusConfig[appointment.status as keyof typeof statusConfig] || statusConfig.scheduled;
  const StatusIcon = statusInfo.icon;

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleStatusChange = (newStatus: string) => {
    if (onStatusChange) {
      onStatusChange(appointment.id, newStatus);
    }
    setShowStatusMenu(false);
  };

  const totalDuration = appointment.services.reduce((sum, s) => sum + s.duration, 0);
  const totalPrice = appointment.services.reduce((sum, s) => sum + s.price, 0);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal - Slide from Right, full screen on mobile */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-full sm:max-w-2xl bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
          {/* Header */}
          <div className="flex items-start justify-between p-4 sm:p-6 border-b border-gray-200">
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-2">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-0">{appointment.clientName}</h2>
                <div className="relative">
                  <button
                    onClick={() => setShowStatusMenu(!showStatusMenu)}
                    className={cn(
                      'px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-medium flex items-center space-x-1 transition-all hover:shadow-md',
                      statusInfo.color
                    )}
                  >
                    <StatusIcon className="w-4 h-4" />
                    <span>{statusInfo.label}</span>
                  </button>

                  {/* Status Dropdown */}
                  {showStatusMenu && (
                    <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[160px] z-10">
                      {Object.entries(statusConfig).map(([status, config]) => {
                        const Icon = config.icon;
                        return (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(status)}
                            className={cn(
                              'w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2 transition-colors',
                              appointment.status === status && 'bg-gray-100'
                            )}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-sm font-medium">{config.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-gray-600">
                {formatDate(new Date(appointment.scheduledStartTime))}
              </p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {formatTime(new Date(appointment.scheduledStartTime))} - {formatTime(new Date(appointment.scheduledEndTime))}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Client Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">CLIENT INFORMATION</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-3 text-gray-700">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span>{appointment.clientPhone}</span>
                </div>
                {appointment.clientId && (
                  <div className="flex items-center space-x-3 text-gray-700">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-500">View full profile →</span>
                  </div>
                )}
              </div>
            </div>

            {/* Staff */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">STAFF</h3>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold">
                  {(appointment.staffName || appointment.services?.[0]?.staffName || 'N')?.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{appointment.staffName || appointment.services?.[0]?.staffName || 'No staff assigned'}</p>
                  <p className="text-sm text-gray-500">Technician</p>
                </div>
              </div>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">SERVICES</h3>
              <div className="space-y-3">
                {appointment.services.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{service.serviceName}</p>
                      <p className="text-sm text-gray-600">{service.duration} minutes</p>
                    </div>
                    <p className="font-semibold text-gray-900">${service.price}</p>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Total Duration:</span>
                  <span className="font-semibold text-gray-900">{totalDuration} minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Price:</span>
                  <span className="font-bold text-gray-900 text-lg">${totalPrice}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">NOTES</h3>
              {appointment.notes ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-gray-700">{appointment.notes}</p>
                </div>
              ) : (
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this appointment..."
                    rows={3}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  />
                </div>
              )}
            </div>

            {/* Source */}
            <div className="text-sm text-gray-500">
              <span className="font-medium">Source:</span> {appointment.source === 'online' ? 'Online Booking' : 'Walk-in'}
            </div>
          </div>

          {/* Footer - Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-wrap gap-2">
              {appointment.status === 'scheduled' && (
                <button
                  onClick={() => handleStatusChange('checked-in')}
                  className="px-3 py-2 sm:px-4 text-sm sm:text-base bg-teal-500 text-white font-medium rounded-lg hover:bg-teal-600 transition-colors flex items-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Check In</span>
                </button>
              )}
              
              {appointment.status === 'checked-in' && (
                <button
                  onClick={() => handleStatusChange('in-service')}
                  className="px-3 py-2 sm:px-4 text-sm sm:text-base bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                >
                  <Clock className="w-4 h-4" />
                  <span>Start Service</span>
                </button>
              )}

              {appointment.status === 'in-service' && (
                <button
                  onClick={() => handleStatusChange('completed')}
                  className="px-3 py-2 sm:px-4 text-sm sm:text-base bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Complete</span>
                </button>
              )}

              {onEdit && (
                <button
                  onClick={() => {
                    onEdit(appointment);
                    onClose();
                  }}
                  className="px-3 py-2 sm:px-4 text-sm sm:text-base bg-white border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {appointment.status !== 'cancelled' && appointment.status !== 'no-show' && (
                <>
                  {onNoShow && (
                    <button
                      onClick={() => {
                        onNoShow(appointment.id);
                        onClose();
                      }}
                      className="px-3 py-2 sm:px-4 text-sm sm:text-base text-orange-600 font-medium hover:bg-orange-50 rounded-lg transition-colors"
                    >
                      No Show
                    </button>
                  )}
                  {onCancel && (
                    <button
                      onClick={() => {
                        onCancel(appointment.id);
                        onClose();
                      }}
                      className="px-3 py-2 sm:px-4 text-sm sm:text-base text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </>
  );
}
