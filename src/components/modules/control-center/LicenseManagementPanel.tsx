import { useState } from 'react';
import {
  Shield,
  Key,
  Calendar,
  Users,
  MapPin,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  RefreshCw,
  ExternalLink,
  Award,
  Zap
} from 'lucide-react';

interface LicenseInfo {
  status: string;
  tier: string;
  expiresAt: Date;
  devicesAllowed: number;
  devicesActive: number;
  locationsAllowed: number;
  locationsActive: number;
  features: string[];
}

interface LicenseManagementPanelProps {
  licenseInfo: LicenseInfo;
  onUpdateLicense: (info: LicenseInfo) => void;
}

export function LicenseManagementPanel({ licenseInfo, onUpdateLicense }: LicenseManagementPanelProps) {
  const [licenseKey, setLicenseKey] = useState('MANGO-POS-XXXX-XXXX-XXXX-XXXX');
  const [showActivationModal, setShowActivationModal] = useState(false);

  const daysUntilExpiry = Math.floor(
    (licenseInfo.expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const tierFeatures = {
    starter: ['Basic POS', 'Up to 2 devices', '1 location', 'Basic reporting'],
    professional: [
      'Advanced POS',
      'Up to 5 devices',
      'Up to 3 locations',
      'Advanced reporting',
      'Inventory management',
      'Customer loyalty',
      'Online booking'
    ],
    enterprise: [
      'Full POS suite',
      'Unlimited devices',
      'Unlimited locations',
      'Custom reporting',
      'Advanced inventory',
      'Multi-store management',
      'API access',
      'Priority support'
    ]
  };

  const handleRenewLicense = () => {
    alert('Opening renewal portal...');
  };

  const handleUpgradeLicense = () => {
    alert('Opening upgrade options...');
  };

  return (
    <div className="space-y-6">
      {/* License Overview Card */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            License Overview
          </h2>
          <button
            onClick={handleRenewLicense}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Renew License
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* License Status */}
          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">Status</span>
            </div>
            <div className="text-2xl font-bold text-green-700 mb-1">
              {licenseInfo.status.toUpperCase()}
            </div>
            <div className="text-xs text-green-600">
              Valid until {licenseInfo.expiresAt.toLocaleDateString()}
            </div>
          </div>

          {/* License Tier */}
          <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">Tier</span>
            </div>
            <div className="text-2xl font-bold text-purple-700 mb-1 capitalize">
              {licenseInfo.tier}
            </div>
            <button
              onClick={handleUpgradeLicense}
              className="text-xs text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
            >
              Upgrade Plan
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Days Remaining */}
          <div className={`p-4 rounded-lg border ${
            daysUntilExpiry <= 30
              ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200'
              : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Expires In</span>
            </div>
            <div className="text-2xl font-bold text-blue-700 mb-1">
              {daysUntilExpiry} Days
            </div>
            {daysUntilExpiry <= 30 && (
              <div className="text-xs text-yellow-600 font-semibold">
                ⚠️ Renewal recommended
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Usage Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Device Usage */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Device Usage
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Active Devices</span>
                <span className="text-sm font-bold text-gray-900">
                  {licenseInfo.devicesActive} / {licenseInfo.devicesAllowed}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${(licenseInfo.devicesActive / licenseInfo.devicesAllowed) * 100}%`
                  }}
                />
              </div>
            </div>
            <div className="text-xs text-gray-500">
              You have {licenseInfo.devicesAllowed - licenseInfo.devicesActive} device slots available
            </div>
          </div>
        </div>

        {/* Location Usage */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-purple-600" />
            Location Usage
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Active Locations</span>
                <span className="text-sm font-bold text-gray-900">
                  {licenseInfo.locationsActive} / {licenseInfo.locationsAllowed}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{
                    width: `${(licenseInfo.locationsActive / licenseInfo.locationsAllowed) * 100}%`
                  }}
                />
              </div>
            </div>
            <div className="text-xs text-gray-500">
              You can add {licenseInfo.locationsAllowed - licenseInfo.locationsActive} more location(s)
            </div>
          </div>
        </div>
      </div>

      {/* License Key */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-orange-600" />
          License Key
        </h3>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={licenseKey}
            readOnly
            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg font-mono text-sm"
          />
          <button
            onClick={() => navigator.clipboard.writeText(licenseKey)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            Copy
          </button>
          <button
            onClick={() => setShowActivationModal(true)}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
          >
            Activate New Key
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Keep your license key secure. You'll need it to activate new devices.
        </p>
      </div>

      {/* Current Plan Features */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-600" />
          {licenseInfo.tier.charAt(0).toUpperCase() + licenseInfo.tier.slice(1)} Plan Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tierFeatures[licenseInfo.tier as keyof typeof tierFeatures]?.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="text-sm text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Billing Information */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-green-600" />
          Billing Information
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Next Billing Date</span>
            <span className="text-sm font-semibold text-gray-900">
              {licenseInfo.expiresAt.toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Billing Cycle</span>
            <span className="text-sm font-semibold text-gray-900">Annual</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Payment Method</span>
            <span className="text-sm font-semibold text-gray-900">•••• 4242</span>
          </div>
          <button className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center gap-2">
            Update Payment Method
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
