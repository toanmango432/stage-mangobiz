# FrontDeskSettings Implementation Guide

## Quick Start Implementation

This guide provides ready-to-use code snippets for refactoring the FrontDeskSettings component. Follow these steps in order.

---

## Step 1: Create the Directory Structure

```bash
#!/bin/bash
# Run this script from the src/components directory

# Create the main FrontDeskSettings directory structure
mkdir -p FrontDeskSettings/{hooks,sections,components/shared,utils}

# Create placeholder files
touch FrontDeskSettings/index.tsx
touch FrontDeskSettings/types.ts
touch FrontDeskSettings/constants.ts

# Create hook files
touch FrontDeskSettings/hooks/useSettingsState.ts
touch FrontDeskSettings/hooks/useSettingsValidation.ts
touch FrontDeskSettings/hooks/useSettingsPersistence.ts

# Create section files
touch FrontDeskSettings/sections/OperationTemplates.tsx
touch FrontDeskSettings/sections/TeamSettings.tsx
touch FrontDeskSettings/sections/TicketSettings.tsx
touch FrontDeskSettings/sections/WorkflowRules.tsx
touch FrontDeskSettings/sections/LayoutSettings.tsx

# Create shared component files
touch FrontDeskSettings/components/shared/ToggleSwitch.tsx
touch FrontDeskSettings/components/shared/SegmentedControl.tsx
touch FrontDeskSettings/components/shared/SectionHeader.tsx
touch FrontDeskSettings/components/shared/RadioGroup.tsx
touch FrontDeskSettings/components/shared/Slider.tsx

# Create main component files
touch FrontDeskSettings/components/SettingsHeader.tsx
touch FrontDeskSettings/components/SettingsFooter.tsx
touch FrontDeskSettings/components/SettingsNavigation.tsx
touch FrontDeskSettings/components/MobileAccordion.tsx
touch FrontDeskSettings/components/TemplateCard.tsx

# Create utility files
touch FrontDeskSettings/utils/templatePresets.ts
touch FrontDeskSettings/utils/validation.ts
touch FrontDeskSettings/utils/dependencies.ts

echo "Directory structure created successfully!"
```

---

## Step 2: Core Type Definitions

### `types.ts`
```typescript
// src/components/FrontDeskSettings/types.ts

export interface FrontDeskSettingsData {
  // Operation Template
  operationTemplate: OperationTemplate;

  // Team Settings
  organizeBy: 'clockedStatus' | 'busyStatus';
  showTurnCount: boolean;
  showNextAppointment: boolean;
  showServicedAmount: boolean;
  showTicketCount: boolean;
  showLastDone: boolean;
  showMoreOptionsButton: boolean;
  viewWidth: ViewWidth;
  customWidthPercentage: number;

  // Ticket Settings
  displayMode: DisplayMode;
  viewStyle: 'expanded' | 'compact';
  showWaitList: boolean;
  showInService: boolean;
  showPending: boolean;
  closedTicketsPlacement: 'floating' | 'bottom' | 'hidden';
  sortBy: 'queue' | 'time';
  combineSections: boolean;

  // Workflow & Rules
  showComingAppointments: boolean;
  comingAppointmentsDefaultState: 'expanded' | 'collapsed';
  enableDragAndDrop: boolean;
  autoCloseAfterCheckout: boolean;
  autoNoShowCancel: boolean;
  autoNoShowTime: number;
  alertPendingTime: boolean;
  pendingAlertMinutes: number;

  // UI Controls - Team
  showAddTicketAction: boolean;
  showAddNoteAction: boolean;
  showEditTeamAction: boolean;
  showQuickCheckoutAction: boolean;

  // UI Controls - Ticket
  showApplyDiscountAction: boolean;
  showRedeemBenefitsAction: boolean;
  showTicketNoteAction: boolean;
  showStartServiceAction: boolean;
  showPendingPaymentAction: boolean;
  showDeleteTicketAction: boolean;

  // Workflow Activation
  waitListActive: boolean;
  inServiceActive: boolean;
}

export type OperationTemplate =
  | 'frontDeskBalanced'
  | 'frontDeskTicketCenter'
  | 'teamWithOperationFlow'
  | 'teamInOut';

export type ViewWidth =
  | 'ultraCompact'
  | 'compact'
  | 'wide'
  | 'fullScreen'
  | 'custom';

export type DisplayMode = 'column' | 'tab';

export interface FrontDeskSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: FrontDeskSettingsData;
  onSettingsChange: (settings: Partial<FrontDeskSettingsData>) => void;
}

export interface TemplateInfo {
  title: string;
  description: string;
  layoutRatio: {
    team: number;
    ticket: number;
  };
}

export interface SettingSection {
  id: string;
  title: string;
  icon: React.ComponentType;
  component: React.ComponentType<any>;
}
```

---

## Step 3: Constants and Defaults

### `constants.ts`
```typescript
// src/components/FrontDeskSettings/constants.ts

import { FrontDeskSettingsData } from './types';

export const DEFAULT_SETTINGS: FrontDeskSettingsData = {
  // Operation Template
  operationTemplate: 'frontDeskBalanced',

  // Team Settings
  organizeBy: 'busyStatus',
  showTurnCount: true,
  showNextAppointment: true,
  showServicedAmount: true,
  showTicketCount: true,
  showLastDone: true,
  showMoreOptionsButton: true,
  viewWidth: 'wide',
  customWidthPercentage: 40,

  // Ticket Settings
  displayMode: 'column',
  viewStyle: 'expanded',
  showWaitList: true,
  showInService: true,
  showPending: true,
  closedTicketsPlacement: 'floating',
  sortBy: 'queue',
  combineSections: false,

  // Workflow & Rules
  showComingAppointments: true,
  comingAppointmentsDefaultState: 'expanded',
  enableDragAndDrop: true,
  autoCloseAfterCheckout: false,
  autoNoShowCancel: false,
  autoNoShowTime: 30,
  alertPendingTime: false,
  pendingAlertMinutes: 15,

  // UI Controls - Team
  showAddTicketAction: true,
  showAddNoteAction: true,
  showEditTeamAction: true,
  showQuickCheckoutAction: true,

  // UI Controls - Ticket
  showApplyDiscountAction: true,
  showRedeemBenefitsAction: true,
  showTicketNoteAction: true,
  showStartServiceAction: true,
  showPendingPaymentAction: true,
  showDeleteTicketAction: true,

  // Workflow Activation
  waitListActive: true,
  inServiceActive: true,
};

export const SETTINGS_STORAGE_KEY = 'frontDeskSettings';

export const ANIMATION_DURATION = 250;

export const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
} as const;
```

---

## Step 4: Shared Components

### `components/shared/ToggleSwitch.tsx`
```typescript
// src/components/FrontDeskSettings/components/shared/ToggleSwitch.tsx

import React, { memo } from 'react';
import { Circle, CheckCircle2 } from 'lucide-react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export const ToggleSwitch = memo<ToggleSwitchProps>(({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className = '',
}) => {
  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <div className={`group flex items-start justify-between py-2 w-full ${className}`}>
      <div className="flex flex-col pr-3">
        <span className={`text-sm font-medium ${
          disabled ? 'text-gray-400' : 'text-gray-800'
        }`}>
          {label}
        </span>
        {description && (
          <span className="text-xs text-gray-500 mt-0.5 max-w-[90%] leading-tight">
            {description}
          </span>
        )}
      </div>
      <div className="relative flex-shrink-0">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={label}
          disabled={disabled}
          className={`
            relative inline-flex h-6 w-11 flex-shrink-0 rounded-full
            border-2 border-transparent transition-colors duration-200
            ease-in-out focus:outline-none focus-visible:ring
            focus-visible:ring-[#27AE60]/30
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${checked ? 'bg-[#27AE60]' : 'bg-gray-200'}
          `}
          onClick={handleClick}
        >
          <span
            className={`
              pointer-events-none relative inline-block h-5 w-5
              transform rounded-full bg-white shadow-md ring-0
              transition duration-200 ease-in-out
              ${checked ? 'translate-x-5' : 'translate-x-0'}
            `}
          >
            <span
              className={`
                absolute inset-0 flex h-full w-full items-center
                justify-center transition-opacity
                ${checked ? 'opacity-0 duration-100 ease-out' : 'opacity-100 duration-200 ease-in'}
              `}
              aria-hidden="true"
            >
              <Circle className="h-3 w-3 text-gray-400" />
            </span>
            <span
              className={`
                absolute inset-0 flex h-full w-full items-center
                justify-center transition-opacity
                ${checked ? 'opacity-100 duration-200 ease-in' : 'opacity-0 duration-100 ease-out'}
              `}
              aria-hidden="true"
            >
              <CheckCircle2 className="h-3 w-3 text-[#27AE60]" />
            </span>
          </span>
        </button>
      </div>
    </div>
  );
});

ToggleSwitch.displayName = 'ToggleSwitch';
```

### `components/shared/SegmentedControl.tsx`
```typescript
// src/components/FrontDeskSettings/components/shared/SegmentedControl.tsx

import React, { memo } from 'react';

interface SegmentedControlOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  name: string;
  disabled?: boolean;
  className?: string;
}

export const SegmentedControl = memo<SegmentedControlProps>(({
  options,
  value,
  onChange,
  name,
  disabled = false,
  className = '',
}) => {
  return (
    <div
      className={`flex p-0.5 bg-gray-100 rounded-lg w-full max-w-md ${className}`}
      role="radiogroup"
      aria-label={name}
    >
      {options.map((option) => {
        const isSelected = value === option.value;
        const isDisabled = disabled || option.disabled;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={option.label}
            disabled={isDisabled}
            className={`
              flex-1 py-2 px-3 text-sm font-medium rounded-md
              transition-all duration-200
              ${isSelected
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
              }
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            onClick={() => !isDisabled && onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
});

SegmentedControl.displayName = 'SegmentedControl';
```

### `components/shared/SectionHeader.tsx`
```typescript
// src/components/FrontDeskSettings/components/shared/SectionHeader.tsx

import React, { memo } from 'react';
import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  icon: LucideIcon;
  description?: string;
  action?: React.ReactNode;
}

export const SectionHeader = memo<SectionHeaderProps>(({
  title,
  icon: Icon,
  description,
  action,
}) => {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-[#27AE60]/10 flex items-center justify-center mr-2.5">
            <Icon size={16} className="text-[#27AE60]" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        </div>
        {action && <div>{action}</div>}
      </div>
      {description && (
        <p className="text-sm text-gray-500 ml-10.5">{description}</p>
      )}
    </div>
  );
});

SectionHeader.displayName = 'SectionHeader';
```

---

## Step 5: Custom Hooks

### `hooks/useSettingsState.ts`
```typescript
// src/components/FrontDeskSettings/hooks/useSettingsState.ts

import { useState, useCallback, useEffect } from 'react';
import { FrontDeskSettingsData, OperationTemplate } from '../types';
import { DEFAULT_SETTINGS } from '../constants';
import { applyTemplateDependencies } from '../utils/dependencies';
import { validateSettings } from '../utils/validation';

interface UseSettingsStateReturn {
  settings: FrontDeskSettingsData;
  hasChanges: boolean;
  errors: Record<string, string>;
  updateSetting: <K extends keyof FrontDeskSettingsData>(
    key: K,
    value: FrontDeskSettingsData[K]
  ) => void;
  updateSettings: (updates: Partial<FrontDeskSettingsData>) => void;
  resetToDefaults: () => void;
  applyTemplate: (template: OperationTemplate) => void;
  validateAndSave: () => FrontDeskSettingsData | null;
}

export const useSettingsState = (
  initialSettings: FrontDeskSettingsData
): UseSettingsStateReturn => {
  const [settings, setSettings] = useState<FrontDeskSettingsData>(initialSettings);
  const [originalSettings, setOriginalSettings] = useState<FrontDeskSettingsData>(initialSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update original settings when props change
  useEffect(() => {
    setOriginalSettings(initialSettings);
    setSettings(initialSettings);
    setHasChanges(false);
    setErrors({});
  }, [initialSettings]);

  // Check for changes
  useEffect(() => {
    const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(changed);
  }, [settings, originalSettings]);

  const updateSetting = useCallback(<K extends keyof FrontDeskSettingsData>(
    key: K,
    value: FrontDeskSettingsData[K]
  ) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [key]: value };

      // Apply dependencies (e.g., if inService is enabled, waitList must be enabled)
      const withDependencies = applyTemplateDependencies(newSettings);

      // Validate the new settings
      const validationErrors = validateSettings(withDependencies);
      setErrors(validationErrors);

      return withDependencies;
    });
  }, []);

  const updateSettings = useCallback((updates: Partial<FrontDeskSettingsData>) => {
    setSettings((prev) => {
      const newSettings = { ...prev, ...updates };
      const withDependencies = applyTemplateDependencies(newSettings);
      const validationErrors = validateSettings(withDependencies);
      setErrors(validationErrors);
      return withDependencies;
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    setErrors({});
  }, []);

  const applyTemplate = useCallback((template: OperationTemplate) => {
    const templateSettings = getTemplateSettings(template);
    updateSettings(templateSettings);
  }, [updateSettings]);

  const validateAndSave = useCallback((): FrontDeskSettingsData | null => {
    const validationErrors = validateSettings(settings);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return null;
    }

    return settings;
  }, [settings]);

  return {
    settings,
    hasChanges,
    errors,
    updateSetting,
    updateSettings,
    resetToDefaults,
    applyTemplate,
    validateAndSave,
  };
};

// Template preset configurations
function getTemplateSettings(template: OperationTemplate): Partial<FrontDeskSettingsData> {
  const templates: Record<OperationTemplate, Partial<FrontDeskSettingsData>> = {
    frontDeskBalanced: {
      operationTemplate: 'frontDeskBalanced',
      viewWidth: 'wide',
      customWidthPercentage: 40,
      displayMode: 'column',
      combineSections: false,
      showComingAppointments: true,
      organizeBy: 'busyStatus',
    },
    frontDeskTicketCenter: {
      operationTemplate: 'frontDeskTicketCenter',
      viewWidth: 'compact',
      customWidthPercentage: 10,
      displayMode: 'tab',
      combineSections: true,
      showComingAppointments: true,
      organizeBy: 'busyStatus',
    },
    teamWithOperationFlow: {
      operationTemplate: 'teamWithOperationFlow',
      viewWidth: 'wide',
      customWidthPercentage: 80,
      displayMode: 'column',
      combineSections: false,
      showComingAppointments: true,
      organizeBy: 'busyStatus',
    },
    teamInOut: {
      operationTemplate: 'teamInOut',
      viewWidth: 'fullScreen',
      customWidthPercentage: 100,
      displayMode: 'column',
      combineSections: false,
      showComingAppointments: false,
      organizeBy: 'clockedStatus',
    },
  };

  return templates[template] || {};
}
```

### `hooks/useSettingsPersistence.ts`
```typescript
// src/components/FrontDeskSettings/hooks/useSettingsPersistence.ts

import { useCallback, useEffect } from 'react';
import { FrontDeskSettingsData } from '../types';
import { SETTINGS_STORAGE_KEY } from '../constants';

interface UseSettingsPersistenceReturn {
  saveToLocalStorage: (settings: FrontDeskSettingsData) => boolean;
  loadFromLocalStorage: () => FrontDeskSettingsData | null;
  clearLocalStorage: () => void;
  autoSave: (settings: FrontDeskSettingsData, enabled: boolean) => void;
}

export const useSettingsPersistence = (): UseSettingsPersistenceReturn => {
  const saveToLocalStorage = useCallback((settings: FrontDeskSettingsData): boolean => {
    try {
      const serialized = JSON.stringify(settings);
      localStorage.setItem(SETTINGS_STORAGE_KEY, serialized);

      // Dispatch custom event for other components to listen
      window.dispatchEvent(new CustomEvent('frontDeskSettingsUpdated', {
        detail: settings
      }));

      return true;
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
      return false;
    }
  }, []);

  const loadFromLocalStorage = useCallback((): FrontDeskSettingsData | null => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!stored) return null;

      const parsed = JSON.parse(stored);

      // Validate the loaded data has all required fields
      if (!parsed.operationTemplate || !parsed.displayMode) {
        console.warn('Invalid settings in localStorage, using defaults');
        return null;
      }

      return parsed as FrontDeskSettingsData;
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error);
      return null;
    }
  }, []);

  const clearLocalStorage = useCallback((): void => {
    try {
      localStorage.removeItem(SETTINGS_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear settings from localStorage:', error);
    }
  }, []);

  const autoSave = useCallback((settings: FrontDeskSettingsData, enabled: boolean): void => {
    if (enabled) {
      const timeoutId = setTimeout(() => {
        saveToLocalStorage(settings);
      }, 1000); // Debounce saves by 1 second

      return () => clearTimeout(timeoutId);
    }
  }, [saveToLocalStorage]);

  return {
    saveToLocalStorage,
    loadFromLocalStorage,
    clearLocalStorage,
    autoSave,
  };
};
```

---

## Step 6: Section Components

### `sections/TeamSettings.tsx`
```typescript
// src/components/FrontDeskSettings/sections/TeamSettings.tsx

import React, { memo } from 'react';
import { Users } from 'lucide-react';
import { FrontDeskSettingsData } from '../types';
import { SectionHeader } from '../components/shared/SectionHeader';
import { ToggleSwitch } from '../components/shared/ToggleSwitch';
import { SegmentedControl } from '../components/shared/SegmentedControl';

interface TeamSettingsProps {
  settings: FrontDeskSettingsData;
  onSettingChange: <K extends keyof FrontDeskSettingsData>(
    key: K,
    value: FrontDeskSettingsData[K]
  ) => void;
  errors?: Record<string, string>;
}

export const TeamSettings = memo<TeamSettingsProps>(({
  settings,
  onSettingChange,
  errors = {},
}) => {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Team Section"
        icon={Users}
        description="Configure how team members are displayed and organized"
      />

      {/* Display Options */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700">Display Options</h4>
        <div className="space-y-4 bg-gray-50 p-3.5 rounded-xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Organize Team By
            </label>
            <SegmentedControl
              options={[
                { value: 'busyStatus', label: 'Ready/Busy' },
                { value: 'clockedStatus', label: 'Clocked In/Out' },
              ]}
              value={settings.organizeBy}
              onChange={(value) =>
                onSettingChange('organizeBy', value as 'clockedStatus' | 'busyStatus')
              }
              name="organizeBy"
            />
          </div>

          {settings.organizeBy === 'busyStatus' && (
            <div className="pt-3 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Staff View Mode
              </label>
              <SegmentedControl
                options={[
                  { value: 'column', label: 'Column' },
                  { value: 'tab', label: 'Tab' },
                ]}
                value={settings.displayMode}
                onChange={(value) =>
                  onSettingChange('displayMode', value as 'column' | 'tab')
                }
                name="staffViewMode"
              />
            </div>
          )}
        </div>
      </div>

      {/* Card Data */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700">Card Data</h4>
        <div className="space-y-2 bg-gray-50 p-3.5 rounded-xl">
          <ToggleSwitch
            checked={settings.showTurnCount}
            onChange={(checked) => onSettingChange('showTurnCount', checked)}
            label="Turn Count"
            description="Number of turns the staff member has taken"
          />
          <ToggleSwitch
            checked={settings.showNextAppointment}
            onChange={(checked) => onSettingChange('showNextAppointment', checked)}
            label="Next Appointment Time"
            description="Shows upcoming appointment time and details"
          />
          <ToggleSwitch
            checked={settings.showServicedAmount}
            onChange={(checked) => onSettingChange('showServicedAmount', checked)}
            label="Serviced Amount"
            description="Total monetary value of services provided"
          />
          <ToggleSwitch
            checked={settings.showTicketCount}
            onChange={(checked) => onSettingChange('showTicketCount', checked)}
            label="Ticket Count"
            description="Number of tickets serviced"
          />
          <ToggleSwitch
            checked={settings.showLastDone}
            onChange={(checked) => onSettingChange('showLastDone', checked)}
            label="Last Done"
            description="Time of the most recent completed service"
          />
          <ToggleSwitch
            checked={settings.showMoreOptionsButton}
            onChange={(checked) => onSettingChange('showMoreOptionsButton', checked)}
            label="More Options Button"
            description="Button to access additional staff actions"
          />
        </div>
      </div>

      {/* UI Controls */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700">UI Controls</h4>
        <div className="space-y-2 bg-gray-50 p-3.5 rounded-xl">
          <ToggleSwitch
            checked={settings.showAddTicketAction}
            onChange={(checked) => onSettingChange('showAddTicketAction', checked)}
            label="Add Ticket"
            description="Allow adding tickets from staff cards"
          />
          <ToggleSwitch
            checked={settings.showAddNoteAction}
            onChange={(checked) => onSettingChange('showAddNoteAction', checked)}
            label="Add Note"
            description="Allow adding notes to staff members"
          />
          <ToggleSwitch
            checked={settings.showEditTeamAction}
            onChange={(checked) => onSettingChange('showEditTeamAction', checked)}
            label="Edit Team Member"
            description="Allow editing team member details"
          />
          <ToggleSwitch
            checked={settings.showQuickCheckoutAction}
            onChange={(checked) => onSettingChange('showQuickCheckoutAction', checked)}
            label="Quick Checkout"
            description="Show quick checkout option on staff cards"
          />
        </div>
      </div>
    </div>
  );
});

TeamSettings.displayName = 'TeamSettings';
```

---

## Step 7: Main Container Component

### `index.tsx`
```typescript
// src/components/FrontDeskSettings/index.tsx

import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { Settings } from 'lucide-react';
import FocusTrap from 'focus-trap-react';

import { FrontDeskSettingsProps } from './types';
import { useSettingsState } from './hooks/useSettingsState';
import { useSettingsPersistence } from './hooks/useSettingsPersistence';
import { BREAKPOINTS } from './constants';

import { SettingsHeader } from './components/SettingsHeader';
import { SettingsFooter } from './components/SettingsFooter';
import { SettingsNavigation } from './components/SettingsNavigation';
import { MobileAccordion } from './components/MobileAccordion';
import { LoadingSpinner } from './components/LoadingSpinner';

// Lazy load section components for better performance
const OperationTemplates = lazy(() => import('./sections/OperationTemplates'));
const TeamSettings = lazy(() => import('./sections/TeamSettings'));
const TicketSettings = lazy(() => import('./sections/TicketSettings'));
const WorkflowRules = lazy(() => import('./sections/WorkflowRules'));
const LayoutSettings = lazy(() => import('./sections/LayoutSettings'));

export const FrontDeskSettings: React.FC<FrontDeskSettingsProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSettingsChange,
}) => {
  const [activeSection, setActiveSection] = useState('operationTemplates');
  const [isMobile, setIsMobile] = useState(window.innerWidth < BREAKPOINTS.tablet);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const {
    settings,
    hasChanges,
    errors,
    updateSetting,
    updateSettings,
    resetToDefaults,
    applyTemplate,
    validateAndSave,
  } = useSettingsState(currentSettings);

  const { saveToLocalStorage } = useSettingsPersistence();

  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < BREAKPOINTS.tablet);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Escape key
      if (e.key === 'Escape') {
        handleClose();
      }

      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasChanges]);

  const handleSave = () => {
    const validatedSettings = validateAndSave();
    if (validatedSettings) {
      onSettingsChange(validatedSettings);
      saveToLocalStorage(validatedSettings);
      onClose();
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      setShowConfirmDialog(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmDialog(false);
    onClose();
  };

  if (!isOpen) return null;

  const sections = {
    operationTemplates: (
      <OperationTemplates
        settings={settings}
        onTemplateChange={applyTemplate}
        onOpenTemplateSetup={() => console.log('Template setup')}
      />
    ),
    teamSettings: (
      <TeamSettings
        settings={settings}
        onSettingChange={updateSetting}
        errors={errors}
      />
    ),
    ticketSettings: (
      <TicketSettings
        settings={settings}
        onSettingChange={updateSetting}
        errors={errors}
      />
    ),
    workflowRules: (
      <WorkflowRules
        settings={settings}
        onSettingChange={updateSetting}
        errors={errors}
      />
    ),
    layoutSettings: (
      <LayoutSettings
        settings={settings}
        onSettingChange={updateSetting}
        errors={errors}
      />
    ),
  };

  const modalContent = (
    <FocusTrap>
      <div
        className="fixed inset-0 z-[1050] overflow-hidden bg-black/40 backdrop-blur-[2px] flex items-center justify-center"
        onClick={handleClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="frontdesk-settings-title"
      >
        <div
          className={`
            bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col
            ${isMobile ? 'w-[95vw] h-[85vh]' : 'w-[800px] h-[700px]'}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          <SettingsHeader onClose={handleClose} />

          <div className="flex flex-1 overflow-hidden">
            {!isMobile && (
              <SettingsNavigation
                activeSection={activeSection}
                onSectionChange={setActiveSection}
                errors={errors}
              />
            )}

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <Suspense fallback={<LoadingSpinner />}>
                {isMobile ? (
                  <MobileAccordion sections={sections} />
                ) : (
                  sections[activeSection as keyof typeof sections]
                )}
              </Suspense>
            </div>
          </div>

          <SettingsFooter
            hasChanges={hasChanges}
            hasErrors={Object.keys(errors).length > 0}
            onSave={handleSave}
            onCancel={handleClose}
            onReset={resetToDefaults}
          />
        </div>

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 z-[1060] flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm">
              <h3 className="text-lg font-semibold mb-2">Unsaved Changes</h3>
              <p className="text-gray-600 mb-4">
                You have unsaved changes. Are you sure you want to discard them?
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmClose}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Discard Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </FocusTrap>
  );

  return createPortal(modalContent, document.body);
};

// Export everything for external use
export { DEFAULT_SETTINGS } from './constants';
export type { FrontDeskSettingsData } from './types';
```

---

## Step 8: Utility Functions

### `utils/validation.ts`
```typescript
// src/components/FrontDeskSettings/utils/validation.ts

import { FrontDeskSettingsData } from '../types';

export function validateSettings(settings: FrontDeskSettingsData): Record<string, string> {
  const errors: Record<string, string> = {};

  // Validate custom width percentage
  if (settings.viewWidth === 'custom') {
    if (settings.customWidthPercentage < 10 || settings.customWidthPercentage > 100) {
      errors.customWidthPercentage = 'Custom width must be between 10% and 100%';
    }
  }

  // Validate auto no-show time
  if (settings.autoNoShowCancel && settings.autoNoShowTime < 5) {
    errors.autoNoShowTime = 'Auto no-show time must be at least 5 minutes';
  }

  // Validate pending alert time
  if (settings.alertPendingTime && settings.pendingAlertMinutes < 1) {
    errors.pendingAlertMinutes = 'Pending alert time must be at least 1 minute';
  }

  // Validate workflow dependencies
  if (settings.inServiceActive && !settings.waitListActive) {
    errors.waitListActive = 'Wait List must be active when In Service is active';
  }

  return errors;
}
```

### `utils/dependencies.ts`
```typescript
// src/components/FrontDeskSettings/utils/dependencies.ts

import { FrontDeskSettingsData } from '../types';

export function applyTemplateDependencies(
  settings: FrontDeskSettingsData
): FrontDeskSettingsData {
  const newSettings = { ...settings };

  // If In Service is active, Wait List must also be active
  if (newSettings.inServiceActive && !newSettings.waitListActive) {
    newSettings.waitListActive = true;
  }

  // If combining sections, ensure both are shown
  if (newSettings.combineSections) {
    if (newSettings.waitListActive) newSettings.showWaitList = true;
    if (newSettings.inServiceActive) newSettings.showInService = true;
  }

  // If team view is full screen, hide ticket sections
  if (newSettings.viewWidth === 'fullScreen') {
    newSettings.showComingAppointments = false;
  }

  return newSettings;
}
```

---

## Step 9: Testing Implementation

### `__tests__/FrontDeskSettings.test.tsx`
```typescript
// src/components/FrontDeskSettings/__tests__/FrontDeskSettings.test.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FrontDeskSettings } from '../index';
import { DEFAULT_SETTINGS } from '../constants';

describe('FrontDeskSettings', () => {
  const mockOnClose = jest.fn();
  const mockOnSettingsChange = jest.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    currentSettings: DEFAULT_SETTINGS,
    onSettingsChange: mockOnSettingsChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when open', () => {
    render(<FrontDeskSettings {...defaultProps} />);
    expect(screen.getByText('Front Desk Settings')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<FrontDeskSettings {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Front Desk Settings')).not.toBeInTheDocument();
  });

  it('closes on escape key', () => {
    render(<FrontDeskSettings {...defaultProps} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('saves settings on Ctrl+S', () => {
    render(<FrontDeskSettings {...defaultProps} />);
    fireEvent.keyDown(window, { key: 's', ctrlKey: true });
    expect(mockOnSettingsChange).toHaveBeenCalled();
  });

  it('toggles a setting correctly', async () => {
    render(<FrontDeskSettings {...defaultProps} />);

    const toggleSwitch = screen.getByLabelText('Turn Count');
    await userEvent.click(toggleSwitch);

    const saveButton = screen.getByText('Save Changes');
    await userEvent.click(saveButton);

    expect(mockOnSettingsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        showTurnCount: false,
      })
    );
  });

  it('shows confirmation dialog when closing with unsaved changes', async () => {
    render(<FrontDeskSettings {...defaultProps} />);

    // Make a change
    const toggleSwitch = screen.getByLabelText('Turn Count');
    await userEvent.click(toggleSwitch);

    // Try to close
    const closeButton = screen.getByLabelText('Close settings panel');
    await userEvent.click(closeButton);

    // Check for confirmation dialog
    expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
  });

  it('applies template settings correctly', async () => {
    render(<FrontDeskSettings {...defaultProps} />);

    // Click on a template
    const templateButton = screen.getByText('Front Desk Ticket Center');
    await userEvent.click(templateButton);

    // Save changes
    const saveButton = screen.getByText('Save Changes');
    await userEvent.click(saveButton);

    expect(mockOnSettingsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        operationTemplate: 'frontDeskTicketCenter',
        viewWidth: 'compact',
      })
    );
  });
});
```

---

## Step 10: Integration Guide

### Update the main FrontDesk component

```typescript
// src/components/FrontDesk.tsx

// Replace the old import
// import { FrontDeskSettings } from './FrontDeskSettings';

// With the new modular import
import { FrontDeskSettings, DEFAULT_SETTINGS } from './FrontDeskSettings';
import type { FrontDeskSettingsData } from './FrontDeskSettings';

// The component usage remains the same
<FrontDeskSettings
  isOpen={showSettings}
  onClose={() => setShowSettings(false)}
  currentSettings={frontDeskSettings}
  onSettingsChange={handleSettingsChange}
/>
```

### Package.json updates (if needed)

```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/user-event": "^14.0.0",
    "jest": "^29.0.0",
    "react-window": "^1.8.8"
  }
}
```

---

## Migration Checklist

- [ ] Create directory structure
- [ ] Extract and create type definitions
- [ ] Move constants to separate file
- [ ] Create shared components
- [ ] Implement custom hooks
- [ ] Build section components
- [ ] Create main container
- [ ] Add utility functions
- [ ] Write unit tests
- [ ] Update imports in FrontDesk.tsx
- [ ] Test integration
- [ ] Remove old FrontDeskSettings.tsx
- [ ] Update documentation
- [ ] Performance testing
- [ ] Code review

---

## Performance Monitoring

After implementation, monitor these metrics:

```typescript
// Add performance monitoring
const PerformanceMonitor = () => {
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log(`${entry.name}: ${entry.duration}ms`);
      }
    });

    observer.observe({ entryTypes: ['measure'] });

    return () => observer.disconnect();
  }, []);
};
```

---

## Next Steps

1. **Immediate**: Start with Step 1-3 (Types, Constants, Shared Components)
2. **Day 2**: Implement hooks and section components (Step 4-6)
3. **Day 3**: Build main container and utilities (Step 7-8)
4. **Day 4**: Add tests and perform integration (Step 9-10)
5. **Day 5**: Final testing, documentation, and deployment

This implementation guide provides a complete, working solution that can be implemented incrementally while maintaining functionality throughout the refactoring process.