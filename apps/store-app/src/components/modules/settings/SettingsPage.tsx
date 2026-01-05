/**
 * Settings Page
 * Main settings module with 5-category navigation
 * 
 * PRD Reference: docs/product/PRD-Settings-Module.md
 */

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import type { AppDispatch } from '@/store';
import {
  loadSettings,
  saveSettings,
  setActiveCategory,
  selectSettings,
  selectActiveCategory,
  selectIsLoading,
  selectIsSaving,
  selectHasUnsavedChanges,
  selectError,
} from '@/store/slices/settingsSlice';
import { SettingsNavigation } from './SettingsNavigation';
import { BusinessSettings } from './categories/BusinessSettings';
import { CheckoutPaymentsSettings } from './categories/CheckoutPaymentsSettings';
import { ReceiptsNotificationsSettings } from './categories/ReceiptsNotificationsSettings';
import { AccountLicensingSettings } from './categories/AccountLicensingSettings';
import { SystemSettings } from './categories/SystemSettings';
import { DeviceManagerSettings } from './categories/DeviceManagerSettings';
import { IntegrationsSettings } from './categories/IntegrationsSettings';
import type { SettingsCategory } from '@/types/settings';
import { cn } from '@/lib/utils';

interface SettingsPageProps {
  onBack: () => void;
  storeId?: string;
}

export function SettingsPage({ onBack, storeId }: SettingsPageProps) {
  const dispatch = useDispatch<AppDispatch>();
  const settings = useSelector(selectSettings);
  const activeCategory = useSelector(selectActiveCategory);
  const isLoading = useSelector(selectIsLoading);
  const isSaving = useSelector(selectIsSaving);
  const hasUnsavedChanges = useSelector(selectHasUnsavedChanges);
  const error = useSelector(selectError);

  // Load settings on mount
  useEffect(() => {
    const id = storeId || 'default-store';
    dispatch(loadSettings(id));
  }, [dispatch, storeId]);

  const handleCategoryChange = (category: SettingsCategory) => {
    dispatch(setActiveCategory(category));
  };

  const handleSave = async () => {
    await dispatch(saveSettings());
  };

  const renderCategoryContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      );
    }

    if (!settings) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          No settings loaded
        </div>
      );
    }

    switch (activeCategory) {
      case 'business':
        return <BusinessSettings />;
      case 'checkout':
        return <CheckoutPaymentsSettings />;
      case 'receipts':
        return <ReceiptsNotificationsSettings />;
      case 'devices':
        return <DeviceManagerSettings />;
      case 'integrations':
        return <IntegrationsSettings />;
      case 'account':
        return <AccountLicensingSettings />;
      case 'system':
        return <SystemSettings />;
      default:
        return <BusinessSettings />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500">Configure your store preferences</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {error && (
            <span className="text-sm text-red-600">{error}</span>
          )}
          {hasUnsavedChanges && (
            <span className="text-sm text-amber-600">Unsaved changes</span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
              hasUnsavedChanges
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <SettingsNavigation
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
          hasUnsavedChanges={hasUnsavedChanges}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            {renderCategoryContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default SettingsPage;
