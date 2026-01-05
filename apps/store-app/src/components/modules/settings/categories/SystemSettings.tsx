/**
 * System Settings Category
 * Devices, Theme, Layout, Module Visibility
 */

import { useSelector, useDispatch } from 'react-redux';
import { 
  Settings, 
  Monitor, 
  Palette, 
  Layout,
  Sun,
  Moon,
  Laptop,
  Eye,
  EyeOff,
  GripVertical,
  Wifi,
  WifiOff,
  Smartphone,
  Globe
} from 'lucide-react';
import type { AppDispatch } from '@/store';
import {
  selectSystemSettings,
  updateThemeSettings,
  updateLayoutSettings,
  updateModuleVisibility,
} from '@/store/slices/settingsSlice';
import type { 
  ThemeMode, 
  DefaultView, 
  SidebarPosition, 
  FontSize,
  ModuleVisibility 
} from '@/types/settings';
import { cn } from '@/lib/utils';

// =============================================================================
// SHARED COMPONENTS
// =============================================================================

function SettingsSection({ 
  title, 
  icon, 
  children 
}: { 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <span className="text-amber-600">{icon}</span>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

function FormField({ 
  label, 
  children, 
  hint 
}: { 
  label: string; 
  children: React.ReactNode; 
  hint?: string;
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

function Select<T extends string>({ 
  value, 
  onChange, 
  options 
}: { 
  value: T; 
  onChange: (value: T) => void; 
  options: { value: T; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function Toggle({ 
  checked, 
  onChange, 
}: { 
  checked: boolean; 
  onChange: (checked: boolean) => void; 
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
        checked ? 'bg-amber-500' : 'bg-gray-200'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}

// Theme option button
function ThemeOption({ 
  icon, 
  label, 
  selected, 
  onClick 
}: { 
  icon: React.ReactNode; 
  label: string; 
  selected: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
        selected 
          ? 'border-amber-500 bg-amber-50' 
          : 'border-gray-200 hover:border-gray-300'
      )}
    >
      <span className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center',
        selected ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'
      )}>
        {icon}
      </span>
      <span className={cn(
        'text-sm font-medium',
        selected ? 'text-amber-900' : 'text-gray-700'
      )}>
        {label}
      </span>
    </button>
  );
}

// =============================================================================
// OPTIONS
// =============================================================================

const DEFAULT_VIEW_OPTIONS: { value: DefaultView; label: string }[] = [
  { value: 'book', label: 'Book (Calendar)' },
  { value: 'front_desk', label: 'Front Desk' },
  { value: 'sales', label: 'Sales' },
];

const SIDEBAR_POSITION_OPTIONS: { value: SidebarPosition; label: string }[] = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
];

const FONT_SIZE_OPTIONS: { value: FontSize; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

const MODULE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  book: { label: 'Book', icon: <Monitor className="w-4 h-4" /> },
  front_desk: { label: 'Front Desk', icon: <Layout className="w-4 h-4" /> },
  sales: { label: 'Sales', icon: <Smartphone className="w-4 h-4" /> },
  pending: { label: 'Pending', icon: <Globe className="w-4 h-4" /> },
  team: { label: 'Team', icon: <Settings className="w-4 h-4" /> },
  clients: { label: 'Clients', icon: <Settings className="w-4 h-4" /> },
  reports: { label: 'Reports', icon: <Settings className="w-4 h-4" /> },
};

// Mock registered devices for display
const MOCK_DEVICES = [
  { id: '1', name: 'Front Desk iPad', type: 'ipad', status: 'active', mode: 'offline-enabled', lastActive: new Date().toISOString() },
  { id: '2', name: 'Station 2 Tablet', type: 'android_tablet', status: 'active', mode: 'online-only', lastActive: new Date(Date.now() - 3600000).toISOString() },
  { id: '3', name: 'Manager Desktop', type: 'desktop', status: 'inactive', mode: 'online-only', lastActive: new Date(Date.now() - 86400000).toISOString() },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function SystemSettings() {
  const dispatch = useDispatch<AppDispatch>();
  const system = useSelector(selectSystemSettings);

  if (!system) {
    return <div className="text-gray-500">Loading system settings...</div>;
  }

  const { theme, layout, moduleVisibility } = system;

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleThemeModeChange = (mode: ThemeMode) => {
    dispatch(updateThemeSettings({ mode }));
  };

  const handleLayoutChange = (field: string, value: string | boolean) => {
    dispatch(updateLayoutSettings({ [field]: value }));
  };

  const handleModuleVisibilityToggle = (module: string, visible: boolean) => {
    const updated = moduleVisibility.map((m: ModuleVisibility) => 
      m.module === module ? { ...m, visible } : m
    );
    dispatch(updateModuleVisibility(updated));
  };

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  return (
    <div>
      {/* Registered Devices */}
      <SettingsSection title="Registered Devices" icon={<Monitor className="w-5 h-5" />}>
        <p className="text-sm text-gray-500 mb-4">Devices registered to access this store</p>
        
        <div className="space-y-3">
          {MOCK_DEVICES.map((device) => (
            <div key={device.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  device.status === 'active' ? 'bg-green-100' : 'bg-gray-100'
                )}>
                  {device.mode === 'offline-enabled' ? (
                    <Wifi className={cn('w-5 h-5', device.status === 'active' ? 'text-green-600' : 'text-gray-400')} />
                  ) : (
                    <WifiOff className={cn('w-5 h-5', device.status === 'active' ? 'text-blue-600' : 'text-gray-400')} />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{device.name}</p>
                  <p className="text-sm text-gray-500">
                    {device.type === 'ipad' ? 'iPad' : device.type === 'android_tablet' ? 'Android Tablet' : 'Desktop'} • 
                    {device.mode === 'offline-enabled' ? ' Offline-Enabled' : ' Online-Only'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={cn(
                  'text-xs px-2 py-1 rounded-full',
                  device.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                )}>
                  {device.status === 'active' ? 'Active' : 'Inactive'}
                </span>
                <p className="text-xs text-gray-400 mt-1">{formatLastActive(device.lastActive)}</p>
              </div>
            </div>
          ))}
        </div>
      </SettingsSection>

      {/* Theme Settings */}
      <SettingsSection title="Theme" icon={<Palette className="w-5 h-5" />}>
        <p className="text-sm text-gray-500 mb-4">Choose your preferred color theme</p>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <ThemeOption
            icon={<Sun className="w-5 h-5" />}
            label="Light"
            selected={theme.mode === 'light'}
            onClick={() => handleThemeModeChange('light')}
          />
          <ThemeOption
            icon={<Moon className="w-5 h-5" />}
            label="Dark"
            selected={theme.mode === 'dark'}
            onClick={() => handleThemeModeChange('dark')}
          />
          <ThemeOption
            icon={<Laptop className="w-5 h-5" />}
            label="System"
            selected={theme.mode === 'system'}
            onClick={() => handleThemeModeChange('system')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Brand Color" hint="Primary brand color">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.brandColor}
                onChange={(e) => dispatch(updateThemeSettings({ brandColor: e.target.value }))}
                className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <span className="text-sm text-gray-600 font-mono">{theme.brandColor}</span>
            </div>
          </FormField>
          <FormField label="Accent Color" hint="Secondary accent color">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.accentColor}
                onChange={(e) => dispatch(updateThemeSettings({ accentColor: e.target.value }))}
                className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <span className="text-sm text-gray-600 font-mono">{theme.accentColor}</span>
            </div>
          </FormField>
        </div>
      </SettingsSection>

      {/* Layout Settings */}
      <SettingsSection title="Layout" icon={<Layout className="w-5 h-5" />}>
        <FormField label="Default View" hint="Screen shown after login">
          <Select
            value={layout.defaultView}
            onChange={(v) => handleLayoutChange('defaultView', v)}
            options={DEFAULT_VIEW_OPTIONS}
          />
        </FormField>

        <FormField label="Sidebar Position">
          <Select
            value={layout.sidebarPosition}
            onChange={(v) => handleLayoutChange('sidebarPosition', v)}
            options={SIDEBAR_POSITION_OPTIONS}
          />
        </FormField>

        <FormField label="Font Size">
          <Select
            value={layout.fontSize}
            onChange={(v) => handleLayoutChange('fontSize', v)}
            options={FONT_SIZE_OPTIONS}
          />
        </FormField>

        <div className="flex items-center justify-between py-3 border-t border-gray-100">
          <div>
            <p className="font-medium text-gray-900">Compact Mode</p>
            <p className="text-sm text-gray-500">Reduce spacing for more content</p>
          </div>
          <Toggle
            checked={layout.compactMode}
            onChange={(checked) => handleLayoutChange('compactMode', checked)}
          />
        </div>
      </SettingsSection>

      {/* Module Visibility */}
      <SettingsSection title="Module Visibility" icon={<Settings className="w-5 h-5" />}>
        <p className="text-sm text-gray-500 mb-4">Show or hide modules in the navigation</p>
        
        <div className="space-y-2">
          {moduleVisibility.map((mod: ModuleVisibility) => {
            const moduleInfo = MODULE_LABELS[mod.module] || { label: mod.module, icon: <Settings className="w-4 h-4" /> };
            return (
              <div key={mod.module} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <GripVertical className="w-4 h-4 text-gray-300 cursor-move" />
                  <span className="text-gray-400">{moduleInfo.icon}</span>
                  <span className="font-medium text-gray-900">{moduleInfo.label}</span>
                </div>
                <button
                  onClick={() => handleModuleVisibilityToggle(mod.module, !mod.visible)}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    mod.visible 
                      ? 'text-green-600 hover:bg-green-50' 
                      : 'text-gray-400 hover:bg-gray-100'
                  )}
                >
                  {mod.visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
            );
          })}
        </div>
      </SettingsSection>
    </div>
  );
}

export default SystemSettings;
