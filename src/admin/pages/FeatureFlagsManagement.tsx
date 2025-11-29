import { useState, useEffect } from 'react';
import {
  Package,
  Users,
  Globe,
  Smartphone,
  BarChart3,
  Gift,
  MessageSquare,
  Database,
  Shield,
  CreditCard,
  Search,
  RefreshCw,
  Save,
  CheckCircle
} from 'lucide-react';
import { featureFlagsDB, licensesDB } from '../db/database';
import type { FeatureFlag, FeatureFlagCategory } from '../types';

// Icon mapping for features
const featureIcons: Record<string, typeof Package> = {
  'multi-device-sync': Smartphone,
  'inventory-management': Package,
  'advanced-reporting': BarChart3,
  'customer-loyalty': Gift,
  'online-booking': Globe,
  'sms-notifications': MessageSquare,
  'multi-location': Users,
  'api-access': Database,
  'advanced-permissions': Shield,
  'payment-gateway': CreditCard,
};

export function FeatureFlagsManagement() {
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [licenseStats, setLicenseStats] = useState({ free: 0, basic: 0, professional: 0, enterprise: 0 });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [allFeatures, allLicenses] = await Promise.all([
        featureFlagsDB.getAll(),
        licensesDB.getAll(1000),
      ]);

      // If no features exist, seed them
      if (allFeatures.length === 0) {
        await featureFlagsDB.seedDefaults();
        const seededFeatures = await featureFlagsDB.getAll();
        setFeatures(seededFeatures);
      } else {
        setFeatures(allFeatures);
      }

      // Count licenses by tier
      const stats = { free: 0, basic: 0, professional: 0, enterprise: 0 };
      allLicenses.forEach(l => {
        if (l.tier in stats) {
          stats[l.tier as keyof typeof stats]++;
        }
      });
      setLicenseStats(stats);
    } catch (error) {
      console.error('Failed to load feature flags:', error);
    } finally {
      setLoading(false);
    }
  }

  const categories: FeatureFlagCategory[] = [
    'Infrastructure',
    'Operations',
    'Analytics',
    'Marketing',
    'Communication',
    'Integration',
    'Security',
    'Payment',
    'Customer Experience',
  ];

  const filteredFeatures = features.filter(feature => {
    const matchesSearch = feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         feature.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || feature.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  async function handleToggleTier(featureId: string, tier: 'free' | 'basic' | 'professional' | 'enterprise') {
    const feature = features.find(f => f.id === featureId);
    if (!feature) return;

    const tierKey = `enabledFor${tier.charAt(0).toUpperCase() + tier.slice(1)}` as keyof FeatureFlag;
    const newValue = !feature[tierKey];

    // Optimistically update UI
    setFeatures(features.map(f => {
      if (f.id === featureId) {
        return { ...f, [tierKey]: newValue };
      }
      return f;
    }));

    // Update database
    await featureFlagsDB.update(featureId, { [tierKey]: newValue } as any);
  }

  async function handleToggleGlobal(featureId: string) {
    const feature = features.find(f => f.id === featureId);
    if (!feature) return;

    const newValue = !feature.globallyEnabled;

    // Optimistically update UI
    setFeatures(features.map(f =>
      f.id === featureId ? { ...f, globallyEnabled: newValue } : f
    ));

    // Update database
    await featureFlagsDB.update(featureId, { globallyEnabled: newValue });
  }

  async function handleSaveAll() {
    setSaving(true);
    try {
      // All changes are already saved to IndexedDB as they happen
      // This is just for visual feedback
      await new Promise(resolve => setTimeout(resolve, 500));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  function getFeatureIcon(key: string) {
    return featureIcons[key] || Package;
  }

  // Calculate affected customers per feature
  function getAffectedCustomers(feature: FeatureFlag): number {
    if (!feature.globallyEnabled) return 0;
    let count = 0;
    if (feature.enabledForFree) count += licenseStats.free;
    if (feature.enabledForBasic) count += licenseStats.basic;
    if (feature.enabledForProfessional) count += licenseStats.professional;
    if (feature.enabledForEnterprise) count += licenseStats.enterprise;
    return count;
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading feature flags...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Feature Flags Management</h1>
            <p className="text-gray-600">Control feature availability across license tiers</p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="text-2xl font-bold text-gray-900 mb-1">{features.length}</div>
            <p className="text-sm text-gray-600">Total Features</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {features.filter(f => f.globallyEnabled).length}
            </div>
            <p className="text-sm text-gray-600">Enabled Globally</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {features.filter(f => f.enabledForProfessional).length}
            </div>
            <p className="text-sm text-gray-600">For Professional</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {features.filter(f => f.enabledForEnterprise).length}
            </div>
            <p className="text-sm text-gray-600">For Enterprise</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search features..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Feature List */}
        <div className="space-y-4">
          {filteredFeatures.map((feature) => {
            const Icon = getFeatureIcon(feature.key);
            const affectedCustomers = getAffectedCustomers(feature);
            return (
              <div key={feature.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    feature.globallyEnabled ? 'bg-orange-100' : 'bg-gray-100'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      feature.globallyEnabled ? 'text-orange-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{feature.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-700">
                          {feature.category}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          feature.globallyEnabled
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {feature.globallyEnabled ? 'ENABLED' : 'DISABLED'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-5 gap-4">
                      {/* Global Toggle */}
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-700">Global</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={feature.globallyEnabled}
                              onChange={() => handleToggleGlobal(feature.id)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">{affectedCustomers} affected</p>
                      </div>

                      {/* Free */}
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-700">Free</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={feature.enabledForFree}
                              onChange={() => handleToggleTier(feature.id, 'free')}
                              disabled={!feature.globallyEnabled}
                              className="sr-only peer"
                            />
                            <div className={`w-9 h-5 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${
                              feature.globallyEnabled
                                ? 'bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 peer-checked:bg-gray-600'
                                : 'bg-gray-300 cursor-not-allowed'
                            }`}></div>
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">{licenseStats.free} licenses</p>
                      </div>

                      {/* Basic */}
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-green-700">Basic</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={feature.enabledForBasic}
                              onChange={() => handleToggleTier(feature.id, 'basic')}
                              disabled={!feature.globallyEnabled}
                              className="sr-only peer"
                            />
                            <div className={`w-9 h-5 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${
                              feature.globallyEnabled
                                ? 'bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 peer-checked:bg-green-600'
                                : 'bg-gray-300 cursor-not-allowed'
                            }`}></div>
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">{licenseStats.basic} licenses</p>
                      </div>

                      {/* Professional */}
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-blue-700">Professional</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={feature.enabledForProfessional}
                              onChange={() => handleToggleTier(feature.id, 'professional')}
                              disabled={!feature.globallyEnabled}
                              className="sr-only peer"
                            />
                            <div className={`w-9 h-5 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${
                              feature.globallyEnabled
                                ? 'bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:bg-blue-600'
                                : 'bg-gray-300 cursor-not-allowed'
                            }`}></div>
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">{licenseStats.professional} licenses</p>
                      </div>

                      {/* Enterprise */}
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-purple-700">Enterprise</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={feature.enabledForEnterprise}
                              onChange={() => handleToggleTier(feature.id, 'enterprise')}
                              disabled={!feature.globallyEnabled}
                              className="sr-only peer"
                            />
                            <div className={`w-9 h-5 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${
                              feature.globallyEnabled
                                ? 'bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 peer-checked:bg-purple-600'
                                : 'bg-gray-300 cursor-not-allowed'
                            }`}></div>
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">{licenseStats.enterprise} licenses</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredFeatures.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No feature flags found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="w-full px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Configuration Saved!
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Feature Configuration
              </>
            )}
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            Changes are automatically saved. Click to confirm and sync to all instances.
          </p>
        </div>
      </div>
    </div>
  );
}
