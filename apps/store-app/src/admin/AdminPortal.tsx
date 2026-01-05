import { useState, useEffect } from 'react';
import { AdminLogin } from './auth/AdminLogin';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminDashboard } from './pages/AdminDashboard';
import { CustomerManagement } from './pages/CustomerManagement';
import { LicenseManagement } from './pages/LicenseManagement';
import { FeatureFlagsManagement } from './pages/FeatureFlagsManagement';
import { StoreManagement } from './pages/StoreManagement';
import { MemberManagement } from './pages/MemberManagement';
import { DeviceManagement } from './pages/DeviceManagement';
import { AuditLogsViewer } from './pages/AuditLogsViewer';
import { AdminUserManagement } from './pages/AdminUserManagement';
import { SystemConfiguration } from './pages/SystemConfiguration';
import { AnalyticsDashboard } from './pages/AnalyticsDashboard';
import { AnnouncementsManagement } from './pages/AnnouncementsManagement';
import { SurveyManagement } from './pages/SurveyManagement';
import { QuickOnboard } from './pages/QuickOnboard';
import { initializeAdminDatabase, seedAdminDatabase } from './db/schema';
import { adminUsersDB } from './db/database';

type AdminSection = 'dashboard' | 'customers' | 'licenses' | 'stores' | 'members' | 'devices' | 'features' | 'auditLogs' | 'adminUsers' | 'system' | 'analytics' | 'announcements' | 'surveys';

interface AdminUserSession {
  id: string;
  email: string;
  name: string;
  role: string;
}

export function AdminPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [adminUser, setAdminUser] = useState<AdminUserSession | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [showQuickOnboard, setShowQuickOnboard] = useState(false);

  // Initialize admin database on mount
  useEffect(() => {
    async function initDB() {
      try {
        console.log('🔧 Initializing Admin Portal...');
        const success = await initializeAdminDatabase();
        if (!success) {
          setInitError('Failed to initialize database');
          setIsInitializing(false);
          return;
        }

        // Seed with demo data if empty
        await seedAdminDatabase();

        // Check for existing session
        const session = localStorage.getItem('mango_admin_session');
        if (session) {
          try {
            const data = JSON.parse(session);
            // Verify the user still exists
            const user = await adminUsersDB.getById(data.id);
            if (user && user.isActive) {
              setIsAuthenticated(true);
              setAdminUser({
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
              });
            } else {
              localStorage.removeItem('mango_admin_session');
            }
          } catch (e) {
            localStorage.removeItem('mango_admin_session');
          }
        }

        setIsInitializing(false);
      } catch (error) {
        console.error('❌ Admin Portal initialization failed:', error);
        setInitError('Failed to initialize admin portal');
        setIsInitializing(false);
      }
    }

    initDB();
  }, []);

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      const user = await adminUsersDB.verifyPassword(email, password);
      if (!user) {
        return false;
      }

      if (!user.isActive) {
        return false;
      }

      // Record login
      await adminUsersDB.recordLogin(user.id);

      // Save session
      const sessionData = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        loginTime: new Date().toISOString(),
      };
      localStorage.setItem('mango_admin_session', JSON.stringify(sessionData));

      setIsAuthenticated(true);
      setAdminUser({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mango_admin_session');
    setIsAuthenticated(false);
    setAdminUser(null);
  };

  // Show loading state
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Mango Control Center</h2>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-2xl flex items-center justify-center">
            <span className="text-3xl">❌</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Initialization Error</h2>
          <p className="text-gray-600">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'customers':
        return <CustomerManagement />;
      case 'licenses':
        return <LicenseManagement />;
      case 'stores':
        return <StoreManagement />;
      case 'members':
        return <MemberManagement />;
      case 'devices':
        return <DeviceManagement />;
      case 'features':
        return <FeatureFlagsManagement />;
      case 'auditLogs':
        return <AuditLogsViewer />;
      case 'adminUsers':
        return <AdminUserManagement />;
      case 'system':
        return <SystemConfiguration />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'announcements':
        return <AnnouncementsManagement />;
      case 'surveys':
        return <SurveyManagement />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <>
      <AdminLayout
        activeSection={activeSection}
        onNavigate={(section) => setActiveSection(section as AdminSection)}
        onLogout={handleLogout}
        onQuickOnboard={() => setShowQuickOnboard(true)}
        adminUser={adminUser}
      >
        {renderSection()}
      </AdminLayout>

      {/* Quick Onboard Modal */}
      {showQuickOnboard && (
        <QuickOnboard
          onClose={() => setShowQuickOnboard(false)}
          onComplete={() => {
            setShowQuickOnboard(false);
            setActiveSection('customers');
          }}
        />
      )}
    </>
  );
}
