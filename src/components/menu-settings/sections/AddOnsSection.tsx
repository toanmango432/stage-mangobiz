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
  ChevronRight,
  Zap,
  Globe,
  Link,
} from 'lucide-react';
import type {
  ServiceAddOn,
  MenuServiceWithEmbeddedVariants,
  CategoryWithCount,
  CatalogViewMode,
} from '../../../types/catalog';
import { formatDuration, formatPrice } from '../constants';
import { AddOnModal } from '../modals/AddOnModal';

interface AddOnsSectionProps {
  addOns: ServiceAddOn[];
  categories: CategoryWithCount[];
  services: MenuServiceWithEmbeddedVariants[];
  viewMode: CatalogViewMode;
  searchQuery?: string;
  // Action callbacks
  onCreate?: (data: Partial<ServiceAddOn>) => Promise<ServiceAddOn | null>;
  onUpdate?: (id: string, data: Partial<ServiceAddOn>) => Promise<ServiceAddOn | null>;
  onDelete?: (id: string) => Promise<boolean | null>;
}

export function AddOnsSection({
  addOns,
  categories,
  services,
  viewMode,
  searchQuery = '',
  onCreate,
  onUpdate,
  onDelete,
}: AddOnsSectionProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingAddOn, setEditingAddOn] = useState<ServiceAddOn | undefined>();
  const [expandedMenuId, setExpandedMenuId] = useState<string | null>(null);

  // Filter add-ons
  const filteredAddOns = addOns.filter(addon =>
    addon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    addon.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get applicable categories text
  const getApplicableText = (addon: ServiceAddOn) => {
    if (addon.applicableToAll) return 'All services';

    const catNames = addon.applicableCategoryIds
      .map(id => categories.find(c => c.id === id)?.name)
      .filter(Boolean);

    if (catNames.length === 0) return 'No services';
    if (catNames.length <= 2) return catNames.join(', ');
    return `${catNames.length} categories`;
  };

  // Handle save add-on
  const handleSaveAddOn = async (addOnData: Partial<ServiceAddOn>) => {
    if (editingAddOn) {
      // Update existing
      if (onUpdate) {
        await onUpdate(editingAddOn.id, addOnData);
      }
    } else {
      // Create new
      if (onCreate) {
        await onCreate({
          name: addOnData.name || 'New Add-on',
          description: addOnData.description,
          price: addOnData.price || 0,
          duration: addOnData.duration || 15,
          applicableToAll: addOnData.applicableToAll || false,
          applicableCategoryIds: addOnData.applicableCategoryIds || [],
          applicableServiceIds: addOnData.applicableServiceIds || [],
          isActive: true,
          displayOrder: addOns.length + 1,
          onlineBookingEnabled: addOnData.onlineBookingEnabled ?? true,
        });
      }
    }
    setShowModal(false);
    setEditingAddOn(undefined);
  };

  // Handle delete
  const handleDelete = async (addOnId: string) => {
    if (confirm('Are you sure you want to delete this add-on?')) {
      if (onDelete) {
        await onDelete(addOnId);
      }
    }
  };

  // Handle toggle active
  const handleToggleActive = async (addOnId: string) => {
    const addon = addOns.find(a => a.id === addOnId);
    if (addon && onUpdate) {
      await onUpdate(addOnId, { isActive: !addon.isActive });
    }
  };

  // Handle duplicate
  const handleDuplicate = async (addon: ServiceAddOn) => {
    if (onCreate) {
      await onCreate({
        name: `${addon.name} (Copy)`,
        description: addon.description,
        price: addon.price,
        duration: addon.duration,
        applicableToAll: addon.applicableToAll,
        applicableCategoryIds: addon.applicableCategoryIds,
        applicableServiceIds: addon.applicableServiceIds,
        isActive: true,
        displayOrder: addOns.length + 1,
        onlineBookingEnabled: addon.onlineBookingEnabled,
      });
    }
  };

  // Render Grid View
  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredAddOns.map((addon) => (
        <div
          key={addon.id}
          className={`bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all ${
            !addon.isActive ? 'opacity-60' : ''
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Zap size={20} className="text-amber-500" />
            </div>
            <div className="relative">
              <button
                onClick={() => setExpandedMenuId(expandedMenuId === addon.id ? null : addon.id)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <MoreVertical size={16} />
              </button>
              {expandedMenuId === addon.id && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setExpandedMenuId(null)} />
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    <button
                      onClick={() => {
                        setEditingAddOn(addon);
                        setShowModal(true);
                        setExpandedMenuId(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Edit3 size={14} /> Edit
                    </button>
                    <button
                      onClick={() => {
                        handleDuplicate(addon);
                        setExpandedMenuId(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Copy size={14} /> Duplicate
                    </button>
                    <button
                      onClick={() => {
                        handleToggleActive(addon.id);
                        setExpandedMenuId(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {addon.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                      {addon.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={() => {
                        handleDelete(addon.id);
                        setExpandedMenuId(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Add-on Info */}
          <h3 className="font-semibold text-gray-900 mb-1">{addon.name}</h3>
          {addon.description && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-3">{addon.description}</p>
          )}

          {/* Meta Info */}
          <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
            <span className="flex items-center gap-1">
              <Clock size={14} />
              +{formatDuration(addon.duration)}
            </span>
            <span className="flex items-center gap-1 font-medium text-gray-900">
              +{formatPrice(addon.price)}
            </span>
          </div>

          {/* Applicable To */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Link size={12} />
            <span>{getApplicableText(addon)}</span>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 mt-3">
            {!addon.isActive && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                Inactive
              </span>
            )}
            {addon.onlineBookingEnabled && (
              <span className="px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded-full flex items-center gap-1">
                <Globe size={12} /> Online
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  // Render List View
  const renderListView = () => (
    <div className="space-y-2">
      {filteredAddOns.map((addon) => (
        <div
          key={addon.id}
          className={`bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all ${
            !addon.isActive ? 'opacity-60' : ''
          }`}
        >
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <Zap size={24} className="text-amber-500" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">{addon.name}</h3>
                {!addon.isActive && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                    Inactive
                  </span>
                )}
              </div>
              {addon.description && (
                <p className="text-sm text-gray-500 truncate">{addon.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Applies to: {getApplicableText(addon)}
              </p>
            </div>

            {/* Duration */}
            <div className="text-center px-4 hidden sm:block">
              <p className="text-sm font-medium text-gray-900">+{formatDuration(addon.duration)}</p>
              <p className="text-xs text-gray-500">Added time</p>
            </div>

            {/* Price */}
            <div className="text-center px-4">
              <p className="text-lg font-bold text-gray-900">+{formatPrice(addon.price)}</p>
              <p className="text-xs text-gray-500">Price</p>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center gap-2">
              {addon.onlineBookingEnabled && (
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center" title="Online Booking">
                  <Globe size={16} className="text-green-600" />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="relative">
              <button
                onClick={() => setExpandedMenuId(expandedMenuId === addon.id ? null : addon.id)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <MoreVertical size={18} />
              </button>
              {expandedMenuId === addon.id && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setExpandedMenuId(null)} />
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    <button
                      onClick={() => {
                        setEditingAddOn(addon);
                        setShowModal(true);
                        setExpandedMenuId(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Edit3 size={14} /> Edit
                    </button>
                    <button
                      onClick={() => {
                        handleDuplicate(addon);
                        setExpandedMenuId(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Copy size={14} /> Duplicate
                    </button>
                    <button
                      onClick={() => {
                        handleToggleActive(addon.id);
                        setExpandedMenuId(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {addon.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                      {addon.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={() => {
                        handleDelete(addon.id);
                        setExpandedMenuId(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>

            <ChevronRight size={18} className="text-gray-400" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Service Add-ons</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Quick extras that can be added to any service
            </p>
          </div>
          <button
            onClick={() => {
              setEditingAddOn(undefined);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            <Plus size={18} />
            Add Add-on
          </button>
        </div>

        {/* Content */}
        {filteredAddOns.length > 0 ? (
          viewMode === 'grid' || viewMode === 'compact' ? renderGridView() : renderListView()
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No add-ons yet</h3>
            <p className="text-gray-500 mb-4">
              Create add-ons for quick upsells during checkout
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              <Plus size={18} />
              Create Add-on
            </button>
          </div>
        )}
      </div>

      {/* Add-on Modal */}
      <AddOnModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingAddOn(undefined);
        }}
        addOn={editingAddOn}
        categories={categories}
        services={services}
        onSave={handleSaveAddOn}
      />
    </div>
  );
}
