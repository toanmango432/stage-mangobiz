import React from 'react';
import { Users, FileText, Clock, LayoutDashboard } from 'lucide-react';
import type { TemplateDetails } from '../types';

interface TemplatePreviewProps {
  template: string;
  details: TemplateDetails;
}

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  details,
}) => {
  return (
    <div className="template-preview h-64 bg-white border-b border-gray-200">
      {/* Template header */}
      <div className="bg-gray-100 py-2 px-4 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center">
          <div className="bg-emerald-500 text-white p-1 rounded mr-2 shadow-sm">
            <LayoutDashboard size={14} />
          </div>
          <h3 className="text-sm font-medium text-gray-800">
            {details.title}
          </h3>
        </div>
        <span className="text-xs font-medium bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
          {details.teamRatio}/{details.ticketRatio}
        </span>
      </div>
      {/* Template body - realistic mockup */}
      <div className="flex h-[calc(100%-40px)]">
        {/* Team Section - Only show if teamRatio > 0 */}
        {details.teamRatio > 0 && (
          <div className="h-full flex flex-col border-r border-gray-200 overflow-hidden" style={{ width: `${details.teamRatio}%` }}>
            {/* Team Header */}
            <div className="flex items-center justify-between bg-[#E8F2FF] px-2 py-1.5 border-b border-blue-500/20">
              <div className="flex items-center">
                <Users size={14} className="text-blue-500 mr-1.5" />
                <span className="text-xs font-medium text-blue-500">Team</span>
              </div>
              {/* Tab/Column toggle based on teamMode */}
              {details.teamMode === 'tab' ? (
                <div className="flex text-[10px] bg-blue-500/10 rounded-sm overflow-hidden">
                  <div className={`px-1.5 py-0.5 ${details.organizeBy === 'busyStatus' ? 'bg-blue-500 text-white' : 'text-blue-500'}`}>Ready</div>
                  <div className={`px-1.5 py-0.5 ${details.organizeBy === 'busyStatus' ? 'text-blue-500' : 'bg-blue-500 text-white'}`}>Busy</div>
                </div>
              ) : (
                <div className="text-[10px] text-blue-500 font-medium">
                  {details.organizeBy === 'busyStatus' ? 'Ready/Busy' : 'Clocked In/Out'}
                </div>
              )}
            </div>
            {/* Team Content */}
            <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5">
              {details.organizeBy === 'busyStatus' ? (
                <>
                  {/* Ready Staff */}
                  <div className="text-[10px] font-medium text-emerald-500 mb-1 px-0.5">Ready</div>
                  <div className="staff-card bg-white rounded border border-gray-100 shadow-sm p-1.5">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center mr-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      </div>
                      <span className="text-xs font-medium text-gray-800">Sarah T.</span>
                      {template !== 'teamInOut' && (
                        <span className="ml-auto text-[9px] text-blue-500 bg-blue-500/10 px-1 py-0.5 rounded">1 client</span>
                      )}
                    </div>
                  </div>
                  {/* Busy Staff */}
                  <div className="text-[10px] font-medium text-gray-500 mb-1 mt-2 px-0.5">Busy</div>
                  <div className="staff-card bg-white rounded border border-gray-100 shadow-sm p-1.5">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center mr-1.5">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                      </div>
                      <span className="text-xs font-medium text-gray-800">Mike R.</span>
                      {template !== 'teamInOut' && (
                        <span className="ml-auto text-[9px] text-amber-600 bg-amber-50 px-1 py-0.5 rounded">In service</span>
                      )}
                    </div>
                  </div>
                  <div className="staff-card bg-white rounded border border-gray-100 shadow-sm p-1.5">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center mr-1.5">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                      </div>
                      <span className="text-xs font-medium text-gray-800">Emma S.</span>
                      {template !== 'teamInOut' && (
                        <span className="ml-auto text-[9px] text-amber-600 bg-amber-50 px-1 py-0.5 rounded">In service</span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Clocked In Staff */}
                  <div className="text-[10px] font-medium text-emerald-500 mb-1 px-0.5">Clocked In</div>
                  <div className="staff-card bg-white rounded border border-gray-100 shadow-sm p-1.5">
                    <div className="flex items-center">
                      <span className="text-xs font-medium text-gray-800">Sarah T.</span>
                      <span className="ml-auto text-[9px] text-emerald-500 bg-emerald-500/10 px-1 py-0.5 rounded">8:30 AM</span>
                    </div>
                  </div>
                  <div className="staff-card bg-white rounded border border-gray-100 shadow-sm p-1.5">
                    <div className="flex items-center">
                      <span className="text-xs font-medium text-gray-800">Mike R.</span>
                      <span className="ml-auto text-[9px] text-emerald-500 bg-emerald-500/10 px-1 py-0.5 rounded">9:15 AM</span>
                    </div>
                  </div>
                  {/* Clocked Out Staff */}
                  <div className="text-[10px] font-medium text-gray-500 mb-1 mt-2 px-0.5">Clocked Out</div>
                  <div className="staff-card bg-white rounded border border-gray-100 shadow-sm p-1.5 opacity-70">
                    <div className="flex items-center">
                      <span className="text-xs font-medium text-gray-600">Emma S.</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        {/* Ticket Section - Only show if ticketRatio > 0 */}
        {details.ticketRatio > 0 && (
          <div className="h-full flex flex-col border-r border-gray-200 overflow-hidden" style={{ width: `${details.ticketRatio}%` }}>
            {/* Ticket Header */}
            <div className="flex items-center justify-between bg-[#FFF8E6] px-2 py-1.5 border-b border-[#F59E0B]/20">
              <div className="flex items-center">
                <FileText size={14} className="text-amber-500 mr-1.5" />
                <span className="text-xs font-medium text-amber-500">Tickets</span>
              </div>
              {/* Tab/Column toggle based on ticketMode */}
              {details.ticketMode === 'tab' ? (
                <div className="flex text-[10px] bg-amber-500/10 rounded-sm overflow-hidden">
                  <div className="px-1.5 py-0.5 bg-amber-500 text-white">Waiting</div>
                  <div className="px-1.5 py-0.5 text-amber-500">In Service</div>
                </div>
              ) : (
                <div className="text-[10px] text-amber-500 font-medium">Waitlist + In Service</div>
              )}
            </div>
            {/* Ticket Content */}
            <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5">
              {/* Waiting Section */}
              <div className="text-[10px] font-medium text-gray-500 mb-1 px-0.5">Waiting</div>
              <div className="ticket-card bg-white rounded border border-gray-100 shadow-sm p-1.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-gray-800">John D.</div>
                    <div className="text-[9px] text-gray-500">Haircut + Color</div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] text-gray-500">5m</span>
                    {template === 'frontDeskTicketCenter' && (
                      <span className="text-[9px] text-blue-500 bg-blue-500/10 px-1 rounded">Assign</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="ticket-card bg-white rounded border border-gray-100 shadow-sm p-1.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-gray-800">Lisa M.</div>
                    <div className="text-[9px] text-gray-500">Blowout</div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] text-gray-500">12m</span>
                    {template === 'frontDeskTicketCenter' && (
                      <span className="text-[9px] text-blue-500 bg-blue-500/10 px-1 rounded">Assign</span>
                    )}
                  </div>
                </div>
              </div>
              {/* In Service Section */}
              <div className="text-[10px] font-medium text-gray-500 mb-1 mt-2 px-0.5">In Service</div>
              <div className="ticket-card bg-white rounded border border-gray-100 shadow-sm p-1.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-gray-800">Emma S.</div>
                    <div className="text-[9px] text-gray-500">Full Color</div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] text-gray-500">15m</span>
                    <span className="text-[9px] text-amber-600">Mike R.</span>
                  </div>
                </div>
              </div>
              <div className="ticket-card bg-white rounded border border-gray-100 shadow-sm p-1.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-gray-800">David K.</div>
                    <div className="text-[9px] text-gray-500">Haircut</div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] text-gray-500">8m</span>
                    <span className="text-[9px] text-amber-600">Emma S.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Appointments Rail - Only show if showAppointments is true */}
        {details.showAppointments && (
          <div className="absolute bottom-0 left-0 right-0 bg-[#8E44AD]/10 px-2 py-1.5 border-t border-[#8E44AD]/20 flex items-center">
            <Clock size={14} className="text-[#8E44AD] mr-1.5" />
            <span className="text-xs font-medium text-[#8E44AD]">Upcoming Appointments</span>
            <div className="ml-auto flex space-x-1.5">
              <div className="w-2 h-2 rounded-full bg-[#8E44AD]/40"></div>
              <div className="w-2 h-2 rounded-full bg-[#8E44AD]"></div>
              <div className="w-2 h-2 rounded-full bg-[#8E44AD]/40"></div>
            </div>
          </div>
        )}
        {/* Quick Actions for Team In/Out - Only for teamInOut template */}
        {template === 'teamInOut' && (
          <div className="absolute bottom-4 right-4 flex space-x-2">
            <div className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center border border-gray-200">
              <FileText size={14} className="text-gray-600" />
            </div>
            <div className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center border border-gray-200">
              <Clock size={14} className="text-gray-600" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
