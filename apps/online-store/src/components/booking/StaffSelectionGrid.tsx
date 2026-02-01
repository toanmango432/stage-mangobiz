import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StaffCardShimmer } from './design-system/LoadingShimmer';
import { StaffEmptyState } from './design-system/EmptyState';
import { AvailabilityDot } from './design-system/AvailabilityDot';
import { StaffPersonalityCard } from './StaffPersonalityCard';
import { MobileBottomSheet } from './MobileBottomSheet';
import { StaffProfileSheet } from './StaffProfileSheet';
import { Service, Staff } from '@/types/catalog';
import { bookingDataService, Staff as BookingStaff, Availability } from '@/lib/services/bookingDataService';
import { cn } from '@/lib/utils';
import { Star, Clock, Award, Users, Filter, Search, X, CheckCircle } from 'lucide-react';

/**
 * Converts BookingStaff (from bookingDataService) to Staff (from catalog types)
 * Handles availability format differences: Availability[] → Record<string, ...>
 */
function toStaff(bookingStaff: BookingStaff): Staff {
  // Convert Availability[] to Record<string, { start, end }[]>
  const availabilityRecord: Record<string, { start: string; end: string }[]> = {};
  if (bookingStaff.availability) {
    for (const avail of bookingStaff.availability) {
      // Convert timeSlots (strings like "09:00") to { start, end } ranges
      // Assume each slot is 30 minutes
      availabilityRecord[avail.date] = avail.timeSlots.map(slot => ({
        start: slot,
        end: slot, // Same as start for slot-based availability
      }));
    }
  }

  return {
    id: bookingStaff.id,
    name: bookingStaff.name,
    title: bookingStaff.title,
    avatar: bookingStaff.image,
    bio: bookingStaff.bio,
    specialties: bookingStaff.specialties,
    rating: bookingStaff.rating,
    availability: Object.keys(availabilityRecord).length > 0 ? availabilityRecord : undefined,
  };
}

/**
 * Gets availability status from the original BookingStaff format
 */
function getBookingStaffAvailability(avail: Availability[] | undefined, date: string): 'available' | 'limited' | 'unavailable' | 'unknown' {
  if (!avail) return 'unknown';
  const dayAvail = avail.find(a => a.date === date);
  if (!dayAvail) return 'unavailable';
  if (dayAvail.timeSlots.length === 0) return 'unavailable';
  if (dayAvail.timeSlots.length < 3) return 'limited';
  return 'available';
}

interface StaffSelectionGridProps {
  selectedService?: Service;
  selectedStaff?: Staff;
  onStaffSelect: (staff: Staff) => void;
  date?: string;
  className?: string;
}

export const StaffSelectionGrid = ({
  selectedService,
  selectedStaff,
  onStaffSelect,
  date,
  className,
}: StaffSelectionGridProps) => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [selectedStaffProfile, setSelectedStaffProfile] = useState<Staff | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showProfileSheet, setShowProfileSheet] = useState(false);

  // Load staff data
  useEffect(() => {
    const loadStaff = async () => {
      setIsLoading(true);
      try {
        const filters = selectedService ? { serviceId: selectedService.id } : undefined;
        const staffData = await bookingDataService.getStaff(filters);
        // Convert BookingStaff to Staff (catalog type)
        const convertedStaff = staffData.map(toStaff);
        setStaff(convertedStaff);
        setFilteredStaff(convertedStaff);
      } catch (error) {
        console.error('Failed to load staff:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStaff();
  }, [selectedService]);

  // Filter staff based on search and filters
  useEffect(() => {
    let filtered = staff;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.specialties.some(specialty => 
          specialty.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Specialty filter
    if (specialtyFilter !== 'all') {
      filtered = filtered.filter(s => 
        s.specialties.includes(specialtyFilter)
      );
    }

    // Rating filter
    if (ratingFilter !== 'all') {
      const minRating = parseFloat(ratingFilter);
      filtered = filtered.filter(s => s.rating >= minRating);
    }

    setFilteredStaff(filtered);
  }, [staff, searchQuery, specialtyFilter, ratingFilter]);

  const getAvailabilityStatus = (staffMember: Staff) => {
    if (!date) return 'unknown';

    // Staff.availability is Record<string, { start, end }[]>
    const slots = staffMember.availability?.[date];
    if (!slots) return 'unavailable';
    if (slots.length === 0) return 'unavailable';
    if (slots.length < 3) return 'limited';
    return 'available';
  };

  const getSpecialties = () => {
    const allSpecialties = staff.flatMap(s => s.specialties);
    return Array.from(new Set(allSpecialties));
  };

  const handleStaffSelect = (staffMember: Staff) => {
    onStaffSelect(staffMember);
  };

  const handleProfileView = (staffMember: Staff) => {
    setSelectedStaffProfile(staffMember);
    setShowProfileModal(true);
  };

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <StaffCardShimmer key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search technicians..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Specialty Filter */}
            <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Specialty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specialties</SelectItem>
                {getSpecialties().map(specialty => (
                  <SelectItem key={specialty} value={specialty}>
                    {specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Rating Filter */}
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="4.5">4.5+ Stars</SelectItem>
                <SelectItem value="4.0">4.0+ Stars</SelectItem>
                <SelectItem value="3.5">3.5+ Stars</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Any Available Option */}
        <Card 
          className={cn(
            'cursor-pointer transition-all duration-200 hover:shadow-md',
            selectedStaff?.id === 'any' && 'ring-2 ring-primary'
          )}
          onClick={() => handleStaffSelect({ id: 'any', name: 'Any Available', title: 'Auto-assign', specialties: [], rating: 0 } as Staff)}
        >
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Any Available</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Let us assign the best available technician
            </p>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Recommended
            </Badge>
          </CardContent>
        </Card>

        {/* Staff Members */}
        {filteredStaff.map((staffMember) => {
          const availabilityStatus = getAvailabilityStatus(staffMember);
          const isSelected = selectedStaff?.id === staffMember.id;
          
          // availabilityStatus is calculated but not used in StaffPersonalityCard props
          void availabilityStatus;

          return (
            <StaffPersonalityCard
              key={staffMember.id}
              staff={staffMember}
              isSelected={isSelected}
              onSelect={() => handleStaffSelect(staffMember)}
              onViewProfile={() => handleProfileView(staffMember)}
            />
          );
        })}
      </div>

      {/* Empty State */}
      {filteredStaff.length === 0 && (
        <StaffEmptyState onRefresh={() => {
          setSearchQuery('');
          setSpecialtyFilter('all');
          setRatingFilter('all');
        }} />
      )}

      {/* Staff Profile Modal */}
      <MobileBottomSheet
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title={selectedStaffProfile?.name || "Staff Profile"}
        initialHeight="lg"
      >
        {selectedStaffProfile && (
          <StaffProfileSheet
            staff={selectedStaffProfile}
            onSelect={() => {
              handleStaffSelect(selectedStaffProfile);
              setShowProfileModal(false);
            }}
          />
        )}
      </MobileBottomSheet>
    </div>
  );
};
