import React, { useEffect, useState } from 'react';
import { initializeDatabase, clearDatabase } from '../db/schema';
import { seedDatabase, getTestSalonId } from '../db/seed';
import { useStaff, useClients, useServices } from '../db/hooks';

export function DatabaseDemo() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSeeded, setIsSeeded] = useState(false);
  const salonId = getTestSalonId();

  const staff = useStaff(salonId);
  const clients = useClients(salonId);
  const services = useServices(salonId);

  useEffect(() => {
    initializeDatabase().then((success) => {
      setIsInitialized(success);
    });
  }, []);

  const handleSeed = async () => {
    await seedDatabase();
    setIsSeeded(true);
  };

  const handleClear = async () => {
    await clearDatabase();
    setIsSeeded(false);
  };

  if (!isInitialized) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing IndexedDB...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          🎉 Phase 1: Database Layer Complete!
        </h1>

        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h2 className="text-lg font-semibold text-green-900 mb-2">✅ What's Working:</h2>
          <ul className="list-disc list-inside text-green-800 space-y-1">
            <li>IndexedDB initialized with Dexie.js</li>
            <li>8 tables created (appointments, tickets, transactions, staff, clients, services, settings, syncQueue)</li>
            <li>Database service layer with CRUD operations</li>
            <li>React hooks for real-time data access</li>
            <li>Sample data seeding</li>
            <li>TypeScript interfaces for all entities</li>
          </ul>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={handleSeed}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            🌱 Seed Database
          </button>
          <button
            onClick={handleClear}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
          >
            🗑️ Clear Database
          </button>
        </div>

        {isSeeded && (
          <div className="space-y-6">
            {/* Staff Section */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                👥 Staff ({staff?.length || 0})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {staff?.map((member) => (
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
                  </div>
                ))}
              </div>
            </div>

            {/* Clients Section */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                👤 Clients ({clients?.length || 0})
              </h3>
              <div className="space-y-2">
                {clients?.map((client) => (
                  <div key={client.id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-gray-900">{client.name}</div>
                      <div className="text-sm text-gray-600">{client.phone} • {client.email}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">{client.totalVisits} visits</div>
                      <div className="text-sm font-semibold text-green-600">${client.totalSpent}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Services Section */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                ✂️ Services ({services?.length || 0})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services?.map((service) => (
                  <div key={service.id} className="bg-gray-50 p-3 rounded-lg">
                    <div className="font-semibold text-gray-900">{service.name}</div>
                    <div className="text-sm text-gray-600">{service.category}</div>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-lg font-bold text-blue-600">${service.price}</span>
                      <span className="text-sm text-gray-600">{service.duration} min</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!isSeeded && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Click "Seed Database" to load sample data</p>
          </div>
        )}
      </div>

      {/* Technical Info */}
      <div className="mt-6 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">🔧 Technical Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Database:</strong> IndexedDB (Dexie.js)
          </div>
          <div>
            <strong>Tables:</strong> 8 (appointments, tickets, transactions, staff, clients, services, settings, syncQueue)
          </div>
          <div>
            <strong>Real-time Updates:</strong> useLiveQuery hooks
          </div>
          <div>
            <strong>Offline Support:</strong> ✅ All data persists locally
          </div>
        </div>
      </div>
    </div>
  );
}
