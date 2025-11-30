import { useState } from 'react';
import TicketPanel from '../checkout/TicketPanel';
import { Search, CreditCard, Plus } from 'lucide-react';
import { Ticket } from '../../types/Ticket';
import { StaffMember } from '../checkout/ServiceList';

export function Checkout() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleOpenPanel = () => {
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
  };

  // Mock staff members - in production, this would come from Redux/API
  const mockStaffMembers: StaffMember[] = [
    { id: 'staff-1', name: 'Sarah Johnson' },
    { id: 'staff-2', name: 'Mike Chen' },
    { id: 'staff-3', name: 'Lisa Martinez' },
    { id: 'staff-4', name: 'David Kim' },
    { id: 'staff-5', name: 'Emily Davis' },
  ];

  // Mock pending tickets - in production, this would come from Redux/API
  const mockPendingTickets: Ticket[] = [
    {
      id: 'TKT-001',
      salonId: 'salon-1',
      clientId: 'client-1',
      clientName: 'Jessica Parker',
      clientPhone: '555-0101',
      services: [
        {
          serviceId: 'svc-1',
          serviceName: 'Haircut - Women',
          staffId: 'staff-1',
          staffName: 'Sarah Johnson',
          price: 65,
          duration: 45,
          commission: 50,
          startTime: new Date(),
        },
        {
          serviceId: 'svc-2',
          serviceName: 'Color - Full',
          staffId: 'staff-1',
          staffName: 'Sarah Johnson',
          price: 120,
          duration: 90,
          commission: 50,
          startTime: new Date(),
        },
      ],
      products: [],
      status: 'in-service',
      subtotal: 185,
      discount: 0,
      tax: 16.65,
      tip: 0,
      total: 201.65,
      payments: [],
      createdAt: new Date(),
      createdBy: 'user-1',
      lastModifiedBy: 'user-1',
      syncStatus: 'synced',
    },
    {
      id: 'TKT-002',
      salonId: 'salon-1',
      clientId: 'client-2',
      clientName: 'Michael Brown',
      clientPhone: '555-0102',
      services: [
        {
          serviceId: 'svc-3',
          serviceName: 'Haircut - Men',
          staffId: 'staff-2',
          staffName: 'Mike Chen',
          price: 35,
          duration: 30,
          commission: 50,
          startTime: new Date(),
        },
      ],
      products: [
        {
          productId: 'prod-1',
          productName: 'Hair Gel',
          quantity: 1,
          price: 15,
          total: 15,
        },
      ],
      status: 'in-service',
      subtotal: 50,
      discount: 0,
      tax: 4.50,
      tip: 0,
      total: 54.50,
      payments: [],
      createdAt: new Date(),
      createdBy: 'user-1',
      lastModifiedBy: 'user-1',
      syncStatus: 'synced',
    },
    {
      id: 'TKT-003',
      salonId: 'salon-1',
      clientId: 'client-3',
      clientName: 'Emily Davis',
      clientPhone: '555-0103',
      services: [
        {
          serviceId: 'svc-4',
          serviceName: 'Manicure',
          staffId: 'staff-3',
          staffName: 'Lisa Martinez',
          price: 35,
          duration: 30,
          commission: 50,
          startTime: new Date(),
        },
        {
          serviceId: 'svc-5',
          serviceName: 'Pedicure',
          staffId: 'staff-3',
          staffName: 'Lisa Martinez',
          price: 45,
          duration: 45,
          commission: 50,
          startTime: new Date(),
        },
      ],
      products: [],
      status: 'in-service',
      subtotal: 80,
      discount: 10,
      tax: 6.30,
      tip: 0,
      total: 76.30,
      payments: [],
      createdAt: new Date(),
      createdBy: 'user-1',
      lastModifiedBy: 'user-1',
      syncStatus: 'synced',
    },
  ];

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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CreditCard className="w-4 h-4" />
              <span>{mockPendingTickets.length} pending</span>
            </div>
            <button
              onClick={handleOpenPanel}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/30"
            >
              <Plus className="w-5 h-5" />
              New Ticket
            </button>
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
              onClick={handleOpenPanel}
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
                  {ticket.services.map((service, idx) => (
                    <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {service.serviceName}
                    </span>
                  ))}
                  {ticket.products.map((product, idx) => (
                    <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                      {product.productName} (×{product.quantity})
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

      {/* Ticket Panel - Full checkout experience */}
      <TicketPanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        staffMembers={mockStaffMembers}
      />
    </div>
  );
}
