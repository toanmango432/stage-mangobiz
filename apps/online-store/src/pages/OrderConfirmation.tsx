import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Copy, Download, Sparkles, ShoppingBag, Calendar as CalendarIcon } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Order } from "@/types/order";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AddToCalendar } from "@/components/checkout/AddToCalendar";
import { ShareOrder } from "@/components/checkout/ShareOrder";
import { OrderTimeline } from "@/components/checkout/OrderTimeline";
import { UpsellRecommendations } from "@/components/checkout/UpsellRecommendations";
import { EmailPreview } from "@/components/checkout/EmailPreview";
import { motion } from "framer-motion";
import { addDays } from "date-fns";

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [showUpsell, setShowUpsell] = useState(true);

  useEffect(() => {
    // Trigger confetti animation
    import('canvas-confetti').then(confetti => {
      confetti.default({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    });

    const stateOrder = location.state?.order as Order;
    if (stateOrder) {
      setOrder(stateOrder);
    } else {
      // Try to get the latest order from localStorage
      const orders = JSON.parse(localStorage.getItem('mango-orders') || '[]');
      if (orders.length > 0) {
        setOrder(orders[0]);
      } else {
        toast.error("Order not found");
        navigate('/');
      }
    }
  }, [location, navigate]);

  const copyOrderNumber = () => {
    if (order) {
      navigator.clipboard.writeText(order.orderNumber);
      toast.success("Order number copied!");
    }
  };

  if (!order) {
    return <div>Loading...</div>;
  }

  const hasPhysicalItems = order.items.some(item => item.type === 'product');
  const hasServices = order.items.some(item => item.type === 'service');
  const hasMembership = order.items.some(item => item.type === 'membership');

  // Prepare calendar event for services
  const serviceItem = order.items.find(item => item.type === 'service');
  const calendarEvent = serviceItem?.serviceDetails ? {
    title: `${serviceItem.name} Appointment`,
    description: `Your appointment at Mango Bloom Salon`,
    location: '123 Beauty Lane, Beverly Hills, CA 90210',
    startDate: new Date(serviceItem.serviceDetails.date + ' ' + serviceItem.serviceDetails.time),
    endDate: addDays(new Date(serviceItem.serviceDetails.date + ' ' + serviceItem.serviceDetails.time), 0),
    url: window.location.origin + '/account'
  } : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen pb-20 md:pb-8 bg-muted/30"
    >
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Success Message */}
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", duration: 0.6 }}
          >
            <Card className="shadow-card mb-8 border-2 border-primary/20">
              <CardContent className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2, duration: 0.6 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 mb-4"
                >
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </motion.div>
                <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
                <p className="text-muted-foreground mb-4">
                  Thank you for your purchase. We've sent a confirmation email to{" "}
                  <span className="font-medium text-foreground">{order.customerEmail}</span>
                </p>
                
                {__MODE__ === 'standalone' && (
                  <p className="text-sm text-yellow-600 mb-4 font-medium text-center">
                    Demo order only - No actual purchase was made
                  </p>
                )}
                
                <div className="flex items-center justify-center gap-2 bg-muted px-4 py-3 rounded-lg mb-4">
                  <span className="text-sm text-muted-foreground">Order Number:</span>
                  <span className="text-lg font-bold">{order.orderNumber}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={copyOrderNumber}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-3 justify-center">
                  {calendarEvent && (
                    <AddToCalendar event={calendarEvent} />
                  )}
                  <ShareOrder orderNumber={order.orderNumber} />
                  <EmailPreview order={order} />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Order Tracking Timeline */}
          {hasPhysicalItems && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="shadow-card mb-8">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4">Order Status</h2>
                  <OrderTimeline currentStatus={order.status} />
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <CalendarIcon className="h-4 w-4 inline mr-2" />
                      Estimated delivery: <span className="font-medium text-foreground">
                        {addDays(new Date(), 5).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Upsell Recommendations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <UpsellRecommendations />
          </motion.div>

          {/* Membership Upsell */}
          {showUpsell && !hasMembership && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="shadow-card mb-8 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                <CardContent className="p-6">
                  <button
                    onClick={() => setShowUpsell(false)}
                    className="float-right text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-2">Complete Your Experience</h3>
                      {hasServices && !hasPhysicalItems && (
                        <p className="text-sm text-muted-foreground mb-4">
                          Enhance your salon experience with our professional hair care products
                        </p>
                      )}
                      {hasPhysicalItems && !hasServices && (
                        <p className="text-sm text-muted-foreground mb-4">
                          Book a professional service and get expert styling tips
                        </p>
                      )}
                      {!hasPhysicalItems && !hasServices && (
                        <p className="text-sm text-muted-foreground mb-4">
                          Join our membership program and save 10% on all future purchases
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link to={hasServices ? "/shop" : "/book"}>
                            {hasServices ? "Shop Products" : "Book Service"}
                          </Link>
                        </Button>
                        <Button asChild size="sm">
                          <Link to="/memberships">View Memberships</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="shadow-card mb-8">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                
                <div className="space-y-3 mb-4">
                  {order.items.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * idx }}
                      className="flex justify-between text-sm"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        {item.quantity && item.quantity > 1 && (
                          <p className="text-muted-foreground">Qty: {item.quantity}</p>
                        )}
                        {item.serviceDetails && (
                          <p className="text-muted-foreground">
                            {item.serviceDetails.date} at {item.serviceDetails.time}
                          </p>
                        )}
                      </div>
                      <span className="font-medium">
                        ${(item.price * (item.quantity || 1)).toFixed(2)}
                      </span>
                    </motion.div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-${order.discount.toFixed(2)}</span>
                    </div>
                  )}
                  {order.shipping > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>${order.shipping.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>${order.tax.toFixed(2)}</span>
                  </div>
                  <Separator className="my-2" />
                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex justify-between text-lg font-bold"
                  >
                    <span>Total</span>
                    <span className="text-primary">${order.total.toFixed(2)}</span>
                  </motion.div>
                </div>

                {order.shippingAddress && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <h3 className="font-semibold mb-2">Shipping Address</h3>
                      <p className="text-sm">
                        {order.shippingAddress.fullName}<br />
                        {order.shippingAddress.addressLine1}<br />
                        {order.shippingAddress.addressLine2 && (
                          <>{order.shippingAddress.addressLine2}<br /></>
                        )}
                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button variant="outline" className="flex-1" onClick={() => toast.info("Download feature coming soon")}>
              <Download className="h-4 w-4 mr-2" />
              Download Receipt
            </Button>
            <Button asChild className="flex-1">
              <Link to="/">Continue Shopping</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderConfirmation;
