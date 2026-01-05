import { useMemo, useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
// Separator not currently used - kept for future use
// import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserPlus, MoreVertical, Percent, DollarSign, Plus, ShoppingBag, Users, AlertCircle, ChevronDown, ChevronUp, X, Tag, Play } from "lucide-react";
import { TicketService, ServiceStatus } from "./ServiceList";
import { AnimatePresence, motion } from "framer-motion";
import ClientSelector, { Client } from "./ClientSelector";
import ClientAlerts, { ClientAlertData } from "./ClientAlerts";
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
  discount?: number;
  onCheckout: () => void;
  onCheckIn?: () => void;
  onStartService?: () => void;
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
  onApplyDiscount?: (data: { type: "percentage" | "fixed"; amount: number; reason: string }) => void;
  onRemoveDiscount?: () => void;
  layout?: "classic" | "modern";
  hideClientSection?: boolean;
}

export default function InteractiveSummary({
  selectedClient,
  services,
  staffMembers,
  subtotal,
  tax,
  total,
  discount = 0,
  onCheckout,
  onCheckIn: _onCheckIn,
  onStartService,
  onSelectClient,
  onCreateClient,
  onUpdateService,
  onRemoveService,
  onRemoveStaff,
  onReassignStaff,
  onAddServiceToStaff,
  onAddStaff: _onAddStaff,
  onDuplicateServices,
  onRequestAddStaff,
  activeStaffId,
  onSetActiveStaff,
  assignedStaffIds = new Set(),
  currentTab = "services",
  onApplyDiscount,
  onRemoveDiscount,
  layout: _layout = "classic",
  hideClientSection = false,
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

  // Bulk edit dialogs (for service-level discounts)
  const [showPriceEditDialog, setShowPriceEditDialog] = useState(false);
  const [showServiceDiscountDialog, setShowServiceDiscountDialog] = useState(false);
  const [pendingEditServiceIds, setPendingEditServiceIds] = useState<string[]>([]);
  const [newPriceValue, setNewPriceValue] = useState("");
  const [serviceDiscountValue, setServiceDiscountValue] = useState("");
  const [serviceDiscountType, setServiceDiscountType] = useState<"percentage" | "fixed">("percentage");

  // Ticket-level discount dialog
  const [showTicketDiscountDialog, setShowTicketDiscountDialog] = useState(false);
  const [ticketDiscountValue, setTicketDiscountValue] = useState("");
  const [ticketDiscountType, setTicketDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [ticketDiscountReason, setTicketDiscountReason] = useState("");

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
    setPendingEditServiceIds(serviceIds);
    // Pre-fill with current price if single service
    if (serviceIds.length === 1) {
      const service = services.find(s => s.id === serviceIds[0]);
      setNewPriceValue(service?.price?.toString() || "");
    } else {
      setNewPriceValue("");
    }
    setShowPriceEditDialog(true);
  };

  const handleConfirmPriceEdit = () => {
    const price = parseFloat(newPriceValue);
    if (!isNaN(price) && price >= 0) {
      pendingEditServiceIds.forEach(id => {
        onUpdateService(id, { price });
      });
      toast({
        title: "Price Updated",
        description: `Updated price for ${pendingEditServiceIds.length} service(s) to $${price.toFixed(2)}`,
      });
    }
    setShowPriceEditDialog(false);
    setPendingEditServiceIds([]);
    setNewPriceValue("");
  };

  const handleChangeServiceType = (serviceIds: string[]) => {
    // For now, show a toast indicating this feature requires the service selector
    toast({
      title: "Change Service",
      description: `To change ${serviceIds.length} service(s), please remove and add new services from the Services tab.`,
    });
  };

  const handleDiscountService = (serviceIds: string[]) => {
    setPendingEditServiceIds(serviceIds);
    setServiceDiscountValue("");
    setServiceDiscountType("percentage");
    setShowServiceDiscountDialog(true);
  };

  const handleConfirmServiceDiscount = () => {
    const value = parseFloat(serviceDiscountValue);
    if (!isNaN(value) && value > 0) {
      pendingEditServiceIds.forEach(id => {
        const service = services.find(s => s.id === id);
        if (service) {
          let newPrice = service.price;
          if (serviceDiscountType === "percentage") {
            newPrice = service.price * (1 - value / 100);
          } else {
            newPrice = Math.max(0, service.price - value);
          }
          onUpdateService(id, { price: Math.round(newPrice * 100) / 100 });
        }
      });
      toast({
        title: "Discount Applied",
        description: `Applied ${serviceDiscountType === "percentage" ? value + "%" : "$" + value.toFixed(2)} discount to ${pendingEditServiceIds.length} service(s)`,
      });
    }
    setShowServiceDiscountDialog(false);
    setPendingEditServiceIds([]);
    setServiceDiscountValue("");
  };

  // Ticket-level discount handlers
  const handleOpenTicketDiscount = () => {
    setTicketDiscountValue("");
    setTicketDiscountType("percentage");
    setTicketDiscountReason("");
    setShowTicketDiscountDialog(true);
  };

  const handleConfirmTicketDiscount = () => {
    const value = parseFloat(ticketDiscountValue);
    if (!isNaN(value) && value > 0 && onApplyDiscount) {
      onApplyDiscount({
        type: ticketDiscountType,
        amount: value,
        reason: ticketDiscountReason,
      });
    }
    setShowTicketDiscountDialog(false);
    setTicketDiscountValue("");
    setTicketDiscountReason("");
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
      {/* Client Section - Clean design with slide animation (hidden when hideClientSection is true) */}
      {!hideClientSection && (
      <div className="border-b border-border flex-shrink-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {!selectedClient && !showClientSelector ? (
            /* Add Client Prompt - Clean design with icon on right */
            <motion.div
              key="add-client-prompt"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-3"
            >
              <div
                className="bg-muted/30 rounded-xl p-3 border border-dashed border-border cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-all"
                onClick={() => setShowClientSelector(true)}
                data-testid="card-add-client"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm text-foreground">Add client</p>
                  <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
                    <UserPlus className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </div>
            </motion.div>
          ) : showClientSelector ? (
            /* Client Selector - Slides in from right (for searching/adding) */
            <motion.div
              key="client-selector"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 50, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-3"
            >
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
            </motion.div>
          ) : (
            /* Selected Client Display - Uses ClientSelector with all functionality */
            <motion.div
              key="client-display"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-3"
            >
              <ClientSelector
                selectedClient={selectedClient}
                onSelectClient={onSelectClient}
                onCreateClient={onCreateClient}
                inDialog={true}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Client Alerts - Shows allergy, notes, balance warnings */}
        {selectedClient && !showClientSelector && (
          <div className="px-3 pb-3">
            <ClientAlerts
              client={selectedClient as ClientAlertData}
              onBlockedOverride={() => {
                toast({
                  title: "Proceeding with blocked client",
                  description: "Manager override recorded.",
                });
              }}
            />
          </div>
        )}
      </div>
      )}

      {/* Services Section - Grouped by Staff - scrollable with compact spacing */}
      <div
        ref={servicesContainerRef}
        className="flex-1 overflow-y-auto px-3 py-2 space-y-3 min-h-0"
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

      {/* Totals Section - Redesigned with cleaner layout and compact spacing */}
      <div className="flex-shrink-0 border-t border-border bg-background px-3 py-3">
        {/* Mobile Collapse Toggle - Only visible on mobile */}
        <button
          className="md:hidden flex items-center justify-between w-full py-2 touch-feedback focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
          onClick={() => setIsTotalsCollapsed(!isTotalsCollapsed)}
          data-testid="button-toggle-totals"
          aria-label={isTotalsCollapsed ? "Expand totals breakdown" : "Collapse totals breakdown"}
          aria-expanded={!isTotalsCollapsed}
        >
          <span className="font-semibold text-foreground">Total</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-3xl text-foreground" data-testid="text-to-pay-mobile">
              ${total.toFixed(2)}
            </span>
            {isTotalsCollapsed ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            )}
          </div>
        </button>

        {/* Breakdown - Improved spacing - Collapsible on mobile */}
        <div className={`space-y-2 mb-3 ${
          isTotalsCollapsed ? 'hidden md:block' : 'block'
        }`}>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground" data-testid="text-subtotal">
              ${subtotal.toFixed(2)}
            </span>
          </div>

          {/* Discount Section - Only show when discount is applied */}
          {discount > 0 && (
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-green-600" />
                <span className="text-green-600 font-medium">Discount</span>
                {onRemoveDiscount && (
                  <button
                    onClick={onRemoveDiscount}
                    className="ml-1 p-0.5 hover:bg-muted rounded transition-colors"
                    data-testid="button-remove-discount"
                    aria-label="Remove discount"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
              <span className="text-green-600 font-medium" data-testid="text-discount">
                -${discount.toFixed(2)}
              </span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax (8.5%)</span>
            <span className="text-foreground" data-testid="text-tax">
              ${tax.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Total Row - Compact styling */}
        <div className={`flex justify-between items-center pt-2 border-t border-border ${isTotalsCollapsed ? 'hidden md:flex' : 'flex'}`}>
          <span className="text-sm font-medium text-foreground">Total</span>
          <span className="font-bold text-xl text-foreground" data-testid="text-to-pay">
            ${total.toFixed(2)}
          </span>
        </div>

        {/* Action Buttons - Compact layout */}
        <div className={`flex gap-2 mt-3 ${isTotalsCollapsed ? 'hidden md:flex' : 'flex'}`}>
          {/* Primary CTA */}
          <Button
            className="flex-1 h-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-all duration-200"
            onClick={handleCheckoutClick}
            disabled={services.length === 0 || total <= 0}
            data-testid="button-checkout"
          >
            Continue to Payment
          </Button>

          {/* More Options - Contains discount, tip, check in, start */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-lg border-border flex-shrink-0"
                data-testid="button-payment-options"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleOpenTicketDiscount} data-testid="option-add-discount">
                <Percent className="mr-2 h-4 w-4" />
                {discount > 0 ? 'Change Discount' : 'Add Discount'}
              </DropdownMenuItem>
              <DropdownMenuItem data-testid="option-add-tip">
                <DollarSign className="mr-2 h-4 w-4" />
                Add Tip
              </DropdownMenuItem>
              {onStartService && (
                <DropdownMenuItem onClick={onStartService} disabled={services.length === 0} data-testid="option-start-service">
                  <Play className="mr-2 h-4 w-4" />
                  Start Service
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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

      {/* Bulk Price Edit Dialog */}
      <Dialog open={showPriceEditDialog} onOpenChange={setShowPriceEditDialog}>
        <DialogContent className="sm:max-w-[400px]" data-testid="dialog-price-edit">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Edit Price
            </DialogTitle>
            <DialogDescription>
              Set a new price for {pendingEditServiceIds.length} service(s)
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="new-price">New Price ($)</Label>
            <Input
              id="new-price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={newPriceValue}
              onChange={(e) => setNewPriceValue(e.target.value)}
              className="mt-2"
              autoFocus
              data-testid="input-new-price"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPriceEditDialog(false);
                setPendingEditServiceIds([]);
                setNewPriceValue("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPriceEdit}
              disabled={!newPriceValue || isNaN(parseFloat(newPriceValue))}
              data-testid="button-confirm-price"
            >
              Update Price
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Service-Level Discount Dialog (for bulk service discounts) */}
      <Dialog open={showServiceDiscountDialog} onOpenChange={setShowServiceDiscountDialog}>
        <DialogContent className="sm:max-w-[400px]" data-testid="dialog-service-discount">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Apply Service Discount
            </DialogTitle>
            <DialogDescription>
              Add a discount to {pendingEditServiceIds.length} service(s)
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label>Discount Type</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={serviceDiscountType === "percentage" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setServiceDiscountType("percentage")}
                  className="flex-1"
                  data-testid="button-service-discount-percent"
                >
                  <Percent className="h-4 w-4 mr-1" />
                  Percentage
                </Button>
                <Button
                  variant={serviceDiscountType === "fixed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setServiceDiscountType("fixed")}
                  className="flex-1"
                  data-testid="button-service-discount-fixed"
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  Fixed Amount
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="service-discount-value">
                {serviceDiscountType === "percentage" ? "Discount (%)" : "Discount Amount ($)"}
              </Label>
              <Input
                id="service-discount-value"
                type="number"
                min="0"
                step={serviceDiscountType === "percentage" ? "1" : "0.01"}
                max={serviceDiscountType === "percentage" ? "100" : undefined}
                placeholder={serviceDiscountType === "percentage" ? "10" : "5.00"}
                value={serviceDiscountValue}
                onChange={(e) => setServiceDiscountValue(e.target.value)}
                className="mt-2"
                autoFocus
                data-testid="input-service-discount-value"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowServiceDiscountDialog(false);
                setPendingEditServiceIds([]);
                setServiceDiscountValue("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmServiceDiscount}
              disabled={!serviceDiscountValue || isNaN(parseFloat(serviceDiscountValue)) || parseFloat(serviceDiscountValue) <= 0}
              data-testid="button-confirm-service-discount"
            >
              Apply Discount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ticket-Level Discount Dialog */}
      <Dialog open={showTicketDiscountDialog} onOpenChange={setShowTicketDiscountDialog}>
        <DialogContent className="sm:max-w-[400px]" data-testid="dialog-ticket-discount">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Add Ticket Discount
            </DialogTitle>
            <DialogDescription>
              Apply a discount to the entire ticket
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label>Discount Type</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={ticketDiscountType === "percentage" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTicketDiscountType("percentage")}
                  className="flex-1"
                  data-testid="button-ticket-discount-percent"
                >
                  <Percent className="h-4 w-4 mr-1" />
                  Percentage
                </Button>
                <Button
                  variant={ticketDiscountType === "fixed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTicketDiscountType("fixed")}
                  className="flex-1"
                  data-testid="button-ticket-discount-fixed"
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  Fixed Amount
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="ticket-discount-value">
                {ticketDiscountType === "percentage" ? "Discount (%)" : "Discount Amount ($)"}
              </Label>
              <Input
                id="ticket-discount-value"
                type="number"
                min="0"
                step={ticketDiscountType === "percentage" ? "1" : "0.01"}
                max={ticketDiscountType === "percentage" ? "100" : undefined}
                placeholder={ticketDiscountType === "percentage" ? "10" : "5.00"}
                value={ticketDiscountValue}
                onChange={(e) => setTicketDiscountValue(e.target.value)}
                className="mt-2"
                autoFocus
                data-testid="input-ticket-discount-value"
              />
            </div>
            <div>
              <Label htmlFor="ticket-discount-reason">Reason (optional)</Label>
              <Input
                id="ticket-discount-reason"
                type="text"
                placeholder="e.g., Loyalty, First visit, Promotion"
                value={ticketDiscountReason}
                onChange={(e) => setTicketDiscountReason(e.target.value)}
                className="mt-2"
                data-testid="input-ticket-discount-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowTicketDiscountDialog(false);
                setTicketDiscountValue("");
                setTicketDiscountReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmTicketDiscount}
              disabled={!ticketDiscountValue || isNaN(parseFloat(ticketDiscountValue)) || parseFloat(ticketDiscountValue) <= 0}
              data-testid="button-confirm-ticket-discount"
            >
              Apply Discount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
