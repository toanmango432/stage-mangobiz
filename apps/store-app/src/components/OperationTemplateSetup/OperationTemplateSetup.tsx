import React from 'react';
import { X, ArrowLeft, Layers, ArrowRight, CheckCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
// BUG-010 FIX: Import FocusTrap for accessibility
import FocusTrap from 'focus-trap-react';
// Types and constants
import type { OperationTemplateSetupProps } from './types';
import type { FrontDeskSettingsData } from '../frontdesk-settings/FrontDeskSettings';
import { TEMPLATE_SETUP_STYLES } from './constants';
// Extracted components
import { QuestionsSection, TemplateCard } from './components';
// Extracted hook
import { useOperationTemplateSetup } from './hooks';

export const OperationTemplateSetup: React.FC<OperationTemplateSetupProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSettingsChange
}) => {
  const {
    // State
    settings,
    hasChanges,
    quickAnswers,
    showToast,
    expandedSettings,
    isMobile,
    currentTemplateIndex,
    templates,
    // Refs
    suggestedTemplateRef,
    question1Ref,
    question2Ref,
    question3Ref,
    // Methods
    getSuggestedTemplate,
    getTemplateDetails,
    applyTemplate,
    updateQuickAnswer,
    saveSettings,
    toggleExpandSettings,
    navigateTemplate,
  } = useOperationTemplateSetup({
    currentSettings,
    onSettingsChange,
    onClose
  });

  if (!isOpen) return null;

  // Render the Toast component
  const Toast = () => {
    if (!showToast) return null;
    return createPortal(
      <div className="template-setup-toast fixed bottom-6 right-6 z-[2000] animate-slideInUp">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 flex items-center max-w-md">
          <div className="bg-emerald-500/10 text-emerald-500 p-2 rounded-full mr-3">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="font-medium text-gray-800">Template applied</p>
            <p className="text-sm text-gray-600">
              You can fine-tune in Team, Ticket, Workflow, and Layout sections.
            </p>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // BUG-010 FIX: Wrap modal in FocusTrap for accessibility and keyboard navigation
  return (
    <FocusTrap active={isOpen}>
      <div className="template-setup fixed inset-0 z-[1060] bg-white overflow-hidden flex flex-col">
        <style>{TEMPLATE_SETUP_STYLES}</style>

        {/* Header */}
        <header className="template-setup-header px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10 bg-white shadow-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900 flex items-center">
              <div className="bg-emerald-500 text-white p-1.5 rounded-lg mr-3 shadow-sm">
                <Layers size={20} />
              </div>
              Who Uses This Screen?
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Tell us who will primarily use this screen, and we'll set up the perfect layout.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close template setup"
          >
            <X size={24} />
          </button>
        </header>

        {/* Main Content */}
        <main className="template-setup-main flex-1 overflow-y-auto apple-scroll">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 md:py-6">
            {/* Questions Section - Simplified user-type focused flow */}
            <QuestionsSection
              quickAnswers={quickAnswers}
              updateQuickAnswer={updateQuickAnswer}
              getSuggestedTemplate={getSuggestedTemplate}
              getTemplateDetails={getTemplateDetails}
              question1Ref={question1Ref}
              question2Ref={question2Ref}
              question3Ref={question3Ref}
            />

            {/* Template Grid - Keeping this section unchanged */}
            <section className="template-setup-templates mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 px-1 flex justify-between items-center">
                <span>Choose a template</span>
                {isMobile && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigateTemplate('prev')}
                      className="p-1.5 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200"
                      aria-label="Previous template"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <button
                      onClick={() => navigateTemplate('next')}
                      className="p-1.5 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200"
                      aria-label="Next template"
                    >
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </h2>

              {/* Desktop Grid */}
              {!isMobile ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {templates.map(template => {
                    const details = getTemplateDetails(template);
                    const isSuggested = getSuggestedTemplate() === template;
                    const isSelected = settings.operationTemplate === template;
                    return (
                      <TemplateCard
                        key={template}
                        template={template}
                        details={details}
                        isSuggested={isSuggested}
                        isSelected={isSelected}
                        isExpanded={expandedSettings === template}
                        onToggleSettings={() => toggleExpandSettings(template)}
                        onApply={() => applyTemplate(template as FrontDeskSettingsData['operationTemplate'])}
                        innerRef={isSuggested ? suggestedTemplateRef : undefined}
                      />
                    );
                  })}
                </div>
              ) : (
                // Mobile Swipeable Card - Same structure as desktop but with navigation
                <div>
                  {templates.map((template, index) => {
                    const details = getTemplateDetails(template);
                    const isSuggested = getSuggestedTemplate() === template;
                    const isSelected = settings.operationTemplate === template;
                    if (index !== currentTemplateIndex) return null;
                    return (
                      <TemplateCard
                        key={template}
                        template={template}
                        details={details}
                        isSuggested={isSuggested}
                        isSelected={isSelected}
                        isExpanded={expandedSettings === template}
                        onToggleSettings={() => toggleExpandSettings(template)}
                        onApply={() => applyTemplate(template as FrontDeskSettingsData['operationTemplate'])}
                      />
                    );
                  })}
                  {/* Mobile swipe indicators */}
                  <div className="swipe-indicator">
                    {templates.map((_, index) => (
                      <div
                        key={index}
                        className={index === currentTemplateIndex ? 'active' : ''}
                      />
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        </main>

        {/* Footer */}
        <footer className="template-setup-footer px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-white sticky bottom-0 shadow-md">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500/30 transition-colors shadow-sm"
          >
            <div className="flex items-center">
              <ArrowLeft size={16} className="mr-2" />
              Back to Settings
            </div>
          </button>
          <button
            onClick={saveSettings}
            className={`px-6 py-2.5 rounded-full text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500/30 transition-colors shadow-sm ${
              hasChanges
                ? 'bg-emerald-500 hover:bg-[#059669]'
                : 'bg-emerald-500/60 cursor-not-allowed'
            }`}
            disabled={!hasChanges}
          >
            Save & Continue
          </button>
        </footer>

        {/* Toast Notification */}
        <Toast />
      </div>
    </FocusTrap>
  );
};
