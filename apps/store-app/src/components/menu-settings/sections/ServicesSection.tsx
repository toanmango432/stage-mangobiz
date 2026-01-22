import { useState } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  MoreVertical,
  Clock,
  DollarSign,
  Users,
  Globe,
  Copy,
  EyeOff,
  Eye,
  ChevronRight,
  Sparkles,
  Layers,
  Archive,
} from 'lucide-react';
import type {
  MenuService,
  MenuServiceWithEmbeddedVariants,
  CategoryWithCount,
  CatalogViewMode,
  EmbeddedVariant,
} from '@/types/catalog';
import { formatDuration, formatPrice } from '../constants';
import { ServiceModal } from '../modals/ServiceModal';
import { ArchiveServiceModal } from '../modals/ArchiveServiceModal';
import { ConfirmDialog, ServiceCardSkeleton, TableRowSkeleton } from '../components';
import type { ServiceArchiveDependencies, ArchiveServiceResult } from '../../../hooks/useCatalog';

interface ServicesSectionProps {
  services: MenuServiceWithEmbeddedVariants[];
  allServices: MenuServiceWithEmbeddedVariants[];
  categories: CategoryWithCount[];
  viewMode: CatalogViewMode;
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  /** When true, shows skeleton loaders instead of content */
  isLoading?: boolean;
  // Action callbacks
  onCreate?: (data: Partial<MenuService>, variants?: EmbeddedVariant[]) => Promise<MenuService | null>;
  onUpdate?: (id: string, data: Partial<MenuService>, variants?: EmbeddedVariant[]) => Promise<MenuService | null | undefined>;
  onDelete?: (id: string) => Promise<boolean | null>;
  onArchive?: (id: string) => Promise<ArchiveServiceResult | null>;
  checkServiceDependencies?: (serviceId: string) => Promise<ServiceArchiveDependencies>;
}

export function ServicesSection({
  services,
  allServices,
  categories,
  viewMode,
  selectedCategoryId,
  onSelectCategory,
  isLoading = false,
  onCreate,
  onUpdate,
  onDelete,
  onArchive,
  checkServiceDependencies,
}: ServicesSectionProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<MenuServiceWithEmbeddedVariants | undefined>();
  const [expandedMenuId, setExpandedMenuId] = useState<string | null>(null);

  // Archive modal state
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [selectedServiceForArchive, setSelectedServiceForArchive] = useState<MenuServiceWithEmbeddedVariants | null>(null);
  const [archiveDependencies, setArchiveDependencies] = useState<ServiceArchiveDependencies | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedServiceToDelete, setSelectedServiceToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get category by ID
  const getCategory = (categoryId: string) => {
    return categories.find(c => c.id === categoryId);
  };

  // Handle save service
  const handleSaveService = async (serviceData: Partial<MenuService>, variants?: EmbeddedVariant[]) => {
    if (editingService) {
      // Update existing service
      if (onUpdate) {
        await onUpdate(editingService.id, serviceData, variants);
      }
    } else {
      // Create new service
      if (onCreate) {
        await onCreate({
          categoryId: serviceData.categoryId || categories[0]?.id || '',
          name: serviceData.name || 'New Service',
          description: serviceData.description,
          pricingType: serviceData.pricingType || 'fixed',
          price: serviceData.price || 0,
          duration: serviceData.duration || 60,
          extraTime: serviceData.extraTime,
          hasVariants: (variants && variants.length > 0) || false,
          allStaffCanPerform: serviceData.allStaffCanPerform ?? true,
          bookingAvailability: serviceData.bookingAvailability || 'both',
          onlineBookingEnabled: serviceData.onlineBookingEnabled ?? true,
          requiresDeposit: serviceData.requiresDeposit || false,
          taxable: serviceData.taxable ?? true,
          status: 'active',
          displayOrder: allServices.length + 1,
          showPriceOnline: serviceData.showPriceOnline ?? true,
          allowCustomDuration: serviceData.allowCustomDuration || false,
        }, variants);
      }
    }
    setShowModal(false);
    setEditingService(undefined);
  };

  // Handle opening delete confirmation dialog
  const handleOpenDeleteDialog = (serviceId: string) => {
    setSelectedServiceToDelete(serviceId);
    setExpandedMenuId(null);
    setDeleteDialogOpen(true);
  };

  // Handle confirming delete
  const handleConfirmDelete = async () => {
    if (!selectedServiceToDelete || !onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(selectedServiceToDelete);
      setDeleteDialogOpen(false);
      setSelectedServiceToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle closing delete dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedServiceToDelete(null);
  };

  // Handle toggle status
  const handleToggleStatus = async (serviceId: string) => {
    const service = allServices.find(s => s.id === serviceId);
    if (service && onUpdate) {
      await onUpdate(serviceId, {
        status: service.status === 'active' ? 'inactive' : 'active',
      });
    }
  };

  // Handle duplicate
  const handleDuplicate = async (service: MenuServiceWithEmbeddedVariants) => {
    if (onCreate) {
      await onCreate({
        categoryId: service.categoryId,
        name: `${service.name} (Copy)`,
        description: service.description,
        pricingType: service.pricingType,
        price: service.price,
        duration: service.duration,
        extraTime: service.extraTime,
        hasVariants: service.hasVariants,
        allStaffCanPerform: service.allStaffCanPerform,
        bookingAvailability: service.bookingAvailability,
        onlineBookingEnabled: service.onlineBookingEnabled,
        requiresDeposit: service.requiresDeposit,
        taxable: service.taxable,
        status: 'active',
        displayOrder: allServices.length + 1,
        showPriceOnline: service.showPriceOnline,
        allowCustomDuration: service.allowCustomDuration,
      }, service.variants);
    }
  };

  // Handle opening archive modal
  const handleOpenArchiveModal = async (service: MenuServiceWithEmbeddedVariants) => {
    setSelectedServiceForArchive(service);
    setExpandedMenuId(null);

    // Check dependencies if available
    if (checkServiceDependencies) {
      const deps = await checkServiceDependencies(service.id);
      setArchiveDependencies(deps);
    }

    setShowArchiveModal(true);
  };

  // Handle confirm archive
  const handleConfirmArchive = async () => {
    if (!selectedServiceForArchive || !onArchive) return;

    setIsArchiving(true);
    try {
      await onArchive(selectedServiceForArchive.id);
      setShowArchiveModal(false);
      setSelectedServiceForArchive(null);
      setArchiveDependencies(null);
    } finally {
      setIsArchiving(false);
    }
  };

  // Handle close archive modal
  const handleCloseArchiveModal = () => {
    setShowArchiveModal(false);
    setSelectedServiceForArchive(null);
    setArchiveDependencies(null);
  };

  // Render price display
  const renderPrice = (service: MenuService) => {
    if (service.pricingType === 'free') return 'Free';
    if (service.pricingType === 'varies') return 'Price varies';
    if (service.pricingType === 'from') return `From ${formatPrice(service.price)}`;
    return formatPrice(service.price);
  };

  // Render skeleton loading state based on view mode
  const renderSkeletons = () => {
    const skeletonCount = 6;

    if (viewMode === 'grid') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <ServiceCardSkeleton key={index} />
          ))}
        </div>
      );
    }

    if (viewMode === 'list') {
      return (
        <div className="space-y-2">
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 p-4"
            >
              <TableRowSkeleton columns={5} />
            </div>
          ))}
        </div>
      );
    }

    // Compact view
    return (
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {Array.from({ length: 8 }).map((_, index) => (
          <TableRowSkeleton key={index} columns={3} />
        ))}
      </div>
    );
  };

  // Render Grid View
  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {services.map((service) => {
        const category = getCategory(service.categoryId);
        return (
          <div
            key={service.id}
            className={`bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all ${
              service.status !== 'active' ? 'opacity-60' : ''
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${category?.color || '#6B7280'}15` }}
              >
                <Sparkles size={20} style={{ color: category?.color || '#6B7280' }} />
              </div>
              <div className="relative">
                <button
                  onClick={() => setExpandedMenuId(expandedMenuId === service.id ? null : service.id)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <MoreVertical size={16} />
                </button>
                {expandedMenuId === service.id && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setExpandedMenuId(null)} />
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      <button
                        onClick={() => {
                          setEditingService(service);
                          setShowModal(true);
                          setExpandedMenuId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Edit3 size={14} /> Edit
                      </button>
                      <button
                        onClick={() => {
                          handleDuplicate(service);
                          setExpandedMenuId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Copy size={14} /> Duplicate
                      </button>
                      <button
                        onClick={() => {
                          handleToggleStatus(service.id);
                          setExpandedMenuId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {service.status === 'active' ? <EyeOff size={14} /> : <Eye size={14} />}
                        {service.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleOpenArchiveModal(service)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Archive size={14} /> Archive
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={() => handleOpenDeleteDialog(service.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Service Info */}
            <h3 className="font-semibold text-gray-900 mb-1">{service.name}</h3>
            {service.description && (
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">{service.description}</p>
            )}

            {/* Meta Info */}
            <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {formatDuration(service.duration)}
              </span>
              <span className="flex items-center gap-1 font-medium text-gray-900">
                <DollarSign size={14} />
                {renderPrice(service)}
              </span>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2 flex-wrap">
              {service.hasVariants && service.variants && service.variants.length > 0 && (
                <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-xs rounded-full flex items-center gap-1">
                  <Layers size={12} /> {service.variants.length} variants
                </span>
              )}
              {service.onlineBookingEnabled && (
                <span className="px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded-full flex items-center gap-1">
                  <Globe size={12} /> Online
                </span>
              )}
              {service.requiresDeposit && (
                <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-xs rounded-full">
                  Deposit
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  // Render List View
  const renderListView = () => (
    <div className="space-y-2">
      {services.map((service) => {
        const category = getCategory(service.categoryId);
        return (
          <div
            key={service.id}
            className={`bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all ${
              service.status !== 'active' ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${category?.color || '#6B7280'}15` }}
              >
                <Sparkles size={24} style={{ color: category?.color || '#6B7280' }} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{service.name}</h3>
                  {service.status !== 'active' && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                      Inactive
                    </span>
                  )}
                </div>
                {service.description && (
                  <p className="text-sm text-gray-500 truncate">{service.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-100 rounded">
                    {category?.name || 'Uncategorized'}
                  </span>
                  {service.hasVariants && service.variants && service.variants.length > 0 && (
                    <span className="text-xs text-purple-600 px-2 py-0.5 bg-purple-50 rounded">
                      {service.variants.length} variants
                    </span>
                  )}
                </div>
              </div>

              {/* Duration */}
              <div className="text-center px-4 hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{formatDuration(service.duration)}</p>
                <p className="text-xs text-gray-500">Duration</p>
              </div>

              {/* Price */}
              <div className="text-center px-4">
                <p className="text-sm font-semibold text-gray-900">{renderPrice(service)}</p>
                <p className="text-xs text-gray-500">Price</p>
              </div>

              {/* Status Indicators */}
              <div className="flex items-center gap-2">
                {service.onlineBookingEnabled && (
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center" title="Online Booking">
                    <Globe size={16} className="text-green-600" />
                  </div>
                )}
                {!service.allStaffCanPerform && (
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center" title="Staff Restricted">
                    <Users size={16} className="text-blue-600" />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="relative">
                <button
                  onClick={() => setExpandedMenuId(expandedMenuId === service.id ? null : service.id)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <MoreVertical size={18} />
                </button>
                {expandedMenuId === service.id && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setExpandedMenuId(null)} />
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      <button
                        onClick={() => {
                          setEditingService(service);
                          setShowModal(true);
                          setExpandedMenuId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Edit3 size={14} /> Edit
                      </button>
                      <button
                        onClick={() => {
                          handleDuplicate(service);
                          setExpandedMenuId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Copy size={14} /> Duplicate
                      </button>
                      <button
                        onClick={() => {
                          handleToggleStatus(service.id);
                          setExpandedMenuId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {service.status === 'active' ? <EyeOff size={14} /> : <Eye size={14} />}
                        {service.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleOpenArchiveModal(service)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Archive size={14} /> Archive
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={() => handleOpenDeleteDialog(service.id)}
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
        );
      })}
    </div>
  );

  // Render Compact View
  const renderCompactView = () => (
    <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
      {services.map((service) => {
        const category = getCategory(service.categoryId);
        return (
          <div
            key={service.id}
            className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
              service.status !== 'active' ? 'opacity-60' : ''
            }`}
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: category?.color || '#6B7280' }}
            />
            <span className="flex-1 font-medium text-gray-900 truncate">{service.name}</span>
            <span className="text-sm text-gray-500">{formatDuration(service.duration)}</span>
            <span className="text-sm font-medium text-gray-900 min-w-[60px] text-right">
              {renderPrice(service)}
            </span>
            <button
              onClick={() => {
                setEditingService(service);
                setShowModal(true);
              }}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            >
              <Edit3 size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="h-full flex overflow-hidden">
      {/* Category Sidebar */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto hidden lg:block">
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Categories</h3>
          <div className="space-y-1">
            <button
              onClick={() => onSelectCategory(null)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                !selectedCategoryId
                  ? 'bg-orange-50 text-orange-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>All Services</span>
              <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                {allServices.length}
              </span>
            </button>
            {categories.map((cat) => {
              const count = allServices.filter(s => s.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategoryId === cat.id
                      ? 'bg-orange-50 text-orange-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="truncate">{cat.name}</span>
                  </div>
                  <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Services Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedCategoryId
                ? categories.find(c => c.id === selectedCategoryId)?.name || 'Services'
                : 'All Services'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {services.length} service{services.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => {
              setEditingService(undefined);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            <Plus size={18} />
            Add Service
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          renderSkeletons()
        ) : services.length > 0 ? (
          viewMode === 'grid' ? renderGridView() :
          viewMode === 'list' ? renderListView() :
          renderCompactView()
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
            <p className="text-gray-500 mb-4">
              {selectedCategoryId
                ? 'No services in this category'
                : 'Get started by adding your first service'}
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              <Plus size={18} />
              Add Service
            </button>
          </div>
        )}
      </div>

      {/* Service Modal */}
      <ServiceModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingService(undefined);
        }}
        service={editingService}
        categories={categories}
        onSave={handleSaveService}
      />

      {/* Archive Service Modal */}
      <ArchiveServiceModal
        isOpen={showArchiveModal}
        onClose={handleCloseArchiveModal}
        onConfirm={handleConfirmArchive}
        service={selectedServiceForArchive}
        dependencies={archiveDependencies}
        isLoading={isArchiving}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={handleCloseDeleteDialog}
        title="Delete Service"
        description="Are you sure you want to delete this service? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
