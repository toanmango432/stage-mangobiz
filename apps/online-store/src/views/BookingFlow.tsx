'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useBookingFlow } from '@/hooks/useBookingFlow';
import { mockAuthApi } from '@/lib/api/mockAuth';

import { Button } from '@/components/ui/button';
import { ServiceBrowser } from '@/components/booking/v2/ServiceBrowser';
import { StaffSelector } from '@/components/booking/v2/StaffSelector';
import { Calendar7Day } from '@/components/booking/v2/Calendar7Day';
import { GroupedTimeSlots } from '@/components/booking/v2/GroupedTimeSlots';
import { PasswordlessLoginModal } from '@/components/auth/PasswordlessLoginModal';
import { getServices } from '@/lib/services/catalogSyncService';
import { cn } from '@/lib/utils';

const BookingFlow = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('service');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const serviceDataRef = useRef<any>(null);
  
  const {
    formData,
    updateFormData,
    showServiceSelection,
    showRequiredQuestions,
    showTechnicianSection,
    showDateTimeSection,
    showBookingSummary,
    canBookNow,
  } = useBookingFlow();

  // Refs for smooth scrolling to newly revealed sections
  const questionsRef = useRef<HTMLDivElement>(null);
  const technicianRef = useRef<HTMLDivElement>(null);
  const dateTimeRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isInitialized) return;
    
    // Next.js doesn't support router state — use ref as source of truth
    const serviceData = serviceDataRef.current;
    
    if (serviceData && !formData.service) {
      // Validate service data before using it
      const validatedService = {
        id: serviceData.id,
        name: serviceData.name || 'Unknown Service',
        description: serviceData.description || '',
        duration: typeof serviceData.duration === 'number' ? serviceData.duration : 30,
        price: typeof serviceData.price === 'number' ? serviceData.price : 0,
      };
      
      updateFormData({ service: validatedService });
      setIsInitialized(true);
      return;
    }
    
    // Fallback: URL param lookup using catalog sync service
    if (serviceId && !formData.service) {
      const loadServiceById = async () => {
        try {
          const storeId = process.env.NEXT_PUBLIC_STORE_ID || 'demo-store';
          const services = await getServices(storeId);
          const service = services.find(s => s.id === serviceId);
          if (service) {
            const validatedService = {
              id: service.id,
              name: service.name,
              description: service.description || '',
              duration: service.duration || 30,
              price: service.price || service.basePrice || 0,
            };
            serviceDataRef.current = validatedService;
            updateFormData({ service: validatedService });
            setIsInitialized(true);
          } else {
            // Service not found - redirect
            router.replace('/book');
          }
        } catch (error) {
          console.error('[BookingFlow] Failed to load service:', error);
          router.replace('/book');
        }
      };
      loadServiceById();
    }
  }, [isInitialized, serviceId, formData.service, updateFormData, router]);

  // Smooth scroll to newly revealed sections
  useEffect(() => {
    if (showRequiredQuestions && questionsRef.current) {
      setTimeout(() => {
        questionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showRequiredQuestions]);

  useEffect(() => {
    if (showTechnicianSection && technicianRef.current) {
      setTimeout(() => {
        technicianRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showTechnicianSection]);

  useEffect(() => {
    if (showDateTimeSection && dateTimeRef.current) {
      setTimeout(() => {
        dateTimeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showDateTimeSection]);

  useEffect(() => {
    if (showBookingSummary && summaryRef.current) {
      setTimeout(() => {
        summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showBookingSummary]);

  const handleBookNowClick = () => {
    // Check if user is logged in
    const currentUser = mockAuthApi.getCurrentUser();
    
    if (!currentUser) {
      // Show authentication modal for guests
      setShowAuthModal(true);
    } else {
      // Navigate to confirmation page with booking data
      router.push('/book/confirmation');
    }
  };

  const handleAuthSuccess = (userId: string) => {
    setShowAuthModal(false);
    // After successful auth, navigate to confirmation
    router.push('/book/confirmation');
  };

  return (
    <>
      <div className="min-h-screen bg-background pb-20">
        {/* Two-Column Layout: Main Content + Promo Sidebar */}
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-[1fr,380px] gap-8">
            {/* Main Content Column */}
            <div className="space-y-0">
              {/* 1. Service Selection - FIRST STEP, Always Visible */}
              <section className="bg-background">
                <ServiceSelectionSection formData={formData} updateFormData={updateFormData} />
              </section>

              {/* 3. Required Questions - Show after group choice made */}
              {showRequiredQuestions && (
                <section 
                  ref={questionsRef}
                  className={cn(
                    "bg-background animate-fade-in",
                    "transition-all duration-300"
                  )}
                >
                  <RequiredQuestionsSection formData={formData} updateFormData={updateFormData} />
                </section>
              )}
              
              {/* 4. Technician Selection - Show after questions answered */}
              {showTechnicianSection && (
                <section 
                  ref={technicianRef}
                  className={cn(
                    "bg-background animate-fade-in",
                    "transition-all duration-300"
                  )}
                >
                  <TechnicianSelectionSection formData={formData} updateFormData={updateFormData} />
                </section>
              )}
              
              {/* 5. Date & Time Selection - Show after technician selected */}
              {showDateTimeSection && (
                <section 
                  ref={dateTimeRef}
                  className={cn(
                    "bg-background animate-fade-in",
                    "transition-all duration-300"
                  )}
                >
                  <DateTimeSelectionSection formData={formData} updateFormData={updateFormData} groupSize={formData.groupSize || 1} />
                </section>
              )}
              
              {/* 6. Booking Summary - Show after date/time selected */}
              {showBookingSummary && (
                <section 
                  ref={summaryRef}
                  className={cn(
                    "bg-background animate-fade-in",
                    "transition-all duration-300"
                  )}
                >
                  <BookingSummarySection 
                    formData={formData}
                    groupSize={formData.groupSize || 1}
                    onBookNow={handleBookNowClick}
                  />
                </section>
              )}
            </div>

            {/* Promo Sidebar Column */}
            <aside className="hidden lg:block">
              <PromoSidebar />
            </aside>
          </div>

          {/* Mobile Promo Card - Show at bottom on mobile/tablet */}
          <div className="lg:hidden mt-8 px-4">
            <PromoSidebar />
          </div>
        </div>

        {/* Mobile Sticky Summary */}
        {showBookingSummary && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 shadow-lg z-20">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <div className="text-xs text-muted-foreground">Total</div>
                <div className="text-2xl font-bold text-foreground">
                  ${formData.service?.price || 0}
                </div>
              </div>
              <Button 
                size="lg"
                onClick={handleBookNowClick}
                className="px-8"
              >
                BOOK NOW
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Authentication Modal for Guests */}
      <PasswordlessLoginModal 
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        onSwitchToPassword={() => {
          setShowAuthModal(false);
        }}
      />
    </>
  );
};

export default BookingFlow;
