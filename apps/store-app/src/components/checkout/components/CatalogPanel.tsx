/**
 * CatalogPanel - Right panel for catalog browsing (services, products, packages, gift cards)
 *
 * Extracted from TicketPanel.tsx to reduce file complexity.
 * Supports both full and dock modes with appropriate layouts.
 */

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, Users, Minimize2, Maximize2, Search, MoreVertical, Sparkles, ShoppingBag, Package, Gift, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ItemTabBar, type ItemTabType } from "../ItemTabBar";
import StaffGridView from "../StaffGridView";
import FullPageServiceSelector from "../FullPageServiceSelector";
import { ProductGrid } from "../ProductGrid";
import { PackageGrid } from "../PackageGrid";
import { GiftCardGrid } from "../GiftCardGrid";
import { getProductsByCategory } from "@/data/mockProducts";
import { getPackagesByCategory } from "@/data/mockPackages";
import type { Service } from "../ServiceGrid";
import type { TicketService, StaffMember } from "../ServiceList";
import type { GiftCardSaleData } from "../modals/SellGiftCardModal";
import type { GiftCardDenomination, GiftCardSettings } from "@/types/catalog";
import type { PanelMode } from "../types";

export interface CatalogPanelProps {
  fullPageTab: "services" | "staff";
  addItemTab: ItemTabType;
  selectedCategory: string;
  searchQuery: string;
  mode: PanelMode;
  staffMembers: StaffMember[];
  services: TicketService[];
  activeStaffId: string | null;
  reassigningServiceIds: string[];
  giftCardDenominations: GiftCardDenomination[];
  giftCardSettings: GiftCardSettings | null;
  onSetMode: (mode: PanelMode) => void;
  onSetFullPageTab: (tab: "services" | "staff") => void;
  onSetAddItemTab: (tab: ItemTabType) => void;
  onSetSelectedCategory: (category: string) => void;
  onSetSearchQuery: (query: string) => void;
  onAddServices: (services: Service[], staffId?: string, staffName?: string) => void;
  onAddServiceToStaff: (staffId: string, staffName: string) => void;
  onAddGiftCard: (giftCardData: GiftCardSaleData) => void;
}

export function CatalogPanel({
  fullPageTab,
  addItemTab,
  selectedCategory,
  searchQuery,
  mode,
  staffMembers,
  services,
  activeStaffId,
  reassigningServiceIds,
  giftCardDenominations,
  giftCardSettings,
  onSetMode,
  onSetFullPageTab,
  onSetAddItemTab,
  onSetSelectedCategory,
  onSetSearchQuery,
  onAddServices,
  onAddServiceToStaff,
  onAddGiftCard,
}: CatalogPanelProps) {
  const [showSearchInput, setShowSearchInput] = useState(false);  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when it becomes visible
  useEffect(() => {
    if (showSearchInput && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [showSearchInput]);

  const handleAddProductAsService = (product: { name: string; category: string; price: number }) => {
    onAddServices([{
      id: `prod-${Date.now()}`,
      name: product.name,
      category: product.category,
      price: product.price,
      duration: 0,
    }]);
  };

  const handleAddPackageAsService = (pkg: { name: string; salePrice: number }) => {
    onAddServices([{
      id: `pkg-${Date.now()}`,
      name: pkg.name,
      category: "Package",
      price: pkg.salePrice,
      duration: 0,
    }]);
  };

  const handleTabChange = (tab: ItemTabType) => {
    onSetAddItemTab(tab);
    onSetSelectedCategory("all");
    onSetSearchQuery("");
  };

  if (mode === "full") {
    return (
      <div className="h-full flex flex-col min-w-0 overflow-hidden">
        {/* Main Category Tab Bar - darker background */}
        <div className="flex-shrink-0 bg-gray-100/70 px-4 py-3">
          {fullPageTab === "staff" ? (
            <StaffSelectionHeader
              onBackToCatalog={() => onSetFullPageTab("services")}
              onMinimize={() => onSetMode("dock")}
            />
          ) : (
            <ItemTabBar
              activeTab={addItemTab}
              onTabChange={handleTabChange}
              layout="modern"
              searchQuery={searchQuery}
              onSearchChange={onSetSearchQuery}
              onMoreClick={() => {
                console.log("More options clicked - menu editing");
              }}
              rightControls={
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onSetMode("dock")}
                      data-testid="button-toggle-mode-inline"
                      className="h-9 w-9 rounded-full bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
                      aria-label="Switch to docked view"
                    >
                      <Minimize2 className="h-4 w-4 text-gray-500" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Switch to partial view</p>
                  </TooltipContent>
                </Tooltip>
              }
            />
          )}
        </div>

        {/* Content Area - lighter background, scrollable */}
        <div className="flex-1 min-h-0 overflow-auto bg-gray-50/50 px-4">
          <CatalogContent
            fullPageTab={fullPageTab}
            addItemTab={addItemTab}
            selectedCategory={selectedCategory}
            searchQuery={searchQuery}
            staffMembers={staffMembers}
            services={services}
            activeStaffId={activeStaffId}
            reassigningServiceIds={reassigningServiceIds}
            giftCardDenominations={giftCardDenominations}
            giftCardSettings={giftCardSettings}
            onSetSelectedCategory={onSetSelectedCategory}
            onAddServices={onAddServices}
            onAddServiceToStaff={onAddServiceToStaff}
            onAddGiftCard={onAddGiftCard}
            onAddProduct={handleAddProductAsService}
            onAddPackage={handleAddPackageAsService}
            compactMode={false}
          />
        </div>
      </div>
    );
  }

  // Dock mode layout
  return (
    <div className="h-full flex flex-col min-w-0 overflow-hidden">
      {/* Header with controls and tabs - same background */}
      <div className="flex-shrink-0 bg-gray-100/70 px-3 pt-2 pb-1">
        {fullPageTab === "staff" ? (
          <DockStaffSelectionHeader onBackToCatalog={() => onSetFullPageTab("services")} />
        ) : (
          <>
            {/* Top Row: Controls (right-aligned) */}
            <div className="flex items-center justify-end gap-1.5 mb-2">
              {/* Search Input - Toggleable */}
              {showSearchInput && (
                <div className="flex items-center gap-1">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSetSearchQuery(e.target.value)}
                    placeholder="Search..."
                    onBlur={() => {
                      if (!searchQuery.trim()) {
                        setShowSearchInput(false);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        onSetSearchQuery("");
                        setShowSearchInput(false);
                      }
                    }}
                    className="h-7 px-2 py-1 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                  <button
                    onClick={() => {
                      onSetSearchQuery("");
                      setShowSearchInput(false);
                    }}
                    className="h-7 w-7 rounded-full bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-all duration-150"
                    aria-label="Close search"
                  >
                    <X className="h-3.5 w-3.5 text-gray-500" />
                  </button>
                </div>
              )}

              {/* Search Icon Button */}
              <button
                onClick={() => setShowSearchInput(!showSearchInput)}
                className="h-7 w-7 rounded-full bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Search"
              >
                <Search className="h-3.5 w-3.5 text-gray-500" />
              </button>

              <button
                onClick={() => console.log("More options clicked")}
                className="h-7 w-7 rounded-full bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="More options"
              >
                <MoreVertical className="h-3.5 w-3.5 text-gray-500" />
              </button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onSetMode("full")}
                    data-testid="button-toggle-mode-dock-inline"
                    className="h-7 w-7 rounded-full bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
                    aria-label="Expand to full screen"
                  >
                    <Maximize2 className="h-3.5 w-3.5 text-gray-500" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Expand to full page</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Second Row: Main Category Tabs */}
            <div className="flex items-center bg-gray-100/80 p-1 rounded-full overflow-x-auto scrollbar-hide">
              {[
                { id: 'services' as const, label: 'Services', icon: Sparkles },
                { id: 'products' as const, label: 'Products', icon: ShoppingBag },
                { id: 'packages' as const, label: 'Packages', icon: Package },
                { id: 'giftcards' as const, label: 'Gift Cards', icon: Gift },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-150 whitespace-nowrap flex-shrink-0 ${
                      addItemTab === tab.id
                        ? 'bg-white text-gray-800 shadow-sm'
                        : 'text-gray-500 hover:text-gray-600'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Content Area - lighter background, scrollable */}
      <div className="flex-1 min-h-0 overflow-auto bg-gray-50/50 px-3">
        <CatalogContent
          fullPageTab={fullPageTab}
          addItemTab={addItemTab}
          selectedCategory={selectedCategory}
          searchQuery={searchQuery}
          staffMembers={staffMembers}
          services={services}
          activeStaffId={activeStaffId}
          reassigningServiceIds={reassigningServiceIds}
          giftCardDenominations={giftCardDenominations}
          giftCardSettings={giftCardSettings}
          onSetSelectedCategory={onSetSelectedCategory}
          onAddServices={onAddServices}
          onAddServiceToStaff={onAddServiceToStaff}
          onAddGiftCard={onAddGiftCard}
          onAddProduct={handleAddProductAsService}
          onAddPackage={handleAddPackageAsService}
          compactMode={true}
        />
      </div>
    </div>
  );
}

// Staff Selection Header for Full Mode
function StaffSelectionHeader({
  onBackToCatalog,
  onMinimize,
}: {
  onBackToCatalog: () => void;
  onMinimize: () => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <button
        onClick={onBackToCatalog}
        className="flex items-center gap-2 pl-3 pr-4 py-2 text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-full shadow-sm transition-all hover:shadow"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Catalog</span>
      </button>

      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-primary">Select Staff</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onMinimize}
              data-testid="button-toggle-mode-staff"
              className="h-9 w-9 rounded-full bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
              aria-label="Switch to docked view"
            >
              <Minimize2 className="h-4 w-4 text-gray-500" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Switch to partial view</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

// Staff Selection Header for Dock Mode
function DockStaffSelectionHeader({ onBackToCatalog }: { onBackToCatalog: () => void }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <button
        onClick={onBackToCatalog}
        className="flex items-center gap-1.5 pl-2 pr-3 py-1.5 text-xs font-medium bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-full shadow-sm transition-all hover:shadow"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Catalog</span>
      </button>

      <div className="flex-1 flex items-center justify-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
          <Users className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-primary">Select Staff</span>
        </div>
      </div>

      <div className="w-[72px]" />
    </div>
  );
}

// Catalog Content (shared between modes)
interface CatalogContentProps {
  fullPageTab: "services" | "staff";
  addItemTab: ItemTabType;
  selectedCategory: string;
  searchQuery: string;
  staffMembers: StaffMember[];
  services: TicketService[];
  activeStaffId: string | null;
  reassigningServiceIds: string[];
  giftCardDenominations: GiftCardDenomination[];
  giftCardSettings: GiftCardSettings | null;
  onSetSelectedCategory: (category: string) => void;
  onAddServices: (services: Service[], staffId?: string, staffName?: string) => void;
  onAddServiceToStaff: (staffId: string, staffName: string) => void;
  onAddGiftCard: (giftCardData: GiftCardSaleData) => void;
  onAddProduct: (product: { name: string; category: string; price: number }) => void;
  onAddPackage: (pkg: { name: string; salePrice: number }) => void;
  compactMode: boolean;
}

function CatalogContent({
  fullPageTab,
  addItemTab,
  selectedCategory,
  searchQuery,
  staffMembers,
  services,
  activeStaffId,
  reassigningServiceIds,
  giftCardDenominations,
  giftCardSettings,
  onSetSelectedCategory,
  onAddServices,
  onAddServiceToStaff,
  onAddGiftCard,
  onAddProduct,
  onAddPackage,
  compactMode,
}: CatalogContentProps) {
  const q = (searchQuery || '').trim().toLowerCase();

  const productsForCategory = getProductsByCategory(selectedCategory);
  const filteredProducts = q
    ? productsForCategory.filter((p: any) => {
        const hay = `${p.name || ''} ${p.category || ''} ${p.description || ''}`.toLowerCase();
        return hay.includes(q);
      })
    : productsForCategory;

  const packagesForCategory = getPackagesByCategory(selectedCategory);
  const filteredPackages = q
    ? packagesForCategory.filter((pkg: any) => {
        const hay = `${pkg.name || ''} ${pkg.description || ''}`.toLowerCase();
        return hay.includes(q);
      })
    : packagesForCategory;

  const filteredGiftCards = q
    ? (giftCardDenominations || []).filter((d: any) => {
        const hay = `${d.label || ''} ${d.amount || ''} ${d.isActive ? 'active' : 'inactive'}`.toLowerCase();
        return hay.includes(q);
      })
    : giftCardDenominations || [];

  if (fullPageTab === "staff") {
    return (
      <StaffGridView
        staffMembers={staffMembers}
        services={services}
        onAddServiceToStaff={onAddServiceToStaff}
        reassigningServiceIds={reassigningServiceIds}
        selectedStaffId={activeStaffId}
        compactMode={compactMode}
      />
    );
  }

  if (addItemTab === "services") {
    return (
      <FullPageServiceSelector
        selectedCategory={selectedCategory}
        onSelectCategory={onSetSelectedCategory}
        onAddServices={onAddServices}
        staffMembers={staffMembers}
        activeStaffId={activeStaffId}
        layout="modern"
        externalSearchQuery={compactMode ? undefined : searchQuery}
        searchQuery={compactMode ? searchQuery : undefined}
        compactMode={compactMode}
      />
    );
  }

  if (addItemTab === "products") {
    return (
      <ProductGrid
        products={filteredProducts}
        onSelectProduct={onAddProduct}
      />
    );
  }

  if (addItemTab === "packages") {
    return (
      <PackageGrid
        packages={filteredPackages}
        onSelectPackage={onAddPackage}
      />
    );
  }

  if (addItemTab === "giftcards") {
    return (
      <GiftCardGrid
        denominations={filteredGiftCards}
        settings={giftCardSettings}
        onAddGiftCard={onAddGiftCard}
      />
    );
  }

  return null;
}

export default CatalogPanel;
