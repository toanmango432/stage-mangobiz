'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { UnifiedBookingPage } from '@/components/booking/v2/UnifiedBookingPage';
import { BookingSuccessScreen } from '@/components/booking/v2/BookingSuccessScreen';
import { PasswordlessLoginModal } from '@/components/auth/PasswordlessLoginModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CartItem, Assignment, Service } from '@/components/booking/v2/types';
import { toast } from 'sonner';
import { mockAuthApi } from '@/lib/api/mockAuth';

type Step = 'booking' | 'confirm' | 'success';

const BookingFlowSimple = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('booking');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  // Add service to cart
  const handleServiceAdd = (service: Service) => {
    const cartItem: CartItem = {
      id: `${service.id}-${Date.now()}`,
      service,
      assignedTo: 'Me',
    };
    setCart(prev => [...prev, cartItem]); // Allow multiple services
    toast.success(`${service.name} added!`);
  };

  // Remove service from cart
  const handleServiceRemove = (serviceId: string) => {
    const removedService = cart.find(item => item.service.id === serviceId);
    setCart(prev => prev.filter(item => item.service.id !== serviceId));
    if (removedService) {
      toast.success(`${removedService.service.name} removed`);
    }
  };

  // Show staff/time sections (handled by scroll on same page)
  const handleContinueToStaffTime = () => {
    if (cart.length === 0) {
      toast.error('Please select at least one service');
      return;
    }
    // Auto-scroll to staff section handled by component
  };

  // Handle staff/time assignments
  const handleAssignments = (newAssignments: Assignment[]) => {
    setAssignments(newAssignments);
  };

  // Continue to phone verification
  const handleContinueToPhone = () => {
    if (assignments.length === 0) {
      toast.error('Please select staff and time');
      return;
    }
    // Show phone verification modal
    setShowPhoneModal(true);
  };

  // Handle successful phone verification
  const handlePhoneVerified = (userId: string) => {
    setShowPhoneModal(false);
    
    // Check if user exists
    const user = mockAuthApi.getCurrentUser();
    if (user) {
      setUserInfo(user);
      toast.success(`Welcome back!`);
    } else {
      toast.success('Phone verified! Please complete your information.');
    }
    
    // Go to confirmation
    setCurrentStep('confirm');
  };

  // Book appointment
  const handleBook = async (bookingData: any) => {
    // TODO: Implement actual booking API call
    console.log('Booking data:', bookingData);
    toast.success('Booking confirmed!');
    setCurrentStep('success');
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Page 1: Unified Booking (Services + Staff + Time) */}
        {currentStep === 'booking' && (
          <UnifiedBookingPage
            cart={cart}
            assignments={assignments}
            onServiceAdd={handleServiceAdd}
            onServiceRemove={handleServiceRemove}
            onAssignments={handleAssignments}
            onContinue={handleContinueToPhone}
          />
        )}

        {/* Step 3: Confirmation */}
        {currentStep === 'confirm' && (
          <div className="container max-w-4xl mx-auto px-4 py-8">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold">Review & Confirm</h1>
                <p className="text-muted-foreground">Review your booking details</p>
              </div>

              {/* Appointment Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Appointment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {assignments.map((assignment, idx) => {
                    const item = cart.find(c => c.id === assignment.cartItemId);
                    return (
                      <div key={idx} className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{item?.service.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {assignment.staffName} • {assignment.date} at {assignment.time}
                          </p>
                        </div>
                        <p className="font-medium">${item?.service.price}</p>
                      </div>
                    );
                  })}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${cart.reduce((sum, item) => sum + item.service.price, 0)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Info (from phone verification) */}
              {userInfo && (
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Phone: {userInfo.phone || 'Verified'}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setCurrentStep('booking')}>
                  Back
                </Button>
                <Button className="flex-1" onClick={() => handleBook({})}>
                  Confirm & Book Now
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {currentStep === 'success' && (
          <div className="animate-in fade-in duration-700">
            <BookingSuccessScreen
              assignments={assignments}
              cartItems={cart}
              userInfo={userInfo}
              onAddToCalendar={() => {
                toast.success('Added to calendar!');
              }}
              onBookAnother={() => {
                setCart([]);
                setAssignments([]);
                setUserInfo(null);
                setCurrentStep('booking');
              }}
              onShareWithFriend={() => {
                toast.success('Share link copied!');
              }}
            />
          </div>
        )}
      </div>

      {/* Phone Verification Modal */}
      <PasswordlessLoginModal
        open={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onSuccess={handlePhoneVerified}
        onSwitchToPassword={() => setShowPhoneModal(false)}
      />
    </>
  );
};

export default BookingFlowSimple;
