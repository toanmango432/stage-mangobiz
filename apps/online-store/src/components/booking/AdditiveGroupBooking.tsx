import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MobileBottomSheet } from './MobileBottomSheet';
import { ServiceQuickPreview } from './ServiceQuickPreview';
import { BookingCard } from './BookingCard';
import { Service } from '@/types/catalog';
import { cn } from '@/lib/utils';
import { Plus, Users, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';

interface GroupMember {
  id: string;
  name: string;
  service?: Service;
  staff?: any;
  date?: string;
  time?: string;
  price?: number;
}

interface AdditiveGroupBookingProps {
  members: GroupMember[];
  onMembersChange: (members: GroupMember[]) => void;
  onAddPerson?: () => void;
  className?: string;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
}

export const AdditiveGroupBooking: React.FC<AdditiveGroupBookingProps> = ({
  members,
  onMembersChange,
  onAddPerson,
  className,
  isExpanded = false,
  onToggleExpanded,
}) => {
  const [showServiceSheet, setShowServiceSheet] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const handleServiceSelect = (memberId: string, service: Service) => {
    const updatedMembers = members.map(member =>
      member.id === memberId ? { ...member, service, price: service.price } : member
    );
    onMembersChange(updatedMembers);
    setShowServiceSheet(false);
    setSelectedMember(null);
  };

  const handleStaffChange = (memberId: string, staff: any) => {
    const updatedMembers = members.map(member =>
      member.id === memberId ? { ...member, staff } : member
    );
    onMembersChange(updatedMembers);
  };

  const handleDateTimeChange = (memberId: string, date: string, time: string) => {
    const updatedMembers = members.map(member =>
      member.id === memberId ? { ...member, date, time } : member
    );
    onMembersChange(updatedMembers);
  };

  const handleRemoveMember = (memberId: string) => {
    const updatedMembers = members.filter(member => member.id !== memberId);
    onMembersChange(updatedMembers);
  };

  const handleAddPerson = () => {
    if (onAddPerson) {
      onAddPerson();
    } else {
      const newMember: GroupMember = {
        id: `member-${Date.now()}`,
        name: `Guest ${members.length + 1}`,
      };
      onMembersChange([...members, newMember]);
    }
  };

  const getTotalPrice = () => {
    return members.reduce((total, member) => total + (member.price || 0), 0);
  };

  const getTotalDuration = () => {
    return members.reduce((total, member) => total + (member.service?.duration || 0), 0);
  };

  const getCompletionStatus = () => {
    const completed = members.filter(member => 
      member.service && member.date && member.time
    ).length;
    return { completed, total: members.length };
  };

  const status = getCompletionStatus();

  if (members.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <Button
          onClick={handleAddPerson}
          variant="outline"
          className="w-full h-16 border-dashed border-2 hover:border-primary hover:bg-primary/5"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add another person
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className={cn("space-y-4", className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Group Booking</h3>
              <p className="text-sm text-muted-foreground">
                {members.length} {members.length === 1 ? 'person' : 'people'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {status.completed > 0 && (
              <Badge variant="secondary" className="text-xs">
                {status.completed}/{status.total} complete
              </Badge>
            )}
            {onToggleExpanded && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleExpanded}
                className="h-8 w-8 p-0"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Summary */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm font-medium">
                  Total: ${getTotalPrice()}
                </div>
                {getTotalDuration() > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {getTotalDuration()}min total
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {status.completed === status.total && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                <span className="text-sm text-muted-foreground">
                  {status.completed === status.total ? 'Complete' : 'In progress'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Members List */}
        {isExpanded && (
          <div className="space-y-3">
            {members.map((member, index) => (
              <BookingCard
                key={member.id}
                service={member.service}
                staff={member.staff}
                date={member.date}
                time={member.time}
                duration={member.service?.duration}
                price={member.price}
                isGroup={true}
                memberName={member.name}
                memberIndex={index + 1}
                onServiceChange={(service) => {
                  setSelectedMember(member.id);
                  setShowServiceSheet(true);
                }}
                onStaffChange={(staff) => handleStaffChange(member.id, staff)}
                onDateTimeChange={(date, time) => handleDateTimeChange(member.id, date, time)}
                onRemove={() => handleRemoveMember(member.id)}
                isEditable={true}
              />
            ))}
          </div>
        )}

        {/* Add Person Button */}
        <Button
          onClick={handleAddPerson}
          variant="outline"
          className="w-full h-12 border-dashed border-2 hover:border-primary hover:bg-primary/5"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add another person
        </Button>
      </div>

      {/* Service Selection Bottom Sheet */}
      <MobileBottomSheet
        isOpen={showServiceSheet}
        onClose={() => {
          setShowServiceSheet(false);
          setSelectedMember(null);
        }}
        title="Select Service"
        initialHeight="lg"
      >
        <ServiceQuickPreview
          selectedService={selectedMember ? members.find(m => m.id === selectedMember)?.service : undefined}
          onServiceSelect={(service) => {
            if (selectedMember) {
              handleServiceSelect(selectedMember, service);
            }
          }}
        />
      </MobileBottomSheet>
    </>
  );
};



