import React from 'react';
import { LayoutGrid } from 'lucide-react';
import { FrontDeskSettingsData } from '../types';
import { SectionHeader } from '../components';

interface LayoutSectionProps {
  settings: FrontDeskSettingsData;
  updateSetting: <K extends keyof FrontDeskSettingsData>(
    key: K,
    value: FrontDeskSettingsData[K]
  ) => void;
  isCompact?: boolean;
}

export const LayoutSection: React.FC<LayoutSectionProps> = ({
  settings,
  updateSetting,
  isCompact = false
}) => {
  const content = (
    <div className="space-y-3">
      <h4 className={`${isCompact ? 'text-sm font-semibold' : 'text-base font-medium'} text-gray-700`}>
        Widths & Views
      </h4>
      <div className={`space-y-5 bg-gray-50 ${isCompact ? 'p-3.5' : 'p-4'} rounded-xl ${!isCompact && 'border border-gray-100 shadow-sm'}`}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2.5">
            Fixed Widths
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="viewWidth"
                checked={settings.viewWidth === 'ultraCompact'}
                onChange={() => updateSetting('viewWidth', 'ultraCompact')}
                className="w-4 h-4 text-[#27AE60] border-gray-300 focus:ring-[#27AE60]"
              />
              <span className="ml-2 text-sm text-gray-700">
                Ultra Compact (icons only)
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="viewWidth"
                checked={settings.viewWidth === 'compact'}
                onChange={() => updateSetting('viewWidth', 'compact')}
                className="w-4 h-4 text-[#27AE60] border-gray-300 focus:ring-[#27AE60]"
              />
              <span className="ml-2 text-sm text-gray-700">
                Compact (names + key details)
              </span>
            </label>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2.5">
            Responsive Widths
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="viewWidth"
                checked={settings.viewWidth === 'wide'}
                onChange={() => updateSetting('viewWidth', 'wide')}
                className="w-4 h-4 text-[#27AE60] border-gray-300 focus:ring-[#27AE60]"
              />
              <span className="ml-2 text-sm text-gray-700">
                Wide (40% of screen)
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="viewWidth"
                checked={settings.viewWidth === 'fullScreen'}
                onChange={() => updateSetting('viewWidth', 'fullScreen')}
                className="w-4 h-4 text-[#27AE60] border-gray-300 focus:ring-[#27AE60]"
              />
              <span className="ml-2 text-sm text-gray-700">
                Full Screen (100%)
              </span>
            </label>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2.5">
            Custom Width
          </label>
          <div className="flex items-center">
            <input
              type="radio"
              name="viewWidth"
              checked={settings.viewWidth === 'custom'}
              onChange={() => updateSetting('viewWidth', 'custom')}
              className="w-4 h-4 text-[#27AE60] border-gray-300 focus:ring-[#27AE60]"
            />
            <span className="ml-2 text-sm text-gray-700 mr-3">
              Custom
            </span>
            <div className="flex items-center">
              <input
                type="number"
                min="10"
                max="80"
                step="5"
                value={settings.customWidthPercentage}
                onChange={(e) => {
                  // BUG-008 FIX: Validate and clamp customWidthPercentage to valid range
                  const rawValue = parseInt(e.target.value);
                  if (isNaN(rawValue)) {
                    updateSetting('customWidthPercentage', 40); // Default fallback
                  } else {
                    // Clamp value between 10 and 80
                    const clampedValue = Math.max(10, Math.min(80, rawValue));
                    updateSetting('customWidthPercentage', clampedValue);
                  }
                }}
                onBlur={(e) => {
                  // BUG-008 FIX: Re-validate on blur to catch edge cases
                  const rawValue = parseInt(e.target.value);
                  if (isNaN(rawValue) || rawValue < 10 || rawValue > 80) {
                    const clampedValue = isNaN(rawValue) ? 40 : Math.max(10, Math.min(80, rawValue));
                    updateSetting('customWidthPercentage', clampedValue);
                  }
                }}
                disabled={settings.viewWidth !== 'custom'}
                className="w-16 h-8 rounded-md border-gray-300 text-sm px-2 focus:ring-[#27AE60] focus:border-[#27AE60] disabled:bg-gray-100 disabled:text-gray-500"
              />
              <span className="ml-2 text-sm text-gray-700">%</span>
              {settings.viewWidth === 'custom' && (settings.customWidthPercentage < 10 || settings.customWidthPercentage > 80) && (
                <span className="ml-2 text-xs text-red-500">Must be 10-80%</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isCompact) {
    // Mobile/Compact View - content is directly rendered in accordion
    return <div className="space-y-5 animate-slideIn">{content}</div>;
  }

  // Desktop View
  return (
    <div className="animate-fadeIn">
      <SectionHeader title="Layout Section" icon={<LayoutGrid />} />
      {content}
    </div>
  );
};