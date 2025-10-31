/**
 * Edit Appointment Modal
 * Complete appointment editing functionality with conflict detection
 */

import { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, CheckCircle2, Calendar, Clock, User, Users, Phone } from 'lucide-react';
import { cn } from '../../lib/utils';
import { LocalAppointment } from '../../types/appointment';
import { useAppSelector } from '../../store/hooks';
import { selectAllStaff } from '../../store/slices/staffSlice';
import { detectAppointmentConflicts } from '../../utils/conflictDetection';

interface EditAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: LocalAppointment | null;
  onSave: (appointment: LocalAppointment, updates: Partial<LocalAppointment>) => Promise<void>;
  existingAppointments?: LocalAppointment[];
}

export function EditAppointmentModal({
  isOpen,
  onClose,
  appointment,
  onSave,
  existingAppointments = [],
}: EditAppointmentModalProps) {
  const allStaff = useAppSelector(selectAllStaff);
  const [isSaving, setIsSaving] = useState(false);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Form state
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [staffId, setStaffId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(0);
  const [notes, setNotes] = useState('');
  
  // Initialize form when appointment changes
  useEffect(() => {
    if (appointment) {
      setClientName(appointment.clientName);
      setClientPhone(appointment.clientPhone);
      setStaffId(appointment.staffId);
      
      const startDateObj = new Date(appointment.scheduledStartTime);
      setStartDate(startDateObj.toISOString().split('T')[0]);
      setStartTime(`${startDateObj.getHours().toString().padStart(2, '0')}:${startDateObj.getMinutes().toString().padStart(2, '0')}`);
      
      const durationMinutes = Math.round(
        (new Date(appointment.scheduledEndTime).getTime() - 
         new Date(appointment.scheduledStartTime).getTime()) / 60000
      );
      setDuration(durationMinutes);
      setNotes(appointment.notes || '');
      setHasChanges(false);
      setConflicts([]);
    }
  }, [appointment]);

  // Check for conflicts when form values change
  useEffect(() => {
    if (!appointment || !hasChanges) return;

    const newStartTime = new Date(`${startDate}T${startTime}`);
    const newEndTime = new Date(newStartTime.getTime() + duration * 60000);

    const updatedAppointment: LocalAppointment = {
      ...appointment,
      staffId,
      scheduledStartTime: newStartTime,
      scheduledEndTime: newEndTime,
    };

    const detectedConflicts = detectAppointmentConflicts(
      updatedAppointment,
      existingAppointments.filter(apt => apt.id !== appointment.id)
    );

    setConflicts(detectedConflicts);
  }, [staffId, startDate, startTime, duration, hasChanges]);

  // Track if form has changes
  useEffect(() => {
    if (!appointment) return;

    const startDateObj = new Date(appointment.scheduledStartTime);
    const formDate = startDate.split('T')[0];
    const appointmentDate = startDateObj.toISOString().split('T')[0];
    
    const formTime = startTime;
    const appointmentTime = `${startDateObj.getHours().toString().padStart(2, '0')}:${startDateObj.getMinutes().toString().padStart(2, '0')}`;

    const hasDateChange = formDate !== appointmentDate;
    const hasTimeChange = formTime !== appointmentTime;
    const hasStaffChange = staffId !== appointment.staffId;
    const hasNameChange = clientName !== appointment.clientName;
    const hasPhoneChange = clientPhone !== appointment.clientPhone;
    const hasNotesChange = notes !== (appointment.notes || '');

    setHasChanges(hasDateChange || hasTimeChange || hasStaffChange || hasNameChange || hasPhoneChange || hasNotesChange);
  }, [clientName, clientPhone, staffId, startDate, startTime, notes, appointment]);

  const handleSave = async () => {
    if (!appointment || !hasChanges) return;
    
    if (conflicts.length > 0) {
      // Show warning but allow save
      const confirmed = window.confirm(
        `Warning: This appointment has conflicts:\n\n${conflicts.join('\n')}\n\nDo you want to save anyway?`
      );
      if (!confirmed) return;
    }

    setIsSaving(true);
    try {
      const newStartTime = new Date(`${startDate}T${startTime}`);
      const newEndTime = new Date(newStartTime.getTime() + duration * 60000);

      const updates: Partial<LocalAppointment> = {
        clientName,
        clientPhone,
        staffId,
        scheduledStartTime: newStartTime,
        scheduledEndTime: newEndTime,
        notes,
      };

      await onSave(appointment, updates);
      onClose();
    } catch (error) {
      console.error('Failed to save appointment:', error);
      alert('Failed to save appointment. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !appointment) return null;

  const selectedStaff = allStaff.find(s => s.id === staffId);
  const totalPrice = appointment.services.reduce((sum, s) => sum + s.price, 0);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={cn(
            'bg-white rounded-xl shadow-2xl',
            'w-full max-w-2xl max-h-[90vh]',
            'flex flex-col',
            'animate-in fade-in zoom-in-95 duration-200'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Edit Appointment</h2>
                <p className="text-sm text-gray-500">Update appointment details</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Conflict Warnings */}
            {conflicts.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-red-900 mb-2">Conflicts Detected</h3>
                    <ul className="space-y-1">
                      {conflicts.map((conflict, idx) => (
                        <li key={idx} className="text-sm text-red-700">• {conflict}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Client Information */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                CLIENT INFORMATION
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className={cn(
                      'w-full px-4 py-3',
                      'border border-gray-300 rounded-lg',
                      'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className={cn(
                      'w-full px-4 py-3',
                      'border border-gray-300 rounded-lg',
                      'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                DATE & TIME
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={cn(
                      'w-full px-4 py-3',
                      'border border-gray-300 rounded-lg',
                      'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time *
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={cn(
                      'w-full px-4 py-3',
                      'border border-gray-300 rounded-lg',
                      'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                    min="15"
                    step="15"
                    className={cn(
                      'w-full px-4 py-3',
                      'border border-gray-300 rounded-lg',
                      'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Staff Assignment */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                STAFF ASSIGNMENT
              </h3>
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className={cn(
                  'w-full px-4 py-3',
                  'border border-gray-300 rounded-lg',
                  'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent',
                  'bg-white'
                )}
              >
                <option value="">-- Select Staff --</option>
                {allStaff.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name}
                  </option>
                ))}
              </select>
              {selectedStaff && (
                <p className="mt-2 text-sm text-gray-600">
                  Currently assigned to: <span className="font-medium">{selectedStaff.name}</span>
                </p>
              )}
            </div>

            {/* Services Summary (Read-only) */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">SERVICES</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {appointment.services.map((service, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{service.serviceName}</span>
                    <span className="font-medium text-gray-900">${service.price.toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-2 mt-2 flex items-center justify-between font-semibold">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">${totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">NOTES</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Add notes about this appointment..."
                className={cn(
                  'w-full px-4 py-3',
                  'border border-gray-300 rounded-lg',
                  'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent',
                  'resize-none'
                )}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <div className="flex gap-3">
              {conflicts.length === 0 && hasChanges && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  No conflicts
                </div>
              )}
              <button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className={cn(
                  'flex items-center gap-2 px-6 py-2 font-medium rounded-lg',
                  'bg-gradient-to-r from-orange-500 to-pink-500',
                  'text-white',
                  'hover:shadow-lg transition-all duration-200',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

