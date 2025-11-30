import React, { useState } from 'react';
import {
  Search,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Users,
  User,
  Sparkles,
  Filter,
  CheckSquare,
  Square,
  AlertCircle,
} from 'lucide-react';
import type { ServiceCategory, MenuService } from '../types';

interface StaffPermissionsSectionProps {
  categories: ServiceCategory[];
  services: MenuService[];
}

// Mock staff data - replace with real data later
const mockStaff = [
  { id: 'staff-1', name: 'Emma Wilson', avatar: null, role: 'Senior Stylist', services: ['svc-1', 'svc-2', 'svc-3', 'svc-4', 'svc-5', 'svc-6'] },
  { id: 'staff-2', name: 'James Chen', avatar: null, role: 'Colorist', services: ['svc-5', 'svc-6'] },
  { id: 'staff-3', name: 'Sofia Rodriguez', avatar: null, role: 'Nail Technician', services: ['svc-7', 'svc-8', 'svc-9'] },
  { id: 'staff-4', name: 'Michael Brown', avatar: null, role: 'Massage Therapist', services: ['svc-10', 'svc-11'] },
  { id: 'staff-5', name: 'Olivia Taylor', avatar: null, role: 'Esthetician', services: ['svc-12', 'svc-13'] },
  { id: 'staff-6', name: 'David Kim', avatar: null, role: 'Junior Stylist', services: ['svc-1', 'svc-2', 'svc-3'] },
];

export function StaffPermissionsSection({
  categories,
  services,
}: StaffPermissionsSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(categories.map(c => c.id));
  const [staffPermissions, setStaffPermissions] = useState<Record<string, string[]>>(
    mockStaff.reduce((acc, staff) => ({ ...acc, [staff.id]: staff.services }), {})
  );

  // Filter staff by search
  const filteredStaff = mockStaff.filter(staff =>
    staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Get services by category
  const getServicesByCategory = (categoryId: string) => {
    return services.filter(s => s.categoryId === categoryId && s.status === 'active');
  };

  // Check if staff can perform service
  const canPerformService = (staffId: string, serviceId: string) => {
    return staffPermissions[staffId]?.includes(serviceId) || false;
  };

  // Check if staff can perform all services in category
  const canPerformAllInCategory = (staffId: string, categoryId: string) => {
    const categoryServices = getServicesByCategory(categoryId);
    return categoryServices.every(s => canPerformService(staffId, s.id));
  };

  // Check if staff can perform some services in category
  const canPerformSomeInCategory = (staffId: string, categoryId: string) => {
    const categoryServices = getServicesByCategory(categoryId);
    const count = categoryServices.filter(s => canPerformService(staffId, s.id)).length;
    return count > 0 && count < categoryServices.length;
  };

  // Toggle service permission
  const toggleServicePermission = (staffId: string, serviceId: string) => {
    setStaffPermissions(prev => {
      const current = prev[staffId] || [];
      const newPermissions = current.includes(serviceId)
        ? current.filter(id => id !== serviceId)
        : [...current, serviceId];
      return { ...prev, [staffId]: newPermissions };
    });
  };

  // Toggle all services in category
  const toggleCategoryPermission = (staffId: string, categoryId: string) => {
    const categoryServices = getServicesByCategory(categoryId);
    const allEnabled = canPerformAllInCategory(staffId, categoryId);

    setStaffPermissions(prev => {
      const current = prev[staffId] || [];
      if (allEnabled) {
        // Remove all category services
        return {
          ...prev,
          [staffId]: current.filter(id => !categoryServices.some(s => s.id === id))
        };
      } else {
        // Add all category services
        const newIds = categoryServices.map(s => s.id);
        return {
          ...prev,
          [staffId]: [...new Set([...current, ...newIds])]
        };
      }
    });
  };

  // Get permission count for staff
  const getPermissionCount = (staffId: string) => {
    return staffPermissions[staffId]?.length || 0;
  };

  // Selected staff data
  const selectedStaff = selectedStaffId
    ? mockStaff.find(s => s.id === selectedStaffId)
    : null;

  return (
    <div className="h-full flex overflow-hidden">
      {/* Staff List Sidebar */}
      <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Team Members</h3>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filteredStaff.map((staff) => {
            const permCount = getPermissionCount(staff.id);
            const isSelected = selectedStaffId === staff.id;

            return (
              <button
                key={staff.id}
                onClick={() => setSelectedStaffId(staff.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors mb-1 ${
                  isSelected
                    ? 'bg-orange-50 border border-orange-200'
                    : 'hover:bg-gray-100'
                }`}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-medium flex-shrink-0">
                  {staff.name.split(' ').map(n => n[0]).join('')}
                </div>

                {/* Info */}
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium text-gray-900 truncate">{staff.name}</p>
                  <p className="text-xs text-gray-500">{staff.role}</p>
                </div>

                {/* Service Count */}
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{permCount}</p>
                  <p className="text-xs text-gray-500">services</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Permissions Editor */}
      <div className="flex-1 overflow-y-auto">
        {selectedStaff ? (
          <div className="p-6">
            {/* Staff Header */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xl font-medium">
                {selectedStaff.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedStaff.name}</h2>
                <p className="text-gray-500">{selectedStaff.role}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-2xl font-bold text-gray-900">
                  {getPermissionCount(selectedStaff.id)}
                </p>
                <p className="text-sm text-gray-500">services assigned</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => {
                  const allServiceIds = services.filter(s => s.status === 'active').map(s => s.id);
                  setStaffPermissions(prev => ({
                    ...prev,
                    [selectedStaff.id]: allServiceIds
                  }));
                }}
                className="px-3 py-1.5 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              >
                Select All
              </button>
              <button
                onClick={() => {
                  setStaffPermissions(prev => ({
                    ...prev,
                    [selectedStaff.id]: []
                  }));
                }}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Clear All
              </button>
            </div>

            {/* Categories & Services */}
            <div className="space-y-4">
              {categories.filter(c => c.isActive).map((category) => {
                const categoryServices = getServicesByCategory(category.id);
                const isExpanded = expandedCategories.includes(category.id);
                const allSelected = canPerformAllInCategory(selectedStaff.id, category.id);
                const someSelected = canPerformSomeInCategory(selectedStaff.id, category.id);

                if (categoryServices.length === 0) return null;

                return (
                  <div key={category.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {/* Category Header */}
                    <div
                      className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleCategory(category.id)}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCategoryPermission(selectedStaff.id, category.id);
                        }}
                        className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                          allSelected
                            ? 'bg-orange-500 text-white'
                            : someSelected
                            ? 'bg-orange-200 text-orange-700'
                            : 'border-2 border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {(allSelected || someSelected) && <Check size={14} />}
                      </button>

                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${category.color}15` }}
                      >
                        <Sparkles size={16} style={{ color: category.color }} />
                      </div>

                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{category.name}</h3>
                        <p className="text-xs text-gray-500">
                          {categoryServices.filter(s => canPerformService(selectedStaff.id, s.id)).length} of {categoryServices.length} services
                        </p>
                      </div>

                      {isExpanded ? (
                        <ChevronDown size={18} className="text-gray-400" />
                      ) : (
                        <ChevronRight size={18} className="text-gray-400" />
                      )}
                    </div>

                    {/* Services List */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 divide-y divide-gray-50">
                        {categoryServices.map((service) => {
                          const isEnabled = canPerformService(selectedStaff.id, service.id);

                          return (
                            <div
                              key={service.id}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                            >
                              <button
                                onClick={() => toggleServicePermission(selectedStaff.id, service.id)}
                                className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                                  isEnabled
                                    ? 'bg-orange-500 text-white'
                                    : 'border-2 border-gray-300 hover:border-gray-400'
                                }`}
                              >
                                {isEnabled && <Check size={14} />}
                              </button>

                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{service.name}</p>
                                {service.description && (
                                  <p className="text-xs text-gray-500 truncate">{service.description}</p>
                                )}
                              </div>

                              <span className="text-sm text-gray-500">
                                ${service.price}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a team member</h3>
              <p className="text-gray-500">
                Choose a staff member from the list to manage their service permissions
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
