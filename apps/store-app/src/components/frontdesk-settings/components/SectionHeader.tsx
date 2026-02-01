import React, { cloneElement } from 'react';
import { SectionHeaderProps } from '../types';

// Section Header Component
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  icon
}) => (
  <div className="flex items-center mb-3">
    <div className="w-8 h-8 rounded-full bg-[#27AE60]/10 flex items-center justify-center mr-2.5">
      {cloneElement(icon as React.ReactElement<{size?: number; className?: string}>, {
        size: 16,
        className: 'text-[#27AE60]'
      })}
    </div>
    <h3 className="text-base font-semibold text-gray-900">{title}</h3>
  </div>
);