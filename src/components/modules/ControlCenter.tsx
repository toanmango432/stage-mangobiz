import { useState, useEffect } from 'react';
import {
  Shield,
  Store,
  Settings,
  Users,
  BookOpen,
  ToggleLeft,
  Key,
  CheckCircle,
  AlertTriangle,
  Building2,
  MapPin,
  CreditCard,
  Activity,
  Zap,
  Package
} from 'lucide-react';
import { LicenseManagementPanel } from './control-center/LicenseManagementPanel';
import { StoreConfigurationPanel } from './control-center/StoreConfigurationPanel';
import { OnboardingSettingsPanel } from './control-center/OnboardingSettingsPanel';
import { SystemOperationsPanel } from './control-center/SystemOperationsPanel';
import { FeatureTogglesPanel } from './control-center/FeatureTogglesPanel';

type TabType = 'license' | 'store' | 'onboarding' | 'operations' | 'features';

export function ControlCenter() {
  const [activeTab, setActiveTab] = useState<TabType>('license');

  // Mock license data (should come from backend/database)
  const [licenseInfo, setLicenseInfo] = useState({
    status: 'active',
    tier: 'professional',
    expiresAt: new Date('2025-12-31'),
    devicesAllowed: 5,
    devicesActive: 2,
    locationsAllowed: 3,
    locationsActive: 1,
    features: [
      'multi-device',
      'inventory-management',
      'advanced-reporting',
      'customer-loyalty',
      'online-booking'
    ]
  });

  const isLicenseExpiringSoon = () => {
    const daysUntilExpiry = Math.floor(
      (licenseInfo.expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30;
  };

  const getLicenseStatusColor = () => {
    if (licenseInfo.status === 'expired') return 'red';
    if (isLicenseExpiringSoon()) return 'yellow';
    return 'green';
  };

  const tabs = [
    {
      id: 'license' as TabType,
      label: 'License Management',
      icon: Shield,
      description: 'Manage your license and subscription'
    },
    {
      id: 'store' as TabType,
      label: 'Store Configuration',
      icon: Store,
      description: 'Configure store settings and locations'
    },
    {
      id: 'onboarding' as TabType,
      label: 'Onboarding Setup',
      icon: BookOpen,
      description: 'Configure initial setup process'
    },
    {
      id: 'operations' as TabType,
      label: 'System Operations',
      icon: Settings,
      description: 'Configure how the POS operates'
    },
    {
      id: 'features' as TabType,
      label: 'Feature Toggles',
      icon: ToggleLeft,
      description: 'Enable/disable features'
    }
  ];

  const currentTab = tabs.find(t => t.id === activeTab);

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-7 h-7 text-blue-600" />
                Control Center
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                System configuration, licensing, and administrative settings
              </p>
            </div>

            {/* License Status Badge */}
            <div className={`px-4 py-2 rounded-lg border-2 ${
              getLicenseStatusColor() === 'green'
                ? 'bg-green-50 border-green-200'
                : getLicenseStatusColor() === 'yellow'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {getLicenseStatusColor() === 'green' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                )}
                <div>
                  <div className={`text-xs font-semibold ${
                    getLicenseStatusColor() === 'green'
                      ? 'text-green-900'
                      : 'text-yellow-900'
                  }`}>
                    License Status
                  </div>
                  <div className={`text-sm font-bold ${
                    getLicenseStatusColor() === 'green'
                      ? 'text-green-700'
                      : 'text-yellow-700'
                  }`}>
                    {licenseInfo.status.toUpperCase()} · {licenseInfo.tier.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Current Tab Description */}
          {currentTab && (
            <div className="mt-3 text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
              <strong className="text-blue-900">{currentTab.label}:</strong> {currentTab.description}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'license' && (
            <LicenseManagementPanel
              licenseInfo={licenseInfo}
              onUpdateLicense={setLicenseInfo}
            />
          )}

          {activeTab === 'store' && (
            <StoreConfigurationPanel />
          )}

          {activeTab === 'onboarding' && (
            <OnboardingSettingsPanel />
          )}

          {activeTab === 'operations' && (
            <SystemOperationsPanel />
          )}

          {activeTab === 'features' && (
            <FeatureTogglesPanel
              availableFeatures={licenseInfo.features}
              licenseTier={licenseInfo.tier}
            />
          )}
        </div>
      </div>
    </div>
  );
}
