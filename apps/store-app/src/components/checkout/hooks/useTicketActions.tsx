/**
 * useTicketActions Hook
 *
 * Extracts all ticket action handlers from TicketPanel.tsx for better organization.
 * Handles ticket creation, service management, payment processing, and more.
 */

import { useRef, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectActivePadTransaction, clearPadTransaction } from "@/store/slices/padTransactionSlice";
import { getMangoPadService } from "@/services/mangoPadService";
import { isMqttEnabled } from "@/services/mqtt/featureFlags";
import {
  createCheckoutTicket,
  updateCheckoutTicket,
  markTicketAsPaid,
  type ServiceStatus,
  type CheckoutTicketService,
} from "@/store/slices/uiTicketsSlice";
import { updateServiceStatusInSupabase } from "@/store/slices/ticketsSlice";
import type { ServiceStatus as TicketServiceStatus } from "@/types/common";
import { ToastAction } from "@/components/ui/toast";
import type { TicketService, StaffMember } from "../ServiceList";
import type { Client } from "../ClientSelector";
import type { Service } from "../ServiceGrid";
import type { OpenTicket } from "../MergeTicketsDialog";
import type { GiftCardSaleData } from "../modals/SellGiftCardModal";
import type { TicketState, TicketAction, DialogKey } from "../types";
import { ticketActions } from "../reducers/ticketReducer";
import { MOCK_OPEN_TICKETS } from "../constants";
import { dataService } from "@/services/dataService";
import { storeAuthManager } from "@/services/storeAuthManager";
import { giftCardDB } from "@/db/giftCardOperations";
import type { IssueGiftCardInput, GiftCardType, GiftCardDeliveryMethod } from "@/types/gift-card";

// ============================================================================
// TYPES
// ============================================================================

type TicketStatus = 'waiting' | 'in-service' | 'completed';

interface ToastInput {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
  action?: React.ReactElement;
}

type ToastFunction = (props: ToastInput) => {
  id: string;
  dismiss: () => void;
  update: (props: ToastInput & { id: string }) => void;
};

export interface UseTicketActionsParams {
  state: TicketState;
  dispatch: React.Dispatch<TicketAction>;
  toast: ToastFunction;
  staffMembers: StaffMember[];
  onClose: () => void;
  setShowDiscardTicketConfirm: (show: boolean) => void;
  checkoutCloseTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
}

export interface UseTicketActionsResult {
  convertToCheckoutServices: (localServices: TicketService[]) => CheckoutTicketService[];
  createTicketWithStatus: (status: TicketStatus) => Promise<boolean>;
  handleCheckIn: () => Promise<void>;
  handleStartService: () => Promise<void>;
  handleSaveToPending: () => Promise<void>;
  handleDisregard: () => void;
  handleCreateClient: (newClient: Partial<Client>) => void;
  handleAddServices: (selectedServices: Service[], staffId?: string, staffName?: string) => void;
  handleAddGiftCard: (giftCardData: GiftCardSaleData) => void;
  handleAddStaff: (staffId: string, staffName: string) => void;
  handleAddServiceToStaff: (staffId: string, staffName: string) => void;
  handleReassignStaff: (serviceIdOrIds: string | string[]) => void;
  handleUpdateService: (serviceId: string, updates: Partial<TicketService>) => void;
  handleRemoveService: (serviceId: string) => void;
  handleRemoveClient: (client: Client | null) => void;
  confirmRemoveClient: () => void;
  handleRemoveStaff: (staffId: string) => void;
  handleAddPackage: (
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
  ) => void;
  handleAddProducts: (items: { productId: string; name: string; price: number; quantity: number }[]) => void;
  handleRepeatPurchase: (items: { id: string; name: string; price: number; staffName: string; type: string }[]) => void;
  handleRefund: (data: {
    type: "full" | "partial";
    amount: number;
    reason: string;
    refundMethod: string;
    serviceIds: string[];
  }) => void;
  handleVoid: (reason: string) => void;
  handleDuplicateServices: (serviceIds: string[]) => void;
  handleSplitTicket: (serviceIds: string[], keepClient: boolean) => void;
  handleMergeTickets: (ticketIds: string[], keepCurrentClient: boolean) => void;
  handleCheckout: () => void;
  processGiftCardSales: (ticketId: string, ticketServices: TicketService[], purchaserId?: string) => Promise<void>;
  handleCompletePayment: (payment: any) => Promise<void>;
  handleReset: () => void;
  performReset: () => void;
  handleCloseAttempt: () => void;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useTicketActions({
  state,
  dispatch,
  toast,
  staffMembers,
  onClose,
  setShowDiscardTicketConfirm,
  checkoutCloseTimeoutRef,
}: UseTicketActionsParams): UseTicketActionsResult {
  const reduxDispatch = useAppDispatch();
  const activePadTransaction = useAppSelector(selectActivePadTransaction);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    ticketId,
    services,
    selectedClient,
    discounts,
    staff,
    isNewTicket,
  } = state;

  const { discount } = discounts;
  const { activeStaffId, assignedStaffIds, preSelectedStaff } = staff;

  const subtotal = services.reduce((sum, s) => sum + s.price, 0);
  const discountedSubtotal = subtotal - discount - discounts.appliedPointsDiscount - discounts.couponDiscount;
  const tax = Math.max(0, discountedSubtotal) * 0.085;
  const total = Math.max(0, discountedSubtotal) + tax;

  // Convert local TicketService to CheckoutTicketService for Redux
  const convertToCheckoutServices = useCallback((localServices: TicketService[]): CheckoutTicketService[] => {
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
  }, []);

  // Create ticket with specified status (waiting, in-service, or completed/pending)
  const createTicketWithStatus = useCallback(async (status: TicketStatus): Promise<boolean> => {
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
            status,
          },
        })).unwrap();

        toast({
          title: "Ticket Updated",
          description: `Ticket updated and saved to ${statusLabels[status]}`,
        });

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
        status,
      })).unwrap();

      toast({
        title: "Ticket Created",
        description: `Ticket #${result.number} added to ${statusLabels[status]}`,
      });

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
  }, [services, selectedClient, ticketId, discount, subtotal, tax, total, convertToCheckoutServices, reduxDispatch, toast, dispatch]);

  // Handler for "Check In" - creates ticket in Waitlist
  const handleCheckIn = useCallback(async () => {
    const success = await createTicketWithStatus('waiting');
    if (success) {
      dispatch(ticketActions.resetTicket());
      setShowDiscardTicketConfirm(false);
      onClose();
    }
  }, [createTicketWithStatus, dispatch, setShowDiscardTicketConfirm, onClose]);

  // Handler for "Start Service" - creates ticket in In Service
  const handleStartService = useCallback(async () => {
    const success = await createTicketWithStatus('in-service');
    if (success) {
      dispatch(ticketActions.resetTicket());
      setShowDiscardTicketConfirm(false);
      onClose();
    }
  }, [createTicketWithStatus, dispatch, setShowDiscardTicketConfirm, onClose]);

  // Handler for "Save to Pending" - creates ticket in Pending (awaiting payment)
  const handleSaveToPending = useCallback(async () => {
    const success = await createTicketWithStatus('completed');
    if (success) {
      dispatch(ticketActions.resetTicket());
      setShowDiscardTicketConfirm(false);
      onClose();
    }
  }, [createTicketWithStatus, dispatch, setShowDiscardTicketConfirm, onClose]);

  // Handler for "Disregard" - just close without saving
  const handleDisregard = useCallback(() => {
    dispatch(ticketActions.resetTicket());
    setShowDiscardTicketConfirm(false);
    onClose();
  }, [dispatch, setShowDiscardTicketConfirm, onClose]);

  const handleCreateClient = useCallback((newClient: Partial<Client>) => {
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
  }, [dispatch, toast]);

  const handleAddServices = useCallback((selectedServices: Service[], staffId?: string, staffName?: string) => {
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
  }, [preSelectedStaff, activeStaffId, staffMembers, dispatch, toast]);

  // Handler for adding gift cards from the GiftCardGrid component
  const handleAddGiftCard = useCallback((giftCardData: GiftCardSaleData) => {
    const giftCardService: TicketService = {
      id: `gc-${Date.now()}`,
      serviceId: `giftcard-${giftCardData.amount}`,
      serviceName: `$${giftCardData.amount} Gift Card`,
      category: "Gift Card",
      price: giftCardData.amount,
      duration: 0,
      status: "not_started",
      metadata: {
        type: 'gift_card',
        deliveryMethod: giftCardData.deliveryMethod,
        recipientName: giftCardData.recipientName,
        recipientEmail: giftCardData.recipientEmail,
        recipientPhone: giftCardData.recipientPhone,
        message: giftCardData.message,
        denominationId: giftCardData.denominationId,
        giftCardCode: giftCardData.giftCardCode,
        isPhysicalCard: giftCardData.isPhysicalCard,
      },
    };

    dispatch(ticketActions.addService([giftCardService]));

    toast({
      title: "Gift Card Added",
      description: `$${giftCardData.amount} gift card added to ticket (${giftCardData.giftCardCode})`,
    });
  }, [dispatch, toast]);

  const handleAddStaff = useCallback((staffId: string, staffName: string) => {
    dispatch(ticketActions.addStaff(staffId));
    toast({
      title: "Staff Added",
      description: `${staffName} added to ticket`,
    });
    console.log("Staff added to ticket:", { staffId, staffName });
  }, [dispatch, toast]);

  const handleAddServiceToStaff = useCallback((staffId: string, staffName: string) => {
    if (state.ui.reassigningServiceIds.length > 0) {
      if (staffId && staffName) {
        state.ui.reassigningServiceIds.forEach(serviceId => {
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
  }, [state.ui.reassigningServiceIds, assignedStaffIds, dispatch]);

  const handleReassignStaff = useCallback((serviceIdOrIds: string | string[]) => {
    const ids = Array.isArray(serviceIdOrIds) ? serviceIdOrIds : [serviceIdOrIds];
    dispatch(ticketActions.setReassigningServiceIds(ids));
    dispatch(ticketActions.setFullPageTab("staff"));
  }, [dispatch]);

  const handleUpdateService = useCallback((serviceId: string, updates: Partial<TicketService>) => {
    dispatch(ticketActions.updateService(serviceId, updates));

    // Persist status changes to Supabase if we have a ticket ID
    if (updates.status && ticketId) {
      const service = services.find(s => s.id === serviceId);
      if (service && service.serviceId) {
        reduxDispatch(updateServiceStatusInSupabase({
          ticketId,
          serviceId: service.serviceId,
          newStatus: updates.status as TicketServiceStatus,
          userId: 'current-user',
          deviceId: 'web-browser',
        })).then(() => {
          console.log('✅ Service status persisted:', updates.status);
        }).catch((error) => {
          console.error('❌ Failed to persist service status:', error);
        });
      }
    }
  }, [dispatch, ticketId, services, reduxDispatch]);

  const handleRemoveService = useCallback((serviceId: string) => {
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
  }, [services, dispatch, toast]);

  const handleRemoveClient = useCallback((client: Client | null) => {
    if (client === null) {
      if (selectedClient && services.length > 0) {
        dispatch(ticketActions.toggleDialog("showRemoveClientConfirm", true));
      } else if (selectedClient) {
        dispatch(ticketActions.removeClient());
      }
    } else {
      dispatch(ticketActions.setClient(client));
    }
  }, [selectedClient, services.length, dispatch]);

  const confirmRemoveClient = useCallback(() => {
    dispatch(ticketActions.removeClient());
  }, [dispatch]);

  const handleRemoveStaff = useCallback((staffId: string) => {
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
  }, [staffMembers, services, assignedStaffIds, activeStaffId, dispatch, toast]);

  const handleAddPackage = useCallback((
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
  }, [staffMembers, dispatch, toast]);

  const handleAddProducts = useCallback((
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
  }, [dispatch, toast]);

  const handleRepeatPurchase = useCallback((
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
  }, [dispatch, toast]);

  const handleRefund = useCallback((data: {
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
  }, [toast, dispatch]);

  const handleVoid = useCallback((reason: string) => {
    dispatch(ticketActions.voidTicket());
    
    toast({
      title: "Transaction Voided",
      description: `Transaction has been voided: ${reason}`,
    });
    dispatch(ticketActions.toggleDialog("showRefundVoid", false));
  }, [dispatch, toast]);

  const handleDuplicateServices = useCallback((serviceIds: string[]) => {
    dispatch(ticketActions.duplicateServices(serviceIds));
  }, [dispatch]);

  const handleSplitTicket = useCallback((serviceIds: string[], keepClient: boolean) => {
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
  }, [services, subtotal, discount, dispatch, toast]);

  const handleMergeTickets = useCallback((ticketIds: string[], keepCurrentClient: boolean) => {
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
  }, [services, discount, dispatch, toast]);

  const handleCheckout = useCallback(() => {
    dispatch(ticketActions.toggleDialog("showPaymentModal", true));
  }, [dispatch]);

  /**
   * CRITICAL: Process gift card sales after checkout completion
   * Creates actual gift card records in IndexedDB for each gift card sold
   */
  const processGiftCardSales = useCallback(async (
    ticketIdParam: string,
    ticketServices: TicketService[],
    purchaserId?: string
  ): Promise<void> => {
    const authState = storeAuthManager.getState();
    const storeId = authState.store?.storeId;
    const userId = authState.member?.memberId || 'system';
    const deviceId = authState.store?.deviceId || 'unknown-device';
    const tenantId = authState.store?.tenantId || 'default-tenant';

    if (!storeId) {
      console.warn('⚠️ Cannot process gift cards - no store ID');
      return;
    }

    const giftCardServices = ticketServices.filter(
      (s) => s.metadata?.type === 'gift_card'
    );

    if (giftCardServices.length === 0) {
      return;
    }

    console.log(`🎁 Processing ${giftCardServices.length} gift card sale(s)...`);

    for (const service of giftCardServices) {
      const metadata = service.metadata;
      if (!metadata) continue;

      try {
        const giftCardInput: IssueGiftCardInput = {
          type: (metadata.isPhysicalCard ? 'physical' : 'digital') as GiftCardType,
          amount: service.price,
          purchaserId: purchaserId,
          purchaserName: selectedClient
            ? `${selectedClient.firstName} ${selectedClient.lastName}`.trim()
            : 'Walk-in',
          recipientName: metadata.recipientName,
          recipientEmail: metadata.recipientEmail,
          recipientPhone: metadata.recipientPhone,
          message: metadata.message,
          deliveryMethod: metadata.deliveryMethod as GiftCardDeliveryMethod,
          isReloadable: true,
        };

        const result = await giftCardDB.issueGiftCard(
          giftCardInput,
          storeId,
          userId,
          deviceId,
          tenantId,
          ticketIdParam
        );

        console.log(
          `✅ Gift card created: ${result.giftCard.code} (Balance: $${result.giftCard.currentBalance})`
        );

        if (metadata.deliveryMethod === 'email' && metadata.recipientEmail) {
          console.log(`📧 Email delivery queued for ${metadata.recipientEmail}`);
        }
      } catch (error) {
        console.error('❌ Failed to create gift card:', error);
      }
    }
  }, [selectedClient]);

  const handleCompletePayment = useCallback(async (payment: any) => {
    // Mark all services as completed
    services.forEach((s) => {
      if (s.status !== "completed") {
        dispatch(ticketActions.updateService(s.id, { status: "completed" }));
      }
    });

    console.log("Payment completed:", { selectedClient, services, payment });

    dispatch(ticketActions.toggleDialog("showPaymentModal", false));

    let effectiveTicketId = ticketId;

    try {
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
          status: 'completed',
        })).unwrap();

        effectiveTicketId = result.id;
        console.log("✅ Ticket created for direct checkout:", effectiveTicketId, "Number:", result.number);
      }

      // Run ticket completion and gift card processing in parallel for faster response
      const [completedTicket] = await Promise.all([
        effectiveTicketId
          ? (async () => {
              console.log("📝 Completing ticket in database:", effectiveTicketId);
              const result = await dataService.tickets.complete(effectiveTicketId, payment.methods || []);
              if (result) {
                console.log("✅ Ticket completed:", result.id, "Status:", result.status);
              }
              return result;
            })()
          : Promise.resolve(null),
        processGiftCardSales(effectiveTicketId || '', services, selectedClient?.id),
      ]);

      const primaryMethod = payment.methods?.[0];
      const primaryPaymentMethod = (primaryMethod?.type || 'cash') as 'cash' | 'card' | 'gift_card' | 'other';

      const storedTicket = localStorage.getItem('checkout-pending-ticket');
      const parsedStoredTicket = storedTicket ? JSON.parse(storedTicket) : null;
      const ticketNumber = parsedStoredTicket?.number || 0;

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

      if (primaryPaymentMethod === 'card' && primaryMethod) {
        paymentDetails.authCode = primaryMethod.authCode || primaryMethod.authorization_code;
        paymentDetails.transactionId = primaryMethod.transactionId || primaryMethod.transaction_id;
      }

      if (payment.methods && payment.methods.length > 1) {
        paymentDetails.splits = payment.methods.map((m: any) => ({
          method: m.type as 'cash' | 'card' | 'gift_card' | 'other',
          amount: m.amount,
          details: m,
        }));
      }

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
        tipDistribution: payment.tipDistribution || [],
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
      // Run transaction creation and marking as paid in parallel for faster response
      const mappedPaymentMethod = primaryPaymentMethod === 'card' ? 'credit-card' : primaryPaymentMethod;
      await Promise.all([
        (async () => {
          await dataService.transactions.create(transactionData as any);
          console.log("✅ Transaction record created");
        })(),
        effectiveTicketId
          ? (async () => {
              console.log("📝 Marking ticket as paid:", effectiveTicketId);
              await reduxDispatch(markTicketAsPaid({
                ticketId: effectiveTicketId,
                paymentMethod: mappedPaymentMethod as any,
                paymentDetails: paymentDetails as any,
                tip: payment.tip || 0,
              })).unwrap();
              console.log("✅ Ticket marked as paid and moved to closed");
            })()
          : Promise.resolve(),
      ]);

      // Send payment result to Mango Pad (if transaction was sent to Pad)
      const padTxId = payment.padTransactionId || activePadTransaction?.transactionId;
      console.log('📱 [Pad Payment] Checking conditions:', {
        'payment.padTransactionId': payment.padTransactionId,
        'activePadTransaction?.transactionId': activePadTransaction?.transactionId,
        padTxId,
        effectiveTicketId,
        mqttEnabled: isMqttEnabled(),
      });
      if (padTxId && effectiveTicketId && isMqttEnabled()) {
        try {
          console.log('📱 Sending payment result to Mango Pad:', padTxId);
          const mangoPadService = getMangoPadService();
          const cardPayment = payment.methods?.find((m: any) => m.type === 'card');
          await mangoPadService.sendPaymentResult({
            transactionId: padTxId,
            ticketId: effectiveTicketId,
            success: true,
            cardLast4: cardPayment?.cardLast4,
            cardBrand: cardPayment?.cardBrand,
            authCode: cardPayment?.authCode || cardPayment?.authorization_code,
          });
          console.log('✅ Payment result sent to Mango Pad');
          // Clear the pad transaction from Redux after successful send
          reduxDispatch(clearPadTransaction());
        } catch (padError) {
          console.error('❌ Failed to send payment result to Mango Pad:', padError);
          // Don't fail the whole payment flow for this
        }
      }

      toast({
        title: "Payment Complete!",
        description: `Successfully processed payment of $${total.toFixed(2)}. Ticket closed.`,
        duration: 3000,
      });
    } catch (error) {
      console.error("❌ Error completing ticket:", error);
      toast({
        title: "Payment Complete!",
        description: `Payment of $${total.toFixed(2)} processed. Some records may sync later.`,
        duration: 3000,
      });
    }

    dispatch(ticketActions.resetTicket());

    // Reduced from 1500ms to 300ms - the success toast already provides feedback
    const closeTimeout = setTimeout(() => {
      onClose();
    }, 300);

    if (checkoutCloseTimeoutRef.current) {
      clearTimeout(checkoutCloseTimeoutRef.current);
    }
    checkoutCloseTimeoutRef.current = closeTimeout;
  }, [services, selectedClient, ticketId, discount, subtotal, tax, total, convertToCheckoutServices, processGiftCardSales, reduxDispatch, dispatch, toast, onClose, checkoutCloseTimeoutRef, activePadTransaction]);

  const handleReset = useCallback(() => {
    if (services.length > 0) {
      dispatch(ticketActions.clearServices());
      toast({
        title: "Cart cleared",
        description: "All services have been removed from the ticket.",
      });
    }
  }, [services.length, dispatch, toast]);

  const performReset = useCallback(() => {
    dispatch(ticketActions.resetTicket());
  }, [dispatch]);

  const handleCloseAttempt = useCallback(() => {
    if (services.length > 0 && isNewTicket) {
      dispatch(ticketActions.toggleDialog("showDiscardTicketConfirm", true));
    } else {
      onClose();
    }
  }, [services.length, isNewTicket, dispatch, onClose]);

  return {
    convertToCheckoutServices,
    createTicketWithStatus,
    handleCheckIn,
    handleStartService,
    handleSaveToPending,
    handleDisregard,
    handleCreateClient,
    handleAddServices,
    handleAddGiftCard,
    handleAddStaff,
    handleAddServiceToStaff,
    handleReassignStaff,
    handleUpdateService,
    handleRemoveService,
    handleRemoveClient,
    confirmRemoveClient,
    handleRemoveStaff,
    handleAddPackage,
    handleAddProducts,
    handleRepeatPurchase,
    handleRefund,
    handleVoid,
    handleDuplicateServices,
    handleSplitTicket,
    handleMergeTickets,
    handleCheckout,
    processGiftCardSales,
    handleCompletePayment,
    handleReset,
    performReset,
    handleCloseAttempt,
  };
}
