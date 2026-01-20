import React from 'react';
import { Settings, ChevronDown, ChevronUp } from 'lucide-react';
import type { TemplateDetails } from '../types';

interface TemplateSettingsProps {
  template: string;
  details: TemplateDetails;
  isExpanded: boolean;
  onToggle: () => void;
}

export const TemplateSettings: React.FC<TemplateSettingsProps> = ({
  template,
  details,
  isExpanded,
  onToggle,
}) => {
  return (
    <div className="mb-4">
      <button
        className="w-full flex items-center justify-between p-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <span className="flex items-center">
          <Settings size={14} className="mr-2" />
          Pre-configured Settings
        </span>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      <div className={`settings-panel mt-3 ${isExpanded ? 'expanded' : ''}`}>
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-gray-800 mb-1 flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-sm mr-2"></div>
                Team Section
              </h4>
              <ul className="ml-5 space-y-1 text-gray-600 text-xs">
                <li>
                  Width: <span className="font-medium">{details.teamRatio}%</span> of screen
                </li>
                <li>
                  Display mode:{' '}
                  <span className="font-medium">
                    {details.teamMode === 'column' ? 'Column View' : 'Tab View'}
                  </span>
                </li>
                <li>
                  Card data: <span className="font-medium">Name, Status, Active Ticket</span>
                </li>
                <li>
                  Staff UI:{' '}
                  <span className="font-medium">
                    {details.organizeBy === 'busyStatus' ? 'Ready/Busy Status Icons' : 'Clock In/Out Controls'}
                  </span>
                </li>
              </ul>
            </div>
            {details.ticketRatio > 0 && (
              <div>
                <h4 className="font-medium text-gray-800 mb-1 flex items-center">
                  <div className="w-3 h-3 bg-amber-500 rounded-sm mr-2"></div>
                  Ticket Section
                </h4>
                <ul className="ml-5 space-y-1 text-gray-600 text-xs">
                  <li>
                    Width: <span className="font-medium">{details.ticketRatio}%</span> of screen
                  </li>
                  <li>
                    Display mode:{' '}
                    <span className="font-medium">
                      {details.ticketMode === 'column' ? 'Column View' : 'Tab View'}
                    </span>
                  </li>
                  <li>
                    Sections: <span className="font-medium">Waiting, In Service, Complete</span>
                  </li>
                  <li>
                    Ticket UI: <span className="font-medium">Client Name, Service, Time, Stylist</span>
                  </li>
                </ul>
              </div>
            )}
            <div>
              <h4 className="font-medium text-gray-800 mb-1 flex items-center">
                <div className="w-3 h-3 bg-[#8E44AD] rounded-sm mr-2"></div>
                Workflow & Rules
              </h4>
              <ul className="ml-5 space-y-1 text-gray-600 text-xs">
                <li>
                  Lifecycle:{' '}
                  <span className="font-medium">
                    {details.organizeBy === 'busyStatus' ? 'Ready/Busy Status Flow' : 'Clock In/Out Only'}
                  </span>
                </li>
                <li>
                  Appointments:{' '}
                  <span className="font-medium">{details.showAppointments ? 'Visible' : 'Hidden'}</span>
                </li>
                <li>
                  Ticket flow:{' '}
                  <span className="font-medium">{details.ticketRatio > 0 ? 'Active' : 'Disabled'}</span>
                </li>
                <li>
                  Auto-assign:{' '}
                  <span className="font-medium">
                    {template === 'frontDeskTicketCenter' ? 'Manual' : 'Automatic'}
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-1 flex items-center">
                <div className="w-3 h-3 bg-emerald-500 rounded-sm mr-2"></div>
                Layout Section
              </h4>
              <ul className="ml-5 space-y-1 text-gray-600 text-xs">
                <li>
                  Width:{' '}
                  <span className="font-medium">
                    {template === 'frontDeskTicketCenter'
                      ? 'Compact'
                      : template === 'teamInOut'
                      ? 'Full Screen'
                      : 'Wide'}
                  </span>
                </li>
                <li>
                  Team/Ticket ratio:{' '}
                  <span className="font-medium">
                    {details.teamRatio}/{details.ticketRatio}
                  </span>
                </li>
                <li>
                  Mobile view:{' '}
                  <span className="font-medium">
                    {template === 'frontDeskTicketCenter' || template === 'teamWithOperationFlow'
                      ? 'Tabs'
                      : 'Columns'}
                  </span>
                </li>
              </ul>
            </div>
            <a
              href="#"
              className="text-emerald-500 hover:text-[#059669] text-xs font-medium inline-flex items-center"
            >
              <Settings size={12} className="mr-1" />
              Customize These Settings
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
