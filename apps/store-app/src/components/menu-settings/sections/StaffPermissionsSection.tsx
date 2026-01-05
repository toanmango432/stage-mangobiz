import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Check,
  ChevronDown,
  ChevronRight,
  Users,
  Sparkles,
  Save,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';
import type { AppDispatch } from '@/store';
import {
  selectAllTeamMembers,
  selectTeamLoading,
  updateMemberServices,
  saveTeamMember,
  fetchTeamMembers,
} from '@/store/slices/teamSlice';
import type { TeamMemberSettings, ServicePricing } from '../../team-settings/types';
import type { CategoryWithCount, MenuServiceWithEmbeddedVariants } from '@/types/catalog';

interface StaffPermissionsSectionProps {
  categories: CategoryWithCount[];
  services: MenuServiceWithEmbeddedVariants[];
}

export function StaffPermissionsSection({
  categories,
  services,
}: StaffPermissionsSectionProps) {
  // Get team members from Redux (using TeamMemberSettings, not Staff)
  const dispatch = useDispatch<AppDispatch>();
  const allTeamMembers = useSelector(selectAllTeamMembers);
  const isLoading = useSelector(selectTeamLoading);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(categories.map(c => c.id));
  const [modifiedMemberIds, setModifiedMemberIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // Load team members on mount if not already loaded
  useEffect(() => {
    if (allTeamMembers.length === 0 && !isLoading) {
      dispatch(fetchTeamMembers(undefined));
    }
  }, [dispatch, allTeamMembers.length, isLoading]);

  // Filter team members by search
  const filteredMembers = useMemo(() => {
    return allTeamMembers.filter(member =>
      member.profile.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.profile.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.profile.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.profile.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allTeamMembers, searchQuery]);

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

  // Check if member can perform service (using ServicePricing.canPerform)
  const canPerformService = (member: TeamMemberSettings, serviceId: string): boolean => {
    const servicePricing = member.services.find(s => s.serviceId === serviceId);
    return servicePricing?.canPerform || false;
  };

  // Check if member can perform all services in category
  const canPerformAllInCategory = (member: TeamMemberSettings, categoryId: string) => {
    const categoryServices = getServicesByCategory(categoryId);
    if (categoryServices.length === 0) return false;
    return categoryServices.every(s => canPerformService(member, s.id));
  };

  // Check if member can perform some services in category
  const canPerformSomeInCategory = (member: TeamMemberSettings, categoryId: string) => {
    const categoryServices = getServicesByCategory(categoryId);
    const count = categoryServices.filter(s => canPerformService(member, s.id)).length;
    return count > 0 && count < categoryServices.length;
  };

  // Get enabled service count for member
  const getEnabledServiceCount = (member: TeamMemberSettings) => {
    return member.services.filter(s => s.canPerform).length;
  };

  // Build or update ServicePricing array for a member
  const buildServicePricingArray = (
    currentServices: ServicePricing[],
    serviceId: string,
    enable: boolean,
    catalogService?: MenuServiceWithEmbeddedVariants
  ): ServicePricing[] => {
    const existingIndex = currentServices.findIndex(s => s.serviceId === serviceId);

    if (existingIndex !== -1) {
      // Update existing
      return currentServices.map(s =>
        s.serviceId === serviceId ? { ...s, canPerform: enable } : s
      );
    } else if (catalogService) {
      // Add new ServicePricing entry
      const newPricing: ServicePricing = {
        serviceId: catalogService.id,
        serviceName: catalogService.name,
        serviceCategory: catalogService.categoryId,
        canPerform: enable,
        defaultPrice: catalogService.price,
        defaultDuration: catalogService.duration,
      };
      return [...currentServices, newPricing];
    }
    return currentServices;
  };

  // Toggle service permission
  const toggleServicePermission = (memberId: string, serviceId: string) => {
    const member = allTeamMembers.find(m => m.id === memberId);
    if (!member) return;

    const catalogService = services.find(s => s.id === serviceId);
    const currentlyEnabled = canPerformService(member, serviceId);
    const updatedServices = buildServicePricingArray(
      member.services,
      serviceId,
      !currentlyEnabled,
      catalogService
    );

    dispatch(updateMemberServices({ id: memberId, services: updatedServices }));
    setModifiedMemberIds(prev => new Set(prev).add(memberId));
  };

  // Toggle all services in category
  const toggleCategoryPermission = (memberId: string, categoryId: string) => {
    const member = allTeamMembers.find(m => m.id === memberId);
    if (!member) return;

    const categoryServices = getServicesByCategory(categoryId);
    const allEnabled = canPerformAllInCategory(member, categoryId);

    let updatedServices = [...member.services];

    categoryServices.forEach(catService => {
      updatedServices = buildServicePricingArray(
        updatedServices,
        catService.id,
        !allEnabled, // If all enabled, disable; otherwise enable
        catService
      );
    });

    dispatch(updateMemberServices({ id: memberId, services: updatedServices }));
    setModifiedMemberIds(prev => new Set(prev).add(memberId));
  };

  // Select All services for a member
  const selectAllServices = (memberId: string) => {
    const member = allTeamMembers.find(m => m.id === memberId);
    if (!member) return;

    let updatedServices = [...member.services];

    services.filter(s => s.status === 'active').forEach(catService => {
      updatedServices = buildServicePricingArray(
        updatedServices,
        catService.id,
        true,
        catService
      );
    });

    dispatch(updateMemberServices({ id: memberId, services: updatedServices }));
    setModifiedMemberIds(prev => new Set(prev).add(memberId));
  };

  // Clear All services for a member
  const clearAllServices = (memberId: string) => {
    const member = allTeamMembers.find(m => m.id === memberId);
    if (!member) return;

    const updatedServices = member.services.map(s => ({ ...s, canPerform: false }));
    dispatch(updateMemberServices({ id: memberId, services: updatedServices }));
    setModifiedMemberIds(prev => new Set(prev).add(memberId));
  };

  // Save all modified members to database
  const savePermissions = useCallback(async () => {
    if (modifiedMemberIds.size === 0) return;

    setIsSaving(true);
    try {
      const promises = Array.from(modifiedMemberIds).map(memberId => {
        const member = allTeamMembers.find(m => m.id === memberId);
        if (member) {
          return dispatch(saveTeamMember({ member })).unwrap();
        }
        return Promise.resolve();
      });

      await Promise.all(promises);
      setModifiedMemberIds(new Set());
      toast.success(`Permissions saved for ${promises.length} team member${promises.length > 1 ? 's' : ''}`);
    } catch (error) {
      toast.error('Failed to save permissions');
      console.error('Save permissions error:', error);
    } finally {
      setIsSaving(false);
    }
  }, [dispatch, modifiedMemberIds, allTeamMembers]);

  // Selected member data
  const selectedMember = selectedMemberId
    ? allTeamMembers.find(m => m.id === selectedMemberId)
    : null;

  // Get display name for member
  const getDisplayName = (member: TeamMemberSettings) => {
    return member.profile.displayName || `${member.profile.firstName} ${member.profile.lastName}`;
  };

  // Get initials for avatar
  const getInitials = (member: TeamMemberSettings) => {
    const first = member.profile.firstName?.[0] || '';
    const last = member.profile.lastName?.[0] || '';
    return `${first}${last}`.toUpperCase();
  };

  // Get member status display
  const getMemberStatus = (member: TeamMemberSettings) => {
    return member.isActive ? 'Active' : 'Inactive';
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Team Members Sidebar */}
      <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Team Members</h3>
            {modifiedMemberIds.size > 0 && (
              <button
                onClick={savePermissions}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                <Save size={14} />
                {isSaving ? 'Saving...' : `Save (${modifiedMemberIds.size})`}
              </button>
            )}
          </div>
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
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading team members...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No team members found</div>
          ) : (
            filteredMembers.map((member) => {
              const serviceCount = getEnabledServiceCount(member);
              const isSelected = selectedMemberId === member.id;

              return (
                <button
                  key={member.id}
                  onClick={() => setSelectedMemberId(member.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors mb-1 ${
                    isSelected
                      ? 'bg-orange-50 border border-orange-200'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-medium flex-shrink-0">
                    {getInitials(member)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium text-gray-900 truncate">{getDisplayName(member)}</p>
                    <p className="text-xs text-gray-500">{getMemberStatus(member)}</p>
                  </div>

                  {/* Service Count */}
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{serviceCount}</p>
                    <p className="text-xs text-gray-500">services</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Permissions Editor */}
      <div className="flex-1 overflow-y-auto">
        {selectedMember ? (
          <div className="p-6">
            {/* Member Header */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xl font-medium">
                {getInitials(selectedMember)}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{getDisplayName(selectedMember)}</h2>
                <p className="text-gray-500">{getMemberStatus(selectedMember)}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-2xl font-bold text-gray-900">
                  {getEnabledServiceCount(selectedMember)}
                </p>
                <p className="text-sm text-gray-500">services assigned</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => selectAllServices(selectedMember.id)}
                className="px-3 py-1.5 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              >
                Select All
              </button>
              <button
                onClick={() => clearAllServices(selectedMember.id)}
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
                const allSelected = canPerformAllInCategory(selectedMember, category.id);
                const someSelected = canPerformSomeInCategory(selectedMember, category.id);

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
                          toggleCategoryPermission(selectedMember.id, category.id);
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
                          {categoryServices.filter(s => canPerformService(selectedMember, s.id)).length} of {categoryServices.length} services
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
                          const isEnabled = canPerformService(selectedMember, service.id);

                          return (
                            <div
                              key={service.id}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                            >
                              <button
                                onClick={() => toggleServicePermission(selectedMember.id, service.id)}
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
