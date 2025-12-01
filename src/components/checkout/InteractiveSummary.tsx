import { useMemo, useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserPlus, MoreVertical, Percent, DollarSign, Plus, Scissors, ShoppingBag, Users, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { TicketService, ServiceStatus } from "./ServiceList";
import { AnimatePresence, motion } from "framer-motion";
import ClientSelector, { Client } from "./ClientSelector";
import { StaffMember } from "./ServiceGrid";
import StaffGroup from "./StaffGroup";
import { BulkActionsPopup } from "./BulkActionsPopup";
import { useToast } from "@/hooks/use-toast";

interface InteractiveSummaryProps {
  selectedClient: Client | null;
  services: TicketService[];
  staffMembers: StaffMember[];
  subtotal: number;
  tax: number;
  total: number;
  onCheckout: () => void;
  onSelectClient: (client: Client | null) => void;
  onCreateClient: (client: Partial<Client>) => void;
  onUpdateService: (serviceId: string, updates: Partial<TicketService>) => void;
  onRemoveService: (serviceId: string) => void;
  onRemoveStaff?: (staffId: string) => void;
  onReassignStaff?: (serviceIdOrIds: string | string[]) => void;
  onAddServiceToStaff?: (staffId: string, staffName: string) => void;
  onAddStaff?: (staffId: string, staffName: string) => void;
  onDuplicateServices?: (serviceIds: string[]) => void;
  onRequestAddStaff?: () => void;
  activeStaffId?: string | null;
  onSetActiveStaff?: (staffId: string | null) => void;
  assignedStaffIds?: Set<string>;
  currentTab?: "services" | "staff";
}

export default function InteractiveSummary({
  selectedClient,
  services,
  staffMembers,
  subtotal,
  tax,
  total,
  onCheckout,
  onSelectClient,
  onCreateClient,
  onUpdateService,
  onRemoveService,
  onRemoveStaff,
  onReassignStaff,
  onAddServiceToStaff,
  onAddStaff,
  onDuplicateServices,
  onRequestAddStaff,
  activeStaffId,
  onSetActiveStaff,
  assignedStaffIds = new Set(),
  currentTab = "services",
}: InteractiveSummaryProps) {
  const { toast } = useToast();
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const servicesContainerRef = useRef<HTMLDivElement>(null);
  const previousServiceCountRef = useRef(-1); // Initialize to -1 to catch first addition
  const previousActiveStaffRef = useRef(activeStaffId);
  const previousActiveStaffServiceCountRef = useRef(0);
  
  // Confirmation dialogs
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [pendingBulkDeleteIds, setPendingBulkDeleteIds] = useState<string[]>([]);
  
  // Mobile totals collapse state
  const [isTotalsCollapsed, setIsTotalsCollapsed] = useState(true);

  // Auto-scroll when new services are added or active staff changes
  useEffect(() => {
    const container = servicesContainerRef.current;
    if (!container) return;

    // Count services assigned to active staff
    const activeStaffServiceCount = activeStaffId 
      ? services.filter(s => s.staffId === activeStaffId).length
      : 0;

    const shouldScroll = 
      services.length > previousServiceCountRef.current || 
      activeStaffId !== previousActiveStaffRef.current ||
      (activeStaffId && activeStaffServiceCount > previousActiveStaffServiceCountRef.current);

    if (!shouldScroll) {
      previousServiceCountRef.current = services.length;
      previousActiveStaffRef.current = activeStaffId;
      previousActiveStaffServiceCountRef.current = activeStaffServiceCount;
      return;
    }

    // Small delay to allow DOM to update after framer-motion animations
    const timeoutId = setTimeout(() => {
      if (activeStaffId) {
        // Smart scroll for active staff: position with 20-25% buffer from bottom
        const activeStaffElement = container.querySelector(`[data-staff-id="${activeStaffId}"]`);
        
        if (activeStaffElement) {
          const containerHeight = container.clientHeight;
          const elementRect = activeStaffElement.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          const elementHeight = elementRect.height;
          
          // Calculate positions relative to scrollable container
          const elementTopRelativeToContainer = 
            elementRect.top - containerRect.top + container.scrollTop;
          const elementBottomRelativeToContainer = 
            elementTopRelativeToContainer + elementHeight;
          
          // Target: bottom of element at 75% of viewport (25% buffer below)
          const bufferPercentage = 0.75; // 25% buffer from bottom
          const targetBottomPosition = containerHeight * bufferPercentage;
          
          // Calculate ideal scroll position to achieve target
          const idealScrollTop = elementBottomRelativeToContainer - targetBottomPosition;
          
          // Smart constraint: ensure we don't scroll beyond reasonable bounds
          // Allow bottom to be positioned with 25% buffer, even if it means top is cut off
          // Only constraint: don't scroll past the absolute bottom of container
          const maxScrollTop = container.scrollHeight - containerHeight;
          const targetScrollTop = Math.min(idealScrollTop, maxScrollTop);
          
          // Check if active staff changed (user clicked different staff or auto-activated)
          const staffChanged = activeStaffId !== previousActiveStaffRef.current;
          
          // When staff changes (including auto-activation), always scroll to proper position
          // When services added to same staff, only scroll down (never up)
          if (staffChanged) {
            // Staff changed - always reposition with buffer (can scroll up or down)
            container.scrollTo({
              top: targetScrollTop,
              behavior: 'smooth'
            });
          } else if (targetScrollTop > container.scrollTop) {
            // Same staff, new services - only scroll down
            container.scrollTo({
              top: targetScrollTop,
              behavior: 'smooth'
            });
          }
        }
      } else {
        // Fallback for unassigned services (no active staff): scroll to bottom
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 150); // Slightly longer delay for layout animations to complete

    previousServiceCountRef.current = services.length;
    previousActiveStaffRef.current = activeStaffId;
    previousActiveStaffServiceCountRef.current = activeStaffId 
      ? services.filter(s => s.staffId === activeStaffId).length
      : 0;

    // Cleanup timeout on unmount or re-run
    return () => clearTimeout(timeoutId);
  }, [services, activeStaffId]);

  // Group services by staff member
  const groupedServices = useMemo(() => {
    const groups = new Map<string | null, TicketService[]>();

    services.forEach((service) => {
      const key = service.staffId || null;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(service);
    });

    return groups;
  }, [services]);

  // Include assigned staff with no services
  const allGroups = useMemo(() => {
    const entries = Array.from(groupedServices.entries());
    
    // Add empty groups for assigned staff without services
    const emptyStaffGroups: Array<[string | null, TicketService[]]> = Array.from(assignedStaffIds)
      .filter(staffId => !groupedServices.has(staffId))
      .map(staffId => [staffId, []]);
    
    return [...entries, ...emptyStaffGroups];
  }, [groupedServices, assignedStaffIds]);

  // Sort groups: inactive staff first (alphabetically), active staff at bottom, unassigned last
  const sortedGroups = useMemo(() => {
    return allGroups.sort((a, b) => {
      const [keyA, servicesA] = a;
      const [keyB, servicesB] = b;

      // Unassigned goes last
      if (keyA === null) return 1;
      if (keyB === null) return -1;

      // Active staff goes to the bottom (just before unassigned)
      const isActiveA = keyA === activeStaffId;
      const isActiveB = keyB === activeStaffId;
      
      if (isActiveA && !isActiveB) return 1; // A is active, goes after B
      if (!isActiveA && isActiveB) return -1; // B is active, goes after A

      // Both active or both inactive: sort alphabetically by staff name
      const nameA = servicesA[0]?.staffName || staffMembers.find(s => s.id === keyA)?.name || "";
      const nameB = servicesB[0]?.staffName || staffMembers.find(s => s.id === keyB)?.name || "";
      return nameA.localeCompare(nameB);
    });
  }, [allGroups, staffMembers, activeStaffId]);

  const handleAddServiceToStaff = (staffId: string | null, staffName: string | null) => {
    if (onAddServiceToStaff) {
      // Pass actual staff context - for assigned staff (pre-select them)
      // For unassigned, pass empty to indicate no pre-selection
      if (staffId) {
        // Ensure we have staff name by looking up in staffMembers if needed
        const resolvedStaffName = staffName || staffMembers.find(s => s.id === staffId)?.name || "";
        if (resolvedStaffName) {
          onAddServiceToStaff(staffId, resolvedStaffName);
        } else {
          // Fallback if name not found
          onAddServiceToStaff("", "");
        }
      } else {
        // Unassigned - switch to services tab without pre-selection
        onAddServiceToStaff("", "");
      }
    }
  };

  const handleToggleServiceSelection = (serviceId: string) => {
    setSelectedServices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  };

  const handleClearSelection = () => {
    setSelectedServices(new Set());
  };

  // Extract bulk action handlers for reuse
  const handleEditServicePrice = (serviceIds: string[]) => {
    console.log(`Editing price for ${serviceIds.length} service(s):`, serviceIds);
    // TODO: Open price input modal and apply to all serviceIds
  };

  const handleChangeServiceType = (serviceIds: string[]) => {
    console.log(`Changing ${serviceIds.length} service(s):`, serviceIds);
    // TODO: Open service selector and replace all serviceIds with chosen service
  };

  const handleDiscountService = (serviceIds: string[]) => {
    console.log(`Adding discount to ${serviceIds.length} service(s):`, serviceIds);
    // TODO: Open discount modal and apply to all serviceIds
  };

  const handleDuplicateServices = (serviceIds: string[]) => {
    if (onDuplicateServices) {
      onDuplicateServices(serviceIds);
    }
  };

  const handleReassignServices = (serviceIdOrIds: string | string[]) => {
    const serviceIds = Array.isArray(serviceIdOrIds) ? serviceIdOrIds : [serviceIdOrIds];
    console.log(`Reassigning ${serviceIds.length} service(s):`, serviceIds);
    // Pass all service IDs to parent for reassignment
    if (serviceIds.length > 0 && onReassignStaff) {
      onReassignStaff(serviceIds);
    }
  };

  const handleBulkAction = (action: string, statusValue?: ServiceStatus) => {
    const selectedServiceIds = Array.from(selectedServices);
    
    // All bulk actions - delegate to handlers
    switch (action) {
      case "reassign":
        if (selectedServiceIds.length > 0) {
          handleReassignServices(selectedServiceIds);
          handleClearSelection();
        }
        break;
      case "change_item":
        if (selectedServiceIds.length > 0) {
          handleChangeServiceType(selectedServiceIds);
          handleClearSelection();
        }
        break;
      case "change_price":
        if (selectedServiceIds.length > 0) {
          handleEditServicePrice(selectedServiceIds);
          handleClearSelection();
        }
        break;
      case "discount":
        if (selectedServiceIds.length > 0) {
          handleDiscountService(selectedServiceIds);
          handleClearSelection();
        }
        break;
      case "duplicate":
        if (selectedServiceIds.length > 0) {
          handleDuplicateServices(selectedServiceIds);
          handleClearSelection();
        }
        break;
      case "remove":
        // Show confirmation for bulk delete
        if (selectedServiceIds.length > 1) {
          setPendingBulkDeleteIds(selectedServiceIds);
          setShowBulkDeleteConfirm(true);
        } else if (selectedServiceIds.length === 1) {
          // Single delete, no confirmation needed
          onRemoveService(selectedServiceIds[0]);
          handleClearSelection();
        }
        break;
      case "change_status":
        if (statusValue) {
          selectedServiceIds.forEach(id => onUpdateService(id, { status: statusValue }));
          handleClearSelection();
        }
        break;
      default:
        console.log(`Unknown bulk action ${action} for ${selectedServiceIds.length} services`);
        handleClearSelection();
    }
  };
  
  const handleConfirmBulkDelete = () => {
    pendingBulkDeleteIds.forEach(id => onRemoveService(id));
    handleClearSelection();
    setShowBulkDeleteConfirm(false);
    setPendingBulkDeleteIds([]);
  };
  
  const handleCheckoutClick = () => {
    // Validation: prevent checkout if total = $0
    if (total <= 0) {
      toast({
        title: "Cannot Proceed",
        description: "Total must be greater than $0 to proceed to checkout",
        variant: "destructive",
      });
      return;
    }
    onCheckout();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Client Section */}
      <div className="mb-4 flex-shrink-0">
        {!selectedClient && !showClientSelector ? (
          <Card
            className="p-4 hover-elevate active-elevate-2 cursor-pointer"
            onClick={() => setShowClientSelector(true)}
            data-testid="card-add-client"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-base">Add client</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Leave empty for walk-ins
                </p>
              </div>
              <UserPlus className="h-5 w-5 text-muted-foreground" />
            </div>
          </Card>
        ) : (
          <ClientSelector
            selectedClient={selectedClient}
            onSelectClient={(client) => {
              onSelectClient(client);
              setShowClientSelector(false);
            }}
            onCreateClient={(newClient) => {
              onCreateClient(newClient);
              setShowClientSelector(false);
            }}
            inDialog={true}
          />
        )}
      </div>

      {/* Services Section - Grouped by Staff - scrollable */}
      <div 
        ref={servicesContainerRef}
        className="flex-1 overflow-y-auto space-y-3 min-h-0"
      >
        {services.length === 0 && assignedStaffIds.size === 0 ? (
          <Card className="p-12 text-center">
            {currentTab === "staff" ? (
              <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Select a Staff Member</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a team member to assign services and start building this ticket
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">No Services Yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Browse and select services to add them to this ticket
                  </p>
                </div>
              </div>
            )}
          </Card>
        ) : (
          <>
            <AnimatePresence mode="popLayout">
              {sortedGroups.map(([staffId, staffServices]) => {
                // Resolve staff name from services or lookup in staffMembers
                const staffName = staffId
                  ? staffServices[0]?.staffName || staffMembers.find(s => s.id === staffId)?.name || null
                  : null;
                
                // Check if this staff group has selected services
                const hasSelectedServices = staffServices.some(s => selectedServices.has(s.id));
                
                const isActiveStaff = staffId === activeStaffId;
                
                return (
                  <motion.div
                    key={staffId || "unassigned"}
                    data-staff-id={staffId || "unassigned"}
                    className={`relative ${isActiveStaff ? 'staff-pulse' : ''}`}
                    layout
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{
                      layout: { type: "spring", stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 },
                      y: { duration: 0.2 }
                    }}
                  >
                    {/* Bulk Actions Popup - Overlays staff header when selections exist */}
                    {hasSelectedServices && selectedServices.size > 0 && (
                      <BulkActionsPopup
                        selectedCount={selectedServices.size}
                        onReset={handleClearSelection}
                        onAction={handleBulkAction}
                        staffName={staffName}
                      />
                    )}
                    
                    <StaffGroup
                      staffId={staffId}
                      staffName={staffName}
                      services={staffServices}
                      onUpdateService={onUpdateService}
                      onRemoveService={onRemoveService}
                      onRemoveStaff={onRemoveStaff}
                      onReassignStaff={handleReassignServices}
                      onAddServiceToStaff={() =>
                        handleAddServiceToStaff(staffId, staffName)
                      }
                      onEditService={handleEditServicePrice}
                      onChangeService={handleChangeServiceType}
                      onDiscountService={handleDiscountService}
                      onDuplicateServices={handleDuplicateServices}
                      selectedServices={selectedServices}
                      onToggleServiceSelection={handleToggleServiceSelection}
                      onClearSelection={handleClearSelection}
                      isActive={staffId === activeStaffId}
                      onActivate={staffId && onSetActiveStaff ? () => onSetActiveStaff(staffId) : undefined}
                      totalStaffCount={assignedStaffIds.size}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {/* Add Staff Button - Sticky at bottom of scrollable area, always visible */}
            {onRequestAddStaff && (
              <div className="sticky bottom-0 flex justify-end px-1 py-2 bg-background/95 backdrop-blur-sm border-t mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={onRequestAddStaff}
                  data-testid="button-add-staff"
                >
                  <Plus className="h-4 w-4" />
                  Staff
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Totals Section - Redesigned - Sticky at bottom - Compact - Collapsible on Mobile */}
      <div className="flex-shrink-0 border-t pt-3 pb-3 space-y-2 bg-background">
        {/* Mobile Collapse Toggle - Only visible on mobile */}
        <button
          className="md:hidden flex items-center justify-between w-full px-1 py-2 touch-feedback focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
          onClick={() => setIsTotalsCollapsed(!isTotalsCollapsed)}
          data-testid="button-toggle-totals"
          aria-label={isTotalsCollapsed ? "Expand totals breakdown" : "Collapse totals breakdown"}
          aria-expanded={!isTotalsCollapsed}
        >
          <span className="font-semibold text-sm">Total</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-2xl" data-testid="text-to-pay-mobile">
              ${total.toFixed(2)}
            </span>
            {isTotalsCollapsed ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            )}
          </div>
        </button>

        {/* Breakdown - Compact - Collapsible on mobile */}
        <div className={`space-y-1.5 px-1 ${
          isTotalsCollapsed ? 'hidden md:block' : 'block'
        }`}>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Service Charge</span>
            <span className="text-muted-foreground" data-testid="text-service-charge">
              ${(subtotal * 0.03).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-muted-foreground" data-testid="text-subtotal">
              ${subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Tax</span>
            <span className="text-muted-foreground" data-testid="text-tax">
              ${tax.toFixed(2)}
            </span>
          </div>
        </div>

        <Separator className={isTotalsCollapsed ? 'hidden md:block' : 'block'} />

        {/* To Pay Section - Compact - Always visible on desktop */}
        <div className={`space-y-2 ${isTotalsCollapsed ? 'hidden md:block' : 'block'}`}>
          <div className="hidden md:flex justify-between items-center px-1">
            <span className="font-semibold text-sm">Total</span>
            <span className="font-bold text-2xl" data-testid="text-to-pay">
              ${total.toFixed(2)}
            </span>
          </div>

          {/* Payment Action */}
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-xl flex-shrink-0"
                  data-testid="button-payment-options"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem data-testid="option-add-discount">
                  <Percent className="mr-2 h-4 w-4" />
                  Add Discount
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="option-add-tip">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Add Tip
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              className="flex-1 h-12 text-base font-semibold rounded-xl"
              onClick={handleCheckoutClick}
              disabled={services.length === 0 || total <= 0}
              data-testid="button-checkout"
            >
              Continue to Payment
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <AlertDialogContent data-testid="dialog-bulk-delete">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Delete Multiple Services?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {pendingBulkDeleteIds.length} service(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowBulkDeleteConfirm(false);
                setPendingBulkDeleteIds([]);
              }}
              data-testid="button-cancel-bulk-delete"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-bulk-delete"
            >
              Delete {pendingBulkDeleteIds.length} Services
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
