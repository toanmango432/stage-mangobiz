import { useState, useEffect } from 'react';
import { TopHeaderBar } from './TopHeaderBar';
import { BottomNavBar } from './BottomNavBar';
import { Book } from '../modules/Book';
import { FrontDesk } from '../modules/FrontDesk';
import { Tickets } from '../modules/Tickets';
import { Team } from '../modules/Team';
import { Pending } from '../modules/Pending';
import { Checkout } from '../modules/Checkout';
import { Transactions } from '../modules/Transactions';
import { More } from '../modules/More';
import { useTickets } from '../../hooks/useTicketsCompat';
import { useAppDispatch } from '../../store/hooks';
import { fetchAllStaff } from '../../store/slices/staffSlice';
import { setOnlineStatus } from '../../store/slices/syncSlice';
import { initializeDatabase, db } from '../../db/schema';
import { seedDatabase, getTestSalonId } from '../../db/seed';
import { syncManager } from '../../services/syncManager';
import { NetworkStatus } from '../NetworkStatus';

export function AppShell() {
  const [activeModule, setActiveModule] = useState('frontdesk');
  const [isInitialized, setIsInitialized] = useState(false);
  const { pendingTickets } = useTickets();
  const pendingCount = pendingTickets.length;
  const dispatch = useAppDispatch();
  const salonId = getTestSalonId();

  // Initialize database and sync manager on app load
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
        
        // 3. Load staff into Redux
        await dispatch(fetchAllStaff(salonId));
        console.log('✅ Staff loaded into Redux');
        
        // 4. Start sync manager
        syncManager.start();
        console.log('✅ Sync Manager started');
        
        // 5. Set initial online status
        dispatch(setOnlineStatus(navigator.onLine));
        
        setIsInitialized(true);
        console.log('🎉 App initialization complete!');
      } catch (error) {
        console.error('❌ App initialization failed:', error);
      }
    }
    
    initApp();
    
    // Cleanup on unmount
    return () => {
      syncManager.stop();
      console.log('🛑 Sync Manager stopped');
    };
  }, [dispatch, salonId]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => dispatch(setOnlineStatus(true));
    const handleOffline = () => dispatch(setOnlineStatus(false));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dispatch]);

  const renderModule = () => {
    switch (activeModule) {
      case 'book':
        return <Book />;
      case 'frontdesk':
        return <FrontDesk />;
      case 'tickets':
        return <Tickets />;
      case 'team':
        return <Team />;
      case 'pending':
        return <Pending />;
      case 'checkout':
        return <Checkout />;
      case 'transactions':
        return <Transactions />;
      case 'more':
        return <More />;
      default:
        return <FrontDesk />;
    }
  };

  // Show loading screen while initializing
  if (!isInitialized) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-pink-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Mango POS</h2>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      {/* Network Status Indicator */}
      <NetworkStatus />
      
      {/* Top Header - Always visible */}
      <TopHeaderBar />

      {/* Main Content Area - No scrolling, let sections handle it */}
      <main className="flex-1 overflow-hidden pt-10">
        {renderModule()}
      </main>

      {/* Bottom Navigation - Always visible */}
      <BottomNavBar 
        activeModule={activeModule} 
        onModuleChange={setActiveModule}
        pendingCount={pendingCount}
      />
    </div>
  );
}
