import { useState, useEffect, useRef, useReducer } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import ClientSelector, { Client } from "./ClientSelector";
import ServiceGrid, { Service } from "./ServiceGrid";
import ServiceList, { TicketService, StaffMember } from "./ServiceList";
import ServiceListGrouped from "./ServiceListGrouped";
import CheckoutSummary from "./CheckoutSummary";
import SimplifiedSummary from "./SimplifiedSummary";
import InteractiveSummary from "./InteractiveSummary";
import PaymentModal from "./PaymentModal";
import QuickActions from "./QuickActions";
import FullPageServiceSelector, { CategoryList } from "./FullPageServiceSelector";
import StaffGridView from "./StaffGridView";
import SplitTicketDialog from "./SplitTicketDialog";
import MergeTicketsDialog, { OpenTicket } from "./MergeTicketsDialog";
import RewardPointsRedemption from "./RewardPointsRedemption";
import CouponEntry from "./CouponEntry";
import GiftCardEntry from "./GiftCardEntry";
import ServicePackages from "./ServicePackages";
import ProductSales from "./ProductSales";
import PurchaseHistory from "./PurchaseHistory";
import ReceiptPreview from "./ReceiptPreview";
import RefundVoidDialog from "./RefundVoidDialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import {
  X,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  User,
  Scissors,
  AlertCircle,
  Plus,
  Keyboard,
  Merge,
  ShoppingBag,
  Package,
  Tag,
  Award,
  Gift,
  DollarSign,
} from "lucide-react";

// ============================================================================
// TYPE DEFINITIONS FOR REDUCER STATE
// ============================================================================

export interface CouponData {
  code: string;
  discount: number;
  discountType: "percentage" | "fixed";
  description: string;
}

export interface GiftCardData {
  code: string;
  balance: number;
  amountUsed: number;
}

interface DiscountState {
  discount: number;
  hasDiscount: boolean;
  appliedPointsDiscount: number;
  redeemedPoints: number;
  appliedCoupon: CouponData | null;
  couponDiscount: number;
  appliedGiftCards: GiftCardData[];
}

interface StaffState {
  activeStaffId: string | null;
  assignedStaffIds: string[];
  preSelectedStaff: { id: string; name: string } | null;
}

type DialogKey =
  | "showPaymentModal"
  | "showServicesOnMobile"
  | "showStaffOnMobile"
  | "showServicePackages"
  | "showProductSales"
  | "showPurchaseHistory"
  | "showReceiptPreview"
  | "showRefundVoid"
  | "showRemoveClientConfirm"
  | "showDiscardTicketConfirm"
  | "showPreventStaffRemoval"
  | "showKeyboardShortcuts"
  | "showSplitTicketDialog"
  | "showMergeTicketsDialog";

interface DialogState {
  showPaymentModal: boolean;
  showServicesOnMobile: boolean;
  showStaffOnMobile: boolean;
  showServicePackages: boolean;
  showProductSales: boolean;
  showPurchaseHistory: boolean;
  showReceiptPreview: boolean;
  showRefundVoid: boolean;
  showRemoveClientConfirm: boolean;
  showDiscardTicketConfirm: boolean;
  showPreventStaffRemoval: boolean;
  preventStaffRemovalMessage: string;
  showKeyboardShortcuts: boolean;
  showSplitTicketDialog: boolean;
  showMergeTicketsDialog: boolean;
}

type PanelMode = "dock" | "full";

interface UIState {
  mode: PanelMode;
  selectedCategory: string;
  fullPageTab: "services" | "staff";
  addItemTab: "services" | "products" | "packages" | "giftcards";
  reassigningServiceIds: string[];
  headerVisible: boolean;
  lastScrollY: number;
}

interface UndoSnapshot {
  services: TicketService[];
  selectedClient: Client | null;
  discounts: DiscountState;
  staff: StaffState;
  actionDescription: string;
}

interface TicketState {
  services: TicketService[];
  selectedClient: Client | null;
  discounts: DiscountState;
  staff: StaffState;
  dialogs: DialogState;
  ui: UIState;
  undoStack: UndoSnapshot[];
}

// ============================================================================
// ACTION TYPES
// ============================================================================

type TicketAction =
  | { type: "ADD_SERVICE"; payload: TicketService[] }
  | { type: "REMOVE_SERVICE"; payload: { serviceId: string } }
  | { type: "UPDATE_SERVICE"; payload: { serviceId: string; updates: Partial<TicketService> } }
  | { type: "ADD_PACKAGE"; payload: { services: TicketService[]; discount: number; saveUndo: boolean } }
  | { type: "ADD_PRODUCTS"; payload: { services: TicketService[]; saveUndo: boolean } }
  | { type: "DUPLICATE_SERVICES"; payload: { serviceIds: string[] } }
  | { type: "SET_CLIENT"; payload: Client }
  | { type: "REMOVE_CLIENT" }
  | { type: "APPLY_COUPON"; payload: { coupon: CouponData; discountValue: number; saveUndo: boolean } }
  | { type: "REMOVE_COUPON" }
  | { type: "APPLY_GIFT_CARD"; payload: GiftCardData }
  | { type: "REMOVE_GIFT_CARD"; payload: { code: string } }
  | { type: "APPLY_POINTS"; payload: { points: number; discountValue: number } }
  | { type: "REMOVE_POINTS" }
  | { type: "APPLY_DISCOUNT"; payload: { discountValue: number } }
  | { type: "REMOVE_DISCOUNT"; payload?: { amount?: number } }
  | { type: "TOGGLE_DIALOG"; payload: { dialog: DialogKey; value: boolean } }
  | { type: "SET_PREVENT_STAFF_REMOVAL_MESSAGE"; payload: string }
  | { type: "SET_MODE"; payload: PanelMode }
  | { type: "SET_CATEGORY"; payload: string }
  | { type: "SET_FULL_PAGE_TAB"; payload: "services" | "staff" }
  | { type: "SET_ADD_ITEM_TAB"; payload: "services" | "products" | "packages" | "giftcards" }
  | { type: "SET_REASSIGNING_SERVICE_IDS"; payload: string[] }
  | { type: "SET_HEADER_VISIBLE"; payload: boolean }
  | { type: "SET_LAST_SCROLL_Y"; payload: number }
  | { type: "SET_ACTIVE_STAFF"; payload: string | null }
  | { type: "ADD_STAFF"; payload: { staffId: string } }
  | { type: "REMOVE_STAFF"; payload: { staffId: string; removeServices: boolean } }
  | { type: "SET_PRE_SELECTED_STAFF"; payload: { id: string; name: string } | null }
  | { type: "SET_ASSIGNED_STAFF_IDS"; payload: string[] }
  | { type: "BULK_UPDATE_SERVICES"; payload: Partial<TicketService> }
  | { type: "ASSIGN_ALL_TO_STAFF"; payload: { staffId: string; staffName: string } }
  | { type: "SPLIT_TICKET"; payload: { serviceIds: string[]; keepClient: boolean; newDiscount: number; newAssignedStaffIds: string[]; newActiveStaffId: string | null } }
  | { type: "MERGE_TICKETS"; payload: { services: TicketService[]; discount: number; staffIds: string[] } }
  | { type: "VOID_TICKET" }
  | { type: "UNDO_LAST_ACTION" }
  | { type: "RESET_TICKET" };

// ============================================================================
// INITIAL STATE
// ============================================================================

const getDefaultMode = (): PanelMode => {
  if (typeof window === "undefined") return "dock";
  const saved = localStorage.getItem("checkout-default-mode");
  return (saved === "full" || saved === "dock") ? saved : "dock";
};

const createInitialState = (): TicketState => ({
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
  },
  ui: {
    mode: getDefaultMode(),
    selectedCategory: "all",
    fullPageTab: "services",
    addItemTab: "services",
    reassigningServiceIds: [],
    headerVisible: true,
    lastScrollY: 0,
  },
  undoStack: [],
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

function ticketReducer(state: TicketState, action: TicketAction): TicketState {
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
      
      // Normalize services - spread incoming service to preserve price and other fields
      // Handlers construct complete TicketService objects with valid prices
      const normalizedServices: TicketService[] = action.payload.services.map(s => ({
        ...s, // Preserve all incoming fields including price
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
      
      // Normalize product services - spread incoming service to preserve price
      // Handlers construct complete TicketService objects with valid prices
      // Products have duration 0, no staff, and status "completed"
      const normalizedProducts: TicketService[] = action.payload.services.map(s => ({
        ...s, // Preserve all incoming fields including price
        id: s.id || `product-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        serviceId: s.serviceId || s.id || "",
        serviceName: s.serviceName || "Unknown Product",
        duration: 0, // Products always have 0 duration
        staffId: undefined, // Products don't have staff assigned
        staffName: undefined,
        status: "completed" as const, // Products are always completed
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
};

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_OPEN_TICKETS: OpenTicket[] = [
  {
    id: "ticket-1",
    client: {
      id: "client-1",
      firstName: "Sarah",
      lastName: "Johnson",
      phone: "+1 555-123-4567",
      email: "sarah.j@email.com",
    },
    services: [
      { id: "s1", serviceId: "1", serviceName: "Haircut - Women", price: 65, duration: 60, status: "in_progress" as const },
      { id: "s2", serviceId: "3", serviceName: "Color - Full", price: 120, duration: 120, status: "not_started" as const },
    ],
    subtotal: 185,
    tax: 15.73,
    discount: 0,
    total: 200.73,
    createdAt: new Date(Date.now() - 45 * 60000),
  },
  {
    id: "ticket-2",
    client: {
      id: "client-2",
      firstName: "Mike",
      lastName: "Chen",
      phone: "+1 555-987-6543",
    },
    services: [
      { id: "s3", serviceId: "2", serviceName: "Haircut - Men", price: 45, duration: 45, status: "completed" as const },
    ],
    subtotal: 45,
    tax: 3.83,
    discount: 0,
    total: 48.83,
    createdAt: new Date(Date.now() - 30 * 60000),
  },
  {
    id: "ticket-3",
    client: null,
    services: [
      { id: "s4", serviceId: "6", serviceName: "Manicure", price: 35, duration: 30, status: "in_progress" as const },
      { id: "s5", serviceId: "7", serviceName: "Pedicure", price: 50, duration: 45, status: "not_started" as const },
    ],
    subtotal: 85,
    tax: 7.23,
    discount: 10,
    total: 82.23,
    createdAt: new Date(Date.now() - 15 * 60000),
  },
];

// ============================================================================
// CHECKOUT FOOTER COMPONENT
// ============================================================================

interface CheckoutFooterProps {
  services: TicketService[];
  selectedClient: Client | null;
  subtotal: number;
  total: number;
  discount: number;
  appliedPointsDiscount: number;
  appliedCoupon: CouponData | null;
  couponDiscount: number;
  appliedGiftCards: GiftCardData[];
  giftCardTotal: number;
  canCheckout: boolean;
  onApplyPointsRedemption: (points: number, discountValue: number) => void;
  onRemovePointsRedemption: () => void;
  onApplyCoupon: (coupon: CouponData) => void;
  onRemoveCoupon: () => void;
  onApplyGiftCard: (giftCard: GiftCardData) => void;
  onRemoveGiftCard: (code: string) => void;
  onCheckout: () => void;
}

const KEYBOARD_HINTS_DISMISSED_KEY = "mango-pos-keyboard-hints-dismissed";

function KeyboardShortcutsHint({
  onDismiss,
  onShowShortcuts,
}: {
  onDismiss: () => void;
  onShowShortcuts: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between gap-2 px-3 py-2 bg-muted/50 border-b text-xs"
      data-testid="banner-keyboard-hints"
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Keyboard className="h-3.5 w-3.5" />
        <span>
          Press{" "}
          <button
            onClick={onShowShortcuts}
            className="font-mono text-foreground hover:underline focus:outline-none focus:underline"
            data-testid="button-show-shortcuts-hint"
          >
            ?
          </button>{" "}
          for keyboard shortcuts
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 hover:bg-transparent"
        onClick={onDismiss}
        data-testid="button-dismiss-keyboard-hints"
        aria-label="Dismiss keyboard shortcuts hint"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function CheckoutFooter({
  services,
  selectedClient,
  subtotal,
  total,
  discount,
  appliedPointsDiscount,
  appliedCoupon,
  couponDiscount,
  appliedGiftCards,
  giftCardTotal,
  canCheckout,
  onApplyPointsRedemption,
  onRemovePointsRedemption,
  onApplyCoupon,
  onRemoveCoupon,
  onApplyGiftCard,
  onRemoveGiftCard,
  onCheckout,
}: CheckoutFooterProps) {
  const [discountsExpanded, setDiscountsExpanded] = useState(false);
  
  const hasPointsDiscount = appliedPointsDiscount > 0;
  const hasCoupon = appliedCoupon !== null;
  const hasGiftCards = appliedGiftCards.length > 0;
  
  const discountCount = (hasPointsDiscount ? 1 : 0) + (hasCoupon ? 1 : 0) + appliedGiftCards.length;
  const totalDiscountAmount = appliedPointsDiscount + couponDiscount + giftCardTotal;
  
  // Note: Discount collapsed/expanded state is controlled by user interaction only
  // Discount chips will naturally show when collapsed and discounts exist
  
  const showRewardsSection = selectedClient && (selectedClient.rewardPoints || 0) >= 100;
  const hasAnyDiscountOptions = services.length > 0;

  return (
    <div className="border-t bg-card flex flex-col">
      {hasAnyDiscountOptions && (
        <div className="px-4 pt-3">
          <Collapsible open={discountsExpanded} onOpenChange={setDiscountsExpanded}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between h-9 px-2 text-muted-foreground hover:text-foreground"
                data-testid="button-toggle-discounts"
              >
                <span className="flex items-center gap-2 text-sm">
                  <Tag className="h-4 w-4" />
                  {discountCount > 0 ? (
                    <span>
                      {discountCount} discount{discountCount !== 1 ? "s" : ""} applied
                      <span className="ml-1 text-green-600 dark:text-green-400">
                        (-${totalDiscountAmount.toFixed(2)})
                      </span>
                    </span>
                  ) : (
                    "Add discounts"
                  )}
                </span>
                {discountsExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-3">
              {showRewardsSection && (
                <RewardPointsRedemption
                  client={selectedClient}
                  subtotal={subtotal}
                  currentDiscount={discount}
                  onApplyPoints={onApplyPointsRedemption}
                  onRemovePointsRedemption={onRemovePointsRedemption}
                  appliedPointsDiscount={appliedPointsDiscount}
                />
              )}
              
              <CouponEntry
                subtotal={subtotal}
                onApplyCoupon={onApplyCoupon}
                onRemoveCoupon={onRemoveCoupon}
                appliedCoupon={appliedCoupon}
                disabled={services.length === 0}
              />
              
              <GiftCardEntry
                remainingTotal={total}
                onApplyGiftCard={onApplyGiftCard}
                onRemoveGiftCard={onRemoveGiftCard}
                appliedGiftCards={appliedGiftCards}
                disabled={services.length === 0}
              />
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
      
      <div className="sticky bottom-0 z-50 bg-card border-t shadow-[0_-2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_-2px_10px_rgba(0,0,0,0.2)]">
        <div className="p-4 space-y-3">
          {discountCount > 0 && !discountsExpanded && (
            <div className="flex flex-wrap gap-2" data-testid="container-discount-chips">
              {hasPointsDiscount && (
                <Badge 
                  variant="outline" 
                  className="gap-1 pr-1 text-green-600 dark:text-green-400 border-green-500/20"
                  data-testid="chip-points-discount"
                >
                  <Award className="h-4 w-4" />
                  Points: -${appliedPointsDiscount.toFixed(2)}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1 hover:bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemovePointsRedemption();
                    }}
                    data-testid="button-remove-points-chip"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </Badge>
              )}
              
              {hasCoupon && (
                <Badge 
                  variant="outline" 
                  className="gap-1 pr-1 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  data-testid="chip-coupon-discount"
                >
                  <Tag className="h-4 w-4" />
                  {appliedCoupon.code}: {appliedCoupon.discountType === "percentage" 
                    ? `-${appliedCoupon.discount}%` 
                    : `-$${appliedCoupon.discount}`}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1 hover:bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveCoupon();
                    }}
                    data-testid="button-remove-coupon-chip"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </Badge>
              )}
              
              {appliedGiftCards.map((gc) => (
                <Badge 
                  key={gc.code}
                  variant="outline" 
                  className="gap-1 pr-1 text-purple-600 dark:text-purple-400 border-purple-500/20"
                  data-testid={`chip-gift-card-${gc.code}`}
                >
                  <Gift className="h-4 w-4" />
                  Gift: ${gc.amountUsed.toFixed(2)}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1 hover:bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveGiftCard(gc.code);
                    }}
                    data-testid={`button-remove-gift-card-chip-${gc.code}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total</span>
            <div className="text-right">
              {giftCardTotal > 0 && (
                <div className="text-xs text-muted-foreground line-through">
                  ${total.toFixed(2)}
                </div>
              )}
              <span className="font-bold text-2xl" data-testid="text-footer-total">
                ${Math.max(0, total - giftCardTotal).toFixed(2)}
              </span>
            </div>
          </div>
          <Button
            className="w-full h-12 text-base font-medium"
            disabled={!canCheckout}
            onClick={onCheckout}
            data-testid="button-checkout-footer"
          >
            {canCheckout
              ? "Continue To Payment"
              : "Get started above"}
          </Button>
        </div>
      </div>
    </div>
  );
}

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

  const [state, dispatch] = useReducer(ticketReducer, undefined, createInitialState);
  
  const [keyboardHintsDismissed, setKeyboardHintsDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(KEYBOARD_HINTS_DISMISSED_KEY) === "true";
  });

  const handleDismissKeyboardHints = () => {
    setKeyboardHintsDismissed(true);
    localStorage.setItem(KEYBOARD_HINTS_DISMISSED_KEY, "true");
  };

  const {
    services,
    selectedClient,
    discounts,
    staff,
    dialogs,
    ui,
    undoStack,
  } = state;

  const {
    discount,
    hasDiscount,
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
  } = dialogs;

  const {
    mode,
    selectedCategory,
    fullPageTab,
    addItemTab,
    reassigningServiceIds,
    headerVisible,
    lastScrollY,
  } = ui;

  const subtotal = services.reduce((sum, s) => sum + s.price, 0);
  const discountedSubtotal = subtotal - discount - appliedPointsDiscount - couponDiscount;
  const tax = Math.max(0, discountedSubtotal) * 0.085;
  const total = Math.max(0, discountedSubtotal) + tax;
  const giftCardTotal = appliedGiftCards.reduce((sum, gc) => sum + gc.amountUsed, 0);
  const canCheckout = services.length > 0 && total > 0;

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
    dispatch(ticketActions.updateService(serviceId, updates));
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
    if (client === null && selectedClient && services.length > 0) {
      dispatch(ticketActions.toggleDialog("showRemoveClientConfirm", true));
    } else if (client) {
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

  const handleApplyCoupon = (coupon: CouponData) => {
    const discountValue =
      coupon.discountType === "percentage"
        ? (subtotal * coupon.discount) / 100
        : coupon.discount;
    
    dispatch(ticketActions.applyCoupon(coupon, discountValue, true));
    
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    
    toast({
      title: "Coupon Applied",
      description: `${coupon.code}: ${coupon.description} (-$${discountValue.toFixed(2)})`,
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

  const handleRemoveCoupon = () => {
    dispatch(ticketActions.removeCoupon());
    toast({
      title: "Coupon Removed",
      description: "Coupon discount has been removed",
    });
  };

  const handleApplyGiftCard = (giftCard: GiftCardData) => {
    dispatch(ticketActions.applyGiftCard(giftCard));
    toast({
      title: "Gift Card Applied",
      description: `${giftCard.code}: $${giftCard.amountUsed.toFixed(2)} applied`,
    });
  };

  const handleRemoveGiftCard = (code: string) => {
    dispatch(ticketActions.removeGiftCard(code));
    toast({
      title: "Gift Card Removed",
      description: `Gift card ${code} has been removed`,
    });
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

  const handleApplyPointsRedemption = (pointsToRedeem: number, discountValue: number) => {
    dispatch(ticketActions.applyPoints(pointsToRedeem, discountValue));
    toast({
      title: "Reward Points Applied",
      description: `${pointsToRedeem.toLocaleString()} points redeemed for $${discountValue.toFixed(2)} discount`,
    });
  };

  const handleRemovePointsRedemption = () => {
    dispatch(ticketActions.removePoints());
    toast({
      title: "Points Redemption Removed",
      description: "Reward points discount has been removed",
    });
  };

  const handleApplyDiscount = (data: {
    type: "percentage" | "fixed";
    amount: number;
    reason: string;
  }) => {
    const discountValue =
      data.type === "percentage" ? (subtotal * data.amount) / 100 : data.amount;
    dispatch(ticketActions.applyDiscount(discountValue));
    
    toast({
      title: "Discount Applied",
      description: `${data.type === "percentage" ? `${data.amount}%` : `$${data.amount.toFixed(2)}`} discount applied${data.reason ? ` - ${data.reason}` : ''}`,
    });
  };

  const handleRemoveDiscount = () => {
    dispatch(ticketActions.removeDiscount());
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

  const handleCompletePayment = (payment: any) => {
    services.forEach((s) => {
      if (s.status !== "completed") {
        dispatch(ticketActions.updateService(s.id, { status: "completed" }));
      }
    });
    
    console.log("Payment completed:", { selectedClient, services, payment });
    dispatch(ticketActions.toggleDialog("showPaymentModal", false));
    
    toast({
      title: "Payment Complete!",
      description: `Successfully processed payment of $${total.toFixed(2)}. Ticket will close shortly.`,
      duration: 3000,
    });
    
    const closeTimeout = setTimeout(() => {
      onClose();
    }, 2000);
    
    if (checkoutCloseTimeoutRef.current) {
      clearTimeout(checkoutCloseTimeoutRef.current);
    }
    checkoutCloseTimeoutRef.current = closeTimeout;
  };

  const handleReset = () => {
    if (selectedClient || services.length > 0) {
      dispatch(ticketActions.toggleDialog("showDiscardTicketConfirm", true));
    } else {
      performReset();
    }
  };
  
  const performReset = () => {
    dispatch(ticketActions.resetTicket());
  };

  const handleBulkUpdate = (updates: Partial<TicketService>) => {
    dispatch(ticketActions.bulkUpdateServices(updates));
  };

  const handleAssignAllToStaff = (staffId: string) => {
    const staffMember = staffMembers.find((s) => s.id === staffId);
    if (!staffMember) return;
    dispatch(ticketActions.assignAllToStaff(staffId, staffMember.name));
  };

  const getClientStatus = () => {
    if (selectedClient) {
      return {
        complete: true,
        label: `${selectedClient.firstName} ${selectedClient.lastName}`,
      };
    }
    return { complete: false, label: "Select client" };
  };

  const getServicesStatus = () => {
    if (services.length === 0) {
      return { complete: false, label: "Add services" };
    }
    const unassigned = services.filter((s) => !s.staffId).length;
    if (unassigned > 0) {
      return {
        complete: false,
        label: `${unassigned} service${unassigned > 1 ? "s" : ""} need staff`,
      };
    }
    return { complete: true, label: `${services.length} service${services.length > 1 ? "s" : ""}` };
  };

  const clientStatus = getClientStatus();
  const servicesStatus = getServicesStatus();

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
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed right-0 top-0 bottom-0 bg-background border-l shadow-xl z-50 transition-all duration-200 ease-out flex flex-col ${
          mode === "dock" ? "w-full md:w-[900px]" : "w-full"
        }`}
      >
        <div 
          className={`flex items-center justify-between px-2 py-1.5 border-b bg-card transition-transform duration-200 ${
            headerVisible ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              data-testid="button-close-panel"
              className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive shrink-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label="Close checkout panel"
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="flex items-baseline gap-2 flex-1 min-w-0">
              <span className="text-sm font-normal text-muted-foreground">New Ticket</span>
              <span className="text-xs text-muted-foreground/60 truncate">
                #{Math.random().toString(36).substr(2, 9).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowKeyboardShortcuts(true)}
                  data-testid="button-shortcuts"
                  className="h-7 w-7 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  aria-label="Show keyboard shortcuts"
                >
                  <Keyboard className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  Keyboard Shortcuts
                  <br />
                  <span className="text-muted-foreground">Press ?</span>
                </p>
              </TooltipContent>
            </Tooltip>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              data-testid="button-clear"
              className="hidden sm:inline-flex h-7 text-xs"
            >
              Clear
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMode(mode === "dock" ? "full" : "dock")}
                  data-testid="button-toggle-mode"
                  className="hidden md:inline-flex h-7 w-7 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  aria-label={mode === "dock" ? "Expand to full screen" : "Switch to docked view"}
                >
                  {mode === "dock" ? (
                    <Maximize2 className="h-3.5 w-3.5" />
                  ) : (
                    <Minimize2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {mode === "dock" ? "Expand to full page" : "Switch to partial view"}
                  <br />
                  <span className="text-muted-foreground">Preference saved automatically</span>
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {mode === "dock" && !keyboardHintsDismissed && (
          <KeyboardShortcutsHint
            onDismiss={handleDismissKeyboardHints}
            onShowShortcuts={() => setShowKeyboardShortcuts(true)}
          />
        )}

        <div 
          className="flex-1 overflow-hidden" 
          data-scroll-container
          role="main"
          aria-label="Checkout panel content"
        >
          {mode === "full" && (
            <div className="h-full px-3 sm:px-4 lg:px-6 pb-24 sm:pb-0">
              <div className={`h-full grid gap-0 lg:gap-0 ${
                fullPageTab === "services"
                  ? "grid-cols-1 lg:grid-cols-[180px_1fr_506px]"
                  : "grid-cols-1 lg:grid-cols-[1fr_506px]"
              }`}>
                <div className={`hidden lg:block ${
                  fullPageTab === "services" ? "lg:col-span-2" : "lg:col-span-1"
                } h-full pr-6`}>
                  <div className="flex flex-col h-full">
                    <div className="flex gap-1 mb-2 p-1 bg-muted rounded-lg">
                      <Button
                        variant={fullPageTab === "services" ? "default" : "ghost"}
                        size="sm"
                        className="flex-1 h-9"
                        onClick={() => setFullPageTab("services")}
                        data-testid="button-tab-services"
                      >
                        <Scissors className="h-4 w-4 mr-2" />
                        Services
                      </Button>
                      <Button
                        variant={fullPageTab === "staff" ? "default" : "ghost"}
                        size="sm"
                        className="flex-1 h-9"
                        onClick={() => setFullPageTab("staff")}
                        data-testid="button-tab-staff"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Staff
                      </Button>
                    </div>

                    <div className={`flex-1 min-h-0 grid gap-6 ${
                      fullPageTab === "services" ? "grid-cols-[180px_1fr]" : "grid-cols-1"
                    }`}>
                      {fullPageTab === "services" && (
                        <div className="h-full overflow-hidden">
                          <CategoryList
                            selectedCategory={selectedCategory}
                            onSelectCategory={setSelectedCategory}
                          />
                        </div>
                      )}

                      <div className="h-full overflow-hidden">
                        {fullPageTab === "services" ? (
                          <FullPageServiceSelector
                            selectedCategory={selectedCategory}
                            onSelectCategory={setSelectedCategory}
                            onAddServices={handleAddServices}
                            staffMembers={staffMembers}
                            activeStaffId={activeStaffId}
                          />
                        ) : (
                          <StaffGridView
                            staffMembers={staffMembers}
                            services={services}
                            onAddServiceToStaff={handleAddServiceToStaff}
                            reassigningServiceIds={reassigningServiceIds}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-full border-l pl-6 overflow-hidden">
                  <InteractiveSummary
                    selectedClient={selectedClient}
                    services={services}
                    staffMembers={staffMembers}
                    subtotal={subtotal}
                    tax={tax}
                    total={total}
                    onCheckout={handleCheckout}
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
                  />
                </div>
              </div>
            </div>
          )}

          {/* Dock Mode - Unified layout matching full mode */}
          {mode === "dock" && (
            <div className="h-full px-3 sm:px-4 lg:px-6 pb-24 sm:pb-0">
              <div className={`h-full grid gap-0 lg:gap-0 ${
                fullPageTab === "services"
                  ? "grid-cols-1 lg:grid-cols-[140px_1fr_380px]"
                  : "grid-cols-1 lg:grid-cols-[1fr_380px]"
              }`}>
                {/* Left Side - Services/Staff Tabs (compact width for dock) */}
                <div className={`hidden lg:block ${
                  fullPageTab === "services" ? "lg:col-span-2" : "lg:col-span-1"
                } h-full pr-4`}>
                  <div className="flex flex-col h-full">
                    {/* Services/Staff Tab Buttons */}
                    <div className="flex gap-1 mb-2 p-1 bg-muted rounded-lg">
                      <Button
                        variant={fullPageTab === "services" ? "default" : "ghost"}
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => setFullPageTab("services")}
                        data-testid="button-dock-tab-services"
                      >
                        <Scissors className="h-3.5 w-3.5 mr-1.5" />
                        Services
                      </Button>
                      <Button
                        variant={fullPageTab === "staff" ? "default" : "ghost"}
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => setFullPageTab("staff")}
                        data-testid="button-dock-tab-staff"
                      >
                        <User className="h-3.5 w-3.5 mr-1.5" />
                        Staff
                      </Button>
                    </div>

                    {/* Category List + Service/Staff Grid */}
                    <div className={`flex-1 min-h-0 grid gap-4 ${
                      fullPageTab === "services" ? "grid-cols-[140px_1fr]" : "grid-cols-1"
                    }`}>
                      {fullPageTab === "services" && (
                        <div className="h-full overflow-hidden">
                          <CategoryList
                            selectedCategory={selectedCategory}
                            onSelectCategory={setSelectedCategory}
                          />
                        </div>
                      )}

                      <div className="h-full overflow-hidden">
                        {fullPageTab === "services" ? (
                          <FullPageServiceSelector
                            selectedCategory={selectedCategory}
                            onSelectCategory={setSelectedCategory}
                            onAddServices={handleAddServices}
                            staffMembers={staffMembers}
                            activeStaffId={activeStaffId}
                          />
                        ) : (
                          <StaffGridView
                            staffMembers={staffMembers}
                            services={services}
                            onAddServiceToStaff={handleAddServiceToStaff}
                            reassigningServiceIds={reassigningServiceIds}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side - Interactive Summary (identical to full mode) */}
                <div className="h-full border-l pl-4 overflow-hidden">
                  <InteractiveSummary
                    selectedClient={selectedClient}
                    services={services}
                    staffMembers={staffMembers}
                    subtotal={subtotal}
                    tax={tax}
                    total={total}
                    onCheckout={handleCheckout}
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
                  />
                </div>
              </div>

              {/* Mobile-only: Add Item/Staff Buttons (hidden on desktop) */}
              <div className="flex items-center gap-2 mt-3 lg:hidden">
                <Button
                  variant="outline"
                  className="flex-1 h-11 justify-center gap-2"
                  onClick={() => setShowServicesOnMobile(true)}
                  data-testid="button-add-item"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Item</span>
                </Button>
                <span className="text-sm text-muted-foreground">or</span>
                <Button
                  variant="outline"
                  className="flex-1 h-11 justify-center gap-2"
                  onClick={() => setShowStaffOnMobile(true)}
                  data-testid="button-add-staff"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Staff</span>
                </Button>
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
        staffMembers={staffMembers.map((s) => ({ id: s.id, name: s.name }))}
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

      <AlertDialog open={showDiscardTicketConfirm} onOpenChange={setShowDiscardTicketConfirm}>
        <AlertDialogContent data-testid="dialog-discard-ticket">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Discard Ticket?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to discard this ticket? {selectedClient && `Client: ${selectedClient.firstName} ${selectedClient.lastName}.`} {services.length > 0 && `${services.length} service(s) will be lost.`} This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-discard">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={performReset}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-discard"
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      <ServicePackages
        open={showServicePackages}
        onOpenChange={setShowServicePackages}
        staffMembers={staffMembers}
        onSelectPackage={handleAddPackage}
      />

      <ProductSales
        open={showProductSales}
        onOpenChange={setShowProductSales}
        onAddProducts={handleAddProducts}
      />

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
    </>
  );
}
