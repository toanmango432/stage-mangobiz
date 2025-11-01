/**
 * Walk-In Sidebar
 * Drag walk-ins from queue to calendar
 */

import { useState } from 'react';
import { User, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { EmptyState } from './EmptyState';
import { WalkInCard, WalkIn as WalkInType } from './WalkInCard';

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
    <div className="w-80 border-l border-gray-200 bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-gray-900">Walk-Ins</h3>
            <span className="px-2 py-0.5 text-xs font-semibold bg-teal-100 text-teal-700 rounded-full">
              {waitingWalkIns.length}
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
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
