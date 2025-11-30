import React, { useState, useMemo } from 'react';
import type { ServicePricing } from '../types';
import { serviceCategories } from '../constants';
import { Card, SectionHeader, Toggle, Button, Badge, Input, Checkbox } from '../components/SharedComponents';

interface ServicesSectionProps {
  services: ServicePricing[];
  onChange: (services: ServicePricing[]) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ services, onChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCustomPricing, setShowCustomPricing] = useState(false);
  const [expandedService, setExpandedService] = useState<string | null>(null);

  // Group services by category
  const servicesByCategory = useMemo(() => {
    const grouped: Record<string, ServicePricing[]> = {};
    services.forEach((service) => {
      if (!grouped[service.serviceCategory]) {
        grouped[service.serviceCategory] = [];
      }
      grouped[service.serviceCategory].push(service);
    });
    return grouped;
  }, [services]);

  // Filter services
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesSearch =
        !searchQuery ||
        service.serviceName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'all' || service.serviceCategory === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [services, searchQuery, selectedCategory]);

  // Calculate stats
  const stats = useMemo(() => {
    const canPerform = services.filter((s) => s.canPerform).length;
    const customPriced = services.filter((s) => s.customPrice !== undefined).length;
    return { total: services.length, canPerform, customPriced };
  }, [services]);

  const updateService = (serviceId: string, updates: Partial<ServicePricing>) => {
    onChange(
      services.map((s) => (s.serviceId === serviceId ? { ...s, ...updates } : s))
    );
  };

  const toggleServiceEnabled = (serviceId: string) => {
    const service = services.find((s) => s.serviceId === serviceId);
    if (service) {
      updateService(serviceId, { canPerform: !service.canPerform });
    }
  };

  const enableAllInCategory = (category: string) => {
    onChange(
      services.map((s) =>
        s.serviceCategory === category ? { ...s, canPerform: true } : s
      )
    );
  };

  const disableAllInCategory = (category: string) => {
    onChange(
      services.map((s) =>
        s.serviceCategory === category ? { ...s, canPerform: false } : s
      )
    );
  };

  const formatPrice = (price: number) => `$${price.toFixed(0)}`;
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card padding="md" className="text-center">
          <p className="text-2xl font-bold text-cyan-600">{stats.canPerform}</p>
          <p className="text-sm text-gray-500">Services Enabled</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Total Services</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-2xl font-bold text-amber-600">{stats.customPriced}</p>
          <p className="text-sm text-gray-500">Custom Priced</p>
        </Card>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">All Categories</option>
            {serviceCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Show Custom Pricing Toggle */}
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showCustomPricing}
              onChange={(e) => setShowCustomPricing(e.target.checked)}
              className="rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
            />
            Custom pricing only
          </label>
        </div>
      </Card>

      {/* Services by Category */}
      {selectedCategory === 'all' ? (
        // Show grouped by category
        Object.entries(servicesByCategory).map(([category, categoryServices]) => {
          const catInfo = serviceCategories.find((c) => c.id === category);
          const enabledCount = categoryServices.filter((s) => s.canPerform).length;
          const filteredCategoryServices = categoryServices.filter((s) =>
            !searchQuery || s.serviceName.toLowerCase().includes(searchQuery.toLowerCase())
          );

          if (filteredCategoryServices.length === 0) return null;

          return (
            <Card key={category} padding="none">
              {/* Category Header */}
              <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-500 flex items-center justify-center text-white">
                      <ServiceIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{catInfo?.name || category}</h3>
                      <p className="text-sm text-gray-500">
                        {enabledCount} of {categoryServices.length} enabled
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => enableAllInCategory(category)}
                      className="text-xs text-cyan-600 hover:text-cyan-700 font-medium"
                    >
                      Enable All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => disableAllInCategory(category)}
                      className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                    >
                      Disable All
                    </button>
                  </div>
                </div>
              </div>

              {/* Services List */}
              <div className="divide-y divide-gray-100">
                {filteredCategoryServices.map((service) => (
                  <ServiceRow
                    key={service.serviceId}
                    service={service}
                    isExpanded={expandedService === service.serviceId}
                    onToggle={() => toggleServiceEnabled(service.serviceId)}
                    onExpand={() =>
                      setExpandedService(
                        expandedService === service.serviceId ? null : service.serviceId
                      )
                    }
                    onUpdate={(updates) => updateService(service.serviceId, updates)}
                    formatPrice={formatPrice}
                    formatDuration={formatDuration}
                  />
                ))}
              </div>
            </Card>
          );
        })
      ) : (
        // Show flat list for selected category
        <Card padding="none">
          <div className="divide-y divide-gray-100">
            {filteredServices.map((service) => (
              <ServiceRow
                key={service.serviceId}
                service={service}
                isExpanded={expandedService === service.serviceId}
                onToggle={() => toggleServiceEnabled(service.serviceId)}
                onExpand={() =>
                  setExpandedService(
                    expandedService === service.serviceId ? null : service.serviceId
                  )
                }
                onUpdate={(updates) => updateService(service.serviceId, updates)}
                formatPrice={formatPrice}
                formatDuration={formatDuration}
              />
            ))}
          </div>
        </Card>
      )}

      {filteredServices.length === 0 && (
        <Card padding="lg">
          <div className="text-center py-8">
            <ServiceIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No services found</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-cyan-600 hover:text-cyan-700 text-sm mt-2"
              >
                Clear search
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Bulk Actions */}
      <Card padding="md" className="sticky bottom-4 bg-white/95 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">{stats.canPerform}</span> services enabled
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange(services.map((s) => ({ ...s, canPerform: false })))}
            >
              Disable All
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onChange(services.map((s) => ({ ...s, canPerform: true })))}
            >
              Enable All
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Service Row Component
interface ServiceRowProps {
  service: ServicePricing;
  isExpanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
  onUpdate: (updates: Partial<ServicePricing>) => void;
  formatPrice: (price: number) => string;
  formatDuration: (minutes: number) => string;
}

const ServiceRow: React.FC<ServiceRowProps> = ({
  service,
  isExpanded,
  onToggle,
  onExpand,
  onUpdate,
  formatPrice,
  formatDuration,
}) => {
  const hasCustomization = service.customPrice !== undefined || service.customDuration !== undefined;

  return (
    <div className={`transition-colors ${service.canPerform ? 'bg-white' : 'bg-gray-50/50'}`}>
      {/* Main Row */}
      <div className="p-4 flex items-center gap-4">
        <Toggle enabled={service.canPerform} onChange={onToggle} size="sm" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={`font-medium ${service.canPerform ? 'text-gray-900' : 'text-gray-400'}`}>
              {service.serviceName}
            </h4>
            {hasCustomization && (
              <Badge variant="warning" size="sm">Custom</Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <ClockIcon className="w-3.5 h-3.5" />
              {formatDuration(service.customDuration || service.defaultDuration)}
            </span>
            <span className="flex items-center gap-1">
              <DollarIcon className="w-3.5 h-3.5" />
              {formatPrice(service.customPrice ?? service.defaultPrice)}
              {service.customPrice !== undefined && (
                <span className="text-xs text-gray-400 line-through ml-1">
                  {formatPrice(service.defaultPrice)}
                </span>
              )}
            </span>
          </div>
        </div>

        <button
          onClick={onExpand}
          className={`
            p-2 rounded-lg transition-colors
            ${isExpanded ? 'bg-cyan-100 text-cyan-600' : 'hover:bg-gray-100 text-gray-400'}
          `}
        >
          <ChevronIcon className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Custom Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  value={service.customPrice ?? ''}
                  onChange={(e) =>
                    onUpdate({
                      customPrice: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder={service.defaultPrice.toString()}
                  className="w-full pl-7 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Default: {formatPrice(service.defaultPrice)}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Custom Duration (minutes)
              </label>
              <input
                type="number"
                value={service.customDuration ?? ''}
                onChange={(e) =>
                  onUpdate({
                    customDuration: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder={service.defaultDuration.toString()}
                className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Default: {formatDuration(service.defaultDuration)}
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Commission Override (%)
              </label>
              <input
                type="number"
                value={service.commissionOverride ?? ''}
                onChange={(e) =>
                  onUpdate({
                    commissionOverride: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="Use default"
                className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Leave blank to use the team member's default commission rate
              </p>
            </div>
          </div>

          {hasCustomization && (
            <button
              onClick={() =>
                onUpdate({
                  customPrice: undefined,
                  customDuration: undefined,
                  commissionOverride: undefined,
                })
              }
              className="mt-4 text-xs text-red-500 hover:text-red-600 font-medium"
            >
              Reset to Defaults
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Icons
const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ServiceIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0 0L9.121 9.121" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DollarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ChevronIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export default ServicesSection;
