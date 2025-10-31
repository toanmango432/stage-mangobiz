/**
 * Smart Booking Panel
 * Displays AI-powered booking suggestions based on client history
 */

import { memo } from 'react';
import { Sparkles, Clock, User, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { SmartBookingSuggestion } from '../../services/bookingIntelligence';

interface SmartBookingPanelProps {
  suggestions: SmartBookingSuggestion;
  onUseQuickBooking?: () => void;
  onSelectService?: (serviceId: string) => void;
  onSelectStaff?: (staffId: string) => void;
  onSelectTime?: (time: Date) => void;
}

export const SmartBookingPanel = memo(function SmartBookingPanel({
  suggestions,
  onUseQuickBooking,
  onSelectService,
  onSelectStaff,
  onSelectTime,
}: SmartBookingPanelProps) {
  const hasQuickBooking = suggestions.quickBooking !== undefined;

  return (
    <div className="bg-gradient-to-br from-purple-50 to-teal-50 border border-purple-200 rounded-xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-teal-500 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Smart Booking Suggestions</h3>
          <p className="text-xs text-gray-600">Based on booking history</p>
        </div>
      </div>

      {/* Client Info */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-600 mb-1">Last Visit</p>
            <p className="font-semibold text-gray-900">{suggestions.clientInfo.lastVisit}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Total Visits</p>
            <p className="font-semibold text-gray-900">{suggestions.clientInfo.totalVisits}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Avg. Spend</p>
            <p className="font-semibold text-gray-900">${suggestions.clientInfo.averageSpend.toFixed(0)}</p>
          </div>
        </div>
      </div>

      {/* Quick Booking Option */}
      {hasQuickBooking && suggestions.quickBooking && (
        <div className="bg-white rounded-lg p-4 border-2 border-purple-300 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                <p className="font-bold text-gray-900">One-Click Booking</p>
              </div>
              <p className="text-sm text-gray-600">{suggestions.quickBooking.reason}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-purple-600">
                {Math.round(suggestions.quickBooking.confidence)}% match
              </p>
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Service:</span>
              <span className="font-semibold text-gray-900">
                {suggestions.quickBooking.services.map(s => s.serviceName).join(', ')}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Staff:</span>
              <span className="font-semibold text-gray-900">
                {suggestions.quickBooking.services[0].staffName}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Time:</span>
              <span className="font-semibold text-gray-900">
                {new Date(suggestions.quickBooking.suggestedTime).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Duration:</span>
              <span className="font-semibold text-gray-900">{suggestions.quickBooking.estimatedDuration} min</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Price:</span>
              <span className="font-bold text-gray-900 text-base">${suggestions.quickBooking.estimatedPrice}</span>
            </div>
          </div>

          {onUseQuickBooking && (
            <button
              onClick={onUseQuickBooking}
              className="w-full bg-gradient-to-r from-purple-500 to-teal-500 text-white font-semibold py-3 px-4 rounded-lg hover:from-purple-600 hover:to-teal-600 transition-all shadow-lg hover:shadow-xl"
            >
              Book Now - One Click
            </button>
          )}
        </div>
      )}

      {/* Service Suggestions */}
      {suggestions.suggestedServices.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <p className="font-semibold text-gray-900 text-sm">Suggested Services</p>
          </div>
          <div className="space-y-2">
            {suggestions.suggestedServices.map((service, index) => (
              <button
                key={service.serviceId}
                onClick={() => onSelectService?.(service.serviceId)}
                className={cn(
                  'w-full text-left bg-white rounded-lg p-3 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all',
                  index === 0 && 'border-purple-300 bg-purple-50'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{service.serviceName}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{service.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-purple-600">
                      {Math.round(service.confidence)}%
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Staff Suggestions */}
      {suggestions.suggestedStaff.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <User className="w-4 h-4 text-purple-600" />
            <p className="font-semibold text-gray-900 text-sm">Preferred Staff</p>
          </div>
          <div className="space-y-2">
            {suggestions.suggestedStaff.map((staff, index) => (
              <button
                key={staff.staffId}
                onClick={() => onSelectStaff?.(staff.staffId)}
                className={cn(
                  'w-full text-left bg-white rounded-lg p-3 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all',
                  !staff.isAvailable && 'opacity-60',
                  index === 0 && staff.isAvailable && 'border-purple-300 bg-purple-50'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900">{staff.staffName}</p>
                      {!staff.isAvailable && (
                        <AlertCircle className="w-3 h-3 text-orange-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{staff.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-purple-600">
                      {Math.round(staff.confidence)}%
                    </p>
                    {!staff.isAvailable && (
                      <p className="text-xs text-orange-600 mt-0.5">Busy</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Time Suggestions */}
      {suggestions.suggestedTimes.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Clock className="w-4 h-4 text-purple-600" />
            <p className="font-semibold text-gray-900 text-sm">Best Times</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {suggestions.suggestedTimes.map((time, index) => (
              <button
                key={time.time.getTime()}
                onClick={() => onSelectTime?.(time.time)}
                className={cn(
                  'bg-white rounded-lg p-3 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all text-center',
                  index === 0 && 'border-purple-300 bg-purple-50'
                )}
              >
                <p className="font-semibold text-gray-900 text-sm">{time.displayTime}</p>
                {index === 0 && (
                  <p className="text-xs text-gray-600 mt-1">{time.reason}</p>
                )}
                {!time.isAvailable && (
                  <p className="text-xs text-orange-600 mt-1">Full</p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

