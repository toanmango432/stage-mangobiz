import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Clock, 
  User, 
  Calendar, 
  Plus, 
  ChevronDown, 
  ChevronUp,
  Edit3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BookingCard } from './BookingCard';
import { SmartTimeSuggestions } from './SmartTimeSuggestions';
import { MobileBottomSheet } from './MobileBottomSheet';
import { useSmartBookingFlow } from '@/hooks/useSmartBookingFlow';
import type { Service, Staff } from '@/types/catalog';

interface SmartBookingFlowProps {
  initialService?: Service;
  className?: string;
}

export const SmartBookingFlow: React.FC<SmartBookingFlowProps> = ({
  initialService,
  className,
}) => {
  const {
    formData,
    sections,
    expandSection,
    completeSection,
    updateFormData,
    isSectionExpanded,
    isSectionCompleted,
    getProgressPercentage,
  } = useSmartBookingFlow();

  const [showTimeSuggestions, setShowTimeSuggestions] = useState(false);
  const [showAddPerson, setShowAddPerson] = useState(false);

  // Initialize with service if provided
  useEffect(() => {
    if (initialService && !formData.service) {
      updateFormData({ service: initialService });
      completeSection('service');
    }
  }, [initialService, formData.service, updateFormData, completeSection]);

  const handleServiceSelect = (service: Service) => {
    updateFormData({ service });
    completeSection('service');
    // Auto-expand next section
    if (!formData.staff) {
      expandSection('staff');
    }
  };

  const handleStaffSelect = (staff: Staff) => {
    updateFormData({ staff });
    completeSection('staff');
    // Auto-expand next section
    if (!formData.date || !formData.time) {
      expandSection('datetime');
    }
  };

  const handleTimeSelect = (suggestion: any) => {
    updateFormData({ 
      date: suggestion.date, 
      time: suggestion.time,
      staff: suggestion.staff || formData.staff
    });
    completeSection('datetime');
    setShowTimeSuggestions(false);
  };

  const handleAddPerson = () => {
    const newMember = {
      id: `member-${Date.now()}`,
      name: `Guest ${(formData.members?.length || 0) + 1}`,
      service: formData.service,
      staff: undefined,
      date: formData.date,
      time: formData.time,
    };
    
    updateFormData({
      isGroup: true,
      members: [...(formData.members || []), newMember]
    });
    setShowAddPerson(false);
  };

  const handleRemoveMember = (memberId: string) => {
    const updatedMembers = formData.members?.filter(m => m.id !== memberId) || [];
    updateFormData({ 
      members: updatedMembers,
      isGroup: updatedMembers.length > 0
    });
  };

  const handleMemberServiceChange = (memberId: string, service: Service) => {
    const updatedMembers = formData.members?.map(member => 
      member.id === memberId ? { ...member, service } : member
    ) || [];
    updateFormData({ members: updatedMembers });
  };

  const getSectionIcon = (sectionKey: string) => {
    switch (sectionKey) {
      case 'service': return <User className="h-4 w-4" />;
      case 'staff': return <User className="h-4 w-4" />;
      case 'datetime': return <Calendar className="h-4 w-4" />;
      case 'details': return <Edit3 className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getSectionTitle = (sectionKey: string) => {
    switch (sectionKey) {
      case 'service': return 'Service Selected';
      case 'staff': return 'Technician Chosen';
      case 'datetime': return 'Date & Time Set';
      case 'details': return 'Details Complete';
      default: return 'Complete';
    }
  };

  const progressPercentage = getProgressPercentage();

  return (
    <div className={cn("space-y-4", className)}>
      {/* Progress Indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Booking Progress</span>
          <span className="text-muted-foreground">{Math.round(progressPercentage)}% complete</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Main Booking Card */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Service Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">What service do you need?</h3>
                {formData.service && (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Selected
                  </Badge>
                )}
              </div>
              
              {formData.service ? (
                <BookingCard
                  service={formData.service}
                  staff={formData.staff}
                  date={formData.date}
                  time={formData.time}
                  duration={formData.service.duration}
                  price={formData.service.price}
                  onServiceChange={handleServiceSelect}
                  onStaffChange={handleStaffSelect}
                  onDateTimeChange={(date, time) => {
                    updateFormData({ date, time });
                    completeSection('datetime');
                  }}
                  isEditable={true}
                  showAddPerson={!formData.isGroup}
                  onAddPerson={() => setShowAddPerson(true)}
                />
              ) : (
                <Button
                  onClick={() => expandSection('service')}
                  className="w-full h-16 border-dashed border-2 hover:border-primary hover:bg-primary/5"
                  variant="outline"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Select a service to start
                </Button>
              )}
            </div>

            {/* Add Person Button */}
            {formData.service && !formData.isGroup && (
              <Button
                onClick={() => setShowAddPerson(true)}
                variant="outline"
                className="w-full h-12 border-dashed border-2 hover:border-primary hover:bg-primary/5"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add another person
              </Button>
            )}

            {/* Group Members */}
            {formData.isGroup && formData.members && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">
                  Group Booking ({formData.members.length} people)
                </h4>
                {formData.members.map((member, index) => (
                  <BookingCard
                    key={member.id}
                    service={member.service}
                    staff={member.staff}
                    date={member.date}
                    time={member.time}
                    duration={member.service?.duration}
                    price={member.service?.price}
                    isGroup={true}
                    memberName={member.name}
                    memberIndex={index + 1}
                    onServiceChange={(service) => handleMemberServiceChange(member.id, service)}
                    onStaffChange={(staff) => {
                      const updatedMembers = formData.members?.map(m => 
                        m.id === member.id ? { ...m, staff } : m
                      ) || [];
                      updateFormData({ members: updatedMembers });
                    }}
                    onRemove={() => handleRemoveMember(member.id)}
                    isEditable={true}
                  />
                ))}
                <Button
                  onClick={() => setShowAddPerson(true)}
                  variant="outline"
                  className="w-full h-12 border-dashed border-2 hover:border-primary hover:bg-primary/5"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add another person
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Completed Sections Summary */}
      {Object.entries(sections).some(([_, section]) => section.completed) && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Completed</h4>
          <div className="space-y-1">
            {Object.entries(sections).map(([key, section]) => {
              if (!section.completed) return null;
              
              return (
                <Card
                  key={key}
                  className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => expandSection(key)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1 rounded-full bg-green-100">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{getSectionTitle(key)}</div>
                      <div className="text-xs text-muted-foreground">
                        {key === 'service' && formData.service && formData.service.name}
                        {key === 'staff' && formData.staff && `with ${formData.staff.name}`}
                        {key === 'datetime' && formData.date && formData.time && 
                          `${formData.date} at ${formData.time}`}
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Time Suggestions Bottom Sheet */}
      <MobileBottomSheet
        isOpen={showTimeSuggestions}
        onClose={() => setShowTimeSuggestions(false)}
        title="Choose Time"
        initialHeight="lg"
      >
        <div className="p-6">
          <SmartTimeSuggestions
            selectedService={formData.service}
            selectedStaff={formData.staff}
            onTimeSelect={handleTimeSelect}
          />
        </div>
      </MobileBottomSheet>

      {/* Add Person Bottom Sheet */}
      <MobileBottomSheet
        isOpen={showAddPerson}
        onClose={() => setShowAddPerson(false)}
        title="Add Person"
        initialHeight="md"
      >
        <div className="p-6 space-y-4">
          <p className="text-muted-foreground text-sm">
            Add another person to this booking
          </p>
          <Button
            onClick={handleAddPerson}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Person
          </Button>
        </div>
      </MobileBottomSheet>
    </div>
  );
};



