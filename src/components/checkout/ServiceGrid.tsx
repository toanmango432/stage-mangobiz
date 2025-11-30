import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Search, Check, Plus, Clock, X } from "lucide-react";

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

interface ServiceGridProps {
  onAddServices: (services: Service[], staffId?: string, staffName?: string) => void;
  staffMembers?: StaffMember[];
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

const POPULAR_SERVICES = ["1", "2", "6", "7", "10", "11"];

const CATEGORIES = ["All", "Popular", "Hair", "Nails", "Spa"];

export default function ServiceGrid({ onAddServices, staffMembers = [] }: ServiceGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredServices = SERVICES.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesCategory = false;
    if (selectedCategory === "All") {
      matchesCategory = true;
    } else if (selectedCategory === "Popular") {
      matchesCategory = POPULAR_SERVICES.includes(service.id);
    } else {
      matchesCategory = service.category === selectedCategory;
    }
    
    return matchesSearch && matchesCategory;
  });

  const toggleService = (service: Service) => {
    const isSelected = selectedServices.some(s => s.id === service.id);
    if (isSelected) {
      setSelectedServices(selectedServices.filter(s => s.id !== service.id));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const handleAddServices = () => {
    if (selectedServices.length > 0) {
      const staff = staffMembers.find(s => s.id === selectedStaffId);
      onAddServices(selectedServices, staff?.id, staff?.name);
      setSelectedServices([]);
      setSelectedStaffId("");
    }
  };

  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Simple Search Bar */}
      <div className="flex-shrink-0 mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search services..."
            className="pl-10 pr-10 h-11 bg-muted/50 border-0"
            data-testid="input-search-service"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Simple Category Filters */}
      <div className="flex-shrink-0 mb-3 -mx-4 px-4">
        <ScrollArea className="w-full" type="scroll">
          <div className="flex gap-1 pb-1">
            {CATEGORIES.map((category) => {
              const isActive = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`
                    px-3 py-1.5 text-sm whitespace-nowrap
                    ${isActive 
                      ? 'text-foreground font-medium border-b-2 border-primary' 
                      : 'text-muted-foreground'
                    }
                  `}
                  data-testid={`tab-category-${category.toLowerCase()}`}
                >
                  {category}
                </button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" className="h-1" />
        </ScrollArea>
      </div>

      {/* Services Grid */}
      <div className="flex-1 overflow-y-auto min-h-0 -mx-4 px-4" ref={scrollRef}>
        {filteredServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? `No results for "${searchQuery}"` : "No services in this category"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 pb-4">
            {filteredServices.map((service) => {
              const isSelected = selectedServices.some(s => s.id === service.id);
              
              return (
                <Card
                  key={service.id}
                  className={`
                    relative p-3.5 cursor-pointer
                    ${isSelected ? 'border-primary bg-primary/5' : ''}
                  `}
                  onClick={() => toggleService(service)}
                  data-testid={`card-service-${service.id}`}
                >
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                  )}

                  <h4 className="font-medium text-sm leading-snug mb-2 pr-5">
                    {service.name}
                  </h4>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {service.duration}m
                    </span>
                    <span className="font-semibold">${service.price}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Clean Action Bar */}
      {selectedServices.length > 0 && (
        <div className="flex-shrink-0 fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50 lg:relative lg:bottom-auto lg:mt-3 lg:border-t-0 lg:p-0 lg:bg-transparent">
          {/* Summary Row */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-semibold">${totalPrice.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">{totalDuration} min total</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedServices([])}
              className="text-muted-foreground h-8"
              data-testid="button-clear-selection"
            >
              Clear
            </Button>
          </div>

          {/* Staff Assignment - Optional */}
          {staffMembers.length > 0 && (
            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
              <SelectTrigger className="h-11 text-sm mb-3" data-testid="select-staff-assignment">
                <SelectValue placeholder="Assign to staff member (optional)" />
              </SelectTrigger>
              <SelectContent>
                {staffMembers.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Add Button */}
          <Button
            className="w-full h-12"
            onClick={handleAddServices}
            data-testid="button-add-selected-services"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add {selectedServices.length} {selectedServices.length === 1 ? 'Service' : 'Services'}
          </Button>
        </div>
      )}
    </div>
  );
}
