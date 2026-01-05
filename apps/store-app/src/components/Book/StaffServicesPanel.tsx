import { Search } from 'lucide-react';
import { cn } from '../../lib/utils';
// Minimal shapes needed for rendering; keeps this component decoupled
type StaffShape = { id: string; name: string };
type ServiceShape = {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
};

interface StaffServicesPanelProps {
  allStaff: StaffShape[];
  activeStaffId: string | null;
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  serviceSearch: string;
  onServiceSearch: (value: string) => void;
  filteredServices: ServiceShape[];
  onSelectStaff: (staffId: string, staffName: string) => void;
  onAddService: (service: ServiceShape) => void;
  disabled?: boolean;
}

/**
 * Staff selector + Services list block.
 * Extracted for clarity; markup is kept 1:1 with previous inline version.
 */
export function StaffServicesPanel({
  allStaff,
  activeStaffId,
  categories,
  selectedCategory,
  onSelectCategory,
  serviceSearch,
  onServiceSearch,
  filteredServices,
  onSelectStaff,
  onAddService,
  disabled = false,
}: StaffServicesPanelProps) {
  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Staff selector */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">Staff</p>
            <p className="text-xs text-gray-500">Select a staff member to assign services</p>
          </div>
        </div>
        {allStaff.length === 0 ? (
          <p className="text-xs text-gray-500">No staff available</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {allStaff.map((staff) => (
              <button
                key={staff.id}
                onClick={() => onSelectStaff(staff.id, staff.name)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-colors',
                  activeStaffId === staff.id
                    ? 'border-brand-500 bg-brand-50 text-brand-900'
                    : 'border-gray-200 bg-white hover:border-brand-300 hover:bg-gray-50 text-gray-800'
                )}
                disabled={disabled}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center text-sm font-semibold">
                  {staff.name?.[0] || 'S'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{staff.name}</p>
                  <p className="text-[11px] text-gray-500">Tap to select</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Service selector */}
      <div className="p-4 flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">Services</p>
            <p className="text-xs text-gray-500">Pick a service to add to the selected staff</p>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors',
                selectedCategory === cat
                  ? 'bg-brand-50 text-brand-700 border-brand-200'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-brand-300'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search services..."
            value={serviceSearch}
            onChange={(e) => onServiceSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        {/* Services grid */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredServices.length === 0 ? (
            <p className="text-xs text-gray-500">No services available</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filteredServices.map((service) => (
                <button
                  key={service.id}
                  onClick={() => onAddService(service)}
                  className="w-full text-left px-3 py-2 border border-gray-200 rounded-lg hover:border-brand-400 hover:bg-brand-50 transition-colors disabled:opacity-50"
                  disabled={disabled || !activeStaffId}
                >
                  <p className="text-sm font-semibold text-gray-900 truncate">{service.name}</p>
                  <p className="text-[11px] text-gray-500 truncate">{service.category}</p>
                  <div className="flex items-center justify-between text-xs text-gray-600 mt-1">
                    <span>{service.duration} min</span>
                    <span className="font-semibold text-gray-900">${service.price}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
