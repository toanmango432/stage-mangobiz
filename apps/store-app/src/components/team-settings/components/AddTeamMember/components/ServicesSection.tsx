import React from 'react';
import type { ServicePricing } from '../../../types';

interface ServicesSectionProps {
  services: ServicePricing[];
  onToggleService: (serviceId: string) => void;
  onToggleAllServices: (category: string, enabled: boolean) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  services,
  onToggleService,
  onToggleAllServices,
}) => {
  const selectedServicesCount = services.filter(s => s.canPerform).length;
  const categories = ['hair', 'nails', 'skin', 'massage', 'waxing', 'makeup'];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="bg-purple-50 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
            <ScissorsIcon className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-medium text-purple-900">Assign Services</h3>
            <p className="text-sm text-purple-700 mt-0.5">
              Select the services this team member can perform. Pricing can be customized later.
            </p>
          </div>
        </div>
      </div>

      {/* Group services by category */}
      {categories.map(category => {
        const categoryServices = services.filter(s => s.serviceCategory === category);
        if (categoryServices.length === 0) return null;

        const allSelected = categoryServices.every(s => s.canPerform);
        const someSelected = categoryServices.some(s => s.canPerform);
        const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

        return (
          <div key={category} className="border border-gray-200 rounded-xl overflow-hidden">
            <div
              className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onToggleAllServices(category, !allSelected)}
                  className={`
                    w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                    ${allSelected
                      ? 'bg-cyan-500 border-cyan-500'
                      : someSelected
                        ? 'bg-cyan-200 border-cyan-400'
                        : 'border-gray-300'
                    }
                  `}
                >
                  {(allSelected || someSelected) && (
                    <CheckIcon className="w-3 h-3 text-white" />
                  )}
                </button>
                <span className="font-medium text-gray-900">{categoryName} Services</span>
              </div>
              <span className="text-sm text-gray-500">
                {categoryServices.filter(s => s.canPerform).length} / {categoryServices.length}
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {categoryServices.map(service => (
                <button
                  key={service.serviceId}
                  onClick={() => onToggleService(service.serviceId)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`
                        w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                        ${service.canPerform
                          ? 'bg-cyan-500 border-cyan-500'
                          : 'border-gray-300'
                        }
                      `}
                    >
                      {service.canPerform && (
                        <CheckIcon className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className={service.canPerform ? 'text-gray-900' : 'text-gray-600'}>
                      {service.serviceName}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">{service.defaultDuration} min</span>
                    <span className="text-gray-900 font-medium">${service.defaultPrice}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {/* Services Summary */}
      <div className="p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Services assigned:</span>
          <span className="font-semibold text-gray-900">{selectedServicesCount} services</span>
        </div>
      </div>
    </div>
  );
};

// Icons
const ScissorsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);

export default ServicesSection;
