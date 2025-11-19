import React from 'react';
import { FileText, Lock, AlertCircle } from 'lucide-react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { FrontDeskSettingsData } from '../types';
import { SectionHeader, ToggleSwitch, SegmentedControl } from '../components';

interface TicketSectionProps {
  settings: FrontDeskSettingsData;
  updateSetting: <K extends keyof FrontDeskSettingsData>(
    key: K,
    value: FrontDeskSettingsData[K]
  ) => void;
  isCompact?: boolean;
}

export const TicketSection: React.FC<TicketSectionProps> = ({
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
          <div className="space-y-3 mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Display Mode
            </label>
            <SegmentedControl
              options={[
                { value: 'column', label: 'Column' },
                { value: 'tab', label: 'Tab' }
              ]}
              value={settings.displayMode}
              onChange={(value) => updateSetting('displayMode', value as 'column' | 'tab')}
              name="displayMode"
            />
          </div>
          <div className="space-y-3 pt-3 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              View Style
            </label>
            <SegmentedControl
              options={[
                { value: 'expanded', label: 'Expanded' },
                { value: 'compact', label: 'Compact' }
              ]}
              value={settings.viewStyle}
              onChange={(value) => updateSetting('viewStyle', value as 'expanded' | 'compact')}
              name="viewStyle"
            />
          </div>
        </div>
      </div>

      {/* B. Section Visibility */}
      <div className="space-y-3">
        <h4 className={`${isCompact ? 'text-sm font-semibold' : 'text-base font-medium'} text-gray-700`}>
          Section Visibility
        </h4>
        <div className={`space-y-2.5 bg-gray-50 ${isCompact ? 'p-3.5' : 'p-4'} rounded-xl ${!isCompact && 'border border-gray-100 shadow-sm'}`}>
          <div className="flex items-center justify-between">
            <Tippy
              content={!settings.waitListActive ? 'This stage is deactivated in Workflow & Rules' : ''}
              disabled={settings.waitListActive}
            >
              <div className="flex-1">
                <ToggleSwitch
                  checked={settings.showWaitList}
                  onChange={(checked) => updateSetting('showWaitList', checked)}
                  label="Wait List"
                  description="Show clients waiting to be serviced"
                  disabled={!settings.waitListActive}
                />
              </div>
            </Tippy>
            {!settings.waitListActive && <Lock size={16} className="text-gray-400 ml-2" />}
          </div>

          <div className="flex items-center justify-between">
            <Tippy
              content={!settings.inServiceActive ? 'This stage is deactivated in Workflow & Rules' : ''}
              disabled={settings.inServiceActive}
            >
              <div className="flex-1">
                <ToggleSwitch
                  checked={settings.showInService}
                  onChange={(checked) => updateSetting('showInService', checked)}
                  label="In Service"
                  description="Show clients currently being serviced"
                  disabled={!settings.inServiceActive}
                />
              </div>
            </Tippy>
            {!settings.inServiceActive && <Lock size={16} className="text-gray-400 ml-2" />}
          </div>

          <ToggleSwitch
            checked={settings.showPending}
            onChange={(checked) => updateSetting('showPending', checked)}
            label="Pending"
            description="Show clients waiting for additional steps"
          />

          <div className="pt-3 border-t border-gray-200 mt-2">
            <h5 className="text-sm font-medium text-gray-700 mb-2.5">
              Closed Tickets Placement
            </h5>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="closedTicketsPlacement"
                  checked={settings.closedTicketsPlacement === 'floating'}
                  onChange={() => updateSetting('closedTicketsPlacement', 'floating')}
                  className="w-4 h-4 text-[#27AE60] border-gray-300 focus:ring-[#27AE60]"
                />
                <span className="ml-2 text-sm text-gray-700">Floating Icon</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="closedTicketsPlacement"
                  checked={settings.closedTicketsPlacement === 'bottom'}
                  onChange={() => updateSetting('closedTicketsPlacement', 'bottom')}
                  className="w-4 h-4 text-[#27AE60] border-gray-300 focus:ring-[#27AE60]"
                />
                <span className="ml-2 text-sm text-gray-700">Bottom Section</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="closedTicketsPlacement"
                  checked={settings.closedTicketsPlacement === 'hidden'}
                  onChange={() => updateSetting('closedTicketsPlacement', 'hidden')}
                  className="w-4 h-4 text-[#27AE60] border-gray-300 focus:ring-[#27AE60]"
                />
                <span className="ml-2 text-sm text-gray-700">Hidden</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* C. Sort & Layout */}
      <div className="space-y-3">
        <h4 className={`${isCompact ? 'text-sm font-semibold' : 'text-base font-medium'} text-gray-700`}>
          Sort & Layout
        </h4>
        <div className={`space-y-5 bg-gray-50 ${isCompact ? 'p-3.5' : 'p-4'} rounded-xl ${!isCompact && 'border border-gray-100 shadow-sm'}`}>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Sort By
            </label>
            <SegmentedControl
              options={[
                { value: 'queue', label: 'Queue Position' },
                { value: 'time', label: 'Arrival Time' }
              ]}
              value={settings.sortBy}
              onChange={(value) => updateSetting('sortBy', value as 'queue' | 'time')}
              name="sortBy"
            />
          </div>
          <div className="space-y-2 pt-3 border-t border-gray-200">
            <ToggleSwitch
              checked={settings.combineSections}
              onChange={(checked) => updateSetting('combineSections', checked)}
              label="Combine Sections"
              description="Combine Wait List and In Service into a unified view"
            />
          </div>
        </div>
      </div>

      {/* D. UI Controls */}
      <div className="space-y-3">
        <h4 className={`${isCompact ? 'text-sm font-semibold' : 'text-base font-medium'} text-gray-700`}>
          UI Controls
        </h4>
        <div className={`space-y-2 bg-gray-50 ${isCompact ? 'p-3.5' : 'p-4'} rounded-xl ${!isCompact && 'border border-gray-100 shadow-sm'}`}>
          <ToggleSwitch
            checked={settings.showApplyDiscountAction}
            onChange={(checked) => updateSetting('showApplyDiscountAction', checked)}
            label="Apply Discount"
            description="Allow applying discounts to tickets"
          />
          <ToggleSwitch
            checked={settings.showRedeemBenefitsAction}
            onChange={(checked) => updateSetting('showRedeemBenefitsAction', checked)}
            label="Redeem Benefits"
            description="Allow redeeming coupons, points, memberships, or packages"
          />
          <ToggleSwitch
            checked={settings.showTicketNoteAction}
            onChange={(checked) => updateSetting('showTicketNoteAction', checked)}
            label="Add Note"
            description="Allow adding notes to tickets"
          />
          <ToggleSwitch
            checked={settings.showStartServiceAction}
            onChange={(checked) => updateSetting('showStartServiceAction', checked)}
            label="Start Service"
            description="Show start service action on tickets"
          />
          <ToggleSwitch
            checked={settings.showPendingPaymentAction}
            onChange={(checked) => updateSetting('showPendingPaymentAction', checked)}
            label="Pending Payment"
            description="Allow marking tickets as pending payment"
          />
          <ToggleSwitch
            checked={settings.showDeleteTicketAction}
            onChange={(checked) => updateSetting('showDeleteTicketAction', checked)}
            label="Delete Ticket"
            description="Allow deleting tickets"
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
      <SectionHeader title="Ticket Section" icon={<FileText />} />
      <div className="space-y-6">{content}</div>
    </div>
  );
};