import { useState, useCallback } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  MoreVertical,
  Clock,
  Package,
  Copy,
  EyeOff,
  Eye,
  ChevronRight,
  Calendar,
  Globe,
} from 'lucide-react';
import type {
  ServicePackage,
  MenuServiceWithEmbeddedVariants,
  CategoryWithCount,
  CatalogViewMode,
} from '@/types/catalog';
import { formatDuration, formatPrice } from '../constants';
import { PackageModal } from '../modals/PackageModal';
import { ConfirmDialog, PackageCardSkeleton, TableRowSkeleton } from '../components';

interface PackagesSectionProps {
  packages: ServicePackage[];
  services: MenuServiceWithEmbeddedVariants[];
  categories: CategoryWithCount[];
  viewMode: CatalogViewMode;
  searchQuery?: string;
  /** Whether data is loading (shows skeletons) */
  isLoading?: boolean;
  // Action callbacks
  onCreate?: (data: Partial<ServicePackage>) => Promise<ServicePackage | null>;
  onUpdate?: (id: string, data: Partial<ServicePackage>) => Promise<ServicePackage | null | undefined>;
  onDelete?: (id: string) => Promise<boolean | null>;
}

export function PackagesSection({
  packages,
  services,
  viewMode,
  searchQuery = '',
  isLoading = false,
  onCreate,
  onUpdate,
  onDelete,
}: PackagesSectionProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | undefined>();
  const [expandedMenuId, setExpandedMenuId] = useState<string | null>(null);
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPackageToDelete, setSelectedPackageToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter packages
  const filteredPackages = packages.filter(pkg =>
    pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pkg.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate total duration for a package
  const getTotalDuration = (pkg: ServicePackage) => {
    return pkg.services.reduce((total, ps) => {
      const service = services.find(s => s.id === ps.serviceId);
      return total + (service?.duration || 0) * ps.quantity;
    }, 0);
  };

  // Handle save package
  const handleSavePackage = async (packageData: Partial<ServicePackage>) => {
    if (editingPackage) {
      // Update existing
      if (onUpdate) {
        await onUpdate(editingPackage.id, packageData);
      }
    } else {
      // Create new
      if (onCreate) {
        await onCreate({
          name: packageData.name || 'New Package',
          description: packageData.description,
          services: packageData.services || [],
          originalPrice: packageData.originalPrice || 0,
          packagePrice: packageData.packagePrice || 0,
          discountType: packageData.discountType || 'fixed',
          discountValue: packageData.discountValue || 0,
          validityDays: packageData.validityDays,
          bookingAvailability: packageData.bookingAvailability || 'both',
          onlineBookingEnabled: packageData.onlineBookingEnabled ?? true,
          isActive: true,
          displayOrder: packages.length + 1,
        });
      }
    }
    setShowModal(false);
    setEditingPackage(undefined);
  };

  // Handle delete - opens confirmation dialog
  const handleOpenDeleteDialog = useCallback((packageId: string) => {
    setSelectedPackageToDelete(packageId);
    setDeleteDialogOpen(true);
    setExpandedMenuId(null); // Close the dropdown menu
  }, []);

  // Perform the actual delete after confirmation
  const handleConfirmDelete = useCallback(async () => {
    if (!selectedPackageToDelete || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(selectedPackageToDelete);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedPackageToDelete, onDelete]);

  // Close delete dialog and reset state
  const handleCloseDeleteDialog = useCallback((open: boolean) => {
    if (!open) {
      setDeleteDialogOpen(false);
      setSelectedPackageToDelete(null);
    }
  }, []);

  // Handle toggle active
  const handleToggleActive = async (packageId: string) => {
    const pkg = packages.find(p => p.id === packageId);
    if (pkg && onUpdate) {
      await onUpdate(packageId, { isActive: !pkg.isActive });
    }
  };

  // Handle duplicate
  const handleDuplicate = async (pkg: ServicePackage) => {
    if (onCreate) {
      await onCreate({
        name: `${pkg.name} (Copy)`,
        description: pkg.description,
        services: pkg.services,
        originalPrice: pkg.originalPrice,
        packagePrice: pkg.packagePrice,
        discountType: pkg.discountType,
        discountValue: pkg.discountValue,
        validityDays: pkg.validityDays,
        bookingAvailability: pkg.bookingAvailability,
        onlineBookingEnabled: pkg.onlineBookingEnabled,
        isActive: true,
        displayOrder: packages.length + 1,
      });
    }
  };

  // Calculate savings
  const getSavings = (pkg: ServicePackage) => {
    const savings = pkg.originalPrice - pkg.packagePrice;
    const percent = ((savings / pkg.originalPrice) * 100).toFixed(0);
    return { amount: savings, percent };
  };

  // Render skeleton loaders based on view mode
  const renderSkeletons = () => {
    if (viewMode === 'grid' || viewMode === 'compact') {
      // Grid view: 6 skeleton cards in 3-column grid
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <PackageCardSkeleton key={index} />
          ))}
        </div>
      );
    }
    // List view: 6 skeleton rows
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
          >
            <TableRowSkeleton columns={5} />
          </div>
        ))}
      </div>
    );
  };

  // Render Grid View
  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredPackages.map((pkg) => {
        const savings = getSavings(pkg);
        const duration = getTotalDuration(pkg);

        return (
          <div
            key={pkg.id}
            className={`bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all ${
              !pkg.isActive ? 'opacity-60' : ''
            }`}
          >
            {/* Header with color */}
            <div
              className="h-2"
              style={{ backgroundColor: pkg.color || '#F97316' }}
            />

            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                    {!pkg.isActive && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  {pkg.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">{pkg.description}</p>
                  )}
                </div>
                <div className="relative">
                  <button
                    onClick={() => setExpandedMenuId(expandedMenuId === pkg.id ? null : pkg.id)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {expandedMenuId === pkg.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setExpandedMenuId(null)} />
                      <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                        <button
                          onClick={() => {
                            setEditingPackage(pkg);
                            setShowModal(true);
                            setExpandedMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Edit3 size={14} /> Edit
                        </button>
                        <button
                          onClick={() => {
                            handleDuplicate(pkg);
                            setExpandedMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Copy size={14} /> Duplicate
                        </button>
                        <button
                          onClick={() => {
                            handleToggleActive(pkg.id);
                            setExpandedMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          {pkg.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                          {pkg.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <hr className="my-1" />
                        <button
                          onClick={() => handleOpenDeleteDialog(pkg.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Services List */}
              <div className="space-y-1 mb-3">
                {pkg.services.slice(0, 3).map((ps, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 bg-gray-100 rounded text-xs flex items-center justify-center text-gray-600">
                      {ps.quantity}x
                    </span>
                    <span className="text-gray-700 truncate">{ps.serviceName}</span>
                  </div>
                ))}
                {pkg.services.length > 3 && (
                  <p className="text-xs text-gray-500 pl-7">
                    +{pkg.services.length - 3} more services
                  </p>
                )}
              </div>

              {/* Meta Info */}
              <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {formatDuration(duration)}
                </span>
                {pkg.validityDays && (
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {pkg.validityDays} days
                  </span>
                )}
              </div>

              {/* Pricing */}
              <div className="flex items-end justify-between pt-3 border-t border-gray-100">
                <div>
                  <p className="text-sm text-gray-500 line-through">{formatPrice(pkg.originalPrice)}</p>
                  <p className="text-xl font-bold text-gray-900">{formatPrice(pkg.packagePrice)}</p>
                </div>
                <div className="px-2 py-1 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                  Save {savings.percent}%
                </div>
              </div>

              {/* Tags */}
              <div className="flex items-center gap-2 mt-3">
                {pkg.onlineBookingEnabled && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full flex items-center gap-1">
                    <Globe size={12} /> Online
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // Render List View
  const renderListView = () => (
    <div className="space-y-2">
      {filteredPackages.map((pkg) => {
        const savings = getSavings(pkg);
        const duration = getTotalDuration(pkg);

        return (
          <div
            key={pkg.id}
            className={`bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all ${
              !pkg.isActive ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${pkg.color || '#F97316'}15` }}
              >
                <Package size={24} style={{ color: pkg.color || '#F97316' }} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                  {!pkg.isActive && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{pkg.services.length} services included</p>
              </div>

              {/* Duration */}
              <div className="text-center px-4 hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{formatDuration(duration)}</p>
                <p className="text-xs text-gray-500">Duration</p>
              </div>

              {/* Original Price */}
              <div className="text-center px-4 hidden md:block">
                <p className="text-sm text-gray-500 line-through">{formatPrice(pkg.originalPrice)}</p>
                <p className="text-xs text-gray-400">Was</p>
              </div>

              {/* Package Price */}
              <div className="text-center px-4">
                <p className="text-lg font-bold text-gray-900">{formatPrice(pkg.packagePrice)}</p>
                <p className="text-xs text-green-600 font-medium">Save {savings.percent}%</p>
              </div>

              {/* Actions */}
              <div className="relative">
                <button
                  onClick={() => setExpandedMenuId(expandedMenuId === pkg.id ? null : pkg.id)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <MoreVertical size={18} />
                </button>
                {expandedMenuId === pkg.id && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setExpandedMenuId(null)} />
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      <button
                        onClick={() => {
                          setEditingPackage(pkg);
                          setShowModal(true);
                          setExpandedMenuId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Edit3 size={14} /> Edit
                      </button>
                      <button
                        onClick={() => {
                          handleDuplicate(pkg);
                          setExpandedMenuId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Copy size={14} /> Duplicate
                      </button>
                      <button
                        onClick={() => {
                          handleToggleActive(pkg.id);
                          setExpandedMenuId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {pkg.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                        {pkg.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={() => handleOpenDeleteDialog(pkg.id)}
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

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Service Packages</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Create bundles and packages to offer great value to your clients
            </p>
          </div>
          <button
            onClick={() => {
              setEditingPackage(undefined);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            <Plus size={18} />
            Add Package
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          renderSkeletons()
        ) : filteredPackages.length > 0 ? (
          viewMode === 'grid' || viewMode === 'compact' ? renderGridView() : renderListView()
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No packages yet</h3>
            <p className="text-gray-500 mb-4">
              Create service packages to offer bundled deals to your clients
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              <Plus size={18} />
              Create Package
            </button>
          </div>
        )}
      </div>

      {/* Package Modal */}
      <PackageModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingPackage(undefined);
        }}
        package={editingPackage}
        services={services}
        allPackages={packages}
        onSave={handleSavePackage}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={handleCloseDeleteDialog}
        title="Delete Package"
        description="Are you sure you want to delete this package? This action cannot be undone and will permanently remove the package from your catalog."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
