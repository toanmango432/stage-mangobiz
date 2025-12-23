/**
 * ClientPreviewPopover Component
 * Shows client information preview on hover with quick actions
 */

import { memo } from 'react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { Phone, MessageSquare, User, Calendar, Heart, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ClientPreviewData {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  photo?: string;
  totalVisits?: number;
  lastVisit?: Date;
  upcomingAppointments?: number;
  favoriteServices?: string[];
  notes?: string;
}

interface ClientPreviewPopoverProps {
  client: ClientPreviewData;
  children: React.ReactElement;
  onCall?: (phone: string) => void;
  onSms?: (phone: string) => void;
  onViewProfile?: (clientId: string) => void;
}

function getInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(date: Date): string {
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return date.toLocaleDateString();
}

export const ClientPreviewPopover = memo(function ClientPreviewPopover({
  client,
  children,
  onCall,
  onSms,
  onViewProfile,
}: ClientPreviewPopoverProps) {
  const content = (
    <div className="w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-3">
        <div className="flex items-center gap-3">
          {client.photo ? (
            <img
              src={client.photo}
              alt={client.name}
              className="w-12 h-12 rounded-full border-2 border-white object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-white text-brand-600 flex items-center justify-center text-lg font-bold border-2 border-white">
              {getInitials(client.name)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-base truncate">
              {client.name}
            </h3>
            {client.email && (
              <p className="text-brand-50 text-xs truncate">{client.email}</p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Total Visits</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {client.totalVisits || 0}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Last Visit</span>
            </div>
            <div className="text-xs font-semibold text-gray-900 leading-tight">
              {client.lastVisit ? formatDate(client.lastVisit) : 'Never'}
            </div>
          </div>
        </div>

        {/* Upcoming Appointments */}
        {client.upcomingAppointments !== undefined &&
          client.upcomingAppointments > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span className="text-sm text-blue-900">
                {client.upcomingAppointments} upcoming{' '}
                {client.upcomingAppointments === 1 ? 'appointment' : 'appointments'}
              </span>
            </div>
          )}

        {/* Favorite Services */}
        {client.favoriteServices && client.favoriteServices.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
              <Heart className="w-3.5 h-3.5" />
              <span className="font-medium">Favorite Services</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {client.favoriteServices.slice(0, 3).map((service, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-pink-50 text-pink-700 text-xs rounded-full border border-pink-200"
                >
                  {service}
                </span>
              ))}
              {client.favoriteServices.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{client.favoriteServices.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {client.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
            <p className="text-xs text-amber-900 line-clamp-2">{client.notes}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-gray-200 p-3 bg-gray-50 flex gap-2">
        {client.phone && onCall && (
          <button
            onClick={() => onCall(client.phone!)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg',
              'bg-white border border-gray-300',
              'text-gray-700 text-sm font-medium',
              'hover:bg-gray-50 hover:border-gray-400',
              'active:scale-95 transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-brand-500'
            )}
          >
            <Phone className="w-4 h-4" />
            Call
          </button>
        )}
        {client.phone && onSms && (
          <button
            onClick={() => onSms(client.phone!)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg',
              'bg-white border border-gray-300',
              'text-gray-700 text-sm font-medium',
              'hover:bg-gray-50 hover:border-gray-400',
              'active:scale-95 transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-brand-500'
            )}
          >
            <MessageSquare className="w-4 h-4" />
            SMS
          </button>
        )}
        {onViewProfile && (
          <button
            onClick={() => onViewProfile(client.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg',
              'bg-brand-500 border border-brand-600',
              'text-white text-sm font-semibold',
              'hover:bg-brand-600',
              'active:scale-95 transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2'
            )}
          >
            <User className="w-4 h-4" />
            Profile
          </button>
        )}
      </div>
    </div>
  );

  return (
    <Tippy
      content={content}
      interactive={true}
      placement="right"
      delay={[300, 0]}
      offset={[0, 10]}
      animation="shift-away"
      theme="light"
      arrow={true}
      maxWidth={320}
      appendTo={document.body}
    >
      {children}
    </Tippy>
  );
});
