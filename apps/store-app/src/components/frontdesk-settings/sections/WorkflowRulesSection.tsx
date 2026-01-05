import React from 'react';
import { Workflow, Info, Lock, AlertCircle, Clock } from 'lucide-react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { FrontDeskSettingsData } from '../types';
import { SectionHeader, ToggleSwitch, SegmentedControl } from '../components';

interface WorkflowRulesSectionProps {
  settings: FrontDeskSettingsData;
  updateSetting: <K extends keyof FrontDeskSettingsData>(
    key: K,
    value: FrontDeskSettingsData[K]
  ) => void;
  isCompact?: boolean;
}

export const WorkflowRulesSection: React.FC<WorkflowRulesSectionProps> = ({
  settings,
  updateSetting,
  isCompact = false
}) => {
  const content = (
    <>
      {/* A. Stage Activation */}
      <div className="space-y-3">
        <h4 className={`${isCompact ? 'text-sm font-semibold' : 'text-base font-medium'} text-gray-700`}>
          Stage Activation
        </h4>
        <div className={`space-y-3.5 bg-gray-50 ${isCompact ? 'p-3.5' : 'p-4'} rounded-xl ${!isCompact && 'border border-gray-100 shadow-sm'}`}>
          <div className="flex items-start mb-2.5">
            <Info size={16} className="text-[#27AE60] mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-xs text-gray-500 leading-tight">
              Activation controls whether a stage exists in the lifecycle. Visibility is managed in Ticket Section.
            </p>
          </div>

          <ToggleSwitch
            checked={settings.waitListActive}
            onChange={(checked) => updateSetting('waitListActive', checked)}
            label="Wait List"
            description="Enable the wait list stage in the ticket lifecycle"
          />

          <div className="flex items-center justify-between">
            <Tippy
              content={!settings.waitListActive ? 'Wait List must be active to enable In Service' : ''}
              disabled={settings.waitListActive}
            >
              <div className="flex-1">
                <ToggleSwitch
                  checked={settings.inServiceActive}
                  onChange={(checked) => updateSetting('inServiceActive', checked)}
                  label="In Service"
                  description="Enable the in-service stage in the ticket lifecycle"
                  disabled={!settings.waitListActive}
                />
              </div>
            </Tippy>
            {!settings.waitListActive && <AlertCircle size={16} className="text-amber-500 ml-2" />}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <ToggleSwitch
                checked={true}
                onChange={() => {}}
                label="Pending"
                description="Always active, cannot be deactivated"
                disabled={true}
              />
            </div>
            <Lock size={16} className="text-gray-400 ml-2" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <ToggleSwitch
                checked={true}
                onChange={() => {}}
                label="Closed"
                description="Always active, cannot be deactivated"
                disabled={true}
              />
            </div>
            <Lock size={16} className="text-gray-400 ml-2" />
          </div>
        </div>
      </div>

      {/* B. Ticket Flow */}
      <div className="space-y-3">
        <h4 className={`${isCompact ? 'text-sm font-semibold' : 'text-base font-medium'} text-gray-700`}>
          Ticket Flow
        </h4>
        <div className={`space-y-2.5 bg-gray-50 ${isCompact ? 'p-3.5' : 'p-4'} rounded-xl ${!isCompact && 'border border-gray-100 shadow-sm'}`}>
          <ToggleSwitch
            checked={settings.enableDragAndDrop}
            onChange={(checked) => updateSetting('enableDragAndDrop', checked)}
            label="Enable Drag & Drop"
            description="Allow moving tickets between active stages"
          />
          <ToggleSwitch
            checked={settings.autoCloseAfterCheckout}
            onChange={(checked) => updateSetting('autoCloseAfterCheckout', checked)}
            label="Auto-close After Checkout"
            description="Automatically close tickets after checkout is complete"
          />
        </div>
      </div>

      {/* C. Appointments */}
      <div className="space-y-3">
        <h4 className={`${isCompact ? 'text-sm font-semibold' : 'text-base font-medium'} text-gray-700`}>
          Appointments
        </h4>
        <div className={`space-y-3.5 bg-gray-50 ${isCompact ? 'p-3.5' : 'p-4'} rounded-xl ${!isCompact && 'border border-gray-100 shadow-sm'}`}>
          <ToggleSwitch
            checked={settings.showComingAppointments}
            onChange={(checked) => updateSetting('showComingAppointments', checked)}
            label="Coming Appointments"
            description="Display upcoming appointments in the salon center"
          />
          {settings.showComingAppointments && (
            <div className="space-y-3 mt-1.5 pt-3 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Default State
              </label>
              <SegmentedControl
                options={[
                  { value: 'expanded', label: 'Expanded' },
                  { value: 'collapsed', label: 'Collapsed' }
                ]}
                value={settings.comingAppointmentsDefaultState}
                onChange={(value) => updateSetting('comingAppointmentsDefaultState', value as 'expanded' | 'collapsed')}
                name="comingAppointmentsDefaultState"
                disabled={!settings.showComingAppointments}
              />
            </div>
          )}
        </div>
      </div>

      {/* D. Optional Automations */}
      <div className="space-y-3">
        <h4 className={`${isCompact ? 'text-sm font-semibold' : 'text-base font-medium'} text-gray-700`}>
          Optional Automations
        </h4>
        <div className={`space-y-3.5 bg-gray-50 ${isCompact ? 'p-3.5' : 'p-4'} rounded-xl ${!isCompact && 'border border-gray-100 shadow-sm'}`}>
          <div className="flex items-start space-x-2 mb-2">
            <Info size={16} className="text-[#27AE60] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-500 leading-tight">
              These options will be available in a future update
            </p>
          </div>
          <div className="space-y-3.5 opacity-60">
            <div className="flex items-start justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Auto-cancel No-shows
                </label>
                <p className="text-xs text-gray-500">
                  After waiting for set time
                </p>
              </div>
              <div className="flex items-center">
                <input
                  type="number"
                  min="5"
                  max="120"
                  step="5"
                  value={settings.autoNoShowTime}
                  onChange={(e) => updateSetting('autoNoShowTime', parseInt(e.target.value) || 30)}
                  disabled={true}
                  className="w-16 h-8 rounded-md border-gray-300 text-sm px-2 focus:ring-[#27AE60] focus:border-[#27AE60] disabled:bg-gray-100 disabled:text-gray-500"
                />
                <span className="ml-2 text-sm text-gray-700">min</span>
              </div>
            </div>
            <div className="flex items-start justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alert if Ticket Pending
                </label>
                <p className="text-xs text-gray-500">
                  Notify if ticket is pending too long
                </p>
              </div>
              <div className="flex items-center">
                <input
                  type="number"
                  min="1"
                  max="60"
                  step="1"
                  value={settings.pendingAlertMinutes}
                  onChange={(e) => updateSetting('pendingAlertMinutes', parseInt(e.target.value) || 15)}
                  disabled={true}
                  className="w-16 h-8 rounded-md border-gray-300 text-sm px-2 focus:ring-[#27AE60] focus:border-[#27AE60] disabled:bg-gray-100 disabled:text-gray-500"
                />
                <span className="ml-2 text-sm text-gray-700">min</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  if (isCompact) {
    // Mobile/Compact View - content is directly rendered in accordion
    return <div className="space-y-5 animate-slideIn">{content}</div>;
  }

  // Desktop View
  return (
    <div className="animate-fadeIn">
      <SectionHeader title="Workflow & Rules" icon={<Workflow />} />
      <div className="space-y-6">{content}</div>
    </div>
  );
};