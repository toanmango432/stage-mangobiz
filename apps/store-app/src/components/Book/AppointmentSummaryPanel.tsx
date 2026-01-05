import { Calendar, Clock, Plus, Trash2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AppointmentService {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
  startTime: string;
  endTime: string;
}

interface AppointmentStaff {
  staffId: string;
  staffName: string;
  services: AppointmentService[];
  isExpanded: boolean;
  isRequested?: boolean;
}

interface AppointmentSummaryPanelProps {
  postedStaff: AppointmentStaff[];
  activeStaffId: string | null;
  totalDuration: number;
  totalPrice: number;
  validationMessage: string | null;
  canBook: boolean;
  isBooking: boolean;
  onToggleStaffRequested: (staffId: string) => void;
  onUpdateServiceTime: (staffId: string, serviceId: string, newStartTime: string) => void;
  onRemoveService: (staffId: string, serviceId: string) => void;
  onRemoveStaff: (staffId: string) => void;
  onToggleStaffExpanded: (staffId: string) => void;
  onAddAnotherStaff: () => void;
  onBook: () => void;
  onCancel: () => void;
}

export function AppointmentSummaryPanel({
  postedStaff,
  activeStaffId,
  totalDuration,
  totalPrice,
  validationMessage,
  canBook,
  isBooking,
  onToggleStaffRequested,
  onUpdateServiceTime,
  onRemoveService,
  onRemoveStaff,
  onToggleStaffExpanded,
  onAddAnotherStaff,
  onBook,
  onCancel,
}: AppointmentSummaryPanelProps) {
  return (
    <>
      {/* Posted Services - MAIN FOCUS AREA */}
      <div className="flex-1 overflow-y-auto p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center justify-between">
          <span>Appointment Summary</span>
          {postedStaff.length > 0 && (
            <span className="text-xs font-normal text-gray-500">
              {postedStaff.reduce((sum, s) => sum + s.services.length, 0)} service
              {postedStaff.reduce((sum, s) => sum + s.services.length, 0) !== 1 ? 's' : ''}
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
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {staff.staffName}
                        </p>
                        {staff.isRequested && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium text-brand-700 bg-brand-100 rounded">
                            Requested
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {staff.services.length} svc
                        {staff.services.length > 0 &&
                          ` • ${staff.services.reduce((sum, s) => sum + s.duration, 0)}m • $${staff.services
                            .reduce((sum, s) => sum + s.price, 0)
                            .toFixed(2)}`}
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
                    {staff.services.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {staff.services.map(service => (
                          <div
                            key={service.id}
                            className="flex items-center justify-between p-2.5 bg-white rounded-md border border-gray-100 hover:border-gray-200 transition-all group"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-xs mb-1 truncate">
                                {service.name}
                              </p>
                              <div className="flex items-center gap-2.5 text-xs">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-gray-400" />
                                  <input
                                    type="time"
                                    value={service.startTime}
                                    onChange={(e) =>
                                      onUpdateServiceTime(
                                        staff.staffId,
                                        service.id,
                                        e.target.value
                                      )
                                    }
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
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
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

      {/* Actions - PROMINENT & CLEAR */}
      <div className="p-5 border-t border-gray-200 space-y-3 bg-white">
        {postedStaff.some(s => s.services.length > 0) && (
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-sm font-medium text-gray-700">Total</span>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-gray-500">{totalDuration} minutes</div>
                <div className="font-bold text-gray-900 text-xl">${totalPrice}</div>
              </div>
            </div>
          </div>
        )}

        {validationMessage && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-900">{validationMessage}</p>
          </div>
        )}

        <div className="flex gap-2.5">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onBook}
            disabled={!canBook || isBooking}
            className={cn(
              'flex-1 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all relative overflow-hidden',
              canBook && !isBooking
                ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 shadow-md shadow-brand-500/25 hover:shadow-lg hover:shadow-brand-500/35 active:scale-[0.98]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            {isBooking ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Booking...
              </span>
            ) : (
              'Book Appointment'
            )}
          </button>
        </div>
      </div>
    </>
  );
}

