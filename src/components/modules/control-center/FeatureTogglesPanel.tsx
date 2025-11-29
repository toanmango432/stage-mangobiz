import { useState } from 'react';
import {
  ToggleLeft,
  Zap,
  Lock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Package,
  Users,
  Calendar,
  BarChart3,
  CreditCard,
  Globe,
  Smartphone,
  Database,
  MessageSquare,
  Gift,
  TrendingUp,
  Shield
} from 'lucide-react';

interface Feature {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
  tier: string;
  isEnabled: boolean;
  requiresLicense: boolean;
}

interface FeatureTogglesPanelProps {
  availableFeatures: string[];
  licenseTier: string;
}

export function FeatureTogglesPanel({ availableFeatures, licenseTier }: FeatureTogglesPanelProps) {
  const [features, setFeatures] = useState<Feature[]>([
    {
      id: 'multi-device',
      name: 'Multi-Device Sync',
      description: 'Synchronize data across multiple devices in real-time',
      icon: Smartphone,
      category: 'Infrastructure',
      tier: 'professional',
      isEnabled: true,
      requiresLicense: true
    },
    {
      id: 'inventory-management',
      name: 'Inventory Management',
      description: 'Track product inventory, low stock alerts, and reordering',
      icon: Package,
      category: 'Operations',
      tier: 'professional',
      isEnabled: true,
      requiresLicense: true
    },
    {
      id: 'advanced-reporting',
      name: 'Advanced Reporting',
      description: 'Detailed analytics, custom reports, and data export',
      icon: BarChart3,
      category: 'Analytics',
      tier: 'professional',
      isEnabled: true,
      requiresLicense: true
    },
    {
      id: 'customer-loyalty',
      name: 'Customer Loyalty Program',
      description: 'Points-based rewards and membership tiers',
      icon: Gift,
      category: 'Marketing',
      tier: 'professional',
      isEnabled: true,
      requiresLicense: true
    },
    {
      id: 'online-booking',
      name: 'Online Booking',
      description: 'Allow customers to book appointments online',
      icon: Globe,
      category: 'Customer Experience',
      tier: 'professional',
      isEnabled: true,
      requiresLicense: true
    },
    {
      id: 'sms-notifications',
      name: 'SMS Notifications',
      description: 'Send appointment reminders and confirmations via SMS',
      icon: MessageSquare,
      category: 'Communication',
      tier: 'enterprise',
      isEnabled: false,
      requiresLicense: true
    },
    {
      id: 'multi-location',
      name: 'Multi-Location Management',
      description: 'Manage multiple store locations from single dashboard',
      icon: Users,
      category: 'Infrastructure',
      tier: 'enterprise',
      isEnabled: false,
      requiresLicense: true
    },
    {
      id: 'api-access',
      name: 'API Access',
      description: 'Integrate with third-party systems via REST API',
      icon: Database,
      category: 'Integration',
      tier: 'enterprise',
      isEnabled: false,
      requiresLicense: true
    },
    {
      id: 'advanced-permissions',
      name: 'Advanced Permissions',
      description: 'Granular role-based access control',
      icon: Shield,
      category: 'Security',
      tier: 'enterprise',
      isEnabled: false,
      requiresLicense: true
    },
    {
      id: 'payment-integration',
      name: 'Payment Gateway Integration',
      description: 'Direct integration with payment processors',
      icon: CreditCard,
      category: 'Payment',
      tier: 'professional',
      isEnabled: false,
      requiresLicense: false
    },
    {
      id: 'commission-tracking',
      name: 'Commission Tracking',
      description: 'Calculate and track staff commissions',
      icon: TrendingUp,
      category: 'Finance',
      tier: 'starter',
      isEnabled: true,
      requiresLicense: false
    }
  ]);

  const handleToggle = (featureId: string) => {
    setFeatures(features.map(f =>
      f.id === featureId ? { ...f, isEnabled: !f.isEnabled } : f
    ));
  };

  const isFeatureAvailable = (feature: Feature) => {
    if (!feature.requiresLicense) return true;

    const tierOrder = ['starter', 'professional', 'enterprise'];
    const currentTierIndex = tierOrder.indexOf(licenseTier);
    const requiredTierIndex = tierOrder.indexOf(feature.tier);

    return currentTierIndex >= requiredTierIndex;
  };

  const groupedFeatures = features.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, Feature[]>);

  const enabledCount = features.filter(f => f.isEnabled).length;
  const availableCount = features.filter(f => isFeatureAvailable(f)).length;
  const lockedCount = features.filter(f => !isFeatureAvailable(f)).length;

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
        <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
          <Zap className="w-6 h-6 text-blue-600" />
          Feature Management
        </h2>
        <p className="text-blue-700 mb-4">
          Enable or disable features based on your business needs and license tier.
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600 mb-1">{enabledCount}</div>
            <div className="text-sm text-gray-600">Enabled Features</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600 mb-1">{availableCount}</div>
            <div className="text-sm text-gray-600">Available to Enable</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-400 mb-1">{lockedCount}</div>
            <div className="text-sm text-gray-600">Requires Upgrade</div>
          </div>
        </div>
      </div>

      {/* Features by Category */}
      {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
        <div key={category} className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">{category}</h3>
          <div className="space-y-3">
            {categoryFeatures.map((feature) => {
              const Icon = feature.icon;
              const available = isFeatureAvailable(feature);
              const tierBadgeColor =
                feature.tier === 'enterprise' ? 'bg-purple-100 text-purple-700' :
                feature.tier === 'professional' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700';

              return (
                <div
                  key={feature.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    !available
                      ? 'border-gray-200 bg-gray-50 opacity-60'
                      : feature.isEnabled
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        !available
                          ? 'bg-gray-200'
                          : feature.isEnabled
                          ? 'bg-green-100'
                          : 'bg-gray-100'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          !available
                            ? 'text-gray-400'
                            : feature.isEnabled
                            ? 'text-green-600'
                            : 'text-gray-500'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-gray-900">{feature.name}</h4>
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded ${tierBadgeColor}`}>
                            {feature.tier.toUpperCase()}
                          </span>
                          {!available && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              LOCKED
                            </span>
                          )}
                          {feature.isEnabled && available && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                        {!available && (
                          <div className="mt-2">
                            <button className="text-xs text-blue-600 hover:text-blue-700 font-semibold">
                              Upgrade to {feature.tier} to unlock →
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={feature.isEnabled}
                        onChange={() => handleToggle(feature.id)}
                        disabled={!available}
                      />
                      <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                        !available
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 peer-checked:bg-green-600'
                      }`}></div>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Feature Request */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-purple-900 mb-2">Need a Feature?</h3>
            <p className="text-sm text-purple-700 mb-3">
              Don't see the feature you need? We're constantly improving Mango POS. Let us know what you'd like to see!
            </p>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
              Request a Feature
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <button className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold text-lg flex items-center justify-center gap-2">
          <Zap className="w-5 h-5" />
          Save Feature Settings
        </button>
      </div>
    </div>
  );
}
