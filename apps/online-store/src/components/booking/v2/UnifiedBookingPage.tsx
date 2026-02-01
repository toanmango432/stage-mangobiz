import React, { useRef, useEffect, useState } from 'react';
import { ServiceBrowser } from './ServiceBrowser';
import { UnifiedStaffTimePicker } from './UnifiedStaffTimePicker';
import { ServicesSummaryCard, StaffSummaryCard, DateTimeSummaryCard } from './SummaryCards';
import { CartItem, Assignment, Service, Staff } from './types';

interface UnifiedBookingPageProps {
  cart: CartItem[];
  assignments: Assignment[];
  onServiceAdd: (service: Service) => void;
  onServiceRemove: (serviceId: string) => void;
  onAssignments: (assignments: Assignment[]) => void;
  onContinue: () => void;
}

export const UnifiedBookingPage: React.FC<UnifiedBookingPageProps> = ({
  cart,
  assignments,
  onServiceAdd,
  onServiceRemove,
  onAssignments,
  onContinue,
}) => {
  const servicesSectionRef = useRef<HTMLDivElement>(null);
  const staffSectionRef = useRef<HTMLDivElement>(null);
  const timeSectionRef = useRef<HTMLDivElement>(null);
  
  const [showStaffSection, setShowStaffSection] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Handle "Choose Staff" button click
  const handleContinueToStaff = () => {
    if (cart.length === 0) return;
    setShowStaffSection(true);
    setTimeout(() => {
      staffSectionRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  };

  // Handle edit services - go back to services page
  const handleEditServices = () => {
    setShowStaffSection(false);
    setSelectedStaff(null);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  // Handle edit staff - clear staff selection to show picker again
  const handleEditStaff = () => {
    setSelectedStaff(null);
    setSelectedDate('');
    setSelectedTime('');
    // Clear assignments so UnifiedStaffTimePicker resets
    onAssignments([]);
    setTimeout(() => {
      staffSectionRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  };

  // Handle edit date/time
  const handleEditDateTime = () => {
    timeSectionRef.current?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  };

  // Track staff and date/time selection from assignments
  useEffect(() => {
    if (assignments.length > 0) {
      const firstAssignment = assignments[0];
      
      // Set selected staff info
      if (firstAssignment.staffId && firstAssignment.staffName) {
        const staffData: Staff = {
          id: firstAssignment.staffId,
          name: firstAssignment.staffName,
          title: 'Specialist',
          avatar: '',
          specialties: [],
          rating: 4.9,
        };
        setSelectedStaff(staffData);
        
        // Scroll to top of summary cards so they're visible
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      }
      
      // Set date/time
      setSelectedDate(firstAssignment.date);
      setSelectedTime(firstAssignment.time);
    }
  }, [assignments]);

  // Hide staff section if cart becomes empty
  useEffect(() => {
    if (cart.length === 0) {
      setShowStaffSection(false);
      setSelectedStaff(null);
      setSelectedDate('');
      setSelectedTime('');
    }
  }, [cart.length]);

  const hasServices = cart.length > 0;
  const hasStaff = selectedStaff !== null;
  const hasDateTime = selectedDate && selectedTime;

  return (
    <div className="min-h-screen bg-background">
      {/* Services Section */}
      {!showStaffSection && (
        <div ref={servicesSectionRef} className="animate-in fade-in duration-500">
          <ServiceBrowser
            onServiceAdd={onServiceAdd}
            onServiceRemove={onServiceRemove}
            cart={cart}
            onContinue={handleContinueToStaff}
            isGroupBooking={false}
            onToggleGroupBooking={() => {}}
          />
        </div>
      )}

      {/* Staff & Time Section with Summary Cards */}
      {showStaffSection && (
        <div className="animate-in fade-in duration-500">
          {/* Page Header */}
          <div className="bg-background border-b shadow-sm">
            <div className="max-w-4xl mx-auto px-4 py-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Complete Your Booking
              </h1>
              <p className="text-gray-600">
                Choose your specialist and preferred time
              </p>
            </div>
          </div>

          {/* Summary Cards Stack */}
          <div className="max-w-4xl mx-auto px-4 pt-8 pb-6 space-y-4">
            {/* Services Summary - ALWAYS SHOW */}
            <ServicesSummaryCard
              services={cart}
              onEdit={handleEditServices}
            />

            {/* Staff Summary - Only show if staff selected */}
            {hasStaff && selectedStaff && (
              <StaffSummaryCard
                staff={selectedStaff}
                onEdit={handleEditStaff}
              />
            )}

            {/* Date/Time Summary - Only show if selected */}
            {hasDateTime && (
              <DateTimeSummaryCard
                date={selectedDate}
                time={selectedTime}
                onEdit={handleEditDateTime}
              />
            )}
          </div>

          {/* Active Section */}
          <div ref={staffSectionRef} className="animate-in fade-in slide-in-from-bottom duration-700">
            <UnifiedStaffTimePicker
              cartItems={cart}
              assignments={assignments}
              onAssignments={onAssignments}
              onBack={handleEditServices}
              onContinue={onContinue}
            />
          </div>
        </div>
      )}
    </div>
  );
};
