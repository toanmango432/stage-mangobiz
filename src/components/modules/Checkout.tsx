import { useState } from 'react';
import { QuickCheckout } from '../checkout/QuickCheckout';
import { Search, CreditCard, Check } from 'lucide-react';

export function Checkout() {
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleCheckout = (ticket: any) => {
    setSelectedTicket(ticket);
  };

  const handlePaymentComplete = (payments: any, tip: number, discount: number) => {
    console.log('Payment completed:', { payments, tip, discount });
    setSelectedTicket(null);
    // TODO: Process payment and update ticket status
  };

  // TODO: Replace with actual ticket data from Redux/API
  const mockPendingTickets: any[] = [];

  const filteredTickets = mockPendingTickets.filter(ticket =>
    ticket.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Checkout</h1>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CreditCard className="w-4 h-4" />
            <span>{mockPendingTickets.length} pending</span>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client name or ticket number..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
      </div>

      {/* Pending Tickets List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-3">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer"
              onClick={() => handleCheckout(ticket)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {ticket.clientPhoto ? (
                    <img src={ticket.clientPhoto} alt={ticket.clientName} className="w-12 h-12 rounded-full" />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {ticket.clientName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{ticket.clientName}</h3>
                    <p className="text-sm text-gray-500">Ticket #{ticket.id}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">${ticket.total.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">{ticket.services.length} service(s)</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex flex-wrap gap-2">
                  {ticket.services.map((service: any) => (
                    <span key={service.id} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {service.name}
                    </span>
                  ))}
                  {ticket.products.map((product: any) => (
                    <span key={product.id} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                      {product.name} (×{product.quantity})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {filteredTickets.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No pending tickets</p>
              <p className="text-sm text-gray-400 mt-1">Completed services will appear here for checkout</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Checkout Modal */}
      {selectedTicket && (
        <QuickCheckout
          isOpen={!!selectedTicket}
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
}
