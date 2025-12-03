/**
 * Appointment Details Modal - Premium Edition
 * View, edit, and manage existing appointments
 * With glass morphism and premium design
 */

import { useState, useEffect } from 'react';
import { X, Edit2, Check, XCircle, Clock, Phone, Mail, MessageSquare, Calendar, User, History } from 'lucide-react';
import { cn } from '../../lib/utils';
import { LocalAppointment } from '../../types/appointment';
import { Client } from '../../types/client';
import toast from 'react-hot-toast';
import { clientsDB } from '../../db/database';
import { db } from '../../db/schema';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { PremiumButton, PremiumAvatar, StatusBadge } from '../premium';

interface AppointmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: LocalAppointment | null;
  onEdit?: (appointment: LocalAppointment) => void;
  onStatusChange?: (appointmentId: string, newStatus: string) => void;
  onCancel?: (appointmentId: string) => void;
  onNoShow?: (appointmentId: string) => void;
  onDelete?: (appointmentId: string) => void;
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
  onDelete,
}: AppointmentDetailsModalProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [notes, setNotes] = useState('');
  const [client, setClient] = useState<Client | null>(null);
  const [clientNotes, setClientNotes] = useState('');
  const [isEditingClientNotes, setIsEditingClientNotes] = useState(false);
  const [isSavingClientNotes, setIsSavingClientNotes] = useState(false);
  const [serviceHistory, setServiceHistory] = useState<LocalAppointment[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load client data when appointment changes
  useEffect(() => {
    async function loadClientData() {
      if (appointment?.clientId) {
        try {
          const clientData = await clientsDB.getById(appointment.clientId);
          if (clientData) {
            setClient(clientData);
            setClientNotes(Array.isArray(clientData.notes) ? clientData.notes.map(n => n.content).join('\n') : (clientData.notes as any || ''));
          }
        } catch (error) {
          console.error('Error loading client data:', error);
        }
      }
    }

    if (isOpen && appointment) {
      loadClientData();
    }
  }, [isOpen, appointment?.clientId]);

  // Load service history when requested
  const handleLoadServiceHistory = async () => {
    if (!appointment?.clientId || serviceHistory.length > 0) {
      setShowHistory(!showHistory);
      return;
    }

    setLoadingHistory(true);
    try {
      // Get all appointments for this client
      const allAppointments = await db.appointments
        .where('clientId')
        .equals(appointment.clientId)
        .and(apt => apt.status === 'completed' && apt.id !== appointment.id)
        .reverse()
        .sortBy('scheduledStartTime');

      setServiceHistory(allAppointments.slice(0, 10)); // Show last 10
      setShowHistory(true);
    } catch (error) {
      console.error('Error loading service history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSaveClientNotes = async () => {
    if (!client) return;

    setIsSavingClientNotes(true);
    try {
      await clientsDB.update(client.id, { notes: typeof clientNotes === 'string' ? [] : clientNotes });
      setClient({ ...client, notes: typeof clientNotes === 'string' ? [] : clientNotes });
      setIsEditingClientNotes(false);
    } catch (error) {
      console.error('Error saving client notes:', error);
      toast.error('Failed to save client notes. Please try again.');
    } finally {
      setIsSavingClientNotes(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!appointment || !onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(appointment.id);
      toast.success('Appointment deleted successfully');
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.error('Failed to delete appointment. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !appointment) return null;

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
      {/* Backdrop - Premium blur */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-md z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal - Premium glass morphism, slide from right */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-full sm:max-w-2xl bg-white/95 backdrop-blur-xl shadow-premium-3xl z-50 flex flex-col animate-slide-in-right border-l border-gray-200/50">
          {/* Header - Premium glass */}
          <div className="flex items-start justify-between p-4 sm:p-6 border-b border-gray-200/50 bg-white/50">
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-2">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-2 sm:mb-0">{appointment.clientName}</h2>
                <div className="relative">
                  <div onClick={() => setShowStatusMenu(!showStatusMenu)} className="cursor-pointer">
                    <StatusBadge
                      status={appointment.status as any}
                      size="md"
                    />
                  </div>

                  {/* Status Dropdown - Premium */}
                  {showStatusMenu && (
                    <div className="absolute top-full left-0 mt-2 bg-white/95 backdrop-blur-xl rounded-xl shadow-premium-lg border border-gray-200/50 py-2 min-w-[160px] z-10 animate-scale-in">
                      {Object.entries(statusConfig).map(([status, config]) => {
                        const Icon = config.icon;
                        return (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(status)}
                            className={cn(
                              'w-full text-left px-4 py-2 hover:bg-brand-50 hover:text-brand-700 flex items-center space-x-2 transition-all duration-200',
                              appointment.status === status && 'bg-brand-50 text-brand-700'
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
              className={cn(
                'p-2 rounded-lg',
                'hover:bg-gray-100',
                'transition-colors duration-200'
              )}
              aria-label="Close"
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

            {/* Client Notes */}
            {client && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    CLIENT NOTES
                  </h3>
                  {!isEditingClientNotes && (
                    <button
                      onClick={() => setIsEditingClientNotes(true)}
                      className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      {client.notes ? 'Edit' : 'Add'}
                    </button>
                  )}
                </div>

                {isEditingClientNotes ? (
                  <div className="space-y-2">
                    <textarea
                      value={clientNotes}
                      onChange={(e) => setClientNotes(e.target.value)}
                      placeholder="Add notes about this client (allergies, preferences, special requests, etc.)"
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-brand-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 resize-none transition-all"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <PremiumButton
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setClientNotes(Array.isArray(client.notes) ? client.notes.map(n => n.content).join('\n') : (client.notes as any || ''));
                          setIsEditingClientNotes(false);
                        }}
                      >
                        Cancel
                      </PremiumButton>
                      <PremiumButton
                        variant="primary"
                        size="sm"
                        icon={!isSavingClientNotes ? <Check className="w-3 h-3" /> : undefined}
                        onClick={handleSaveClientNotes}
                        disabled={isSavingClientNotes}
                      >
                        {isSavingClientNotes ? 'Saving...' : 'Save'}
                      </PremiumButton>
                    </div>
                  </div>
                ) : client.notes && Array.isArray(client.notes) && client.notes.length > 0 ? (
                  <div className="p-3 bg-surface-secondary border-l-4 border-brand-400 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{client.notes.map(n => n.content).join('\n')}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No notes added yet. Click "Add" to add notes about this client.</p>
                )}
              </div>
            )}

            {/* Service History */}
            {appointment?.clientId && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <History className="w-4 h-4" />
                    SERVICE HISTORY
                  </h3>
                  <button
                    onClick={handleLoadServiceHistory}
                    disabled={loadingHistory}
                    className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 transition-colors"
                  >
                    {loadingHistory ? (
                      <>
                        <div className="w-3 h-3 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>{showHistory ? 'Hide' : 'Show'} History</>
                    )}
                  </button>
                </div>

                {showHistory && (
                  <div className="space-y-2">
                    {serviceHistory.length > 0 ? (
                      serviceHistory.map((apt) => {
                        const totalPrice = apt.services.reduce((sum, s) => sum + s.price, 0);
                        const date = new Date(apt.scheduledStartTime);
                        return (
                          <div key={apt.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                </p>
                              </div>
                              <span className="text-sm font-semibold text-gray-900">${totalPrice.toFixed(2)}</span>
                            </div>
                            <div className="space-y-1">
                              {apt.services.map((service, idx) => (
                                <div key={idx} className="flex justify-between text-xs text-gray-600">
                                  <span>{service.serviceName}</span>
                                  <span className="text-gray-500">{service.staffName}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-gray-500 italic">No service history found.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Staff - Premium avatar */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">STAFF</h3>
              <div className="flex items-center space-x-3">
                <PremiumAvatar
                  name={appointment.staffName || appointment.services?.[0]?.staffName || 'No staff'}
                  size="lg"
                  gradient
                  showStatus
                  status="online"
                  colorIndex={0}
                />
                <div>
                  <p className="font-semibold text-gray-900">{appointment.staffName || appointment.services?.[0]?.staffName || 'No staff assigned'}</p>
                  <p className="text-sm text-gray-600">Technician</p>
                </div>
              </div>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">SERVICES</h3>
              <div className="space-y-3">
                {appointment.services.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg border border-gray-200/50">
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
                <div className="p-3 bg-amber-50 border-l-4 border-amber-400 rounded-lg">
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
                    className="w-full pl-10 pr-4 py-3 border-2 border-brand-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 resize-none transition-all"
                  />
                </div>
              )}
            </div>

            {/* Source */}
            <div className="text-sm text-gray-500">
              <span className="font-medium">Source:</span> {appointment.source === 'online' ? 'Online Booking' : 'Walk-in'}
            </div>
          </div>

          {/* Footer - Actions - Premium buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-4 border-t border-gray-200/50 bg-white/50 backdrop-blur-sm">
            <div className="flex flex-wrap gap-2">
              {appointment.status === 'scheduled' && (
                <PremiumButton
                  variant="primary"
                  size="md"
                  icon={<Check className="w-4 h-4" />}
                  onClick={() => handleStatusChange('checked-in')}
                >
                  Check In
                </PremiumButton>
              )}

              {appointment.status === 'checked-in' && (
                <PremiumButton
                  variant="primary"
                  size="md"
                  icon={<Clock className="w-4 h-4" />}
                  onClick={() => handleStatusChange('in-service')}
                >
                  Start Service
                </PremiumButton>
              )}

              {appointment.status === 'in-service' && (
                <PremiumButton
                  variant="primary"
                  size="md"
                  icon={<Check className="w-4 h-4" />}
                  onClick={() => handleStatusChange('completed')}
                >
                  Complete
                </PremiumButton>
              )}

              {onEdit && (
                <PremiumButton
                  variant="secondary"
                  size="md"
                  icon={<Edit2 className="w-4 h-4" />}
                  onClick={() => {
                    onEdit(appointment);
                    onClose();
                  }}
                >
                  Edit
                </PremiumButton>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {appointment.status !== 'cancelled' && appointment.status !== 'no-show' && (
                <>
                  {onNoShow && (
                    <PremiumButton
                      variant="ghost"
                      size="md"
                      onClick={() => {
                        onNoShow(appointment.id);
                        onClose();
                      }}
                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    >
                      No Show
                    </PremiumButton>
                  )}
                  {onCancel && (
                    <PremiumButton
                      variant="ghost"
                      size="md"
                      onClick={() => {
                        onCancel(appointment.id);
                        onClose();
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Cancel
                    </PremiumButton>
                  )}
                </>
              )}

              {onDelete && (
                <PremiumButton
                  variant="secondary"
                  size="md"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete
                </PremiumButton>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete Appointment"
          message={`Are you sure you want to delete this appointment for ${appointment.clientName}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          loading={isDeleting}
        />
      </>
  );
}
