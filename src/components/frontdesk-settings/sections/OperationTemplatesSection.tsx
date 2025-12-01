import React from 'react';
import { Layers, ArrowRight, Users, FileText } from 'lucide-react';
import { FrontDeskSettingsData } from '../types';
import { SectionHeader } from '../components';
// ISSUE-001: Use centralized template config
import { getTemplateSettings, getTemplateMetadata } from '../templateConfigs';

interface OperationTemplatesSectionProps {
  settings: FrontDeskSettingsData;
  updateSetting: <K extends keyof FrontDeskSettingsData>(
    key: K,
    value: FrontDeskSettingsData[K]
  ) => void;
  onChangeTemplate: () => void;
  isCompact?: boolean;
}

export const OperationTemplatesSection: React.FC<OperationTemplatesSectionProps> = ({
  settings,
  updateSetting,
  onChangeTemplate,
  isCompact = false
}) => {
  // ISSUE-001: Use centralized template metadata
  const templateInfo = getTemplateMetadata(settings.operationTemplate);

  // Apply template presets using centralized config
  const applyTemplate = (template: FrontDeskSettingsData['operationTemplate']) => {
    // ISSUE-001: Use centralized template settings
    const newSettings = getTemplateSettings(template);

    // BUG-017 FIX: Apply all settings with proper type safety
    (Object.keys(newSettings) as Array<keyof FrontDeskSettingsData>).forEach((key) => {
      const value = newSettings[key];
      if (value !== undefined) {
        updateSetting(key, value);
      }
    });
  };

  if (isCompact) {
    // Mobile/Compact View
    return (
      <div className="space-y-5 animate-slideIn">
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm">
          {/* Current Template Preview */}
          <div className="mb-3.5">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Current Template
            </h4>
            <div className="bg-white rounded-lg border border-gray-200 p-3.5">
              <div className="h-20 mb-3 bg-gray-50 rounded-lg overflow-hidden flex border border-gray-100">
                <div
                  className="h-full bg-[#E8F2FF]"
                  style={{ width: `${templateInfo.layoutRatio.team}%` }}
                >
                  <div className="h-full flex flex-col justify-center items-center">
                    <Users size={16} className="text-[#3B82F6] mb-1" />
                    <div className="text-xs text-[#3B82F6] font-medium">
                      {templateInfo.layoutRatio.team}%
                    </div>
                  </div>
                </div>
                <div
                  className="h-full bg-[#FFF8E6]"
                  style={{ width: `${templateInfo.layoutRatio.ticket}%` }}
                >
                  <div className="h-full flex flex-col justify-center items-center">
                    <FileText size={16} className="text-[#F59E0B] mb-1" />
                    <div className="text-xs text-[#F59E0B] font-medium">
                      {templateInfo.layoutRatio.ticket}%
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-medium text-gray-800">
                  {templateInfo.title}
                </h5>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${templateInfo.userType === 'Front Desk Staff' ? 'bg-[#3B82F6]/10 text-[#3B82F6]' : 'bg-[#8E44AD]/10 text-[#8E44AD]'}`}>
                  {templateInfo.userType}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {templateInfo.subtitle} - {templateInfo.description}
              </p>
              <button
                onClick={onChangeTemplate}
                className="mt-3 w-full px-3 py-2 bg-[#27AE60] text-white text-sm font-medium rounded-lg flex items-center justify-center hover:bg-[#219653] transition-colors"
              >
                <Layers size={16} className="mr-2" />
                Change Template
              </button>
            </div>
          </div>
          {/* Reset to Template Defaults */}
          <div className="pt-2.5 border-t border-gray-200">
            <button
              className="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700 rounded-lg flex items-center justify-center transition-colors"
              onClick={() => applyTemplate(settings.operationTemplate)}
            >
              <ArrowRight size={16} className="mr-2" />
              Reset to Template Defaults
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Desktop View
  return (
    <div className="animate-fadeIn">
      <SectionHeader title="Operation Templates" icon={<Layers />} />
      <div className="space-y-3">
        <h4 className="text-base font-medium text-gray-800">
          Current Template
        </h4>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="h-28 w-full lg:w-1/3 bg-white rounded-lg overflow-hidden flex border border-gray-100">
              <div
                className="h-full bg-[#E8F2FF]"
                style={{ width: `${templateInfo.layoutRatio.team}%` }}
              >
                <div className="h-full flex flex-col justify-center items-center">
                  <Users size={18} className="text-[#3B82F6] mb-1.5" />
                  <div className="text-xs text-[#3B82F6] font-medium">
                    {templateInfo.layoutRatio.team}%
                  </div>
                </div>
              </div>
              <div
                className="h-full bg-[#FFF8E6]"
                style={{ width: `${templateInfo.layoutRatio.ticket}%` }}
              >
                <div className="h-full flex flex-col justify-center items-center">
                  <FileText size={18} className="text-[#F59E0B] mb-1.5" />
                  <div className="text-xs text-[#F59E0B] font-medium">
                    {templateInfo.layoutRatio.ticket}%
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h5 className="text-base font-semibold text-gray-800">
                  {templateInfo.title}
                </h5>
                <span className={`text-xs px-2 py-0.5 rounded-full ${templateInfo.userType === 'Front Desk Staff' ? 'bg-[#3B82F6]/10 text-[#3B82F6]' : 'bg-[#8E44AD]/10 text-[#8E44AD]'}`}>
                  {templateInfo.userType}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-1">{templateInfo.subtitle}</p>
              <p className="text-sm text-gray-500 mb-3">
                {templateInfo.description}
              </p>
              <button
                onClick={onChangeTemplate}
                className="px-4 py-2 bg-[#27AE60] text-white text-sm font-medium rounded-lg flex items-center justify-center hover:bg-[#219653] transition-colors"
              >
                <Layers size={16} className="mr-2" />
                Change Template
              </button>
            </div>
          </div>
          {/* Reset to Template Defaults */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              className="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700 rounded-lg flex items-center justify-center transition-colors"
              onClick={() => applyTemplate(settings.operationTemplate)}
            >
              <ArrowRight size={16} className="mr-2" />
              Reset to Template Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};