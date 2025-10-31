import { X, UserPlus, Edit2, Trash2, Check, Pause } from 'lucide-react';

interface TicketDetailsModalProps {
  ticket: {
    id: string;
    number: number;
    clientName: string;
    clientType: string;
    service: string;
    duration: string;
    time: string;
    status: 'waiting' | 'in-service' | 'completed';
    assignedTo?: {
      id: string;
      name: string;
      color: string;
    };
    assignedStaff?: Array<{
      id: string;
      name: string;
      color: string;
    }>;
    notes?: string;
    priority?: 'normal' | 'high';
    technician?: string;
    techColor?: string;
    createdAt?: Date;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function TicketDetailsModal({ ticket, isOpen, onClose }: TicketDetailsModalProps) {
  if (!isOpen) return null;

  // Get staff info
  const staffList = ticket.assignedStaff || (ticket.assignedTo ? [ticket.assignedTo] : []);
  const primaryStaff = ticket.technician || staffList[0]?.name || 'Unassigned';
  const staffColor = ticket.techColor || staffList[0]?.color || '#6B7280';

  // Calculate times
  const now = new Date();
  const createdAt = ticket.createdAt ? new Date(ticket.createdAt) : now;
  const elapsedMinutes = ticket.status === 'in-service' 
    ? Math.floor((now.getTime() - createdAt.getTime()) / 60000)
    : null;
  
  // Parse duration to calculate estimated completion
  const durationMatch = ticket.duration.match(/(\d+)/);
  const durationMinutes = durationMatch ? parseInt(durationMatch[0]) : 45;
  const estimatedCompletion = ticket.status === 'in-service' && elapsedMinutes !== null
    ? new Date(createdAt.getTime() + durationMinutes * 60000)
    : null;
  const remainingMinutes = estimatedCompletion 
    ? Math.max(0, Math.floor((estimatedCompletion.getTime() - now.getTime()) / 60000))
    : null;

  // Calculate wait time for waiting tickets
  const waitMinutes = ticket.status === 'waiting'
    ? Math.floor((now.getTime() - createdAt.getTime()) / 60000)
    : null;

  // Client type badge styling
  const clientTypeBadge = {
    VIP: { bg: '#FFF9E6', text: '#8B6914', border: '#E5D4A0', icon: '⭐' },
    Priority: { bg: '#FFF1F0', text: '#B91C1C', border: '#FCA5A5', icon: '🔥' },
    New: { bg: '#EEF2FF', text: '#4338CA', border: '#C7D2FE', icon: '✨' },
    Regular: { bg: '#F9FAFB', text: '#4B5563', border: '#E5E7EB', icon: '👤' }
  };

  const badge = clientTypeBadge[ticket.clientType as keyof typeof clientTypeBadge] || clientTypeBadge.Regular;

  // Paper texture style
  const paperStyle = {
    background: ticket.status === 'waiting' 
      ? 'linear-gradient(135deg, #FFFBF0 0%, #FFF8E1 100%)'
      : 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
    boxShadow: `
      0 4px 6px rgba(0, 0, 0, 0.07),
      0 2px 4px rgba(0, 0, 0, 0.06),
      inset 0 0 0 1px rgba(255, 255, 255, 0.5),
      inset 0 1px 2px rgba(255, 255, 255, 0.8)
    `,
  };

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="rounded-lg shadow-2xl max-w-md w-full relative overflow-hidden"
        style={paperStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 hover:bg-black/5 rounded-full transition-colors z-10"
        >
          <X size={16} className="text-gray-600" />
        </button>

        {/* Content - EXPANDED with more details */}
        <div className="p-5">
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xl font-bold" style={{ fontFamily: 'monospace', color: ticket.status === 'waiting' ? '#D97706' : '#2563EB' }}>
                #{ticket.number}
              </span>
              {ticket.priority === 'high' && (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                  HIGH PRIORITY
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-gray-900">{ticket.clientName}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span 
                className="px-2 py-0.5 rounded text-xs font-bold inline-flex items-center gap-1"
                style={{ 
                  backgroundColor: badge.bg, 
                  color: badge.text,
                  border: `1px solid ${badge.border}`
                }}
              >
                <span>{badge.icon}</span>
                <span>{ticket.clientType} Client</span>
              </span>
              <span className="text-xs text-gray-500">
                • Created {createdAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Service Details */}
          <div className="mb-4 pb-4 border-b border-dashed" style={{ borderColor: ticket.status === 'waiting' ? '#F59E0B' : '#60A5FA' }}>
            <div className="text-xs text-gray-600 mb-1">Service</div>
            <div className="text-sm font-bold text-gray-900 mb-1">{ticket.service}</div>
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <span>Duration: {ticket.duration}</span>
              {estimatedCompletion && (
                <>
                  <span>•</span>
                  <span>Est. done: {estimatedCompletion.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                </>
              )}
            </div>
          </div>

          {/* Staff Assignment */}
          {primaryStaff !== 'Unassigned' && (
            <div className="mb-4">
              <div className="text-xs text-gray-600 mb-1.5">Assigned Staff</div>
              <div className="flex items-center gap-2">
                <span 
                  className="inline-block px-2.5 py-1 rounded text-white text-sm font-semibold"
                  style={{ backgroundColor: staffColor }}
                >
                  {primaryStaff}
                </span>
                {staffList.length > 1 && (
                  <span className="text-xs text-gray-500">+{staffList.length - 1} more</span>
                )}
              </div>
            </div>
          )}

          {/* Time & Progress - EXPANDED INFO */}
          <div className="mb-4 bg-white/50 rounded-lg p-3">
            <div className="text-xs font-semibold text-gray-700 mb-2">Time Details</div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Scheduled:</span>
                <span className="font-medium text-gray-900">{ticket.time}</span>
              </div>
              
              {ticket.status === 'in-service' && elapsedMinutes !== null && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Elapsed:</span>
                    <span className="font-medium text-gray-900">{elapsedMinutes} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Remaining:</span>
                    <span className="font-medium text-gray-900">{remainingMinutes} min</span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-semibold text-blue-600">
                        {Math.min(100, Math.round((elapsedMinutes / durationMinutes) * 100))}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                        style={{ width: `${Math.min(100, (elapsedMinutes / durationMinutes) * 100)}%` }}
                      />
                    </div>
                  </div>
                </>
              )}
              
              {ticket.status === 'waiting' && waitMinutes !== null && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Waiting for:</span>
                  <span className="font-medium text-amber-700">{waitMinutes} min</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes - FULL TEXT */}
          {ticket.notes && (
            <div className="mb-4 bg-white/60 rounded-lg p-3">
              <div className="text-xs font-semibold text-gray-700 mb-1.5">Notes</div>
              <div className="text-xs text-gray-700 leading-relaxed">{ticket.notes}</div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-dashed" style={{ borderColor: ticket.status === 'waiting' ? '#F59E0B' : '#60A5FA' }}>
            <div className="text-xs font-semibold text-gray-700 mb-2">Actions</div>
            <div className="grid grid-cols-2 gap-2">
              {ticket.status === 'waiting' && (
                <>
                  <button 
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-xs font-semibold transition-colors"
                    onClick={(e) => { e.stopPropagation(); console.log('Assign staff'); }}
                  >
                    <UserPlus size={14} />
                    <span>Assign Staff</span>
                  </button>
                  <button 
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-xs font-semibold transition-colors"
                    onClick={(e) => { e.stopPropagation(); console.log('Edit ticket'); }}
                  >
                    <Edit2 size={14} />
                    <span>Edit</span>
                  </button>
                  <button 
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-xs font-semibold transition-colors col-span-2"
                    onClick={(e) => { e.stopPropagation(); console.log('Delete ticket'); }}
                  >
                    <Trash2 size={14} />
                    <span>Delete Ticket</span>
                  </button>
                </>
              )}
              {ticket.status === 'in-service' && (
                <>
                  <button 
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-xs font-semibold transition-colors"
                    onClick={(e) => { e.stopPropagation(); console.log('Complete service'); }}
                  >
                    <Check size={14} />
                    <span>Complete</span>
                  </button>
                  <button 
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-xs font-semibold transition-colors"
                    onClick={(e) => { e.stopPropagation(); console.log('Pause service'); }}
                  >
                    <Pause size={14} />
                    <span>Pause</span>
                  </button>
                  <button 
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-xs font-semibold transition-colors"
                    onClick={(e) => { e.stopPropagation(); console.log('Edit ticket'); }}
                  >
                    <Edit2 size={14} />
                    <span>Edit</span>
                  </button>
                  <button 
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-xs font-semibold transition-colors"
                    onClick={(e) => { e.stopPropagation(); console.log('Cancel service'); }}
                  >
                    <Trash2 size={14} />
                    <span>Cancel</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Perforation at bottom */}
        <div 
          className="h-[8px] opacity-25"
          style={{ 
            backgroundImage: ticket.status === 'waiting'
              ? 'repeating-linear-gradient(90deg, #8B5C2E 0px, #8B5C2E 4px, transparent 4px, transparent 8px)'
              : 'repeating-linear-gradient(90deg, #2563EB 0px, #2563EB 4px, transparent 4px, transparent 8px)'
          }}
        />
      </div>
    </div>
  );
}
