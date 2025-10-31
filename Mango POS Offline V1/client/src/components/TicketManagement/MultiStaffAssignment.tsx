import { useState } from 'react';
import { Users, Plus, X, Clock, DollarSign } from 'lucide-react';
import { Staff } from '../../types/staff';
import { TicketService } from '../../types/Ticket';

interface MultiStaffAssignmentProps {
  availableStaff: Staff[];
  services: TicketService[];
  onAssignStaff: (serviceIndex: number, staffId: string, staffName: string) => void;
  onRemoveStaff: (serviceIndex: number) => void;
  onAddService: () => void;
}

export function MultiStaffAssignment({
  availableStaff,
  services,
  onAssignStaff,
  onRemoveStaff,
  onAddService
}: MultiStaffAssignmentProps) {
  const [showStaffSelector, setShowStaffSelector] = useState<number | null>(null);

  const getStaffById = (staffId: string) => {
    return availableStaff.find(s => s.id === staffId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Users className="w-5 h-5 mr-2 text-blue-500" />
          Staff Assignment
        </h3>
        <button
          onClick={onAddService}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>Add Service</span>
        </button>
      </div>

      <div className="space-y-3">
        {services.map((service, index) => {
          const assignedStaff = getStaffById(service.staffId);
          
          return (
            <div key={index} className="relative p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  {/* Service Name */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Service
                    </label>
                    <div className="text-sm font-semibold text-gray-900">
                      {service.serviceName}
                    </div>
                  </div>

                  {/* Staff Assignment */}
                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-500 mb-2">
                      Assigned Staff
                    </label>
                    
                    {service.staffId ? (
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {assignedStaff?.name.charAt(0) || service.staffName.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {service.staffName}
                            </div>
                            <div className="text-xs text-gray-600">
                              {assignedStaff?.status === 'available' ? (
                                <span className="text-green-600">● Available</span>
                              ) : (
                                <span className="text-amber-600">● Busy</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => onRemoveStaff(index)}
                          className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowStaffSelector(index)}
                        className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-sm text-gray-600 hover:text-blue-600 font-medium"
                      >
                        + Assign Staff
                      </button>
                    )}

                    {/* Staff Selector Dropdown */}
                    {showStaffSelector === index && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-10 max-h-64 overflow-y-auto">
                        <div className="p-2 space-y-1">
                          {availableStaff.map((staff) => (
                            <button
                              key={staff.id}
                              onClick={() => {
                                onAssignStaff(index, staff.id, staff.name);
                                setShowStaffSelector(null);
                              }}
                              className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                            >
                              <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
                                {staff.name.charAt(0)}
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-semibold text-gray-900">
                                  {staff.name}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {staff.status === 'available' ? (
                                    <span className="text-green-600">● Available</span>
                                  ) : (
                                    <span className="text-amber-600">● Busy</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                {staff.servicesCountToday} services today
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Service Details */}
                  <div className="flex items-center space-x-4 text-xs text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{service.duration} min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>${service.price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {services.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm">No services added yet</p>
            <p className="text-xs mt-1">Click "Add Service" to get started</p>
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {showStaffSelector !== null && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowStaffSelector(null)}
        />
      )}
    </div>
  );
}
