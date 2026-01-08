import { useState, useEffect, useRef, useReducer, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useAppDispatch } from "@/store/hooks";
import {
  createCheckoutTicket,
  updateCheckoutTicket,
  markTicketAsPaid,
  type ServiceStatus,
  type CheckoutTicketService,
} from "@/store/slices/uiTicketsSlice";
import { updateServiceStatusInSupabase } from "@/store/slices/ticketsSlice";
import type { ServiceStatus as TicketServiceStatus } from "@/types/common";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ClientSelector, { Client } from "./ClientSelector";
import ServiceGrid, { Service } from "./ServiceGrid";
import { TicketService, StaffMember } from "./ServiceList";
import InteractiveSummary from "./InteractiveSummary";
import PaymentModal from "./PaymentModal";
import FullPageServiceSelector from "./FullPageServiceSelector";
import StaffGridView from "./StaffGridView";
import { ResizablePanel } from "@/components/ui/ResizablePanel";
import SplitTicketDialog from "./SplitTicketDialog";
import MergeTicketsDialog, { OpenTicket } from "./MergeTicketsDialog";
import ServicePackages from "./ServicePackages";
import ProductSales from "./ProductSales";
import PurchaseHistory from "./PurchaseHistory";
import ReceiptPreview from "./ReceiptPreview";
import RefundVoidDialog from "./RefundVoidDialog";
import { ItemTabBar } from "./ItemTabBar";
import { ProductGrid } from "./ProductGrid";
import { PackageGrid } from "./PackageGrid";
import { GiftCardGrid } from "./GiftCardGrid";
import { getProductsByCategory } from "@/data/mockProducts";
import { getPackagesByCategory } from "@/data/mockPackages";
import { getGiftCardsByDesign } from "@/data/mockGiftCards";
import { dataService } from "@/services/dataService";
// Import extracted types, reducer, constants, and components
import type { PanelMode } from "./types";
import { createInitialState, ticketReducer, ticketActions } from "./reducers/ticketReducer";
import { MOCK_OPEN_TICKETS, KEYBOARD_HINTS_DISMISSED_KEY } from "./constants";
import { KeyboardShortcutsHint } from "./components";
// Collapsible imports available if needed
// import {
//   Collapsible,
//   CollapsibleContent,
//   CollapsibleTrigger,
// } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import {
  X,
  Maximize2,
  Minimize2,
  User,
  AlertCircle,
  Plus,
  Clock,
  Play,
  CreditCard,
  Trash2,
  Sparkles,
  Search,
  MoreVertical,
  ShoppingBag,
  Package,
  Gift,
  ChevronLeft,
  ChevronDown,
  Users,
  RotateCcw,
  LogIn,
  Keyboard,
  UserPlus,
  AlertTriangle,
  Phone,
  Mail,
} from "lucide-react";

// ============================================================================
// RE-EXPORTS
// ============================================================================
// Types extracted to ./types/ for better organization
// Reducer and actions extracted to ./reducers/ticketReducer.ts
export type { CouponData, GiftCardData } from "./types";

// Note: Mock data moved to ./constants/mockData.ts
// Note: KeyboardShortcutsHint component moved to ./components/KeyboardShortcutsHint.tsx
void KeyboardShortcutsHint; // Suppress unused warning - kept for future use

// ============================================================================
// COMPONENT
// ============================================================================

interface TicketPanelProps {
  isOpen: boolean;
  onClose: () => void;
  staffMembers: StaffMember[];
}

export default function TicketPanel({
  isOpen,
  onClose,
  staffMembers,
}: TicketPanelProps) {
  const { toast } = useToast();
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const checkoutCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Redux dispatch for creating tickets
  const reduxDispatch = useAppDispatch();

  const [state, dispatch] = useReducer(ticketReducer, undefined, createInitialState);

  // Keyboard hints state - kept for future use when hints banner is re-enabled
  const [keyboardHintsDismissed, setKeyboardHintsDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(KEYBOARD_HINTS_DISMISSED_KEY) === "true";
  });
  void keyboardHintsDismissed; // Suppress unused warning - kept for future use

  const handleDismissKeyboardHints = () => {
    setKeyboardHintsDismissed(true);
    localStorage.setItem(KEYBOARD_HINTS_DISMISSED_KEY, "true");
  };
  void handleDismissKeyboardHints; // Suppress unused warning - kept for future use

  // Load pending ticket from localStorage when panel opens
  // Then fetch persisted status from Supabase if available
  useEffect(() => {
    if (isOpen) {
      const storedTicket = localStorage.getItem('checkout-pending-ticket');
      if (storedTicket) {
        const loadTicket = async () => {
          try {
            const pendingTicket = JSON.parse(storedTicket);
            console.log('📋 Loading pending ticket:', pendingTicket);

            // CRITICAL: Clear any existing services BEFORE loading to prevent duplicates
            dispatch(ticketActions.clearServices());

            // Set client from pending ticket
            if (pendingTicket.clientName && pendingTicket.clientName !== 'Walk-in') {
              const client: Client = {
                id: pendingTicket.clientId || `client-${Date.now()}`,
                firstName: pendingTicket.clientName.split(' ')[0] || '',
                lastName: pendingTicket.clientName.split(' ').slice(1).join(' ') || '',
                phone: '',
              };
              dispatch(ticketActions.setClient(client));
            }

            // Try to fetch persisted ticket from Supabase for latest service statuses
            let persistedServices: any[] | null = null;
            if (pendingTicket.id) {
              try {
                const persistedTicket = await dataService.tickets.getById(pendingTicket.id);
                if (persistedTicket && persistedTicket.services) {
                  persistedServices = persistedTicket.services;
                  console.log('📥 Fetched persisted ticket from Supabase:', persistedTicket.id);
                }
              } catch (fetchError) {
                console.warn('⚠️ Could not fetch persisted ticket, using localStorage data:', fetchError);
              }
            }

            // Load services - merge persisted status if available
            if (pendingTicket.checkoutServices && pendingTicket.checkoutServices.length > 0) {
              const ticketServices: TicketService[] = pendingTicket.checkoutServices.map((s: any) => {
                // Find persisted service to get latest status
                const persistedService = persistedServices?.find(ps => ps.serviceId === (s.serviceId || s.id));
                return {
                  id: s.id || `service-${Date.now()}-${Math.random()}`,
                  serviceId: s.serviceId || s.id,
                  serviceName: s.serviceName || s.name,
                  price: s.price || 0,
                  duration: s.duration || 30,
                  // Use persisted status if available, otherwise use localStorage/default
                  status: persistedService?.status || s.status || 'not_started',
                  staffId: s.staffId,
                  staffName: s.staffName,
                  // Restore timing data from persisted service
                  actualStartTime: persistedService?.actualStartTime,
                  pausedAt: persistedService?.pausedAt,
                  totalPausedDuration: persistedService?.totalPausedDuration,
                  endTime: persistedService?.endTime,
                  actualDuration: persistedService?.actualDuration,
                };
              });
              dispatch(ticketActions.addService(ticketServices));
            } else if (pendingTicket.service) {
              // Fallback: create service from basic pending ticket data
              const ticketService: TicketService = {
                id: `service-${Date.now()}`,
                serviceId: `service-${Date.now()}`,
                serviceName: pendingTicket.service,
                price: pendingTicket.subtotal || 0,
                duration: parseInt(pendingTicket.duration) || 30,
                status: 'completed',
                staffId: pendingTicket.techId,
                staffName: pendingTicket.technician,
              };
              dispatch(ticketActions.addService([ticketService]));
            }

            // Set discount if any
            if (pendingTicket.discount && pendingTicket.discount > 0) {
              dispatch(ticketActions.applyDiscount(pendingTicket.discount));
            }

            // Save ticket ID for persistence
            if (pendingTicket.id) {
              dispatch(ticketActions.setTicketId(pendingTicket.id));
            }

            // Mark as saved since this is an existing ticket from Pending
            dispatch(ticketActions.markTicketSaved());

            console.log('✅ Pending ticket loaded into checkout, ID:', pendingTicket.id);
          } catch (error) {
            console.error('❌ Failed to load pending ticket:', error);
          }
        };

        loadTicket();
      } else {
        // No stored ticket - this is a NEW ticket, reset state completely
        console.log('🆕 Opening new ticket panel - resetting state');
        dispatch(ticketActions.resetTicket());
      }
    }
  }, [isOpen]);

  // ============================================================================
  // AUTO-SAVE FOR EXISTING TICKETS
  // When opening an existing ticket and making changes, save immediately (no debounce)
  // ============================================================================
  const lastTicketIdRef = useRef<string | null>(null);
  const loadCompleteRef = useRef(false);

  // Reset auto-save state when panel opens/closes or ticket changes
  useEffect(() => {
    if (!isOpen) {
      // Panel closed - reset everything
      loadCompleteRef.current = false;
      lastTicketIdRef.current = null;
      return;
    }

    // New ticket loaded - reset load complete flag
    if (state.ticketId !== lastTicketIdRef.current) {
      loadCompleteRef.current = false;
      lastTicketIdRef.current = state.ticketId;
    }
  }, [isOpen, state.ticketId]);

  // Mark load as complete after a short delay (after all initial state updates settle)
  useEffect(() => {
    if (!isOpen || !state.ticketId) return;

    const timer = setTimeout(() => {
      loadCompleteRef.current = true;
      console.log('📋 Ticket load complete, auto-save enabled for:', state.ticketId);
    }, 500); // Wait for initial load to settle

    return () => clearTimeout(timer);
  }, [isOpen, state.ticketId]);

  // Helper function to perform auto-save (reusable for immediate save and save-on-close)
  const performAutoSave = useCallback(async () => {
    if (!state.ticketId) return;

    const checkoutServices = convertToCheckoutServices(state.services);
    const clientName = state.selectedClient
      ? `${state.selectedClient.firstName} ${state.selectedClient.lastName}`.trim()
      : 'Walk-in';
    const subtotal = state.services.reduce((sum, s) => sum + s.price, 0);
    const tax = Math.max(0, subtotal - state.discounts.discount) * 0.085;
    const total = Math.max(0, subtotal - state.discounts.discount) * 1.085;

    console.log('💾 Auto-saving ticket:', state.ticketId);

    try {
      // Update Redux state
      await reduxDispatch(updateCheckoutTicket({
        ticketId: state.ticketId,
        updates: {
          clientId: state.selectedClient?.id,
          clientName,
          services: checkoutServices,
          discount: state.discounts.discount,
          subtotal,
          tax,
          total,
        },
      })).unwrap();

      // CRITICAL: Update localStorage IMMEDIATELY so reopening shows saved changes
      const storedTicket = localStorage.getItem('checkout-pending-ticket');
      if (storedTicket) {
        try {
          const existingTicket = JSON.parse(storedTicket);
          const updatedTicket = {
            ...existingTicket,
            clientId: state.selectedClient?.id,
            clientName,
            checkoutServices,
            discount: state.discounts.discount,
            subtotal,
            tax,
            total,
          };
          localStorage.setItem('checkout-pending-ticket', JSON.stringify(updatedTicket));
        } catch (e) {
          console.warn('⚠️ Could not update localStorage:', e);
        }
      }

      console.log('✅ Auto-save complete for ticket:', state.ticketId);
      dispatch(ticketActions.markTicketSaved());
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
    }
  }, [state.ticketId, state.services, state.selectedClient, state.discounts.discount, reduxDispatch]);

  // Auto-save effect - IMMEDIATE save on every change (no debounce)
  useEffect(() => {
    // Skip if panel is not open
    if (!isOpen) return;

    // Skip if no ticketId (new ticket - requires explicit save)
    if (!state.ticketId) return;

    // Skip if load is not complete (still loading initial data)
    if (!loadCompleteRef.current) {
      console.log('⏳ Skipping auto-save - still loading ticket');
      return;
    }

    // Save IMMEDIATELY on every change - no debounce to prevent data loss
    performAutoSave();
  }, [isOpen, state.ticketId, state.services, state.selectedClient, state.discounts.discount, performAutoSave]);

  const {
    ticketId,
    services,
    selectedClient,
    discounts,
    staff,
    dialogs,
    ui,
    isNewTicket,
  } = state;

  const {
    discount,
    appliedPointsDiscount,
    redeemedPoints,
    appliedCoupon,
    couponDiscount,
    appliedGiftCards,
  } = discounts;

  const { activeStaffId, assignedStaffIds, preSelectedStaff } = staff;

  const {
    showPaymentModal,
    showServicesOnMobile,
    showStaffOnMobile,
    showServicePackages,
    showProductSales,
    showPurchaseHistory,
    showReceiptPreview,
    showRefundVoid,
    showRemoveClientConfirm,
    showDiscardTicketConfirm,
    showPreventStaffRemoval,
    preventStaffRemovalMessage,
    showKeyboardShortcuts,
    showSplitTicketDialog,
    showMergeTicketsDialog,
    showClientSelector,
    showClientProfile,
  } = dialogs;

  const {
    mode,
    selectedCategory,
    fullPageTab,
    addItemTab,
    reassigningServiceIds,
    headerVisible: _headerVisible,
    lastScrollY,
    searchQuery,
  } = ui;

  const subtotal = services.reduce((sum, s) => sum + s.price, 0);
  const discountedSubtotal = subtotal - discount - appliedPointsDiscount - couponDiscount;
  const tax = Math.max(0, discountedSubtotal) * 0.085;
  const total = Math.max(0, discountedSubtotal) + tax;
  const canCheckout = services.length > 0 && total > 0;

  // Calculate per-staff service totals for tip distribution
  const staffServiceTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    services.forEach(s => {
      const staffId = s.staffId || 'unassigned';
      totals[staffId] = (totals[staffId] || 0) + s.price;
    });
    return totals;
  }, [services]);

  // ============================================================================
  // TICKET CREATION - Only create ticket when user explicitly chooses an action
  // ============================================================================

  // Convert local TicketService to CheckoutTicketService for Redux
  const convertToCheckoutServices = (localServices: TicketService[]): CheckoutTicketService[] => {
    return localServices.map(s => ({
      id: s.id,
      serviceId: s.serviceId,
      serviceName: s.serviceName,
      price: s.price,
      duration: s.duration,
      status: s.status as ServiceStatus,
      staffId: s.staffId,
      staffName: s.staffName,
      startTime: s.startTime,
    }));
  };

  // Create ticket with specified status (waiting, in-service, or completed/pending)
  type TicketStatus = 'waiting' | 'in-service' | 'completed';

  const createTicketWithStatus = async (status: TicketStatus): Promise<boolean> => {
    if (services.length === 0) {
      toast({
        title: "No Services",
        description: "Add at least one service before saving the ticket.",
        variant: "destructive",
      });
      return false;
    }

    const checkoutServices = convertToCheckoutServices(services);
    const clientName = selectedClient
      ? `${selectedClient.firstName} ${selectedClient.lastName}`.trim()
      : 'Walk-in';

    const statusLabels: Record<TicketStatus, string> = {
      'waiting': 'Waitlist',
      'in-service': 'In Service',
      'completed': 'Pending',
    };

    try {
      // If ticketId exists, UPDATE the existing ticket instead of creating a new one
      if (ticketId) {
        console.log('📝 Updating existing ticket:', ticketId, 'with status:', status);
        await reduxDispatch(updateCheckoutTicket({
          ticketId,
          updates: {
            clientId: selectedClient?.id,
            clientName,
            services: checkoutServices,
            notes: undefined,
            discount,
            subtotal,
            tax,
            total,
            status, // Pass the desired status
          },
        })).unwrap();

        toast({
          title: "Ticket Updated",
          description: `Ticket updated and saved to ${statusLabels[status]}`,
        });

        // Mark ticket as saved so close confirmation won't show
        dispatch(ticketActions.markTicketSaved());

        console.log(`✅ Updated ticket in ${statusLabels[status]}:`, ticketId);
        return true;
      }

      // No ticketId - create a new ticket
      const result = await reduxDispatch(createCheckoutTicket({
        clientId: selectedClient?.id,
        clientName,
        services: checkoutServices,
        notes: undefined,
        discount,
        subtotal,
        tax,
        total,
        status, // Pass the desired status
      })).unwrap();

      toast({
        title: "Ticket Created",
        description: `Ticket #${result.number} added to ${statusLabels[status]}`,
      });

      // Mark ticket as saved so close confirmation won't show
      dispatch(ticketActions.markTicketSaved());

      console.log(`✅ Created ticket in ${statusLabels[status]}:`, result.id, result.number);
      return true;
    } catch (error) {
      console.error('❌ Failed to save ticket:', error);
      toast({
        title: "Error",
        description: "Failed to save ticket. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Handler for "Check In" - creates ticket in Waitlist
  const handleCheckIn = async () => {
    const success = await createTicketWithStatus('waiting');
    if (success) {
      dispatch(ticketActions.resetTicket());
      setShowDiscardTicketConfirm(false);
      onClose();
    }
  };

  // Handler for "Start Service" - creates ticket in In Service
  const handleStartService = async () => {
    const success = await createTicketWithStatus('in-service');
    if (success) {
      dispatch(ticketActions.resetTicket());
      setShowDiscardTicketConfirm(false);
      onClose();
    }
  };

  // Handler for "Save to Pending" - creates ticket in Pending (awaiting payment)
  const handleSaveToPending = async () => {
    const success = await createTicketWithStatus('completed');
    if (success) {
      dispatch(ticketActions.resetTicket());
      setShowDiscardTicketConfirm(false);
      onClose();
    }
  };

  // Handler for "Disregard" - just close without saving
  const handleDisregard = () => {
    dispatch(ticketActions.resetTicket());
    setShowDiscardTicketConfirm(false);
    onClose();
  };

  const handleCreateClient = (newClient: Partial<Client>) => {
    const client: Client = {
      id: Math.random().toString(),
      firstName: newClient.firstName || "",
      lastName: newClient.lastName || "",
      phone: newClient.phone || "",
      email: newClient.email,
    };
    dispatch(ticketActions.setClient(client));
    toast({
      title: "Client Added",
      description: `${client.firstName} ${client.lastName} added to ticket`,
    });
  };

  const handleAddServices = (selectedServices: Service[], staffId?: string, staffName?: string) => {
    const targetStaffId = staffId || preSelectedStaff?.id || activeStaffId || undefined;
    const targetStaffName = staffName || preSelectedStaff?.name || (targetStaffId && staffMembers.find(s => s.id === targetStaffId)?.name) || undefined;

    const newTicketServices: TicketService[] = selectedServices.map(service => ({
      id: Math.random().toString(),
      serviceId: service.id,
      serviceName: service.name,
      category: service.category,
      price: service.price,
      duration: service.duration,
      status: "not_started" as const,
      staffId: targetStaffId,
      staffName: targetStaffName,
    }));

    dispatch(ticketActions.addService(newTicketServices));
    
    toast({
      title: `${selectedServices.length} Service${selectedServices.length > 1 ? 's' : ''} Added`,
      description: targetStaffName ? `Assigned to ${targetStaffName}` : "Service added to ticket",
    });
    console.log(`Added ${selectedServices.length} service(s)`, { staffId: targetStaffId, staffName: targetStaffName });
  };

  const handleAddStaff = (staffId: string, staffName: string) => {
    dispatch(ticketActions.addStaff(staffId));
    toast({
      title: "Staff Added",
      description: `${staffName} added to ticket`,
    });
    console.log("Staff added to ticket:", { staffId, staffName });
  };

  const handleAddServiceToStaff = (staffId: string, staffName: string) => {
    if (reassigningServiceIds.length > 0) {
      if (staffId && staffName) {
        reassigningServiceIds.forEach(serviceId => {
          dispatch(ticketActions.updateService(serviceId, { staffId, staffName }));
        });
        dispatch(ticketActions.addStaff(staffId));
      }
      dispatch(ticketActions.setReassigningServiceIds([]));
      dispatch(ticketActions.setFullPageTab("services"));
    } else {
      if (staffId && staffName) {
        dispatch(ticketActions.setPreSelectedStaff({ id: staffId, name: staffName }));
        dispatch(ticketActions.setActiveStaff(staffId));
        if (!assignedStaffIds.includes(staffId)) {
          dispatch(ticketActions.addStaff(staffId));
        }
      } else {
        dispatch(ticketActions.setPreSelectedStaff(null));
      }
      dispatch(ticketActions.setFullPageTab("services"));
    }
  };

  const handleReassignStaff = (serviceIdOrIds: string | string[]) => {
    const ids = Array.isArray(serviceIdOrIds) ? serviceIdOrIds : [serviceIdOrIds];
    dispatch(ticketActions.setReassigningServiceIds(ids));
    dispatch(ticketActions.setFullPageTab("staff"));
  };

  const handleUpdateService = (serviceId: string, updates: Partial<TicketService>) => {
    // Update local state immediately for responsive UI
    dispatch(ticketActions.updateService(serviceId, updates));

    // Persist status changes to Supabase if we have a ticket ID
    if (updates.status && ticketId) {
      const service = services.find(s => s.id === serviceId);
      if (service && service.serviceId) {
        reduxDispatch(updateServiceStatusInSupabase({
          ticketId,
          serviceId: service.serviceId,
          newStatus: updates.status as TicketServiceStatus,
          userId: 'current-user', // TODO: Get from auth context
          deviceId: 'web-browser', // TODO: Get from device context
        })).then(() => {
          console.log('✅ Service status persisted:', updates.status);
        }).catch((error) => {
          console.error('❌ Failed to persist service status:', error);
        });
      }
    }
  };

  const handleRemoveService = (serviceId: string) => {
    const serviceToRemove = services.find(s => s.id === serviceId);
    if (!serviceToRemove) return;
    
    const previousServices = [...services];
    dispatch(ticketActions.removeService(serviceId));
    
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    
    toast({
      title: "Service Removed",
      description: `${serviceToRemove.serviceName} removed from ticket`,
      action: (
        <ToastAction altText="Undo" onClick={() => {
          if (undoTimeoutRef.current) {
            clearTimeout(undoTimeoutRef.current);
          }
          previousServices.forEach(s => {
            if (s.id === serviceId) {
              dispatch(ticketActions.addService([s]));
            }
          });
          toast({
            title: "Service Restored",
            description: `${serviceToRemove.serviceName} restored to ticket`,
          });
        }}>
          Undo
        </ToastAction>
      ),
    });
    
    undoTimeoutRef.current = setTimeout(() => {
      undoTimeoutRef.current = null;
    }, 5000);
  };

  const handleRemoveClient = (client: Client | null) => {
    if (client === null) {
      // Removing client
      if (selectedClient && services.length > 0) {
        // Has services - show confirmation dialog
        dispatch(ticketActions.toggleDialog("showRemoveClientConfirm", true));
      } else if (selectedClient) {
        // No services - remove directly
        dispatch(ticketActions.removeClient());
      }
    } else {
      // Setting/changing client
      dispatch(ticketActions.setClient(client));
    }
  };
  
  const confirmRemoveClient = () => {
    dispatch(ticketActions.removeClient());
  };

  const handleRemoveStaff = (staffId: string) => {
    const staffMember = staffMembers.find(s => s.id === staffId);
    const staffName = staffMember?.name || "Staff";
    const servicesCount = services.filter(s => s.staffId === staffId).length;
    
    if (assignedStaffIds.length === 1 && servicesCount > 0) {
      dispatch(ticketActions.setPreventStaffRemovalMessage(
        `Cannot remove ${staffName}. They are the last staff member with ${servicesCount} service(s). Please reassign their services first.`
      ));
      dispatch(ticketActions.toggleDialog("showPreventStaffRemoval", true));
      return;
    }
    
    const previousServices = [...services];
    const previousAssignedStaffIds = [...assignedStaffIds];
    const previousActiveStaffId = activeStaffId;
    
    dispatch(ticketActions.removeStaff(staffId, true));
    
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    
    toast({
      title: "Staff Removed",
      description: `${staffName} and ${servicesCount} service${servicesCount !== 1 ? 's' : ''} removed`,
      action: (
        <ToastAction altText="Undo" onClick={() => {
          if (undoTimeoutRef.current) {
            clearTimeout(undoTimeoutRef.current);
          }
          const removedServices = previousServices.filter(s => s.staffId === staffId);
          removedServices.forEach(s => dispatch(ticketActions.addService([s])));
          dispatch(ticketActions.setAssignedStaffIds(previousAssignedStaffIds));
          dispatch(ticketActions.setActiveStaff(previousActiveStaffId));
          toast({
            title: "Staff Restored",
            description: `${staffName} and services restored to ticket`,
          });
        }}>
          Undo
        </ToastAction>
      ),
    });
    
    undoTimeoutRef.current = setTimeout(() => {
      undoTimeoutRef.current = null;
    }, 5000);
  };


  const handleAddPackage = (
    packageData: {
      id: string;
      name: string;
      description: string;
      services: { serviceId: string; serviceName: string; originalPrice: number; duration?: number }[];
      packagePrice: number;
      validDays: number;
      category: string;
    },
    staffId: string
  ) => {
    const staffMember = staffMembers.find((s) => s.id === staffId);
    if (!staffMember) return;

    const packageServices: TicketService[] = packageData.services.map((service, index) => ({
      id: `pkg-${packageData.id}-${service.serviceId}-${Date.now()}-${index}`,
      serviceId: service.serviceId,
      serviceName: service.serviceName,
      price: service.originalPrice,
      duration: service.duration || 30,
      staffId: staffId,
      staffName: staffMember.name,
      status: "not_started" as const,
    }));

    const totalOriginalPrice = packageData.services.reduce((sum, s) => sum + s.originalPrice, 0);
    const packageDiscount = totalOriginalPrice - packageData.packagePrice;

    dispatch(ticketActions.addPackage(packageServices, packageDiscount, true));

    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    
    toast({
      title: "Package Added",
      description: `${packageData.name} added to ${staffMember.name} (saved $${packageDiscount.toFixed(2)})`,
      action: (
        <ToastAction altText="Undo" onClick={() => {
          if (undoTimeoutRef.current) {
            clearTimeout(undoTimeoutRef.current);
          }
          dispatch(ticketActions.undoLastAction());
        }}>
          Undo
        </ToastAction>
      ),
    });
    
    undoTimeoutRef.current = setTimeout(() => {
      undoTimeoutRef.current = null;
    }, 5000);
  };

  const handleAddProducts = (
    items: { productId: string; name: string; price: number; quantity: number }[]
  ) => {
    const productServices: TicketService[] = items.flatMap((item) => {
      const products: TicketService[] = [];
      for (let i = 0; i < item.quantity; i++) {
        products.push({
          id: `product-${item.productId}-${Date.now()}-${i}`,
          serviceId: `product-${item.productId}`,
          serviceName: `[Product] ${item.name}`,
          price: item.price,
          duration: 0,
          staffId: undefined,
          status: "completed" as const,
        });
      }
      return products;
    });

    dispatch(ticketActions.addProducts(productServices, true));

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    
    toast({
      title: "Products Added",
      description: `${totalItems} product${totalItems !== 1 ? "s" : ""} added ($${totalValue.toFixed(2)})`,
      action: (
        <ToastAction altText="Undo" onClick={() => {
          if (undoTimeoutRef.current) {
            clearTimeout(undoTimeoutRef.current);
          }
          dispatch(ticketActions.undoLastAction());
        }}>
          Undo
        </ToastAction>
      ),
    });
    
    undoTimeoutRef.current = setTimeout(() => {
      undoTimeoutRef.current = null;
    }, 5000);
  };

  const handleRepeatPurchase = (
    items: { id: string; name: string; price: number; staffName: string; type: string }[]
  ) => {
    const repeatedServices: TicketService[] = items.map((item, index) => ({
      id: `repeat-${item.id}-${Date.now()}-${index}`,
      serviceId: item.id,
      serviceName: item.type === "product" ? `[Product] ${item.name}` : item.name,
      price: item.price,
      duration: item.type === "product" ? 0 : 30,
      staffId: undefined,
      status: item.type === "product" ? ("completed" as const) : ("not_started" as const),
    }));

    dispatch(ticketActions.addService(repeatedServices));

    toast({
      title: "Purchase Repeated",
      description: `${items.length} item${items.length !== 1 ? "s" : ""} added from previous purchase`,
    });
  };

  const handleRefund = (data: {
    type: "full" | "partial";
    amount: number;
    reason: string;
    refundMethod: string;
    serviceIds: string[];
  }) => {
    toast({
      title: "Refund Processed",
      description: `$${data.amount.toFixed(2)} refunded via ${data.refundMethod}`,
    });
    dispatch(ticketActions.toggleDialog("showRefundVoid", false));
  };

  const handleVoid = (reason: string) => {
    dispatch(ticketActions.voidTicket());
    
    toast({
      title: "Transaction Voided",
      description: `Transaction has been voided: ${reason}`,
    });
    dispatch(ticketActions.toggleDialog("showRefundVoid", false));
  };


  const handleDuplicateServices = (serviceIds: string[]) => {
    dispatch(ticketActions.duplicateServices(serviceIds));
  };

  const handleSplitTicket = (serviceIds: string[], keepClient: boolean) => {
    const servicesToSplit = services.filter((s) => serviceIds.includes(s.id));
    const remainingServices = services.filter((s) => !serviceIds.includes(s.id));
    
    const splitSubtotal = servicesToSplit.reduce((sum, s) => sum + s.price, 0);
    const splitDiscountPortion = subtotal > 0 ? (splitSubtotal / subtotal) * discount : 0;
    
    const splitStaffIds = Array.from(new Set(
      servicesToSplit
        .filter(s => s.staffId)
        .map(s => s.staffId as string)
    ));
    
    const firstStaffId = servicesToSplit.find(s => s.staffId)?.staffId || null;
    
    dispatch(ticketActions.splitTicket(
      serviceIds,
      keepClient,
      splitDiscountPortion,
      splitStaffIds,
      firstStaffId
    ));
    
    toast({
      title: "Ticket Split",
      description: `Created new ticket with ${servicesToSplit.length} service${servicesToSplit.length !== 1 ? 's' : ''}. Original ticket has ${remainingServices.length} service${remainingServices.length !== 1 ? 's' : ''}.`,
    });
    
    console.log("Ticket split:", {
      splitServices: servicesToSplit.length,
      remainingServices: remainingServices.length,
      splitDiscount: splitDiscountPortion,
    });
  };

  const handleMergeTickets = (ticketIds: string[], keepCurrentClient: boolean) => {
    const ticketsToMerge = MOCK_OPEN_TICKETS.filter((t) => ticketIds.includes(t.id));
    
    const mergedServices: TicketService[] = ticketsToMerge.flatMap((t) =>
      t.services.map((s) => ({
        ...s,
        id: Math.random().toString(),
      }))
    );
    
    const mergedDiscount = ticketsToMerge.reduce((sum, t) => sum + t.discount, 0);
    
    const mergedStaffIds = mergedServices
      .filter((s) => s.staffId)
      .map((s) => s.staffId as string);
    
    dispatch(ticketActions.mergeTickets(mergedServices, mergedDiscount, mergedStaffIds));
    
    if (!keepCurrentClient) {
      dispatch(ticketActions.removeClient());
    }
    
    toast({
      title: "Tickets Merged",
      description: `Combined ${ticketsToMerge.length + 1} tickets with ${services.length + mergedServices.length} total services.`,
    });
    
    console.log("Tickets merged:", {
      mergedTickets: ticketIds.length,
      totalServices: services.length + mergedServices.length,
      combinedDiscount: discount + mergedDiscount,
    });
  };

  const handleCheckout = () => {
    dispatch(ticketActions.toggleDialog("showPaymentModal", true));
  };

  const handleCompletePayment = async (payment: any) => {
    // Mark all services as completed
    services.forEach((s) => {
      if (s.status !== "completed") {
        dispatch(ticketActions.updateService(s.id, { status: "completed" }));
      }
    });

    console.log("Payment completed:", { selectedClient, services, payment });

    // Close the payment modal first
    dispatch(ticketActions.toggleDialog("showPaymentModal", false));

    // Track the effective ticket ID (either existing or newly created)
    let effectiveTicketId = ticketId;

    try {
      // 1. If no ticketId exists, create the ticket first (for direct checkout without prior save)
      if (!effectiveTicketId && services.length > 0) {
        console.log("📝 Creating ticket for direct checkout (no prior save)...");
        const checkoutServices = convertToCheckoutServices(services);
        const clientName = selectedClient
          ? `${selectedClient.firstName} ${selectedClient.lastName}`.trim()
          : 'Walk-in';

        const result = await reduxDispatch(createCheckoutTicket({
          clientId: selectedClient?.id,
          clientName,
          services: checkoutServices,
          notes: undefined,
          discount,
          subtotal,
          tax,
          total,
          status: 'completed', // Mark as completed since we're paying now
        })).unwrap();

        effectiveTicketId = result.id;
        console.log("✅ Ticket created for direct checkout:", effectiveTicketId, "Number:", result.number);
      }

      // 2. Complete the ticket in the database (marks status as 'completed')
      if (effectiveTicketId) {
        console.log("📝 Completing ticket in database:", effectiveTicketId);
        const completedTicket = await dataService.tickets.complete(effectiveTicketId, payment.methods || []);
        if (completedTicket) {
          console.log("✅ Ticket completed:", completedTicket.id, "Status:", completedTicket.status);
        }
      }

      // 2. Create transaction record for the payment
      const primaryMethod = payment.methods?.[0];
      const primaryPaymentMethod = (primaryMethod?.type || 'cash') as 'cash' | 'card' | 'gift_card' | 'other';

      // Bug #10 fix: Get ticket number from state first, then localStorage fallback
      const storedTicket = localStorage.getItem('checkout-pending-ticket');
      const parsedStoredTicket = storedTicket ? JSON.parse(storedTicket) : null;
      const ticketNumber = parsedStoredTicket?.number || 0;

      // Build payment details based on payment method
      const paymentDetails: {
        amountTendered?: number;
        changeDue?: number;
        authCode?: string;
        transactionId?: string;
        splits?: Array<{ method: 'cash' | 'card' | 'gift_card' | 'other'; amount: number; details: any }>;
      } = {};

      if (primaryPaymentMethod === 'cash' && primaryMethod?.tendered) {
        paymentDetails.amountTendered = primaryMethod.tendered;
        paymentDetails.changeDue = primaryMethod.tendered - primaryMethod.amount;
      }

      // Bug #9 fix: Capture card payment auth code and transaction ID
      if (primaryPaymentMethod === 'card' && primaryMethod) {
        paymentDetails.authCode = primaryMethod.authCode || primaryMethod.authorization_code;
        paymentDetails.transactionId = primaryMethod.transactionId || primaryMethod.transaction_id;
      }

      // Handle split payments
      if (payment.methods && payment.methods.length > 1) {
        paymentDetails.splits = payment.methods.map((m: any) => ({
          method: m.type as 'cash' | 'card' | 'gift_card' | 'other',
          amount: m.amount,
          details: m,
        }));
      }

      // Create transaction - cast to any for type flexibility with tipDistribution
      const transactionData = {
        ticketId: effectiveTicketId || `ticket-${Date.now()}`,
        ticketNumber: ticketNumber,
        clientId: selectedClient?.id,
        clientName: selectedClient
          ? `${selectedClient.firstName} ${selectedClient.lastName}`.trim() || 'Walk-in'
          : 'Walk-in',
        subtotal: subtotal,
        tax: tax,
        tip: payment.tip || 0,
        tipDistribution: payment.tipDistribution || [], // Bug #11 fix: Include tip distribution
        discount: discount || 0,
        paymentMethod: primaryPaymentMethod,
        paymentDetails: paymentDetails,
        services: services.map(s => ({
          name: s.serviceName,
          price: s.price,
          staffName: s.staffName,
        })),
        notes: '',
      };
      await dataService.transactions.create(transactionData as any);
      console.log("✅ Transaction record created");

      // 3. Mark ticket as paid and move from pending to closed
      if (effectiveTicketId) {
        console.log("📝 Marking ticket as paid:", effectiveTicketId);
        // Map payment method to expected format
        const mappedPaymentMethod = primaryPaymentMethod === 'card' ? 'credit-card' : primaryPaymentMethod;
        await reduxDispatch(markTicketAsPaid({
          ticketId: effectiveTicketId,
          paymentMethod: mappedPaymentMethod as any,
          paymentDetails: paymentDetails,
          tip: payment.tip || 0,
        })).unwrap();
        console.log("✅ Ticket marked as paid and moved to closed");
      }

      // Show success toast
      toast({
        title: "Payment Complete!",
        description: `Successfully processed payment of $${total.toFixed(2)}. Ticket closed.`,
        duration: 3000,
      });
    } catch (error) {
      console.error("❌ Error completing ticket:", error);
      // Still show success since payment was processed
      toast({
        title: "Payment Complete!",
        description: `Payment of $${total.toFixed(2)} processed. Some records may sync later.`,
        duration: 3000,
      });
    }

    // Reset ticket state and close the panel
    dispatch(ticketActions.resetTicket());

    const closeTimeout = setTimeout(() => {
      onClose();
    }, 1500);

    if (checkoutCloseTimeoutRef.current) {
      clearTimeout(checkoutCloseTimeoutRef.current);
    }
    checkoutCloseTimeoutRef.current = closeTimeout;
  };

  const handleReset = () => {
    // Reset clears services only, keeps the ticket open
    if (services.length > 0) {
      dispatch(ticketActions.clearServices());
      toast({
        title: "Cart cleared",
        description: "All services have been removed from the ticket.",
      });
    }
  };

  // performReset - used by discard dialog to fully reset ticket
  const performReset = () => {
    dispatch(ticketActions.resetTicket());
  };
  void performReset; // Used by discard dialog

  // Handle close attempt - show exit confirmation only for NEW unsaved tickets with services
  const handleCloseAttempt = () => {
    if (services.length > 0 && isNewTicket) {
      // Only show confirmation for new unsaved tickets
      dispatch(ticketActions.toggleDialog("showDiscardTicketConfirm", true));
    } else {
      // Already saved ticket or no services - just close
      onClose();
    }
  };

  useEffect(() => {
    localStorage.setItem("checkout-default-mode", mode);
  }, [mode]);

  useEffect(() => {
    if (!isOpen && checkoutCloseTimeoutRef.current) {
      clearTimeout(checkoutCloseTimeoutRef.current);
      checkoutCloseTimeoutRef.current = null;
    }
    
    return () => {
      if (checkoutCloseTimeoutRef.current) {
        clearTimeout(checkoutCloseTimeoutRef.current);
        checkoutCloseTimeoutRef.current = null;
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (assignedStaffIds.length === 1) {
      dispatch(ticketActions.setActiveStaff(assignedStaffIds[0]));
    } else if (assignedStaffIds.length > 1 && !activeStaffId) {
      dispatch(ticketActions.setActiveStaff(assignedStaffIds[0]));
    } else if (assignedStaffIds.length === 0) {
      dispatch(ticketActions.setActiveStaff(null));
    }
  }, [assignedStaffIds]);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLDivElement;
      const currentScrollY = target.scrollTop;
      
      if (currentScrollY < 10) {
        dispatch(ticketActions.setHeaderVisible(true));
      } else if (currentScrollY < lastScrollY) {
        dispatch(ticketActions.setHeaderVisible(true));
      } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        dispatch(ticketActions.setHeaderVisible(false));
      }
      
      dispatch(ticketActions.setLastScrollY(currentScrollY));
    };

    const scrollContainer = document.querySelector('[data-scroll-container]');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [lastScrollY]);

  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;
      
      if (e.key === '?' && !e.shiftKey) {
        e.preventDefault();
        dispatch(ticketActions.toggleDialog("showKeyboardShortcuts", true));
        return;
      }
      
      if (e.key === 'Escape') {
        if (showKeyboardShortcuts) {
          dispatch(ticketActions.toggleDialog("showKeyboardShortcuts", false));
        } else if (showPaymentModal) {
          dispatch(ticketActions.toggleDialog("showPaymentModal", false));
        } else {
          onClose();
        }
        return;
      }
      
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (modifier && e.key === 'k') {
        e.preventDefault();
        dispatch(ticketActions.setFullPageTab("services"));
        setTimeout(() => {
          const searchInput = document.querySelector('[data-testid="input-search-service-full"]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
        }, 100);
        return;
      }
      
      if (modifier && e.key === 'f') {
        e.preventDefault();
        setTimeout(() => {
          const searchInput = document.querySelector('[data-testid="input-search-client"]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
        }, 100);
        return;
      }
      
      if (modifier && e.key === 'Enter') {
        e.preventDefault();
        if (canCheckout) {
          handleCheckout();
        }
        return;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showKeyboardShortcuts, showPaymentModal, canCheckout, onClose]);

  if (!isOpen) return null;


  const setMode = (newMode: PanelMode) => dispatch(ticketActions.setMode(newMode));
  const setSelectedCategory = (category: string) => dispatch(ticketActions.setCategory(category));
  const setFullPageTab = (tab: "services" | "staff") => dispatch(ticketActions.setFullPageTab(tab));
  const setAddItemTab = (tab: "services" | "products" | "packages" | "giftcards") => dispatch(ticketActions.setAddItemTab(tab));
  const setSearchQuery = (query: string) => dispatch(ticketActions.setSearchQuery(query));
  const setActiveStaffId = (id: string | null) => dispatch(ticketActions.setActiveStaff(id));
  const setShowPaymentModal = (value: boolean) => dispatch(ticketActions.toggleDialog("showPaymentModal", value));
  const setShowServicesOnMobile = (value: boolean) => dispatch(ticketActions.toggleDialog("showServicesOnMobile", value));
  const setShowStaffOnMobile = (value: boolean) => dispatch(ticketActions.toggleDialog("showStaffOnMobile", value));
  const setShowServicePackages = (value: boolean) => dispatch(ticketActions.toggleDialog("showServicePackages", value));
  const setShowProductSales = (value: boolean) => dispatch(ticketActions.toggleDialog("showProductSales", value));
  const setShowPurchaseHistory = (value: boolean) => dispatch(ticketActions.toggleDialog("showPurchaseHistory", value));
  const setShowReceiptPreview = (value: boolean) => dispatch(ticketActions.toggleDialog("showReceiptPreview", value));
  const setShowRefundVoid = (value: boolean) => dispatch(ticketActions.toggleDialog("showRefundVoid", value));
  const setShowRemoveClientConfirm = (value: boolean) => dispatch(ticketActions.toggleDialog("showRemoveClientConfirm", value));
  const setShowDiscardTicketConfirm = (value: boolean) => dispatch(ticketActions.toggleDialog("showDiscardTicketConfirm", value));
  const setShowPreventStaffRemoval = (value: boolean) => dispatch(ticketActions.toggleDialog("showPreventStaffRemoval", value));
  const setShowKeyboardShortcuts = (value: boolean) => dispatch(ticketActions.toggleDialog("showKeyboardShortcuts", value));
  const setShowSplitTicketDialog = (value: boolean) => dispatch(ticketActions.toggleDialog("showSplitTicketDialog", value));
  const setShowMergeTicketsDialog = (value: boolean) => dispatch(ticketActions.toggleDialog("showMergeTicketsDialog", value));
  const setPreSelectedStaff = (staff: { id: string; name: string } | null) => dispatch(ticketActions.setPreSelectedStaff(staff));

  const assignedStaffIdsSet = new Set(assignedStaffIds);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-[60] transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleCloseAttempt}
      />

      <div
        className={`fixed right-0 top-0 bottom-0 bg-background border-l shadow-xl z-[70] transition-all duration-200 ease-out flex flex-col ${
          mode === "dock" ? "w-full md:w-[900px]" : "w-full"
        }`}
      >
        <div
          className="flex-1 overflow-hidden min-h-0"
          data-scroll-container
          role="main"
          aria-label="Checkout panel content"
        >
          {mode === "full" && (
            <div className="h-full flex flex-col relative">
              {/* Desktop Layout - Resizable Panels */}
              <div className="hidden lg:flex flex-1 min-h-0">
                {/* Modern Layout: Cart LEFT (resizable), Catalog RIGHT */}
                <div className="flex-1 flex pl-safe-add pr-safe-add">
                    {/* Close Button Column - Own column on far left (matching Classic) */}
                    <div className="flex-shrink-0 pr-4 pt-1">
                      <button
                        onClick={handleCloseAttempt}
                        data-testid="button-close-panel-modern"
                        className="group h-10 w-10 rounded-full bg-white hover:bg-gray-50 border border-gray-200 flex items-center justify-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                        aria-label="Close checkout panel"
                      >
                        <X className="h-5 w-5 text-gray-600 group-hover:text-gray-800 transition-colors" strokeWidth={2} />
                      </button>
                    </div>

                    {/* Main Content with Resizable Panels */}
                    <ResizablePanel
                      defaultRightWidth={400}
                      minRightWidth={320}
                      maxRightWidth={660}
                      minOppositePanelWidth={580}
                      storageKey="mango-checkout-modern-left-panel-width"
                      className="flex-1 overflow-hidden"
                      resizeLeft={true}
                    >
                      {/* Left Panel - Cart (resizable) */}
                      <div className="h-full">
                        <div className="h-full flex flex-col pr-4 bg-white">
                          {/* Header - Unified ticket/client left, actions right */}
                          <div className="flex items-center justify-between px-3 py-3 border-b border-gray-100">
                            {/* Left: Unified ticket info + client */}
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {selectedClient ? (
                                <>
                                  {/* Client Avatar - Clickable to view profile */}
                                  <button
                                    onClick={() => dispatch(ticketActions.toggleDialog("showClientProfile", true))}
                                    className="h-11 w-11 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm ring-2 ring-white hover:ring-primary/30 transition-all cursor-pointer"
                                  >
                                    <span className="text-sm font-bold text-gray-600">
                                      {selectedClient.firstName?.[0]}{selectedClient.lastName?.[0]}
                                    </span>
                                  </button>
                                  {/* Ticket + Client Info */}
                                  <div className="min-w-0 flex-1">
                                    {/* Ticket # and time */}
                                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-0.5">
                                      <span className="font-medium">#{Date.now().toString().slice(-4)}</span>
                                      <span>•</span>
                                      <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    {/* Client name + loyalty badge - clickable with dropdown */}
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <button className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left">
                                          <span className="font-semibold text-gray-900 truncate">
                                            {selectedClient.firstName} {selectedClient.lastName}
                                          </span>
                                          {selectedClient.loyaltyStatus && (
                                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${
                                              selectedClient.loyaltyStatus === 'gold'
                                                ? 'bg-amber-100 text-amber-700'
                                                : selectedClient.loyaltyStatus === 'silver'
                                                  ? 'bg-gray-200 text-gray-600'
                                                  : 'bg-orange-100 text-orange-600'
                                            }`}>
                                              {selectedClient.loyaltyStatus}
                                            </span>
                                          )}
                                          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                                        </button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="start" className="w-48">
                                        <DropdownMenuItem onClick={() => dispatch(ticketActions.toggleDialog("showClientSelector", true))}>
                                          <User className="mr-2 h-4 w-4" />
                                          Change Client
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => dispatch(ticketActions.toggleDialog("showClientProfile", true))}>
                                          <AlertCircle className="mr-2 h-4 w-4" />
                                          View Profile
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => handleRemoveClient(null)}
                                          className="text-destructive"
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Remove Client
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                    {/* Client metrics */}
                                    <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                                      <span>{selectedClient.totalVisits || 0} visits</span>
                                      <span>•</span>
                                      <span>${(selectedClient.lifetimeSpend || 0).toLocaleString()} spent</span>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                /* Prominent Add Client Button */
                                <button
                                  onClick={() => dispatch(ticketActions.toggleDialog("showClientSelector", true))}
                                  className="flex items-center gap-3 px-4 py-2.5 bg-primary/10 hover:bg-primary/15 border border-primary/20 rounded-xl transition-all group"
                                >
                                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                                    <UserPlus className="h-5 w-5 text-primary" />
                                  </div>
                                  <div className="text-left">
                                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-0.5">
                                      <span className="font-medium">#{Date.now().toString().slice(-4)}</span>
                                      <span>•</span>
                                      <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <span className="font-semibold text-primary">Add Client</span>
                                  </div>
                                </button>
                              )}
                            </div>
                            {/* Right: Action icons */}
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={handleCheckIn}
                                    disabled={services.length === 0}
                                    className="h-10 w-10 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                                  >
                                    <LogIn className="h-5 w-5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Check in client</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={handleReset}
                                    disabled={services.length === 0}
                                    className="h-10 w-10 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                                  >
                                    <RotateCcw className="h-5 w-5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Clear cart</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>

                          {/* Cart Content */}
                          <div className="flex-1 overflow-hidden">
                          <InteractiveSummary
                            selectedClient={selectedClient}
                            services={services}
                            staffMembers={staffMembers}
                            subtotal={subtotal}
                            tax={tax}
                            total={total}
                            onCheckout={handleCheckout}
                            onCheckIn={handleCheckIn}
                            onStartService={handleStartService}
                            onSelectClient={handleRemoveClient}
                            onCreateClient={handleCreateClient}
                            onUpdateService={handleUpdateService}
                            onRemoveService={handleRemoveService}
                            onRemoveStaff={handleRemoveStaff}
                            onReassignStaff={handleReassignStaff}
                            onAddServiceToStaff={handleAddServiceToStaff}
                            onAddStaff={handleAddStaff}
                            onDuplicateServices={handleDuplicateServices}
                            onRequestAddStaff={() => setFullPageTab("staff")}
                            activeStaffId={activeStaffId}
                            onSetActiveStaff={setActiveStaffId}
                            assignedStaffIds={assignedStaffIdsSet}
                            currentTab={fullPageTab}
                            layout="modern"
                            hideClientSection={true}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Panel - Catalog (flex-1) */}
                    <div className="h-full flex flex-col min-w-0 overflow-hidden">
                      {/* Main Category Tab Bar - darker background */}
                      <div className="flex-shrink-0 bg-gray-100/70 px-4 py-3">
                        {fullPageTab === "staff" ? (
                          /* Staff Selection Header - Clean design with back button */
                          <div className="flex items-center gap-4">
                            {/* Back Button - Prominent pill style */}
                            <button
                              onClick={() => setFullPageTab("services")}
                              className="flex items-center gap-2 pl-3 pr-4 py-2 text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-full shadow-sm transition-all hover:shadow"
                            >
                              <ChevronLeft className="h-4 w-4" />
                              <span>Catalog</span>
                            </button>

                            {/* Title - Centered with icon badge */}
                            <div className="flex-1 flex items-center justify-center">
                              <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full">
                                <Users className="h-4 w-4 text-primary" />
                                <span className="text-sm font-semibold text-primary">Select Staff</span>
                              </div>
                            </div>

                            {/* Right side controls */}
                            <div className="flex items-center gap-2">
                              {/* Minimize Button */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => setMode("dock")}
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
                        ) : (
                          <ItemTabBar
                            activeTab={addItemTab}
                            onTabChange={(tab) => {
                              setAddItemTab(tab);
                              setSelectedCategory("all");
                              setSearchQuery(""); // Clear search when switching tabs
                            }}
                            layout="modern"
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            onMoreClick={() => {
                              // TODO: Open menu editing modal
                              console.log("More options clicked - menu editing");
                            }}
                            rightControls={
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => setMode("dock")}
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
                        {fullPageTab === "staff" ? (
                          <StaffGridView
                            staffMembers={staffMembers}
                            services={services}
                            onAddServiceToStaff={handleAddServiceToStaff}
                            reassigningServiceIds={reassigningServiceIds}
                            selectedStaffId={activeStaffId}
                          />
                        ) : addItemTab === "services" ? (
                          <FullPageServiceSelector
                            selectedCategory={selectedCategory}
                            onSelectCategory={setSelectedCategory}
                            onAddServices={handleAddServices}
                            staffMembers={staffMembers}
                            activeStaffId={activeStaffId}
                            layout="modern"
                            externalSearchQuery={searchQuery}
                          />
                        ) : addItemTab === "products" ? (
                          <ProductGrid
                            products={getProductsByCategory(selectedCategory)}
                            onSelectProduct={(product) => {
                              handleAddServices([{
                                id: `prod-${Date.now()}`,
                                name: product.name,
                                category: product.category,
                                price: product.price,
                                duration: 0,
                              }]);
                            }}
                          />
                        ) : addItemTab === "packages" ? (
                          <PackageGrid
                            packages={getPackagesByCategory(selectedCategory)}
                            onSelectPackage={(pkg) => {
                              handleAddServices([{
                                id: `pkg-${Date.now()}`,
                                name: pkg.name,
                                category: "Package",
                                price: pkg.salePrice,
                                duration: 0,
                              }]);
                            }}
                          />
                        ) : addItemTab === "giftcards" ? (
                          <GiftCardGrid
                            giftCards={getGiftCardsByDesign(selectedCategory)}
                            onSelectGiftCard={(gc) => {
                              handleAddServices([{
                                id: `gc-${Date.now()}`,
                                name: gc.name,
                                category: "Gift Card",
                                price: gc.value,
                                duration: 0,
                              }]);
                            }}
                          />
                        ) : null}
                      </div>
                    </div>
                  </ResizablePanel>
                </div>
              </div>

              {/* Mobile Layout - Full screen ticket view */}
              <div className="flex-1 flex flex-col min-h-0 lg:hidden">
                {/* Mobile Ticket Summary - scrollable */}
                <div className="flex-1 overflow-y-auto pl-safe-add-sm pr-safe-add-sm pb-4">
                  <InteractiveSummary
                    selectedClient={selectedClient}
                    services={services}
                    staffMembers={staffMembers}
                    subtotal={subtotal}
                    tax={tax}
                    total={total}
                    onCheckout={handleCheckout}
                    onCheckIn={handleCheckIn}
                    onStartService={handleStartService}
                    onSelectClient={handleRemoveClient}
                    onCreateClient={handleCreateClient}
                    onUpdateService={handleUpdateService}
                    onRemoveService={handleRemoveService}
                    onRemoveStaff={handleRemoveStaff}
                    onReassignStaff={handleReassignStaff}
                    onAddServiceToStaff={handleAddServiceToStaff}
                    onAddStaff={handleAddStaff}
                    onDuplicateServices={handleDuplicateServices}
                    onRequestAddStaff={() => setShowStaffOnMobile(true)}
                    activeStaffId={activeStaffId}
                    onSetActiveStaff={setActiveStaffId}
                    assignedStaffIds={assignedStaffIdsSet}
                    currentTab={fullPageTab}
                  />
                </div>

                {/* Mobile Fixed Bottom Action Bar */}
                <div className="flex-shrink-0 border-t bg-background pl-safe-add-sm pr-safe-add-sm py-3 pb-safe">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 h-12 justify-center gap-2 text-sm font-medium"
                      onClick={() => setShowServicesOnMobile(true)}
                      data-testid="button-add-item-full"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Item</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 h-12 justify-center gap-2 text-sm font-medium"
                      onClick={() => setShowStaffOnMobile(true)}
                      data-testid="button-add-staff-full"
                    >
                      <User className="h-4 w-4" />
                      <span>Add Staff</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dock Mode - Modern layout matching full mode */}
          {mode === "dock" && (
            <div className="h-full flex flex-col">
              {/* Desktop Layout - Modern Design (Dock Mode): Cart LEFT, Catalog RIGHT */}
              <div className="hidden lg:flex flex-1 min-h-0 px-2">
                {/* Close Button Column - Own column on far left (matching Full Page) */}
                <div className="flex-shrink-0 pr-3 pt-3">
                  <button
                    onClick={handleCloseAttempt}
                    data-testid="button-close-panel-dock"
                    className="group h-10 w-10 rounded-full bg-white hover:bg-gray-50 border border-gray-200 flex items-center justify-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                    aria-label="Close checkout panel"
                  >
                    <X className="h-5 w-5 text-gray-600 group-hover:text-gray-800 transition-colors" strokeWidth={2} />
                  </button>
                </div>

                {/* Main Content with Resizable Panels */}
                <ResizablePanel
                  defaultRightWidth={380}
                  minRightWidth={300}
                  maxRightWidth={480}
                  minOppositePanelWidth={350}
                  storageKey="mango-checkout-dock-modern-left-panel-width"
                  className="flex-1 overflow-hidden"
                  resizeLeft={true}
                >
                  {/* Left Panel - Cart (resizable) */}
                  <div className="h-full">
                    <div className="h-full flex flex-col pr-2 bg-white">
                      {/* Header - Ticket info left, actions right */}
                      <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-100">
                        {/* Left: Ticket # and time */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500">#T-{Date.now().toString().slice(-6)}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-400">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {/* Right: Check In + Reset */}
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={handleCheckIn}
                                disabled={services.length === 0}
                                className="h-7 px-2 rounded-md text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                              >
                                <LogIn className="h-3.5 w-3.5" />
                                <span>Check In</span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent><p className="text-xs">Check in client</p></TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={handleReset}
                                disabled={services.length === 0}
                                className="h-7 w-7 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent><p className="text-xs">Reset ticket</p></TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                      {/* Cart Content */}
                      <div className="flex-1 overflow-hidden">
                        <InteractiveSummary
                          selectedClient={selectedClient}
                          services={services}
                          staffMembers={staffMembers}
                          subtotal={subtotal}
                          tax={tax}
                          total={total}
                          onCheckout={handleCheckout}
                          onCheckIn={handleCheckIn}
                          onStartService={handleStartService}
                          onSelectClient={handleRemoveClient}
                          onCreateClient={handleCreateClient}
                          onUpdateService={handleUpdateService}
                          onRemoveService={handleRemoveService}
                          onRemoveStaff={handleRemoveStaff}
                          onReassignStaff={handleReassignStaff}
                          onAddServiceToStaff={handleAddServiceToStaff}
                          onAddStaff={handleAddStaff}
                          onDuplicateServices={handleDuplicateServices}
                          onRequestAddStaff={() => setFullPageTab("staff")}
                          activeStaffId={activeStaffId}
                          onSetActiveStaff={setActiveStaffId}
                          assignedStaffIds={assignedStaffIdsSet}
                          currentTab={fullPageTab}
                          layout="modern"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Panel - Catalog (flex-1) */}
                  <div className="h-full flex flex-col min-w-0 overflow-hidden">
                    {/* Header with controls and tabs - same background */}
                    <div className="flex-shrink-0 bg-gray-100/70 px-3 pt-2 pb-1">
                      {fullPageTab === "staff" ? (
                        /* Staff Selection Header - Clean design with back button */
                        <div className="flex items-center gap-3 py-1.5">
                          {/* Back Button - Prominent pill style */}
                          <button
                            onClick={() => setFullPageTab("services")}
                            className="flex items-center gap-1.5 pl-2 pr-3 py-1.5 text-xs font-medium bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-full shadow-sm transition-all hover:shadow"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            <span>Catalog</span>
                          </button>

                          {/* Title - Centered with icon */}
                          <div className="flex-1 flex items-center justify-center gap-2">
                            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
                              <Users className="h-3.5 w-3.5 text-primary" />
                              <span className="text-xs font-semibold text-primary">Select Staff</span>
                            </div>
                          </div>

                          {/* Spacer to balance the back button */}
                          <div className="w-[72px]" />
                        </div>
                      ) : (
                        <>
                          {/* Top Row: Controls (right-aligned) */}
                          <div className="flex items-center justify-end gap-1.5 mb-2">
                            {/* Search Icon */}
                            <button
                              onClick={() => console.log("Search clicked")}
                              className="h-7 w-7 rounded-full bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                              aria-label="Search"
                            >
                              <Search className="h-3.5 w-3.5 text-gray-500" />
                            </button>

                            {/* More Options */}
                            <button
                              onClick={() => console.log("More options clicked")}
                              className="h-7 w-7 rounded-full bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                              aria-label="More options"
                            >
                              <MoreVertical className="h-3.5 w-3.5 text-gray-500" />
                            </button>

                            {/* Expand Button */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => setMode("full")}
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
                                  onClick={() => {
                                    setAddItemTab(tab.id);
                                    setSelectedCategory("all");
                                    setSearchQuery("");
                                  }}
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
                      {fullPageTab === "staff" ? (
                        <StaffGridView
                          staffMembers={staffMembers}
                          services={services}
                          onAddServiceToStaff={handleAddServiceToStaff}
                          reassigningServiceIds={reassigningServiceIds}
                          selectedStaffId={activeStaffId}
                          compactMode={true}
                        />
                      ) : addItemTab === "services" ? (
                        <FullPageServiceSelector
                          selectedCategory={selectedCategory}
                          onSelectCategory={setSelectedCategory}
                          onAddServices={handleAddServices}
                          staffMembers={staffMembers}
                          activeStaffId={activeStaffId}
                          layout="modern"
                          searchQuery={searchQuery}
                          compactMode={true}
                        />
                      ) : addItemTab === "products" ? (
                        <ProductGrid
                          products={getProductsByCategory(selectedCategory)}
                          onSelectProduct={(product) => {
                            handleAddServices([{
                              id: `prod-${Date.now()}`,
                              name: product.name,
                              category: product.category,
                              price: product.price,
                              duration: 0,
                            }]);
                          }}
                        />
                      ) : addItemTab === "packages" ? (
                        <PackageGrid
                          packages={getPackagesByCategory(selectedCategory)}
                          onSelectPackage={(pkg) => {
                            handleAddServices([{
                              id: `pkg-${Date.now()}`,
                              name: pkg.name,
                              category: "Package",
                              price: pkg.salePrice,
                              duration: 0,
                            }]);
                          }}
                        />
                      ) : addItemTab === "giftcards" ? (
                        <GiftCardGrid
                          giftCards={getGiftCardsByDesign(selectedCategory)}
                          onSelectGiftCard={(gc) => {
                            handleAddServices([{
                              id: `gc-${Date.now()}`,
                              name: gc.name,
                              category: "Gift Card",
                              price: gc.value,
                              duration: 0,
                            }]);
                          }}
                        />
                      ) : null}
                    </div>
                  </div>
                </ResizablePanel>
              </div>

              {/* Mobile Layout - Full screen ticket view (Dock Mode) */}
              <div className="flex-1 flex flex-col min-h-0 lg:hidden pt-14">
                {/* Mobile Ticket Summary - scrollable */}
                <div className="flex-1 overflow-y-auto px-3 pb-4">
                  <InteractiveSummary
                    selectedClient={selectedClient}
                    services={services}
                    staffMembers={staffMembers}
                    subtotal={subtotal}
                    tax={tax}
                    total={total}
                    onCheckout={handleCheckout}
                    onCheckIn={handleCheckIn}
                    onStartService={handleStartService}
                    onSelectClient={handleRemoveClient}
                    onCreateClient={handleCreateClient}
                    onUpdateService={handleUpdateService}
                    onRemoveService={handleRemoveService}
                    onRemoveStaff={handleRemoveStaff}
                    onReassignStaff={handleReassignStaff}
                    onAddServiceToStaff={handleAddServiceToStaff}
                    onAddStaff={handleAddStaff}
                    onDuplicateServices={handleDuplicateServices}
                    onRequestAddStaff={() => setShowStaffOnMobile(true)}
                    activeStaffId={activeStaffId}
                    onSetActiveStaff={setActiveStaffId}
                    assignedStaffIds={assignedStaffIdsSet}
                    currentTab={fullPageTab}
                  />
                </div>

                {/* Mobile Fixed Bottom Action Bar */}
                <div className="flex-shrink-0 border-t bg-background pl-safe-add-sm pr-safe-add-sm py-3 pb-safe">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 h-12 justify-center gap-2 text-sm font-medium"
                      onClick={() => setShowServicesOnMobile(true)}
                      data-testid="button-add-item"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Item</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 h-12 justify-center gap-2 text-sm font-medium"
                      onClick={() => setShowStaffOnMobile(true)}
                      data-testid="button-add-staff"
                    >
                      <User className="h-4 w-4" />
                      <span>Add Staff</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      <PaymentModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        total={total}
        onComplete={handleCompletePayment}
        staffMembers={staffMembers
          .filter((s) => staffServiceTotals[s.id] > 0) // Only staff who worked on this ticket
          .map((s) => ({
            id: s.id,
            name: s.name,
            serviceTotal: staffServiceTotals[s.id],
          }))}
        ticketId={ticketId || undefined} // Bug #8 fix: Pass actual ticket ID
      />

      <Dialog open={showServicesOnMobile} onOpenChange={(open) => {
        setShowServicesOnMobile(open);
        if (!open) {
          setPreSelectedStaff(null);
          setAddItemTab("services");
        }
      }}>
        <DialogContent className="max-w-full h-full w-full p-0 gap-0 flex flex-col lg:hidden">
          {/* Clean Header */}
          <DialogHeader className="flex-shrink-0 px-4 pt-4 pb-3 border-b">
            <DialogTitle className="text-lg font-semibold">
              {preSelectedStaff
                ? `Add to ${preSelectedStaff.name}`
                : activeStaffId && staffMembers.find(s => s.id === activeStaffId)
                  ? `Add to ${staffMembers.find(s => s.id === activeStaffId)?.name}`
                  : "Add Items"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {preSelectedStaff || (activeStaffId && staffMembers.find(s => s.id === activeStaffId))
                ? "Items will be auto-assigned"
                : "Select items to add to the ticket"}
            </DialogDescription>
          </DialogHeader>

          {/* Simple Tab Navigation */}
          <Tabs value={addItemTab} onValueChange={(v) => setAddItemTab(v as typeof addItemTab)} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b">
              <TabsList className="w-full h-10 p-1 grid grid-cols-4">
                <TabsTrigger value="services" className="text-sm" data-testid="tab-services">
                  Services
                </TabsTrigger>
                <TabsTrigger value="products" className="text-sm" data-testid="tab-products">
                  Products
                </TabsTrigger>
                <TabsTrigger value="packages" className="text-sm" data-testid="tab-packages">
                  Packages
                </TabsTrigger>
                <TabsTrigger value="giftcards" className="text-sm" data-testid="tab-giftcards">
                  Gift Cards
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="services" className="flex-1 overflow-hidden px-4 pb-4 mt-0 min-h-0">
              <ServiceGrid onAddServices={handleAddServices} staffMembers={staffMembers} />
            </TabsContent>
            <TabsContent value="products" className="flex-1 overflow-auto px-4 pb-4 mt-0">
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: "prod-1", name: "Professional Shampoo", size: "16oz", price: 28.00, category: "Hair Care" },
                  { id: "prod-2", name: "Deep Conditioner", size: "12oz", price: 32.00, category: "Hair Care" },
                  { id: "prod-3", name: "Styling Gel", size: "8oz", price: 18.00, category: "Styling" },
                  { id: "prod-4", name: "Heat Protectant Spray", size: "", price: 24.00, category: "Styling" },
                  { id: "prod-5", name: "Hair Oil Treatment", size: "", price: 45.00, category: "Treatments" },
                  { id: "prod-6", name: "Leave-In Conditioner", size: "", price: 26.00, category: "Hair Care" },
                ].map((product) => (
                  <Card
                    key={product.id}
                    className="p-3.5 cursor-pointer"
                    onClick={() => {
                      handleAddProducts([{
                        productId: product.id,
                        name: product.name + (product.size ? ` ${product.size}` : ''),
                        price: product.price,
                        quantity: 1,
                      }]);
                      setShowServicesOnMobile(false);
                    }}
                    data-testid={`card-product-${product.id}`}
                  >
                    <h4 className="font-medium text-sm mb-1">{product.name}</h4>
                    {product.size && <p className="text-xs text-muted-foreground">{product.size}</p>}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">{product.category}</span>
                      <span className="font-semibold">${product.price.toFixed(2)}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="packages" className="flex-1 overflow-auto px-4 pb-4 mt-0">
              <div className="space-y-2.5">
                {[
                  { id: "pkg-1", name: "Luxury Spa Day", description: "Massage, facial, and manicure", price: 160, services: [{ serviceId: "massage", serviceName: "Full Body Massage", originalPrice: 80, duration: 60 }, { serviceId: "facial", serviceName: "Facial", originalPrice: 60, duration: 45 }, { serviceId: "manicure", serviceName: "Manicure", originalPrice: 40, duration: 30 }] },
                  { id: "pkg-2", name: "Bridal Package", description: "Hair, makeup, and nails", price: 300, services: [{ serviceId: "bridal-hair", serviceName: "Bridal Hair", originalPrice: 150, duration: 90 }, { serviceId: "bridal-makeup", serviceName: "Bridal Makeup", originalPrice: 120, duration: 60 }, { serviceId: "bridal-nails", serviceName: "Bridal Nails", originalPrice: 80, duration: 45 }] },
                  { id: "pkg-3", name: "Men's Grooming", description: "Haircut, beard trim, and facial", price: 65, services: [{ serviceId: "mens-haircut", serviceName: "Men's Haircut", originalPrice: 35, duration: 30 }, { serviceId: "beard-trim", serviceName: "Beard Trim", originalPrice: 20, duration: 15 }, { serviceId: "mens-facial", serviceName: "Men's Facial", originalPrice: 30, duration: 30 }] },
                  { id: "pkg-4", name: "Color & Style", description: "Full color with cut and style", price: 175, services: [{ serviceId: "color-full", serviceName: "Full Color", originalPrice: 120, duration: 90 }, { serviceId: "haircut", serviceName: "Haircut", originalPrice: 45, duration: 30 }, { serviceId: "blowout", serviceName: "Blowout Style", originalPrice: 60, duration: 30 }] },
                ].map((pkg) => (
                  <Card
                    key={pkg.id}
                    className="p-4 cursor-pointer"
                    onClick={() => {
                      const packageData = {
                        id: pkg.id,
                        name: pkg.name,
                        description: pkg.description,
                        services: pkg.services,
                        packagePrice: pkg.price,
                        validDays: 30,
                        category: "Packages",
                      };
                      const targetStaffId = activeStaffId || (staffMembers.length > 0 ? staffMembers[0].id : "unassigned");
                      handleAddPackage(packageData, targetStaffId);
                      setShowServicesOnMobile(false);
                    }}
                    data-testid={`card-package-${pkg.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{pkg.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{pkg.description}</p>
                      </div>
                      <span className="font-semibold ml-3">${pkg.price}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="giftcards" className="flex-1 overflow-auto px-4 pb-4 mt-0">
              <p className="text-sm text-muted-foreground mb-4">Select a gift card amount</p>
              <div className="grid grid-cols-2 gap-2.5">
                {[25, 50, 100, 200].map((amount) => (
                  <Card
                    key={amount}
                    className="p-4 cursor-pointer text-center"
                    onClick={() => {
                      const giftCardService: TicketService = {
                        id: Math.random().toString(),
                        serviceId: "gift-card",
                        serviceName: `Gift Card ($${amount})`,
                        price: amount,
                        duration: 0,
                        status: "completed",
                      };
                      dispatch(ticketActions.addService([giftCardService]));
                      toast({
                        title: "Gift Card Added",
                        description: `$${amount} gift card added to ticket`,
                      });
                      setShowServicesOnMobile(false);
                    }}
                    data-testid={`button-add-gift-card-${amount}`}
                  >
                    <div className="font-semibold text-lg">${amount}</div>
                    <p className="text-xs text-muted-foreground">Gift Card</p>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={showStaffOnMobile} onOpenChange={setShowStaffOnMobile}>
        <DialogContent className="max-w-full h-full w-full p-0 gap-0 flex flex-col lg:hidden">
          <DialogHeader className="flex-shrink-0 px-4 py-3 border-b">
            <DialogTitle className="text-lg">Select Staff Member</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Add a staff member to the ticket
            </p>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4">
            {staffMembers.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-sm text-muted-foreground">No staff members available</p>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {staffMembers.map((staff) => {
                  const isAssigned = assignedStaffIds.includes(staff.id);
                  const serviceCount = services.filter(s => s.staffId === staff.id).length;
                  
                  return (
                    <Card
                      key={staff.id}
                      className={`p-4 hover-elevate active-elevate-2 cursor-pointer transition-all ${
                        isAssigned ? 'border-primary' : ''
                      }`}
                      onClick={() => {
                        handleAddStaff(staff.id, staff.name);
                        setShowStaffOnMobile(false);
                        setPreSelectedStaff({ id: staff.id, name: staff.name });
                        setTimeout(() => setShowServicesOnMobile(true), 150);
                      }}
                      data-testid={`card-staff-select-${staff.id}`}
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-lg font-semibold text-primary">
                            {staff.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                          </span>
                        </div>
                        <div className="text-center">
                          <h4 className="font-semibold text-sm">{staff.name}</h4>
                          {isAssigned && (
                            <Badge variant="secondary" className="mt-1.5 text-xs">
                              {serviceCount} service{serviceCount !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Exit Confirmation Dialog - 4 Options */}
      <Dialog open={showDiscardTicketConfirm} onOpenChange={setShowDiscardTicketConfirm}>
        <DialogContent className="max-w-md z-[100]" data-testid="dialog-exit-confirmation">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Save Ticket?
            </DialogTitle>
            <DialogDescription>
              {selectedClient && `Client: ${selectedClient.firstName} ${selectedClient.lastName}. `}
              {services.length > 0 && `${services.length} service(s) added. `}
              What would you like to do with this ticket?
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-4">
            {/* Check In - Add to Waitlist */}
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-300"
              onClick={handleCheckIn}
              data-testid="button-checkin"
            >
              <Clock className="h-6 w-6 text-blue-600" />
              <span className="font-medium">Check In</span>
              <span className="text-xs text-muted-foreground">Add to Waitlist</span>
            </Button>

            {/* Start Service - Add to In Service */}
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-green-50 hover:border-green-300"
              onClick={handleStartService}
              data-testid="button-start-service"
            >
              <Play className="h-6 w-6 text-green-600" />
              <span className="font-medium">Start Service</span>
              <span className="text-xs text-muted-foreground">Begin immediately</span>
            </Button>

            {/* Save to Pending - Add to Pending (awaiting payment) */}
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-orange-50 hover:border-orange-300"
              onClick={handleSaveToPending}
              data-testid="button-save-pending"
            >
              <CreditCard className="h-6 w-6 text-orange-600" />
              <span className="font-medium">Save to Pending</span>
              <span className="text-xs text-muted-foreground">Ready for payment</span>
            </Button>

            {/* Disregard - Close without saving */}
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-red-50 hover:border-red-300"
              onClick={handleDisregard}
              data-testid="button-disregard"
            >
              <Trash2 className="h-6 w-6 text-red-600" />
              <span className="font-medium">Disregard</span>
              <span className="text-xs text-muted-foreground">Don't save</span>
            </Button>
          </div>

          <div className="flex justify-end">
            <Button
              variant="ghost"
              onClick={() => setShowDiscardTicketConfirm(false)}
              data-testid="button-cancel-exit"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showKeyboardShortcuts} onOpenChange={setShowKeyboardShortcuts}>
        <DialogContent className="max-w-2xl" data-testid="dialog-keyboard-shortcuts">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Keyboard Shortcuts
            </DialogTitle>
            <DialogDescription>
              Use these shortcuts to navigate faster
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div>
              <h3 className="text-sm font-semibold mb-3">General</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Show keyboard shortcuts</span>
                  <Badge variant="outline" className="font-mono">?</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Close modal/panel</span>
                  <Badge variant="outline" className="font-mono">Esc</Badge>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-semibold mb-3">Navigation</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Quick service search</span>
                  <Badge variant="outline" className="font-mono">⌘ K / Ctrl K</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Focus client search</span>
                  <Badge variant="outline" className="font-mono">⌘ F / Ctrl F</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Navigate between elements</span>
                  <Badge variant="outline" className="font-mono">Tab</Badge>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-semibold mb-3">Actions</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Proceed to checkout</span>
                  <Badge variant="outline" className="font-mono">⌘ Enter / Ctrl Enter</Badge>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showRemoveClientConfirm} onOpenChange={setShowRemoveClientConfirm}>
        <AlertDialogContent data-testid="dialog-remove-client">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Remove Client?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This ticket has {services.length} service(s). Are you sure you want to remove the client? The services will remain but will be unassigned from the client.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-remove-client">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveClient}
              data-testid="button-confirm-remove-client"
            >
              Remove Client
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showPreventStaffRemoval} onOpenChange={setShowPreventStaffRemoval}>
        <AlertDialogContent data-testid="dialog-prevent-staff-removal">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Cannot Remove Staff
            </AlertDialogTitle>
            <AlertDialogDescription>
              {preventStaffRemovalMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => setShowPreventStaffRemoval(false)}
              data-testid="button-ok-prevent-staff-removal"
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SplitTicketDialog
        open={showSplitTicketDialog}
        onClose={() => setShowSplitTicketDialog(false)}
        services={services}
        client={selectedClient}
        subtotal={subtotal}
        tax={tax}
        discount={discount}
        onSplit={handleSplitTicket}
      />

      <MergeTicketsDialog
        open={showMergeTicketsDialog}
        onClose={() => setShowMergeTicketsDialog(false)}
        currentTicket={{
          client: selectedClient,
          services: services,
          subtotal: subtotal,
          tax: tax,
          discount: discount,
          total: total,
        }}
        openTickets={MOCK_OPEN_TICKETS}
        onMerge={handleMergeTickets}
      />

      {/* Conditionally render to prevent useCheckoutPackages hook from running before storeId is available */}
      {showServicePackages && (
        <ServicePackages
          open={showServicePackages}
          onOpenChange={setShowServicePackages}
          staffMembers={staffMembers}
          onSelectPackage={handleAddPackage}
        />
      )}

      {/* Conditionally render to prevent useCheckoutProducts hook from running before storeId is available */}
      {showProductSales && (
        <ProductSales
          open={showProductSales}
          onOpenChange={setShowProductSales}
          onAddProducts={handleAddProducts}
        />
      )}

      {selectedClient && (
        <PurchaseHistory
          client={selectedClient}
          open={showPurchaseHistory}
          onOpenChange={setShowPurchaseHistory}
          onRepeatPurchase={handleRepeatPurchase}
        />
      )}

      <ReceiptPreview
        open={showReceiptPreview}
        onOpenChange={setShowReceiptPreview}
        services={services.map((s) => ({
          id: s.id,
          name: s.serviceName,
          price: s.price,
          staffName: s.staffId
            ? staffMembers.find((staff) => staff.id === s.staffId)?.name
            : undefined,
        }))}
        client={selectedClient}
        subtotal={subtotal}
        discount={discount}
        tax={tax}
        total={total}
        pointsRedeemed={redeemedPoints}
        pointsDiscount={appliedPointsDiscount}
        couponCode={appliedCoupon?.code}
        couponDiscount={couponDiscount}
        giftCardPayments={appliedGiftCards.map((gc) => ({
          code: gc.code,
          amount: gc.amountUsed,
        }))}
      />

      <RefundVoidDialog
        open={showRefundVoid}
        onOpenChange={setShowRefundVoid}
        services={services.map((s) => ({
          id: s.id,
          name: s.serviceName,
          price: s.price,
        }))}
        total={total}
        onRefund={handleRefund}
        onVoid={handleVoid}
      />

      {/* Client Selector Sheet - Slides from right */}
      <Sheet
        open={showClientSelector}
        onOpenChange={(open) => dispatch(ticketActions.toggleDialog("showClientSelector", open))}
      >
        <SheetContent side="right" className="w-full sm:max-w-md p-0">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle>Select Client</SheetTitle>
            <SheetDescription>
              Search for an existing client or create a new one
            </SheetDescription>
          </SheetHeader>
          <div className="px-6 py-4 overflow-y-auto h-[calc(100vh-120px)]">
            <ClientSelector
              selectedClient={null}
              onSelectClient={(client) => {
                if (client) {
                  dispatch(ticketActions.setClient(client));
                }
                dispatch(ticketActions.toggleDialog("showClientSelector", false));
              }}
              onCreateClient={(newClient) => {
                handleCreateClient(newClient);
                dispatch(ticketActions.toggleDialog("showClientSelector", false));
              }}
              inDialog={true}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Client Profile Dialog - Full Comprehensive Profile */}
      <Dialog
        open={showClientProfile}
        onOpenChange={(open) => dispatch(ticketActions.toggleDialog("showClientProfile", open))}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedClient && (
            <>
              <DialogHeader className="border-b pb-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">
                      {selectedClient.firstName?.[0]}{selectedClient.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <DialogTitle className="text-2xl">
                      {selectedClient.firstName} {selectedClient.lastName}
                    </DialogTitle>
                    {selectedClient.loyaltyStatus && (
                      <Badge className={`mt-1 ${
                        selectedClient.loyaltyStatus === 'gold'
                          ? 'bg-amber-100 text-amber-700'
                          : selectedClient.loyaltyStatus === 'silver'
                            ? 'bg-gray-200 text-gray-600'
                            : 'bg-orange-100 text-orange-600'
                      }`}>
                        {selectedClient.loyaltyStatus.toUpperCase()} Member
                      </Badge>
                    )}
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Contact Information */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Card className="p-3 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <Phone className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-medium">{selectedClient.phone}</p>
                      </div>
                    </Card>
                    {selectedClient.email && (
                      <Card className="p-3 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <Mail className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="font-medium">{selectedClient.email}</p>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>

                {/* Statistics */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Statistics</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <Card className="p-4 text-center">
                      <p className="text-2xl font-bold text-primary">{selectedClient.totalVisits || 0}</p>
                      <p className="text-xs text-muted-foreground mt-1">Total Visits</p>
                    </Card>
                    <Card className="p-4 text-center">
                      <p className="text-2xl font-bold text-primary">${(selectedClient.lifetimeSpend || 0).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-1">Lifetime Spend</p>
                    </Card>
                    <Card className="p-4 text-center">
                      <p className="text-2xl font-bold text-primary">{selectedClient.rewardPoints || 0}</p>
                      <p className="text-xs text-muted-foreground mt-1">Reward Points</p>
                    </Card>
                  </div>
                </div>

                {/* Health & Preferences - Only show if allergies or notes exist */}
                {(selectedClient.allergies?.length || selectedClient.notes) && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Health & Preferences</h3>
                    <div className="space-y-3">
                      {selectedClient.allergies && selectedClient.allergies.length > 0 && (
                        <Card className="p-3 bg-destructive/5 border-destructive/20">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-destructive">Allergies</p>
                              <p className="text-sm text-destructive/80 mt-0.5">
                                {selectedClient.allergies.join(", ")}
                              </p>
                            </div>
                          </div>
                        </Card>
                      )}
                      {selectedClient.notes && (
                        <Card className="p-3">
                          <p className="text-xs text-muted-foreground mb-1">Notes</p>
                          <p className="text-sm">{selectedClient.notes}</p>
                        </Card>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <Separator />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => dispatch(ticketActions.toggleDialog("showClientProfile", false))}
                  >
                    Close
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      dispatch(ticketActions.toggleDialog("showClientProfile", false));
                      dispatch(ticketActions.toggleDialog("showClientSelector", true));
                    }}
                  >
                    Change Client
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
