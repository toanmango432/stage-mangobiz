/**
 * WalkInCard Component
 * Enhanced walk-in client card with paper-ticket aesthetic
 */

import { memo } from 'react';
import { cn } from '../../lib/utils';
import { Users, Clock } from 'lucide-react';
import { Button } from '../shared/Button';

interface WalkIn {
  id: string;
  name: string;
  phone?: string;
  partySize: number;
  services: string[];
  notes?: string;
  checkInTime: Date;
  estimatedWaitTime?: number;
}

interface WalkInCardProps {
  walkIn: WalkIn;
  onAssignStaff: (walkInId: string) => void;
  onEdit?: (walkIn: WalkIn) => void;
  onRemove?: (walkInId: string) => void;
  className?: string;
}

export const WalkInCard = memo(function WalkInCard({
  walkIn,
  onAssignStaff,
  onEdit,
  onRemove,
  className,
}: WalkInCardProps) {
  // Calculate waiting time in minutes
  const waitingMinutes = walkIn.estimatedWaitTime || 
    Math.floor((Date.now() - walkIn.checkInTime.getTime()) / 60000);
  
  // Format waiting time display
  const waitingTimeDisplay = waitingMinutes < 60
    ? `${waitingMinutes}min`
    : `${Math.floor(waitingMinutes / 60)}h ${waitingMinutes % 60}m`;

  return (
    <div
      className={cn(
        'relative bg-white rounded-lg p-4',
        'border-l-4 border-blue-400',
        'shadow-md hover:shadow-lg',
        'transition-all duration-200',
        'hover:-translate-y-0.5',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        {/* Client Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Avatar with walk-in badge */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold shadow-sm">
              {walkIn.name.charAt(0).toUpperCase()}
            </div>
            {/* Walk-in badge */}
            <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
              WALK-IN
            </div>
          </div>
          
          {/* Name & Phone */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 truncate">
              {walkIn.name}
            </h4>
            {walkIn.phone && (
              <p className="text-xs text-gray-500 truncate">{walkIn.phone}</p>
            )}
            {walkIn.partySize > 1 && (
              <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-600">
                <Users className="w-3 h-3" />
                <span>Party of {walkIn.partySize}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Waiting Time Badge */}
        <div className={cn(
          'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium shadow-sm',
          waitingMinutes < 15 
            ? 'bg-green-100 text-green-700'
            : waitingMinutes < 30
            ? 'bg-amber-100 text-amber-700'
            : 'bg-red-100 text-red-700'
        )}>
          <Clock className="w-3 h-3" />
          <span>{waitingTimeDisplay}</span>
        </div>
      </div>

      {/* Perforation line (paper ticket aesthetic) */}
      <div className="border-t border-dashed border-gray-300 my-3" />

      {/* Services */}
      <div className="space-y-1 mb-3">
        {walkIn.services.map((service, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <span className="text-gray-400 text-xs mt-0.5">•</span>
            <p className="text-sm text-gray-700 flex-1">{service}</p>
          </div>
        ))}
      </div>

      {/* Notes (if any) */}
      {walkIn.notes && (
        <div className="mb-3 p-2 bg-gray-50 rounded text-xs text-gray-600 italic">
          "{walkIn.notes}"
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="primary"
          size="sm"
          className="flex-1"
          onClick={() => onAssignStaff(walkIn.id)}
        >
          Assign to Staff
        </Button>
        
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(walkIn)}
          >
            Edit
          </Button>
        )}
        
        {onRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(walkIn.id)}
          >
            Remove
          </Button>
        )}
      </div>

      {/* Semicircle cutouts (paper ticket aesthetic) */}
      <div className="absolute -left-1 top-4 w-2 h-2 bg-gray-50 rounded-full" />
      <div className="absolute -left-1 bottom-4 w-2 h-2 bg-gray-50 rounded-full" />
    </div>
  );
});

// Export types for use in other components
export type { WalkIn, WalkInCardProps };
