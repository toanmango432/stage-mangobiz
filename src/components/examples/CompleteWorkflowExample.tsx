/**
 * Complete Salon Workflow Example
 * 
 * This file demonstrates how to integrate all the salon operation components
 * into a complete workflow from customer arrival to checkout.
 */

import { useState } from 'react';
import { StaffManagementPage } from '../StaffManagement/StaffManagementPage';
import { MultiStaffAssignment } from '../TicketManagement/MultiStaffAssignment';
import { QuickCheckout } from '../Checkout/QuickCheckout';
import { Staff } from '../../types/staff';
import { Ticket, TicketService, Payment } from '../../types/Ticket';

export function CompleteWorkflowExample() {
  // Sample data - in production, this would come from Redux store
  const [staff, setStaff] = useState<Staff[]>([
    {
      id: 'staff_1',
      salonId: 'salon_1',
      name: 'Sarah Johnson',
      email: 'sarah@salon.com',
      phone: '(555) 123-4567',
      avatar: '',
      specialties: ['haircut', 'color'],
      status: 'available',
      schedule: [],
      servicesCountToday: 5,
      revenueToday: 450,
      tipsToday: 75,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced'
    },
    {
      id: 'staff_2',
      salonId: 'salon_1',
      name: 'Mike Chen',
      email: 'mike@salon.com',
      phone: '(555) 234-5678',
      avatar: '',
      specialties: ['nails', 'pedicure'],
      status: 'available',
      schedule: [],
      servicesCountToday: 3,
      revenueToday: 280,
      tipsToday: 45,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced'
    }
  ]);

  const [currentTicket, setCurrentTicket] = useState<Ticket>({
    id: 'ticket_1',
    salonId: 'salon_1',
    clientId: 'client_1',
    clientName: 'Jane Doe',
    clientPhone: '(555) 987-6543',
    services: [
      {
        serviceId: 'service_1',
        serviceName: 'Haircut & Style',
        staffId: '',
        staffName: '',
        price: 65,
        duration: 45,
        commission: 0.4,
        startTime: new Date()
      },
      {
        serviceId: 'service_2',
        serviceName: 'Hair Color',
        staffId: '',
        staffName: '',
        price: 120,
        duration: 90,
        commission: 0.35,
        startTime: new Date()
      }
    ],
    products: [
      {
        productId: 'product_1',
        productName: 'Shampoo',
        quantity: 1,
        price: 25,
        total: 25
      }
    ],
    status: 'in-service',
    subtotal: 210,
    discount: 0,
    tax: 0,
    tip: 0,
    total: 210,
    payments: [],
    createdAt: new Date(),
    createdBy: 'user_1',
    lastModifiedBy: 'user_1',
    syncStatus: 'synced'
  });

  const [showStaffManagement, setShowStaffManagement] = useState(false);
  const [showStaffAssignment, setShowStaffAssignment] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  // Staff Management Handlers
  const handleAddStaff = (newStaff: Partial<Staff>) => {
    const staffMember: Staff = {
      id: `staff_${Date.now()}`,
      salonId: 'salon_1',
      name: newStaff.name || '',
      email: newStaff.email || '',
      phone: newStaff.phone || '',
      specialties: newStaff.specialties || [],
      status: newStaff.status || 'available',
      schedule: newStaff.schedule || [],
      servicesCountToday: 0,
      revenueToday: 0,
      tipsToday: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'pending'
    };
    setStaff([...staff, staffMember]);
    console.log('✅ Staff added:', staffMember);
  };

  const handleEditStaff = (updatedStaff: Partial<Staff>) => {
    setStaff(staff.map(s => 
      s.id === updatedStaff.id ? { ...s, ...updatedStaff, updatedAt: new Date() } : s
    ));
    console.log('✅ Staff updated:', updatedStaff);
  };

  const handleDeleteStaff = (staffId: string) => {
    setStaff(staff.filter(s => s.id !== staffId));
    console.log('✅ Staff deleted:', staffId);
  };

  // Multi-Staff Assignment Handlers
  const handleAssignStaff = (serviceIndex: number, staffId: string, staffName: string) => {
    const updatedServices = [...currentTicket.services];
    updatedServices[serviceIndex] = {
      ...updatedServices[serviceIndex],
      staffId,
      staffName
    };
    setCurrentTicket({
      ...currentTicket,
      services: updatedServices
    });
    console.log('✅ Staff assigned to service:', { serviceIndex, staffId, staffName });
  };

  const handleRemoveStaff = (serviceIndex: number) => {
    const updatedServices = [...currentTicket.services];
    updatedServices[serviceIndex] = {
      ...updatedServices[serviceIndex],
      staffId: '',
      staffName: ''
    };
    setCurrentTicket({
      ...currentTicket,
      services: updatedServices
    });
    console.log('✅ Staff removed from service:', serviceIndex);
  };

  const handleAddService = () => {
    const newService: TicketService = {
      serviceId: `service_${Date.now()}`,
      serviceName: 'New Service',
      staffId: '',
      staffName: '',
      price: 0,
      duration: 30,
      commission: 0.4,
      startTime: new Date()
    };
    setCurrentTicket({
      ...currentTicket,
      services: [...currentTicket.services, newService]
    });
    console.log('✅ Service added to ticket');
  };

  // Checkout Handlers
  const handleCompleteCheckout = (payments: Payment[], tip: number, discount: number) => {
    const completedTicket = {
      ...currentTicket,
      payments,
      tip,
      discount,
      status: 'completed' as const,
      completedAt: new Date()
    };
    setCurrentTicket(completedTicket);
    setShowCheckout(false);
    console.log('✅ Checkout completed:', {
      ticketId: completedTicket.id,
      total: payments.reduce((sum, p) => sum + p.total, 0),
      tip,
      discount,
      payments
    });
    alert('Checkout completed successfully! Check console for details.');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Demo Navigation */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            🎯 Complete Salon Workflow Demo
          </h1>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setShowStaffManagement(true);
                setShowStaffAssignment(false);
                setShowCheckout(false);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showStaffManagement
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              1️⃣ Staff Management
            </button>
            <button
              onClick={() => {
                setShowStaffManagement(false);
                setShowStaffAssignment(true);
                setShowCheckout(false);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showStaffAssignment
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              2️⃣ Assign Staff to Ticket
            </button>
            <button
              onClick={() => {
                setShowStaffManagement(false);
                setShowStaffAssignment(false);
                setShowCheckout(true);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showCheckout
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              3️⃣ Checkout
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {showStaffManagement && (
          <StaffManagementPage
            staff={staff}
            onAddStaff={handleAddStaff}
            onEditStaff={handleEditStaff}
            onDeleteStaff={handleDeleteStaff}
          />
        )}

        {showStaffAssignment && (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Current Ticket: {currentTicket.clientName}
                </h2>
                <p className="text-gray-600 mb-4">
                  Assign staff members to each service
                </p>
                <MultiStaffAssignment
                  availableStaff={staff}
                  services={currentTicket.services}
                  onAssignStaff={handleAssignStaff}
                  onRemoveStaff={handleRemoveStaff}
                  onAddService={handleAddService}
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-900 mb-2">💡 Tips:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Click "Assign Staff" to select a staff member for each service</li>
                  <li>• You can assign different staff to different services</li>
                  <li>• Staff availability status is shown in real-time</li>
                  <li>• Click "Add Service" to add more services to the ticket</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {!showStaffManagement && !showStaffAssignment && !showCheckout && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to Salon Operations Demo
              </h2>
              <p className="text-gray-600 mb-6">
                Click the buttons above to explore each workflow step
              </p>
              <div className="inline-block text-left bg-white rounded-xl shadow-lg p-6 max-w-md">
                <h3 className="font-semibold text-gray-900 mb-3">Workflow Steps:</h3>
                <ol className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="font-bold text-teal-500 mr-2">1.</span>
                    <span><strong>Staff Management:</strong> Add and manage your team members</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold text-blue-500 mr-2">2.</span>
                    <span><strong>Staff Assignment:</strong> Assign staff to services on a ticket</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold text-green-500 mr-2">3.</span>
                    <span><strong>Checkout:</strong> Process payment with tips and discounts</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      <QuickCheckout
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        ticket={currentTicket}
        onComplete={handleCompleteCheckout}
      />
    </div>
  );
}
