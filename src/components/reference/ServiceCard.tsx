import React from 'react';
import { Calendar, Clock, MoreVertical, Tag, User, PlusCircle, CheckCircle } from 'lucide-react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

interface ServiceCardProps {
  service: {
    id: number;
    number: number;
    clientName: string;
    clientType: string;
    time: string;
    duration: string;
    service: string;
    technician: string;
    techColor: string;
    isWaiting?: boolean;
  };
  viewMode?: 'normal' | 'compact';
}

export function ServiceCard({
  service,
  viewMode = 'normal'
}: ServiceCardProps) {
  // Enhanced color mappings for more vibrant tech colors
  const techColorMap: Record<string, string> = {
    'bg-[#E5565B]': 'bg-gradient-to-r from-[#FF6B70] to-[#E04146]',
    'bg-[#3F83F8]': 'bg-gradient-to-r from-[#5A9FFF] to-[#3373E8]',
    'bg-[#4CC2A9]': 'bg-gradient-to-r from-[#5EEAD4] to-[#3BB09A]',
    'bg-[#9B5DE5]': 'bg-gradient-to-r from-[#AF6FFF] to-[#8A4AD0]',
    'bg-[#3C78D8]': 'bg-gradient-to-r from-[#4A8EFF] to-[#2A68C8]',
    'bg-white': 'bg-gradient-to-r from-gray-100 to-white text-gray-700'
  };

  // Determine if this is a waiting list item
  const isWaitingItem = service.isWaiting === true;

  // Use teal colors for waiting list items, amber for service items
  const borderColor = isWaitingItem ? 'border-[#00D0E0]/30' : 'border-amber-100';
  const accentColor = isWaitingItem ? 'bg-[#00D0E0]' : 'bg-amber-400';
  const lightAccentColor = isWaitingItem ? 'bg-[#00D0E0]/20 text-[#00A0B0]' : 'bg-amber-100 text-amber-800';
  const accentBorderColor = isWaitingItem ? 'border-[#00D0E0]/30' : 'border-amber-300';
  const iconColor = isWaitingItem ? 'text-[#00A0B0]' : 'text-amber-700';
  const notchColor = isWaitingItem ? 'border-[#00D0E0]/30' : 'border-amber-200';
  const perforationColor = isWaitingItem ? 'bg-[#00D0E0]/30' : 'bg-amber-200';
  const stripGradient = isWaitingItem ? 'bg-gradient-to-b from-[#00D0E0] to-[#00A0B0]' : 'bg-gradient-to-b from-gray-400 to-gray-300';
  const statusBgColor = isWaitingItem ? 'bg-[#5EEAD4]/30 border-[#5EEAD4]/40 text-gray-800' : service.technician ? `${techColorMap[service.techColor] || service.techColor} text-white` : 'bg-gray-200 text-gray-700';

  // Render compact view
  if (viewMode === 'compact') {
    return (
      <div
        className={`bg-[#FFF8E8] rounded-lg border-2 ${borderColor} hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:rotate-[0.2deg] group relative overflow-hidden shadow-md`}
        style={{
          backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")'
        }}
      >
        {/* Perforation marks - top */}
        <div className="absolute top-0 left-0 w-full h-[6px] overflow-hidden flex items-center">
          <div className="w-full flex justify-between px-4">
            {[...Array(20)].map((_, i) => (
              <div key={i} className={`w-1 h-1 ${perforationColor} rounded-full`}></div>
            ))}
          </div>
        </div>

        {/* Left ticket notch */}
        <div className={`absolute -left-2 top-1/2 w-4 h-4 bg-gray-100 rounded-full border-r-2 ${notchColor}`}></div>

        {/* Right ticket notch */}
        <div className={`absolute -right-2 top-1/2 w-4 h-4 bg-gray-100 rounded-full border-l-2 ${notchColor}`}></div>

        {/* Status indicator strip */}
        <div className={`absolute top-0 left-0 w-2 h-full ${stripGradient}`}></div>

        <div className="flex items-center justify-between p-2">
          {/* Top row with number and client type */}
          <div className="flex items-center">
            <div className="bg-gray-800 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md mr-1 transform -rotate-3 ring-1 ring-gray-300">
              {service.number}
            </div>
            <span className={`text-[10px] ${lightAccentColor} px-1.5 py-0.5 rounded-sm border ${accentBorderColor} font-bold uppercase`}>
              {service.clientType}
            </span>
          </div>
          <div className="relative">
            <Tippy content="More options">
              <button className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors">
                <MoreVertical size={14} />
              </button>
            </Tippy>
          </div>
        </div>

        {/* Client name */}
        <div className="px-2 pb-1">
          <div className="flex items-center">
            <User size={12} className={`${iconColor} mr-1 flex-shrink-0`} />
            <span className="text-xs font-bold text-gray-800 truncate font-mono">
              {service.clientName}
            </span>
          </div>
        </div>

        {/* Time and duration */}
        <div className="flex items-center justify-between text-[10px] text-gray-700 px-2 pb-2">
          <div className="flex items-center">
            <Calendar size={10} className={`${iconColor} mr-0.5`} />
            <span className="font-mono">{service.time}</span>
          </div>
          <div className="flex items-center">
            <Clock size={10} className={`${iconColor} mr-0.5`} />
            <span className="font-mono">{service.duration}</span>
          </div>
        </div>

        {/* Service */}
        <div className="px-2 pb-2">
          <div className={`p-1.5 rounded border-l-2 ${accentBorderColor} bg-[#FFF8E8]`}>
            <div className="flex items-center">
              <Tag size={10} className={`${iconColor} mr-1 flex-shrink-0`} />
              <span className="text-[10px] text-gray-800 font-mono truncate font-medium">
                {service.service}
              </span>
            </div>
          </div>
        </div>

        {/* Status/technician */}
        <div className="flex items-center justify-between p-2 border-t border-dashed border-gray-200 bg-[#FFF8E8]">
          {isWaitingItem ? (
            <div
              className={`${statusBgColor} text-[10px] font-bold px-2 py-1 rounded-full border-2 shadow-md`}
              style={{
                clipPath: 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)',
                paddingLeft: '8px',
                paddingRight: '8px'
              }}
            >
              NEXT
            </div>
          ) : service.technician ? (
            <div
              className={`${statusBgColor} text-[10px] font-bold px-2 py-1 rounded-full shadow-md`}
              style={{
                clipPath: 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)',
                paddingLeft: '8px',
                paddingRight: '8px'
              }}
            >
              {service.technician}
            </div>
          ) : (
            <div></div>
          )}

          {/* Action button */}
          {isWaitingItem ? (
            <button
              className="p-1 rounded-full text-[#00A0B0] hover:text-[#008090] hover:bg-[#00D0E0]/20 transition-colors shadow-sm border border-[#00D0E0]/30"
              aria-label="Assign technician"
            >
              <PlusCircle size={14} />
            </button>
          ) : (
            <button
              className="p-1 rounded-full text-green-600 hover:text-green-700 hover:bg-green-100 transition-colors shadow-sm border border-green-200"
              aria-label="Mark as done"
            >
              <CheckCircle size={14} />
            </button>
          )}
        </div>

        {/* Paper texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10 mix-blend-overlay"
          style={{
            backgroundImage: 'url("https://www.transparenttextures.com/patterns/cardboard.png")'
          }}
        ></div>
      </div>
    );
  }

  // Render normal view
  return (
    <div
      className={`bg-[#FFF8E8] rounded-lg border-2 ${borderColor} hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:rotate-[0.2deg] group relative overflow-hidden h-full shadow-md`}
      style={{
        backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")'
      }}
    >
      {/* Perforation marks - top */}
      <div className="absolute top-0 left-0 w-full h-[6px] overflow-hidden flex items-center">
        <div className="w-full flex justify-between px-4">
          {[...Array(20)].map((_, i) => (
            <div key={i} className={`w-1 h-1 ${perforationColor} rounded-full`}></div>
          ))}
        </div>
      </div>

      {/* Left ticket notch */}
      <div className={`absolute -left-2 top-1/3 w-4 h-4 bg-gray-100 rounded-full border-r-2 ${notchColor}`}></div>

      {/* Right ticket notch */}
      <div className={`absolute -right-2 top-1/3 w-4 h-4 bg-gray-100 rounded-full border-l-2 ${notchColor}`}></div>

      {/* Status indicator strip */}
      <div className={`absolute top-0 left-0 w-2 h-full ${stripGradient}`}></div>

      <div className="flex items-center justify-between p-3 border-b border-dashed border-gray-200">
        <div className="flex items-center">
          <div className="bg-gray-800 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg mr-2 transform -rotate-3 ring-2 ring-gray-300">
            {service.number}
          </div>
          <span className={`text-xs ${lightAccentColor} px-2 py-1 rounded-md shadow-sm border ${accentBorderColor} font-bold uppercase`}>
            {service.clientType}
          </span>
        </div>
        <div className="relative">
          <Tippy content="More options">
            <button className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors">
              <MoreVertical size={16} />
            </button>
          </Tippy>
        </div>
      </div>

      <div className="p-3">
        {/* Client information */}
        <div className="flex items-center mb-2">
          <User size={16} className={`${iconColor} mr-2 flex-shrink-0`} />
          <span className="font-bold text-gray-800 truncate font-mono">
            {service.clientName}
          </span>
        </div>

        {/* Time and duration */}
        <div className="flex items-center justify-between text-xs text-gray-700 mb-3">
          <div className="flex items-center bg-[#FFF8E8] px-2 py-1 rounded-md shadow-sm border border-gray-200">
            <Calendar size={12} className={`${iconColor} mr-1`} />
            <span className="font-mono">{service.time}</span>
          </div>
          <div className="flex items-center bg-[#FFF8E8] px-2 py-1 rounded-md shadow-sm border border-gray-200">
            <Clock size={12} className={`${iconColor} mr-1`} />
            <span className="font-mono">{service.duration}</span>
          </div>
        </div>

        {/* Service information */}
        <div className={`mt-2 p-3 rounded-md border-l-2 ${accentBorderColor} shadow-sm`}>
          <div className="flex items-start">
            <Tag size={14} className={`${iconColor} mr-2 mt-0.5 flex-shrink-0`} />
            <span className="text-sm text-gray-800 font-mono line-clamp-2">
              {service.service}
            </span>
          </div>
        </div>
      </div>

      {/* Card footer */}
      <div className="flex items-center justify-between border-t border-dashed border-gray-200 p-3 bg-[#FFF8E8] mt-auto">
        {/* Status or technician */}
        {isWaitingItem ? (
          <div
            className={`${statusBgColor} text-xs font-bold px-3 py-1.5 rounded-full border-2 shadow-md`}
            style={{
              clipPath: 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)',
              paddingLeft: '12px',
              paddingRight: '12px'
            }}
          >
            NEXT AVAILABLE
          </div>
        ) : service.technician ? (
          <div
            className={`${statusBgColor} text-xs font-bold px-3 py-1.5 rounded-full shadow-md`}
            style={{
              clipPath: 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)',
              paddingLeft: '12px',
              paddingRight: '12px'
            }}
          >
            {service.technician}
          </div>
        ) : (
          <div></div>
        )}

        {/* Action button */}
        {isWaitingItem ? (
          <button
            className="p-1.5 rounded-full text-[#00A0B0] hover:text-[#008090] hover:bg-[#00D0E0]/20 transition-colors shadow-sm border border-[#00D0E0]/30"
            aria-label="Assign technician"
          >
            <PlusCircle size={18} />
          </button>
        ) : (
          <button
            className="p-1.5 rounded-full text-green-600 hover:text-green-700 hover:bg-green-100 transition-colors shadow-sm border border-green-200"
            aria-label="Mark as done"
          >
            <CheckCircle size={18} />
          </button>
        )}
      </div>

      {/* Paper texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10 mix-blend-overlay"
        style={{
          backgroundImage: 'url("https://www.transparenttextures.com/patterns/cardboard.png")'
        }}
      ></div>
    </div>
  );
}
