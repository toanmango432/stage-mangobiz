/**
 * Walk-In Sidebar - Premium Edition
 * Drag walk-ins from queue to calendar
 * With glass morphism and premium design
 */

import { useState } from 'react';
import { User, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import { EmptyState } from './EmptyState';
import { WalkInCard, WalkIn as WalkInType } from './WalkInCard';
import { PremiumBadge } from '../premium';

// Legacy interface for backward compatibility
interface LegacyWalkIn {
  id: string;
  clientName: string;
  phone: string;
  partySize: number;
  requestedService?: string;
  arrivalTime: Date;
  status: 'waiting' | 'assigned';
}

// Convert legacy format to new format
function convertToWalkIn(legacy: LegacyWalkIn): WalkInType {
  return {
    id: legacy.id,
    name: legacy.clientName,
    phone: legacy.phone,
    partySize: legacy.partySize,
    services: legacy.requestedService ? [legacy.requestedService] : ['Service not specified'],
    checkInTime: legacy.arrivalTime,
  };
}

interface WalkInSidebarProps {
  walkIns: LegacyWalkIn[];
  onDragStart?: (walkIn: LegacyWalkIn) => void;
  onAssignStaff?: (walkInId: string) => void;
}

export function WalkInSidebar({ walkIns, onDragStart, onAssignStaff }: WalkInSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const waitingWalkIns = walkIns.filter(w => w.status === 'waiting');

  return (
    <div className={cn(
      'w-64 md:w-72 lg:w-80 border-l border-gray-200/50',
      'bg-surface-primary',
      'flex flex-col',
      'shadow-premium-sm'
    )}>
      {/* Header - Premium styling */}
      <div className="px-4 py-4 border-b border-gray-200/50 bg-white/50 backdrop-blur-sm">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'w-full flex items-center justify-between text-left',
            'transition-all duration-200',
            'hover:opacity-80'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-premium-md">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 tracking-tight">Walk-Ins</h3>
              <p className="text-xs text-gray-500">
                {waitingWalkIns.length} waiting
              </p>
            </div>
          </div>
          <div className={cn(
            'p-2 rounded-lg',
            'hover:bg-gray-100',
            'transition-colors duration-200'
          )}>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            )}
          </div>
        </button>
      </div>

      {/* Walk-In List */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {waitingWalkIns.length === 0 ? (
            <EmptyState 
              type="walkins"
              icon={User}
            />
          ) : (
            waitingWalkIns.map((walkIn) => {
              const convertedWalkIn = convertToWalkIn(walkIn);
              
              return (
                <div
                  key={walkIn.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('walkInId', walkIn.id);
                    onDragStart?.(walkIn);
                  }}
                  className="cursor-move active:opacity-50"
                >
                  <WalkInCard
                    walkIn={convertedWalkIn}
                    onAssignStaff={(id) => onAssignStaff?.(id)}
                  />
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
