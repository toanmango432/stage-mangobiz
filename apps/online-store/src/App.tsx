import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { PersonalizationProvider } from "@/contexts/PersonalizationContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { OfflineQueue } from "@/components/OfflineQueue";
import { DemoRibbon } from "@/components/DemoRibbon";
import { RealtimeProvider } from "@/providers/RealtimeProvider";
import { pwaRegistration } from "@/lib/pwa/registration";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { AnnouncementBarContainer } from "@/components/promotions/AnnouncementBarContainer";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StoreProvider } from "@/contexts/StoreContext";
import { ChatButton } from "@/components/chat/ChatButton";
import { ChatDrawer } from "@/components/chat/ChatDrawer";
import { useChatToggle } from "@/hooks/useChatToggle";
import Index from "./pages/Index";
import Book from "./pages/Book";
import BookingFlow from "./pages/BookingFlow";
import BookingFlowSimple from "./pages/BookingFlowSimple";
import BookingConfirmation from "./pages/BookingConfirmation";
import BookingSuccess from "./pages/BookingSuccess";
import { BookingPage } from "@/features/booking";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Memberships from "./pages/Memberships";
import GiftCards from "./pages/GiftCards";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Account from "./pages/Account";
import Login from "./pages/Login";
import About from "./pages/info/About";
import Contact from "./pages/info/Contact";
import Gallery from "./pages/info/Gallery";
import Reviews from "./pages/info/Reviews";
import FAQ from "./pages/info/FAQ";
import Policies from "./pages/info/Policies";
import Promotions from "./pages/Promotions";
import Updates from "./pages/Updates";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminStorefront from "./pages/admin/Storefront";
import AdminTemplates from "./pages/admin/Templates";
import AdminTheme from "./pages/admin/storefront/Theme";
import AdminMedia from "./pages/admin/storefront/Media";
import AdminNavigation from "./pages/admin/storefront/Navigation";
import AdminPromotions from "./pages/admin/storefront/Promotions";
import AdminAnnouncements from "./pages/admin/storefront/Announcements";
import AdminContentBuilder from "./pages/admin/storefront/ContentBuilder";
import AdminABTests from "./pages/admin/storefront/ABTests";
import AdminAICopywriter from "./components/admin/ai-copywriter/CopywriterPanel";
import AdminCatalog from "./pages/admin/Catalog";
import Services from "./pages/admin/catalog/Services";
import ServiceForm from "./pages/admin/catalog/ServiceForm";
import Products from "./pages/admin/catalog/Products";
import ProductForm from "./pages/admin/catalog/ProductForm";
import AdminMemberships from "./pages/admin/catalog/Memberships";
import GiftCardSettings from "./pages/admin/catalog/GiftCardSettings";
import AdminBookings from "./pages/admin/Bookings";
import AdminCustomers from "./pages/admin/Customers";
import AdminOrders from "./pages/admin/Orders";
import AdminStaff from "./pages/admin/Staff";
import AdminReports from "./pages/admin/Reports";
import AdminAnalytics from "./pages/admin/Analytics";
import NotFound from "./pages/NotFound";
import Offline from "./pages/Offline";

const queryClient = new QueryClient();

const App = () => {
  console.log('📱 App component rendering...');
  console.log('🔍 App: __MODE__ =', typeof __MODE__ !== 'undefined' ? __MODE__ : 'undefined');

  const { isOpen, open, close } = useChatToggle();
  console.log('💬 Chat toggle initialized');

  // Register PWA service worker
  useEffect(() => {
    console.log('🔧 Registering PWA service worker...');
    pwaRegistration.register();
  }, []);

  console.log('🎬 App component returning JSX...');
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <AuthProvider>
            <ThemeProvider>
              <WishlistProvider>
                <CartProvider>
                  <PersonalizationProvider>
                    <NotificationProvider>
                      <RealtimeProvider>
                        <TooltipProvider>
                          <Toaster />
                          <Sonner />
                          <OfflineIndicator />
                          <OfflineQueue />
                          <DemoRibbon />
                          <BrowserRouter>
                            <Routes>
                              {/* Customer Routes - Including Login */}
                              <Route
                                path="/*"
                                element={
                                  <div className="min-h-screen flex flex-col">
                                    <AnnouncementBarContainer />
                                    <Header />
                                    <main className="flex-1">
                                      <Routes>
                                        <Route path="/" element={<Index />} />
                                        <Route path="/login" element={<Login />} />
                                        <Route path="/book" element={<BookingFlowSimple />} />
                                        {/* Redirect old /book/flow route to /book for backwards compatibility */}
                                        <Route path="/book/flow" element={<Navigate to="/book" replace />} />
                                        <Route path="/book/confirmation" element={<BookingConfirmation />} />
                                        <Route path="/book/success" element={<BookingSuccess />} />
                                        {/* New Booking Module */}
                                        <Route path="/booking" element={<BookingPage />} />
                                        <Route path="/shop" element={<Shop />} />
                                        <Route path="/shop/:productId" element={<ProductDetail />} />
                                        <Route path="/memberships" element={<Memberships />} />
                                        <Route path="/gift-cards" element={<GiftCards />} />
                                        <Route path="/cart" element={<Cart />} />
                                        <Route path="/checkout" element={<Checkout />} />
                                        <Route path="/order-confirmation" element={<OrderConfirmation />} />
                                        <Route path="/account" element={<Account />} />
                                        <Route path="/info/about" element={<About />} />
                                        <Route path="/info/contact" element={<Contact />} />
                                        <Route path="/info/gallery" element={<Gallery />} />
                                        <Route path="/info/reviews" element={<Reviews />} />
                                        <Route path="/info/faq" element={<FAQ />} />
                                        <Route path="/info/policies" element={<Policies />} />
                                        <Route path="/promotions" element={<Promotions />} />
                                        <Route path="/updates" element={<Updates />} />
                                      </Routes>
                                    </main>
                                    <BottomNav />
                                    <ChatButton onClick={open} />
                                    <ChatDrawer isOpen={isOpen} onClose={close} />
                                  </div>
                                }
                              />

                              {/* Admin Routes */}
                              <Route
                                path="/admin/*"
                                element={
                                  <ProtectedRoute requireAdmin>
                                    <StoreProvider>
                                    <AdminLayout>
                                      <Routes>
                                        <Route path="/" element={<AdminDashboard />} />
                                        <Route path="/storefront" element={<AdminStorefront />} />
                                        <Route path="/storefront/templates" element={<AdminTemplates />} />
                                        <Route path="/storefront/theme" element={<AdminTheme />} />
                                        <Route path="/storefront/media" element={<AdminMedia />} />
                                        <Route path="/storefront/navigation" element={<AdminNavigation />} />
                                        <Route path="/storefront/promotions" element={<AdminPromotions />} />
                                        <Route path="/storefront/announcements" element={<AdminAnnouncements />} />
                                        <Route path="/storefront/content-builder" element={<AdminContentBuilder />} />
                                        <Route path="/storefront/ab-tests" element={<AdminABTests />} />
                                        <Route path="/storefront/ai-copywriter" element={<AdminAICopywriter />} />
                                        <Route path="/catalog" element={<AdminCatalog />} />
                                        <Route path="/catalog/services" element={<Services />} />
                                        <Route path="/catalog/services/:id" element={<ServiceForm />} />
                                        <Route path="/catalog/products" element={<Products />} />
                                        <Route path="/catalog/products/:id" element={<ProductForm />} />
                                        <Route path="/catalog/memberships" element={<AdminMemberships />} />
                                        <Route path="/catalog/giftcards" element={<GiftCardSettings />} />
                                        <Route path="/bookings" element={<AdminBookings />} />
                                        <Route path="/customers" element={<AdminCustomers />} />
                                        <Route path="/orders" element={<AdminOrders />} />
                                        <Route path="/staff" element={<AdminStaff />} />
                                        <Route path="/reports" element={<AdminReports />} />
                                        <Route path="/analytics" element={<AdminAnalytics />} />
                                        <Route path="/settings" element={<div>Settings Page</div>} />
                                      </Routes>
                                    </AdminLayout>
                                    </StoreProvider>
                                  </ProtectedRoute>
                                }
                              />

                              {/* Offline */}
                              <Route path="/offline" element={<Offline />} />

                              {/* 404 */}
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </BrowserRouter>
                        </TooltipProvider>
                      </RealtimeProvider>
                    </NotificationProvider>
                  </PersonalizationProvider>
                </CartProvider>
              </WishlistProvider>
            </ThemeProvider>
          </AuthProvider>
        </HelmetProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
