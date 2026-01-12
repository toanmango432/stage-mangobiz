/**
 * AppointmentSummary - Right panel showing date/time, notes, posted staff with services
 */

import { Calendar, Clock, Plus, Trash2, X, ChevronUp, ChevronDown, Zap, Layers } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { StaffWithServices } from './types';

interface AppointmentSummaryProps {
  date: Date;
  onDateChange: (date: Date) => void;
  defaultStartTime: string;
  onDefaultStartTimeChange: (time: string) => void;
  timeMode: 'sequential' | 'parallel';
  onTimeModeToggle: () => void;
  appointmentNotes: string;
  onAppointmentNotesChange: (notes: string) => void;
  postedStaff: StaffWithServices[];
  activeStaffId: string | null;
  onToggleStaffExpanded: (staffId: string) => void;
  onToggleStaffRequested: (staffId: string) => void;
  onRemoveStaff: (staffId: string) => void;
  onRemoveService: (staffId: string, serviceId: string) => void;
  onUpdateServiceTime: (staffId: string, serviceId: string, newStartTime: string) => void;
  onAddAnotherStaff: () => void;
}

export function AppointmentSummary({
  date,
  onDateChange,
  defaultStartTime,
  onDefaultStartTimeChange,
  timeMode,
  onTimeModeToggle,
  appointmentNotes,
  onAppointmentNotesChange,
  postedStaff,
  activeStaffId,
  onToggleStaffExpanded,
  onToggleStaffRequested,
  onRemoveStaff,
  onRemoveService,
  onUpdateServiceTime,
  onAddAnotherStaff,
}: AppointmentSummaryProps) {
  return (
    <>
      {/* Date & Time */}
      <div className="p-5 border-b border-gray-100 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Date</label>
            <input
              type="date"
              value={date.toISOString().split('T')[0]}
              onChange={(e) => onDateChange(new Date(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Time</label>
            <input
              type="time"
              value={defaultStartTime}
              onChange={(e) => onDefaultStartTimeChange(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>
        </div>

        {/* Sequential/Parallel Toggle */}
        <div className="flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg">
          <span className="text-xs text-gray-600">Service timing</span>
          <button
            onClick={onTimeModeToggle}
            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-all"
            title={timeMode === 'sequential' ? 'Sequential: One after another' : 'Parallel: All at same time'}
          >
            {timeMode === 'sequential' ? <Zap className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
            <span className="capitalize">{timeMode}</span>
          </button>
        </div>
      </div>

      {/* Notes */}
      <div className="p-5 border-b border-gray-100">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Notes / Special Requests
        </label>
        <textarea
          value={appointmentNotes}
          onChange={(e) => onAppointmentNotesChange(e.target.value)}
          placeholder="Any special requests, preferences, or important notes..."
          rows={2}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
        />
      </div>

      {/* Posted Services */}
      <div className="flex-1 overflow-y-auto p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center justify-between">
          <span>Appointment Summary</span>
          {postedStaff.length > 0 && (
            <span className="text-xs font-normal text-gray-500">
              {postedStaff.reduce((sum, s) => sum + s.services.length, 0)} service{postedStaff.reduce((sum, s) => sum + s.services.length, 0) !== 1 ? 's' : ''}
            </span>
          )}
        </h3>

        {postedStaff.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
              <Calendar className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 mb-1">No services added yet</p>
            <p className="text-xs text-gray-400">Select a staff member and add services</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {postedStaff.map(staff => (
              <div
                key={staff.staffId}
                className={cn(
                  'rounded-lg overflow-hidden border transition-all',
                  activeStaffId === staff.staffId
                    ? 'border-brand-500 shadow-sm ring-1 ring-brand-500/20'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-between p-3 cursor-pointer transition-all',
                    activeStaffId === staff.staffId ? 'bg-brand-50/50' : 'bg-white hover:bg-gray-50'
                  )}
                  onClick={() => onToggleStaffExpanded(staff.staffId)}
                >
                  <div className="flex items-center gap-2.5 flex-1">
                    <div className="w-8 h-8 rounded-md bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                      {staff.staffName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 text-sm truncate">{staff.staffName}</p>
                        {staff.isRequested && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium text-brand-700 bg-brand-100 rounded">
                            Requested
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {staff.services.length} svc{staff.services.length > 0 && ` • ${staff.services.reduce((sum, s) => sum + s.duration, 0)}m • $${staff.services.reduce((sum, s) => sum + s.price, 0)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveStaff(staff.staffId);
                      }}
                      className="p-1.5 rounded-md hover:bg-red-50 transition-all"
                      title="Remove staff"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                    {staff.isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Requested Checkbox */}
                {staff.isExpanded && (
                  <div className="px-3 pb-2 pt-1">
                    <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer hover:text-gray-900 transition-colors">
                      <input
                        type="checkbox"
                        checked={staff.isRequested || false}
                        onChange={(e) => {
                          e.stopPropagation();
                          onToggleStaffRequested(staff.staffId);
                        }}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-brand-600 focus:ring-2 focus:ring-brand-500/20"
                      />
                      <span>Client requested this staff</span>
                    </label>
                  </div>
                )}

                {/* Services List */}
                {staff.isExpanded && staff.services.length > 0 && (
                  <div className="p-2.5 space-y-1.5 bg-gray-50/50">
                    {staff.services.map(service => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between p-2.5 bg-white rounded-md border border-gray-100 hover:border-gray-200 transition-all group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-xs mb-1 truncate">{service.name}</p>
                          <div className="flex items-center gap-2.5 text-xs">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <input
                                type="time"
                                value={service.startTime}
                                onChange={(e) => onUpdateServiceTime(staff.staffId, service.id, e.target.value)}
                                className="text-xs text-gray-700 border-0 p-0 bg-transparent focus:ring-0 w-14 font-medium hover:text-brand-600 cursor-pointer"
                              />
                            </div>
                            <span className="text-gray-400">{service.duration}m</span>
                            <span className="font-bold text-gray-900">${service.price}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => onRemoveService(staff.staffId, service.id)}
                          className="p-1 hover:bg-red-50 rounded transition-all ml-2 opacity-0 group-hover:opacity-100"
                          title="Remove service"
                        >
                          <X className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Add Another Staff Button */}
            <button
              onClick={onAddAnotherStaff}
              className="w-full py-2.5 text-sm font-medium text-gray-600 bg-white border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 hover:border-brand-400 hover:text-brand-600 transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Another Staff
            </button>
          </div>
        )}
      </div>
    </>
  );
}
