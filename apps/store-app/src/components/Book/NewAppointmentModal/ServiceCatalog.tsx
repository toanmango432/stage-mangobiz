/**
 * ServiceCatalog - Service selection grid with category tabs and search
 */

import { Search, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { Service, BookingGuest } from './types';

interface ServiceCatalogProps {
  services: Service[];
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  serviceSearch: string;
  onServiceSearchChange: (search: string) => void;
  filteredServices: Service[];
  activeStaffId: string | null;
  activeStaffName: string | null;
  onAddService: (service: Service) => void;
  onGoToStaffTab: () => void;
  justAddedService: string | null;
  bookingMode: 'individual' | 'group';
  groupStep: 'guests' | 'services';
  activeGuestId: string | null;
  bookingGuests: BookingGuest[];
}

export function ServiceCatalog({
  categories,
  selectedCategory,
  onCategoryChange,
  serviceSearch,
  onServiceSearchChange,
  filteredServices,
  activeStaffId,
  activeStaffName,
  onAddService,
  onGoToStaffTab,
  justAddedService,
  bookingMode,
  groupStep,
  activeGuestId,
  bookingGuests,
}: ServiceCatalogProps) {
  const activeGuest = bookingGuests.find(g => g.id === activeGuestId);

  return (
    <div className="space-y-3">
      {/* Staff indicator */}
      {activeStaffName && (
        <div className="px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <p className="text-xs text-amber-900 flex-1">
            {bookingMode === 'group' && groupStep === 'services' && activeGuestId ? (
              <>
                Adding to: <span className="font-semibold">{activeGuest?.name}</span>
                <span className="text-amber-700"> with {activeStaffName}</span>
              </>
            ) : (
              <>
                Adding to: <span className="font-semibold">{activeStaffName}</span>
              </>
            )}
          </p>
        </div>
      )}

      {/* No staff selected warning */}
      {!activeStaffId && (
        <div className="px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-blue-900 font-medium">Select a staff member first</p>
            <button
              onClick={onGoToStaffTab}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1 hover:underline"
            >
              Go to Staff tab →
            </button>
          </div>
        </div>
      )}

      {/* Search + Categories */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search services..."
            value={serviceSearch}
            onChange={(e) => onServiceSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-all',
                selectedCategory === cat
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Service Grid */}
      {bookingMode === 'group' && groupStep === 'services' && !activeGuestId ? (
        <div className="text-center py-12">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-amber-100 flex items-center justify-center">
            <User className="w-7 h-7 text-amber-600" />
          </div>
          <p className="text-sm text-gray-700 mb-2 font-medium">Select a guest first</p>
          <p className="text-xs text-gray-500">Choose which guest to add services for</p>
        </div>
      ) : activeStaffId ? (
        <div className="grid grid-cols-3 gap-2">
          {filteredServices.map(service => (
            <button
              key={service.id}
              onClick={() => onAddService(service)}
              className={cn(
                'text-left p-2.5 rounded-lg transition-all text-xs relative overflow-hidden group',
                'bg-white border border-gray-200 hover:border-brand-500 hover:shadow-md hover:scale-[1.03] active:scale-[0.97]',
                justAddedService === service.id && 'ring-2 ring-brand-500 border-brand-500'
              )}
            >
              {justAddedService === service.id && (
                <div className="absolute top-1 right-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-500" />
                </div>
              )}
              <p className="font-medium text-gray-900 mb-1.5 line-clamp-2 leading-tight pr-4">{service.name}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500">{service.duration}m</span>
                <span className="font-bold text-gray-900">${service.price}</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
            <User className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 mb-2">Select a staff member first</p>
          <button
            onClick={onGoToStaffTab}
            className="text-sm text-brand-600 font-medium hover:underline"
          >
            Go to Staff →
          </button>
        </div>
      )}
    </div>
  );
}
