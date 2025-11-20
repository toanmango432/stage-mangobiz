/**
 * Walk-In Sidebar - Premium Edition
 * Drag walk-ins from queue to calendar
 * With glass morphism and premium design
 * Collapsible to show count only
 */

import { useState } from 'react';
import { User, ChevronDown, ChevronUp, Users, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  const waitingWalkIns = walkIns.filter(w => w.status === 'waiting');

  // Collapsed state - minimal width showing count only
  if (isCollapsed) {
    return (
      <div className={cn(
        'w-12 border-l border-gray-200/50',
        'bg-white',
        'flex flex-col items-center',
        'shadow-sm',
        'transition-all duration-300'
      )}>
        {/* Expand button */}
        <button
          onClick={() => setIsCollapsed(false)}
          className={cn(
            'w-full py-3 flex items-center justify-center',
            'hover:bg-gray-50 transition-colors',
            'border-b border-gray-200/50'
          )}
          aria-label="Expand walk-in sidebar"
        >
          <ChevronLeft className="w-4 h-4 text-gray-400" />
        </button>

        {/* Walk-in count - vertical */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>

          {/* Count badge */}
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-sm font-bold text-white">
                {waitingWalkIns.length}
              </span>
            </div>
          </div>

          {/* "Walk-ins" text vertically */}
          <div className="flex flex-col items-center gap-0.5 mt-2">
            {['W', 'A', 'L', 'K'].map((letter, i) => (
              <span key={i} className="text-[10px] font-medium text-gray-400 leading-none">
                {letter}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Expanded state - full sidebar
  return (
    <div className={cn(
      'w-64 md:w-72 lg:w-80 border-l border-gray-200/50',
      'bg-surface-primary',
      'flex flex-col',
      'shadow-premium-sm',
      'transition-all duration-300'
    )}>
      {/* Header - Premium styling */}
      <div className="px-4 py-4 border-b border-gray-200/50 bg-white/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'flex-1 flex items-center gap-3 text-left',
              'transition-all duration-200',
              'hover:opacity-80'
            )}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-premium-md">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 tracking-tight">Walk-Ins</h3>
              <p className="text-xs text-gray-500">
                {waitingWalkIns.length} waiting
              </p>
            </div>
          </button>

          {/* Control buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                'p-2 rounded-lg',
                'hover:bg-gray-100',
                'transition-colors duration-200'
              )}
              aria-label={isExpanded ? 'Collapse list' : 'Expand list'}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              )}
            </button>

            <button
              onClick={() => setIsCollapsed(true)}
              className={cn(
                'p-2 rounded-lg',
                'hover:bg-gray-100',
                'transition-colors duration-200'
              )}
              aria-label="Collapse sidebar"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
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
            waitingWalkIns.map((walkIn, index) => {
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
                  className="cursor-move active:opacity-50 animate-slide-up"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animationDuration: '400ms',
                    animationFillMode: 'both'
                  }}
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
