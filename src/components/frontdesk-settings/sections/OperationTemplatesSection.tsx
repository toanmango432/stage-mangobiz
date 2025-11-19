import React from 'react';
import { Layers, ArrowRight, Users, FileText } from 'lucide-react';
import { FrontDeskSettingsData } from '../types';
import { SectionHeader } from '../components';

interface OperationTemplatesSectionProps {
  settings: FrontDeskSettingsData;
  updateSetting: <K extends keyof FrontDeskSettingsData>(
    key: K,
    value: FrontDeskSettingsData[K]
  ) => void;
  onChangeTemplate: () => void;
  isCompact?: boolean;
}

// Get template info
const getTemplateInfo = (template: FrontDeskSettingsData['operationTemplate']) => {
  switch (template) {
    case 'frontDeskBalanced':
      return {
        title: 'Front Desk Balanced',
        description: 'Balanced view of team and tickets with 40/60 ratio',
        layoutRatio: { team: 40, ticket: 60 }
      };
    case 'frontDeskTicketCenter':
      return {
        title: 'Front Desk Ticket Center',
        description: 'Ticket-focused view with minimal team display',
        layoutRatio: { team: 10, ticket: 90 }
      };
    case 'teamWithOperationFlow':
      return {
        title: 'Team with Operation Flow',
        description: 'Team-focused view with operation flow',
        layoutRatio: { team: 80, ticket: 20 }
      };
    case 'teamInOut':
      return {
        title: 'Team In/Out',
        description: 'Full team view focused on clock in/out status',
        layoutRatio: { team: 100, ticket: 0 }
      };
    default:
      return {
        title: 'Custom Template',
        description: 'Custom configuration',
        layoutRatio: { team: 50, ticket: 50 }
      };
  }
};

export const OperationTemplatesSection: React.FC<OperationTemplatesSectionProps> = ({
  settings,
  updateSetting,
  onChangeTemplate,
  isCompact = false
}) => {
  const templateInfo = getTemplateInfo(settings.operationTemplate);

  // Apply template presets
  const applyTemplate = (template: FrontDeskSettingsData['operationTemplate']) => {
    let newSettings: Partial<FrontDeskSettingsData> = {
      operationTemplate: template
    };

    // Apply preset values based on template
    switch (template) {
      case 'frontDeskBalanced':
        newSettings = {
          ...newSettings,
          viewWidth: 'wide',
          customWidthPercentage: 40,
          displayMode: 'column',
          combineSections: false,
          showComingAppointments: true,
          organizeBy: 'busyStatus'
        };
        break;
      case 'frontDeskTicketCenter':
        newSettings = {
          ...newSettings,
          viewWidth: 'compact',
          customWidthPercentage: 10,
          displayMode: 'tab',
          combineSections: true,
          showComingAppointments: true,
          organizeBy: 'busyStatus'
        };
        break;
      case 'teamWithOperationFlow':
        newSettings = {
          ...newSettings,
          viewWidth: 'wide',
          customWidthPercentage: 80,
          displayMode: 'column',
          combineSections: false,
          showComingAppointments: false,
          organizeBy: 'clockedStatus'
        };
        break;
      case 'teamInOut':
        newSettings = {
          ...newSettings,
          viewWidth: 'fullScreen',
          customWidthPercentage: 100,
          displayMode: 'column',
          combineSections: false,
          showComingAppointments: false,
          organizeBy: 'clockedStatus'
        };
        break;
    }

    // Apply all settings
    Object.entries(newSettings).forEach(([key, value]) => {
      updateSetting(key as keyof FrontDeskSettingsData, value as any);
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
              <h5 className="text-sm font-medium text-gray-800">
                {templateInfo.title}
              </h5>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {templateInfo.description}
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
              <h5 className="text-base font-semibold text-gray-800 mb-1">
                {templateInfo.title}
              </h5>
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