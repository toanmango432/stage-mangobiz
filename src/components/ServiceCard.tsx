import React from 'react';
import { Clock, Calendar, Tag, User, CheckCircle, MoreVertical, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
interface ServiceCardProps {
  service: {
    id: number;
    number: number;
    clientName: string;
    clientType: string;
    service: string;
    time: string;
    duration: string;
    assignedTo?: {
      id: number;
      name: string;
      color: string;
    };
    technician?: string;
    techColor?: string;
  };
  viewMode?: 'normal' | 'compact' | 'ultra-compact';
  onComplete?: (e: React.MouseEvent) => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
  onViewDetails?: (e: React.MouseEvent) => void;
}
export function ServiceCard({
  service,
  viewMode = 'normal',
  onComplete,
  onEdit,
  onDelete,
  onViewDetails
}: ServiceCardProps) {
  // Get the technician name and color from either the assignedTo or direct properties
  const techName = service.assignedTo?.name || service.technician || '';
  const techColor = service.assignedTo?.color || service.techColor || '';
  // Generate a slight variation of the base paper color to make each ticket unique
  const paperVariations = ['#FAFAF0', '#F9F7EF', '#FAF9F2', '#F8F7ED', '#FAFBF3'];
  const paperColor = paperVariations[service.id % paperVariations.length];
  // Generate a random texture pattern for each ticket
  const texturePatterns = ["url('https://www.transparenttextures.com/patterns/paper.png')", "url('https://www.transparenttextures.com/patterns/paper-fibers.png')", "url('https://www.transparenttextures.com/patterns/rice-paper.png')", "url('https://www.transparenttextures.com/patterns/soft-paper.png')", "url('https://www.transparenttextures.com/patterns/handmade-paper.png')"];
  const texturePattern = texturePatterns[service.id % texturePatterns.length];
  if (viewMode === 'compact') {
    return <div className="rounded-xl border border-gray-300 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 mb-3 relative overflow-hidden" style={{
      backgroundColor: paperColor,
      backgroundImage: texturePattern,
      backgroundBlendMode: 'multiply',
      boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 2px 2px rgba(0,0,0,0.03), inset 0 0 0 1px rgba(255,255,255,0.2)'
    }}>
        {/* Ticket stub edge with semicircle cut-outs */}
        <div className="absolute top-0 left-0 h-full w-1.5 flex flex-col justify-between items-center pointer-events-none">
          <div className="w-3 h-3 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
          <div className="w-3 h-3 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
          <div className="w-3 h-3 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
        </div>
        {/* Left ink accent */}
        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#1E88E5] opacity-70"></div>
        <div className="flex items-center justify-between p-3 pl-4">
          {/* Left section - Number & Client */}
          <div className="flex items-center">
            <div className="w-7 h-7 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-medium mr-2 shadow-sm border border-gray-800">
              {service.number}
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-800 truncate max-w-[100px]">
                {service.clientName}
              </span>
              <span className="ml-1.5 text-[10px] bg-[#F0F7FF]/70 text-[#1E88E5] px-1 py-0.5 rounded border border-[#1E88E5]/20 font-medium">
                {service.clientType}
              </span>
            </div>
          </div>
          {/* Right section - Actions */}
          <div className="flex items-center">
            <Tippy content="More options">
              <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-50 transition-colors" onClick={e => e.stopPropagation()}>
                <MoreVertical size={12} />
              </button>
            </Tippy>
          </div>
        </div>
        {/* Perforation line */}
        <div className="border-t border-dashed border-gray-300 mx-2 opacity-70"></div>
        {/* Bottom row with time and actions */}
        <div className="p-3 pt-2 flex items-center justify-between">
          <div className="flex items-center text-[10px] text-gray-600">
            <Clock size={10} className="text-[#1E88E5] mr-0.5" />
            <span>{service.time}</span>
            <span className="mx-1 text-gray-400">•</span>
            <span>{service.duration}</span>
          </div>
          <div className="flex items-center">
            {techName && <div className={`text-white text-[10px] font-medium px-2 py-0.5 rounded-full mr-2`} style={{
            backgroundColor: `${techColor || '#1E88E5'}`,
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.2)',
            textShadow: '0px 1px 1px rgba(0,0,0,0.2)'
          }}>
                {techName}
              </div>}
            <button onClick={onComplete} className="border border-[#1E88E5] text-[#1E88E5] text-[10px] font-medium px-2 py-0.5 rounded-full hover:bg-[#1E88E5]/10 transition-colors">
              Done
            </button>
          </div>
        </div>
        {/* IN SERVICE stamp overlay */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-12 opacity-[0.12] pointer-events-none">
          <div className="text-[#1E88E5] font-bold text-lg tracking-wider uppercase" style={{
          letterSpacing: '0.1em',
          textShadow: '0 0 1px rgba(30,136,229,0.2)',
          fontFamily: 'monospace'
        }}>
            IN SERVICE
          </div>
        </div>
      </div>;
  }
  if (viewMode === 'ultra-compact') {
    return <div className="rounded-lg border border-gray-300 hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 mb-2 relative overflow-hidden" style={{
      backgroundColor: paperColor,
      backgroundImage: texturePattern,
      backgroundBlendMode: 'multiply',
      boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 2px 2px rgba(0,0,0,0.03), inset 0 0 0 1px rgba(255,255,255,0.2)'
    }}>
        {/* Ticket stub edge with semicircle cut-outs */}
        <div className="absolute top-0 left-0 h-full w-1 flex flex-col justify-between items-center pointer-events-none">
          <div className="w-2 h-2 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
          <div className="w-2 h-2 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
        </div>
        {/* Left ink accent */}
        <div className="absolute top-0 left-0 w-1 h-full bg-[#1E88E5] opacity-70"></div>
        <div className="flex items-center justify-between p-2 pl-3">
          <div className="flex items-center space-x-1">
            <div className="w-5 h-5 bg-gray-900 text-white rounded-full flex items-center justify-center text-[9px] font-medium shadow-sm border border-gray-800">
              {service.number}
            </div>
            <span className="text-[10px] font-semibold text-gray-800 truncate max-w-[60px]">
              {service.clientName}
            </span>
          </div>
          {techName && <div className={`text-white text-[8px] font-medium px-1.5 py-0.5 rounded-full shadow-sm`} style={{
          backgroundColor: `${techColor || '#1E88E5'}`,
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.2)',
          textShadow: '0px 1px 1px rgba(0,0,0,0.2)'
        }}>
              {techName}
            </div>}
        </div>
      </div>;
  }
  return <div className="rounded-xl border border-gray-300 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 mb-4 relative overflow-hidden h-full" style={{
    backgroundColor: paperColor,
    backgroundImage: texturePattern,
    backgroundBlendMode: 'multiply',
    boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 2px 2px rgba(0,0,0,0.03), inset 0 0 0 1px rgba(255,255,255,0.2)'
  }}>
      {/* Ticket stub edge with semicircle cut-outs */}
      <div className="absolute top-0 left-0 h-full w-2 flex flex-col justify-between items-center pointer-events-none">
        <div className="w-4 h-4 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
        <div className="w-4 h-4 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
        <div className="w-4 h-4 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
        <div className="w-4 h-4 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
        <div className="w-4 h-4 bg-gray-50 rounded-full transform translate-x-[-50%]"></div>
      </div>
      {/* Left ink accent */}
      <div className="absolute top-0 left-0 w-1.5 h-full bg-[#1E88E5] opacity-70"></div>
      {/* Card header with number and client info */}
      <div className="flex justify-between p-4 border-b border-dashed border-gray-300 pl-4">
        <div className="flex items-center">
          <div className="w-9 h-9 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md mr-3 border border-gray-800" style={{
          textShadow: '0px 1px 1px rgba(0,0,0,0.2)'
        }}>
            {service.number}
          </div>
          <div>
            <div className="font-semibold text-gray-800 text-base">
              {service.clientName}
            </div>
            <div className="mt-1 text-xs bg-[#F0F7FF]/70 text-[#1E88E5] font-medium px-2 py-1 rounded-md border border-[#1E88E5]/20">
              {service.clientType}
            </div>
          </div>
        </div>
        <div className="relative">
          <Tippy content="More options">
            <button className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-50 transition-colors" onClick={e => e.stopPropagation()}>
              <MoreVertical size={16} />
            </button>
          </Tippy>
        </div>
      </div>
      {/* Card content */}
      <div className="p-4">
        {/* Time and duration */}
        <div className="flex items-center text-xs text-gray-600 mb-4">
          <div className="flex items-center bg-[#F0F7FF]/60 px-2 py-1 rounded-md border border-[#1E88E5]/20 mr-2" style={{
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)'
        }}>
            <Calendar size={12} className="text-[#1E88E5] mr-1" />
            <span className="font-medium">{service.time}</span>
            <span className="mx-1 text-gray-400">•</span>
            <span className="font-medium">{service.duration}</span>
          </div>
        </div>
        {/* Service information */}
        {service.service && <div className="mt-3 font-medium text-sm text-gray-700 p-3 rounded-md border border-gray-200" style={{
        backgroundColor: 'rgba(250,250,240,0.5)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)'
      }}>
            <div className="flex items-start">
              <Tag size={14} className="text-[#1E88E5] mr-2 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{service.service}</span>
            </div>
          </div>}
      </div>
      {/* Perforation line */}
      <div className="border-t border-dashed border-gray-300 mx-3 opacity-70"></div>
      {/* Card footer */}
      <div className="flex items-center justify-between p-4 mt-auto" style={{
      backgroundColor: 'rgba(248,248,238,0.5)'
    }}>
        {/* Left side - technician */}
        {techName ? <div className={`text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-sm`} style={{
        backgroundColor: `${techColor || '#1E88E5'}`,
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.2)',
        textShadow: '0px 1px 1px rgba(0,0,0,0.2)'
      }}>
            {techName}
          </div> : <div className="bg-gray-100 text-gray-500 text-xs font-medium px-3 py-1.5 rounded-full" style={{
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)'
      }}>
            Unassigned
          </div>}
        {/* Right side - complete button */}
        <button onClick={onComplete} className="text-xs font-medium border border-[#1E88E5] text-[#1E88E5] px-3 py-1.5 rounded-full hover:bg-[#1E88E5]/5 transition-colors flex items-center">
          <CheckCircle size={12} className="mr-1" />
          Complete
        </button>
      </div>
      {/* IN SERVICE stamp overlay */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-12 opacity-[0.12] pointer-events-none">
        <div className="text-[#1E88E5] font-bold text-2xl tracking-wider uppercase" style={{
        letterSpacing: '0.1em',
        textShadow: '0 0 1px rgba(30,136,229,0.2)',
        fontFamily: 'monospace'
      }}>
          IN SERVICE
        </div>
      </div>
    </div>;
}