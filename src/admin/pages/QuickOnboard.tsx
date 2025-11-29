import { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  User,
  Shield,
  Store,
  UserCog,
  CheckCircle,
  Copy,
  X
} from 'lucide-react';
import { tenantsDB, licensesDB, storesDB, membersDB } from '../db/database';
import type { LicenseTier, Tenant, License, Store as StoreType, Member } from '../types';
import { LICENSE_TIER_CONFIG } from '../types/license';

interface OnboardingState {
  // Step 1: Tenant Info
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  tenantCompany: string;
  tenantAddress: string;

  // Step 2: License
  licenseTier: LicenseTier;
  licenseExpiresAt: string;

  // Step 3: Store
  storeName: string;
  storeEmail: string;
  storePassword: string;
  storeAddress: string;
  storePhone: string;

  // Step 4: Admin Member
  memberName: string;
  memberEmail: string;
  memberPassword: string;
  memberPin: string;
}

interface OnboardingResult {
  tenant: Tenant;
  license: License;
  store: StoreType;
  member: Member;
}

interface QuickOnboardProps {
  onClose: () => void;
  onComplete: () => void;
}

export function QuickOnboard({ onClose, onComplete }: QuickOnboardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<OnboardingResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<OnboardingState>({
    // Step 1
    tenantName: '',
    tenantEmail: '',
    tenantPhone: '',
    tenantCompany: '',
    tenantAddress: '',

    // Step 2
    licenseTier: 'professional',
    licenseExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],

    // Step 3
    storeName: '',
    storeEmail: '',
    storePassword: '',
    storeAddress: '',
    storePhone: '',

    // Step 4
    memberName: '',
    memberEmail: '',
    memberPassword: '',
    memberPin: '',
  });

  const steps = [
    { number: 1, title: 'Customer Info', icon: User },
    { number: 2, title: 'License', icon: Shield },
    { number: 3, title: 'First Store', icon: Store },
    { number: 4, title: 'Admin User', icon: UserCog },
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.tenantName.trim()) newErrors.tenantName = 'Name is required';
        if (!formData.tenantEmail.trim()) newErrors.tenantEmail = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.tenantEmail)) {
          newErrors.tenantEmail = 'Invalid email format';
        }
        break;

      case 2:
        if (!formData.licenseTier) newErrors.licenseTier = 'Please select a tier';
        break;

      case 3:
        if (!formData.storeName.trim()) newErrors.storeName = 'Store name is required';
        if (!formData.storeEmail.trim()) newErrors.storeEmail = 'Store email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.storeEmail)) {
          newErrors.storeEmail = 'Invalid email format';
        }
        if (!formData.storePassword.trim()) newErrors.storePassword = 'Password is required';
        else if (formData.storePassword.length < 6) {
          newErrors.storePassword = 'Password must be at least 6 characters';
        }
        break;

      case 4:
        if (!formData.memberName.trim()) newErrors.memberName = 'Name is required';
        if (!formData.memberEmail.trim()) newErrors.memberEmail = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.memberEmail)) {
          newErrors.memberEmail = 'Invalid email format';
        }
        if (!formData.memberPassword.trim()) newErrors.memberPassword = 'Password is required';
        else if (formData.memberPassword.length < 6) {
          newErrors.memberPassword = 'Password must be at least 6 characters';
        }
        if (formData.memberPin && !/^\d{4,6}$/.test(formData.memberPin)) {
          newErrors.memberPin = 'PIN must be 4-6 digits';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleComplete = async () => {
    if (!validateStep(currentStep)) return;

    setSaving(true);
    try {
      // Step 1: Create Tenant
      const tenant = await tenantsDB.create({
        name: formData.tenantName,
        email: formData.tenantEmail,
        phone: formData.tenantPhone || undefined,
        company: formData.tenantCompany || undefined,
        address: formData.tenantAddress || undefined,
      });

      // Step 2: Create License
      const tierConfig = LICENSE_TIER_CONFIG[formData.licenseTier];
      const license = await licensesDB.create({
        tenantId: tenant.id,
        tier: formData.licenseTier,
        maxStores: tierConfig.maxStores,
        maxDevicesPerStore: tierConfig.maxDevicesPerStore,
        features: tierConfig.features,
        expiresAt: formData.licenseExpiresAt ? new Date(formData.licenseExpiresAt) : undefined,
      });

      // Step 3: Create Store
      const store = await storesDB.create({
        tenantId: tenant.id,
        licenseId: license.id,
        name: formData.storeName,
        storeEmail: formData.storeEmail,
        password: formData.storePassword,
        address: formData.storeAddress || undefined,
        phone: formData.storePhone || undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      // Step 4: Create Admin Member
      const member = await membersDB.create({
        tenantId: tenant.id,
        storeIds: [store.id],
        name: formData.memberName,
        email: formData.memberEmail,
        password: formData.memberPassword,
        pin: formData.memberPin || undefined,
        role: 'admin',
      });

      setResult({ tenant, license, store, member });
      setCurrentStep(5); // Success step
    } catch (error) {
      console.error('Onboarding failed:', error);
      alert('Failed to complete onboarding. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Customer Information</h2>
            <p className="text-gray-600 mb-6">Enter the new customer's contact details</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.tenantName}
                onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  errors.tenantName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="John Smith"
              />
              {errors.tenantName && <p className="text-red-500 text-xs mt-1">{errors.tenantName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.tenantEmail}
                onChange={(e) => setFormData({ ...formData, tenantEmail: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  errors.tenantEmail ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="john@example.com"
              />
              {errors.tenantEmail && <p className="text-red-500 text-xs mt-1">{errors.tenantEmail}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="text"
                  value={formData.tenantPhone}
                  onChange={(e) => setFormData({ ...formData, tenantPhone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                <input
                  type="text"
                  value={formData.tenantCompany}
                  onChange={(e) => setFormData({ ...formData, tenantCompany: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Luxury Nails & Spa"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <input
                type="text"
                value={formData.tenantAddress}
                onChange={(e) => setFormData({ ...formData, tenantAddress: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="123 Main St, City, State"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Select License Plan</h2>
            <p className="text-gray-600 mb-6">Choose the subscription tier for this customer</p>

            <div className="grid grid-cols-2 gap-4">
              {(Object.keys(LICENSE_TIER_CONFIG) as LicenseTier[]).map((tier) => {
                const config = LICENSE_TIER_CONFIG[tier];
                const isSelected = formData.licenseTier === tier;
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setFormData({ ...formData, licenseTier: tier })}
                    className={`p-4 border-2 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500/20'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-900 capitalize">{tier}</span>
                      {isSelected && <Check className="w-5 h-5 text-orange-500" />}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      ${config.price}<span className="text-sm text-gray-500 font-normal">/mo</span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>{config.maxStores === 999 ? 'Unlimited' : config.maxStores} store{config.maxStores !== 1 ? 's' : ''}</p>
                      <p>{config.maxDevicesPerStore === 999 ? 'Unlimited' : config.maxDevicesPerStore} device{config.maxDevicesPerStore !== 1 ? 's' : ''}/store</p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {config.features.slice(0, 3).map((f) => (
                        <span key={f} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                          {f.replace(/_/g, ' ')}
                        </span>
                      ))}
                      {config.features.length > 3 && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                          +{config.features.length - 3} more
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">License Expiry Date</label>
              <input
                type="date"
                value={formData.licenseExpiresAt}
                onChange={(e) => setFormData({ ...formData, licenseExpiresAt: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited license</p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">First Store Setup</h2>
            <p className="text-gray-600 mb-6">Configure the customer's first POS store location</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  errors.storeName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Downtown Location"
              />
              {errors.storeName && <p className="text-red-500 text-xs mt-1">{errors.storeName}</p>}
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-2">Store Login Credentials</h3>
              <p className="text-sm text-blue-700 mb-4">These will be used to log into the POS system</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-2">
                    Store Email (Login ID) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.storeEmail}
                    onChange={(e) => setFormData({ ...formData, storeEmail: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white ${
                      errors.storeEmail ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="store@business.com"
                  />
                  {errors.storeEmail && <p className="text-red-500 text-xs mt-1">{errors.storeEmail}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-2">
                    Store Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.storePassword}
                    onChange={(e) => setFormData({ ...formData, storePassword: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white ${
                      errors.storePassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="••••••••"
                  />
                  {errors.storePassword && <p className="text-red-500 text-xs mt-1">{errors.storePassword}</p>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Store Phone</label>
                <input
                  type="text"
                  value={formData.storePhone}
                  onChange={(e) => setFormData({ ...formData, storePhone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Store Address</label>
                <input
                  type="text"
                  value={formData.storeAddress}
                  onChange={(e) => setFormData({ ...formData, storeAddress: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="123 Main St"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Admin User</h2>
            <p className="text-gray-600 mb-6">Create the store's first admin member</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.memberName}
                onChange={(e) => setFormData({ ...formData, memberName: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  errors.memberName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Jane Doe"
              />
              {errors.memberName && <p className="text-red-500 text-xs mt-1">{errors.memberName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.memberEmail}
                onChange={(e) => setFormData({ ...formData, memberEmail: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  errors.memberEmail ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="jane@example.com"
              />
              {errors.memberEmail && <p className="text-red-500 text-xs mt-1">{errors.memberEmail}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.memberPassword}
                  onChange={(e) => setFormData({ ...formData, memberPassword: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.memberPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                />
                {errors.memberPassword && <p className="text-red-500 text-xs mt-1">{errors.memberPassword}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quick PIN</label>
                <input
                  type="text"
                  value={formData.memberPin}
                  onChange={(e) => setFormData({ ...formData, memberPin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.memberPin ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="1234"
                  maxLength={6}
                />
                {errors.memberPin && <p className="text-red-500 text-xs mt-1">{errors.memberPin}</p>}
                <p className="text-xs text-gray-500 mt-1">4-6 digits for quick login</p>
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-800">
                <strong>Role:</strong> Admin
              </p>
              <p className="text-xs text-purple-600 mt-1">
                Full access to manage store settings, staff, and transactions
              </p>
            </div>
          </div>
        );

      case 5:
        if (!result) return null;
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Onboarding Complete!</h2>
            <p className="text-gray-600 mb-8">The customer has been set up successfully</p>

            <div className="text-left space-y-4 bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold text-gray-900">Customer Credentials</h3>

              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 uppercase font-medium mb-1">Store Login</p>
                <div className="flex items-center justify-between">
                  <code className="text-sm font-medium text-gray-900">{result.store.storeLoginId}</code>
                  <button
                    onClick={() => copyToClipboard(result.store.storeLoginId, 'storeLogin')}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    {copiedField === 'storeLogin' ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 uppercase font-medium mb-1">License Key</p>
                <div className="flex items-center justify-between">
                  <code className="text-xs font-medium text-gray-900">{result.license.licenseKey}</code>
                  <button
                    onClick={() => copyToClipboard(result.license.licenseKey, 'license')}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    {copiedField === 'license' ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">License Tier</p>
                  <p className="font-medium text-gray-900 capitalize">{result.license.tier}</p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Admin User</p>
                  <p className="font-medium text-gray-900">{result.member.name}</p>
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center mt-4">
                Share the store login ID and password with the customer to access the POS system
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h1 className="text-xl font-bold text-gray-900">Quick Customer Onboarding</h1>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        {currentStep <= 4 && (
          <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.number;
                const isComplete = currentStep > step.number;

                return (
                  <div key={step.number} className="flex items-center">
                    <div
                      className={`flex items-center gap-2 ${
                        isActive ? 'text-orange-600' : isComplete ? 'text-green-600' : 'text-gray-400'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isActive
                            ? 'bg-orange-100 ring-2 ring-orange-500'
                            : isComplete
                            ? 'bg-green-100'
                            : 'bg-gray-100'
                        }`}
                      >
                        {isComplete ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </div>
                      <span className={`text-sm font-medium hidden sm:inline ${isActive ? '' : 'text-gray-500'}`}>
                        {step.title}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-8 sm:w-16 h-0.5 mx-2 ${
                        currentStep > step.number ? 'bg-green-300' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-grow">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
          {currentStep <= 4 ? (
            <>
              <button
                onClick={currentStep === 1 ? onClose : handleBack}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {currentStep === 1 ? 'Cancel' : 'Back'}
              </button>
              {currentStep < 4 ? (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                >
                  {saving ? (
                    'Creating...'
                  ) : (
                    <>
                      Complete Setup
                      <CheckCircle className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </>
          ) : (
            <button
              onClick={onComplete}
              className="w-full px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
