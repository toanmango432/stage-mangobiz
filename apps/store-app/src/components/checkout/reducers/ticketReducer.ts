/**
 * Ticket Reducer
 *
 * Manages all state for the TicketPanel component.
 * Extracted from TicketPanel.tsx for better organization.
 */

import type { TicketService } from "../ServiceList";
import type { Client } from "../ClientSelector";
import type {
  TicketState,
  TicketAction,
  DialogKey,
  PanelMode,
  UndoSnapshot,
  CouponData,
  GiftCardData,
} from "../types";

// ============================================================================
// INITIAL STATE
// ============================================================================

const getDefaultMode = (): PanelMode => {
  if (typeof window === "undefined") return "dock";
  const saved = localStorage.getItem("checkout-default-mode");
  return (saved === "full" || saved === "dock") ? saved : "dock";
};

export const createInitialState = (): TicketState => ({
  ticketId: null,
  services: [],
  selectedClient: null,
  discounts: {
    discount: 0,
    hasDiscount: false,
    appliedPointsDiscount: 0,
    redeemedPoints: 0,
    appliedCoupon: null,
    couponDiscount: 0,
    appliedGiftCards: [],
  },
  staff: {
    activeStaffId: null,
    assignedStaffIds: [],
    preSelectedStaff: null,
  },
  dialogs: {
    showPaymentModal: false,
    showServicesOnMobile: false,
    showStaffOnMobile: false,
    showServicePackages: false,
    showProductSales: false,
    showPurchaseHistory: false,
    showReceiptPreview: false,
    showRefundVoid: false,
    showRemoveClientConfirm: false,
    showDiscardTicketConfirm: false,
    showPreventStaffRemoval: false,
    preventStaffRemovalMessage: "",
    showKeyboardShortcuts: false,
    showSplitTicketDialog: false,
    showMergeTicketsDialog: false,
    showClientSelector: false,
    showClientProfile: false,
  },
  ui: {
    mode: getDefaultMode(),
    selectedCategory: "all",
    fullPageTab: "services",
    addItemTab: "services",
    reassigningServiceIds: [],
    headerVisible: true,
    lastScrollY: 0,
    searchQuery: "",
  },
  undoStack: [],
  isNewTicket: true,
  isFromWaitingQueue: false,
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const createUndoSnapshot = (state: TicketState, actionDescription: string): UndoSnapshot => ({
  services: [...state.services],
  selectedClient: state.selectedClient,
  discounts: { ...state.discounts, appliedGiftCards: [...state.discounts.appliedGiftCards] },
  staff: { ...state.staff, assignedStaffIds: [...state.staff.assignedStaffIds] },
  actionDescription,
});

const addToUndoStack = (state: TicketState, snapshot: UndoSnapshot): UndoSnapshot[] => {
  const maxUndoItems = 10;
  return [snapshot, ...state.undoStack].slice(0, maxUndoItems);
};

// ============================================================================
// REDUCER FUNCTION
// ============================================================================

export function ticketReducer(state: TicketState, action: TicketAction): TicketState {
  switch (action.type) {
    case "ADD_SERVICE": {
      const newStaffIds = action.payload
        .filter(s => s.staffId)
        .map(s => s.staffId as string);
      const updatedAssignedStaffIds = Array.from(new Set([...state.staff.assignedStaffIds, ...newStaffIds]));

      return {
        ...state,
        services: [...state.services, ...action.payload],
        staff: {
          ...state.staff,
          assignedStaffIds: updatedAssignedStaffIds,
          preSelectedStaff: null,
        },
        dialogs: {
          ...state.dialogs,
          showServicesOnMobile: false,
        },
      };
    }

    case "REMOVE_SERVICE":
      return {
        ...state,
        services: state.services.filter(s => s.id !== action.payload.serviceId),
      };

    case "UPDATE_SERVICE":
      return {
        ...state,
        services: state.services.map(s =>
          s.id === action.payload.serviceId
            ? { ...s, ...action.payload.updates }
            : s
        ),
      };

    case "ADD_PACKAGE": {
      const undoStack = action.payload.saveUndo
        ? addToUndoStack(state, createUndoSnapshot(state, "Add Package"))
        : state.undoStack;

      const normalizedServices: TicketService[] = action.payload.services.map(s => ({
        ...s,
        id: s.id || `pkg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        serviceId: s.serviceId || s.id || "",
        serviceName: s.serviceName || "Unknown Service",
        duration: s.duration ?? 30,
        status: s.status || ("not_started" as const),
      }));

      const newStaffIds = normalizedServices
        .filter(s => s.staffId)
        .map(s => s.staffId as string);
      const updatedAssignedStaffIds = Array.from(new Set([...state.staff.assignedStaffIds, ...newStaffIds]));
      const firstStaffId = normalizedServices.find(s => s.staffId)?.staffId || null;

      return {
        ...state,
        services: [...state.services, ...normalizedServices],
        discounts: {
          ...state.discounts,
          discount: state.discounts.discount + action.payload.discount,
          hasDiscount: state.discounts.hasDiscount || action.payload.discount > 0,
        },
        staff: {
          ...state.staff,
          assignedStaffIds: updatedAssignedStaffIds,
          activeStaffId: firstStaffId || state.staff.activeStaffId,
        },
        undoStack,
      };
    }

    case "ADD_PRODUCTS": {
      const undoStack = action.payload.saveUndo
        ? addToUndoStack(state, createUndoSnapshot(state, "Add Products"))
        : state.undoStack;

      const normalizedProducts: TicketService[] = action.payload.services.map(s => ({
        ...s,
        id: s.id || `product-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        serviceId: s.serviceId || s.id || "",
        serviceName: s.serviceName || "Unknown Product",
        duration: 0,
        staffId: undefined,
        staffName: undefined,
        status: "completed" as const,
      }));

      return {
        ...state,
        services: [...state.services, ...normalizedProducts],
        undoStack,
      };
    }

    case "DUPLICATE_SERVICES": {
      const servicesToDuplicate = state.services.filter(s => action.payload.serviceIds.includes(s.id));
      const duplicatedServices = servicesToDuplicate.map(s => ({
        ...s,
        id: Math.random().toString(),
      }));
      return {
        ...state,
        services: [...state.services, ...duplicatedServices],
      };
    }

    case "SET_CLIENT":
      return {
        ...state,
        selectedClient: action.payload,
      };

    case "REMOVE_CLIENT":
      return {
        ...state,
        selectedClient: null,
        dialogs: {
          ...state.dialogs,
          showRemoveClientConfirm: false,
        },
      };

    case "APPLY_COUPON": {
      const undoStack = action.payload.saveUndo
        ? addToUndoStack(state, createUndoSnapshot(state, `Apply Coupon: ${action.payload.coupon.code}`))
        : state.undoStack;

      return {
        ...state,
        discounts: {
          ...state.discounts,
          appliedCoupon: action.payload.coupon,
          couponDiscount: action.payload.discountValue,
        },
        undoStack,
      };
    }

    case "REMOVE_COUPON":
      return {
        ...state,
        discounts: {
          ...state.discounts,
          appliedCoupon: null,
          couponDiscount: 0,
        },
      };

    case "APPLY_GIFT_CARD":
      return {
        ...state,
        discounts: {
          ...state.discounts,
          appliedGiftCards: [...state.discounts.appliedGiftCards, action.payload],
        },
      };

    case "REMOVE_GIFT_CARD":
      return {
        ...state,
        discounts: {
          ...state.discounts,
          appliedGiftCards: state.discounts.appliedGiftCards.filter(gc => gc.code !== action.payload.code),
        },
      };

    case "APPLY_POINTS":
      return {
        ...state,
        discounts: {
          ...state.discounts,
          redeemedPoints: action.payload.points,
          appliedPointsDiscount: action.payload.discountValue,
        },
      };

    case "REMOVE_POINTS":
      return {
        ...state,
        discounts: {
          ...state.discounts,
          redeemedPoints: 0,
          appliedPointsDiscount: 0,
        },
      };

    case "APPLY_DISCOUNT":
      return {
        ...state,
        discounts: {
          ...state.discounts,
          discount: action.payload.discountValue,
          hasDiscount: true,
        },
      };

    case "REMOVE_DISCOUNT": {
      const amountToRemove = action.payload?.amount;
      const newDiscount = amountToRemove !== undefined
        ? Math.max(0, state.discounts.discount - amountToRemove)
        : 0;

      return {
        ...state,
        discounts: {
          ...state.discounts,
          discount: newDiscount,
          hasDiscount: newDiscount > 0,
        },
      };
    }

    case "TOGGLE_DIALOG":
      return {
        ...state,
        dialogs: {
          ...state.dialogs,
          [action.payload.dialog]: action.payload.value,
        },
      };

    case "SET_PREVENT_STAFF_REMOVAL_MESSAGE":
      return {
        ...state,
        dialogs: {
          ...state.dialogs,
          preventStaffRemovalMessage: action.payload,
        },
      };

    case "SET_MODE":
      return {
        ...state,
        ui: {
          ...state.ui,
          mode: action.payload,
        },
      };

    case "SET_CATEGORY":
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedCategory: action.payload,
        },
      };

    case "SET_FULL_PAGE_TAB":
      return {
        ...state,
        ui: {
          ...state.ui,
          fullPageTab: action.payload,
        },
      };

    case "SET_ADD_ITEM_TAB":
      return {
        ...state,
        ui: {
          ...state.ui,
          addItemTab: action.payload,
        },
      };

    case "SET_REASSIGNING_SERVICE_IDS":
      return {
        ...state,
        ui: {
          ...state.ui,
          reassigningServiceIds: action.payload,
        },
      };

    case "SET_HEADER_VISIBLE":
      return {
        ...state,
        ui: {
          ...state.ui,
          headerVisible: action.payload,
        },
      };

    case "SET_LAST_SCROLL_Y":
      return {
        ...state,
        ui: {
          ...state.ui,
          lastScrollY: action.payload,
        },
      };

    case "SET_SEARCH_QUERY":
      return {
        ...state,
        ui: {
          ...state.ui,
          searchQuery: action.payload,
        },
      };

    case "SET_ACTIVE_STAFF":
      return {
        ...state,
        staff: {
          ...state.staff,
          activeStaffId: action.payload,
        },
      };

    case "ADD_STAFF": {
      const updatedAssignedStaffIds = state.staff.assignedStaffIds.includes(action.payload.staffId)
        ? state.staff.assignedStaffIds
        : [...state.staff.assignedStaffIds, action.payload.staffId];

      return {
        ...state,
        staff: {
          ...state.staff,
          assignedStaffIds: updatedAssignedStaffIds,
          activeStaffId: action.payload.staffId,
        },
      };
    }

    case "REMOVE_STAFF": {
      const updatedServices = action.payload.removeServices
        ? state.services.filter(s => s.staffId !== action.payload.staffId)
        : state.services;
      const updatedAssignedStaffIds = state.staff.assignedStaffIds.filter(id => id !== action.payload.staffId);
      const newActiveStaffId = state.staff.activeStaffId === action.payload.staffId
        ? null
        : state.staff.activeStaffId;

      return {
        ...state,
        services: updatedServices,
        staff: {
          ...state.staff,
          assignedStaffIds: updatedAssignedStaffIds,
          activeStaffId: newActiveStaffId,
        },
      };
    }

    case "SET_PRE_SELECTED_STAFF":
      return {
        ...state,
        staff: {
          ...state.staff,
          preSelectedStaff: action.payload,
        },
      };

    case "SET_ASSIGNED_STAFF_IDS":
      return {
        ...state,
        staff: {
          ...state.staff,
          assignedStaffIds: action.payload,
        },
      };

    case "BULK_UPDATE_SERVICES":
      return {
        ...state,
        services: state.services.map(service => ({
          ...service,
          ...action.payload,
          startTime: action.payload.status === "in_progress" ? new Date() : service.startTime,
        })),
      };

    case "ASSIGN_ALL_TO_STAFF":
      return {
        ...state,
        services: state.services.map(service => ({
          ...service,
          staffId: action.payload.staffId,
          staffName: action.payload.staffName,
        })),
      };

    case "SPLIT_TICKET": {
      const servicesToKeep = state.services.filter(s => !action.payload.serviceIds.includes(s.id));

      return {
        ...state,
        services: servicesToKeep,
        selectedClient: action.payload.keepClient ? state.selectedClient : null,
        discounts: {
          ...state.discounts,
          discount: action.payload.newDiscount,
        },
        staff: {
          ...state.staff,
          assignedStaffIds: action.payload.newAssignedStaffIds,
          activeStaffId: action.payload.newActiveStaffId,
        },
      };
    }

    case "MERGE_TICKETS":
      return {
        ...state,
        services: [...state.services, ...action.payload.services],
        discounts: {
          ...state.discounts,
          discount: state.discounts.discount + action.payload.discount,
          hasDiscount: state.discounts.hasDiscount || action.payload.discount > 0,
        },
        staff: {
          ...state.staff,
          assignedStaffIds: Array.from(new Set([...state.staff.assignedStaffIds, ...action.payload.staffIds])),
        },
      };

    case "VOID_TICKET":
      return {
        ...state,
        services: [],
        selectedClient: null,
        discounts: {
          discount: 0,
          hasDiscount: false,
          appliedPointsDiscount: 0,
          redeemedPoints: 0,
          appliedCoupon: null,
          couponDiscount: 0,
          appliedGiftCards: [],
        },
        staff: {
          activeStaffId: null,
          assignedStaffIds: [],
          preSelectedStaff: null,
        },
      };

    case "UNDO_LAST_ACTION": {
      if (state.undoStack.length === 0) return state;

      const [lastSnapshot, ...remainingStack] = state.undoStack;

      return {
        ...state,
        services: lastSnapshot.services,
        selectedClient: lastSnapshot.selectedClient,
        discounts: lastSnapshot.discounts,
        staff: {
          ...state.staff,
          ...lastSnapshot.staff,
        },
        dialogs: {
          ...state.dialogs,
          showProductSales: false,
          showServicePackages: false,
        },
        undoStack: remainingStack,
      };
    }

    case "RESET_TICKET":
      return {
        ...createInitialState(),
        ui: {
          ...createInitialState().ui,
          mode: state.ui.mode,
        },
      };

    case "CLEAR_SERVICES":
      return {
        ...state,
        services: [],
        staff: {
          ...state.staff,
          activeStaffId: null,
          assignedStaffIds: [],
        },
        discounts: {
          ...state.discounts,
          discount: 0,
          hasDiscount: false,
          appliedPointsDiscount: 0,
          redeemedPoints: 0,
          appliedCoupon: null,
          couponDiscount: 0,
        },
      };

    case "MARK_TICKET_SAVED":
      return {
        ...state,
        isNewTicket: false,
      };

    case "SET_TICKET_ID":
      return {
        ...state,
        ticketId: action.payload,
      };

    case "SET_IS_FROM_WAITING_QUEUE":
      return {
        ...state,
        isFromWaitingQueue: action.payload,
      };

    default:
      return state;
  }
}

// ============================================================================
// ACTION CREATORS
// ============================================================================

export const ticketActions = {
  addService: (services: TicketService[]): TicketAction => ({
    type: "ADD_SERVICE",
    payload: services,
  }),

  removeService: (serviceId: string): TicketAction => ({
    type: "REMOVE_SERVICE",
    payload: { serviceId },
  }),

  updateService: (serviceId: string, updates: Partial<TicketService>): TicketAction => ({
    type: "UPDATE_SERVICE",
    payload: { serviceId, updates },
  }),

  addPackage: (services: TicketService[], discount: number, saveUndo = true): TicketAction => ({
    type: "ADD_PACKAGE",
    payload: { services, discount, saveUndo },
  }),

  addProducts: (services: TicketService[], saveUndo = true): TicketAction => ({
    type: "ADD_PRODUCTS",
    payload: { services, saveUndo },
  }),

  duplicateServices: (serviceIds: string[]): TicketAction => ({
    type: "DUPLICATE_SERVICES",
    payload: { serviceIds },
  }),

  setClient: (client: Client): TicketAction => ({
    type: "SET_CLIENT",
    payload: client,
  }),

  removeClient: (): TicketAction => ({
    type: "REMOVE_CLIENT",
  }),

  applyCoupon: (coupon: CouponData, discountValue: number, saveUndo = true): TicketAction => ({
    type: "APPLY_COUPON",
    payload: { coupon, discountValue, saveUndo },
  }),

  removeCoupon: (): TicketAction => ({
    type: "REMOVE_COUPON",
  }),

  applyGiftCard: (giftCard: GiftCardData): TicketAction => ({
    type: "APPLY_GIFT_CARD",
    payload: giftCard,
  }),

  removeGiftCard: (code: string): TicketAction => ({
    type: "REMOVE_GIFT_CARD",
    payload: { code },
  }),

  applyPoints: (points: number, discountValue: number): TicketAction => ({
    type: "APPLY_POINTS",
    payload: { points, discountValue },
  }),

  removePoints: (): TicketAction => ({
    type: "REMOVE_POINTS",
  }),

  applyDiscount: (discountValue: number): TicketAction => ({
    type: "APPLY_DISCOUNT",
    payload: { discountValue },
  }),

  removeDiscount: (amount?: number): TicketAction => ({
    type: "REMOVE_DISCOUNT",
    payload: amount !== undefined ? { amount } : undefined,
  }),

  toggleDialog: (dialog: DialogKey, value: boolean): TicketAction => ({
    type: "TOGGLE_DIALOG",
    payload: { dialog, value },
  }),

  setPreventStaffRemovalMessage: (message: string): TicketAction => ({
    type: "SET_PREVENT_STAFF_REMOVAL_MESSAGE",
    payload: message,
  }),

  setMode: (mode: PanelMode): TicketAction => ({
    type: "SET_MODE",
    payload: mode,
  }),

  setCategory: (category: string): TicketAction => ({
    type: "SET_CATEGORY",
    payload: category,
  }),

  setFullPageTab: (tab: "services" | "staff"): TicketAction => ({
    type: "SET_FULL_PAGE_TAB",
    payload: tab,
  }),

  setAddItemTab: (tab: "services" | "products" | "packages" | "giftcards"): TicketAction => ({
    type: "SET_ADD_ITEM_TAB",
    payload: tab,
  }),

  setReassigningServiceIds: (ids: string[]): TicketAction => ({
    type: "SET_REASSIGNING_SERVICE_IDS",
    payload: ids,
  }),

  setHeaderVisible: (visible: boolean): TicketAction => ({
    type: "SET_HEADER_VISIBLE",
    payload: visible,
  }),

  setLastScrollY: (y: number): TicketAction => ({
    type: "SET_LAST_SCROLL_Y",
    payload: y,
  }),

  setSearchQuery: (query: string): TicketAction => ({
    type: "SET_SEARCH_QUERY",
    payload: query,
  }),

  setActiveStaff: (staffId: string | null): TicketAction => ({
    type: "SET_ACTIVE_STAFF",
    payload: staffId,
  }),

  addStaff: (staffId: string): TicketAction => ({
    type: "ADD_STAFF",
    payload: { staffId },
  }),

  removeStaff: (staffId: string, removeServices: boolean): TicketAction => ({
    type: "REMOVE_STAFF",
    payload: { staffId, removeServices },
  }),

  setPreSelectedStaff: (staff: { id: string; name: string } | null): TicketAction => ({
    type: "SET_PRE_SELECTED_STAFF",
    payload: staff,
  }),

  setAssignedStaffIds: (ids: string[]): TicketAction => ({
    type: "SET_ASSIGNED_STAFF_IDS",
    payload: ids,
  }),

  bulkUpdateServices: (updates: Partial<TicketService>): TicketAction => ({
    type: "BULK_UPDATE_SERVICES",
    payload: updates,
  }),

  assignAllToStaff: (staffId: string, staffName: string): TicketAction => ({
    type: "ASSIGN_ALL_TO_STAFF",
    payload: { staffId, staffName },
  }),

  splitTicket: (
    serviceIds: string[],
    keepClient: boolean,
    newDiscount: number,
    newAssignedStaffIds: string[],
    newActiveStaffId: string | null
  ): TicketAction => ({
    type: "SPLIT_TICKET",
    payload: { serviceIds, keepClient, newDiscount, newAssignedStaffIds, newActiveStaffId },
  }),

  mergeTickets: (services: TicketService[], discount: number, staffIds: string[]): TicketAction => ({
    type: "MERGE_TICKETS",
    payload: { services, discount, staffIds },
  }),

  voidTicket: (): TicketAction => ({
    type: "VOID_TICKET",
  }),

  undoLastAction: (): TicketAction => ({
    type: "UNDO_LAST_ACTION",
  }),

  resetTicket: (): TicketAction => ({
    type: "RESET_TICKET",
  }),

  clearServices: (): TicketAction => ({
    type: "CLEAR_SERVICES",
  }),

  markTicketSaved: (): TicketAction => ({
    type: "MARK_TICKET_SAVED",
  }),

  setTicketId: (ticketId: string | null): TicketAction => ({
    type: "SET_TICKET_ID",
    payload: ticketId,
  }),
  setIsFromWaitingQueue: (isFromWaitingQueue: boolean): TicketAction => ({
    type: "SET_IS_FROM_WAITING_QUEUE",
    payload: isFromWaitingQueue,
  }),
};
