import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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

export const CATEGORIES = [
  { id: "all", name: "ALL", icon: Sparkles },
  { id: "popular", name: "POPULAR", icon: Star },
  { id: "Hair", name: "HAIR", icon: Scissors },
  { id: "Nails", name: "NAILS", icon: Palette },
  { id: "Spa", name: "SPA", icon: UsersIcon },
];

// Color palette for services
const getServiceColor = (index: number) => {
  const colors = [
    "bg-cyan-100 border-cyan-200 text-cyan-900 dark:bg-cyan-900/20 dark:border-cyan-800 dark:text-cyan-100",
    "bg-lime-100 border-lime-200 text-lime-900 dark:bg-lime-900/20 dark:border-lime-800 dark:text-lime-100",
    "bg-orange-200 border-orange-300 text-orange-900 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-100",
  ];
  return colors[index % colors.length];
};

interface CategoryListProps {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

export function CategoryList({ selectedCategory, onSelectCategory }: CategoryListProps) {
  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto">
      {CATEGORIES.map((category) => {
        const Icon = category.icon;
        const isActive = selectedCategory === category.id;
        return (
          <Card
            key={category.id}
            className={`p-4 cursor-pointer transition-all ${
              isActive
                ? "ring-2 ring-primary bg-primary/5"
                : "hover-elevate active-elevate-2"
            }`}
            onClick={() => onSelectCategory(category.id)}
            data-testid={`button-category-${category.id}`}
          >
            <div className="flex flex-col items-center justify-center gap-2 min-h-[80px]">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                isActive ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                <Icon className="h-6 w-6" />
              </div>
              <span className={`text-xs font-bold text-center leading-tight ${
                isActive ? "text-foreground" : "text-muted-foreground"
              }`}>
                {category.name}
              </span>
            </div>
          </Card>
        );
      })}
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
      <div className="mb-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search services..."
            className="pl-8 h-11 text-sm border-[0.5px]"
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 pb-4">
            {filteredServices.map((service, index) => {
              const colorClass = getServiceColor(index);
              return (
                <Card
                  key={service.id}
                  className={`p-3 cursor-pointer transition-all border ${colorClass} hover-elevate active-elevate-2`}
                  onClick={() => handleServiceClick(service)}
                  data-testid={`card-service-full-${service.id}`}
                >
                  <div className="flex flex-col items-center justify-between min-h-[80px]">
                    <h4 className="font-semibold text-xs text-center leading-tight mb-2">
                      {service.name}
                    </h4>
                    <div className="mt-auto pt-2 border-t border-current/20 w-full">
                      <p className="font-bold text-base text-center">
                        ${service.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
