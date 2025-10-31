import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchAllStaff, selectAllStaff } from '../store/slices/staffSlice';
import { fetchActiveTickets, selectActiveTickets } from '../store/slices/ticketsSlice';
import { selectIsOnline, selectPendingOperations } from '../store/slices/syncSlice';
import { getTestSalonId, seedDatabase } from '../db/seed';

export function ReduxDemo() {
  const dispatch = useAppDispatch();
  const staff = useAppSelector(selectAllStaff);
  const activeTickets = useAppSelector(selectActiveTickets);
  const isOnline = useAppSelector(selectIsOnline);
  const pendingOps = useAppSelector(selectPendingOperations);
  const salonId = getTestSalonId();

  useEffect(() => {
    // Seed database first
    seedDatabase().then(() => {
      // Then fetch data into Redux
      dispatch(fetchAllStaff(salonId));
      dispatch(fetchActiveTickets(salonId));
    });
  }, [dispatch, salonId]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          🎉 Phase 2: Redux Toolkit Complete!
        </h1>

        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h2 className="text-lg font-semibold text-green-900 mb-2">✅ What's Working:</h2>
          <ul className="list-disc list-inside text-green-800 space-y-1">
            <li>Redux Toolkit store configured</li>
            <li>8 Redux slices created (appointments, tickets, staff, clients, transactions, auth, sync, ui)</li>
            <li>Async thunks for database operations</li>
            <li>TypeScript-typed hooks (useAppDispatch, useAppSelector)</li>
            <li>Automatic sync queue integration</li>
            <li>Real-time state updates</li>
          </ul>
        </div>

        {/* Sync Status */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">🔄 Sync Status</h3>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            <div className="text-sm">
              <span className="font-medium">Pending Operations:</span> {pendingOps}
            </div>
          </div>
        </div>

        {/* Staff from Redux */}
        <div className="border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            👥 Staff (from Redux) - {staff.length}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {staff.map((member) => (
              <div key={member.id} className="bg-gray-50 p-3 rounded-lg">
                <div className="text-2xl mb-2">{member.avatar}</div>
                <div className="font-semibold text-gray-900">{member.name}</div>
                <div className="text-sm text-gray-600">{member.phone}</div>
                <div className="mt-2">
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    member.status === 'available' ? 'bg-green-100 text-green-800' :
                    member.status === 'busy' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {member.status}
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  <div>Services: {member.servicesCountToday}</div>
                  <div>Revenue: ${member.revenueToday}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Tickets from Redux */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            🎫 Active Tickets (from Redux) - {activeTickets.length}
          </h3>
          {activeTickets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No active tickets</p>
              <p className="text-sm mt-2">Create a ticket to see it appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeTickets.map((ticket) => (
                <div key={ticket.id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-gray-900">{ticket.clientName}</div>
                    <div className="text-sm text-gray-600">
                      {ticket.services.map(s => s.serviceName).join(', ')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-block px-2 py-1 text-xs rounded-full ${
                      ticket.status === 'in-service' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {ticket.status}
                    </div>
                    <div className="text-sm font-semibold text-green-600 mt-1">
                      ${ticket.total.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Technical Info */}
      <div className="mt-6 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">🔧 Redux Store Structure</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-mono">
          <div>
            <strong>State Slices:</strong>
            <ul className="ml-4 mt-2 space-y-1">
              <li>• appointments</li>
              <li>• tickets</li>
              <li>• staff</li>
              <li>• clients</li>
            </ul>
          </div>
          <div>
            <strong>More Slices:</strong>
            <ul className="ml-4 mt-2 space-y-1">
              <li>• transactions</li>
              <li>• auth</li>
              <li>• sync</li>
              <li>• ui</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
          <strong>Async Operations:</strong> All database operations automatically add to sync queue for offline support
        </div>
      </div>
    </div>
  );
}
