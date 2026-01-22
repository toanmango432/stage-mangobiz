import { useMemo, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  ArrowLeft,
  Search,
  Plus,
  Grid3X3,
  List,
  LayoutGrid,
  Settings,
  Users,
  Package,
  Sparkles,
  FolderOpen,
  Eye,
  EyeOff,
  ShoppingBag,
  Archive,
} from 'lucide-react';
import toast from 'react-hot-toast';

import type { CatalogTab } from '../../types/catalog';
import { useCatalog } from '../../hooks/useCatalog';
import { selectSalonId, selectCurrentUser, selectTenantId } from '../../store/slices/authSlice';

import { CategoriesSection } from './sections/CategoriesSection';
import { ServicesSection } from './sections/ServicesSection';
import { PackagesSection } from './sections/PackagesSection';
import { ProductsSection } from './sections/ProductsSection';
import { AddOnsSection } from './sections/AddOnsSection';
import { GiftCardsSection } from './sections/GiftCardsSection';
import { StaffPermissionsSection } from './sections/StaffPermissionsSection';
import { MenuGeneralSettingsSection } from './sections/MenuGeneralSettingsSection';
import { ArchivedServicesTab } from './ArchivedServicesTab';
import { MoreOptionsDropdown } from './components';

interface MenuSettingsProps {
  onBack?: () => void;
}

export function MenuSettings({ onBack }: MenuSettingsProps) {
  // Get storeId, tenantId, and userId from Redux auth state
  const storeId = useSelector(selectSalonId) || '';
  const tenantId = useSelector(selectTenantId) || storeId;
  const currentUser = useSelector(selectCurrentUser);
  const userId = currentUser?.id || 'system';

  // Bulk edit mode state
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);

  // Toast wrapper for useCatalog hook
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      toast.success(message);
    } else {
      toast.error(message);
    }
  }, []);

  // More Options handlers
  const handleImportJson = useCallback(() => {
    // TODO: Implement JSON import - create file input and parse JSON
    toast('Import from JSON - Coming soon', { icon: '📥' });
  }, []);

  const handleImportCsv = useCallback(() => {
    // TODO: Implement CSV import - create file input and parse CSV
    toast('Import from CSV - Coming soon', { icon: '📥' });
  }, []);

  const handleExportJson = useCallback(() => {
    // TODO: Implement JSON export - serialize catalog data to JSON file
    toast('Export to JSON - Coming soon', { icon: '📤' });
  }, []);

  const handleExportCsv = useCallback(() => {
    // TODO: Implement CSV export - serialize catalog data to CSV file
    toast('Export to CSV - Coming soon', { icon: '📤' });
  }, []);

  const handleToggleBulkEdit = useCallback(() => {
    setIsBulkEditMode((prev) => !prev);
    toast(isBulkEditMode ? 'Bulk edit mode disabled' : 'Bulk edit mode enabled', {
      icon: isBulkEditMode ? '✏️' : '📝',
    });
  }, [isBulkEditMode]);

  const handlePrintMenu = useCallback(() => {
    window.print();
  }, []);

  // Use the catalog hook for all data and actions
  // Pass a placeholder storeId if empty to avoid hook order issues
  const catalog = useCatalog({
    storeId: storeId || 'placeholder',
    tenantId: tenantId || 'placeholder',
    userId,
    toast: showToast,
  });

  const {
    // Data
    categories,
    services,
    filteredServices,
    packages,
    filteredPackages,
    products,
    filteredProducts,
    productCategories,
    addOnGroupsWithOptions,
    settings,
    giftCardDenominations,
    giftCardSettings,
    // UI State
    ui,
    setActiveTab,
    setSelectedCategory,
    setSearchQuery,
    setViewMode,
    setShowInactive,
    // Loading
    isLoading,
    // Actions
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    createService,
    updateService,
    deleteService,
    createPackage,
    updatePackage,
    deletePackage,
    // Product Actions
    createProduct,
    updateProduct,
    deleteProduct,
    archiveProduct,
    // Add-on Group/Option Actions
    createAddOnGroup,
    updateAddOnGroup,
    deleteAddOnGroup,
    createAddOnOption,
    updateAddOnOption,
    deleteAddOnOption,
    updateSettings,
    // Gift Card Actions
    createGiftCardDenomination,
    updateGiftCardDenomination,
    deleteGiftCardDenomination,
    updateGiftCardSettings,
    // Service Archive Actions
    getArchivedServices,
    restoreService,
    archiveService,
    checkServiceDependencies,
  } = catalog;

  // Tab configuration
  // Note: Gift Cards tab removed - now available under More > Gift Cards
  const archivedServices = getArchivedServices();
  const tabs: { id: CatalogTab; label: string; icon: React.ReactNode; count?: number }[] = useMemo(() => [
    { id: 'categories', label: 'Categories', icon: <FolderOpen size={18} />, count: categories?.length || 0 },
    { id: 'services', label: 'Services', icon: <Sparkles size={18} />, count: services?.length || 0 },
    { id: 'archived', label: 'Archived', icon: <Archive size={18} />, count: archivedServices?.length || 0 },
    { id: 'packages', label: 'Packages', icon: <Package size={18} />, count: packages?.length || 0 },
    { id: 'products', label: 'Products', icon: <ShoppingBag size={18} />, count: products?.length || 0 },
    { id: 'addons', label: 'Add-ons', icon: <Plus size={18} />, count: addOnGroupsWithOptions?.length || 0 },
    { id: 'staff', label: 'Staff Permissions', icon: <Users size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
  ], [categories, services, archivedServices, packages, products, addOnGroupsWithOptions]);

  // Show error state if storeId is not available (user not logged in properly)
  if (!storeId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="w-16 h-16 mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <Settings className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Catalog Unavailable</h2>
        <p className="text-gray-500 text-center max-w-md">
          Please log in to a store to access the catalog settings.
        </p>
        {onBack && (
          <button
            onClick={onBack}
            className="mt-6 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Go Back
          </button>
        )}
      </div>
    );
  }

  // Render content based on active tab
  const renderContent = () => {
    switch (ui.activeTab) {
      case 'categories':
        return (
          <CategoriesSection
            categories={categories || []}
            services={services || []}
            searchQuery={ui.searchQuery}
            onCreate={createCategory}
            onUpdate={updateCategory}
            onDelete={deleteCategory}
            onReorder={reorderCategories}
          />
        );
      case 'services':
        return (
          <ServicesSection
            services={filteredServices || []}
            categories={categories || []}
            viewMode={ui.viewMode}
            selectedCategoryId={ui.selectedCategoryId}
            onSelectCategory={setSelectedCategory}
            allServices={services || []}
            onCreate={createService}
            onUpdate={updateService}
            onDelete={deleteService}
            onArchive={archiveService}
            checkServiceDependencies={checkServiceDependencies}
          />
        );
      case 'archived':
        return (
          <ArchivedServicesTab
            archivedServices={archivedServices || []}
            categories={categories || []}
            onRestore={restoreService}
          />
        );
      case 'packages':
        return (
          <PackagesSection
            packages={filteredPackages || []}
            services={services || []}
            categories={categories || []}
            viewMode={ui.viewMode}
            searchQuery={ui.searchQuery}
            onCreate={createPackage}
            onUpdate={updatePackage}
            onDelete={deletePackage}
          />
        );
      case 'products':
        return (
          <ProductsSection
            products={filteredProducts || []}
            productCategories={productCategories || []}
            viewMode={ui.viewMode}
            searchQuery={ui.searchQuery}
            onCreate={createProduct}
            onUpdate={updateProduct}
            onDelete={deleteProduct}
            onArchive={archiveProduct}
          />
        );
      case 'addons':
        return (
          <AddOnsSection
            addOnGroups={addOnGroupsWithOptions || []}
            categories={categories || []}
            services={services || []}
            viewMode={ui.viewMode}
            searchQuery={ui.searchQuery}
            onCreateGroup={createAddOnGroup}
            onUpdateGroup={updateAddOnGroup}
            onDeleteGroup={deleteAddOnGroup}
            onCreateOption={createAddOnOption}
            onUpdateOption={updateAddOnOption}
            onDeleteOption={deleteAddOnOption}
          />
        );
      case 'giftcards':
        return (
          <GiftCardsSection
            denominations={giftCardDenominations || []}
            settings={giftCardSettings}
            isLoading={isLoading}
            onCreateDenomination={createGiftCardDenomination}
            onUpdateDenomination={updateGiftCardDenomination}
            onDeleteDenomination={deleteGiftCardDenomination}
            onUpdateSettings={updateGiftCardSettings}
          />
        );
      case 'staff':
        return (
          <StaffPermissionsSection
            categories={categories || []}
            services={services || []}
          />
        );
      case 'settings':
        return (
          <MenuGeneralSettingsSection
            settings={settings || undefined}
            onUpdate={updateSettings}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Menu & Services</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Manage your service menu, packages, and pricing
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="hidden lg:flex items-center gap-6">
            {isLoading && (
              <div className="text-sm text-gray-500">Loading...</div>
            )}
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{categories?.length || 0}</p>
              <p className="text-xs text-gray-500">Categories</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{services?.length || 0}</p>
              <p className="text-xs text-gray-500">Services</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{packages?.length || 0}</p>
              <p className="text-xs text-gray-500">Packages</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-4 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                ui.activeTab === tab.id
                  ? 'bg-orange-50 text-orange-600 border border-orange-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                  ui.activeTab === tab.id
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      {(ui.activeTab === 'services' || ui.activeTab === 'packages' || ui.activeTab === 'products' || ui.activeTab === 'addons') && (
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search services..."
                value={ui.searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* View Controls */}
            <div className="flex items-center gap-2">
              {/* Show Inactive Toggle */}
              <button
                onClick={() => setShowInactive(!ui.showInactive)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  ui.showInactive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {ui.showInactive ? <Eye size={16} /> : <EyeOff size={16} />}
                <span className="hidden sm:inline">
                  {ui.showInactive ? 'Showing All' : 'Active Only'}
                </span>
              </button>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded ${
                    ui.viewMode === 'grid'
                      ? 'bg-white shadow text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Grid3X3 size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded ${
                    ui.viewMode === 'list'
                      ? 'bg-white shadow text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List size={16} />
                </button>
                <button
                  onClick={() => setViewMode('compact')}
                  className={`p-1.5 rounded ${
                    ui.viewMode === 'compact'
                      ? 'bg-white shadow text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <LayoutGrid size={16} />
                </button>
              </div>

              {/* More Options */}
              <MoreOptionsDropdown
                onImportJson={handleImportJson}
                onImportCsv={handleImportCsv}
                onExportJson={handleExportJson}
                onExportCsv={handleExportCsv}
                onToggleBulkEdit={handleToggleBulkEdit}
                isBulkEditActive={isBulkEditMode}
                onPrintMenu={handlePrintMenu}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}

export default MenuSettings;
