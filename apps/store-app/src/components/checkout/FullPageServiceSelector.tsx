import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/Button";
import { Scissors, Palette, Sparkles, Users as UsersIcon, Star, Search, ArrowLeft, ChevronLeft, ChevronRight, Plus, Archive } from "lucide-react";

export interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
  /** Service status: active, inactive, or archived */
  status?: 'active' | 'inactive' | 'archived';
}

export interface StaffMember {
  id: string;
  name: string;
}

interface FullPageServiceSelectorProps {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  onAddServices: (services: Service[], staffId?: string, staffName?: string) => void;
  staffMembers: StaffMember[];
  activeStaffId?: string | null;
  onBack?: () => void;
  layout?: "classic" | "modern";
  externalSearchQuery?: string; // External search query from parent (modern layout)
  searchQuery?: string; // Search query from parent (modern layout)
  compactMode?: boolean; // For dock mode - smaller categories and service cards
  /**
   * When true, includes archived services in the list with a visual indicator.
   * Useful for admin views that need to see/restore archived services.
   * Default: false (hides archived services)
   */
  showArchived?: boolean;
  /**
   * External services data from catalog. If provided, uses this instead of mock data.
   * Services with status='archived' are filtered unless showArchived=true.
   */
  services?: Service[];
}

const SERVICES: Service[] = [
  { id: "1", name: "Haircut - Women", category: "Hair", price: 65, duration: 60 },
  { id: "2", name: "Haircut - Men", category: "Hair", price: 45, duration: 45 },
  { id: "3", name: "Color - Full", category: "Hair", price: 120, duration: 120 },
  { id: "4", name: "Highlights", category: "Hair", price: 150, duration: 150 },
  { id: "5", name: "Blowout", category: "Hair", price: 55, duration: 45 },
  { id: "6", name: "Manicure", category: "Nails", price: 35, duration: 30 },
  { id: "7", name: "Pedicure", category: "Nails", price: 50, duration: 45 },
  { id: "8", name: "Gel Manicure", category: "Nails", price: 45, duration: 45 },
  { id: "9", name: "Acrylic Set", category: "Nails", price: 75, duration: 90 },
  { id: "10", name: "Facial - Classic", category: "Spa", price: 85, duration: 60 },
  { id: "11", name: "Massage - 60min", category: "Spa", price: 95, duration: 60 },
  { id: "12", name: "Massage - 90min", category: "Spa", price: 130, duration: 90 },
];

const POPULAR_SERVICES = [
  { id: "1", name: "Haircut - Women", category: "Hair", price: 65, duration: 60 },
  { id: "2", name: "Haircut - Men", category: "Hair", price: 45, duration: 45 },
  { id: "6", name: "Manicure", category: "Nails", price: 35, duration: 30 },
  { id: "7", name: "Pedicure", category: "Nails", price: 50, duration: 45 },
  { id: "10", name: "Facial - Classic", category: "Spa", price: 85, duration: 60 },
  { id: "11", name: "Massage - 60min", category: "Spa", price: 95, duration: 60 },
];

// Category color mapping for visual identification - matching reference design
export const CATEGORY_COLORS: Record<string, { border: string; bg: string; text: string; modernBg: string; modernBorder: string }> = {
  Hair: { border: "border-l-amber-400", bg: "bg-amber-50", text: "text-amber-700", modernBg: "bg-yellow-100", modernBorder: "border-yellow-200" },
  Nails: { border: "border-l-pink-400", bg: "bg-pink-50", text: "text-pink-700", modernBg: "bg-pink-200", modernBorder: "border-pink-300" },
  Spa: { border: "border-l-brand-400", bg: "bg-brand-50", text: "text-brand-700", modernBg: "bg-brand-200", modernBorder: "border-brand-300" },
  Massage: { border: "border-l-cyan-400", bg: "bg-cyan-50", text: "text-cyan-700", modernBg: "bg-cyan-200", modernBorder: "border-cyan-300" },
  Skincare: { border: "border-l-rose-400", bg: "bg-rose-50", text: "text-rose-700", modernBg: "bg-rose-200", modernBorder: "border-rose-300" },
  Lashes: { border: "border-l-purple-400", bg: "bg-purple-50", text: "text-purple-700", modernBg: "bg-purple-200", modernBorder: "border-purple-300" },
  Brows: { border: "border-l-orange-400", bg: "bg-orange-50", text: "text-orange-700", modernBg: "bg-orange-200", modernBorder: "border-orange-300" },
  Waxing: { border: "border-l-lime-400", bg: "bg-lime-50", text: "text-lime-700", modernBg: "bg-lime-200", modernBorder: "border-lime-300" },
  default: { border: "border-l-gray-300", bg: "bg-gray-50", text: "text-gray-600", modernBg: "bg-gray-100", modernBorder: "border-gray-200" },
};

// Service categories (default - for classic layout)
export const SERVICE_CATEGORIES = [
  { id: "all", name: "ALL", icon: Sparkles },
  { id: "popular", name: "POPULAR", icon: Star },
  { id: "Hair", name: "HAIR", icon: Scissors },
  { id: "Nails", name: "NAILS", icon: Palette },
  { id: "Spa", name: "SPA", icon: UsersIcon },
];

// Modern categories with emoji icons (matching reference design)
export const MODERN_CATEGORIES = [
  { id: "Hair", name: "Hair", emoji: "✂️" },
  { id: "Nails", name: "Nails", emoji: "💅" },
  { id: "Spa", name: "Spa", emoji: "💆" },
  { id: "Massage", name: "Massage", emoji: "💆‍♀️" },
  { id: "Skincare", name: "Skincare", emoji: "🧴" },
  { id: "Lashes", name: "Lashes", emoji: "👁️" },
  { id: "Brows", name: "Brows", emoji: "🖌️" },
  { id: "Waxing", name: "Waxing", emoji: "🧈" },
];

// Keep CATEGORIES as alias for backward compatibility
export const CATEGORIES = SERVICE_CATEGORIES;

export interface CategoryItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface CategoryListProps {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  onViewStaff?: () => void;
  showViewStaffButton?: boolean;
  categories?: CategoryItem[];
}

export function CategoryList({
  selectedCategory,
  onSelectCategory,
  onViewStaff,
  showViewStaffButton = true,
  categories = SERVICE_CATEGORIES
}: CategoryListProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Categories - scrollable area */}
      <div className="flex-1 flex flex-col gap-2 overflow-y-auto pb-3">
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = selectedCategory === category.id;
          return (
            <button
              key={category.id}
              className={`w-full p-3 rounded-xl transition-all text-left ${
                isActive
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-100"
              }`}
              onClick={() => onSelectCategory(category.id)}
              data-testid={`button-category-${category.id}`}
            >
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                  isActive ? "bg-white/20" : "bg-gray-100"
                }`}>
                  <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-gray-600"}`} />
                </div>
                <span className={`text-sm font-medium ${
                  isActive ? "text-white" : "text-gray-700"
                }`}>
                  {category.name}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* View Staff Button - fixed at bottom */}
      {showViewStaffButton && onViewStaff && (
        <div className="flex-shrink-0 pt-3 border-t border-gray-100">
          <button
            onClick={onViewStaff}
            className="w-full p-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-all flex items-center justify-center gap-2"
            data-testid="button-view-staff"
          >
            <UsersIcon className="h-4 w-4" />
            <span className="text-sm font-medium">View Staff</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function FullPageServiceSelector({
  selectedCategory,
  onSelectCategory,
  onAddServices,
  staffMembers,
  activeStaffId,
  onBack,
  layout = "classic",
  externalSearchQuery,
  searchQuery: externalSearchQueryProp,
  compactMode = false,
  showArchived = false,
  services: externalServices,
}: FullPageServiceSelectorProps) {
  const [internalSearchQuery, setInternalSearchQuery] = useState("");

  // Use external search query if provided (modern layout), otherwise use internal
  const searchQuery = layout === "modern" && (externalSearchQuery !== undefined || externalSearchQueryProp !== undefined)
    ? (externalSearchQueryProp ?? externalSearchQuery ?? "")
    : internalSearchQuery;
  const setSearchQuery = setInternalSearchQuery;

  // Use external services if provided, otherwise use mock data
  // Filter out archived services unless showArchived is true
  const availableServices = useMemo(() => {
    const baseServices = externalServices ?? SERVICES;
    if (showArchived) {
      return baseServices;
    }
    // Filter out archived services (status !== 'archived' or status is undefined for mock data)
    return baseServices.filter(s => s.status !== 'archived');
  }, [externalServices, showArchived]);
  
  const activeStaff = activeStaffId 
    ? staffMembers.find(s => s.id === activeStaffId)
    : null;
  
  const getStaffInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredServices = availableServices.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.category.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesCategory = false;
    if (selectedCategory === "all") {
      matchesCategory = true;
    } else if (selectedCategory === "popular") {
      matchesCategory = POPULAR_SERVICES.some((ps) => ps.id === service.id);
    } else {
      matchesCategory = service.category === selectedCategory;
    }

    return matchesSearch && matchesCategory;
  });

  const handleServiceClick = (service: Service) => {
    onAddServices([service]);
  };

  // Ref for category scroll container (modern layout)
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check if scroll arrows should be visible
  const checkScrollability = useCallback(() => {
    if (categoryScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    }
  }, []);

  // Check scrollability on mount and when categories change
  useEffect(() => {
    checkScrollability();
    // Add resize observer to check when container size changes
    const resizeObserver = new ResizeObserver(checkScrollability);
    if (categoryScrollRef.current) {
      resizeObserver.observe(categoryScrollRef.current);
    }
    return () => resizeObserver.disconnect();
  }, [checkScrollability]);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = 200;
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Modern layout with horizontal category pills and emoji icons
  if (layout === "modern") {
    // Compact mode sizing for dock view
    const categorySize = compactMode
      ? "min-w-[80px] w-[80px] h-[72px]"
      : "min-w-[110px] w-[110px] h-[100px]";
    const categoryEmojiSize = compactMode ? "text-2xl mb-1" : "text-4xl mb-2";
    const categoryTextSize = compactMode ? "text-xs" : "text-sm";
    const gridMinWidth = compactMode ? "140px" : "180px";
    const cardPadding = compactMode ? "p-3" : "p-4";
    const cardMinHeight = compactMode ? "min-h-[100px]" : "min-h-[120px]";
    const plusButtonSize = compactMode ? "h-6 w-6" : "h-8 w-8";
    const plusIconSize = compactMode ? "h-4 w-4" : "h-5 w-5";

    return (
      <div className={`h-full flex flex-col ${compactMode ? 'pt-2' : 'pt-4'}`}>
        {/* Horizontal Category Pills with emoji icons and navigation arrows */}
        <div className={`${compactMode ? 'mb-3' : 'mb-5'} flex items-center gap-2`}>
          {/* Left Arrow - only show when can scroll left */}
          {canScrollLeft && (
            <button
              onClick={() => scrollCategories('left')}
              className={`flex-shrink-0 ${compactMode ? 'h-6 w-6' : 'h-8 w-8'} rounded-full bg-white shadow border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors`}
            >
              <ChevronLeft className={`${compactMode ? 'h-3 w-3' : 'h-4 w-4'} text-gray-400`} />
            </button>
          )}

          {/* Scrollable Category Pills - 3D elevated cards matching reference */}
          <div
            ref={categoryScrollRef}
            onScroll={checkScrollability}
            className={`flex-1 flex items-center ${compactMode ? 'gap-2' : 'gap-4'} overflow-x-auto scrollbar-hide scroll-smooth py-2 min-w-0`}
          >
            {MODERN_CATEGORIES.map((category) => {
              const isSelected = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => onSelectCategory(category.id)}
                  className={`flex flex-col items-center justify-center ${categorySize} rounded-2xl whitespace-nowrap transition-all duration-150 flex-shrink-0 ${
                    isSelected
                      ? "bg-white border-2 border-blue-500 shadow-lg"
                      : "bg-gray-50 shadow-md hover:shadow-lg border border-gray-100"
                  }`}
                >
                  <span className={categoryEmojiSize}>{category.emoji}</span>
                  <span className={`${categoryTextSize} font-semibold ${isSelected ? 'text-blue-600' : 'text-gray-700'}`}>
                    {category.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Arrow - only show when can scroll right */}
          {canScrollRight && (
            <button
              onClick={() => scrollCategories('right')}
              className={`flex-shrink-0 ${compactMode ? 'h-6 w-6' : 'h-8 w-8'} rounded-full bg-white shadow border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors`}
            >
              <ChevronRight className={`${compactMode ? 'h-3 w-3' : 'h-4 w-4'} text-gray-400`} />
            </button>
          )}
        </div>

        {/* Divider between sub-categories and items */}
        <div className={`border-b border-gray-200 -mx-3 ${compactMode ? 'mb-3' : 'mb-4'}`} />

        {/* Services Grid - auto-fit responsive columns */}
        <div className="flex-1 overflow-y-auto pr-1">
          {filteredServices.length === 0 ? (
            <Card className={`${compactMode ? 'p-4' : 'p-8'} text-center`}>
              <p className="text-sm text-muted-foreground">No services found</p>
            </Card>
          ) : (
            <div className="grid gap-3 pb-4" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${gridMinWidth}, 1fr))` }}>
              {filteredServices.map((service) => {
                const categoryColor = CATEGORY_COLORS[service.category] || CATEGORY_COLORS.default;
                const isArchived = service.status === 'archived';
                return (
                  <button
                    key={service.id}
                    className={`relative ${categoryColor.modernBg} rounded-2xl ${cardPadding} hover:shadow-lg active:scale-[0.98] transition-all duration-150 text-left group ${cardMinHeight} ${isArchived ? 'opacity-60 ring-2 ring-amber-400/50' : ''}`}
                    onClick={() => handleServiceClick(service)}
                    data-testid={`card-service-full-${service.id}`}
                    data-archived={isArchived}
                  >
                    {/* Plus button - always visible, top right */}
                    <div className={`absolute ${compactMode ? 'right-2 top-2' : 'right-3 top-3'} ${plusButtonSize} rounded-full bg-white/60 flex items-center justify-center group-hover:bg-white transition-colors`}>
                      <Plus className={`${plusIconSize} text-gray-500 group-hover:text-gray-700`} />
                    </div>

                    {/* Archived indicator badge */}
                    {isArchived && (
                      <div className={`absolute ${compactMode ? 'left-2 top-2' : 'left-3 top-3'} flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium`}>
                        <Archive className="h-3 w-3" />
                        <span>Archived</span>
                      </div>
                    )}

                    <div className="flex flex-col h-full">
                      {/* Service Name - top */}
                      <h4 className={`font-semibold ${isArchived ? 'text-gray-500' : 'text-gray-800'} ${compactMode ? 'text-sm' : 'text-base'} leading-tight ${compactMode ? 'pr-8' : 'pr-10'} ${isArchived ? (compactMode ? 'mt-5' : 'mt-6') : ''}`}>
                        {service.name}
                      </h4>

                      {/* Bottom row: Duration (left) + Price (right) */}
                      <div className={`mt-auto ${compactMode ? 'pt-2' : 'pt-4'} flex items-end justify-between`}>
                        <span className={`${compactMode ? 'text-xs' : 'text-sm'} text-gray-500`}>
                          {service.duration} min
                        </span>
                        <span className={`font-bold ${isArchived ? 'text-gray-500' : 'text-gray-800'} ${compactMode ? 'text-lg' : 'text-xl'}`}>
                          ${service.price}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Classic layout
  return (
    <div className="h-full flex flex-col">
      {/* Sticky Header with Back Button - Mobile */}
      <div className="sticky top-0 z-50 bg-background border-b md:hidden mb-3">
        <div className="flex items-center gap-3 px-4 py-3">
          {onBack && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onBack}
              className="flex-shrink-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              data-testid="button-back-service-selector"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <h2 className="text-lg font-semibold flex-1">Select Service</h2>
        </div>
      </div>

      {/* Active Staff Indicator */}
      {activeStaff && (
        <div className="mb-3 bg-gradient-to-r from-primary to-primary/90 rounded-lg px-4 py-3 flex items-center gap-3">
          <Avatar className="h-9 w-9 ring-2 ring-white/30">
            <AvatarFallback className="bg-white text-primary font-bold text-sm">
              {getStaffInitials(activeStaff.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-xs font-semibold text-white/90 tracking-wide uppercase">
              Adding Services To
            </p>
            <p className="text-base font-bold text-white">
              {activeStaff.name}
            </p>
          </div>
          <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search services..."
            className="pl-14 h-12 text-sm bg-gray-50 border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all"
            data-testid="input-search-service-full"
          />
        </div>
      </div>

      {/* Services Grid */}
      <div className="flex-1 overflow-y-auto">
        {filteredServices.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No services found</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pb-4">
            {filteredServices.map((service) => {
              const categoryColor = CATEGORY_COLORS[service.category] || CATEGORY_COLORS.default;
              const isArchived = service.status === 'archived';
              return (
                <button
                  key={service.id}
                  className={`relative bg-white rounded-xl p-4 border border-gray-200 border-l-4 ${categoryColor.border} hover:shadow-lg hover:border-gray-300 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 text-left group ${isArchived ? 'opacity-60 ring-2 ring-amber-400/50' : ''}`}
                  onClick={() => handleServiceClick(service)}
                  data-testid={`card-service-full-${service.id}`}
                  data-archived={isArchived}
                >
                  {/* Archived indicator badge */}
                  {isArchived && (
                    <div className="absolute right-2 top-2 flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                      <Archive className="h-3 w-3" />
                      <span>Archived</span>
                    </div>
                  )}
                  <div className="flex flex-col min-h-[90px]">
                    {/* Service Name */}
                    <h4 className={`font-semibold ${isArchived ? 'text-gray-500' : 'text-gray-900'} text-base leading-tight mb-2 group-hover:text-primary transition-colors ${isArchived ? 'pr-20' : ''}`}>
                      {service.name}
                    </h4>
                    {/* Bottom row: Duration + Price */}
                    <div className="mt-auto flex items-end justify-between">
                      <span className="text-sm text-gray-500">
                        {service.duration} min
                      </span>
                      <span className={`font-bold ${isArchived ? 'text-gray-500' : 'text-gray-900'} text-lg`}>
                        ${service.price}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
