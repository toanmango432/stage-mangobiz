import React, { useState } from 'react';
import type { WorkingHoursSettings, WorkingDay, TimeOffRequest, ScheduleOverride } from '../types';
import { dayNames, dayNamesShort } from '../constants';
import { Card, SectionHeader, Toggle, Button, Badge, Input, Select } from '../components/SharedComponents';

interface ScheduleSectionProps {
  workingHours: WorkingHoursSettings;
  onChange: (workingHours: WorkingHoursSettings) => void;
}

export const ScheduleSection: React.FC<ScheduleSectionProps> = ({ workingHours, onChange }) => {
  const [activeTab, setActiveTab] = useState<'regular' | 'timeoff' | 'overrides'>('regular');
  const [showAddTimeOff, setShowAddTimeOff] = useState(false);
  const [showAddOverride, setShowAddOverride] = useState(false);

  const updateRegularHours = (dayOfWeek: number, updates: Partial<WorkingDay>) => {
    onChange({
      ...workingHours,
      regularHours: workingHours.regularHours.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, ...updates } : day
      ),
    });
  };

  const updateShift = (dayOfWeek: number, shiftIndex: number, field: 'startTime' | 'endTime', value: string) => {
    const day = workingHours.regularHours.find((d) => d.dayOfWeek === dayOfWeek);
    if (!day) return;

    const newShifts = [...day.shifts];
    newShifts[shiftIndex] = { ...newShifts[shiftIndex], [field]: value };
    updateRegularHours(dayOfWeek, { shifts: newShifts });
  };

  const addShift = (dayOfWeek: number) => {
    const day = workingHours.regularHours.find((d) => d.dayOfWeek === dayOfWeek);
    if (!day) return;

    const lastShift = day.shifts[day.shifts.length - 1];
    const newStart = lastShift ? addHours(lastShift.endTime, 1) : '09:00';
    const newEnd = addHours(newStart, 4);

    updateRegularHours(dayOfWeek, {
      shifts: [...day.shifts, { startTime: newStart, endTime: newEnd }],
    });
  };

  const removeShift = (dayOfWeek: number, shiftIndex: number) => {
    const day = workingHours.regularHours.find((d) => d.dayOfWeek === dayOfWeek);
    if (!day) return;

    const newShifts = day.shifts.filter((_, i) => i !== shiftIndex);
    updateRegularHours(dayOfWeek, {
      shifts: newShifts,
      isWorking: newShifts.length > 0,
    });
  };

  const copyToAllDays = (sourceDayOfWeek: number) => {
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
  };

  const addHours = (time: string, hours: number): string => {
    const [h, m] = time.split(':').map(Number);
    const newH = Math.min(23, h + hours);
    return `${newH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  // Calculate total weekly hours
  const totalWeeklyHours = workingHours.regularHours.reduce((total, day) => {
    if (!day.isWorking) return total;
    return total + day.shifts.reduce((dayTotal, shift) => {
      const [startH, startM] = shift.startTime.split(':').map(Number);
      const [endH, endM] = shift.endTime.split(':').map(Number);
      return dayTotal + (endH + endM / 60) - (startH + startM / 60);
    }, 0);
  }, 0);

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
            {workingHours.timeOffRequests.filter((r) => r.status === 'pending').length}
          </p>
          <p className="text-sm text-gray-500">Pending Requests</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        {[
          { id: 'regular', label: 'Regular Hours', icon: <ClockIcon className="w-4 h-4" /> },
          { id: 'timeoff', label: 'Time Off', icon: <CalendarIcon className="w-4 h-4" /> },
          { id: 'overrides', label: 'Overrides', icon: <EditIcon className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
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
                        {day.shifts.map((shift, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              type="time"
                              value={shift.startTime}
                              onChange={(e) => updateShift(day.dayOfWeek, index, 'startTime', e.target.value)}
                              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            <span className="text-gray-400">to</span>
                            <input
                              type="time"
                              value={shift.endTime}
                              onChange={(e) => updateShift(day.dayOfWeek, index, 'endTime', e.target.value)}
                              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            {day.shifts.length > 1 && (
                              <button
                                onClick={() => removeShift(day.dayOfWeek, index)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            )}
                            {index === day.shifts.length - 1 && (
                              <button
                                onClick={() => addShift(day.dayOfWeek)}
                                className="p-1.5 text-gray-400 hover:text-cyan-500 hover:bg-cyan-50 rounded-lg transition-colors"
                              >
                                <PlusIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
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
                onClick={() => setShowAddTimeOff(true)}
              >
                Add Time Off
              </Button>
            </div>
          </Card>

          {workingHours.timeOffRequests.length === 0 ? (
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
                {workingHours.timeOffRequests.map((request) => (
                  <TimeOffRow key={request.id} request={request} />
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Schedule Overrides Tab */}
      {activeTab === 'overrides' && (
        <div className="space-y-4">
          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Schedule Overrides</h3>
                <p className="text-sm text-gray-500">One-time changes to regular hours</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={<PlusIcon className="w-4 h-4" />}
                onClick={() => setShowAddOverride(true)}
              >
                Add Override
              </Button>
            </div>
          </Card>

          {workingHours.scheduleOverrides.length === 0 ? (
            <Card padding="lg">
              <div className="text-center py-8">
                <EditIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No schedule overrides</p>
                <p className="text-sm text-gray-400 mt-1">
                  Add overrides for specific dates
                </p>
              </div>
            </Card>
          ) : (
            <Card padding="none">
              <div className="divide-y divide-gray-100">
                {workingHours.scheduleOverrides.map((override) => (
                  <OverrideRow key={override.id} override={override} />
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
    </div>
  );
};

// Time Off Row Component
const TimeOffRow: React.FC<{ request: TimeOffRequest }> = ({ request }) => {
  const statusColors = {
    pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: '#FFA726' },
    approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: '#66BB6A' },
    denied: { bg: 'bg-red-50', text: 'text-red-700', dot: '#EF5350' },
  };

  const typeLabels = {
    vacation: 'Vacation',
    sick: 'Sick Leave',
    personal: 'Personal',
    unpaid: 'Unpaid Leave',
    other: 'Other',
  };

  return (
    <div className="p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center text-cyan-600">
        <CalendarIcon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{typeLabels[request.type]}</span>
          <Badge
            variant={request.status === 'approved' ? 'success' : request.status === 'denied' ? 'error' : 'warning'}
            dot
            dotColor={statusColors[request.status].dot}
            size="sm"
          >
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </Badge>
        </div>
        <p className="text-sm text-gray-500 mt-0.5">
          {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
        </p>
      </div>
      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
        <DotsIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

// Override Row Component
const OverrideRow: React.FC<{ override: ScheduleOverride }> = ({ override }) => {
  const typeLabels = {
    day_off: 'Day Off',
    custom_hours: 'Custom Hours',
    extra_day: 'Extra Day',
  };

  const typeColors = {
    day_off: 'bg-red-100 text-red-600',
    custom_hours: 'bg-amber-100 text-amber-600',
    extra_day: 'bg-emerald-100 text-emerald-600',
  };

  return (
    <div className="p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeColors[override.type]}`}>
        <EditIcon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{typeLabels[override.type]}</span>
        </div>
        <p className="text-sm text-gray-500 mt-0.5">
          {new Date(override.date).toLocaleDateString()}
          {override.customShifts && override.customShifts.length > 0 && (
            <span className="ml-2 text-gray-400">
              {override.customShifts.map((s) => `${s.startTime}-${s.endTime}`).join(', ')}
            </span>
          )}
        </p>
      </div>
      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
        <DotsIcon className="w-5 h-5" />
      </button>
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
