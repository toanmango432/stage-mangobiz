/**
 * MinimizedWidget - Floating widget shown when modal is collapsed
 */

import { X, Calendar, Clock, User } from 'lucide-react';
import type { Client, StaffWithServices } from './types';

interface MinimizedWidgetProps {
  selectedClients: Client[];
  partySize: number;
  postedStaff: StaffWithServices[];
  date: Date;
  totalDuration: number;
  totalPrice: number;
  onExpand: () => void;
  onClose: () => void;
}

export function MinimizedWidget({
  selectedClients,
  partySize,
  postedStaff,
  date,
  totalDuration,
  totalPrice,
  onExpand,
  onClose,
}: MinimizedWidgetProps) {
  const totalServices = postedStaff.reduce((sum, staff) => sum + staff.services.length, 0);

  return (
    <div
      onClick={onExpand}
      className="fixed bottom-24 right-6 z-[70] bg-white/95 backdrop-blur-xl rounded-2xl shadow-premium-xl p-5 cursor-pointer hover:shadow-premium-2xl transition-all hover:scale-[1.02] w-80 animate-slide-in-up border border-gray-200/50"
    >
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-brand-500 rounded-full animate-pulse" />
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shrink-0 shadow-premium-md">
          <Calendar className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-base truncate mb-0.5">
                {selectedClients.length > 0
                  ? partySize > 1
                    ? `${selectedClients[0].name} + ${partySize - 1} more`
                    : selectedClients[0].name
                  : 'New Appointment'}
              </p>
              <p className="text-xs text-gray-500">
                {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors -mt-1"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4 text-gray-400" />
              <span>{partySize} {partySize === 1 ? 'person' : 'people'}</span>
              <span className="text-gray-300">•</span>
              <span>{postedStaff.length} staff</span>
              <span className="text-gray-300">•</span>
              <span>{totalServices} svc</span>
            </div>
            {totalDuration > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{totalDuration}min</span>
                </div>
                <span className="font-semibold text-gray-900">${totalPrice}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
