import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/Button";
import { Scissors, Palette, Sparkles, Users as UsersIcon, Star, Search, ArrowLeft } from "lucide-react";

export interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
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

// Category color mapping for visual identification
export const CATEGORY_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  Hair: { border: "border-l-amber-400", bg: "bg-amber-50", text: "text-amber-700" },
  Nails: { border: "border-l-pink-400", bg: "bg-pink-50", text: "text-pink-700" },
  Spa: { border: "border-l-teal-400", bg: "bg-teal-50", text: "text-teal-700" },
  default: { border: "border-l-gray-300", bg: "bg-gray-50", text: "text-gray-600" },
};

// Service categories (default)
export const SERVICE_CATEGORIES = [
  { id: "all", name: "ALL", icon: Sparkles },
  { id: "popular", name: "POPULAR", icon: Star },
  { id: "Hair", name: "HAIR", icon: Scissors },
  { id: "Nails", name: "NAILS", icon: Palette },
  { id: "Spa", name: "SPA", icon: UsersIcon },
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
  onAddServices,
  staffMembers,
  activeStaffId,
  onBack,
}: FullPageServiceSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
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

  const filteredServices = SERVICES.filter((service) => {
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
              return (
                <button
                  key={service.id}
                  className={`bg-white rounded-xl p-4 border border-gray-200 border-l-4 ${categoryColor.border} hover:shadow-lg hover:border-gray-300 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 text-left group`}
                  onClick={() => handleServiceClick(service)}
                  data-testid={`card-service-full-${service.id}`}
                >
                  <div className="flex flex-col min-h-[90px]">
                    {/* Service Name */}
                    <h4 className="font-semibold text-gray-900 text-base leading-tight mb-2 group-hover:text-primary transition-colors">
                      {service.name}
                    </h4>
                    {/* Bottom row: Duration + Price */}
                    <div className="mt-auto flex items-end justify-between">
                      <span className="text-sm text-gray-500">
                        {service.duration} min
                      </span>
                      <span className="font-bold text-gray-900 text-lg">
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
