import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { X, Settings, Users, Layers, FileText, Workflow, ArrowRight, LayoutGrid, Download, Upload, RotateCcw } from 'lucide-react';
import { useAppDispatch } from '../../store/hooks';
import FocusTrap from 'focus-trap-react';
import { OperationTemplateSetup } from '../OperationTemplateSetup';
import {
  FrontDeskSettingsProps,
  FrontDeskSettingsData
} from './types';
import { AccordionSection } from './components';
import {
  OperationTemplatesSection,
  TeamSection,
  TicketSection,
  WorkflowRulesSection,
  LayoutSection
} from './sections';
import {
  selectFrontDeskSettings,
  selectHasUnsavedChanges,
  updateSetting as updateSettingAction,
  updateSettings,
  saveSettings,
  discardChanges,
  resetSettings
} from '../../store/slices/frontDeskSettingsSlice';
// BUG-011 FIX: Import error boundary for graceful error handling
import { SectionErrorBoundary } from '../frontdesk/SectionErrorBoundary';
// BUG-016 FIX: Import toast for save feedback (using react-hot-toast which is already in App.tsx)
import toast from 'react-hot-toast';

// FEAT-003: Settings export schema version
const SETTINGS_EXPORT_VERSION = 1;

// FEAT-003: Validate imported settings structure
const validateImportedSettings = (data: unknown): data is { version: number; settings: FrontDeskSettingsData } => {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  if (typeof obj.version !== 'number') return false;
  if (!obj.settings || typeof obj.settings !== 'object') return false;
  // Validate required keys exist
  const requiredKeys = ['operationTemplate', 'displayMode', 'viewWidth', 'sortBy'];
  return requiredKeys.every(key => key in (obj.settings as object));
};

export const FrontDeskSettings: React.FC<FrontDeskSettingsProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSettingsChange
}) => {
  // Redux state - use useAppDispatch for async thunk support
  const dispatch = useAppDispatch();
  const settings = useSelector(selectFrontDeskSettings);
  const hasChanges = useSelector(selectHasUnsavedChanges);

  // Local UI state
  const [activeSection, setActiveSection] = useState<string>('operationTemplates');
  const previousActiveElement = useRef<Element | null>(null);

  // State for operation template setup
  const [showTemplateSetup, setShowTemplateSetup] = useState(false);

  // FEAT-003: State for import confirmation dialog
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<FrontDeskSettingsData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // FEAT-013: State for reset confirmation dialog
  const [showResetConfirm, setShowResetConfirm] = useState(false);

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

  // Handle setting changes
  const updateSetting = <K extends keyof FrontDeskSettingsData>(
    key: K,
    value: FrontDeskSettingsData[K]
  ) => {
    dispatch(updateSettingAction({ key, value }));
  };

  // Handle save
  const handleSave = () => {
    dispatch(saveSettings());
    // Also call the onSettingsChange callback for backward compatibility
    onSettingsChange(settings);
    // BUG-016 FIX: Show toast feedback on successful save
    toast.success('Settings saved successfully');
    onClose();
  };

  // Handle cancel
  const handleCancel = () => {
    if (hasChanges) {
      dispatch(discardChanges());
    }
    onClose();
  };

  // Handle operation templates click
  const handleOperationTemplatesClick = () => {
    setShowTemplateSetup(true);
  };

  // FEAT-003: Export settings to JSON file
  const handleExport = useCallback(() => {
    const exportData = {
      version: SETTINGS_EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      settings: settings,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `frontdesk-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Settings exported successfully');
  }, [settings]);

  // FEAT-003: Handle file selection for import
  const handleImportFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!validateImportedSettings(data)) {
          toast.error('Invalid settings file format');
          return;
        }
        // Show confirmation dialog before applying
        setPendingImportData(data.settings);
        setShowImportConfirm(true);
      } catch {
        toast.error('Failed to parse settings file');
      }
    };
    reader.readAsText(file);

    // Reset file input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // FEAT-003: Confirm and apply imported settings
  const handleImportConfirm = useCallback(() => {
    if (pendingImportData) {
      dispatch(updateSettings(pendingImportData));
      toast.success('Settings imported successfully');
    }
    setPendingImportData(null);
    setShowImportConfirm(false);
  }, [dispatch, pendingImportData]);

  // FEAT-003: Cancel import
  const handleImportCancel = useCallback(() => {
    setPendingImportData(null);
    setShowImportConfirm(false);
  }, []);

  // FEAT-013: Handle reset to defaults with confirmation
  const handleResetClick = useCallback(() => {
    setShowResetConfirm(true);
  }, []);

  // FEAT-013: Confirm reset
  const handleResetConfirm = useCallback(() => {
    dispatch(resetSettings());
    setShowResetConfirm(false);
    toast.success('Settings reset to defaults');
  }, [dispatch]);

  // FEAT-013: Cancel reset
  const handleResetCancel = useCallback(() => {
    setShowResetConfirm(false);
  }, []);

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
              {/* BUG-011 FIX: Wrap each section in error boundary for graceful error handling */}
              {/* 1. Operation Templates */}
              <AccordionSection
                title="Operation Templates"
                icon={<Layers />}
                isOpen={openAccordions.operationTemplates}
                onToggle={() => toggleAccordion('operationTemplates')}
              >
                <SectionErrorBoundary sectionName="Operation Templates">
                  <OperationTemplatesSection
                    settings={settings}
                    updateSetting={updateSetting}
                    onChangeTemplate={handleOperationTemplatesClick}
                    isCompact={true}
                  />
                </SectionErrorBoundary>
              </AccordionSection>

              {/* 2. Team Section */}
              <AccordionSection
                title="Team Section"
                icon={<Users />}
                isOpen={openAccordions.teamSection}
                onToggle={() => toggleAccordion('teamSection')}
              >
                <SectionErrorBoundary sectionName="Team Section">
                  <TeamSection
                    settings={settings}
                    updateSetting={updateSetting}
                    isCompact={true}
                  />
                </SectionErrorBoundary>
              </AccordionSection>

              {/* 3. Ticket Section */}
              <AccordionSection
                title="Ticket Section"
                icon={<FileText />}
                isOpen={openAccordions.ticketSection}
                onToggle={() => toggleAccordion('ticketSection')}
              >
                <SectionErrorBoundary sectionName="Ticket Section">
                  <TicketSection
                    settings={settings}
                    updateSetting={updateSetting}
                    isCompact={true}
                  />
                </SectionErrorBoundary>
              </AccordionSection>

              {/* 4. Workflow & Rules */}
              <AccordionSection
                title="Workflow & Rules"
                icon={<Workflow />}
                isOpen={openAccordions.workflowRules}
                onToggle={() => toggleAccordion('workflowRules')}
              >
                <SectionErrorBoundary sectionName="Workflow & Rules">
                  <WorkflowRulesSection
                    settings={settings}
                    updateSetting={updateSetting}
                    isCompact={true}
                  />
                </SectionErrorBoundary>
              </AccordionSection>

              {/* 5. Layout Section */}
              <AccordionSection
                title="Layout Section"
                icon={<LayoutGrid />}
                isOpen={openAccordions.layoutSection}
                onToggle={() => toggleAccordion('layoutSection')}
              >
                <SectionErrorBoundary sectionName="Layout Section">
                  <LayoutSection
                    settings={settings}
                    updateSetting={updateSetting}
                    isCompact={true}
                  />
                </SectionErrorBoundary>
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
                  {/* BUG-011 FIX: Wrap each section in error boundary for graceful error handling */}
                  {/* 1. Operation Templates */}
                  {activeSection === 'operationTemplates' && (
                    <SectionErrorBoundary sectionName="Operation Templates">
                      <OperationTemplatesSection
                        settings={settings}
                        updateSetting={updateSetting}
                        onChangeTemplate={handleOperationTemplatesClick}
                      />
                    </SectionErrorBoundary>
                  )}

                  {/* 2. Team Section */}
                  {activeSection === 'teamSection' && (
                    <SectionErrorBoundary sectionName="Team Section">
                      <TeamSection
                        settings={settings}
                        updateSetting={updateSetting}
                      />
                    </SectionErrorBoundary>
                  )}

                  {/* 3. Ticket Section */}
                  {activeSection === 'ticketSection' && (
                    <SectionErrorBoundary sectionName="Ticket Section">
                      <TicketSection
                        settings={settings}
                        updateSetting={updateSetting}
                      />
                    </SectionErrorBoundary>
                  )}

                  {/* 4. Workflow & Rules */}
                  {activeSection === 'workflowRules' && (
                    <SectionErrorBoundary sectionName="Workflow & Rules">
                      <WorkflowRulesSection
                        settings={settings}
                        updateSetting={updateSetting}
                      />
                    </SectionErrorBoundary>
                  )}

                  {/* 5. Layout Section */}
                  {activeSection === 'layoutSection' && (
                    <SectionErrorBoundary sectionName="Layout Section">
                      <LayoutSection
                        settings={settings}
                        updateSetting={updateSetting}
                      />
                    </SectionErrorBoundary>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-5 py-3.5 border-t border-gray-100 flex justify-between items-center bg-white">
            {/* Left side: Reset, Export, Import */}
            <div className="flex items-center space-x-2">
              {/* FEAT-013: Reset to Defaults */}
              <button
                onClick={handleResetClick}
                className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                title="Reset to default settings"
              >
                <RotateCcw size={14} className="mr-1.5" />
                Reset
              </button>

              {/* FEAT-003: Export */}
              <button
                onClick={handleExport}
                className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                title="Export settings to file"
              >
                <Download size={14} className="mr-1.5" />
                Export
              </button>

              {/* FEAT-003: Import */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                title="Import settings from file"
              >
                <Upload size={14} className="mr-1.5" />
                Import
              </button>

              {/* Hidden file input for import */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFileSelect}
                className="hidden"
              />

              {/* Unsaved changes indicator */}
              {hasChanges && (
                <span className="flex items-center text-xs text-amber-600 ml-2">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5"></span>
                  Unsaved
                </span>
              )}
            </div>

            {/* Right side: Cancel and Save */}
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
          currentSettings={settings}
          onSettingsChange={(newSettings) => {
            // Update each setting via Redux
            Object.entries(newSettings).forEach(([key, value]) => {
              updateSetting(key as keyof FrontDeskSettingsData, value);
            });
            // Note: Don't close modal here - let OperationTemplateSetup handle it with toast
          }}
        />
      )}

      {/* FEAT-003: Import Confirmation Dialog */}
      {showImportConfirm && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={handleImportCancel} />
          <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-md mx-4 animate-slideIn">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Import Settings?</h3>
            <p className="text-sm text-gray-600 mb-6">
              This will replace your current settings with the imported configuration. Any unsaved changes will be lost.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleImportCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImportConfirm}
                className="px-4 py-2 text-sm font-medium bg-[#27AE60] text-white hover:bg-[#219653] rounded-lg transition-colors"
              >
                Import
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* FEAT-013: Reset Confirmation Dialog */}
      {showResetConfirm && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={handleResetCancel} />
          <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-md mx-4 animate-slideIn">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Reset to Defaults?</h3>
            <p className="text-sm text-gray-600 mb-6">
              This will reset all settings to their default values. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleResetCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetConfirm}
                className="px-4 py-2 text-sm font-medium bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

// Re-export types and constants for backward compatibility
export type { FrontDeskSettingsData, FrontDeskSettingsProps } from './types';
export { defaultFrontDeskSettings } from './constants';