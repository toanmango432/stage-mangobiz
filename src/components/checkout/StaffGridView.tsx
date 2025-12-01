import { useRef, useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { User, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { StaffMember, TicketService } from "./ServiceList";

interface StaffGridViewProps {
  staffMembers: StaffMember[];
  services: TicketService[];
  onAddServiceToStaff: (staffId: string, staffName: string) => void;
  reassigningServiceIds?: string[];
}

export default function StaffGridView({
  staffMembers,
  services,
  onAddServiceToStaff,
  reassigningServiceIds = [],
}: StaffGridViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  useEffect(() => {
    updateScrollState();
    const container = scrollContainerRef.current;
    if (container) {
      const resizeObserver = new ResizeObserver(updateScrollState);
      resizeObserver.observe(container);
      return () => resizeObserver.disconnect();
    }
  }, [updateScrollState, staffMembers]);

  const scrollBy = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const scrollAmount = direction === "left" ? -200 : 200;
    container.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  const getStaffInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStaffServiceCount = (staffId: string) => {
    return services.filter((s) => s.staffId === staffId).length;
  };

  const getStaffServiceTotal = (staffId: string) => {
    return services
      .filter((s) => s.staffId === staffId)
      .reduce((sum, s) => sum + s.price, 0);
  };

  const reassigningServices = services.filter((s) => 
    reassigningServiceIds.includes(s.id)
  );

  return (
    <div className="h-full flex flex-col">
      {reassigningServices.length > 0 && (
        <Card className="p-3 mb-4 bg-primary/5 border-primary">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-sm">Reassigning Staff</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select a staff member for {reassigningServices.length} service{reassigningServices.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </Card>
      )}
      <div className="flex-1 overflow-hidden">
        {staffMembers.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">No Staff Available</h3>
                <p className="text-sm text-muted-foreground">
                  Add team members to assign services and manage appointments efficiently.
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <div className="relative">
            {/* Left Gradient Fade */}
            <div 
              className={`absolute left-0 top-0 bottom-4 w-12 z-10 pointer-events-none transition-opacity duration-200 ${
                canScrollLeft ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                background: 'linear-gradient(to right, hsl(var(--background)), transparent)'
              }}
              aria-hidden="true"
            />
            
            {/* Right Gradient Fade */}
            <div 
              className={`absolute right-0 top-0 bottom-4 w-12 z-10 pointer-events-none transition-opacity duration-200 ${
                canScrollRight ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                background: 'linear-gradient(to left, hsl(var(--background)), transparent)'
              }}
              aria-hidden="true"
            />

            {/* Left Scroll Arrow */}
            <Button
              size="icon"
              variant="ghost"
              className={`absolute left-1 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-sm border transition-opacity duration-200 ${
                canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              onClick={() => scrollBy("left")}
              aria-label="Scroll left"
              data-testid="button-scroll-staff-left"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Right Scroll Arrow */}
            <Button
              size="icon"
              variant="ghost"
              className={`absolute right-1 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-sm border transition-opacity duration-200 ${
                canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              onClick={() => scrollBy("right")}
              aria-label="Scroll right"
              data-testid="button-scroll-staff-right"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Horizontal Scroll Container */}
            <div 
              ref={scrollContainerRef}
              onScroll={updateScrollState}
              className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {staffMembers.map((staff) => {
                const serviceCount = getStaffServiceCount(staff.id);
                const serviceTotal = getStaffServiceTotal(staff.id);

                return (
                  <Card
                    key={staff.id}
                    className="p-4 hover-elevate active-elevate-2 cursor-pointer transition-all flex-shrink-0 w-40"
                    onClick={() => onAddServiceToStaff(staff.id, staff.name)}
                    data-testid={`card-staff-grid-${staff.id}`}
                  >
                    <div className="flex flex-col items-center gap-3">
                      {/* Avatar */}
                      <Avatar className="h-16 w-16 border-2 border-border">
                        <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                          {getStaffInitials(staff.name)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Name */}
                      <div className="text-center">
                        <h4 className="font-semibold text-sm">{staff.name}</h4>
                      </div>

                      {/* Stats */}
                      <div className="w-full space-y-1.5">
                        {serviceCount > 0 ? (
                          <>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Services:</span>
                              <Badge variant="secondary" className="h-5 text-xs">
                                {serviceCount}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Total:</span>
                              <span className="font-semibold">${serviceTotal.toFixed(2)}</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-1">
                            <p className="text-xs text-muted-foreground">No services</p>
                          </div>
                        )}
                      </div>

                      {/* Add Service Button */}
                      <div className="w-full pt-2 border-t">
                        <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-primary">
                          <Plus className="h-3.5 w-3.5" />
                          <span>{reassigningServiceIds.length > 0 ? "Assign" : "Add Service"}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
