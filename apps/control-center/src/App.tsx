import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import LoginPage from "@/components/auth/LoginPage";

// Import all admin pages from the migrated pages directory
import { AdminDashboard } from "@/pages/AdminDashboard";
import { CustomerManagement } from "@/pages/CustomerManagement";
import { LicenseManagement } from "@/pages/LicenseManagement";
import { StoreManagement } from "@/pages/StoreManagement";
import { MemberManagement } from "@/pages/MemberManagement";
import { DeviceManagement } from "@/pages/DeviceManagement";
import { FeatureFlagsManagement } from "@/pages/FeatureFlagsManagement";
import { AuditLogsViewer } from "@/pages/AuditLogsViewer";
import { AdminUserManagement } from "@/pages/AdminUserManagement";
import { SystemConfiguration } from "@/pages/SystemConfiguration";
import { AnalyticsDashboard } from "@/pages/AnalyticsDashboard";
import { AnnouncementsManagement } from "@/pages/AnnouncementsManagement";
import { SurveyManagement } from "@/pages/SurveyManagement";
import { QuickOnboard } from "@/pages/QuickOnboard";

// Import AdminLayout from migrated layouts
import { AdminLayout } from "@/layouts/AdminLayout";
import { useState } from "react";

// Route path to section ID mapping (for AdminLayout navigation)
const routeToSection: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/tenants': 'customers',
  '/licenses': 'licenses',
  '/stores': 'stores',
  '/members': 'members',
  '/devices': 'devices',
  '/features': 'features',
  '/audit': 'auditLogs',
  '/admins': 'adminUsers',
  '/system': 'system',
  '/analytics': 'analytics',
  '/announcements': 'announcements',
  '/surveys': 'surveys',
};

// Section ID to route path mapping
const sectionToRoute: Record<string, string> = {
  'dashboard': '/dashboard',
  'customers': '/tenants',
  'licenses': '/licenses',
  'stores': '/stores',
  'members': '/members',
  'devices': '/devices',
  'features': '/features',
  'auditLogs': '/audit',
  'adminUsers': '/admins',
  'system': '/system',
  'analytics': '/analytics',
  'announcements': '/announcements',
  'surveys': '/surveys',
};

/**
 * Main layout wrapper that integrates AdminLayout with React Router
 */
function MainLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showQuickOnboard, setShowQuickOnboard] = useState(false);

  // Get current section from route
  const activeSection = routeToSection[location.pathname] || 'dashboard';

  const handleNavigate = (section: string) => {
    const route = sectionToRoute[section];
    if (route) {
      navigate(route);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <AdminLayout
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onQuickOnboard={() => setShowQuickOnboard(true)}
        adminUser={user ? { email: user.email, name: user.name, role: user.role } : null}
      >
        {children}
      </AdminLayout>

      {/* Quick Onboard Modal */}
      {showQuickOnboard && (
        <QuickOnboard
          onClose={() => setShowQuickOnboard(false)}
          onComplete={() => {
            setShowQuickOnboard(false);
            navigate('/tenants');
          }}
        />
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes with AdminLayout */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<AdminDashboard />} />
                    <Route path="/tenants" element={<CustomerManagement />} />
                    <Route path="/licenses" element={<LicenseManagement />} />
                    <Route path="/stores" element={<StoreManagement />} />
                    <Route path="/members" element={<MemberManagement />} />
                    <Route path="/devices" element={<DeviceManagement />} />
                    <Route path="/features" element={<FeatureFlagsManagement />} />
                    <Route path="/audit" element={<AuditLogsViewer />} />
                    <Route path="/admins" element={<AdminUserManagement />} />
                    <Route path="/system" element={<SystemConfiguration />} />
                    <Route path="/analytics" element={<AnalyticsDashboard />} />
                    <Route path="/announcements" element={<AnnouncementsManagement />} />
                    <Route path="/surveys" element={<SurveyManagement />} />
                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </MainLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
