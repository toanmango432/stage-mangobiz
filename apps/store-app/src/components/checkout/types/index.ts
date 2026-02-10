/**
 * TicketPanel Type Definitions
 *
 * Extracted from TicketPanel.tsx for better organization and reusability.
 */

import type { TicketService } from "../ServiceList";
import type { Client } from "../ClientSelector";

// ============================================================================
// COUPON & GIFT CARD TYPES
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

// ============================================================================
// STATE INTERFACES
// ============================================================================

export interface DiscountState {
  discount: number;
  hasDiscount: boolean;
  appliedPointsDiscount: number;
  redeemedPoints: number;
  appliedCoupon: CouponData | null;
  couponDiscount: number;
  appliedGiftCards: GiftCardData[];
}

export interface StaffState {
  activeStaffId: string | null;
  assignedStaffIds: string[];
  preSelectedStaff: { id: string; name: string } | null;
}

export type DialogKey =
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
  | "showMergeTicketsDialog"
  | "showClientSelector"
  | "showClientProfile";

export interface DialogState {
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
  showClientSelector: boolean;
  showClientProfile: boolean;
}

export type PanelMode = "dock" | "full";

export interface UIState {
  mode: PanelMode;
  selectedCategory: string;
  fullPageTab: "services" | "staff";
  addItemTab: "services" | "products" | "packages" | "giftcards";
  reassigningServiceIds: string[];
  headerVisible: boolean;
  lastScrollY: number;
  searchQuery: string;
}

export interface UndoSnapshot {
  services: TicketService[];
  selectedClient: Client | null;
  discounts: DiscountState;
  staff: StaffState;
  actionDescription: string;
}

export interface TicketState {
  ticketId: string | null;
  services: TicketService[];
  selectedClient: Client | null;
  discounts: DiscountState;
  staff: StaffState;
  dialogs: DialogState;
  ui: UIState;
  undoStack: UndoSnapshot[];
  isNewTicket: boolean;
  isFromWaitingQueue: boolean;
}

// ============================================================================
// ACTION TYPES
// ============================================================================

export type TicketAction =
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
  | { type: "SET_SEARCH_QUERY"; payload: string }
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
  | { type: "RESET_TICKET" }
  | { type: "CLEAR_SERVICES" }
  | { type: "MARK_TICKET_SAVED" }
  | { type: "SET_TICKET_ID"; payload: string | null }
  | { type: "SET_IS_FROM_WAITING_QUEUE"; payload: boolean };
