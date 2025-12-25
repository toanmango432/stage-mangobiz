import React from 'react';
import { Users, FileText, Check } from 'lucide-react';
import { TemplateCardProps } from '../types';

// Template Card Component
export const TemplateCard: React.FC<TemplateCardProps> = ({
  title,
  description,
  isSelected,
  onSelect,
  layoutRatio
}) => (
  <div
    className={`border rounded-xl p-4 transition-all ${
      isSelected
        ? 'border-[#27AE60] bg-[#27AE60]/5 shadow-md'
        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
    }`}
  >
    {/* Template Preview */}
    <div className="h-28 mb-3 bg-gray-50 rounded-lg overflow-hidden flex border border-gray-100">
      <div
        className="h-full bg-[#E8F2FF]"
        style={{ width: `${layoutRatio.team}%` }}
      >
        <div className="h-full flex flex-col justify-center items-center">
          <Users size={18} className="text-blue-500 mb-1.5" />
          <div className="text-xs text-blue-500 font-medium">
            {layoutRatio.team}%
          </div>
        </div>
      </div>
      <div
        className="h-full bg-[#FFF8E6]"
        style={{ width: `${layoutRatio.ticket}%` }}
      >
        <div className="h-full flex flex-col justify-center items-center">
          <FileText size={18} className="text-amber-500 mb-1.5" />
          <div className="text-xs text-amber-500 font-medium">
            {layoutRatio.ticket}%
          </div>
        </div>
      </div>
    </div>

    <h4 className="text-sm font-semibold text-gray-800 mb-1">{title}</h4>
    <p className="text-xs text-gray-500 mb-3 h-10 line-clamp-2">
      {description}
    </p>

    <div className="flex justify-between items-center">
      <button
        onClick={onSelect}
        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
          isSelected
            ? 'bg-[#27AE60] text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
        aria-label={`Select ${title} template`}
      >
        {isSelected ? 'Selected' : 'Select'}
      </button>

      {isSelected && (
        <div className="flex items-center text-[#27AE60]">
          <Check size={14} className="mr-1" />
          <span className="text-xs font-medium">Current</span>
        </div>
      )}
    </div>
  </div>
);