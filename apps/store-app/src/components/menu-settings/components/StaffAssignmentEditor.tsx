import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { ChevronDown, ChevronUp, User, DollarSign, Clock, Percent } from 'lucide-react';
import { selectActiveTeamMembers } from '@/store/slices/teamSlice';
import type { StaffServiceAssignment } from '@/types/catalog';

interface StaffAssignmentData {
  staffId: string;
  isAssigned: boolean;
  customPrice?: number;
  customDuration?: number;
  customCommissionRate?: number;
}

interface StaffAssignmentEditorProps {
  serviceId?: string;
  defaultPrice: number;
  defaultDuration: number;
  assignments: StaffAssignmentData[];
  onAssignmentsChange: (assignments: StaffAssignmentData[]) => void;
}

export function StaffAssignmentEditor({
  serviceId,
  defaultPrice,
  defaultDuration,
  assignments,
  onAssignmentsChange,
}: StaffAssignmentEditorProps) {
  const teamMembers = useSelector(selectActiveTeamMembers);
  const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null);

  // Create a map of assignments by staffId for quick lookup
  const assignmentMap = useMemo(() => {
    const map = new Map<string, StaffAssignmentData>();
    assignments.forEach((a) => map.set(a.staffId, a));
    return map;
  }, [assignments]);

  // Toggle staff assignment
  const toggleStaffAssignment = (staffId: string) => {
    const existing = assignmentMap.get(staffId);
    if (existing) {
      // Remove assignment
      onAssignmentsChange(assignments.filter((a) => a.staffId !== staffId));
    } else {
      // Add assignment
      onAssignmentsChange([
        ...assignments,
        { staffId, isAssigned: true },
      ]);
    }
  };

  // Update custom values for a staff member
  const updateAssignment = (staffId: string, updates: Partial<StaffAssignmentData>) => {
    const newAssignments = assignments.map((a) =>
      a.staffId === staffId ? { ...a, ...updates } : a
    );
    onAssignmentsChange(newAssignments);
  };

  // Clear custom values for a staff member
  const clearCustomValues = (staffId: string) => {
    updateAssignment(staffId, {
      customPrice: undefined,
      customDuration: undefined,
      customCommissionRate: undefined,
    });
  };

  if (teamMembers.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg text-center">
        <User className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500">No active staff members found.</p>
        <p className="text-xs text-gray-400 mt-1">Add team members in the Team section first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-700">
          Select Staff ({assignments.length} of {teamMembers.length} selected)
        </p>
        {assignments.length > 0 && (
          <button
            type="button"
            onClick={() => onAssignmentsChange([])}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-64 overflow-y-auto">
        {teamMembers.map((staff) => {
          const assignment = assignmentMap.get(staff.id);
          const isAssigned = !!assignment;
          const isExpanded = expandedStaffId === staff.id;
          const hasCustomValues =
            assignment?.customPrice !== undefined ||
            assignment?.customDuration !== undefined ||
            assignment?.customCommissionRate !== undefined;

          return (
            <div key={staff.id} className="bg-white">
              {/* Staff Row */}
              <div className="flex items-center p-3 hover:bg-gray-50">
                {/* Checkbox */}
                <label className="flex items-center flex-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAssigned}
                    onChange={() => toggleStaffAssignment(staff.id)}
                    className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <div className="ml-3 flex items-center gap-2">
                    {staff.profile.avatar ? (
                      <img
                        src={staff.profile.avatar}
                        alt={staff.profile.displayName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <User size={16} className="text-gray-500" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {staff.profile.displayName}
                      </p>
                      {staff.permissions.role && (
                        <p className="text-xs text-gray-500 capitalize">
                          {staff.permissions.role}
                        </p>
                      )}
                    </div>
                  </div>
                </label>

                {/* Custom indicator & expand button */}
                {isAssigned && (
                  <div className="flex items-center gap-2">
                    {hasCustomValues && (
                      <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                        Custom
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setExpandedStaffId(isExpanded ? null : staff.id)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                )}
              </div>

              {/* Expanded Custom Values */}
              {isAssigned && isExpanded && (
                <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-gray-600">
                      Custom Pricing for {staff.profile.displayName}
                    </p>
                    {hasCustomValues && (
                      <button
                        type="button"
                        onClick={() => clearCustomValues(staff.id)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Reset to default
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {/* Custom Price */}
                    <div>
                      <label className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                        <DollarSign size={12} />
                        Price
                      </label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                          $
                        </span>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={assignment?.customPrice ?? ''}
                          onChange={(e) =>
                            updateAssignment(staff.id, {
                              customPrice: e.target.value ? Number(e.target.value) : undefined,
                            })
                          }
                          placeholder={defaultPrice.toString()}
                          className="w-full pl-6 pr-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    {/* Custom Duration */}
                    <div>
                      <label className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                        <Clock size={12} />
                        Duration
                      </label>
                      <select
                        value={assignment?.customDuration ?? ''}
                        onChange={(e) =>
                          updateAssignment(staff.id, {
                            customDuration: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                        className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="">Default ({defaultDuration}m)</option>
                        <option value={15}>15 min</option>
                        <option value={30}>30 min</option>
                        <option value={45}>45 min</option>
                        <option value={60}>1 hour</option>
                        <option value={75}>1h 15m</option>
                        <option value={90}>1h 30m</option>
                        <option value={120}>2 hours</option>
                        <option value={150}>2h 30m</option>
                        <option value={180}>3 hours</option>
                      </select>
                    </div>

                    {/* Custom Commission */}
                    <div>
                      <label className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                        <Percent size={12} />
                        Commission
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          value={assignment?.customCommissionRate ?? ''}
                          onChange={(e) =>
                            updateAssignment(staff.id, {
                              customCommissionRate: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            })
                          }
                          placeholder="Default"
                          className="w-full px-2 py-1.5 pr-6 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-500 mt-2">
        Click on a staff member's row to expand and set custom pricing, duration, or commission.
      </p>
    </div>
  );
}

export default StaffAssignmentEditor;
