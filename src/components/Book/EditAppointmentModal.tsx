/**
 * Edit Appointment Modal
 * Complete appointment editing functionality with conflict detection
 */

import { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, CheckCircle2, Calendar, Clock, User, Users, Phone } from 'lucide-react';
import { cn } from '../../lib/utils';
import { LocalAppointment } from '../../types/appointment';
import { useAppSelector } from '../../store/hooks';
import toast from 'react-hot-toast';
import { selectAllStaff } from '../../store/slices/staffSlice';
import { detectAppointmentConflicts } from '../../utils/conflictDetection';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { PremiumButton } from '../premium';

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
  const [showConflictConfirm, setShowConflictConfirm] = useState(false);

  // Form state
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [staffId, setStaffId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(0);
  const [notes, setNotes] = useState('');
  
  // Initialize form when modal opens (not on every appointment reference change)
  useEffect(() => {
    if (isOpen && appointment) {
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
  }, [isOpen, appointment?.id]);

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

  const handleSaveClick = () => {
    if (!appointment || !hasChanges) return;

    if (conflicts.length > 0) {
      // Show warning dialog
      setShowConflictConfirm(true);
      return;
    }

    handleSave();
  };

  const handleSave = async () => {
    if (!appointment || !hasChanges) return;

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
      toast.success('Appointment updated successfully');
      onClose();
    } catch (error) {
      console.error('Failed to save appointment:', error);
      toast.error('Failed to save appointment. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !appointment) return null;

  const selectedStaff = allStaff.find(s => s.id === staffId);
  const totalPrice = appointment.services.reduce((sum, s) => sum + s.price, 0);

  return (
    <>
      {/* Backdrop - Premium blur */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-md z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal - Premium glass */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={cn(
            'bg-white/95 backdrop-blur-xl rounded-2xl shadow-premium-2xl border border-gray-200/50',
            'w-full max-w-2xl max-h-[90vh]',
            'flex flex-col',
            'animate-scale-in'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Premium glass */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50 bg-white/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-premium-md">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Edit Appointment</h2>
                <p className="text-sm text-gray-600 mt-0.5">Update appointment details</p>
              </div>
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
                    className="book-input"
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
                    className="book-input"
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
                    className="book-input"
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
                    className="book-input"
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
                    className="book-input"
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
                className="book-input bg-white"
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
                className="book-input resize-none"
              />
            </div>
          </div>

          {/* Footer - Premium glass */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200/50 bg-white/50 backdrop-blur-sm">
            <PremiumButton
              variant="ghost"
              size="md"
              onClick={onClose}
            >
              Cancel
            </PremiumButton>
            <div className="flex gap-3">
              {conflicts.length === 0 && hasChanges && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  No conflicts
                </div>
              )}
              <PremiumButton
                variant="primary"
                size="md"
                icon={!isSaving ? <Save className="w-4 h-4" /> : undefined}
                onClick={handleSaveClick}
                disabled={!hasChanges || isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </PremiumButton>
            </div>
          </div>
        </div>
      </div>

      {/* Conflict Warning Dialog */}
      <ConfirmDialog
        isOpen={showConflictConfirm}
        onClose={() => setShowConflictConfirm(false)}
        onConfirm={() => {
          setShowConflictConfirm(false);
          handleSave();
        }}
        title="Conflicts Detected"
        message={`This appointment has the following conflicts:\n\n${conflicts.join('\n')}\n\nDo you want to save anyway?`}
        confirmText="Save Anyway"
        cancelText="Go Back"
        variant="warning"
        loading={isSaving}
      />
    </>
  );
}

