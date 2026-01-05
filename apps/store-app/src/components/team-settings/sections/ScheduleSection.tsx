import React, { useState, useCallback, useMemo } from 'react';
import type { WorkingHoursSettings, WorkingDay, Shift } from '../types';
import { dayNames, dayNamesShort } from '../constants';
import { Card, SectionHeader, Toggle, Button, Badge, Modal } from '../components/SharedComponents';
import { TimeOffModal } from '../components/TimeOffModal';
import { ScheduleOverrideModal } from '../components/ScheduleOverrideModal';
import {
  useStaffTimeOffRequests,
  useStaffBlockedTimeEntries,
  useTimeOffRequestMutations,
  useBlockedTimeEntryMutations,
} from '@/hooks/useSchedule';
import { useScheduleContext } from '../hooks/useScheduleContext';
import { isValidTimeFormat } from '../validation/validate';
import type { TimeOffRequest as ScheduleTimeOffRequest, BlockedTimeEntry } from '@/types/schedule';

interface ScheduleSectionProps {
  workingHours: WorkingHoursSettings;
  memberId: string;
  memberName: string;
  onChange: (workingHours: WorkingHoursSettings) => void;
}

interface ShiftError {
  dayOfWeek: number;
  shiftIndex: number;
  field: 'startTime' | 'endTime';
  message: string;
}

export const ScheduleSection: React.FC<ScheduleSectionProps> = ({ workingHours, memberId, memberName, onChange }) => {
  const context = useScheduleContext();

  // Get data from unified schedule database
  const { requests: timeOffRequests } = useStaffTimeOffRequests(memberId);
  const { entries: blockedTimeEntries } = useStaffBlockedTimeEntries(memberId);
  const { cancel: cancelTimeOffRequest } = useTimeOffRequestMutations(context || {
    userId: '',
    userName: '',
    storeId: '',
    tenantId: '',
    deviceId: '',
  });
  const { remove: removeBlockedTime } = useBlockedTimeEntryMutations(context || {
    userId: '',
    userName: '',
    storeId: '',
    tenantId: '',
    deviceId: '',
  });

  // Tab state
  const [activeTab, setActiveTab] = useState<'regular' | 'timeoff' | 'overrides'>('regular');

  // Modal states
  const [showTimeOffModal, setShowTimeOffModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [editingTimeOff, setEditingTimeOff] = useState<ScheduleTimeOffRequest | undefined>(undefined);
  const [editingBlockedTime, setEditingBlockedTime] = useState<BlockedTimeEntry | undefined>(undefined);

  // Delete confirmation states
  const [deleteTimeOffId, setDeleteTimeOffId] = useState<string | null>(null);
  const [deleteBlockedTimeId, setDeleteBlockedTimeId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Action menu states
  const [openTimeOffMenu, setOpenTimeOffMenu] = useState<string | null>(null);
  const [openBlockedTimeMenu, setOpenBlockedTimeMenu] = useState<string | null>(null);

  // Validation errors
  const [shiftErrors, setShiftErrors] = useState<ShiftError[]>([]);

  // Validate a shift
  const validateShift = useCallback((
    dayOfWeek: number,
    shiftIndex: number,
    startTime: string,
    endTime: string,
    allShifts: Shift[]
  ): ShiftError[] => {
    const errors: ShiftError[] = [];

    // Format validation
    if (!isValidTimeFormat(startTime)) {
      errors.push({ dayOfWeek, shiftIndex, field: 'startTime', message: 'Use HH:mm format' });
    }
    if (!isValidTimeFormat(endTime)) {
      errors.push({ dayOfWeek, shiftIndex, field: 'endTime', message: 'Use HH:mm format' });
    }

    // End > Start validation
    if (startTime >= endTime) {
      errors.push({ dayOfWeek, shiftIndex, field: 'endTime', message: 'End must be after start' });
    }

    // Overlap validation
    allShifts.forEach((otherShift, otherIndex) => {
      if (otherIndex !== shiftIndex) {
        const overlaps =
          (startTime >= otherShift.startTime && startTime < otherShift.endTime) ||
          (endTime > otherShift.startTime && endTime <= otherShift.endTime) ||
          (startTime <= otherShift.startTime && endTime >= otherShift.endTime);

        if (overlaps) {
          errors.push({ dayOfWeek, shiftIndex, field: 'startTime', message: `Overlaps shift ${otherIndex + 1}` });
        }
      }
    });

    return errors;
  }, []);

  // Get error for a specific shift field
  const getShiftError = useCallback((dayOfWeek: number, shiftIndex: number, field: 'startTime' | 'endTime'): string | undefined => {
    return shiftErrors.find(e => e.dayOfWeek === dayOfWeek && e.shiftIndex === shiftIndex && e.field === field)?.message;
  }, [shiftErrors]);

  const updateRegularHours = useCallback((dayOfWeek: number, updates: Partial<WorkingDay>) => {
    onChange({
      ...workingHours,
      regularHours: workingHours.regularHours.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, ...updates } : day
      ),
    });
  }, [workingHours, onChange]);

  const updateShift = useCallback((dayOfWeek: number, shiftIndex: number, field: 'startTime' | 'endTime', value: string) => {
    const day = workingHours.regularHours.find((d) => d.dayOfWeek === dayOfWeek);
    if (!day) return;

    const newShifts = [...day.shifts];
    newShifts[shiftIndex] = { ...newShifts[shiftIndex], [field]: value };

    // Validate the shift
    const errors = validateShift(dayOfWeek, shiftIndex,
      field === 'startTime' ? value : newShifts[shiftIndex].startTime,
      field === 'endTime' ? value : newShifts[shiftIndex].endTime,
      newShifts
    );

    // Update errors - remove old errors for this day/shift/field and add new ones
    setShiftErrors(prev => {
      const filtered = prev.filter(e => !(e.dayOfWeek === dayOfWeek && e.shiftIndex === shiftIndex && e.field === field));
      return [...filtered, ...errors.filter(e => e.field === field)];
    });

    updateRegularHours(dayOfWeek, { shifts: newShifts });
  }, [workingHours.regularHours, updateRegularHours, validateShift]);

  const addShift = useCallback((dayOfWeek: number) => {
    const day = workingHours.regularHours.find((d) => d.dayOfWeek === dayOfWeek);
    if (!day || day.shifts.length >= 3) return; // Max 3 shifts

    const lastShift = day.shifts[day.shifts.length - 1];
    const newStart = lastShift ? addHours(lastShift.endTime, 1) : '09:00';
    const newEnd = addHours(newStart, 4);

    updateRegularHours(dayOfWeek, {
      shifts: [...day.shifts, { startTime: newStart, endTime: newEnd }],
    });
  }, [workingHours.regularHours, updateRegularHours]);

  const removeShift = useCallback((dayOfWeek: number, shiftIndex: number) => {
    const day = workingHours.regularHours.find((d) => d.dayOfWeek === dayOfWeek);
    if (!day) return;

    const newShifts = day.shifts.filter((_, i) => i !== shiftIndex);

    // Clear errors for this shift
    setShiftErrors(prev => prev.filter(e => !(e.dayOfWeek === dayOfWeek && e.shiftIndex === shiftIndex)));

    updateRegularHours(dayOfWeek, {
      shifts: newShifts,
      isWorking: newShifts.length > 0,
    });
  }, [workingHours.regularHours, updateRegularHours]);

  const copyToAllDays = useCallback((sourceDayOfWeek: number) => {
    const sourceDay = workingHours.regularHours.find((d) => d.dayOfWeek === sourceDayOfWeek);
    if (!sourceDay) return;

    onChange({
      ...workingHours,
      regularHours: workingHours.regularHours.map((day) =>
        day.dayOfWeek === 0 || day.dayOfWeek === 6
          ? day // Don't copy to weekends
          : { ...day, shifts: [...sourceDay.shifts], isWorking: sourceDay.isWorking }
      ),
    });
  }, [workingHours, onChange]);

  const addHours = (time: string, hours: number): string => {
    const [h, m] = time.split(':').map(Number);
    const newH = Math.min(23, h + hours);
    return `${newH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  // Delete handlers
  const handleDeleteTimeOff = useCallback(async () => {
    if (!deleteTimeOffId || !context) return;
    setIsDeleting(true);
    try {
      await cancelTimeOffRequest(deleteTimeOffId);
      setDeleteTimeOffId(null);
    } catch (error) {
      console.error('Failed to cancel time off:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [cancelTimeOffRequest, deleteTimeOffId, context]);

  const handleDeleteBlockedTime = useCallback(async () => {
    if (!deleteBlockedTimeId || !context) return;
    setIsDeleting(true);
    try {
      await removeBlockedTime(deleteBlockedTimeId);
      setDeleteBlockedTimeId(null);
    } catch (error) {
      console.error('Failed to delete blocked time:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [removeBlockedTime, deleteBlockedTimeId, context]);

  // Calculate total weekly hours
  const totalWeeklyHours = useMemo(() => {
    return workingHours.regularHours.reduce((total, day) => {
      if (!day.isWorking) return total;
      return total + day.shifts.reduce((dayTotal, shift) => {
        const [startH, startM] = shift.startTime.split(':').map(Number);
        const [endH, endM] = shift.endTime.split(':').map(Number);
        return dayTotal + (endH + endM / 60) - (startH + startM / 60);
      }, 0);
    }, 0);
  }, [workingHours.regularHours]);

  // Sort time off requests by date (newest first)
  const sortedTimeOffRequests = useMemo(() => {
    return [...timeOffRequests].sort((a, b) =>
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  }, [timeOffRequests]);

  // Sort blocked time entries by date (upcoming first)
  const sortedBlockedTimeEntries = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return [...blockedTimeEntries]
      .filter(e => e.startDateTime.split('T')[0] >= today) // Only show upcoming
      .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
  }, [blockedTimeEntries]);

  // Count pending requests
  const pendingRequestsCount = useMemo(() => {
    return timeOffRequests.filter(r => r.status === 'pending').length;
  }, [timeOffRequests]);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card padding="md" className="text-center">
          <p className="text-2xl font-bold text-cyan-600">
            {workingHours.regularHours.filter((d) => d.isWorking).length}
          </p>
          <p className="text-sm text-gray-500">Working Days</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-2xl font-bold text-gray-900">{totalWeeklyHours.toFixed(1)}</p>
          <p className="text-sm text-gray-500">Hours / Week</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-2xl font-bold text-amber-600">
            {pendingRequestsCount}
          </p>
          <p className="text-sm text-gray-500">Pending Requests</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg" role="tablist">
        {[
          { id: 'regular', label: 'Regular Hours', icon: <ClockIcon className="w-4 h-4" /> },
          { id: 'timeoff', label: 'Time Off', icon: <CalendarIcon className="w-4 h-4" /> },
          { id: 'overrides', label: 'Blocked Time', icon: <EditIcon className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium
              transition-all duration-200
              ${activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Regular Hours Tab */}
      {activeTab === 'regular' && (
        <Card padding="none">
          <div className="p-4 border-b border-gray-100">
            <SectionHeader
              title="Regular Working Hours"
              subtitle="Set the weekly schedule for this team member"
              icon={<ClockIcon className="w-5 h-5" />}
            />
          </div>

          <div className="divide-y divide-gray-100">
            {workingHours.regularHours.map((day) => (
              <div
                key={day.dayOfWeek}
                className={`p-4 ${!day.isWorking ? 'bg-gray-50/50' : ''}`}
              >
                <div className="flex items-start gap-4">
                  {/* Day Toggle */}
                  <div className="w-32 flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <Toggle
                        enabled={day.isWorking}
                        onChange={(enabled) =>
                          updateRegularHours(day.dayOfWeek, {
                            isWorking: enabled,
                            shifts: enabled && day.shifts.length === 0
                              ? [{ startTime: '09:00', endTime: '18:00' }]
                              : day.shifts,
                          })
                        }
                        size="sm"
                      />
                      <span className={`font-medium ${day.isWorking ? 'text-gray-900' : 'text-gray-400'}`}>
                        {dayNames[day.dayOfWeek]}
                      </span>
                    </div>
                  </div>

                  {/* Shifts */}
                  <div className="flex-1">
                    {day.isWorking ? (
                      <div className="space-y-2">
                        {day.shifts.map((shift, index) => {
                          const startError = getShiftError(day.dayOfWeek, index, 'startTime');
                          const endError = getShiftError(day.dayOfWeek, index, 'endTime');

                          return (
                            <div key={index}>
                              <div className="flex items-center gap-2">
                                <div>
                                  <input
                                    type="time"
                                    value={shift.startTime}
                                    onChange={(e) => updateShift(day.dayOfWeek, index, 'startTime', e.target.value)}
                                    className={`px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                                      startError ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                    }`}
                                    aria-label={`${dayNames[day.dayOfWeek]} shift ${index + 1} start time`}
                                  />
                                </div>
                                <span className="text-gray-400">to</span>
                                <div>
                                  <input
                                    type="time"
                                    value={shift.endTime}
                                    onChange={(e) => updateShift(day.dayOfWeek, index, 'endTime', e.target.value)}
                                    className={`px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                                      endError ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                    }`}
                                    aria-label={`${dayNames[day.dayOfWeek]} shift ${index + 1} end time`}
                                  />
                                </div>
                                {day.shifts.length > 1 && (
                                  <button
                                    onClick={() => removeShift(day.dayOfWeek, index)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    aria-label={`Remove shift ${index + 1}`}
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                )}
                                {index === day.shifts.length - 1 && day.shifts.length < 3 && (
                                  <button
                                    onClick={() => addShift(day.dayOfWeek)}
                                    className="p-1.5 text-gray-400 hover:text-cyan-500 hover:bg-cyan-50 rounded-lg transition-colors"
                                    aria-label="Add another shift"
                                  >
                                    <PlusIcon className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                              {/* Error messages */}
                              {(startError || endError) && (
                                <p className="mt-1 text-xs text-red-500" role="alert">
                                  {startError || endError}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Day off</span>
                    )}
                  </div>

                  {/* Copy Action */}
                  {day.isWorking && day.dayOfWeek >= 1 && day.dayOfWeek <= 5 && (
                    <button
                      onClick={() => copyToAllDays(day.dayOfWeek)}
                      className="text-xs text-cyan-600 hover:text-cyan-700 whitespace-nowrap"
                    >
                      Copy to weekdays
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Break Settings */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Auto-schedule Breaks</h4>
                <p className="text-sm text-gray-500 mt-0.5">
                  Automatically add {workingHours.defaultBreakDuration} min breaks to shifts
                </p>
              </div>
              <Toggle
                enabled={workingHours.autoScheduleBreaks}
                onChange={(enabled) => onChange({ ...workingHours, autoScheduleBreaks: enabled })}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Time Off Tab */}
      {activeTab === 'timeoff' && (
        <div className="space-y-4">
          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Time Off Requests</h3>
                <p className="text-sm text-gray-500">Manage vacation, sick days, and personal time</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={<PlusIcon className="w-4 h-4" />}
                onClick={() => {
                  setEditingTimeOff(undefined);
                  setShowTimeOffModal(true);
                }}
              >
                Request Time Off
              </Button>
            </div>
          </Card>

          {sortedTimeOffRequests.length === 0 ? (
            <Card padding="lg">
              <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No time off requests</p>
                <p className="text-sm text-gray-400 mt-1">
                  Time off requests will appear here
                </p>
              </div>
            </Card>
          ) : (
            <Card padding="none">
              <div className="divide-y divide-gray-100">
                {sortedTimeOffRequests.map((request) => (
                  <TimeOffRow
                    key={request.id}
                    request={request}
                    isMenuOpen={openTimeOffMenu === request.id}
                    onToggleMenu={() => setOpenTimeOffMenu(openTimeOffMenu === request.id ? null : request.id)}
                    onDelete={() => {
                      setDeleteTimeOffId(request.id);
                      setOpenTimeOffMenu(null);
                    }}
                  />
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Blocked Time Tab */}
      {activeTab === 'overrides' && (
        <div className="space-y-4">
          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Blocked Time</h3>
                <p className="text-sm text-gray-500">One-time or recurring schedule blocks</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={<PlusIcon className="w-4 h-4" />}
                onClick={() => {
                  setEditingBlockedTime(undefined);
                  setShowOverrideModal(true);
                }}
              >
                Block Time
              </Button>
            </div>
          </Card>

          {sortedBlockedTimeEntries.length === 0 ? (
            <Card padding="lg">
              <div className="text-center py-8">
                <EditIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No upcoming blocked time</p>
                <p className="text-sm text-gray-400 mt-1">
                  Add blocked time for meetings, training, etc.
                </p>
              </div>
            </Card>
          ) : (
            <Card padding="none">
              <div className="divide-y divide-gray-100">
                {sortedBlockedTimeEntries.map((entry) => (
                  <BlockedTimeRow
                    key={entry.id}
                    entry={entry}
                    isMenuOpen={openBlockedTimeMenu === entry.id}
                    onToggleMenu={() => setOpenBlockedTimeMenu(openBlockedTimeMenu === entry.id ? null : entry.id)}
                    onEdit={() => {
                      setEditingBlockedTime(entry);
                      setShowOverrideModal(true);
                      setOpenBlockedTimeMenu(null);
                    }}
                    onDelete={() => {
                      setDeleteBlockedTimeId(entry.id);
                      setOpenBlockedTimeMenu(null);
                    }}
                  />
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Visual Schedule Preview */}
      <Card padding="lg">
        <SectionHeader
          title="Weekly Overview"
          subtitle="Visual representation of the schedule"
          icon={<CalendarIcon className="w-5 h-5" />}
        />

        <div className="mt-4 grid grid-cols-7 gap-2">
          {workingHours.regularHours.map((day) => (
            <div key={day.dayOfWeek} className="text-center">
              <div className="text-xs font-medium text-gray-500 mb-2">
                {dayNamesShort[day.dayOfWeek]}
              </div>
              <div
                className={`
                  h-24 rounded-lg flex flex-col items-center justify-center
                  ${day.isWorking
                    ? 'bg-cyan-50 border-2 border-cyan-200'
                    : 'bg-gray-100 border-2 border-gray-200'
                  }
                `}
              >
                {day.isWorking ? (
                  day.shifts.map((shift, i) => (
                    <span key={i} className="text-xs text-cyan-700">
                      {shift.startTime}-{shift.endTime}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400">Off</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Time Off Modal */}
      <TimeOffModal
        isOpen={showTimeOffModal}
        onClose={() => {
          setShowTimeOffModal(false);
          setEditingTimeOff(undefined);
        }}
        memberId={memberId}
        memberName={memberName}
        existingRequest={editingTimeOff}
      />

      {/* Schedule Override Modal */}
      <ScheduleOverrideModal
        isOpen={showOverrideModal}
        onClose={() => {
          setShowOverrideModal(false);
          setEditingBlockedTime(undefined);
        }}
        memberId={memberId}
        memberName={memberName}
        existingEntry={editingBlockedTime}
      />

      {/* Delete Time Off Confirmation */}
      {deleteTimeOffId && (
        <Modal
          title="Cancel Time Off Request"
          onClose={() => setDeleteTimeOffId(null)}
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to cancel this time off request? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteTimeOffId(null)} disabled={isDeleting}>
                Keep Request
              </Button>
              <Button variant="danger" onClick={handleDeleteTimeOff} disabled={isDeleting}>
                {isDeleting ? 'Canceling...' : 'Cancel Request'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Blocked Time Confirmation */}
      {deleteBlockedTimeId && (
        <Modal
          title="Delete Blocked Time"
          onClose={() => setDeleteBlockedTimeId(null)}
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete this blocked time? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteBlockedTimeId(null)} disabled={isDeleting}>
                Keep
              </Button>
              <Button variant="danger" onClick={handleDeleteBlockedTime} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// Time Off Row Component
interface TimeOffRowProps {
  request: ScheduleTimeOffRequest;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onDelete: () => void;
}

const TimeOffRow: React.FC<TimeOffRowProps> = ({ request, isMenuOpen, onToggleMenu, onDelete }) => {
  const statusColors = {
    pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: '#FFA726' },
    approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: '#66BB6A' },
    denied: { bg: 'bg-red-50', text: 'text-red-700', dot: '#EF5350' },
    cancelled: { bg: 'bg-gray-50', text: 'text-gray-700', dot: '#9E9E9E' },
  };

  const canCancel = request.status === 'pending';

  return (
    <div className="p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center text-xl">
        {request.typeEmoji}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{request.typeName}</span>
          <Badge
            variant={request.status === 'approved' ? 'success' : request.status === 'denied' ? 'error' : request.status === 'cancelled' ? 'default' : 'warning'}
            dot
            dotColor={statusColors[request.status]?.dot}
            size="sm"
          >
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </Badge>
        </div>
        <p className="text-sm text-gray-500 mt-0.5">
          {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
          {!request.isAllDay && request.startTime && request.endTime && (
            <span className="ml-2 text-gray-400">
              {request.startTime} - {request.endTime}
            </span>
          )}
        </p>
        {request.notes && (
          <p className="text-sm text-gray-400 mt-1 truncate max-w-xs">{request.notes}</p>
        )}
      </div>
      {canCancel && (
        <div className="relative">
          <button
            onClick={onToggleMenu}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Actions menu"
          >
            <DotsIcon className="w-5 h-5" />
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              <button
                onClick={onDelete}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                Cancel Request
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Blocked Time Row Component
interface BlockedTimeRowProps {
  entry: BlockedTimeEntry;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const BlockedTimeRow: React.FC<BlockedTimeRowProps> = ({ entry, isMenuOpen, onToggleMenu, onEdit, onDelete }) => {
  const startDate = new Date(entry.startDateTime);
  const endDate = new Date(entry.endDateTime);

  const frequencyLabels: Record<string, string> = {
    once: 'One-time',
    daily: 'Daily',
    weekly: 'Weekly',
    biweekly: 'Every 2 weeks',
    monthly: 'Monthly',
  };

  return (
    <div className="p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: `${entry.typeColor}20` }}>
        {entry.typeEmoji}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{entry.typeName}</span>
          {entry.frequency !== 'once' && (
            <Badge variant="default" size="sm">
              {frequencyLabels[entry.frequency]}
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-0.5">
          {startDate.toLocaleDateString()}
          <span className="ml-2 text-gray-400">
            {startDate.toTimeString().slice(0, 5)} - {endDate.toTimeString().slice(0, 5)}
          </span>
        </p>
        {entry.notes && (
          <p className="text-sm text-gray-400 mt-1">{entry.notes}</p>
        )}
      </div>
      <div className="relative">
        <button
          onClick={onToggleMenu}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Actions menu"
        >
          <DotsIcon className="w-5 h-5" />
        </button>
        {isMenuOpen && (
          <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
            <button
              onClick={onEdit}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Icons
const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const EditIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const DotsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
);

export default ScheduleSection;
