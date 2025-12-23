import { X, ChevronLeft, ChevronRight, User, Users, Calendar, Clock, DollarSign, CreditCard, Receipt, Package, Percent, GitMerge } from 'lucide-react';
import { useEffect } from 'react';
import type { Ticket } from '../../types';
import type { LocalAppointment } from '../../types/appointment';

interface SalesDetailsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  data: Ticket | LocalAppointment | null;
  type: 'ticket' | 'appointment';
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export function SalesDetailsPanel({
  isOpen,
  onClose,
  data,
  type,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext
}: SalesDetailsPanelProps) {
  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when panel is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!data) return null;

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      // Transaction/Payment Statuses
      'paid': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'unpaid': 'bg-rose-100 text-rose-800 border-rose-200',
      'partial-payment': 'bg-amber-100 text-amber-800 border-amber-200',
      'pending': 'bg-blue-100 text-blue-800 border-blue-200',
      'failed': 'bg-red-100 text-red-800 border-red-200',
      'refunded': 'bg-purple-100 text-purple-800 border-purple-200',
      'partially-refunded': 'bg-violet-100 text-violet-800 border-violet-200',
      'voided': 'bg-slate-100 text-slate-800 border-slate-200',
      // Legacy/Appointment Statuses
      'completed': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'scheduled': 'bg-blue-100 text-blue-800 border-blue-200',
      'checked-in': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'in-service': 'bg-purple-100 text-purple-800 border-purple-200',
      'cancelled': 'bg-gray-100 text-gray-800 border-gray-200',
      'no-show': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const isTicket = type === 'ticket';
  const ticket = isTicket ? (data as Ticket) : null;
  const appointment = !isTicket ? (data as LocalAppointment) : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isTicket ? 'bg-blue-50' : 'bg-purple-50'}`}>
                <Receipt className={`w-5 h-5 ${isTicket ? 'text-blue-600' : 'text-purple-600'}`} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {isTicket ? 'Sales Transaction' : 'Appointment Details'}
                </h2>
                {data.id && (
                  <p className="text-sm text-gray-500">
                    Receipt #{String(data.id).slice(0, 8).toUpperCase()}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close panel"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Date & Client Info Row */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Transaction Date</p>
                <p className="text-base font-semibold text-gray-900">
                  {formatDate(isTicket ? (ticket?.createdAt || data.createdAt) : (appointment?.scheduledStartTime || data.createdAt))}
                </p>
                <p className="text-sm text-gray-600">
                  {formatTime(isTicket ? (ticket?.createdAt || data.createdAt) : (appointment?.scheduledStartTime || data.createdAt))}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Status</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(data.status)}`}>
                  {data.status}
                </span>
              </div>
            </div>

            {/* Client Info */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                {ticket?.isGroupTicket ? (
                  <>
                    <Users className="w-4 h-4 text-purple-600" />
                    <span>Group Ticket - {ticket.clients?.length || 1} Clients</span>
                  </>
                ) : (
                  'Client'
                )}
              </h3>
              {ticket?.isGroupTicket && ticket.clients ? (
                <div className="space-y-3">
                  {ticket.clients.map((client, index) => (
                    <div key={client.clientId} className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          {client.clientName}
                          {index === 0 && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Primary</span>
                          )}
                        </h4>
                        {client.clientPhone && (
                          <p className="text-xs text-gray-600">{client.clientPhone}</p>
                        )}
                        {client.services && client.services.length > 0 && (
                          <p className="text-xs text-purple-600 mt-1">
                            {client.services.length} service{client.services.length !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-gray-900">
                      {data.clientName || 'Walk-in Customer'}
                    </h4>
                    {data.clientPhone && (
                      <p className="text-sm text-gray-600">{data.clientPhone}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Merged Ticket Info */}
            {ticket?.isMergedTicket && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <GitMerge className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-semibold text-blue-900">
                    Merged Ticket
                  </h3>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-blue-800">
                    This transaction was created by merging {ticket.mergedFromTickets?.length || 0} separate ticket{(ticket.mergedFromTickets?.length || 0) !== 1 ? 's' : ''}:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ticket.mergedFromTickets?.map((ticketId) => (
                      <span key={ticketId} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-mono">
                        #{ticketId}
                      </span>
                    ))}
                  </div>
                  {ticket.mergedAt && (
                    <p className="text-xs text-blue-600 mt-2">
                      Merged on {formatDate(ticket.mergedAt)} at {formatTime(ticket.mergedAt)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Date & Time (for appointments) */}
            {appointment && (
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                  Appointment Schedule
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="text-gray-900 font-medium">
                        {formatDate(appointment.scheduledStartTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Time</p>
                      <p className="text-gray-900 font-medium">
                        {formatTime(appointment.scheduledStartTime)} - {formatTime(appointment.scheduledEndTime)}
                      </p>
                    </div>
                  </div>
                  {appointment.source && (
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Source</p>
                        <p className="text-gray-900 font-medium capitalize">{appointment.source}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Staff Assignment */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                Staff Assignment
              </h3>
              <div className="space-y-2">
                {isTicket && ticket ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-brand-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {(ticket as any).techName?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium">
                        {(ticket as any).techName || 'Unassigned'}
                      </p>
                      <p className="text-sm text-gray-500">Technician</p>
                    </div>
                  </div>
                ) : appointment ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-brand-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {appointment.staffName?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium">
                        {appointment.staffName || 'Unassigned'}
                      </p>
                      <p className="text-sm text-gray-500">Staff Member</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Services
              </h3>
              <div className="space-y-2">
                {isTicket && ticket?.services ? (
                  ticket.services.map((service, index) => (
                    <div key={index} className="flex justify-between items-start py-3 border-b border-gray-100 last:border-0">
                      <div className="flex-1">
                        <p className="text-base font-medium text-gray-900">{service.serviceName}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-gray-600">{service.staffName}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-sm text-gray-500">{service.duration} min</span>
                        </div>
                      </div>
                      <p className="text-base font-semibold text-gray-900 tabular-nums ml-4">${service.price.toFixed(2)}</p>
                    </div>
                  ))
                ) : appointment?.services ? (
                  appointment.services.map((service, index) => (
                    <div key={index} className="flex justify-between items-start py-3 border-b border-gray-100 last:border-0">
                      <div className="flex-1">
                        <p className="text-base font-medium text-gray-900">{service.serviceName}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-gray-600">{service.staffName}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-sm text-gray-500">{service.duration} min</span>
                        </div>
                      </div>
                      <p className="text-base font-semibold text-gray-900 tabular-nums ml-4">${service.price.toFixed(2)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4 text-sm">No services listed</p>
                )}
              </div>
            </div>

            {/* Products (for tickets) */}
            {isTicket && ticket && ticket.products && ticket.products.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Products
                </h3>
                <div className="space-y-2">
                  {ticket.products.map((product, index) => (
                    <div key={index} className="flex justify-between items-start py-3 border-b border-gray-100 last:border-0">
                      <div className="flex-1">
                        <p className="text-base font-medium text-gray-900">{product.productName}</p>
                        <p className="text-sm text-gray-500 mt-1">Qty: {product.quantity} × ${product.price.toFixed(2)}</p>
                      </div>
                      <p className="text-base font-semibold text-gray-900 tabular-nums ml-4">${product.total.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Summary (for tickets) */}
            {isTicket && ticket && (
              <div className="border-t-2 border-gray-200 pt-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Payment Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900 font-medium tabular-nums">${ticket.subtotal.toFixed(2)}</span>
                  </div>
                  {ticket.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-1.5">
                        <Percent className="w-3.5 h-3.5" />
                        Discount
                        {ticket.discountReason && (
                          <span className="text-xs text-gray-500">({ticket.discountReason})</span>
                        )}
                      </span>
                      <span className="text-red-600 font-medium tabular-nums">-${ticket.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Tax{ticket.taxRate && ` (${ticket.taxRate}%)`}
                    </span>
                    <span className="text-gray-900 font-medium tabular-nums">${ticket.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm pb-3 border-b border-gray-200">
                    <span className="text-gray-600">Subtotal after tax</span>
                    <span className="text-gray-900 font-medium tabular-nums">${(ticket.subtotal - ticket.discount + ticket.tax).toFixed(2)}</span>
                  </div>
                  {ticket.tip > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Gratuity</span>
                      <span className="text-gray-900 font-medium tabular-nums">${ticket.tip.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg px-4 py-3 border border-green-200 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-bold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-green-700 tabular-nums">${ticket.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Details (for tickets) */}
            {isTicket && ticket && ticket.payments && ticket.payments.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Payment Details
                </h3>
                <div className="space-y-3">
                  {ticket.payments.map((payment, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          {payment.method.toLowerCase().includes('card') || payment.method.toLowerCase().includes('credit') || payment.method.toLowerCase().includes('debit') ? (
                            <CreditCard className="w-4 h-4 text-blue-600" />
                          ) : (
                            <DollarSign className="w-4 h-4 text-green-600" />
                          )}
                          <span className="font-medium text-gray-900">
                            {payment.method}
                            {payment.cardLast4 && ` ****${payment.cardLast4}`}
                          </span>
                        </div>
                        <span className="text-base font-semibold text-gray-900 tabular-nums">${payment.total.toFixed(2)}</span>
                      </div>
                      {payment.transactionId && (
                        <p className="text-xs text-gray-500 mt-1">
                          Transaction ID: {payment.transactionId}
                        </p>
                      )}
                      {payment.processedAt && (
                        <p className="text-xs text-gray-500">
                          Processed at {formatTime(payment.processedAt)}
                        </p>
                      )}
                      {payment.amount !== payment.total && (
                        <div className="text-xs text-gray-600 mt-2 space-y-1">
                          <div className="flex justify-between">
                            <span>Amount:</span>
                            <span className="tabular-nums">${payment.amount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tip:</span>
                            <span className="tabular-nums">${payment.tip.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {(appointment as any)?.notes && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Notes
                </h3>
                <p className="text-sm text-gray-700 bg-amber-50 border border-amber-200 rounded-lg p-3 whitespace-pre-wrap">
                  {(appointment as any)?.notes}
                </p>
              </div>
            )}
          </div>

          {/* Footer with Navigation */}
          {(hasPrevious || hasNext) && (
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <button
                  onClick={onPrevious}
                  disabled={!hasPrevious}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-sm font-medium">Previous</span>
                </button>
                <button
                  onClick={onNext}
                  disabled={!hasNext}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-sm font-medium">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
