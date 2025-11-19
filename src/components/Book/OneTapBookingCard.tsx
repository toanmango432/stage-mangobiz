/**
 * One-Tap Booking Card
 * AI-powered instant booking for regular clients
 * Pre-fills everything based on client history - one tap to confirm
 */

import { useState } from 'react';
import { Sparkles, Calendar, Clock, DollarSign, User, CheckCircle2, Edit3, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface Staff {
  id: string;
  name: string;
  avatar?: string;
}

interface AIBookingSuggestion {
  confidence: number; // 0-100
  suggestedDate: Date;
  suggestedTime: string; // "14:00"
  services: Service[];
  staff: Staff;
  totalDuration: number;
  totalPrice: number;
  reasoning: {
    dateReason: string;
    timeReason: string;
    serviceReason: string;
    staffReason: string;
  };
  clientHistory: {
    lastVisit: Date;
    averageCycle: number; // days
    totalVisits: number;
    preferredDayOfWeek?: string;
    preferredTimeOfDay?: 'morning' | 'afternoon' | 'evening';
  };
}

interface OneTapBookingCardProps {
  clientName: string;
  suggestion: AIBookingSuggestion;
  onBookNow: (suggestion: AIBookingSuggestion) => Promise<void>;
  onCustomize: () => void;
  className?: string;
}

export function OneTapBookingCard({
  clientName,
  suggestion,
  onBookNow,
  onCustomize,
  className,
}: OneTapBookingCardProps) {
  const [isBooking, setIsBooking] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleBookNow = async () => {
    setIsBooking(true);
    try {
      await onBookNow(suggestion);
      toast.success(
        <div>
          <p className="font-semibold">Appointment Booked! 🎉</p>
          <p className="text-sm">Confirmation sent to {clientName}</p>
        </div>
      );
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to book appointment. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const formatDate = (date: Date): string => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 90) return 'from-green-500 to-emerald-500';
    if (confidence >= 75) return 'from-teal-500 to-cyan-500';
    if (confidence >= 60) return 'from-blue-500 to-indigo-500';
    return 'from-purple-500 to-pink-500';
  };

  const getConfidenceText = (confidence: number): string => {
    if (confidence >= 90) return 'Excellent Match';
    if (confidence >= 75) return 'Great Match';
    if (confidence >= 60) return 'Good Match';
    return 'Suggested';
  };

  const daysSinceLastVisit = Math.floor(
    (new Date().getTime() - new Date(suggestion.clientHistory.lastVisit).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl',
        'bg-gradient-to-br from-purple-50 via-white to-teal-50',
        'border-2 border-purple-200',
        'shadow-lg hover:shadow-xl transition-shadow duration-300',
        className
      )}
    >
      {/* AI Badge */}
      <div className="absolute top-4 right-4 z-10">
        <div className={cn(
          'px-3 py-1.5 rounded-full text-xs font-bold text-white',
          'bg-gradient-to-r shadow-md',
          getConfidenceColor(suggestion.confidence)
        )}>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            <span>{getConfidenceText(suggestion.confidence)}</span>
            <span className="opacity-90">({suggestion.confidence}%)</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-teal-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                One-Tap Booking
              </h3>
              <p className="text-sm text-gray-600">
                for {clientName}
              </p>
            </div>
          </div>
        </div>

        {/* Booking Details */}
        <div className="space-y-4 mb-6">
          {/* Date & Time */}
          <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-lg">
                {formatDate(suggestion.suggestedDate)}, {formatTime(suggestion.suggestedTime)}
              </p>
              <p className="text-sm text-gray-600 mt-0.5">
                {suggestion.reasoning.timeReason}
              </p>
            </div>
          </div>

          {/* Services */}
          <div className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-200">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-teal-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">
                {suggestion.services.map(s => s.name).join(' + ')}
              </p>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{suggestion.totalDuration} min</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span className="font-semibold text-gray-900">
                    ${suggestion.totalPrice}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {suggestion.reasoning.serviceReason}
              </p>
            </div>
          </div>

          {/* Staff */}
          <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">
                {suggestion.staff.name}
              </p>
              <p className="text-sm text-gray-600 mt-0.5">
                {suggestion.reasoning.staffReason}
              </p>
            </div>
          </div>
        </div>

        {/* Client Insights */}
        {showDetails && (
          <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <p className="text-sm font-semibold text-gray-900">Based on Client History</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-600">Last Visit</p>
                <p className="font-semibold text-gray-900">
                  {daysSinceLastVisit} days ago
                </p>
              </div>
              <div>
                <p className="text-gray-600">Total Visits</p>
                <p className="font-semibold text-gray-900">
                  {suggestion.clientHistory.totalVisits} times
                </p>
              </div>
              <div>
                <p className="text-gray-600">Typical Cycle</p>
                <p className="font-semibold text-gray-900">
                  Every {suggestion.clientHistory.averageCycle} days
                </p>
              </div>
              {suggestion.clientHistory.preferredTimeOfDay && (
                <div>
                  <p className="text-gray-600">Prefers</p>
                  <p className="font-semibold text-gray-900 capitalize">
                    {suggestion.clientHistory.preferredTimeOfDay}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Show/Hide Details */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full text-center text-sm text-purple-600 hover:text-purple-700 font-medium mb-4"
        >
          {showDetails ? 'Hide' : 'Show'} AI Analysis Details
        </button>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleBookNow}
            disabled={isBooking}
            className={cn(
              'flex-1 px-6 py-4 rounded-xl font-bold text-white',
              'bg-gradient-to-r from-purple-500 to-teal-500',
              'hover:from-purple-600 hover:to-teal-600',
              'shadow-lg hover:shadow-xl',
              'transition-all duration-200',
              'flex items-center justify-center gap-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              isBooking && 'btn-loading'
            )}
          >
            {isBooking ? (
              <>
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                <span>Booking...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Book Now - One Tap</span>
              </>
            )}
          </button>
          <button
            onClick={onCustomize}
            disabled={isBooking}
            className={cn(
              'px-6 py-4 rounded-xl font-semibold',
              'bg-white text-gray-700',
              'border-2 border-gray-300',
              'hover:border-gray-400 hover:bg-gray-50',
              'transition-all duration-200',
              'flex items-center justify-center gap-2',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <Edit3 className="w-5 h-5" />
            <span>Customize</span>
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-center text-gray-500 mt-4">
          AI analyzed {suggestion.clientHistory.totalVisits} past visits to make this suggestion
        </p>
      </div>
    </div>
  );
}
