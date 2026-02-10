import { useState, useEffect, useRef, useReducer, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectHasPriceChangeWarning } from "@/store/slices/uiTicketsSlice";
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
import { Suspense } from 'react';
import { LazyPaymentModal, ModalLoadingFallback } from './LazyModals'; // lazy load PaymentModal
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
import PriceChangeWarningBanner from "./PriceChangeWarningBanner";
import PriceResolutionModal from "./PriceResolutionModal";
import { ItemTabBar } from "./ItemTabBar";
import { ProductGrid } from "./ProductGrid";
import { PackageGrid } from "./PackageGrid";
import { GiftCardGrid } from "./GiftCardGrid";
import type { GiftCardSaleData } from "./modals/SellGiftCardModal";
import { getProductsByCategory } from "@/data/mockProducts";
import { getPackagesByCategory } from "@/data/mockPackages";
import { useCatalog } from "@/hooks/useCatalog";
import { dataService } from "@/services/dataService";
import { storeAuthManager } from "@/services/storeAuthManager";
// Import extracted types, reducer, constants, and components
import type { PanelMode } from "./types";
import { createInitialState, ticketReducer, ticketActions } from "./reducers/ticketReducer";
import { MOCK_OPEN_TICKETS, KEYBOARD_HINTS_DISMISSED_KEY, DEFAULT_TAX_RATE } from "./constants";
import {
  KeyboardShortcutsHint,
  ClientProfileDialog,
  RemoveClientDialog,
  PreventStaffRemovalDialog,
  ClientSelectorSheet
} from "./components";
import { CatalogPanel } from "./components/CatalogPanel";
import { useTicketKeyboard, useTicketPersistence, useTicketActions } from "./hooks";
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
  const checkoutCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reduxDispatch = useAppDispatch();

  const [state, dispatch] = useReducer(ticketReducer, undefined, createInitialState);

  // Keyboard hints state - kept for future use when hints banner is re-enabled
  const [keyboardHintsDismissed, setKeyboardHintsDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(KEYBOARD_HINTS_DISMISSED_KEY) === "true";
  });
  void keyboardHintsDismissed; // Suppress unused warning - kept for future use

  // Gift card catalog data
  const catalogStoreId = storeAuthManager.getState().store?.storeId || '';
  const catalogTenantId = storeAuthManager.getState().store?.tenantId || catalogStoreId;
  const { giftCardDenominations, giftCardSettings } = useCatalog({ storeId: catalogStoreId, tenantId: catalogTenantId });

  const handleDismissKeyboardHints = () => {
    setKeyboardHintsDismissed(true);
    localStorage.setItem(KEYBOARD_HINTS_DISMISSED_KEY, "true");
  };
  void handleDismissKeyboardHints; // Suppress unused warning - kept for future use

  // ============================================================================
  // TICKET PERSISTENCE & AUTO-SAVE
  // Handles loading pending tickets from localStorage and auto-saving changes
  // ============================================================================
  const { performAutoSave } = useTicketPersistence({
    isOpen,
    ticketId: state.ticketId,
    services: state.services,
    selectedClient: state.selectedClient,
    discounts: state.discounts,
    dispatch,
    reduxDispatch,
  });

  const {
    ticketId,
    services,
    selectedClient,
    discounts,
    staff,
    dialogs,
    ui,
    isNewTicket,
    isFromWaitingQueue,
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

  // Price change resolution modal state
  const [showPriceResolutionModal, setShowPriceResolutionModal] = useState(false);

  // Search input visibility state
  const [showSearchInput, setShowSearchInput] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Check if ticket has unresolved price changes
  const hasPriceChangeWarning = useAppSelector(selectHasPriceChangeWarning(ticketId || ''));

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
  const tax = Math.max(0, discountedSubtotal) * DEFAULT_TAX_RATE;
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

  // Helper for dialog toggles
  const setShowDiscardTicketConfirm = (value: boolean) => dispatch(ticketActions.toggleDialog("showDiscardTicketConfirm", value));

  // ============================================================================
  // TICKET ACTIONS HOOK - All ticket action handlers
  // ============================================================================
  const {
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
    handleCompletePayment,
    handleReset,
    handleCloseAttempt,
  } = useTicketActions({
    state,
    dispatch,
    toast,
    staffMembers,
    onClose,
    setShowDiscardTicketConfirm,
    checkoutCloseTimeoutRef,
  });

  useEffect(() => {
    localStorage.setItem("checkout-default-mode", mode);
  }, [mode]);

  // Focus search input when it becomes visible
  useEffect(() => {
    if (showSearchInput && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [showSearchInput]);

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

  useTicketKeyboard({
    isOpen,
    showKeyboardShortcuts,
    showPaymentModal,
    canCheckout,
    onClose,
    onShowKeyboardShortcuts: (show: boolean) => dispatch(ticketActions.toggleDialog("showKeyboardShortcuts", show)),
    onShowPaymentModal: (show: boolean) => dispatch(ticketActions.toggleDialog("showPaymentModal", show)),
    onSetFullPageTab: (tab: "services" | "staff") => dispatch(ticketActions.setFullPageTab(tab)),
    handleCheckout,
  });

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
  const setShowPreventStaffRemoval = (value: boolean) => dispatch(ticketActions.toggleDialog("showPreventStaffRemoval", value));
  const setShowKeyboardShortcuts = (value: boolean) => dispatch(ticketActions.toggleDialog("showKeyboardShortcuts", value));
  const setShowSplitTicketDialog = (value: boolean) => dispatch(ticketActions.toggleDialog("showSplitTicketDialog", value));
  const setShowMergeTicketsDialog = (value: boolean) => dispatch(ticketActions.toggleDialog("showMergeTicketsDialog", value));
  const setPreSelectedStaff = (staff: { id: string; name: string } | null) => dispatch(ticketActions.setPreSelectedStaff(staff));

  const assignedStaffIdsSet = new Set(assignedStaffIds);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-[60] transition-opacity ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        onClick={handleCloseAttempt}
      />

      <div
        className={`fixed right-0 top-0 bottom-0 bg-background border-l shadow-xl z-[70] transition-all duration-200 ease-out flex flex-col ${mode === "dock" ? "w-full md:w-[900px]" : "w-full"
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
                    minRightWidth={370}
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
                                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${selectedClient.loyaltyStatus === 'gold'
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
                                  onClick={isFromWaitingQueue ? handleStartService : handleCheckIn}
                                  disabled={services.length === 0}
                                  className="h-10 w-10 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                                >
                                  <LogIn className="h-5 w-5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">{isFromWaitingQueue ? "Start service" : "Check in client"}</p>
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

                        {/* Price Change Warning Banner */}
                        {ticketId && hasPriceChangeWarning && (
                          <div className="px-3 pt-2">
                            <PriceChangeWarningBanner
                              ticketId={ticketId}
                              onReview={() => setShowPriceResolutionModal(true)}
                            />
                          </div>
                        )}

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
                    <CatalogPanel
                      fullPageTab={fullPageTab}
                      addItemTab={addItemTab}
                      selectedCategory={selectedCategory}
                      searchQuery={searchQuery}
                      mode={mode}
                      staffMembers={staffMembers}
                      services={services}
                      activeStaffId={activeStaffId}
                      reassigningServiceIds={reassigningServiceIds}
                      giftCardDenominations={giftCardDenominations || []}
                      giftCardSettings={giftCardSettings}
                      onSetMode={setMode}
                      onSetFullPageTab={setFullPageTab}
                      onSetAddItemTab={setAddItemTab}
                      onSetSelectedCategory={setSelectedCategory}
                      onSetSearchQuery={setSearchQuery}
                      onAddServices={handleAddServices}
                      onAddServiceToStaff={handleAddServiceToStaff}
                      onAddGiftCard={handleAddGiftCard}
                    />
                  </ResizablePanel>
                </div>
              </div>

              {/* Mobile Layout - Full screen ticket view */}
              <div className="flex-1 flex flex-col min-h-0 lg:hidden">
                {/* Price Change Warning Banner - Mobile Full Mode */}
                {ticketId && hasPriceChangeWarning && (
                  <div className="px-3 py-2">
                    <PriceChangeWarningBanner
                      ticketId={ticketId}
                      onReview={() => setShowPriceResolutionModal(true)}
                    />
                  </div>
                )}
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
                  minRightWidth={370}
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
                        {/* Right: Check In/Start + Reset */}
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={isFromWaitingQueue ? handleStartService : handleCheckIn}
                                disabled={services.length === 0}
                                className="h-7 px-2 rounded-md text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                              >
                                <LogIn className="h-3.5 w-3.5" />
                                <span>{isFromWaitingQueue ? "Start" : "Check In"}</span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent><p className="text-xs">{isFromWaitingQueue ? "Start service" : "Check in client"}</p></TooltipContent>
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

                      {/* Price Change Warning Banner */}
                      {ticketId && hasPriceChangeWarning && (
                        <div className="px-2 pt-2">
                          <PriceChangeWarningBanner
                            ticketId={ticketId}
                            onReview={() => setShowPriceResolutionModal(true)}
                          />
                        </div>
                      )}

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
                  <CatalogPanel
                    fullPageTab={fullPageTab}
                    addItemTab={addItemTab}
                    selectedCategory={selectedCategory}
                    searchQuery={searchQuery}
                    mode={mode}
                    staffMembers={staffMembers}
                    services={services}
                    activeStaffId={activeStaffId}
                    reassigningServiceIds={reassigningServiceIds}
                    giftCardDenominations={giftCardDenominations || []}
                    giftCardSettings={giftCardSettings}
                    onSetMode={setMode}
                    onSetFullPageTab={setFullPageTab}
                    onSetAddItemTab={setAddItemTab}
                    onSetSelectedCategory={setSelectedCategory}
                    onSetSearchQuery={setSearchQuery}
                    onAddServices={handleAddServices}
                    onAddServiceToStaff={handleAddServiceToStaff}
                    onAddGiftCard={handleAddGiftCard}
                  />
                </ResizablePanel>
              </div>

              {/* Mobile Layout - Full screen ticket view (Dock Mode) */}
              <div className="flex-1 flex flex-col min-h-0 lg:hidden pt-14">
                {/* Price Change Warning Banner - Mobile Dock Mode */}
                {ticketId && hasPriceChangeWarning && (
                  <div className="px-3 py-2">
                    <PriceChangeWarningBanner
                      ticketId={ticketId}
                      onReview={() => setShowPriceResolutionModal(true)}
                    />
                  </div>
                )}
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

      {/* PaymentModal - Lazy Loaded */}
      {showPaymentModal && (
        <Suspense fallback={<ModalLoadingFallback size="lg" />}>
          <LazyPaymentModal
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
            onShowReceipt={() => {
              setShowPaymentModal(false);
              setShowReceiptPreview(true);
            }}
            onOpenPriceResolution={() => {
              setShowPaymentModal(false);
              setShowPriceResolutionModal(true);
            }}
          />
        </Suspense>
      )}

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
                      className={`p-4 hover-elevate active-elevate-2 cursor-pointer transition-all ${isAssigned ? 'border-primary' : ''
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
            {/* Check In / Start - Conditional based on isFromWaitingQueue */}
            {isFromWaitingQueue ? (
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-green-50 hover:border-green-300"
                onClick={handleStartService}
                data-testid="button-start"
              >
                <Play className="h-6 w-6 text-green-600" />
                <span className="font-medium">Start</span>
                <span className="text-xs text-muted-foreground">Begin service</span>
              </Button>
            ) : (
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
            )}

            {/* Start Service - Add to In Service (only show when NOT from Waiting Queue) */}
            {!isFromWaitingQueue && (
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
            )}

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

      <RemoveClientDialog
        open={showRemoveClientConfirm}
        onOpenChange={setShowRemoveClientConfirm}
        onConfirm={confirmRemoveClient}
        serviceCount={services.length}
      />

      <PreventStaffRemovalDialog
        open={showPreventStaffRemoval}
        onOpenChange={setShowPreventStaffRemoval}
        message={preventStaffRemovalMessage}
      />

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
      <ClientSelectorSheet
        open={showClientSelector}
        onOpenChange={(open) => dispatch(ticketActions.toggleDialog("showClientSelector", open))}
        onSelectClient={(client) => dispatch(ticketActions.setClient(client))}
        onCreateClient={handleCreateClient}
      />

      {/* Client Profile Dialog - Full Comprehensive Profile */}
      <ClientProfileDialog
        open={showClientProfile}
        onOpenChange={(open) => dispatch(ticketActions.toggleDialog("showClientProfile", open))}
        client={selectedClient}
        onChangeClient={() => {
          dispatch(ticketActions.toggleDialog("showClientProfile", false));
          dispatch(ticketActions.toggleDialog("showClientSelector", true));
        }}
      />

      {/* Price Resolution Modal - For resolving price changes */}
      {ticketId && (
        <PriceResolutionModal
          isOpen={showPriceResolutionModal}
          onClose={() => setShowPriceResolutionModal(false)}
          ticketId={ticketId}
          onResolved={() => {
            // Modal handles the Redux dispatch internally
            // This callback is called after successful resolution
          }}
        />
      )}
    </>
  );
}
