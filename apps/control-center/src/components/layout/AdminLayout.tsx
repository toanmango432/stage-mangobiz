/**
 * Admin Layout Component
 * Main layout with sidebar navigation for Control Center
 */

import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Key,
  Store,
  UserCog,
  Smartphone,
  Flag,
  FileText,
  Settings,
  BarChart3,
  Megaphone,
  LogOut,
  ChevronLeft,
  Shield,
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/tenants", label: "Tenants", icon: Users },
  { path: "/licenses", label: "Licenses", icon: Key },
  { path: "/stores", label: "Stores", icon: Store },
  { path: "/members", label: "Members", icon: UserCog },
  { path: "/devices", label: "Devices", icon: Smartphone },
  { path: "/features", label: "Feature Flags", icon: Flag },
  { path: "/audit", label: "Audit Logs", icon: FileText },
  { path: "/admins", label: "Admin Users", icon: Shield },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/announcements", label: "Announcements", icon: Megaphone },
  { path: "/system", label: "System Config", icon: Settings },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm">Control Center</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-md hover:bg-sidebar-accent transition-colors"
          >
            <ChevronLeft
              className={cn(
                "w-4 h-4 transition-transform",
                isCollapsed && "rotate-180"
              )}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-sidebar-border">
          {!isCollapsed && user && (
            <div className="mb-3">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-sidebar-foreground/70 truncate">{user.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-sidebar-accent rounded-full capitalize">
                {user.role.replace('_', ' ')}
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-colors",
              "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
