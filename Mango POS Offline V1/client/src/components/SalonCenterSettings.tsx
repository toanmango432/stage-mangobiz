import React, { useEffect, useState, useRef, cloneElement, Component } from 'react';
import { createPortal } from 'react-dom';
import { X, Settings, Users, Layout, Eye, Sliders, ArrowRight, CheckCircle2, Circle, ChevronDown, Info, LayoutDashboard, ListFilter, Clock, FileText, Columns, Workflow, Check, Layers, PlusCircle, StickyNote, Edit, CreditCard, Percent, Gift, PlayCircle, DollarSign, Trash2, Lock, AlertCircle, LayoutGrid } from 'lucide-react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import FocusTrap from 'focus-trap-react';
import { OperationTemplateSetup } from './OperationTemplateSetup';
// Types for all settings
export interface SalonCenterSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: SalonCenterSettingsData;
  onSettingsChange: (settings: Partial<SalonCenterSettingsData>) => void;
}
export interface SalonCenterSettingsData {
  // Operation Template
  operationTemplate: 'frontDeskBalanced' | 'frontDeskTicketCenter' | 'teamWithOperationFlow' | 'teamInOut';
  // Team Settings
  organizeBy: 'clockedStatus' | 'busyStatus';
  showTurnCount: boolean;
  showNextAppointment: boolean;
  showServicedAmount: boolean;
  showTicketCount: boolean;
  showLastDone: boolean;
  showMoreOptionsButton: boolean;
  viewWidth: 'ultraCompact' | 'compact' | 'wide' | 'fullScreen' | 'custom';
  customWidthPercentage: number;
  // Ticket Settings
  displayMode: 'column' | 'tab';
  viewStyle: 'expanded' | 'compact';
  showWaitList: boolean;
  showInService: boolean;
  showPending: boolean;
  closedTicketsPlacement: 'floating' | 'bottom' | 'hidden';
  sortBy: 'queue' | 'time';
  combineSections: boolean;
  // Workflow & Rules
  showComingAppointments: boolean;
  comingAppointmentsDefaultState: 'expanded' | 'collapsed';
  enableDragAndDrop: boolean;
  autoCloseAfterCheckout: boolean;
  autoNoShowCancel: boolean;
  autoNoShowTime: number;
  alertPendingTime: boolean;
  pendingAlertMinutes: number;
  // UI Controls - Team
  showAddTicketAction: boolean;
  showAddNoteAction: boolean;
  showEditTeamAction: boolean;
  showQuickCheckoutAction: boolean;
  // UI Controls - Ticket
  showApplyDiscountAction: boolean;
  showRedeemBenefitsAction: boolean;
  showTicketNoteAction: boolean;
  showStartServiceAction: boolean;
  showPendingPaymentAction: boolean;
  showDeleteTicketAction: boolean;
  // Workflow Activation
  waitListActive: boolean;
  inServiceActive: boolean;
}
// Default settings
export const defaultSalonCenterSettings: SalonCenterSettingsData = {
  // Operation Template
  operationTemplate: 'frontDeskBalanced',
  // Team Settings
  organizeBy: 'busyStatus',
  showTurnCount: true,
  showNextAppointment: true,
  showServicedAmount: true,
  showTicketCount: true,
  showLastDone: true,
  showMoreOptionsButton: true,
  viewWidth: 'wide',
  customWidthPercentage: 40,
  // Ticket Settings
  displayMode: 'column',
  viewStyle: 'expanded',
  showWaitList: true,
  showInService: true,
  showPending: true,
  closedTicketsPlacement: 'floating',
  sortBy: 'queue',
  combineSections: false,
  // Workflow & Rules
  showComingAppointments: true,
  comingAppointmentsDefaultState: 'expanded',
  enableDragAndDrop: true,
  autoCloseAfterCheckout: false,
  autoNoShowCancel: false,
  autoNoShowTime: 30,
  alertPendingTime: false,
  pendingAlertMinutes: 15,
  // UI Controls - Team
  showAddTicketAction: true,
  showAddNoteAction: true,
  showEditTeamAction: true,
  showQuickCheckoutAction: true,
  // UI Controls - Ticket
  showApplyDiscountAction: true,
  showRedeemBenefitsAction: true,
  showTicketNoteAction: true,
  showStartServiceAction: true,
  showPendingPaymentAction: true,
  showDeleteTicketAction: true,
  // Workflow Activation
  waitListActive: true,
  inServiceActive: true
};
// Apple-style Toggle Switch Component
const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false
}) => <div className="group flex items-start justify-between py-2 w-full">
    <div className="flex flex-col pr-3">
      <span className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-800'}`}>
        {label}
      </span>
      {description && <span className="text-xs text-gray-500 mt-0.5 max-w-[90%] leading-tight">
          {description}
        </span>}
    </div>
    <div className="relative flex-shrink-0">
      <button type="button" role="switch" aria-checked={checked} disabled={disabled} className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring focus-visible:ring-[#27AE60]/30 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${checked ? 'bg-[#27AE60]' : 'bg-gray-200'}`} onClick={() => !disabled && onChange(!checked)}>
        <span className={`pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}>
          <span className={`absolute inset-0 flex h-full w-full items-center justify-center transition-opacity ${checked ? 'opacity-0 duration-100 ease-out' : 'opacity-100 duration-200 ease-in'}`} aria-hidden="true">
            <Circle className="h-3 w-3 text-gray-400" />
          </span>
          <span className={`absolute inset-0 flex h-full w-full items-center justify-center transition-opacity ${checked ? 'opacity-100 duration-200 ease-in' : 'opacity-0 duration-100 ease-out'}`} aria-hidden="true">
            <CheckCircle2 className="h-3 w-3 text-[#27AE60]" />
          </span>
        </span>
      </button>
    </div>
  </div>;
// Segmented Control Component
const SegmentedControl: React.FC<{
  options: {
    value: string;
    label: string;
  }[];
  value: string;
  onChange: (value: string) => void;
  name: string;
  disabled?: boolean;
}> = ({
  options,
  value,
  onChange,
  name,
  disabled = false
}) => <div className="flex p-0.5 bg-gray-100 rounded-lg w-full max-w-md">
    {options.map(option => <button key={option.value} type="button" disabled={disabled} className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all duration-200 ${value === option.value ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} onClick={() => !disabled && onChange(option.value)}>
        {option.label}
      </button>)}
  </div>;
// Section Header Component
const SectionHeader: React.FC<{
  title: string;
  icon: React.ReactNode;
}> = ({
  title,
  icon
}) => <div className="flex items-center mb-3">
    <div className="w-8 h-8 rounded-full bg-[#27AE60]/10 flex items-center justify-center mr-2.5">
      {cloneElement(icon as React.ReactElement, {
      size: 16,
      className: 'text-[#27AE60]'
    })}
    </div>
    <h3 className="text-base font-semibold text-gray-900">{title}</h3>
  </div>;
// Section Component for Mobile/Compact View
const AccordionSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({
  title,
  icon,
  isOpen,
  onToggle,
  children
}) => <div className="bg-white rounded-xl overflow-hidden mb-3 shadow-sm border border-gray-100">
    <button className="w-full px-4 py-3 flex justify-between items-center bg-white text-left" onClick={onToggle} aria-expanded={isOpen}>
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
    {isOpen && <div className="px-4 pb-4 pt-1 border-t border-gray-100">{children}</div>}
  </div>;
// Template Card Component
const TemplateCard: React.FC<{
  id: string;
  title: string;
  description: string;
  isSelected: boolean;
  onSelect: () => void;
  layoutRatio: {
    team: number;
    ticket: number;
  };
}> = ({
  id,
  title,
  description,
  isSelected,
  onSelect,
  layoutRatio
}) => <div className={`border rounded-xl p-4 transition-all ${isSelected ? 'border-[#27AE60] bg-[#27AE60]/5 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}>
    {/* Template Preview */}
    <div className="h-28 mb-3 bg-gray-50 rounded-lg overflow-hidden flex border border-gray-100">
      <div className="h-full bg-[#E8F2FF]" style={{
      width: `${layoutRatio.team}%`
    }}>
        <div className="h-full flex flex-col justify-center items-center">
          <Users size={18} className="text-[#3B82F6] mb-1.5" />
          <div className="text-xs text-[#3B82F6] font-medium">
            {layoutRatio.team}%
          </div>
        </div>
      </div>
      <div className="h-full bg-[#FFF8E6]" style={{
      width: `${layoutRatio.ticket}%`
    }}>
        <div className="h-full flex flex-col justify-center items-center">
          <FileText size={18} className="text-[#F59E0B] mb-1.5" />
          <div className="text-xs text-[#F59E0B] font-medium">
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
      <button onClick={onSelect} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${isSelected ? 'bg-[#27AE60] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
        {isSelected ? 'Selected' : 'Select'}
      </button>
      {isSelected && <div className="flex items-center text-[#27AE60]">
          <Check size={14} className="mr-1" />
          <span className="text-xs font-medium">Current</span>
        </div>}
    </div>
  </div>;
// Get template info
const getTemplateInfo = (template: SalonCenterSettingsData['operationTemplate']) => {
  switch (template) {
    case 'frontDeskBalanced':
      return {
        title: 'Front Desk Balanced',
        description: 'Balanced view of team and tickets with 40/60 ratio',
        layoutRatio: {
          team: 40,
          ticket: 60
        }
      };
    case 'frontDeskTicketCenter':
      return {
        title: 'Front Desk Ticket Center',
        description: 'Ticket-focused view with minimal team display',
        layoutRatio: {
          team: 10,
          ticket: 90
        }
      };
    case 'teamWithOperationFlow':
      return {
        title: 'Team with Operation Flow',
        description: 'Team-focused view with operation flow',
        layoutRatio: {
          team: 80,
          ticket: 20
        }
      };
    case 'teamInOut':
      return {
        title: 'Team In/Out',
        description: 'Full team view focused on clock in/out status',
        layoutRatio: {
          team: 100,
          ticket: 0
        }
      };
    default:
      return {
        title: 'Custom Template',
        description: 'Custom configuration',
        layoutRatio: {
          team: 50,
          ticket: 50
        }
      };
  }
};
export const SalonCenterSettings: React.FC<SalonCenterSettingsProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSettingsChange
}) => {
  const [settings, setSettings] = useState<SalonCenterSettingsData>(currentSettings);
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
  const updateSetting = <K extends keyof SalonCenterSettingsData,>(key: K, value: SalonCenterSettingsData[K]) => {
    const newSettings = {
      ...settings,
      [key]: value
    };
    // Handle dependencies
    if (key === 'inServiceActive' && value === true && !newSettings.waitListActive) {
      // Auto-enable Wait List if In Service is enabled
      newSettings.waitListActive = true;
      // Show toast or alert here if needed
    }
    setSettings(newSettings);
    setHasChanges(true);
  };
  // Apply template presets
  const applyTemplate = (template: SalonCenterSettingsData['operationTemplate']) => {
    let newSettings: Partial<SalonCenterSettingsData> = {
      operationTemplate: template
    };
    // Apply preset values based on template
    switch (template) {
      case 'frontDeskBalanced':
        newSettings = {
          ...newSettings,
          viewWidth: 'wide',
          customWidthPercentage: 40,
          displayMode: 'column',
          combineSections: false,
          showComingAppointments: true,
          organizeBy: 'busyStatus'
        };
        break;
      case 'frontDeskTicketCenter':
        newSettings = {
          ...newSettings,
          viewWidth: 'compact',
          customWidthPercentage: 10,
          displayMode: 'tab',
          combineSections: true,
          showComingAppointments: true,
          organizeBy: 'busyStatus'
        };
        break;
      case 'teamWithOperationFlow':
        newSettings = {
          ...newSettings,
          viewWidth: 'wide',
          customWidthPercentage: 80,
          displayMode: 'column',
          combineSections: false,
          showComingAppointments: true,
          organizeBy: 'busyStatus'
        };
        break;
      case 'teamInOut':
        newSettings = {
          ...newSettings,
          viewWidth: 'fullScreen',
          customWidthPercentage: 100,
          displayMode: 'column',
          combineSections: false,
          showComingAppointments: false,
          organizeBy: 'clockedStatus'
        };
        break;
    }
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
    setHasChanges(true);
  };
  // Save all settings at once
  const saveSettings = () => {
    onSettingsChange(settings);
    setHasChanges(false);
    onClose();
  };
  // Handle escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !showTemplateSetup) {
        onClose();
      }
      // Handle Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && isOpen) {
        e.preventDefault();
        saveSettings();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, saveSettings, showTemplateSetup]);
  // Store active element when opening and prevent body scroll
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      // Return focus to the previously active element when closing
      if (previousActiveElement.current && 'focus' in previousActiveElement.current) {
        ;
        (previousActiveElement.current as HTMLElement).focus();
      }
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  // Get screen size to determine layout
  const [isCompact, setIsCompact] = useState(window.innerWidth < 768);
  const [isUltraCompact, setIsUltraCompact] = useState(window.innerWidth < 480);
  useEffect(() => {
    const handleResize = () => {
      setIsCompact(window.innerWidth < 768);
      setIsUltraCompact(window.innerWidth < 480);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  // Handle template setup navigation
  const handleOperationTemplatesClick = () => {
    setShowTemplateSetup(true);
  };
  const handleTemplateSetupClose = () => {
    setShowTemplateSetup(false);
  };
  if (!isOpen) return null;
  // Render the template setup if it's open
  if (showTemplateSetup) {
    return <OperationTemplateSetup isOpen={showTemplateSetup} onClose={handleTemplateSetupClose} currentSettings={settings} onSettingsChange={newSettings => {
      setSettings(prev => ({
        ...prev,
        ...newSettings
      }));
      setHasChanges(true);
      setShowTemplateSetup(false);
    }} />;
  }
  // Get current template info
  const templateInfo = getTemplateInfo(settings.operationTemplate);
  const modalContent = <FocusTrap>
      <div className="fixed inset-0 z-[1050] overflow-hidden bg-black/40 backdrop-blur-[2px] flex items-center justify-center" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="salon-center-settings-title">
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
            .animate-slideInRight {
              animation: slideInRight 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            .animate-slideIn {
              animation: slideIn 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
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
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            .animate-fadeIn {
              animation: fadeIn 250ms ease-in-out forwards;
            }
          `}
        </style>
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col animate-slideInRight relative" style={{
        width: isUltraCompact ? '95vw' : isCompact ? '90vw' : '800px',
        height: isCompact ? '85vh' : '700px'
      }} onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10 bg-white">
            <h2 id="salon-center-settings-title" className="text-lg font-semibold text-gray-900 flex items-center">
              <div className="bg-[#27AE60] text-white p-1.5 rounded-lg mr-3 shadow-sm">
                <Settings size={18} />
              </div>
              Salon Center Settings
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors" aria-label="Close settings panel">
              <X size={20} />
            </button>
          </div>
          {/* Mobile/Compact View - Accordion Style */}
          {isCompact ? <div className="flex-1 overflow-y-auto p-4 apple-scroll bg-gray-50">
              {/* 1. Operation Templates */}
              <AccordionSection title="Operation Templates" icon={<Layers />} isOpen={openAccordions.operationTemplates} onToggle={() => toggleAccordion('operationTemplates')}>
                <div className="space-y-5 animate-slideIn">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm">
                    {/* Current Template Preview */}
                    <div className="mb-3.5">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Current Template
                      </h4>
                      <div className="bg-white rounded-lg border border-gray-200 p-3.5">
                        <div className="h-20 mb-3 bg-gray-50 rounded-lg overflow-hidden flex border border-gray-100">
                          <div className="h-full bg-[#E8F2FF]" style={{
                        width: `${templateInfo.layoutRatio.team}%`
                      }}>
                            <div className="h-full flex flex-col justify-center items-center">
                              <Users size={16} className="text-[#3B82F6] mb-1" />
                              <div className="text-xs text-[#3B82F6] font-medium">
                                {templateInfo.layoutRatio.team}%
                              </div>
                            </div>
                          </div>
                          <div className="h-full bg-[#FFF8E6]" style={{
                        width: `${templateInfo.layoutRatio.ticket}%`
                      }}>
                            <div className="h-full flex flex-col justify-center items-center">
                              <FileText size={16} className="text-[#F59E0B] mb-1" />
                              <div className="text-xs text-[#F59E0B] font-medium">
                                {templateInfo.layoutRatio.ticket}%
                              </div>
                            </div>
                          </div>
                        </div>
                        <h5 className="text-sm font-medium text-gray-800">
                          {templateInfo.title}
                        </h5>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {templateInfo.description}
                        </p>
                        <button onClick={handleOperationTemplatesClick} className="mt-3 w-full px-3 py-2 bg-[#27AE60] text-white text-sm font-medium rounded-lg flex items-center justify-center hover:bg-[#219653] transition-colors">
                          <Layers size={16} className="mr-2" />
                          Change Template
                        </button>
                      </div>
                    </div>
                    {/* Reset to Template Defaults */}
                    <div className="pt-2.5 border-t border-gray-200">
                      <button className="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700 rounded-lg flex items-center justify-center transition-colors" onClick={() => applyTemplate(settings.operationTemplate)}>
                        <ArrowRight size={16} className="mr-2" />
                        Reset to Template Defaults
                      </button>
                    </div>
                  </div>
                </div>
              </AccordionSection>
              {/* 2. Team Section */}
              <AccordionSection title="Team Section" icon={<Users />} isOpen={openAccordions.teamSection} onToggle={() => toggleAccordion('teamSection')}>
                <div className="space-y-5 animate-slideIn">
                  {/* A. Display Options */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">
                      Display Options
                    </h4>
                    <div className="space-y-4 bg-gray-50 p-3.5 rounded-xl">
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Organize Team By
                        </label>
                        <SegmentedControl options={[{
                      value: 'busyStatus',
                      label: 'Ready/Busy'
                    }, {
                      value: 'clockedStatus',
                      label: 'Clocked In/Out'
                    }]} value={settings.organizeBy} onChange={value => updateSetting('organizeBy', value as 'clockedStatus' | 'busyStatus')} name="organizeBy" />
                      </div>
                      {settings.organizeBy === 'busyStatus' && <div className="space-y-3 pt-3 border-t border-gray-200">
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Staff View Mode
                          </label>
                          <SegmentedControl options={[{
                      value: 'column',
                      label: 'Column'
                    }, {
                      value: 'tab',
                      label: 'Tab'
                    }]} value={settings.displayMode} onChange={value => updateSetting('displayMode', value as 'column' | 'tab')} name="staffViewMode" />
                        </div>}
                    </div>
                  </div>
                  {/* B. Card Data */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">
                      Card Data
                    </h4>
                    <div className="space-y-2 bg-gray-50 p-3.5 rounded-xl">
                      <ToggleSwitch checked={settings.showTurnCount} onChange={checked => updateSetting('showTurnCount', checked)} label="Turn Count" description="Number of turns the staff member has taken" />
                      <ToggleSwitch checked={settings.showNextAppointment} onChange={checked => updateSetting('showNextAppointment', checked)} label="Next Appointment Time" description="Shows upcoming appointment time and details" />
                      <ToggleSwitch checked={settings.showServicedAmount} onChange={checked => updateSetting('showServicedAmount', checked)} label="Serviced Amount" description="Total monetary value of services provided" />
                      <ToggleSwitch checked={settings.showTicketCount} onChange={checked => updateSetting('showTicketCount', checked)} label="Ticket Count" description="Number of tickets serviced" />
                      <ToggleSwitch checked={settings.showLastDone} onChange={checked => updateSetting('showLastDone', checked)} label="Last Done" description="Time of the most recent completed service" />
                      <ToggleSwitch checked={settings.showMoreOptionsButton} onChange={checked => updateSetting('showMoreOptionsButton', checked)} label="More Options Button" description="Button to access additional staff actions" />
                    </div>
                  </div>
                  {/* C. UI Controls */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">
                      UI Controls
                    </h4>
                    <div className="space-y-2 bg-gray-50 p-3.5 rounded-xl">
                      <ToggleSwitch checked={settings.showAddTicketAction} onChange={checked => updateSetting('showAddTicketAction', checked)} label="Add Ticket" description="Allow adding tickets from staff cards" />
                      <ToggleSwitch checked={settings.showAddNoteAction} onChange={checked => updateSetting('showAddNoteAction', checked)} label="Add Note" description="Allow adding notes to staff members" />
                      <ToggleSwitch checked={settings.showEditTeamAction} onChange={checked => updateSetting('showEditTeamAction', checked)} label="Edit Team Member" description="Allow editing team member details" />
                      <ToggleSwitch checked={settings.showQuickCheckoutAction} onChange={checked => updateSetting('showQuickCheckoutAction', checked)} label="Quick Checkout" description="Show quick checkout option on staff cards" />
                    </div>
                  </div>
                </div>
              </AccordionSection>
              {/* 3. Ticket Section */}
              <AccordionSection title="Ticket Section" icon={<FileText />} isOpen={openAccordions.ticketSection} onToggle={() => toggleAccordion('ticketSection')}>
                <div className="space-y-5 animate-slideIn">
                  {/* A. Display Options */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">
                      Display Options
                    </h4>
                    <div className="space-y-4 bg-gray-50 p-3.5 rounded-xl">
                      <div className="space-y-3 mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Display Mode
                        </label>
                        <SegmentedControl options={[{
                      value: 'column',
                      label: 'Column'
                    }, {
                      value: 'tab',
                      label: 'Tab'
                    }]} value={settings.displayMode} onChange={value => updateSetting('displayMode', value as 'column' | 'tab')} name="displayMode" />
                      </div>
                      <div className="space-y-3 pt-3 border-t border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          View Style
                        </label>
                        <SegmentedControl options={[{
                      value: 'expanded',
                      label: 'Expanded'
                    }, {
                      value: 'compact',
                      label: 'Compact'
                    }]} value={settings.viewStyle} onChange={value => updateSetting('viewStyle', value as 'expanded' | 'compact')} name="viewStyle" />
                      </div>
                    </div>
                  </div>
                  {/* B. Section Visibility */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">
                      Section Visibility
                    </h4>
                    <div className="space-y-2.5 bg-gray-50 p-3.5 rounded-xl">
                      <div className="flex items-center justify-between">
                        <Tippy content={!settings.waitListActive ? 'This stage is deactivated in Workflow & Rules' : ''} disabled={settings.waitListActive}>
                          <div className="flex-1">
                            <ToggleSwitch checked={settings.showWaitList} onChange={checked => updateSetting('showWaitList', checked)} label="Wait List" description="Show clients waiting to be serviced" disabled={!settings.waitListActive} />
                          </div>
                        </Tippy>
                        {!settings.waitListActive && <Lock size={16} className="text-gray-400 ml-2" />}
                      </div>
                      <div className="flex items-center justify-between">
                        <Tippy content={!settings.inServiceActive ? 'This stage is deactivated in Workflow & Rules' : ''} disabled={settings.inServiceActive}>
                          <div className="flex-1">
                            <ToggleSwitch checked={settings.showInService} onChange={checked => updateSetting('showInService', checked)} label="In Service" description="Show clients currently being serviced" disabled={!settings.inServiceActive} />
                          </div>
                        </Tippy>
                        {!settings.inServiceActive && <Lock size={16} className="text-gray-400 ml-2" />}
                      </div>
                      <ToggleSwitch checked={settings.showPending} onChange={checked => updateSetting('showPending', checked)} label="Pending" description="Show clients waiting for additional steps" />
                      <div className="pt-3 border-t border-gray-200 mt-2">
                        <h5 className="text-sm font-medium text-gray-700 mb-2.5">
                          Closed Tickets Placement
                        </h5>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input type="radio" name="closedTicketsPlacement" checked={settings.closedTicketsPlacement === 'floating'} onChange={() => updateSetting('closedTicketsPlacement', 'floating')} className="w-4 h-4 text-[#27AE60] border-gray-300 focus:ring-[#27AE60]" />
                            <span className="ml-2 text-sm text-gray-700">
                              Floating Icon
                            </span>
                          </label>
                          <label className="flex items-center">
                            <input type="radio" name="closedTicketsPlacement" checked={settings.closedTicketsPlacement === 'bottom'} onChange={() => updateSetting('closedTicketsPlacement', 'bottom')} className="w-4 h-4 text-[#27AE60] border-gray-300 focus:ring-[#27AE60]" />
                            <span className="ml-2 text-sm text-gray-700">
                              Bottom Section
                            </span>
                          </label>
                          <label className="flex items-center">
                            <input type="radio" name="closedTicketsPlacement" checked={settings.closedTicketsPlacement === 'hidden'} onChange={() => updateSetting('closedTicketsPlacement', 'hidden')} className="w-4 h-4 text-[#27AE60] border-gray-300 focus:ring-[#27AE60]" />
                            <span className="ml-2 text-sm text-gray-700">
                              Hidden
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* C. Sort & Layout */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">
                      Sort & Layout
                    </h4>
                    <div className="space-y-5 bg-gray-50 p-3.5 rounded-xl">
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Sort By
                        </label>
                        <SegmentedControl options={[{
                      value: 'queue',
                      label: 'Queue Position'
                    }, {
                      value: 'time',
                      label: 'Arrival Time'
                    }]} value={settings.sortBy} onChange={value => updateSetting('sortBy', value as 'queue' | 'time')} name="sortBy" />
                      </div>
                      <div className="space-y-2 pt-3 border-t border-gray-200">
                        <ToggleSwitch checked={settings.combineSections} onChange={checked => updateSetting('combineSections', checked)} label="Combine Sections" description="Combine Wait List and In Service into a unified view" />
                      </div>
                    </div>
                  </div>
                  {/* D. UI Controls */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">
                      UI Controls
                    </h4>
                    <div className="space-y-2 bg-gray-50 p-3.5 rounded-xl">
                      <ToggleSwitch checked={settings.showApplyDiscountAction} onChange={checked => updateSetting('showApplyDiscountAction', checked)} label="Apply Discount" description="Allow applying discounts to tickets" />
                      <ToggleSwitch checked={settings.showRedeemBenefitsAction} onChange={checked => updateSetting('showRedeemBenefitsAction', checked)} label="Redeem Benefits" description="Allow redeeming coupons, points, memberships, or packages" />
                      <ToggleSwitch checked={settings.showTicketNoteAction} onChange={checked => updateSetting('showTicketNoteAction', checked)} label="Add Note" description="Allow adding notes to tickets" />
                      <ToggleSwitch checked={settings.showStartServiceAction} onChange={checked => updateSetting('showStartServiceAction', checked)} label="Start Service" description="Show start service action on tickets" />
                      <ToggleSwitch checked={settings.showPendingPaymentAction} onChange={checked => updateSetting('showPendingPaymentAction', checked)} label="Pending Payment" description="Allow marking tickets as pending payment" />
                      <ToggleSwitch checked={settings.showDeleteTicketAction} onChange={checked => updateSetting('showDeleteTicketAction', checked)} label="Delete Ticket" description="Allow deleting tickets" />
                    </div>
                  </div>
                </div>
              </AccordionSection>
              {/* 4. Workflow & Rules */}
              <AccordionSection title="Workflow & Rules" icon={<Workflow />} isOpen={openAccordions.workflowRules} onToggle={() => toggleAccordion('workflowRules')}>
                <div className="space-y-5 animate-slideIn">
                  {/* A. Stage Activation */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">
                      Stage Activation
                    </h4>
                    <div className="space-y-3.5 bg-gray-50 p-3.5 rounded-xl">
                      <div className="flex items-start mb-2.5">
                        <Info size={16} className="text-[#27AE60] mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-xs text-gray-500 leading-tight">
                          Activation controls whether a stage exists in the
                          lifecycle. Visibility is managed in Ticket Section.
                        </p>
                      </div>
                      <ToggleSwitch checked={settings.waitListActive} onChange={checked => updateSetting('waitListActive', checked)} label="Wait List" description="Enable the wait list stage in the ticket lifecycle" />
                      <div className="flex items-center justify-between">
                        <Tippy content={!settings.waitListActive ? 'Wait List must be active to enable In Service' : ''} disabled={settings.waitListActive}>
                          <div className="flex-1">
                            <ToggleSwitch checked={settings.inServiceActive} onChange={checked => updateSetting('inServiceActive', checked)} label="In Service" description="Enable the in-service stage in the ticket lifecycle" disabled={!settings.waitListActive} />
                          </div>
                        </Tippy>
                        {!settings.waitListActive && <AlertCircle size={16} className="text-amber-500 ml-2" />}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <ToggleSwitch checked={true} onChange={() => {}} label="Pending" description="Always active, cannot be deactivated" disabled={true} />
                        </div>
                        <Lock size={16} className="text-gray-400 ml-2" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <ToggleSwitch checked={true} onChange={() => {}} label="Closed" description="Always active, cannot be deactivated" disabled={true} />
                        </div>
                        <Lock size={16} className="text-gray-400 ml-2" />
                      </div>
                    </div>
                  </div>
                  {/* B. Ticket Flow */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">
                      Ticket Flow
                    </h4>
                    <div className="space-y-2.5 bg-gray-50 p-3.5 rounded-xl">
                      <ToggleSwitch checked={settings.enableDragAndDrop} onChange={checked => updateSetting('enableDragAndDrop', checked)} label="Enable Drag & Drop" description="Allow moving tickets between active stages" />
                      <ToggleSwitch checked={settings.autoCloseAfterCheckout} onChange={checked => updateSetting('autoCloseAfterCheckout', checked)} label="Auto-close After Checkout" description="Automatically close tickets after checkout is complete" />
                    </div>
                  </div>
                  {/* C. Appointments */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">
                      Appointments
                    </h4>
                    <div className="space-y-3.5 bg-gray-50 p-3.5 rounded-xl">
                      <ToggleSwitch checked={settings.showComingAppointments} onChange={checked => updateSetting('showComingAppointments', checked)} label="Coming Appointments" description="Display upcoming appointments in the salon center" />
                      {settings.showComingAppointments && <div className="space-y-3 mt-1.5 pt-3 border-t border-gray-200">
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Default State
                          </label>
                          <SegmentedControl options={[{
                      value: 'expanded',
                      label: 'Expanded'
                    }, {
                      value: 'collapsed',
                      label: 'Collapsed'
                    }]} value={settings.comingAppointmentsDefaultState} onChange={value => updateSetting('comingAppointmentsDefaultState', value as 'expanded' | 'collapsed')} name="comingAppointmentsDefaultState" disabled={!settings.showComingAppointments} />
                        </div>}
                    </div>
                  </div>
                  {/* D. Optional Automations */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">
                      Optional Automations
                    </h4>
                    <div className="space-y-3.5 bg-gray-50 p-3.5 rounded-xl">
                      <div className="flex items-start space-x-2 mb-2">
                        <Info size={16} className="text-[#27AE60] mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-gray-500 leading-tight">
                          These options will be available in a future update
                        </p>
                      </div>
                      <div className="space-y-3.5 opacity-60">
                        <div className="flex items-start justify-between">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Auto-cancel No-shows
                            </label>
                            <p className="text-xs text-gray-500">
                              After waiting for set time
                            </p>
                          </div>
                          <div className="flex items-center">
                            <input type="number" min="5" max="120" step="5" value={settings.autoNoShowTime} onChange={e => updateSetting('autoNoShowTime', parseInt(e.target.value) || 30)} disabled={true} className="w-16 h-8 rounded-md border-gray-300 text-sm px-2 focus:ring-[#27AE60] focus:border-[#27AE60] disabled:bg-gray-100 disabled:text-gray-500" />
                            <span className="ml-2 text-sm text-gray-700">
                              min
                            </span>
                          </div>
                        </div>
                        <div className="flex items-start justify-between">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Alert if Ticket Pending
                            </label>
                            <p className="text-xs text-gray-500">
                              Notify if ticket is pending too long
                            </p>
                          </div>
                          <div className="flex items-center">
                            <input type="number" min="1" max="60" step="1" value={settings.pendingAlertMinutes} onChange={e => updateSetting('pendingAlertMinutes', parseInt(e.target.value) || 15)} disabled={true} className="w-16 h-8 rounded-md border-gray-300 text-sm px-2 focus:ring-[#27AE60] focus:border-[#27AE60] disabled:bg-gray-100 disabled:text-gray-500" />
                            <span className="ml-2 text-sm text-gray-700">
                              min
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionSection>
              {/* 5. Layout Section */}
              <AccordionSection title="Layout Section" icon={<LayoutGrid />} isOpen={openAccordions.layoutSection} onToggle={() => toggleAccordion('layoutSection')}>
                <div className="space-y-5 animate-slideIn">
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">
                      Widths & Views
                    </h4>
                    <div className="space-y-5 bg-gray-50 p-3.5 rounded-xl">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2.5">
                          Fixed Widths
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input type="radio" name="viewWidth" checked={settings.viewWidth === 'ultraCompact'} onChange={() => updateSetting('viewWidth', 'ultraCompact')} className="w-4 h-4 text-[#27AE60] border-gray-300 focus:ring-[#27AE60]" />
                            <span className="ml-2 text-sm text-gray-700">
                              Ultra Compact (icons only)
                            </span>
                          </label>
                          <label className="flex items-center">
                            <input type="radio" name="viewWidth" checked={settings.viewWidth === 'compact'} onChange={() => updateSetting('viewWidth', 'compact')} className="w-4 h-4 text-[#27AE60] border-gray-300 focus:ring-[#27AE60]" />
                            <span className="ml-2 text-sm text-gray-700">
                              Compact (names + key details)
                            </span>
                          </label>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-2.5">
                          Responsive Widths
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input type="radio" name="viewWidth" checked={settings.viewWidth === 'wide'} onChange={() => updateSetting('viewWidth', 'wide')} className="w-4 h-4 text-[#27AE60] border-gray-300 focus:ring-[#27AE60]" />
                            <span className="ml-2 text-sm text-gray-700">
                              Wide (40% of screen)
                            </span>
                          </label>
                          <label className="flex items-center">
                            <input type="radio" name="viewWidth" checked={settings.viewWidth === 'fullScreen'} onChange={() => updateSetting('viewWidth', 'fullScreen')} className="w-4 h-4 text-[#27AE60] border-gray-300 focus:ring-[#27AE60]" />
                            <span className="ml-2 text-sm text-gray-700">
                              Full Screen (100%)
                            </span>
                          </label>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-2.5">
                          Custom Width
                        </label>
                        <div className="flex items-center">
                          <input type="radio" name="viewWidth" checked={settings.viewWidth === 'custom'} onChange={() => updateSetting('viewWidth', 'custom')} className="w-4 h-4 text-[#27AE60] border-gray-300 focus:ring-[#27AE60]" />
                          <span className="ml-2 text-sm text-gray-700 mr-3">
                            Custom
                          </span>
                          <div className="flex items-center">
                            <input type="number" min="10" max="80" step="5" value={settings.customWidthPercentage} onChange={e => updateSetting('customWidthPercentage', parseInt(e.target.value) || 40)} disabled={settings.viewWidth !== 'custom'} className="w-16 h-8 rounded-md border-gray-300 text-sm px-2 focus:ring-[#27AE60] focus:border-[#27AE60] disabled:bg-gray-100 disabled:text-gray-500" />
                            <span className="ml-2 text-sm text-gray-700">
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionSection>
            </div> : <div className="flex flex-1 overflow-hidden">
              {/* Sidebar Navigation */}
              <div className="w-44 bg-gray-50 border-r border-gray-100 overflow-y-auto apple-scroll">
                <nav className="p-3 space-y-0.5">
                  {[{
                id: 'operationTemplates',
                label: 'Operation Templates',
                icon: <Layers size={15} />,
                onClick: () => setActiveSection('operationTemplates')
              }, {
                id: 'teamSection',
                label: 'Team Section',
                icon: <Users size={15} />,
                onClick: () => setActiveSection('teamSection')
              }, {
                id: 'ticketSection',
                label: 'Ticket Section',
                icon: <FileText size={15} />,
                onClick: () => setActiveSection('ticketSection')
              }, {
                id: 'workflowRules',
                label: 'Workflow & Rules',
                icon: <Workflow size={15} />,
                onClick: () => setActiveSection('workflowRules')
              }, {
                id: 'layoutSection',
                label: 'Layout Section',
                icon: <LayoutGrid size={15} />,
                onClick: () => setActiveSection('layoutSection')
              }].map(item => <button key={item.id} onClick={item.onClick} className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-all duration-200 ${activeSection === item.id ? 'bg-white text-[#27AE60] font-medium shadow-sm border border-gray-100' : 'text-gray-700 hover:bg-white/60 hover:text-gray-900'}`}>
                      <span className="mr-2">{item.icon}</span>
                      {item.label}
                      {activeSection === item.id && <ArrowRight size={14} className="ml-auto text-[#27AE60]" />}
                    </button>)}
                </nav>
              </div>
              {/* Content Area */}
              <div className="flex-1 overflow-y-auto apple-scroll bg-white" style={{
            height: '610px'
          }}>
                <div className="p-5">
                  {/* 1. Operation Templates */}
                  {activeSection === 'operationTemplates' && <div className="animate-fadeIn">
                      <SectionHeader title="Operation Templates" icon={<Layers />} />
                      {/* Current Template */}
                      <div className="space-y-3">
                        <h4 className="text-base font-medium text-gray-800">
                          Current Template
                        </h4>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm">
                          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                            <div className="h-28 w-full lg:w-1/3 bg-white rounded-lg overflow-hidden flex border border-gray-100">
                              <div className="h-full bg-[#E8F2FF]" style={{
                          width: `${templateInfo.layoutRatio.team}%`
                        }}>
                                <div className="h-full flex flex-col justify-center items-center">
                                  <Users size={18} className="text-[#3B82F6] mb-1.5" />
                                  <div className="text-xs text-[#3B82F6] font-medium">
                                    {templateInfo.layoutRatio.team}%
                                  </div>
                                </div>
                              </div>
                              <div className="h-full bg-[#FFF8E6]" style={{
                          width: `${templateInfo.layoutRatio.ticket}%`
                        }}>
                                <div className="h-full flex flex-col justify-center items-center">
                                  <FileText size={18} className="text-[#F59E0B] mb-1.5" />
                                  <div className="text-xs text-[#F59E0B] font-medium">
                                    {templateInfo.layoutRatio.ticket}%
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="lg:flex-1">
                              <h5 className="text-base font-semibold text-gray-800 mb-1">
                                {templateInfo.title}
                              </h5>
                              <p className="text-sm text-gray-500 mb-3">
                                {templateInfo.description}
                              </p>
                              <button onClick={handleOperationTemplatesClick} className="px-4 py-2 bg-[#27AE60] text-white text-sm font-medium rounded-lg flex items-center justify-center hover:bg-[#219653] transition-colors">
                                <Layers size={16} className="mr-2" />
                                Change Template
                              </button>
                            </div>
                          </div>
                          {/* Reset to Template Defaults */}
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <button className="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700 rounded-lg flex items-center justify-center transition-colors" onClick={() => applyTemplate(settings.operationTemplate)}>
                              <ArrowRight size={16} className="mr-2" />
                              Reset to Template Defaults
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>}
                  {/* 2. Team Section */}
                  {activeSection === 'teamSection' && <div className="animate-fadeIn">
                      <SectionHeader title="Team Section" icon={<Users />} />
                      {/* A. Display Options */}
                      <div className="space-y-3">
                        <h4 className="text-base font-medium text-gray-800">
                          Display Options
                        </h4>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm">
                          <div className="space-y-5">
                            <div className="space-y-3">
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Organize Team By
                              </label>
                              <SegmentedControl options={[{
                          value: 'busyStatus',
                          label: 'Ready/Busy'
                        }, {
                          value: 'clockedStatus',
                          label: 'Clocked In/Out'
                        }]} value={settings.organizeBy} onChange={value => updateSetting('organizeBy', value as 'clockedStatus' | 'busyStatus')} name="organizeBy" />
                            </div>
                            {settings.organizeBy === 'busyStatus' && <div className="space-y-3 pt-4 border-t border-gray-200">
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                  Staff View Mode
                                </label>
                                <SegmentedControl options={[{
                          value: 'column',
                          label: 'Column'
                        }, {
                          value: 'tab',
                          label: 'Tab'
                        }]} value={settings.displayMode} onChange={value => updateSetting('displayMode', value as 'column' | 'tab')} name="staffViewMode" />
                              </div>}
                          </div>
                        </div>
                      </div>
                      {/* B. Card Data */}
                      <div className="space-y-3">
                        <h4 className="text-base font-medium text-gray-800">
                          Card Data
                        </h4>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white rounded-lg p-3 border border-gray-100">
                              <ToggleSwitch checked={settings.showTurnCount} onChange={checked => updateSetting('showTurnCount', checked)} label="Turn Count" description="Number of turns the staff member has taken" />
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-gray-100">
                              <ToggleSwitch checked={settings.showNextAppointment} onChange={checked => updateSetting('showNextAppointment', checked)} label="Next Appointment" description="Shows upcoming appointment time and details" />
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-gray-100">
                              <ToggleSwitch checked={settings.showServicedAmount} onChange={checked => updateSetting('showServicedAmount', checked)} label="Serviced Amount" description="Total monetary value of services provided" />
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-gray-100">
                              <ToggleSwitch checked={settings.showTicketCount} onChange={checked => updateSetting('showTicketCount', checked)} label="Ticket Count" description="Number of tickets serviced" />
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-gray-100">
                              <ToggleSwitch checked={settings.showLastDone} onChange={checked => updateSetting('showLastDone', checked)} label="Last Done" description="Time of the most recent completed service" />
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-gray-100">
                              <ToggleSwitch checked={settings.showMoreOptionsButton} onChange={checked => updateSetting('showMoreOptionsButton', checked)} label="More Options Button" description="Button to access additional staff actions" />
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* C. UI Controls */}
                      <div className="space-y-3">
                        <h4 className="text-base font-medium text-gray-800">
                          UI Controls
                        </h4>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center p-3 bg-white rounded-lg border border-gray-100">
                              <div className="mr-3 p-1.5 bg-gray-50 rounded-full">
                                <PlusCircle size={16} className="text-[#27AE60]" />
                              </div>
                              <div className="flex-1">
                                <ToggleSwitch checked={settings.showAddTicketAction} onChange={checked => updateSetting('showAddTicketAction', checked)} label="Add Ticket" description="Allow adding tickets from staff cards" />
                              </div>
                            </div>
                            <div className="flex items-center p-3 bg-white rounded-lg border border-gray-100">
                              <div className="mr-3 p-1.5 bg-gray-50 rounded-full">
                                <StickyNote size={16} className="text-[#27AE60]" />
                              </div>
                              <div className="flex-1">
                                <ToggleSwitch checked={settings.showAddNoteAction} onChange={checked => updateSetting('showAddNoteAction', checked)} label="Add Note" description="Allow adding notes to staff members" />
                              </div>
                            </div>
                            <div className="flex items-center p-3 bg-white rounded-lg border border-gray-100">
                              <div className="mr-3 p-1.5 bg-gray-50 rounded-full">
                                <Edit size={16} className="text-[#27AE60]" />
                              </div>
                              <div className="flex-1">
                                <ToggleSwitch checked={settings.showEditTeamAction} onChange={checked => updateSetting('showEditTeamAction', checked)} label="Edit Team Member" description="Allow editing team member details" />
                              </div>
                            </div>
                            <div className="flex items-center p-3 bg-white rounded-lg border border-gray-100">
                              <div className="mr-3 p-1.5 bg-gray-50 rounded-full">
                                <CreditCard size={16} className="text-[#27AE60]" />
                              </div>
                              <div className="flex-1">
                                <ToggleSwitch checked={settings.showQuickCheckoutAction} onChange={checked => updateSetting('showQuickCheckoutAction', checked)} label="Quick Checkout" description="Show quick checkout option on staff cards" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>}
                  {/* 3. Ticket Section */}
                  {activeSection === 'ticketSection' && <div className="animate-fadeIn">
                      <SectionHeader title="Ticket Section" icon={<FileText />} />
                      {/* A. Display Options */}
                      <div className="space-y-3">
                        <h4 className="text-base font-medium text-gray-800">
                          Display Options
                        </h4>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm">
                          <div className="space-y-5">
                            <div className="space-y-3">
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Display Mode
                              </label>
                              <SegmentedControl options={[{
                          value: 'column',
                          label: 'Column'
                        }, {
                          value: 'tab',
                          label: 'Tab'
                        }]} value={settings.displayMode} onChange={value => updateSetting('displayMode', value as 'column' | 'tab')} name="displayMode" />
                            </div>
                            <div className="space-y-3 pt-4 border-t border-gray-200">
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                View Style
                              </label>
                              <SegmentedControl options={[{
                          value: 'expanded',
                          label: 'Expanded'
                        }, {
                          value: 'compact',
                          label: 'Compact'
                        }]} value={settings.viewStyle} onChange={value => updateSetting('viewStyle', value as 'expanded' | 'compact')} name="viewStyle" />
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* B. Section Visibility */}
                      <div className="space-y-3">
                        <h4 className="text-base font-medium text-gray-800">
                          Section Visibility
                        </h4>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm">
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              <div className="bg-white rounded-lg border border-gray-100 p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <h5 className="text-sm font-medium text-gray-800">
                                    Wait List
                                  </h5>
                                  {!settings.waitListActive && <Tippy content="This stage is deactivated in Workflow & Rules">
                                      <span>
                                        <Lock size={14} className="text-gray-400" />
                                      </span>
                                    </Tippy>}
                                </div>
                                <ToggleSwitch checked={settings.showWaitList} onChange={checked => updateSetting('showWaitList', checked)} label="Show in UI" description="Display wait list section" disabled={!settings.waitListActive} />
                              </div>
                              <div className="bg-white rounded-lg border border-gray-100 p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <h5 className="text-sm font-medium text-gray-800">
                                    In Service
                                  </h5>
                                  {!settings.inServiceActive && <Tippy content="This stage is deactivated in Workflow & Rules">
                                      <span>
                                        <Lock size={14} className="text-gray-400" />
                                      </span>
                                    </Tippy>}
                                </div>
                                <ToggleSwitch checked={settings.showInService} onChange={checked => updateSetting('showInService', checked)} label="Show in UI" description="Display in-service section" disabled={!settings.inServiceActive} />
                              </div>
                              <div className="bg-white rounded-lg border border-gray-100 p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <h5 className="text-sm font-medium text-gray-800">
                                    Pending
                                  </h5>
                                </div>
                                <ToggleSwitch checked={settings.showPending} onChange={checked => updateSetting('showPending', checked)} label="Show in UI" description="Display pending section" />
                              </div>
                            </div>
                            <div className="pt-3 border-t border-gray-200">
                              <h5 className="text-sm font-medium text-gray-700 mb-2.5">
                                Closed Tickets Placement
                              </h5>
                              <div className="grid grid-cols-3 gap-2">
                                <label className="flex items-center bg-white p-2 rounded-lg border border-gray-100">
                                  <input type="radio" name="closedTicketsPlacement" checked={settings.closedTicketsPlacement === 'floating'} onChange={() => updateSetting('closedTicketsPlacement', 'floating')} className="w-4 h-4 text-[#27AE60] border-gray-300 focus:ring-[#27AE60]" />
                                  <span className="ml-2 text-sm text-gray-700">
                                    Floating Icon
                                  </span>
                                </label>
                                <label className="flex items-center bg-white p-2 rounded-lg border border-gray-100">
                                  <input type="radio" name="closedTicketsPlacement" checked={settings.closedTicketsPlacement === 'bottom'} onChange={() => updateSetting('closedTicketsPlacement', 'bottom')} className="w-4 h-4 text-[#27AE60] border-gray-300 focus:ring-[#27AE60]" />
                                  <span className="ml-2 text-sm text-gray-700">
                                    Bottom Section
                                  </span>
                                </label>
                                <label className="flex items-center bg-white p-2 rounded-lg border border-gray-100">
                                  <input type="radio" name="closedTicketsPlacement" checked={settings.closedTicketsPlacement === 'hidden'} onChange={() => updateSetting('closedTicketsPlacement', 'hidden')} className="w-4 h-4 text-[#27AE60] border-gray-300 focus:ring-[#27AE60]" />
                                  <span className="ml-2 text-sm text-gray-700">
                                    Hidden
                                  </span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* C. Sort & Layout */}
                      <div className="space-y-3">
                        <h4 className="text-base font-medium text-gray-800">
                          Sort & Layout
                        </h4>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm">
                          <div className="space-y-5">
                            <div className="space-y-3">
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Sort By
                              </label>
                              <SegmentedControl options={[{
                          value: 'queue',
                          label: 'Queue Position'
                        }, {
                          value: 'time',
                          label: 'Arrival Time'
                        }]} value={settings.sortBy} onChange={value => updateSetting('sortBy', value as 'queue' | 'time')} name="sortBy" />
                            </div>
                            <div className="space-y-2 pt-3 border-t border-gray-200">
                              <ToggleSwitch checked={settings.combineSections} onChange={checked => updateSetting('combineSections', checked)} label="Combine Sections" description="Combine Wait List and In Service into a unified view" />
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* D. UI Controls */}
                      <div className="space-y-3">
                        <h4 className="text-base font-medium text-gray-800">
                          UI Controls
                        </h4>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center p-3 bg-white rounded-lg border border-gray-100">
                              <div className="mr-3 p-1.5 bg-gray-50 rounded-full">
                                <Percent size={16} className="text-[#27AE60]" />
                              </div>
                              <div className="flex-1">
                                <ToggleSwitch checked={settings.showApplyDiscountAction} onChange={checked => updateSetting('showApplyDiscountAction', checked)} label="Apply Discount" description="Allow applying discounts to tickets" />
                              </div>
                            </div>
                            <div className="flex items-center p-3 bg-white rounded-lg border border-gray-100">
                              <div className="mr-3 p-1.5 bg-gray-50 rounded-full">
                                <Gift size={16} className="text-[#27AE60]" />
                              </div>
                              <div className="flex-1">
                                <ToggleSwitch checked={settings.showRedeemBenefitsAction} onChange={checked => updateSetting('showRedeemBenefitsAction', checked)} label="Redeem Benefits" description="Allow redeeming benefits" />
                              </div>
                            </div>
                            <div className="flex items-center p-3 bg-white rounded-lg border border-gray-100">
                              <div className="mr-3 p-1.5 bg-gray-50 rounded-full">
                                <StickyNote size={16} className="text-[#27AE60]" />
                              </div>
                              <div className="flex-1">
                                <ToggleSwitch checked={settings.showTicketNoteAction} onChange={checked => updateSetting('showTicketNoteAction', checked)} label="Add Note" description="Allow adding notes to tickets" />
                              </div>
                            </div>
                            <div className="flex items-center p-3 bg-white rounded-lg border border-gray-100">
                              <div className="mr-3 p-1.5 bg-gray-50 rounded-full">
                                <PlayCircle size={16} className="text-[#27AE60]" />
                              </div>
                              <div className="flex-1">
                                <ToggleSwitch checked={settings.showStartServiceAction} onChange={checked => updateSetting('showStartServiceAction', checked)} label="Start Service" description="Show start service action on tickets" />
                              </div>
                            </div>
                            <div className="flex items-center p-3 bg-white rounded-lg border border-gray-100">
                              <div className="mr-3 p-1.5 bg-gray-50 rounded-full">
                                <DollarSign size={16} className="text-[#27AE60]" />
                              </div>
                              <div className="flex-1">
                                <ToggleSwitch checked={settings.showPendingPaymentAction} onChange={checked => updateSetting('showPendingPaymentAction', checked)} label="Pending Payment" description="Allow marking tickets as pending payment" />
                              </div>
                            </div>
                            <div className="flex items-center p-3 bg-white rounded-lg border border-gray-100">
                              <div className="mr-3 p-1.5 bg-gray-50 rounded-full">
                                <Trash2 size={16} className="text-[#27AE60]" />
                              </div>
                              <div className="flex-1">
                                <ToggleSwitch checked={settings.showDeleteTicketAction} onChange={checked => updateSetting('showDeleteTicketAction', checked)} label="Delete Ticket" description="Allow deleting tickets" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>}
                  {/* 4. Workflow & Rules */}
                  {activeSection === 'workflowRules' && <div className="animate-fadeIn">
                      <SectionHeader title="Workflow & Rules" icon={<Workflow />} />
                      {/* A. Stage Activation */}
                      <div className="space-y-3">
                        <h4 className="text-base font-medium text-gray-800">
                          Stage Activation
                        </h4>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm">
                          <div className="flex items-start mb-3">
                            <Info size={16} className="text-[#27AE60] mt-0.5 mr-2 flex-shrink-0" />
                            <p className="text-sm text-gray-500 leading-tight">
                              Activation controls whether a stage exists in the
                              lifecycle. Visibility is managed in Ticket
                              Section.
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white rounded-lg border border-gray-100 p-3">
                              <div className="flex items-center justify-between mb-1.5">
                                <h5 className="text-sm font-medium text-gray-800">
                                  Wait List
                                </h5>
                              </div>
                              <ToggleSwitch checked={settings.waitListActive} onChange={checked => updateSetting('waitListActive', checked)} label="Activate Stage" description="Enable the wait list stage in the ticket lifecycle" />
                            </div>
                            <div className="bg-white rounded-lg border border-gray-100 p-3">
                              <div className="flex items-center justify-between mb-1.5">
                                <h5 className="text-sm font-medium text-gray-800">
                                  In Service
                                </h5>
                                {!settings.waitListActive && <Tippy content="Wait List must be active to enable In Service">
                                    <span>
                                      <AlertCircle size={14} className="text-amber-500" />
                                    </span>
                                  </Tippy>}
                              </div>
                              <ToggleSwitch checked={settings.inServiceActive} onChange={checked => updateSetting('inServiceActive', checked)} label="Activate Stage" description="Enable the in-service stage in the ticket lifecycle" disabled={!settings.waitListActive} />
                            </div>
                            <div className="bg-white rounded-lg border border-gray-100 p-3 opacity-75">
                              <div className="flex items-center justify-between mb-1.5">
                                <h5 className="text-sm font-medium text-gray-800">
                                  Pending
                                </h5>
                                <Lock size={14} className="text-gray-400" />
                              </div>
                              <ToggleSwitch checked={true} onChange={() => {}} label="Always Active" description="This stage cannot be deactivated" disabled={true} />
                            </div>
                            <div className="bg-white rounded-lg border border-gray-100 p-3 opacity-75">
                              <div className="flex items-center justify-between mb-1.5">
                                <h5 className="text-sm font-medium text-gray-800">
                                  Closed
                                </h5>
                                <Lock size={14} className="text-gray-400" />
                              </div>
                              <ToggleSwitch checked={true} onChange={() => {}} label="Always Active" description="This stage cannot be deactivated" disabled={true} />
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* B. Ticket Flow */}
                      <div className="space-y-3">
                        <h4 className="text-base font-medium text-gray-800">
                          Ticket Flow
                        </h4>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white rounded-lg border border-gray-100 p-3">
                              <ToggleSwitch checked={settings.enableDragAndDrop} onChange={checked => updateSetting('enableDragAndDrop', checked)} label="Enable Drag & Drop" description="Allow moving tickets between active stages" />
                            </div>
                            <div className="bg-white rounded-lg border border-gray-100 p-3">
                              <ToggleSwitch checked={settings.autoCloseAfterCheckout} onChange={checked => updateSetting('autoCloseAfterCheckout', checked)} label="Auto-close After Checkout" description="Automatically close tickets after checkout is complete" />
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* C. Appointments */}
                      <div className="space-y-3">
                        <h4 className="text-base font-medium text-gray-800">
                          Appointments
                        </h4>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm">
                          <div className="space-y-5">
                            <div className="bg-white rounded-lg border border-gray-100 p-3">
                              <ToggleSwitch checked={settings.showComingAppointments} onChange={checked => updateSetting('showComingAppointments', checked)} label="Coming Appointments" description="Display upcoming appointments in the salon center" />
                            </div>
                            {settings.showComingAppointments && <div className="space-y-3 pt-3 border-t border-gray-200">
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                  Default State
                                </label>
                                <SegmentedControl options={[{
                          value: 'expanded',
                          label: 'Expanded'
                        }, {
                          value: 'collapsed',
                          label: 'Collapsed'
                        }]} value={settings.comingAppointmentsDefaultState} onChange={value => updateSetting('comingAppointmentsDefaultState', value as 'expanded' | 'collapsed')} name="comingAppointmentsDefaultState" disabled={!settings.showComingAppointments} />
                              </div>}
                          </div>
                        </div>
                      </div>
                      {/* D. Optional Automations */}
                      <div className="space-y-3">
                        <h4 className="text-base font-medium text-gray-800">
                          Optional Automations
                        </h4>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm">
                          <div className="flex items-start space-x-2 mb-3">
                            <Info size={16} className="text-[#27AE60] mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-500 leading-tight">
                              These options will be available in a future update
                            </p>
                          </div>
                          <div className="space-y-4 opacity-60">
                            <div className="bg-white rounded-lg border border-gray-100 p-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Auto-cancel No-shows
                                  </label>
                                  <p className="text-xs text-gray-500">
                                    After waiting for set time
                                  </p>
                                </div>
                                <div className="flex items-center">
                                  <input type="number" min="5" max="120" step="5" value={settings.autoNoShowTime} onChange={e => updateSetting('autoNoShowTime', parseInt(e.target.value) || 30)} disabled={true} className="w-16 h-8 rounded-md border-gray-300 text-sm px-2 focus:ring-[#27AE60] focus:border-[#27AE60] disabled:bg-gray-100 disabled:text-gray-500" />
                                  <span className="ml-2 text-sm text-gray-700">
                                    min
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-100 p-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Alert if Ticket Pending
                                  </label>
                                  <p className="text-xs text-gray-500">
                                    Notify if ticket is pending too long
                                  </p>
                                </div>
                                <div className="flex items-center">
                                  <input type="number" min="1" max="60" step="1" value={settings.pendingAlertMinutes} onChange={e => updateSetting('pendingAlertMinutes', parseInt(e.target.value) || 15)} disabled={true} className="w-16 h-8 rounded-md border-gray-300 text-sm px-2 focus:ring-[#27AE60] focus:border-[#27AE60] disabled:bg-gray-100 disabled:text-gray-500" />
                                  <span className="ml-2 text-sm text-gray-700">
                                    min
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>}
                  {/* 5. Layout Section */}
                  {activeSection === 'layoutSection' && <div className="animate-fadeIn">
                      <SectionHeader title="Layout Section" icon={<LayoutGrid />} />
                      <div className="space-y-3">
                        <h4 className="text-base font-medium text-gray-800">
                          Widths & Views
                        </h4>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm">
                          <div className="space-y-5">
                            <div>
                              <label className="block text-base font-medium text-gray-700 mb-3">
                                Fixed Widths
                              </label>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white rounded-lg border border-gray-100 p-3">
                                  <label className="flex items-start">
                                    <input type="radio" name="viewWidth" checked={settings.viewWidth === 'ultraCompact'} onChange={() => updateSetting('viewWidth', 'ultraCompact')} className="w-4 h-4 mt-1 text-[#27AE60] border-gray-300 focus:ring-[#27AE60]" />
                                    <div className="ml-3">
                                      <span className="block text-sm font-medium text-gray-700">
                                        Ultra Compact
                                      </span>
                                      <span className="block text-xs text-gray-500 mt-1">
                                        Icons only (100px)
                                      </span>
                                    </div>
                                  </label>
                                </div>
                                <div className="bg-white rounded-lg border border-gray-100 p-3">
                                  <label className="flex items-start">
                                    <input type="radio" name="viewWidth" checked={settings.viewWidth === 'compact'} onChange={() => updateSetting('viewWidth', 'compact')} className="w-4 h-4 mt-1 text-[#27AE60] border-gray-300 focus:ring-[#27AE60]" />
                                    <div className="ml-3">
                                      <span className="block text-sm font-medium text-gray-700">
                                        Compact
                                      </span>
                                      <span className="block text-xs text-gray-500 mt-1">
                                        Names + key details (300px)
                                      </span>
                                    </div>
                                  </label>
                                </div>
                              </div>
                            </div>
                            <div className="pt-4 border-t border-gray-200">
                              <label className="block text-base font-medium text-gray-700 mb-3">
                                Responsive Widths
                              </label>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white rounded-lg border border-gray-100 p-3">
                                  <label className="flex items-start">
                                    <input type="radio" name="viewWidth" checked={settings.viewWidth === 'wide'} onChange={() => updateSetting('viewWidth', 'wide')} className="w-4 h-4 mt-1 text-[#27AE60] border-gray-300 focus:ring-[#27AE60]" />
                                    <div className="ml-3">
                                      <span className="block text-sm font-medium text-gray-700">
                                        Wide
                                      </span>
                                      <span className="block text-xs text-gray-500 mt-1">
                                        40% of screen width
                                      </span>
                                    </div>
                                  </label>
                                </div>
                                <div className="bg-white rounded-lg border border-gray-100 p-3">
                                  <label className="flex items-start">
                                    <input type="radio" name="viewWidth" checked={settings.viewWidth === 'fullScreen'} onChange={() => updateSetting('viewWidth', 'fullScreen')} className="w-4 h-4 mt-1 text-[#27AE60] border-gray-300 focus:ring-[#27AE60]" />
                                    <div className="ml-3">
                                      <span className="block text-sm font-medium text-gray-700">
                                        Full Screen
                                      </span>
                                      <span className="block text-xs text-gray-500 mt-1">
                                        100% of screen width
                                      </span>
                                    </div>
                                  </label>
                                </div>
                              </div>
                            </div>
                            <div className="pt-4 border-t border-gray-200">
                              <label className="block text-base font-medium text-gray-700 mb-3">
                                Custom Width
                              </label>
                              <div className="bg-white rounded-lg border border-gray-100 p-3">
                                <div className="flex items-center">
                                  <input type="radio" name="viewWidth" checked={settings.viewWidth === 'custom'} onChange={() => updateSetting('viewWidth', 'custom')} className="w-4 h-4 mt-0 text-[#27AE60] border-gray-300 focus:ring-[#27AE60]" />
                                  <span className="ml-2 text-sm font-medium text-gray-700 mr-3">
                                    Custom
                                  </span>
                                  <div className="flex items-center">
                                    <input type="number" min="10" max="80" step="5" value={settings.customWidthPercentage} onChange={e => updateSetting('customWidthPercentage', parseInt(e.target.value) || 40)} disabled={settings.viewWidth !== 'custom'} className="w-20 h-8 rounded-md border-gray-300 text-sm px-3 focus:ring-[#27AE60] focus:border-[#27AE60] disabled:bg-gray-100 disabled:text-gray-500" />
                                    <span className="ml-2 text-sm text-gray-700">
                                      %
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>}
                </div>
              </div>
            </div>}
          {/* Footer */}
          <div className="px-5 py-3.5 border-t border-gray-100 flex justify-end gap-3 bg-white">
            <button onClick={onClose} className="px-5 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#27AE60]/30 transition-colors shadow-sm">
              Cancel
            </button>
            <button onClick={saveSettings} className={`px-5 py-2 rounded-full text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#27AE60]/30 transition-colors shadow-sm ${hasChanges ? 'bg-[#27AE60] hover:bg-[#219653]' : 'bg-[#27AE60]/60 cursor-not-allowed'}`} disabled={!hasChanges}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </FocusTrap>;
  return createPortal(modalContent, document.body);
};