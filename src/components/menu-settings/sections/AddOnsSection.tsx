import { useState } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  MoreVertical,
  Clock,
  Copy,
  EyeOff,
  Eye,
  ChevronDown,
  ChevronRight,
  Zap,
  Globe,
  Link,
  Layers,
} from 'lucide-react';
import type {
  AddOnGroup,
  AddOnOption,
  AddOnGroupWithOptions,
  MenuServiceWithEmbeddedVariants,
  CategoryWithCount,
  CatalogViewMode,
} from '../../../types/catalog';
import { formatDuration, formatPrice } from '../constants';
import { AddOnGroupModal } from '../modals/AddOnGroupModal';
import { AddOnOptionModal } from '../modals/AddOnOptionModal';

interface AddOnsSectionProps {
  addOnGroups: AddOnGroupWithOptions[];
  categories: CategoryWithCount[];
  services: MenuServiceWithEmbeddedVariants[];
  viewMode: CatalogViewMode;
  searchQuery?: string;
  // Group action callbacks
  onCreateGroup?: (data: Partial<AddOnGroup>) => Promise<AddOnGroup | null | undefined>;
  onUpdateGroup?: (id: string, data: Partial<AddOnGroup>) => Promise<AddOnGroup | null | undefined>;
  onDeleteGroup?: (id: string) => Promise<boolean | null | undefined>;
  // Option action callbacks
  onCreateOption?: (data: Partial<AddOnOption>) => Promise<AddOnOption | null | undefined>;
  onUpdateOption?: (id: string, data: Partial<AddOnOption>) => Promise<AddOnOption | null | undefined>;
  onDeleteOption?: (id: string) => Promise<boolean | null | undefined>;
}

export function AddOnsSection({
  addOnGroups,
  categories,
  services,
  // viewMode prop available for future grid/list toggle
  searchQuery = '',
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onCreateOption,
  onUpdateOption,
  onDeleteOption,
}: AddOnsSectionProps) {
  // Modal states
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showOptionModal, setShowOptionModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AddOnGroup | undefined>();
  const [editingOption, setEditingOption] = useState<AddOnOption | undefined>();
  const [selectedGroupForOption, setSelectedGroupForOption] = useState<{ id: string; name: string } | null>(null);

  // UI states
  const [expandedGroupIds, setExpandedGroupIds] = useState<string[]>([]);
  const [expandedMenuId, setExpandedMenuId] = useState<string | null>(null);

  // Filter groups
  const filteredGroups = addOnGroups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.options.some(opt => opt.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Toggle group expansion
  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroupIds(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  // Get applicable categories text
  const getApplicableText = (group: AddOnGroup) => {
    if (group.applicableToAll) return 'All services';

    const catNames = group.applicableCategoryIds
      .map(id => categories.find(c => c.id === id)?.name)
      .filter(Boolean);

    if (catNames.length === 0) return 'No services';
    if (catNames.length <= 2) return catNames.join(', ');
    return `${catNames.length} categories`;
  };

  // Handle save group
  const handleSaveGroup = async (groupData: Partial<AddOnGroup>) => {
    if (editingGroup) {
      if (onUpdateGroup) {
        await onUpdateGroup(editingGroup.id, groupData);
      }
    } else {
      if (onCreateGroup) {
        const newGroup = await onCreateGroup({
          ...groupData,
          isActive: true,
          displayOrder: addOnGroups.length + 1,
        });
        // Auto-expand newly created group
        if (newGroup) {
          setExpandedGroupIds(prev => [...prev, newGroup.id]);
        }
      }
    }
    setShowGroupModal(false);
    setEditingGroup(undefined);
  };

  // Handle save option
  const handleSaveOption = async (optionData: Partial<AddOnOption>) => {
    if (editingOption) {
      if (onUpdateOption) {
        await onUpdateOption(editingOption.id, optionData);
      }
    } else {
      if (onCreateOption && selectedGroupForOption) {
        const group = addOnGroups.find(g => g.id === selectedGroupForOption.id);
        await onCreateOption({
          ...optionData,
          groupId: selectedGroupForOption.id,
          isActive: true,
          displayOrder: (group?.options.length || 0) + 1,
        });
      }
    }
    setShowOptionModal(false);
    setEditingOption(undefined);
    setSelectedGroupForOption(null);
  };

  // Handle delete group
  const handleDeleteGroup = async (groupId: string) => {
    if (confirm('Are you sure you want to delete this add-on group and all its options?')) {
      if (onDeleteGroup) {
        await onDeleteGroup(groupId);
      }
    }
  };

  // Handle delete option
  const handleDeleteOption = async (optionId: string) => {
    if (confirm('Are you sure you want to delete this option?')) {
      if (onDeleteOption) {
        await onDeleteOption(optionId);
      }
    }
  };

  // Handle toggle group active
  const handleToggleGroupActive = async (group: AddOnGroup) => {
    if (onUpdateGroup) {
      await onUpdateGroup(group.id, { isActive: !group.isActive });
    }
  };

  // Handle toggle option active
  const handleToggleOptionActive = async (option: AddOnOption) => {
    if (onUpdateOption) {
      await onUpdateOption(option.id, { isActive: !option.isActive });
    }
  };

  // Handle duplicate group
  const handleDuplicateGroup = async (group: AddOnGroupWithOptions) => {
    if (onCreateGroup) {
      const newGroup = await onCreateGroup({
        name: `${group.name} (Copy)`,
        description: group.description,
        selectionMode: group.selectionMode,
        minSelections: group.minSelections,
        maxSelections: group.maxSelections,
        isRequired: group.isRequired,
        applicableToAll: group.applicableToAll,
        applicableCategoryIds: group.applicableCategoryIds,
        applicableServiceIds: group.applicableServiceIds,
        onlineBookingEnabled: group.onlineBookingEnabled,
        isActive: true,
        displayOrder: addOnGroups.length + 1,
      });

      // Copy options to new group
      if (newGroup && onCreateOption) {
        for (const option of group.options) {
          await onCreateOption({
            groupId: newGroup.id,
            name: option.name,
            description: option.description,
            price: option.price,
            duration: option.duration,
            isActive: option.isActive,
            displayOrder: option.displayOrder,
          });
        }
        setExpandedGroupIds(prev => [...prev, newGroup.id]);
      }
    }
  };

  // Calculate group totals
  const getGroupStats = (group: AddOnGroupWithOptions) => {
    const activeOptions = group.options.filter(o => o.isActive);
    const totalPrice = activeOptions.reduce((sum, o) => sum + o.price, 0);
    const avgPrice = activeOptions.length > 0 ? totalPrice / activeOptions.length : 0;
    return {
      optionCount: group.options.length,
      activeCount: activeOptions.length,
      avgPrice,
    };
  };

  // Render Group Card
  const renderGroupCard = (group: AddOnGroupWithOptions) => {
    const isExpanded = expandedGroupIds.includes(group.id);
    const stats = getGroupStats(group);

    return (
      <div
        key={group.id}
        className={`bg-white rounded-xl border border-gray-200 overflow-hidden transition-all ${
          !group.isActive ? 'opacity-60' : ''
        }`}
      >
        {/* Group Header */}
        <div
          className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleGroupExpansion(group.id)}
        >
          <div className="flex items-center gap-4">
            {/* Expand Icon */}
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
              {isExpanded ? (
                <ChevronDown size={18} className="text-purple-500" />
              ) : (
                <ChevronRight size={18} className="text-purple-500" />
              )}
            </div>

            {/* Group Icon */}
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Layers size={20} className="text-purple-600" />
            </div>

            {/* Group Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">{group.name}</h3>
                {!group.isActive && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                    Inactive
                  </span>
                )}
                {group.isRequired && (
                  <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded-full">
                    Required
                  </span>
                )}
              </div>
              {group.description && (
                <p className="text-sm text-gray-500 truncate">{group.description}</p>
              )}
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Zap size={12} />
                  {stats.optionCount} option{stats.optionCount !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1">
                  <Link size={12} />
                  {getApplicableText(group)}
                </span>
                <span className="capitalize">
                  {group.selectionMode} selection
                </span>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center gap-2">
              {group.onlineBookingEnabled && (
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center" title="Online Booking">
                  <Globe size={16} className="text-green-600" />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setExpandedMenuId(expandedMenuId === group.id ? null : group.id)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <MoreVertical size={18} />
              </button>
              {expandedMenuId === group.id && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setExpandedMenuId(null)} />
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    <button
                      onClick={() => {
                        setEditingGroup(group);
                        setShowGroupModal(true);
                        setExpandedMenuId(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Edit3 size={14} /> Edit Group
                    </button>
                    <button
                      onClick={() => {
                        setSelectedGroupForOption({ id: group.id, name: group.name });
                        setShowOptionModal(true);
                        setExpandedMenuId(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Plus size={14} /> Add Option
                    </button>
                    <button
                      onClick={() => {
                        handleDuplicateGroup(group);
                        setExpandedMenuId(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Copy size={14} /> Duplicate
                    </button>
                    <button
                      onClick={() => {
                        handleToggleGroupActive(group);
                        setExpandedMenuId(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {group.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                      {group.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={() => {
                        handleDeleteGroup(group.id);
                        setExpandedMenuId(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} /> Delete Group
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Options List (when expanded) */}
        {isExpanded && (
          <div className="border-t border-gray-100">
            {group.options.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {group.options.map((option) => (
                  <div
                    key={option.id}
                    className={`px-4 py-3 pl-16 flex items-center gap-4 hover:bg-gray-50 ${
                      !option.isActive ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Option Icon */}
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <Zap size={16} className="text-amber-500" />
                    </div>

                    {/* Option Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{option.name}</span>
                        {!option.isActive && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                            Inactive
                          </span>
                        )}
                      </div>
                      {option.description && (
                        <p className="text-sm text-gray-500 truncate">{option.description}</p>
                      )}
                    </div>

                    {/* Duration */}
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <Clock size={14} />
                      +{formatDuration(option.duration)}
                    </div>

                    {/* Price */}
                    <div className="text-sm font-semibold text-gray-900 w-20 text-right">
                      +{formatPrice(option.price)}
                    </div>

                    {/* Option Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingOption(option);
                          setSelectedGroupForOption({ id: group.id, name: group.name });
                          setShowOptionModal(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="Edit option"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleToggleOptionActive(option)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        title={option.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {option.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        onClick={() => handleDeleteOption(option.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete option"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-6 pl-16 text-center">
                <p className="text-sm text-gray-500 mb-2">No options in this group yet</p>
                <button
                  onClick={() => {
                    setSelectedGroupForOption({ id: group.id, name: group.name });
                    setShowOptionModal(true);
                  }}
                  className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  <Plus size={14} />
                  Add first option
                </button>
              </div>
            )}

            {/* Add Option Button */}
            {group.options.length > 0 && (
              <div className="px-4 py-3 pl-16 bg-gray-50">
                <button
                  onClick={() => {
                    setSelectedGroupForOption({ id: group.id, name: group.name });
                    setShowOptionModal(true);
                  }}
                  className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  <Plus size={14} />
                  Add option
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add-on Groups</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Organize add-ons into groups with selection rules
            </p>
          </div>
          <button
            onClick={() => {
              setEditingGroup(undefined);
              setShowGroupModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
          >
            <Plus size={18} />
            Add Group
          </button>
        </div>

        {/* Content */}
        {filteredGroups.length > 0 ? (
          <div className="space-y-3">
            {filteredGroups.map(renderGroupCard)}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Layers size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No add-on groups yet</h3>
            <p className="text-gray-500 mb-4">
              Create groups to organize your add-ons with selection rules
            </p>
            <button
              onClick={() => setShowGroupModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            >
              <Plus size={18} />
              Create Group
            </button>
          </div>
        )}
      </div>

      {/* Group Modal */}
      <AddOnGroupModal
        isOpen={showGroupModal}
        onClose={() => {
          setShowGroupModal(false);
          setEditingGroup(undefined);
        }}
        group={editingGroup}
        categories={categories}
        services={services}
        onSave={handleSaveGroup}
      />

      {/* Option Modal */}
      {selectedGroupForOption && (
        <AddOnOptionModal
          isOpen={showOptionModal}
          onClose={() => {
            setShowOptionModal(false);
            setEditingOption(undefined);
            setSelectedGroupForOption(null);
          }}
          option={editingOption}
          groupId={selectedGroupForOption.id}
          groupName={selectedGroupForOption.name}
          onSave={handleSaveOption}
        />
      )}
    </div>
  );
}
