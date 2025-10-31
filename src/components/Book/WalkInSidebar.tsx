/**
 * Walk-In Sidebar
 * Drag walk-ins from queue to calendar
 */

import { useState } from 'react';
import { User, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/utils';

interface WalkIn {
  id: string;
  clientName: string;
  phone: string;
  partySize: number;
  requestedService?: string;
  arrivalTime: Date;
  status: 'waiting' | 'assigned';
}

interface WalkInSidebarProps {
  walkIns: WalkIn[];
  onDragStart?: (walkIn: WalkIn) => void;
}

export function WalkInSidebar({ walkIns, onDragStart }: WalkInSidebarProps) {
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
            <div className="text-center py-8">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No walk-ins waiting</p>
            </div>
          ) : (
            waitingWalkIns.map((walkIn) => {
              const waitTime = Math.floor((Date.now() - walkIn.arrivalTime.getTime()) / 1000 / 60);
              
              return (
                <div
                  key={walkIn.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('walkInId', walkIn.id);
                    onDragStart?.(walkIn);
                  }}
                  className={cn(
                    'bg-white rounded-lg border-2 border-gray-200 p-3 cursor-move',
                    'hover:border-teal-400 hover:shadow-md transition-all',
                    'active:opacity-50'
                  )}
                >
                  {/* Client Info */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-bold text-sm text-gray-900">{walkIn.clientName}</p>
                      <p className="text-xs text-gray-500">{walkIn.phone}</p>
                    </div>
                    {walkIn.partySize > 1 && (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-700 rounded">
                        {walkIn.partySize} ppl
                      </span>
                    )}
                  </div>

                  {/* Service */}
                  {walkIn.requestedService && (
                    <p className="text-xs text-gray-600 mb-2">
                      {walkIn.requestedService}
                    </p>
                  )}

                  {/* Wait Time */}
                  <div className="flex items-center space-x-1 text-xs">
                    <Clock className="w-3 h-3 text-orange-500" />
                    <span className={cn(
                      'font-medium',
                      waitTime > 30 ? 'text-red-600' : waitTime > 15 ? 'text-orange-600' : 'text-gray-600'
                    )}>
                      Waiting {waitTime}m
                    </span>
                  </div>

                  {/* Drag Hint */}
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-400 italic">
                      Drag to calendar to book
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
