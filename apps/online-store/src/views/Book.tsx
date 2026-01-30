import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { ServiceBrowser } from '@/components/booking/v2/ServiceBrowser';
import { SmartCart } from '@/components/booking/v2/SmartCart';
import { EnhancedStaffTimePicker } from '@/components/booking/v2/EnhancedStaffTimePicker';
import { BookingConfirmation } from '@/components/booking/v2/BookingConfirmation';
import { BookingSuccess } from '@/components/booking/v2/BookingSuccess';
import { CartItem, Assignment, Service, AddOn } from '@/components/booking/v2/types';
import { ServiceQuestionsModal } from '@/components/booking/v2/ServiceQuestionsModal';
import { mockAuthApi } from '@/lib/api/mockAuth';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type BookingStep = 'browse' | 'assign' | 'confirm' | 'success';

interface GroupMember {
  id: string;
  name: string;
  services: string[];
}

const DRAFT_KEY = 'booking-v2-draft';

// SSR-safe default values
const DEFAULT_STEP: BookingStep = 'browse';
const DEFAULT_CART: CartItem[] = [];
const DEFAULT_ASSIGNMENTS: Assignment[] = [];

const Book = () => {
  const router = useRouter();

  // Use SSR-safe defaults, load from localStorage in useEffect
  const [currentStep, setCurrentStep] = useState<BookingStep>(DEFAULT_STEP);
  const [cart, setCart] = useState<CartItem[]>(DEFAULT_CART);
  const [assignments, setAssignments] = useState<Assignment[]>(DEFAULT_ASSIGNMENTS);
  const [isHydrated, setIsHydrated] = useState(false);
  
  const [isBooking, setIsBooking] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);
  const [bookingId, setBookingId] = useState<string>('');
  const [isGroupBooking, setIsGroupBooking] = useState(false);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [specialRequests, setSpecialRequests] = useState<string>('');
  
  // Service questions modal state
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [availableAddOns, setAvailableAddOns] = useState<AddOn[]>([]);

  // Load draft from localStorage on client mount (SSR-safe)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);

        // Handle old 'cart' step from previous flow
        if (parsed.currentStep === 'cart') {
          localStorage.removeItem(DRAFT_KEY);
          setCurrentStep(DEFAULT_STEP);
        } else {
          // Load saved draft data
          if (parsed.currentStep) setCurrentStep(parsed.currentStep);
          if (parsed.cart) setCart(parsed.cart);
          if (parsed.assignments) setAssignments(parsed.assignments);
          if (parsed.specialRequests) setSpecialRequests(parsed.specialRequests);
        }
      }
    } catch {
      // Invalid draft, clear it
      localStorage.removeItem(DRAFT_KEY);
    }

    setIsHydrated(true);
  }, []);

  // Auto-save to localStorage (only after hydration)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isHydrated) return; // Don't save until we've loaded from localStorage

    const draft = {
      currentStep,
      cart,
      assignments,
      specialRequests,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [currentStep, cart, assignments, specialRequests, isHydrated]);

  // Clear draft on successful booking
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (currentStep === 'success') {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, [currentStep]);

  // Save on page unload
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeUnload = () => {
      const draft = {
        currentStep,
        cart,
        assignments,
        specialRequests,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentStep, cart, assignments, specialRequests]);

  // Cart management functions
  const addToCart = (service: Service) => {
    // Check if service has questions or add-ons
    const hasQuestions = service.questions && service.questions.length > 0;
    const hasAddOns = service.availableAddOns && service.availableAddOns.length > 0;
    
    if (hasQuestions || hasAddOns) {
      // Show questions modal
      setSelectedService(service);
      // TODO: Load actual add-ons based on service.availableAddOns
      setAvailableAddOns([]);
      setShowQuestionsModal(true);
    } else {
      // Add directly to cart
      const cartItem: CartItem = {
        id: `${service.id}-${Date.now()}`,
        service,
        assignedTo: 'Me', // Always default to 'Me' - user must explicitly add people
      };
      setCart(prev => [...prev, cartItem]);
      toast.success(`${service.name} added!`);
      // Skip cart review - go directly to staff/time selection
      setCurrentStep('assign');
    }
  };
  
  const handleQuestionsComplete = (answers: Record<string, any>, selectedAddOns: AddOn[]) => {
    if (!selectedService) return;
    
    const cartItem: CartItem = {
      id: `${selectedService.id}-${Date.now()}`,
      service: selectedService,
      assignedTo: 'Me', // Always default to 'Me' - user must explicitly add people
      answers,
      addOns: selectedAddOns,
    };
    setCart(prev => [...prev, cartItem]);
    toast.success(`${selectedService.name} added!`);
    setSelectedService(null);
    setShowQuestionsModal(false);
    // Skip cart review - go directly to staff/time selection
    setCurrentStep('assign');
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
    toast.success('Service removed from cart');
  };

  const updateCartItemAssignment = (itemId: string, assignedTo: string) => {
    setCart(prev => prev.map(item => 
      item.id === itemId ? { ...item, assignedTo } : item
    ));
  };

  const addPerson = () => {
    // Get existing people
    const existingPeople = Array.from(new Set(cart.map(item => item.assignedTo)));
    const guestNumbers = existingPeople
      .filter(name => name.startsWith('Guest '))
      .map(name => parseInt(name.replace('Guest ', '')))
      .filter(num => !isNaN(num));
    
    const nextGuestNumber = guestNumbers.length > 0 ? Math.max(...guestNumbers) + 1 : 1;
    const newPersonName = `Guest ${nextGuestNumber}`;
    
    // Set group booking flag
    setIsGroupBooking(true);
    
    toast.success(`${newPersonName} added to your booking. You can now assign services to them.`);
  };

  // Navigation functions
  const goToStep = (step: BookingStep) => {
    setCurrentStep(step);
  };

  const handleContinueFromBrowse = () => {
    if (cart.length === 0) {
      toast.error('Please add at least one service to continue');
      return;
    }
    setCurrentStep('assign');
  };

  const handleContinueFromCart = () => {
    if (cart.length === 0) {
      toast.error('Please add at least one service to continue');
      return;
    }
    setCurrentStep('assign');
  };

  const handleContinueFromAssign = () => {
    if (assignments.length !== cart.length) {
      toast.error('Please assign all services to continue');
      return;
    }
    setCurrentStep('confirm');
  };

  const handleEditService = (itemId: string) => {
    // Remove the item and go back to browse
    removeFromCart(itemId);
    setCurrentStep('browse');
  };

  const handleFinalBooking = async (bookingData: any) => {
    setIsBooking(true);
    
    try {
      // Simulate booking API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Success! Show confirmation and navigate
      toast.success('🎉 Booking confirmed! Check your email for details.');
      
      // Set booking data and move to success page
      setBookingData(bookingData);
      setBookingId('BOOK-' + Date.now());
      setCurrentStep('success');
      
    } catch (error) {
      toast.error('Booking failed. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <>
      <div className="booking-v2">
        {/* Progress Indicator */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-3">
            {/* Desktop Progress */}
            <div className="hidden md:flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {(['browse', 'assign', 'confirm'] as BookingStep[]).map((step, index) => (
                  <div key={step} className="flex items-center">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200",
                      currentStep === step 
                        ? "bg-primary text-primary-foreground" 
                        : index < ['browse', 'assign', 'confirm'].indexOf(currentStep)
                        ? "bg-green-500 text-white"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {index < ['browse', 'assign', 'confirm'].indexOf(currentStep) ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span className={cn(
                      "ml-2 text-sm font-medium transition-all duration-200",
                      currentStep === step 
                        ? "text-primary" 
                        : index < ['browse', 'assign', 'confirm'].indexOf(currentStep)
                        ? "text-green-600"
                        : "text-muted-foreground"
                    )}>
                      {step === 'browse' && 'Services'}
                      {step === 'assign' && 'Staff & Time'}
                      {step === 'confirm' && 'Confirm'}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="text-sm text-muted-foreground">
                Step {['browse', 'assign', 'confirm'].indexOf(currentStep) + 1} of 3
              </div>
            </div>

            {/* Mobile Progress */}
            <div className="md:hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {currentStep === 'browse' && 'Choose Services'}
                  {currentStep === 'assign' && 'Staff & Time'}
                  {currentStep === 'confirm' && 'Confirm Booking'}
                </span>
                <span className="text-xs text-muted-foreground">
                  Step {['browse', 'assign', 'confirm'].indexOf(currentStep) + 1} of 3
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${((['browse', 'assign', 'confirm'].indexOf(currentStep) + 1) / 3) * 100}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {currentStep === 'browse' && (
          <div className="animate-slide-in-right">
            <ServiceBrowser 
              onServiceAdd={addToCart} 
              cart={cart}
              onContinue={handleContinueFromBrowse}
              isGroupBooking={isGroupBooking}
              onToggleGroupBooking={() => setIsGroupBooking(!isGroupBooking)}
            />
          </div>
        )}
        
        
        {currentStep === 'assign' && (
          <div className="animate-slide-in-right">
            <EnhancedStaffTimePicker 
              cartItems={cart}
              onAssignments={setAssignments}
              onBack={() => setCurrentStep('browse')}
              onContinue={() => setCurrentStep('confirm')}
            />
          </div>
        )}
        
        {currentStep === 'confirm' && (
          <div className="animate-slide-in-right">
            <BookingConfirmation 
              assignments={assignments}
              cartItems={cart}
              specialRequests={specialRequests}
              onSpecialRequestsChange={setSpecialRequests}
              onBack={() => setCurrentStep('assign')}
              onBook={handleFinalBooking}
            />
          </div>
        )}
        
        {currentStep === 'success' && (
          <div className="animate-slide-in-right">
            <BookingSuccess 
              bookingId={bookingId}
              assignments={assignments}
              cartItems={cart}
              bookingData={bookingData}
              onGoHome={() => router.push('/')}
              onBookAgain={() => {
                setCurrentStep('browse');
                setCart([]);
                setAssignments([]);
                setBookingData(null);
                setBookingId('');
                setSpecialRequests('');
              }}
            />
          </div>
        )}
      </div>
      
      {/* Service Questions Modal */}
      {selectedService && (
        <ServiceQuestionsModal
          open={showQuestionsModal}
          onClose={() => {
            setShowQuestionsModal(false);
            setSelectedService(null);
          }}
          service={selectedService}
          availableAddOns={availableAddOns}
          onComplete={handleQuestionsComplete}
        />
      )}
    </>
  );
};

export default Book;
