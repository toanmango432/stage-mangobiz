import { useState } from 'react';
import {
  BookOpen,
  CheckCircle,
  Circle,
  Settings,
  Users,
  Package,
  CreditCard,
  Calendar,
  AlertCircle,
  Play,
  RotateCcw
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  isRequired: boolean;
  isEnabled: boolean;
  order: number;
}

export function OnboardingSettingsPanel() {
  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>([
    {
      id: 'welcome',
      title: 'Welcome & Introduction',
      description: 'Welcome message and system overview',
      icon: BookOpen,
      isRequired: true,
      isEnabled: true,
      order: 1
    },
    {
      id: 'store-setup',
      title: 'Store Information',
      description: 'Configure store details, address, and contact info',
      icon: Settings,
      isRequired: true,
      isEnabled: true,
      order: 2
    },
    {
      id: 'staff-setup',
      title: 'Add Staff Members',
      description: 'Add team members and assign roles',
      icon: Users,
      isRequired: true,
      isEnabled: true,
      order: 3
    },
    {
      id: 'services-setup',
      title: 'Configure Services',
      description: 'Set up service catalog and pricing',
      icon: Package,
      isRequired: true,
      isEnabled: true,
      order: 4
    },
    {
      id: 'payment-setup',
      title: 'Payment Methods',
      description: 'Configure accepted payment methods',
      icon: CreditCard,
      isRequired: false,
      isEnabled: true,
      order: 5
    },
    {
      id: 'schedule-setup',
      title: 'Business Hours',
      description: 'Set operating hours and schedule preferences',
      icon: Calendar,
      isRequired: false,
      isEnabled: true,
      order: 6
    }
  ]);

  const [showSkipOption, setShowSkipOption] = useState(true);
  const [autoStart, setAutoStart] = useState(true);

  const handleToggleStep = (stepId: string) => {
    setOnboardingSteps(steps =>
      steps.map(step =>
        step.id === stepId && !step.isRequired
          ? { ...step, isEnabled: !step.isEnabled }
          : step
      )
    );
  };

  const handleResetOnboarding = () => {
    if (confirm('This will reset the onboarding process for all users. Continue?')) {
      alert('Onboarding reset! New users will see the setup wizard.');
    }
  };

  const enabledSteps = onboardingSteps.filter(s => s.isEnabled);
  const requiredSteps = onboardingSteps.filter(s => s.isRequired);

  return (
    <div className="space-y-6">
      {/* Onboarding Overview */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border-2 border-purple-200">
        <h2 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-purple-600" />
          Onboarding Process Overview
        </h2>
        <p className="text-purple-700 mb-4">
          Configure the initial setup experience for new users and locations. This wizard helps staff get started quickly with the system.
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600 mb-1">{enabledSteps.length}</div>
            <div className="text-sm text-gray-600">Active Steps</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-600 mb-1">{requiredSteps.length}</div>
            <div className="text-sm text-gray-600">Required Steps</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600 mb-1">~{enabledSteps.length * 2}</div>
            <div className="text-sm text-gray-600">Est. Minutes</div>
          </div>
        </div>
      </div>

      {/* Global Onboarding Settings */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          Global Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Auto-Start Onboarding</div>
              <div className="text-sm text-gray-600">
                Automatically show onboarding wizard for new users
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={autoStart}
                onChange={(e) => setAutoStart(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Allow Skip Option</div>
              <div className="text-sm text-gray-600">
                Let users skip optional steps during onboarding
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={showSkipOption}
                onChange={(e) => setShowSkipOption(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Show Progress Bar</div>
              <div className="text-sm text-gray-600">
                Display progress indicator during setup process
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Onboarding Steps Configuration */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Onboarding Steps
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Configure which steps appear in the onboarding wizard. Required steps cannot be disabled.
        </p>
        <div className="space-y-3">
          {onboardingSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  step.isEnabled
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step.isEnabled ? 'bg-green-100' : 'bg-gray-200'
                    }`}>
                      <span className="text-sm font-bold text-gray-700">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-5 h-5 ${
                          step.isEnabled ? 'text-green-600' : 'text-gray-400'
                        }`} />
                        <h4 className="font-bold text-gray-900">{step.title}</h4>
                        {step.isRequired && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded">
                            REQUIRED
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={step.isEnabled}
                      onChange={() => handleToggleStep(step.id)}
                      disabled={step.isRequired}
                    />
                    <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                      step.isRequired
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

      {/* Completion Actions */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-indigo-600" />
          After Onboarding Completion
        </h3>
        <div className="space-y-3">
          <div className="p-4 bg-gray-50 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="completion-action"
                defaultChecked
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <div className="font-medium text-gray-900">Go to Front Desk</div>
                <div className="text-sm text-gray-600">Redirect to main POS interface</div>
              </div>
            </label>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="completion-action"
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <div className="font-medium text-gray-900">Show Tutorial</div>
                <div className="text-sm text-gray-600">Display interactive system tutorial</div>
              </div>
            </label>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="completion-action"
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <div className="font-medium text-gray-900">Go to Dashboard</div>
                <div className="text-sm text-gray-600">Show overview dashboard</div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex gap-3">
          <button className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2">
            <Play className="w-4 h-4" />
            Preview Onboarding
          </button>
          <button
            onClick={handleResetOnboarding}
            className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset for All Users
          </button>
        </div>
      </div>
    </div>
  );
}
