/**
 * Filter Panel
 * Advanced filters for appointments
 */

import { useState } from 'react';
import { Filter, X, Search, ChevronDown, CheckCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FilterPanelProps {
  onFilterChange: (filters: AppointmentFilters) => void;
}

export interface AppointmentFilters {
  search: string;
  status: string[];
  serviceTypes: string[];
  dateRange: 'today' | 'week' | 'month' | 'all';
}

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled', color: 'bg-blue-500' },
  { value: 'checked-in', label: 'Checked In', color: 'bg-teal-500' },
  { value: 'in-service', label: 'In Service', color: 'bg-green-500' },
  { value: 'completed', label: 'Completed', color: 'bg-gray-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
  { value: 'no-show', label: 'No Show', color: 'bg-orange-500' },
];

const SERVICE_TYPES = [
  'Hair',
  'Nails',
  'Facial',
  'Massage',
  'Waxing',
  'Makeup',
];

export function FilterPanel({ onFilterChange }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<AppointmentFilters>({
    search: '',
    status: [],
    serviceTypes: [],
    dateRange: 'today',
  });

  const updateFilters = (updates: Partial<AppointmentFilters>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const toggleStatus = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    updateFilters({ status: newStatus });
  };

  const toggleServiceType = (serviceType: string) => {
    const newTypes = filters.serviceTypes.includes(serviceType)
      ? filters.serviceTypes.filter(t => t !== serviceType)
      : [...filters.serviceTypes, serviceType];
    updateFilters({ serviceTypes: newTypes });
  };

  const clearFilters = () => {
    const cleared: AppointmentFilters = {
      search: '',
      status: [],
      serviceTypes: [],
      dateRange: 'today',
    };
    setFilters(cleared);
    onFilterChange(cleared);
  };

  const activeFilterCount = filters.status.length + filters.serviceTypes.length + (filters.search ? 1 : 0);

  return (
    <div className="relative">
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all',
          isOpen || activeFilterCount > 0
            ? 'border-teal-500 bg-teal-50 text-teal-700'
            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
        )}
      >
        <Filter className="w-5 h-5" />
        <span className="font-medium">Filters</span>
        {activeFilterCount > 0 && (
          <span className="px-2 py-0.5 text-xs font-bold bg-teal-600 text-white rounded-full">
            {activeFilterCount}
          </span>
        )}
        <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {/* Filter Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-bold text-gray-900">Filter Appointments</h3>
            <div className="flex items-center space-x-2">
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Client name, phone, service..."
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="p-4 border-b border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Status
            </label>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => toggleStatus(option.value)}
                  className={cn(
                    'w-full flex items-center space-x-3 p-2 rounded-lg transition-colors',
                    filters.status.includes(option.value)
                      ? 'bg-teal-50 border-2 border-teal-500'
                      : 'bg-white border-2 border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className={cn('w-4 h-4 rounded-full', option.color)} />
                  <span className="flex-1 text-left text-sm font-medium text-gray-700">
                    {option.label}
                  </span>
                  {filters.status.includes(option.value) && (
                    <CheckCircle className="w-5 h-5 text-teal-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Service Type Filter */}
          <div className="p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Service Type
            </label>
            <div className="flex flex-wrap gap-2">
              {SERVICE_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleServiceType(type)}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium rounded-full transition-all',
                    filters.serviceTypes.includes(type)
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  {type}
                  {filters.serviceTypes.includes(type) && (
                    <CheckCircle className="inline-block w-3 h-3 ml-1" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
