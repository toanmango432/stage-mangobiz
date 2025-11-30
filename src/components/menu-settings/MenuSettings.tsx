import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  Plus,
  Grid3X3,
  List,
  LayoutGrid,
  Filter,
  MoreVertical,
  Settings,
  Users,
  Package,
  Sparkles,
  FolderOpen,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

import type {
  MenuSettingsTab,
  ViewMode,
  ServiceCategory,
  MenuService,
  ServicePackage,
  ServiceAddOn,
} from './types';

import {
  sampleCategories,
  sampleServices,
  samplePackages,
  sampleAddOns,
  defaultMenuSettings,
} from './constants';

import { CategoriesSection } from './sections/CategoriesSection';
import { ServicesSection } from './sections/ServicesSection';
import { PackagesSection } from './sections/PackagesSection';
import { AddOnsSection } from './sections/AddOnsSection';
import { StaffPermissionsSection } from './sections/StaffPermissionsSection';
import { MenuGeneralSettingsSection } from './sections/MenuGeneralSettingsSection';

interface MenuSettingsProps {
  onBack?: () => void;
}

export function MenuSettings({ onBack }: MenuSettingsProps) {
  // State
  const [activeTab, setActiveTab] = useState<MenuSettingsTab>('services');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showInactive, setShowInactive] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Data State (will be replaced with Redux/Database later)
  const [categories, setCategories] = useState<ServiceCategory[]>(sampleCategories);
  const [services, setServices] = useState<MenuService[]>(sampleServices);
  const [packages, setPackages] = useState<ServicePackage[]>(samplePackages);
  const [addOns, setAddOns] = useState<ServiceAddOn[]>(sampleAddOns);
  const [settings, setSettings] = useState(defaultMenuSettings);

  // Tab configuration
  const tabs: { id: MenuSettingsTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'categories', label: 'Categories', icon: <FolderOpen size={18} />, count: categories.length },
    { id: 'services', label: 'Services', icon: <Sparkles size={18} />, count: services.length },
    { id: 'packages', label: 'Packages', icon: <Package size={18} />, count: packages.length },
    { id: 'addons', label: 'Add-ons', icon: <Plus size={18} />, count: addOns.length },
    { id: 'staff', label: 'Staff Permissions', icon: <Users size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  // Filtered data based on search and category
  const filteredServices = useMemo(() => {
    let result = services;

    if (selectedCategoryId) {
      result = result.filter(s => s.categoryId === selectedCategoryId);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query)
      );
    }

    if (!showInactive) {
      result = result.filter(s => s.status === 'active');
    }

    return result;
  }, [services, selectedCategoryId, searchQuery, showInactive]);

  // Handler functions
  const handleCategoryUpdate = (updatedCategories: ServiceCategory[]) => {
    setCategories(updatedCategories);
  };

  const handleServiceUpdate = (updatedServices: MenuService[]) => {
    setServices(updatedServices);
  };

  const handlePackageUpdate = (updatedPackages: ServicePackage[]) => {
    setPackages(updatedPackages);
  };

  const handleAddOnUpdate = (updatedAddOns: ServiceAddOn[]) => {
    setAddOns(updatedAddOns);
  };

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'categories':
        return (
          <CategoriesSection
            categories={categories}
            services={services}
            onUpdate={handleCategoryUpdate}
            searchQuery={searchQuery}
          />
        );
      case 'services':
        return (
          <ServicesSection
            services={filteredServices}
            categories={categories}
            viewMode={viewMode}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
            onUpdate={handleServiceUpdate}
            allServices={services}
          />
        );
      case 'packages':
        return (
          <PackagesSection
            packages={packages}
            services={services}
            categories={categories}
            viewMode={viewMode}
            onUpdate={handlePackageUpdate}
            searchQuery={searchQuery}
          />
        );
      case 'addons':
        return (
          <AddOnsSection
            addOns={addOns}
            categories={categories}
            services={services}
            viewMode={viewMode}
            onUpdate={handleAddOnUpdate}
            searchQuery={searchQuery}
          />
        );
      case 'staff':
        return (
          <StaffPermissionsSection
            categories={categories}
            services={services}
          />
        );
      case 'settings':
        return (
          <MenuGeneralSettingsSection
            settings={settings}
            onUpdate={setSettings}
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
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
              <p className="text-xs text-gray-500">Categories</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{services.length}</p>
              <p className="text-xs text-gray-500">Services</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{packages.length}</p>
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
                activeTab === tab.id
                  ? 'bg-orange-50 text-orange-600 border border-orange-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id
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
      {(activeTab === 'services' || activeTab === 'packages' || activeTab === 'addons') && (
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* View Controls */}
            <div className="flex items-center gap-2">
              {/* Show Inactive Toggle */}
              <button
                onClick={() => setShowInactive(!showInactive)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  showInactive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {showInactive ? <Eye size={16} /> : <EyeOff size={16} />}
                <span className="hidden sm:inline">
                  {showInactive ? 'Showing All' : 'Active Only'}
                </span>
              </button>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded ${
                    viewMode === 'grid'
                      ? 'bg-white shadow text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Grid3X3 size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded ${
                    viewMode === 'list'
                      ? 'bg-white shadow text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List size={16} />
                </button>
                <button
                  onClick={() => setViewMode('compact')}
                  className={`p-1.5 rounded ${
                    viewMode === 'compact'
                      ? 'bg-white shadow text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <LayoutGrid size={16} />
                </button>
              </div>

              {/* More Options */}
              <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                <MoreVertical size={18} />
              </button>
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
