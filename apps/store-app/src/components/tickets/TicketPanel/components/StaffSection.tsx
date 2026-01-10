/**
 * StaffSection Component
 *
 * Handles staff selection for services in the ticket.
 * Displays available staff with their status and allows selection.
 *
 * Target: <400 lines
 * Current: Placeholder - to be extracted from main TicketPanel
 */

import { useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, UserCheck } from 'lucide-react';
import type { StaffSectionProps, StaffMember } from '../types';

export default function StaffSection({
  selectedStaff,
  onStaffSelect,
  availableStaff,
  isLoading = false,
}: StaffSectionProps) {
  // Sort staff by availability and name
  const sortedStaff = useMemo(() => {
    return [...availableStaff].sort((a, b) => {
      // Available staff first
      if (a.isAvailable && !b.isAvailable) return -1;
      if (!a.isAvailable && b.isAvailable) return 1;
      // Then alphabetically
      return a.name.localeCompare(b.name);
    });
  }, [availableStaff]);

  const getInitials = (staff: StaffMember) => {
    if (staff.firstName && staff.lastName) {
      return `${staff.firstName[0]}${staff.lastName[0]}`.toUpperCase();
    }
    return staff.name.substring(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="animate-pulse flex space-x-2">
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
        </div>
      </div>
    );
  }

  if (availableStaff.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No staff available</p>
      </div>
    );
  }

  return (
    <div className="border-b bg-muted/30">
      <div className="px-4 py-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Staff</h3>
        {selectedStaff && (
          <Badge variant="secondary" className="text-xs">
            <UserCheck className="h-3 w-3 mr-1" />
            {selectedStaff.name}
          </Badge>
        )}
      </div>

      <ScrollArea className="pb-2">
        <div className="flex gap-2 px-4 pb-2">
          {sortedStaff.map((staff) => {
            const isSelected = selectedStaff?.id === staff.id;

            return (
              <Button
                key={staff.id}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => onStaffSelect(staff)}
                className={`flex-shrink-0 flex items-center gap-2 ${
                  !staff.isAvailable ? 'opacity-50' : ''
                }`}
                disabled={!staff.isAvailable}
                data-testid={`staff-${staff.id}`}
              >
                <Avatar className="h-6 w-6">
                  {staff.avatar && <AvatarImage src={staff.avatar} />}
                  <AvatarFallback className="text-xs">
                    {getInitials(staff)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate max-w-[80px]">{staff.name}</span>
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
