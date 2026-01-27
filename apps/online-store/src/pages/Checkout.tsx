'use client';

import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "@/lib/navigation";
import { useCart } from "@/contexts/CartContext";
import { useCheckout } from "@/hooks/useCheckout";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { ContactForm } from "@/components/checkout/ContactForm";
import { ShippingForm } from "@/components/checkout/ShippingForm";
import { PaymentForm } from "@/components/checkout/PaymentForm";
import { OrderReview } from "@/components/checkout/OrderReview";
import { ErrorModal } from "@/components/checkout/ErrorModal";
import { StockWarning } from "@/components/checkout/StockWarning";
import { CheckoutSkeleton } from "@/components/checkout/CheckoutSkeleton";
import { CheckoutProgressBar } from "@/components/checkout/CheckoutProgressBar";
import { GuestCheckoutPrompt } from "@/components/checkout/GuestCheckoutPrompt";
import { OrderSummaryDrawer } from "@/components/checkout/OrderSummaryDrawer";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Order } from "@/types/order";
import { CheckoutError, StockChange } from "@/types/api";
import { checkoutApi } from "@/lib/api/checkout";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const STEPS = ['Contact', 'Shipping', 'Payment', 'Review'];

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, getCartTotal, clearCart } = useCart();
  const { formData, updateFormData, currentStep, goToStep, nextStep, prevStep, clearCheckoutData } = useCheckout();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<CheckoutError | null>(null);
  const [stockChanges, setStockChanges] = useState<StockChange[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showProcessing, setShowProcessing] = useState(false);
  const [showGuestPrompt, setShowGuestPrompt] = useState(!user);

  useEffect(() => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      navigate('/cart');
    }
  }, [items, navigate]);

  const validateStep = (): boolean => {
    switch (currentStep) {
      case 1:
        if (!formData.email || !formData.phone) {
          toast.error("Please fill in all required contact fields");
          return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          toast.error("Please enter a valid email address");
          return false;
        }
        return true;
      
      case 2: {
        const hasPhysicalItems = items.some(item => item.type === 'product');
        if (!hasPhysicalItems) return true;
        
        if (formData.shippingType === 'shipping') {
          const addr = formData.shippingAddress;
          if (!addr?.fullName || !addr?.addressLine1 || !addr?.city || !addr?.state || !addr?.zipCode) {
            toast.error("Please fill in all required shipping fields");
            return false;
          }
        }
        return true;
      }
      
      case 3:
        if (!formData.paymentMethod?.cardHolderName || !formData.paymentMethod?.cardNumber || 
            !formData.paymentMethod?.expiryDate || !formData.paymentMethod?.cvv) {
          toast.error("Please fill in all payment details");
          return false;
        }
        return true;
      
      case 4:
        if (!formData.agreeToTerms || !formData.agreeToPrivacy) {
          toast.error("Please agree to the terms and privacy policy");
          return false;
        }
        return true;
      
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      nextStep();
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    prevStep();
    window.scrollTo(0, 0);
  };

  const generateOrderNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD-${year}-${random}`;
  };

  const handlePlaceOrder = async () => {
    if (!validateStep()) return;

    setIsProcessing(true);
    setShowProcessing(true);
    setError(null);

    try {
      const summary = getCartTotal();
      
      // Step 1: Create payment intent
      const paymentResponse = await checkoutApi.createPaymentIntent(summary.total);
      if (!paymentResponse.success) {
        throw paymentResponse.error;
      }

      // Step 2: Create order
      const orderData: Omit<Order, 'id' | 'orderNumber'> = {
        date: new Date().toISOString(),
        status: 'processing',
        items: items,
        subtotal: summary.subtotal,
        discount: summary.discount,
        tax: summary.tax,
        shipping: summary.shipping,
        total: summary.total,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        shippingAddress: formData.shippingAddress,
        billingAddress: formData.sameAsBilling ? formData.shippingAddress : formData.billingAddress,
        paymentMethod: {
          type: 'card',
          last4: formData.paymentMethod?.cardNumber?.slice(-4) || '',
        },
        pickupLocation: formData.pickupLocation,
        pickupTime: formData.pickupTime,
      };

      const orderResponse = await checkoutApi.createOrder(orderData);
      if (!orderResponse.success || !orderResponse.data) {
        throw orderResponse.error || new Error('Failed to create order');
      }

      // Save order to localStorage
      const existingOrders = JSON.parse(localStorage.getItem('mango-orders') || '[]');
      localStorage.setItem('mango-orders', JSON.stringify([orderResponse.data, ...existingOrders]));

      // Clear cart and checkout data
      clearCart();
      clearCheckoutData();

      // Navigate to confirmation
      navigate('/order-confirmation', { state: { order: orderResponse.data } });
      toast.success("Order placed successfully!");
    } catch (err) {
      const checkoutError = err as CheckoutError;
      setError(checkoutError);
      
      if (checkoutError.type === 'stock_changed' && checkoutError.affectedItems) {
        // Simulate stock changes for demo
        setStockChanges([
          {
            itemId: checkoutError.affectedItems[0],
            itemName: 'Sample Item',
            oldPrice: 29.99,
            newPrice: 34.99,
            available: true
          }
        ]);
      }
    } finally {
      setIsProcessing(false);
      setShowProcessing(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setIsRetrying(true);
    setTimeout(() => {
      handlePlaceOrder();
      setIsRetrying(false);
    }, 500);
  };

  const handleResolveError = () => {
    setError(null);
    if (error?.type === 'stock_changed') {
      navigate('/cart');
    } else if (error?.type === 'slot_conflict') {
      goToStep(2); // Go back to booking step
    }
  };

  const handleAcceptChanges = () => {
    setStockChanges([]);
    toast.success("Changes accepted");
  };

  const handleReviewCart = () => {
    navigate('/cart');
  };

  const summary = getCartTotal();

  return (
    <>
      <div className="min-h-screen pb-32 md:pb-8 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Button
              variant="ghost"
              onClick={() => navigate('/cart')}
              className="mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cart
            </Button>

            <h1 className="text-4xl font-bold mb-2">Checkout</h1>
            <p className="text-muted-foreground mb-8">
              Complete your purchase in a few simple steps
            </p>

            <CheckoutProgressBar 
              currentStep={currentStep} 
              steps={STEPS}
              onStepClick={goToStep}
            />
            
            {showGuestPrompt && currentStep === 1 && (
              <GuestCheckoutPrompt
                onContinueAsGuest={() => setShowGuestPrompt(false)}
                onCreateAccount={(email, password) => {
                  toast.success("Account created! You can now checkout.");
                  setShowGuestPrompt(false);
                }}
              />
            )}
            
            <div className="md:hidden mb-4">
              <OrderSummaryDrawer />
            </div>

            {stockChanges.length > 0 && (
              <StockWarning
                changes={stockChanges}
                onAccept={handleAcceptChanges}
                onReview={handleReviewCart}
              />
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-background rounded-lg shadow-card p-6 md:p-8 mb-6"
              >
                {currentStep === 1 && (
                  <ContactForm formData={formData} onUpdate={updateFormData} />
                )}
                {currentStep === 2 && (
                  <ShippingForm formData={formData} onUpdate={updateFormData} />
                )}
                {currentStep === 3 && (
                  <PaymentForm formData={formData} onUpdate={updateFormData} />
                )}
                {currentStep === 4 && (
                  <OrderReview formData={formData} onUpdate={updateFormData} />
                )}
              </motion.div>
            </AnimatePresence>

            <div className="hidden md:flex justify-between">
              {currentStep > 1 && (
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
              
              <div className="ml-auto">
                {currentStep < 4 ? (
                  <Button onClick={handleNext}>
                    Continue
                  </Button>
                ) : (
                  <Button 
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing
                      </>
                    ) : (
                      "Place Order"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Modal */}
      <ErrorModal
        error={error}
        open={!!error}
        onClose={() => setError(null)}
        onRetry={error?.type === 'payment_failed' ? handleRetry : undefined}
        onResolve={error?.type === 'slot_conflict' || error?.type === 'stock_changed' ? handleResolveError : undefined}
      />

      {/* Processing Overlay */}
      <AnimatePresence>
        {showProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <div className="bg-card rounded-lg p-8 shadow-lg flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center">
                <h3 className="font-semibold text-lg mb-1">Processing Payment</h3>
                <p className="text-sm text-muted-foreground">Please wait while we confirm your order...</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Checkout;
