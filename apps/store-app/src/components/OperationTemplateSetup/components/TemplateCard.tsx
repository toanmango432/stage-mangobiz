import React from 'react';
import { Check, ArrowRight, CheckCircle } from 'lucide-react';
import type { TemplateDetails } from '../types';
import { TemplatePreview } from './TemplatePreview';
import { TemplateSettings } from './TemplateSettings';

interface TemplateCardProps {
  template: string;
  details: TemplateDetails;
  isSuggested: boolean;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleSettings: () => void;
  onApply: () => void;
  innerRef?: React.RefObject<HTMLDivElement>;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  details,
  isSuggested,
  isSelected,
  isExpanded,
  onToggleSettings,
  onApply,
  innerRef,
}) => {
  return (
    <div
      ref={innerRef}
      className={`template-card border-2 rounded-xl overflow-hidden relative ${isSuggested ? 'suggested' : 'border-gray-200'} ${isSelected ? 'selected' : ''}`}
    >
      {isSuggested && (
        <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-medium py-1 px-2.5 rounded-full shadow-sm z-10">
          Suggested for You
        </div>
      )}
      {isSelected && (
        <div className="absolute top-3 right-3 text-emerald-500 z-10">
          <CheckCircle size={20} />
        </div>
      )}
      {/* Enhanced Template Preview */}
      <TemplatePreview template={template} details={details} />
      {/* Template Info */}
      <div className="p-4 bg-white">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-base font-semibold text-gray-800">{details.title}</h3>
            <span className="text-xs text-gray-500">{details.subtitle}</span>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              details.userType === 'Front Desk Staff' ? 'bg-blue-500/10 text-blue-500' : 'bg-[#8E44AD]/10 text-[#8E44AD]'
            }`}
          >
            {details.userType}
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-2">{details.description}</p>
        <p className="text-xs text-gray-500 mb-4 flex items-center">
          <Check size={12} className="text-emerald-500 mr-1" />
          Best for: {details.bestFor}
        </p>
        {/* Pre-Config Settings (Collapsible) */}
        <TemplateSettings
          template={template}
          details={details}
          isExpanded={isExpanded}
          onToggle={onToggleSettings}
        />
        {/* Template Actions */}
        <div className="flex justify-between items-center">
          <button
            onClick={onApply}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isSelected ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isSelected ? 'Selected' : 'Select Template'}
          </button>
          {isSelected && (
            <button
              className="text-gray-500 hover:text-gray-700 text-sm flex items-center"
              onClick={onApply}
            >
              <ArrowRight size={14} className="mr-1" />
              <span>Reset Defaults</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
