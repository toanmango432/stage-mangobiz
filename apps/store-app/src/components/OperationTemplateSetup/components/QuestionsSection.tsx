import React from 'react';
import { FileText, Users, CheckCircle, ArrowRight } from 'lucide-react';
import type { QuickAnswers, TemplateDetails } from '../types';

interface QuestionsSectionProps {
  quickAnswers: QuickAnswers;
  updateQuickAnswer: (key: keyof QuickAnswers, value: QuickAnswers[keyof QuickAnswers]) => void;
  getSuggestedTemplate: () => string;
  getTemplateDetails: (template: string) => TemplateDetails | undefined;
  question1Ref: React.RefObject<HTMLDivElement | null>;
  question2Ref: React.RefObject<HTMLDivElement | null>;
  question3Ref: React.RefObject<HTMLDivElement | null>;
}

export const QuestionsSection: React.FC<QuestionsSectionProps> = ({
  quickAnswers,
  updateQuickAnswer,
  getSuggestedTemplate,
  getTemplateDetails,
  question1Ref,
  question2Ref,
  question3Ref,
}) => {
  // Silence unused ref warning - ref is passed but may not be used in current implementation
  void question3Ref;

  return (
    <section className="template-setup-questions mb-6 max-w-3xl mx-auto">
      <div className="space-y-3">
        {/* Main Question: Who will use this screen? */}
        <div ref={question1Ref} className={`question-card rounded-xl p-4 bg-white shadow-sm border ${quickAnswers.primaryFocus ? 'border-emerald-500/30' : 'border-gray-100'}`}>
          <div className="flex items-center mb-3">
            <div className="step-indicator w-6 h-6 text-xs flex-shrink-0">
              1
            </div>
            <div className="ml-2 flex-grow">
              <h3 className="text-base font-medium text-gray-800">
                Who will use this screen most?
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                This determines the layout focus - team cards or tickets
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button className={`answer-option flex flex-col items-center p-4 rounded-lg text-center ${quickAnswers.primaryFocus === 'frontDesk' ? 'selected bg-blue-500/5 border-blue-500 border-2' : 'bg-gray-50 hover:bg-gray-100'}`} onClick={() => updateQuickAnswer('primaryFocus', 'frontDesk')}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${quickAnswers.primaryFocus === 'frontDesk' ? 'bg-blue-500/10' : 'bg-gray-200'}`}>
                <FileText size={24} className={quickAnswers.primaryFocus === 'frontDesk' ? 'text-blue-500' : 'text-gray-500'} />
              </div>
              <span className={`font-medium ${quickAnswers.primaryFocus === 'frontDesk' ? 'text-blue-500' : 'text-gray-700'}`}>Front Desk Staff</span>
              <span className="text-xs text-gray-500 mt-1">Receptionist manages tickets</span>
            </button>
            <button className={`answer-option flex flex-col items-center p-4 rounded-lg text-center ${quickAnswers.primaryFocus === 'staff' ? 'selected bg-[#8E44AD]/5 border-[#8E44AD] border-2' : 'bg-gray-50 hover:bg-gray-100'}`} onClick={() => updateQuickAnswer('primaryFocus', 'staff')}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${quickAnswers.primaryFocus === 'staff' ? 'bg-[#8E44AD]/10' : 'bg-gray-200'}`}>
                <Users size={24} className={quickAnswers.primaryFocus === 'staff' ? 'text-[#8E44AD]' : 'text-gray-500'} />
              </div>
              <span className={`font-medium ${quickAnswers.primaryFocus === 'staff' ? 'text-[#8E44AD]' : 'text-gray-700'}`}>Service Providers</span>
              <span className="text-xs text-gray-500 mt-1">Stylists manage their clients</span>
            </button>
          </div>
        </div>

        {/* Question 2: Workflow Style - Only show after Q1 is answered */}
        {quickAnswers.primaryFocus && (
          <div ref={question2Ref} className={`question-card rounded-xl p-4 bg-white shadow-sm border ${quickAnswers.operationStyle ? 'border-emerald-500/30' : 'border-gray-100'}`}>
            <div className="flex items-center mb-3">
              <div className="step-indicator w-6 h-6 text-xs flex-shrink-0">
                2
              </div>
              <div className="ml-2 flex-grow">
                <h3 className="text-base font-medium text-gray-800">
                  {quickAnswers.primaryFocus === 'frontDesk' ? 'How should tickets be displayed?' : 'How do providers work with clients?'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {quickAnswers.primaryFocus === 'frontDesk' ? 'Choose your preferred ticket/team balance' : 'Select the workflow that matches your salon'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button className={`answer-option flex flex-col p-3 rounded-lg ${quickAnswers.operationStyle === 'flow' ? 'selected bg-emerald-500/5 border-emerald-500 border-2' : 'bg-gray-50 hover:bg-gray-100'}`} onClick={() => updateQuickAnswer('operationStyle', 'flow')}>
                <span className={`font-medium ${quickAnswers.operationStyle === 'flow' ? 'text-emerald-500' : 'text-gray-700'}`}>
                  {quickAnswers.primaryFocus === 'frontDesk' ? 'Balanced View' : 'Full Service Flow'}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  {quickAnswers.primaryFocus === 'frontDesk' ? 'See team status alongside tickets' : 'Track waiting → in-service → checkout'}
                </span>
              </button>
              <button className={`answer-option flex flex-col p-3 rounded-lg ${quickAnswers.operationStyle === 'inOut' ? 'selected bg-emerald-500/5 border-emerald-500 border-2' : 'bg-gray-50 hover:bg-gray-100'}`} onClick={() => updateQuickAnswer('operationStyle', 'inOut')}>
                <span className={`font-medium ${quickAnswers.operationStyle === 'inOut' ? 'text-emerald-500' : 'text-gray-700'}`}>
                  {quickAnswers.primaryFocus === 'frontDesk' ? 'Ticket-First' : 'Quick In/Out'}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  {quickAnswers.primaryFocus === 'frontDesk' ? 'Maximize ticket board space' : 'Simple clock in/out & checkout'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Suggested Template Banner - Show after both questions answered */}
        {quickAnswers.primaryFocus && quickAnswers.operationStyle && (
          <div className="rounded-xl p-4 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle size={20} className="text-emerald-500 mr-3" />
                <div>
                  <span className="text-sm text-gray-600">Based on your answers, we recommend:</span>
                  <div className="font-semibold text-gray-800">
                    {getTemplateDetails(getSuggestedTemplate())?.title}
                    <span className="text-gray-500 font-normal ml-2">
                      ({getTemplateDetails(getSuggestedTemplate())?.subtitle})
                    </span>
                  </div>
                </div>
              </div>
              <ArrowRight size={20} className="text-emerald-500" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
