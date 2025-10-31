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
import { initializeDatabase, db } from '../../db/schema';
import { seedDatabase, getTestSalonId } from '../../db/seed';

export function AppShell() {
  const [activeModule, setActiveModule] = useState('frontdesk');
  const [isInitialized, setIsInitialized] = useState(false);
  const { pendingTickets } = useTickets();
  const pendingCount = pendingTickets.length;
  const dispatch = useAppDispatch();
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
        
        // 3. Load staff into Redux
        await dispatch(fetchAllStaff(salonId));
        console.log('✅ Staff loaded into Redux');
        
        setIsInitialized(true);
        console.log('🎉 App initialization complete!');
      } catch (error) {
        console.error('❌ App initialization failed:', error);
      }
    }
    
    initApp();
  }, [dispatch, salonId]);

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

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
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
