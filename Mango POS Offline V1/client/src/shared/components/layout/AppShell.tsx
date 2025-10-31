import { useState, useEffect } from 'react';
import { initializeDatabase, db } from '@/core/db/schema';
import { seedDatabase, getTestSalonId } from '@/core/db/seed';

export function AppShell() {
  const [activeModule, setActiveModule] = useState('frontdesk');
  const [isInitialized, setIsInitialized] = useState(false);
  const salonId = getTestSalonId();

  // Initialize database on app load
  useEffect(() => {
    async function initApp() {
      try {
        console.log('🚀 Initializing Mango POS...');
        
        // 1. Initialize IndexedDB
        const dbReady = await initializeDatabase();
        if (!dbReady) {
          console.error('Failed to initialize database');
          return;
        }
        console.log('✅ Database initialized');
        
        // 2. Check if we need to seed data (first run)
        const staffCount = await db.staff.count();
        if (staffCount === 0) {
          console.log('🌱 First run detected - seeding database...');
          await seedDatabase();
          console.log('✅ Database seeded');
        } else {
          console.log(`✅ Database already seeded (${staffCount} staff members)`);
        }
        
        setIsInitialized(true);
        console.log('🎉 App initialization complete!');
      } catch (error) {
        console.error('❌ App initialization failed:', error);
      }
    }
    
    initApp();
  }, []);

  const renderModule = () => {
    switch (activeModule) {
      case 'book':
        return <div className="p-4">Book Module - Coming Soon</div>;
      case 'frontdesk':
        return <div className="p-4">Front Desk Module - Coming Soon</div>;
      case 'tickets':
        return <div className="p-4">Tickets Module - Coming Soon</div>;
      case 'team':
        return <div className="p-4">Team Module - Coming Soon</div>;
      case 'pending':
        return <div className="p-4">Pending Module - Coming Soon</div>;
      case 'checkout':
        return <div className="p-4">Checkout Module - Coming Soon</div>;
      case 'transactions':
        return <div className="p-4">Transactions Module - Coming Soon</div>;
      case 'more':
        return <div className="p-4">More Module - Coming Soon</div>;
      default:
        return <div className="p-4">Front Desk Module - Coming Soon</div>;
    }
  };

  if (!isInitialized) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing Mango POS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      {/* Top Header */}
      <header className="bg-white shadow-sm px-4 py-3">
        <h1 className="text-xl font-bold text-gray-900">Mango POS Offline V1</h1>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        {renderModule()}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around">
          <button
            onClick={() => setActiveModule('book')}
            className={`px-3 py-2 rounded ${activeModule === 'book' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
          >
            Book
          </button>
          <button
            onClick={() => setActiveModule('frontdesk')}
            className={`px-3 py-2 rounded ${activeModule === 'frontdesk' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
          >
            Front Desk
          </button>
          <button
            onClick={() => setActiveModule('tickets')}
            className={`px-3 py-2 rounded ${activeModule === 'tickets' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
          >
            Tickets
          </button>
          <button
            onClick={() => setActiveModule('team')}
            className={`px-3 py-2 rounded ${activeModule === 'team' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
          >
            Team
          </button>
        </div>
      </nav>
    </div>
  );
}

