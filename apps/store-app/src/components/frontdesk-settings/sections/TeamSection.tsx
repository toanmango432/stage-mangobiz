import React from 'react';
import { Users } from 'lucide-react';
import { FrontDeskSettingsData } from '../types';
import { SectionHeader, ToggleSwitch, SegmentedControl } from '../components';

interface TeamSectionProps {
  settings: FrontDeskSettingsData;
  updateSetting: <K extends keyof FrontDeskSettingsData>(
    key: K,
    value: FrontDeskSettingsData[K]
  ) => void;
  isCompact?: boolean;
}

export const TeamSection: React.FC<TeamSectionProps> = ({
  settings,
  updateSetting,
  isCompact = false
}) => {
  const content = (
    <>
      {/* A. Display Options */}
      <div className="space-y-3">
        <h4 className={`${isCompact ? 'text-sm font-semibold' : 'text-base font-medium'} text-gray-700`}>
          Display Options
        </h4>
        <div className={`space-y-4 bg-gray-50 ${isCompact ? 'p-3.5' : 'p-4'} rounded-xl ${!isCompact && 'border border-gray-100 shadow-sm'}`}>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Organize Team By
            </label>
            <SegmentedControl
              options={[
                { value: 'busyStatus', label: 'Ready/Busy' },
                { value: 'clockedStatus', label: 'Clocked In/Out' }
              ]}
              value={settings.organizeBy}
              onChange={(value) => updateSetting('organizeBy', value as 'clockedStatus' | 'busyStatus')}
              name="organizeBy"
            />
          </div>
          {settings.organizeBy === 'busyStatus' && (
            <div className="space-y-3 pt-3 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Staff View Mode
              </label>
              <SegmentedControl
                options={[
                  { value: 'column', label: 'Column' },
                  { value: 'tab', label: 'Tab' }
                ]}
                value={settings.displayMode}
                onChange={(value) => updateSetting('displayMode', value as 'column' | 'tab')}
                name="staffViewMode"
              />
            </div>
          )}
        </div>
      </div>

      {/* B. Card Data */}
      <div className="space-y-3">
        <h4 className={`${isCompact ? 'text-sm font-semibold' : 'text-base font-medium'} text-gray-700`}>
          Card Data
        </h4>
        <div className={`space-y-2 bg-gray-50 ${isCompact ? 'p-3.5' : 'p-4'} rounded-xl ${!isCompact && 'border border-gray-100 shadow-sm'}`}>
          <ToggleSwitch
            checked={settings.showTurnCount}
            onChange={(checked) => updateSetting('showTurnCount', checked)}
            label="Turn Count"
            description="Number of turns the staff member has taken"
          />
          <ToggleSwitch
            checked={settings.showNextAppointment}
            onChange={(checked) => updateSetting('showNextAppointment', checked)}
            label="Next Appointment Time"
            description="Shows upcoming appointment time and details"
          />
          <ToggleSwitch
            checked={settings.showServicedAmount}
            onChange={(checked) => updateSetting('showServicedAmount', checked)}
            label="Serviced Amount"
            description="Total monetary value of services provided"
          />
          <ToggleSwitch
            checked={settings.showTicketCount}
            onChange={(checked) => updateSetting('showTicketCount', checked)}
            label="Ticket Count"
            description="Number of tickets serviced"
          />
          <ToggleSwitch
            checked={settings.showLastDone}
            onChange={(checked) => updateSetting('showLastDone', checked)}
            label="Last Done"
            description="Time of the most recent completed service"
          />
          <ToggleSwitch
            checked={settings.showMoreOptionsButton}
            onChange={(checked) => updateSetting('showMoreOptionsButton', checked)}
            label="More Options Button"
            description="Button to access additional staff actions"
          />
        </div>
      </div>

      {/* C. UI Controls */}
      <div className="space-y-3">
        <h4 className={`${isCompact ? 'text-sm font-semibold' : 'text-base font-medium'} text-gray-700`}>
          UI Controls
        </h4>
        <div className={`space-y-2 bg-gray-50 ${isCompact ? 'p-3.5' : 'p-4'} rounded-xl ${!isCompact && 'border border-gray-100 shadow-sm'}`}>
          <ToggleSwitch
            checked={settings.showAddTicketAction}
            onChange={(checked) => updateSetting('showAddTicketAction', checked)}
            label="Add Ticket"
            description="Allow adding tickets from staff cards"
          />
          <ToggleSwitch
            checked={settings.showAddNoteAction}
            onChange={(checked) => updateSetting('showAddNoteAction', checked)}
            label="Add Note"
            description="Allow adding notes to staff members"
          />
          <ToggleSwitch
            checked={settings.showEditTeamAction}
            onChange={(checked) => updateSetting('showEditTeamAction', checked)}
            label="Edit Team Member"
            description="Allow editing team member details"
          />
          <ToggleSwitch
            checked={settings.showQuickCheckoutAction}
            onChange={(checked) => updateSetting('showQuickCheckoutAction', checked)}
            label="Quick Checkout"
            description="Show quick checkout option on staff cards"
          />
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
      <SectionHeader title="Team Section" icon={<Users />} />
      <div className="space-y-6">{content}</div>
    </div>
  );
};