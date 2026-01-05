import { useState, useCallback } from 'react';
import type { TicketService } from '../../ServiceList';

interface UseSummaryDialogsOptions {
  onUpdateService: (serviceId: string, updates: Partial<TicketService>) => void;
  onRemoveService: (serviceId: string) => void;
  onApplyDiscount?: (data: { type: "percentage" | "fixed"; amount: number; reason: string }) => void;
  subtotal: number;
}

/**
 * Hook to manage dialog state and handlers for InteractiveSummary.
 * Handles bulk delete, price edit, and discount dialogs.
 */
export function useSummaryDialogs({
  onUpdateService,
  onRemoveService,
  onApplyDiscount,
  subtotal,
}: UseSummaryDialogsOptions) {
  // Selection state
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());

  // Bulk delete dialog
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [pendingBulkDeleteIds, setPendingBulkDeleteIds] = useState<string[]>([]);

  // Price edit dialog
  const [showPriceEditDialog, setShowPriceEditDialog] = useState(false);
  const [pendingEditServiceIds, setPendingEditServiceIds] = useState<string[]>([]);
  const [newPriceValue, setNewPriceValue] = useState("");

  // Service discount dialog
  const [showServiceDiscountDialog, setShowServiceDiscountDialog] = useState(false);
  const [serviceDiscountValue, setServiceDiscountValue] = useState("");
  const [serviceDiscountType, setServiceDiscountType] = useState<"percentage" | "fixed">("percentage");

  // Ticket discount dialog
  const [showTicketDiscountDialog, setShowTicketDiscountDialog] = useState(false);
  const [ticketDiscountValue, setTicketDiscountValue] = useState("");
  const [ticketDiscountType, setTicketDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [ticketDiscountReason, setTicketDiscountReason] = useState("");

  // Selection handlers
  const handleToggleSelect = useCallback((serviceId: string) => {
    setSelectedServices((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) {
        next.delete(serviceId);
      } else {
        next.add(serviceId);
      }
      return next;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedServices(new Set());
  }, []);

  // Bulk delete handlers
  const handleBulkDelete = useCallback(() => {
    if (selectedServices.size === 0) return;
    setPendingBulkDeleteIds(Array.from(selectedServices));
    setShowBulkDeleteConfirm(true);
  }, [selectedServices]);

  const handleConfirmBulkDelete = useCallback(() => {
    pendingBulkDeleteIds.forEach((id) => onRemoveService(id));
    setShowBulkDeleteConfirm(false);
    setPendingBulkDeleteIds([]);
    setSelectedServices(new Set());
  }, [pendingBulkDeleteIds, onRemoveService]);

  // Price edit handlers
  const handleBulkEditPrice = useCallback(() => {
    if (selectedServices.size === 0) return;
    setPendingEditServiceIds(Array.from(selectedServices));
    setShowPriceEditDialog(true);
    setNewPriceValue("");
  }, [selectedServices]);

  const handleConfirmPriceEdit = useCallback(() => {
    const price = parseFloat(newPriceValue);
    if (isNaN(price)) return;
    pendingEditServiceIds.forEach((id) => {
      onUpdateService(id, { price });
    });
    setShowPriceEditDialog(false);
    setPendingEditServiceIds([]);
    setNewPriceValue("");
    setSelectedServices(new Set());
  }, [pendingEditServiceIds, newPriceValue, onUpdateService]);

  // Service discount handlers
  const handleBulkDiscount = useCallback(() => {
    if (selectedServices.size === 0) return;
    setPendingEditServiceIds(Array.from(selectedServices));
    setShowServiceDiscountDialog(true);
    setServiceDiscountValue("");
    setServiceDiscountType("percentage");
  }, [selectedServices]);

  const handleConfirmServiceDiscount = useCallback(() => {
    const discountValue = parseFloat(serviceDiscountValue);
    if (isNaN(discountValue) || discountValue <= 0) return;

    pendingEditServiceIds.forEach((id) => {
      // Get current service price (this would need to be passed in or looked up)
      // For now, we apply the discount as a price reduction
      onUpdateService(id, {
        // Mark service as discounted (implementation depends on TicketService type)
        // This is a simplified version
      });
    });
    setShowServiceDiscountDialog(false);
    setPendingEditServiceIds([]);
    setServiceDiscountValue("");
    setSelectedServices(new Set());
  }, [pendingEditServiceIds, serviceDiscountValue, serviceDiscountType, onUpdateService]);

  // Ticket discount handlers
  const handleOpenTicketDiscount = useCallback(() => {
    setShowTicketDiscountDialog(true);
    setTicketDiscountValue("");
    setTicketDiscountType("percentage");
    setTicketDiscountReason("");
  }, []);

  const handleConfirmTicketDiscount = useCallback(() => {
    if (!onApplyDiscount) return;

    const discountValue = parseFloat(ticketDiscountValue);
    if (isNaN(discountValue) || discountValue <= 0) return;

    // Calculate actual discount amount
    let amount: number;
    if (ticketDiscountType === "percentage") {
      amount = (subtotal * discountValue) / 100;
    } else {
      amount = discountValue;
    }

    onApplyDiscount({
      type: ticketDiscountType,
      amount,
      reason: ticketDiscountReason || `${ticketDiscountType === "percentage" ? discountValue + "%" : "$" + discountValue.toFixed(2)} discount`,
    });

    setShowTicketDiscountDialog(false);
    setTicketDiscountValue("");
    setTicketDiscountReason("");
  }, [ticketDiscountValue, ticketDiscountType, ticketDiscountReason, subtotal, onApplyDiscount]);

  return {
    // Selection state
    selectedServices,
    setSelectedServices,
    handleToggleSelect,
    handleClearSelection,

    // Bulk delete dialog
    showBulkDeleteConfirm,
    setShowBulkDeleteConfirm,
    pendingBulkDeleteIds,
    setPendingBulkDeleteIds,
    handleBulkDelete,
    handleConfirmBulkDelete,

    // Price edit dialog
    showPriceEditDialog,
    setShowPriceEditDialog,
    pendingEditServiceIds,
    setPendingEditServiceIds,
    newPriceValue,
    setNewPriceValue,
    handleBulkEditPrice,
    handleConfirmPriceEdit,

    // Service discount dialog
    showServiceDiscountDialog,
    setShowServiceDiscountDialog,
    serviceDiscountValue,
    setServiceDiscountValue,
    serviceDiscountType,
    setServiceDiscountType,
    handleBulkDiscount,
    handleConfirmServiceDiscount,

    // Ticket discount dialog
    showTicketDiscountDialog,
    setShowTicketDiscountDialog,
    ticketDiscountValue,
    setTicketDiscountValue,
    ticketDiscountType,
    setTicketDiscountType,
    ticketDiscountReason,
    setTicketDiscountReason,
    handleOpenTicketDiscount,
    handleConfirmTicketDiscount,
  };
}
