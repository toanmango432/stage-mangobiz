import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, CreditCard, Gift, Package } from "lucide-react";
import { BookingCard } from "@/components/booking/BookingCard";
import { Booking, BookingFormData } from "@/types/booking";
import { Order } from "@/types/order";
import { parseISO, isAfter } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { EditProfileDialog } from "@/components/profile/EditProfileDialog";
import { PreferencesSection } from "@/components/profile/PreferencesSection";
import { SecuritySettings } from "@/components/profile/SecuritySettings";
import { OrderHistoryItem } from "@/components/account/OrderHistoryItem";
import { MembershipCard } from "@/components/account/MembershipCard";
import { GiftCardDisplay } from "@/components/account/GiftCardDisplay";
import { RescheduleModal } from "@/components/booking/RescheduleModal";
import { CancelBookingDialog } from "@/components/booking/CancelBookingDialog";
import { BookingDetailsModal } from "@/components/account/BookingDetailsModal";
import { OrderDetailsModal } from "@/components/account/OrderDetailsModal";
import { isActiveOrder } from "@/lib/utils/orderHelpers";
import { toast } from "@/hooks/use-toast";

const Account = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { addToCart } = useCart();
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [bookingDetailsOpen, setBookingDetailsOpen] = useState(false);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingFormData | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  const bookings: Booking[] = useMemo(() => {
    return JSON.parse(localStorage.getItem('bookings') || '[]');
  }, []);

  const orders: Order[] = useMemo(() => {
    return JSON.parse(localStorage.getItem('mango-orders') || '[]');
  }, []);

  const upcomingBookings = useMemo(() => {
    const now = new Date();
    return bookings
      .filter(b => isAfter(parseISO(b.dateTime), now) && b.status !== 'cancelled')
      .sort((a, b) => parseISO(a.dateTime).getTime() - parseISO(b.dateTime).getTime());
  }, [bookings]);

  const pastBookings = useMemo(() => {
    const now = new Date();
    return bookings
      .filter(b => !isAfter(parseISO(b.dateTime), now) || b.status === 'cancelled')
      .sort((a, b) => parseISO(b.dateTime).getTime() - parseISO(a.dateTime).getTime());
  }, [bookings]);

  const activeOrders = useMemo(() => 
    orders.filter(order => isActiveOrder(order.status)), [orders]
  );

  const pastOrders = useMemo(() => 
    orders.filter(order => !isActiveOrder(order.status)), [orders]
  );

  // Convert Booking to BookingFormData helper
  const convertToFormData = (booking: Booking): BookingFormData => ({
    isGroup: false,
    service: {
      ...booking.service,
      description: '',
    },
    date: booking.dateTime.split('T')[0],
    time: new Date(booking.dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    staff: booking.staff ? {
      ...booking.staff,
      title: 'Stylist',
      rating: 5,
      specialties: [],
      workingHours: {},
      daysOff: [],
    } : undefined,
    addOns: booking.addOns.map(a => ({ ...a, description: '' })),
    client: booking.client,
    specialRequests: booking.specialRequests,
    agreedToPolicies: true,
  });

  // Booking handlers
  const handleReschedule = (booking: Booking) => {
    setSelectedBooking(convertToFormData(booking));
    setRescheduleModalOpen(true);
  };

  const handleCancel = (booking: Booking) => {
    setSelectedBooking(convertToFormData(booking));
    setCancelDialogOpen(true);
  };

  const handleViewBookingDetails = (booking: Booking) => {
    setSelectedBooking(convertToFormData(booking));
    setBookingDetailsOpen(true);
  };

  const handleConfirmReschedule = (updatedBooking: BookingFormData) => {
    // Update booking in localStorage
    const updatedBookings = bookings.map(b => {
      if (b.id === selectedBooking?.service?.id) {
        return {
          ...b,
          dateTime: `${updatedBooking.date}T${updatedBooking.time}`,
          staff: updatedBooking.staff,
        };
      }
      return b;
    });
    localStorage.setItem('bookings', JSON.stringify(updatedBookings));
    window.location.reload();
  };

  const handleConfirmCancel = (reason?: string) => {
    // Update booking status in localStorage
    const updatedBookings = bookings.map(b => {
      if (b.id === selectedBooking?.service?.id) {
        return {
          ...b,
          status: 'cancelled' as const,
          cancellationReason: reason,
        };
      }
      return b;
    });
    localStorage.setItem('bookings', JSON.stringify(updatedBookings));
    window.location.reload();
  };

  // Order handlers
  const handleReorder = (order: Order) => {
    order.items.forEach(item => addToCart(item));
    toast({
      title: 'Items added to cart',
      description: `${order.items.length} items added to your cart`,
    });
    navigate('/cart');
  };

  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setOrderDetailsOpen(true);
  };

  const handleTrackOrder = (order: Order) => {
    if (order.trackingNumber) {
      window.open(`https://example.com/track/${order.trackingNumber}`, '_blank');
    }
  };

  // Membership handlers
  const handleUpgradeMembership = () => {
    navigate('/memberships');
  };

  const handleCancelMembership = () => {
    toast({
      title: 'Membership cancellation',
      description: 'Please contact support to cancel your membership',
    });
  };

  const handleViewMembershipDetails = () => {
    navigate('/memberships');
  };

  // Gift card handlers
  const handleApplyGiftCard = (code: string) => {
    toast({
      title: 'Gift card applied',
      description: `Gift card ${code} will be applied to your next purchase`,
    });
    navigate('/shop');
  };

  if (!user) {
    return (
      <div className="min-h-screen pb-20 md:pb-8">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-12 text-center">
              <h3 className="text-2xl font-semibold mb-4">Sign in to view your account</h3>
              <p className="text-muted-foreground mb-6">
                Access your bookings, memberships, and manage your preferences
              </p>
              <Button onClick={() => navigate('/login')}>
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen pb-20 md:pb-8">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">My Account</h1>
            <p className="text-muted-foreground">Manage your bookings, memberships, and preferences</p>
          </div>

          <Tabs defaultValue="bookings" className="space-y-6">
            <TabsList>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="memberships">Memberships</TabsTrigger>
              <TabsTrigger value="giftcards">Gift Cards</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingBookings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>You don't have any upcoming bookings</p>
                    <Button 
                      className="mt-4"
                      onClick={() => navigate('/book')}
                    >
                      Book a Service
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingBookings.map((booking) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        onViewDetails={() => handleViewBookingDetails(booking)}
                        onReschedule={() => handleReschedule(booking)}
                        onCancel={() => handleCancel(booking)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {pastBookings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Past Bookings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pastBookings.map((booking) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        onViewDetails={() => handleViewBookingDetails(booking)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            {activeOrders.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Active Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activeOrders.map((order) => (
                      <OrderHistoryItem
                        key={order.id}
                        order={order}
                        onViewDetails={handleViewOrderDetails}
                        onReorder={handleReorder}
                        onTrackOrder={handleTrackOrder}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {activeOrders.length > 0 ? 'Past Orders' : 'Order History'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pastOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>You haven't made any purchases yet</p>
                    <Button 
                      className="mt-4"
                      onClick={() => navigate('/shop')}
                    >
                      Shop Products
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pastOrders.map((order) => (
                      <OrderHistoryItem
                        key={order.id}
                        order={order}
                        onViewDetails={handleViewOrderDetails}
                        onReorder={handleReorder}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Memberships Tab */}
          <TabsContent value="memberships">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {user.membership ? 'Your Membership' : 'Memberships'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user.membership ? (
                  <MembershipCard
                    membership={user.membership}
                    onUpgrade={handleUpgradeMembership}
                    onCancel={handleCancelMembership}
                    onViewDetails={handleViewMembershipDetails}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>You don't have an active membership</p>
                    <Button 
                      className="mt-4"
                      onClick={() => navigate('/memberships')}
                    >
                      View Membership Plans
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gift Cards Tab */}
          <TabsContent value="giftcards">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  My Gift Cards
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user.giftCards && user.giftCards.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    {user.giftCards
                      .filter(gc => gc.status === 'active' && gc.currentBalance > 0)
                      .map((giftCard) => (
                        <GiftCardDisplay
                          key={giftCard.id}
                          giftCard={giftCard}
                          onApplyToCart={handleApplyGiftCard}
                        />
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>You don't have any gift cards</p>
                    <Button 
                      className="mt-4"
                      onClick={() => navigate('/gift-cards')}
                    >
                      Purchase Gift Card
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <ProfileHeader user={user} onEditClick={() => setEditProfileOpen(true)} />
          </TabsContent>

          <TabsContent value="preferences">
            <PreferencesSection user={user} onUpdate={updateUser} />
          </TabsContent>

          <TabsContent value="security">
            <SecuritySettings />
          </TabsContent>
          </Tabs>
        </div>
      </div>

      <EditProfileDialog
        open={editProfileOpen}
        onOpenChange={setEditProfileOpen}
        user={user}
        onSave={updateUser}
      />

      {selectedBooking && (
        <>
          <RescheduleModal
            open={rescheduleModalOpen}
            onOpenChange={setRescheduleModalOpen}
            booking={selectedBooking}
            onConfirm={handleConfirmReschedule}
          />
          <CancelBookingDialog
            open={cancelDialogOpen}
            onOpenChange={setCancelDialogOpen}
            booking={selectedBooking}
            onConfirm={handleConfirmCancel}
          />
          <BookingDetailsModal
            open={bookingDetailsOpen}
            onOpenChange={setBookingDetailsOpen}
            booking={selectedBooking}
          />
        </>
      )}

      {selectedOrder && (
        <OrderDetailsModal
          open={orderDetailsOpen}
          onOpenChange={setOrderDetailsOpen}
          order={selectedOrder}
        />
      )}
    </>
  );
};

export default Account;
