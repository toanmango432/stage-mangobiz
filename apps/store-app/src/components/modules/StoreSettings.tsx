/**
 * Store Settings Page
 * Accessible from the More menu - contains store-level configuration
 */

import { ArrowLeft, Store } from 'lucide-react';
import { TimezoneSettings } from '@/components/settings/TimezoneSettings';

interface StoreSettingsProps {
  onBack: () => void;
}

export function StoreSettings({ onBack }: StoreSettingsProps) {
  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6 pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>
              <p className="text-sm text-gray-500">Configure your store preferences</p>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Timezone Settings */}
          <TimezoneSettings />

          {/* Future: Add more store settings sections here */}
          {/* Examples: Business Hours, Currency, Tax Settings, etc. */}
        </div>
      </div>
    </div>
  );
}
