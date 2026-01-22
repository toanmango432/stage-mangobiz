import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookingFormData } from '@/types/booking';
import { cn } from '@/lib/utils';
import { IMAGES } from '@/lib/images';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { useStaffForService, useStaff } from '@/hooks/queries';
import { useMemo } from 'react';

interface TechnicianSelectionSectionProps {
  formData: Partial<BookingFormData>;
  updateFormData: (data: Partial<BookingFormData>) => void;
}

// Placeholder avatars for display
const STAFF_AVATARS = [
  IMAGES.teamSarahChen,
  IMAGES.teamEmilyRodriguez,
  IMAGES.teamJessicaLee,
  IMAGES.teamMichaelTan,
];

export const TechnicianSelectionSection = ({ formData, updateFormData }: TechnicianSelectionSectionProps) => {
  const { storeId } = useStore();
  const serviceId = formData.service?.id;

  // Fetch staff for the selected service
  const {
    data: staffData,
    isLoading,
    isError,
  } = useStaffForService(storeId, serviceId);

  // Build staff list with images and "Next Available" option
  const staffList = useMemo(() => {
    // Start with "Next Available" option
    const baseList = [{
      id: 'any',
      name: 'Next Available',
      title: '',
      avatar: '',
      initials: 'NA',
      rating: 5,
      specialties: [] as string[],
      workingHours: {} as Record<string, { start: string; end: string }>,
      daysOff: [] as string[],
    }];

    // Use real staff data from Supabase (no mock fallback)
    if (staffData && staffData.length > 0) {
      const realStaff = staffData.slice(0, 8).map((staff, idx) => ({
        id: staff.id,
        name: staff.fullName,
        title: staff.title || '',
        avatar: staff.avatarUrl || STAFF_AVATARS[idx % STAFF_AVATARS.length] || '',
        initials: `${staff.firstName?.[0] || ''}${staff.lastName?.[0] || ''}`.toUpperCase(),
        rating: 5, // Default rating if not available
        specialties: staff.specialties || [],
        workingHours: {} as Record<string, { start: string; end: string }>,
        daysOff: [] as string[],
      }));
      return [...baseList, ...realStaff];
    }

    // Return just "Next Available" if no staff available
    return baseList;
  }, [staffData]);

  // Loading state
  if (isLoading) {
    return (
      <div className="py-12">
        <div className="container max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-foreground">Select a Technician</h2>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading technicians...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state with fallback message
  if (isError && staffList.length === 1) {
    return (
      <div className="py-12">
        <div className="container max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-foreground">Select a Technician</h2>
          <Card className="p-6">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              <p>Unable to load technicians. Please try again later.</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // GROUP BOOKING FLOW
  if (formData.isGroup && formData.members) {
    return (
      <div className="py-12">
        <div className="container max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-6">Technician Assignment</h2>
          <p className="text-muted-foreground mb-8">
            Select a technician for each person, or choose "Next Available" for automatic assignment.
          </p>

          <div className="space-y-6">
            {formData.members.map((member, memberIndex) => {
              const memberStaffId = member.staff?.id;

              return (
                <Card key={memberIndex} className="p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-semibold text-xl">
                        {member.name || `Person ${memberIndex + 1}`}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {member.service?.name}
                      </p>
                    </div>
                    <Badge variant={memberStaffId ? "default" : "secondary"}>
                      {memberStaffId ? "Assigned" : "Not Assigned"}
                    </Badge>
                  </div>

                  <RadioGroup
                    value={memberStaffId}
                    onValueChange={(staffId) => {
                      const staff = staffList.find(s => s.id === staffId);
                      if (staff) {
                        const updatedMembers = [...formData.members!];
                        updatedMembers[memberIndex] = {
                          ...updatedMembers[memberIndex],
                          staff: {
                            id: staff.id,
                            name: staff.name,
                            title: staff.title,
                            rating: staff.rating,
                            specialties: staff.specialties,
                            workingHours: staff.workingHours,
                            daysOff: staff.daysOff,
                          }
                        };
                        updateFormData({ members: updatedMembers });
                      }
                    }}
                  >
                    <div className="space-y-3">
                      {staffList.map((staff) => {
                        const isSelected = memberStaffId === staff.id;
                        const isNextAvailable = staff.id === 'any';

                        return (
                          <Card
                            key={staff.id}
                            className={cn(
                              "overflow-hidden transition-all duration-200 hover:shadow-md",
                              isSelected && "border-2 border-primary",
                              isNextAvailable && "bg-primary/5"
                            )}
                          >
                            <label
                              htmlFor={`member-${memberIndex}-staff-${staff.id}`}
                              className="flex items-center p-4 cursor-pointer"
                            >
                              <RadioGroupItem
                                value={staff.id}
                                id={`member-${memberIndex}-staff-${staff.id}`}
                                className="shrink-0"
                              />
                              <div className="flex items-center gap-4 flex-1 ml-4">
                                <Avatar className="h-12 w-12">
                                  {staff.avatar && <AvatarImage src={staff.avatar} alt={staff.name} />}
                                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                    {staff.initials}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="font-semibold flex items-center gap-2">
                                    {staff.name}
                                    {isNextAvailable && (
                                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                        Recommended
                                      </span>
                                    )}
                                  </div>
                                  {staff.title && (
                                    <div className="text-sm text-muted-foreground">{staff.title}</div>
                                  )}
                                  {isNextAvailable && (
                                    <p className="text-xs text-muted-foreground mt-1">We'll find the perfect match for you</p>
                                  )}
                                </div>
                              </div>
                            </label>
                          </Card>
                        );
                      })}
                    </div>
                  </RadioGroup>
                </Card>
              );
            })}
          </div>

          {/* Continue when all members have staff assigned */}
          {formData.members.every(m => m.staff) && (
            <div className="mt-8 flex justify-center">
              <Button
                size="lg"
                className="px-12 h-14 text-lg font-semibold"
                onClick={() => updateFormData({ readyForTechnician: true, readyForDateTime: true })}
              >
                Continue to Date & Time
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // SOLO BOOKING FLOW
  const selectedStaffId = formData.staff?.id;
  const servicePrice = formData.service?.price || 0;

  const handleStaffSelect = (staffId: string) => {
    const staff = staffList.find(s => s.id === staffId);
    if (staff) {
      updateFormData({
        staff: {
          id: staff.id,
          name: staff.name,
          title: staff.title,
          rating: staff.rating,
          specialties: staff.specialties,
          workingHours: staff.workingHours,
          daysOff: staff.daysOff,
        }
      });
    }
  };

  const getTotalDuration = () => {
    const serviceDuration = formData.service?.duration || 0;
    const addOnsDuration = (formData.addOns || []).reduce((sum, addon) => sum + addon.duration, 0);
    return serviceDuration + addOnsDuration;
  };

  return (
    <div className="py-12">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <h2 className="text-3xl font-bold text-foreground">Select a Technician</h2>
          <span className="px-3 py-1 bg-muted text-xs font-medium rounded-full">Optional</span>
        </div>

        <RadioGroup value={selectedStaffId} onValueChange={handleStaffSelect}>
          <div className="space-y-4">
            {staffList.map((staff, index) => {
              const isSelected = selectedStaffId === staff.id;
              const isNextAvailable = staff.id === 'any';

              return (
                <Card
                  key={staff.id}
                  className={cn(
                    "overflow-hidden transition-all duration-300 hover:shadow-lg",
                    isSelected && "border-2 border-primary shadow-md",
                    isNextAvailable && "bg-primary/5"
                  )}
                >
                  <label
                    htmlFor={`staff-${staff.id}`}
                    className="flex items-center p-6 cursor-pointer group"
                  >
                    <RadioGroupItem value={staff.id} id={`staff-${staff.id}`} className="shrink-0 h-5 w-5" />
                    <div className="flex items-center gap-5 flex-1 ml-5">
                      <Avatar className="h-16 w-16 ring-2 ring-background group-hover:ring-primary/20 transition-all">
                        {staff.avatar && <AvatarImage src={staff.avatar} alt={staff.name} />}
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                          {staff.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-lg text-foreground flex items-center gap-2">
                          {staff.name}
                          {isNextAvailable && (
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                              Recommended
                            </span>
                          )}
                        </div>
                        {staff.title && (
                          <div className="text-sm text-muted-foreground mt-1">{staff.title}</div>
                        )}
                        {isNextAvailable && (
                          <p className="text-sm text-muted-foreground mt-1">We'll assign the perfect technician for you</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-xl text-foreground">${servicePrice.toFixed(2)}</div>
                        {staff.id !== 'any' && (
                          <div className="text-sm text-muted-foreground mt-1">{getTotalDuration()} min</div>
                        )}
                      </div>
                    </div>
                  </label>
                </Card>
              );
            })}
          </div>
        </RadioGroup>

        {/* Continue Button */}
        {selectedStaffId && (
          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              className="px-12 h-14 text-lg font-semibold"
              onClick={() => updateFormData({ readyForTechnician: true, readyForDateTime: true })}
            >
              Continue to Date & Time
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
