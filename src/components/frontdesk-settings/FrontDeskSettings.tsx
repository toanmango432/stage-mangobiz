import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Settings, Users, Layout, Layers, FileText, Workflow, ArrowRight, LayoutGrid, ChevronDown } from 'lucide-react';
import FocusTrap from 'focus-trap-react';
import { OperationTemplateSetup } from '../OperationTemplateSetup';
import {
  FrontDeskSettingsProps,
  FrontDeskSettingsData
} from './types';
import { defaultFrontDeskSettings } from './constants';
import { AccordionSection } from './components';
import {
  OperationTemplatesSection,
  TeamSection,
  TicketSection,
  WorkflowRulesSection,
  LayoutSection
} from './sections';

export const FrontDeskSettings: React.FC<FrontDeskSettingsProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSettingsChange
}) => {
  const [settings, setSettings] = useState<FrontDeskSettingsData>(currentSettings);
  const [activeSection, setActiveSection] = useState<string>('operationTemplates');
  const [hasChanges, setHasChanges] = useState(false);
  const previousActiveElement = useRef<Element | null>(null);

  // State for operation template setup
  const [showTemplateSetup, setShowTemplateSetup] = useState(false);

  // Mobile view state
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    operationTemplates: true,
    teamSection: false,
    ticketSection: false,
    workflowRules: false,
    layoutSection: false
  });

  // Detect screen size
  const isUltraCompact = typeof window !== 'undefined' && window.innerWidth < 480;
  const isCompact = typeof window !== 'undefined' && window.innerWidth < 768;

  // Toggle accordion section
  const toggleAccordion = (section: string) => {
    setOpenAccordions(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Update local state when props change
  useEffect(() => {
    setSettings(currentSettings);
    setHasChanges(false);
  }, [currentSettings]);

  // Handle setting changes
  const updateSetting = <K extends keyof FrontDeskSettingsData>(
    key: K,
    value: FrontDeskSettingsData[K]
  ) => {
    const newSettings = {
      ...settings,
      [key]: value
    };

    // Handle dependencies
    if (key === 'inServiceActive' && value === true && !newSettings.waitListActive) {
      // Auto-enable Wait List if In Service is enabled
      newSettings.waitListActive = true;
    }

    setSettings(newSettings);
    setHasChanges(true);
  };

  // Handle save
  const handleSave = () => {
    onSettingsChange(settings);
    setHasChanges(false);
  };

  // Handle cancel
  const handleCancel = () => {
    setSettings(currentSettings);
    setHasChanges(false);
    onClose();
  };

  // Handle operation templates click
  const handleOperationTemplatesClick = () => {
    setShowTemplateSetup(true);
  };

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        if (showTemplateSetup) {
          setShowTemplateSetup(false);
        } else {
          handleCancel();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showTemplateSetup]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
    } else if (previousActiveElement.current instanceof HTMLElement) {
      previousActiveElement.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const settingsContent = (
    <FocusTrap active={isOpen && !showTemplateSetup}>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center animate-fadeIn"
        onClick={handleCancel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="front-desk-settings-title"
        aria-describedby="front-desk-settings-description"
      >
        <div className="absolute inset-0 bg-black/30" aria-hidden="true" />

        <style>
          {`
            @keyframes slideInRight {
              from { opacity: 0; transform: translateX(100%); }
              to { opacity: 1; transform: translateX(0); }
            }
            @keyframes slideIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            .animate-slideInRight {
              animation: slideInRight 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            .animate-slideIn {
              animation: slideIn 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            .animate-fadeIn {
              animation: fadeIn 250ms ease-in-out forwards;
            }
            .apple-scroll::-webkit-scrollbar {
              width: 8px;
              height: 8px;
            }
            .apple-scroll::-webkit-scrollbar-track {
              background: transparent;
            }
            .apple-scroll::-webkit-scrollbar-thumb {
              background: rgba(0, 0, 0, 0.1);
              border-radius: 8px;
            }
            .apple-scroll::-webkit-scrollbar-thumb:hover {
              background: rgba(0, 0, 0, 0.2);
            }
            .apple-scroll {
              scrollbar-width: thin;
              scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
            }
          `}
        </style>

        <div
          className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col animate-slideInRight relative"
          style={{
            width: isUltraCompact ? '95vw' : isCompact ? '90vw' : '800px',
            height: isCompact ? '85vh' : '700px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10 bg-white">
            <h2 id="front-desk-settings-title" className="text-lg font-semibold text-gray-900 flex items-center">
              <div className="bg-[#27AE60] text-white p-1.5 rounded-lg mr-3 shadow-sm">
                <Settings size={18} />
              </div>
              Front Desk Settings
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close settings panel"
            >
              <X size={20} />
            </button>
          </div>

          {/* Mobile/Compact View - Accordion Style */}
          {isCompact ? (
            <div className="flex-1 overflow-y-auto p-4 apple-scroll bg-gray-50">
              {/* 1. Operation Templates */}
              <AccordionSection
                title="Operation Templates"
                icon={<Layers />}
                isOpen={openAccordions.operationTemplates}
                onToggle={() => toggleAccordion('operationTemplates')}
              >
                <OperationTemplatesSection
                  settings={settings}
                  updateSetting={updateSetting}
                  onChangeTemplate={handleOperationTemplatesClick}
                  isCompact={true}
                />
              </AccordionSection>

              {/* 2. Team Section */}
              <AccordionSection
                title="Team Section"
                icon={<Users />}
                isOpen={openAccordions.teamSection}
                onToggle={() => toggleAccordion('teamSection')}
              >
                <TeamSection
                  settings={settings}
                  updateSetting={updateSetting}
                  isCompact={true}
                />
              </AccordionSection>

              {/* 3. Ticket Section */}
              <AccordionSection
                title="Ticket Section"
                icon={<FileText />}
                isOpen={openAccordions.ticketSection}
                onToggle={() => toggleAccordion('ticketSection')}
              >
                <TicketSection
                  settings={settings}
                  updateSetting={updateSetting}
                  isCompact={true}
                />
              </AccordionSection>

              {/* 4. Workflow & Rules */}
              <AccordionSection
                title="Workflow & Rules"
                icon={<Workflow />}
                isOpen={openAccordions.workflowRules}
                onToggle={() => toggleAccordion('workflowRules')}
              >
                <WorkflowRulesSection
                  settings={settings}
                  updateSetting={updateSetting}
                  isCompact={true}
                />
              </AccordionSection>

              {/* 5. Layout Section */}
              <AccordionSection
                title="Layout Section"
                icon={<LayoutGrid />}
                isOpen={openAccordions.layoutSection}
                onToggle={() => toggleAccordion('layoutSection')}
              >
                <LayoutSection
                  settings={settings}
                  updateSetting={updateSetting}
                  isCompact={true}
                />
              </AccordionSection>
            </div>
          ) : (
            /* Desktop View */
            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar Navigation */}
              <div className="w-44 bg-gray-50 border-r border-gray-100 overflow-y-auto apple-scroll">
                <nav className="p-3 space-y-0.5">
                  {[
                    {
                      id: 'operationTemplates',
                      label: 'Operation Templates',
                      icon: <Layers size={15} />,
                      onClick: () => setActiveSection('operationTemplates')
                    },
                    {
                      id: 'teamSection',
                      label: 'Team Section',
                      icon: <Users size={15} />,
                      onClick: () => setActiveSection('teamSection')
                    },
                    {
                      id: 'ticketSection',
                      label: 'Ticket Section',
                      icon: <FileText size={15} />,
                      onClick: () => setActiveSection('ticketSection')
                    },
                    {
                      id: 'workflowRules',
                      label: 'Workflow & Rules',
                      icon: <Workflow size={15} />,
                      onClick: () => setActiveSection('workflowRules')
                    },
                    {
                      id: 'layoutSection',
                      label: 'Layout Section',
                      icon: <LayoutGrid size={15} />,
                      onClick: () => setActiveSection('layoutSection')
                    }
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={item.onClick}
                      className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                        activeSection === item.id
                          ? 'bg-white text-[#27AE60] font-medium shadow-sm border border-gray-100'
                          : 'text-gray-700 hover:bg-white/60 hover:text-gray-900'
                      }`}
                    >
                      <span className="mr-2">{item.icon}</span>
                      {item.label}
                      {activeSection === item.id && (
                        <ArrowRight size={14} className="ml-auto text-[#27AE60]" />
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto apple-scroll bg-white" style={{ height: '610px' }}>
                <div className="p-5">
                  {/* 1. Operation Templates */}
                  {activeSection === 'operationTemplates' && (
                    <OperationTemplatesSection
                      settings={settings}
                      updateSetting={updateSetting}
                      onChangeTemplate={handleOperationTemplatesClick}
                    />
                  )}

                  {/* 2. Team Section */}
                  {activeSection === 'teamSection' && (
                    <TeamSection
                      settings={settings}
                      updateSetting={updateSetting}
                    />
                  )}

                  {/* 3. Ticket Section */}
                  {activeSection === 'ticketSection' && (
                    <TicketSection
                      settings={settings}
                      updateSetting={updateSetting}
                    />
                  )}

                  {/* 4. Workflow & Rules */}
                  {activeSection === 'workflowRules' && (
                    <WorkflowRulesSection
                      settings={settings}
                      updateSetting={updateSetting}
                    />
                  )}

                  {/* 5. Layout Section */}
                  {activeSection === 'layoutSection' && (
                    <LayoutSection
                      settings={settings}
                      updateSetting={updateSetting}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-5 py-3.5 border-t border-gray-100 flex justify-between items-center bg-white">
            <div className="text-sm text-gray-600" id="front-desk-settings-description">
              {hasChanges && (
                <span className="flex items-center text-amber-600">
                  <span className="w-2 h-2 bg-amber-600 rounded-full mr-2"></span>
                  Unsaved changes
                </span>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  hasChanges
                    ? 'bg-[#27AE60] text-white hover:bg-[#219653]'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </FocusTrap>
  );

  // Render the main settings or template setup
  return (
    <>
      {createPortal(settingsContent, document.body)}

      {/* Operation Template Setup Modal */}
      {showTemplateSetup && (
        <OperationTemplateSetup
          isOpen={showTemplateSetup}
          onClose={() => setShowTemplateSetup(false)}
          currentTemplate={settings.operationTemplate}
          onTemplateChange={(template) => {
            updateSetting('operationTemplate', template);
            setShowTemplateSetup(false);
          }}
        />
      )}
    </>
  );
};

// Re-export types and constants for backward compatibility
export type { FrontDeskSettingsData, FrontDeskSettingsProps } from './types';
export { defaultFrontDeskSettings } from './constants';