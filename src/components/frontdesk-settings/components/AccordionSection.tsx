import React, { cloneElement } from 'react';
import { ChevronDown } from 'lucide-react';
import { AccordionSectionProps } from '../types';

// Section Component for Mobile/Compact View
export const AccordionSection: React.FC<AccordionSectionProps> = ({
  title,
  icon,
  isOpen,
  onToggle,
  children
}) => (
  <div className="bg-white rounded-xl overflow-hidden mb-3 shadow-sm border border-gray-100">
    <button
      className="w-full px-4 py-3 flex justify-between items-center bg-white text-left"
      onClick={onToggle}
      aria-expanded={isOpen}
    >
      <div className="flex items-center">
        <div className="w-7 h-7 rounded-full bg-[#27AE60]/10 flex items-center justify-center mr-2.5">
          {cloneElement(icon as React.ReactElement, {
            size: 15,
            className: 'text-[#27AE60]'
          })}
        </div>
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      <div className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
        <ChevronDown size={18} />
      </div>
    </button>
    {isOpen && (
      <div className="px-4 pb-4 pt-1 border-t border-gray-100">
        {children}
      </div>
    )}
  </div>
);