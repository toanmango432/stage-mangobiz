import React, { useEffect, useState, useRef, cloneElement, Component } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronRight, Info, X, Settings, Users, Layout, Eye, Sliders, Keyboard, ArrowRight, HelpCircle, CheckCircle2, Circle } from 'lucide-react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import FocusTrap from 'focus-trap-react';
interface TeamSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: TeamSettings;
  onSettingsChange: (settings: Partial<TeamSettings>) => void;
}
export interface TeamSettings {
  // Workflow Preferences
  onCardClick: 'openOptions' | 'createTicket';
  filterWaitingList: boolean;
  allowSelectActiveTicket: boolean;
  // Team Display Structure
  organizeBy: 'clockedStatus' | 'busyStatus';
  // Card Data Toggles
  showTurnCount: boolean;
  showNextAppointment: boolean;
  showServicedAmount: boolean;
  showTicketCount: boolean;
  showLastDone: boolean;
  showMoreOptionsButton: boolean;
  // UI Controls
  showSearch: boolean;
  showMinimizeExpandIcon: boolean;
  // Views & Widths
  viewWidth: 'ultraCompact' | 'compact' | 'wide' | 'fullScreen' | 'custom';
  customWidthPercentage: number;
}
export const defaultTeamSettings: TeamSettings = {
  // Workflow Preferences
  onCardClick: 'openOptions',
  filterWaitingList: false,
  allowSelectActiveTicket: false,
  // Team Display Structure
  organizeBy: 'busyStatus',
  // Card Data Toggles
  showTurnCount: true,
  showNextAppointment: true,
  showServicedAmount: true,
  showTicketCount: true,
  showLastDone: true,
  showMoreOptionsButton: true,
  // UI Controls
  showSearch: true,
  showMinimizeExpandIcon: true,
  // Views & Widths
  viewWidth: 'wide',
  customWidthPercentage: 25
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
}) => <div className="group flex items-start justify-between py-2.5 w-full">
    <div className="flex flex-col">
      <span className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-800'}`}>
        {label}
      </span>
      {description && <span className="text-xs text-gray-500 mt-0.5 max-w-[90%]">
          {description}
        </span>}
    </div>
    <div className="relative flex-shrink-0">
      <button type="button" role="switch" aria-checked={checked} disabled={disabled} className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring focus-visible:ring-[#3BB09A]/30 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${checked ? 'bg-[#3BB09A]' : 'bg-gray-200'}`} onClick={() => !disabled && onChange(!checked)}>
        <span className={`pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}>
          <span className={`absolute inset-0 flex h-full w-full items-center justify-center transition-opacity ${checked ? 'opacity-0 duration-100 ease-out' : 'opacity-100 duration-200 ease-in'}`} aria-hidden="true">
            <Circle className="h-3 w-3 text-gray-400" />
          </span>
          <span className={`absolute inset-0 flex h-full w-full items-center justify-center transition-opacity ${checked ? 'opacity-100 duration-200 ease-in' : 'opacity-0 duration-100 ease-out'}`} aria-hidden="true">
            <CheckCircle2 className="h-3 w-3 text-[#3BB09A]" />
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
}) => <div className="flex items-center mb-4">
    <div className="w-8 h-8 rounded-full bg-[#3BB09A]/10 flex items-center justify-center mr-2.5">
      {cloneElement(icon as React.ReactElement, {
      size: 16,
      className: 'text-[#3BB09A]'
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
    <button className="w-full px-4 py-3.5 flex justify-between items-center bg-white text-left" onClick={onToggle} aria-expanded={isOpen}>
      <div className="flex items-center">
        <div className="w-7 h-7 rounded-full bg-[#3BB09A]/10 flex items-center justify-center mr-2.5">
          {cloneElement(icon as React.ReactElement, {
          size: 15,
          className: 'text-[#3BB09A]'
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
export const TeamSettingsPanel: React.FC<TeamSettingsProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSettingsChange
}) => {
  const [settings, setSettings] = useState<TeamSettings>(currentSettings);
  const [activeSection, setActiveSection] = useState<string>('workflow');
  const [hasChanges, setHasChanges] = useState(false);
  const previousActiveElement = useRef<Element | null>(null);
  // Mobile view state
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    workflow: true,
    display: false,
    cardData: false,
    uiControls: false,
    viewsWidths: false,
    shortcuts: false
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
  const updateSetting = <K extends keyof TeamSettings,>(key: K, value: TeamSettings[K]) => {
    const newSettings = {
      ...settings,
      [key]: value
    };
    setSettings(newSettings);
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
      if (e.key === 'Escape' && isOpen) {
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
  }, [isOpen, onClose, saveSettings]);
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
  if (!isOpen) return null;
  const modalContent = <FocusTrap>
      <div className="fixed inset-0 z-[1050] overflow-hidden bg-black/40 backdrop-blur-[2px] flex items-center justify-center" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="team-settings-title">
        <style>
          {`
            @keyframes fadeIn {
              from { opacity: 0; transform: scale(0.98); }
              to { opacity: 1; transform: scale(1); }
            }
            @keyframes slideIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .animate-fadeIn {
              animation: fadeIn 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
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
          `}
        </style>
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col animate-fadeIn relative" style={{
        width: isUltraCompact ? '92vw' : isCompact ? '92vw' : 'clamp(720px, 85vw, 940px)',
        maxHeight: 'min(92vh, 800px)'
      }} onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10 bg-white">
            <h2 id="team-settings-title" className="text-xl font-semibold text-gray-900 flex items-center">
              <div className="bg-[#3BB09A] text-white p-1.5 rounded-lg mr-3 shadow-sm">
                <Settings size={18} />
              </div>
              Team Settings
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors" aria-label="Close settings panel">
              <X size={20} />
            </button>
          </div>
          {/* Mobile/Compact View - Accordion Style */}
          {isCompact ? <div className="flex-1 overflow-y-auto p-4 apple-scroll bg-gray-50">
              <AccordionSection title="Workflow Preferences" icon={<Settings />} isOpen={openAccordions.workflow} onToggle={() => toggleAccordion('workflow')}>
                <div className="space-y-5 animate-slideIn">
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      On Card Click
                    </label>
                    <SegmentedControl options={[{
                  value: 'openOptions',
                  label: 'Open Staff Options'
                }, {
                  value: 'createTicket',
                  label: 'Create New Ticket'
                }]} value={settings.onCardClick} onChange={value => updateSetting('onCardClick', value as 'openOptions' | 'createTicket')} name="onCardClick" />
                  </div>
                  {settings.onCardClick === 'createTicket' && <div className="space-y-4 p-4 bg-[#3BB09A]/5 rounded-xl border border-[#3BB09A]/10 animate-slideIn">
                      <div className="flex items-start mb-2">
                        <Info size={16} className="text-[#3BB09A] mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-xs text-gray-500">
                          These options only apply when "Create New Ticket" is
                          selected
                        </p>
                      </div>
                      <ToggleSwitch checked={settings.filterWaitingList} onChange={checked => updateSetting('filterWaitingList', checked)} label="Filter Waiting List" description="Filter waiting list before creating ticket" />
                      <ToggleSwitch checked={settings.allowSelectActiveTicket} onChange={checked => updateSetting('allowSelectActiveTicket', checked)} label="Select Active Ticket" description="If staff is Busy, allow selecting an active ticket" />
                    </div>}
                </div>
              </AccordionSection>
              <AccordionSection title="Team Display Structure" icon={<Users />} isOpen={openAccordions.display} onToggle={() => toggleAccordion('display')}>
                <div className="space-y-4 animate-slideIn">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organize Team By
                  </label>
                  <SegmentedControl options={[{
                value: 'clockedStatus',
                label: 'Clocked In/Out'
              }, {
                value: 'busyStatus',
                label: 'Busy/Ready'
              }]} value={settings.organizeBy} onChange={value => updateSetting('organizeBy', value as 'clockedStatus' | 'busyStatus')} name="organizeBy" />
                  <p className="text-xs text-gray-500 mt-2">
                    Grouping changes do not alter content priority rules
                  </p>
                </div>
              </AccordionSection>
              <AccordionSection title="Card Data" icon={<Layout />} isOpen={openAccordions.cardData} onToggle={() => toggleAccordion('cardData')}>
                <div className="space-y-3 animate-slideIn">
                  <ToggleSwitch checked={settings.showTurnCount} onChange={checked => updateSetting('showTurnCount', checked)} label="Turn Count" />
                  <ToggleSwitch checked={settings.showNextAppointment} onChange={checked => updateSetting('showNextAppointment', checked)} label="Next Appointment Time" />
                  <ToggleSwitch checked={settings.showServicedAmount} onChange={checked => updateSetting('showServicedAmount', checked)} label="Serviced Amount" />
                  <ToggleSwitch checked={settings.showTicketCount} onChange={checked => updateSetting('showTicketCount', checked)} label="Ticket Count" />
                  <ToggleSwitch checked={settings.showLastDone} onChange={checked => updateSetting('showLastDone', checked)} label="Last Done" />
                  <ToggleSwitch checked={settings.showMoreOptionsButton} onChange={checked => updateSetting('showMoreOptionsButton', checked)} label="More Options Button" />
                  <p className="text-xs text-gray-500 mt-2">
                    Hidden items remain available in staff options
                  </p>
                </div>
              </AccordionSection>
              <AccordionSection title="UI Controls" icon={<Eye />} isOpen={openAccordions.uiControls} onToggle={() => toggleAccordion('uiControls')}>
                <div className="space-y-3 animate-slideIn">
                  <ToggleSwitch checked={settings.showSearch} onChange={checked => updateSetting('showSearch', checked)} label="Show Search" />
                  <ToggleSwitch checked={settings.showMinimizeExpandIcon} onChange={checked => updateSetting('showMinimizeExpandIcon', checked)} label="Show Minimize/Expand Icon" />
                </div>
              </AccordionSection>
              <AccordionSection title="Views & Widths" icon={<Sliders />} isOpen={openAccordions.viewsWidths} onToggle={() => toggleAccordion('viewsWidths')}>
                <div className="space-y-6 animate-slideIn">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Fixed Widths
                    </label>
                    <div className="space-y-2.5">
                      <label className="flex items-center">
                        <input type="radio" name="viewWidth" checked={settings.viewWidth === 'ultraCompact'} onChange={() => updateSetting('viewWidth', 'ultraCompact')} className="w-4 h-4 text-[#3BB09A] border-gray-300 focus:ring-[#3BB09A]" />
                        <span className="ml-2 text-sm text-gray-700">
                          Ultra Compact (100px)
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="viewWidth" checked={settings.viewWidth === 'compact'} onChange={() => updateSetting('viewWidth', 'compact')} className="w-4 h-4 text-[#3BB09A] border-gray-300 focus:ring-[#3BB09A]" />
                        <span className="ml-2 text-sm text-gray-700">
                          Compact (300px)
                        </span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Responsive Widths
                    </label>
                    <div className="space-y-2.5">
                      <label className="flex items-center">
                        <input type="radio" name="viewWidth" checked={settings.viewWidth === 'wide'} onChange={() => updateSetting('viewWidth', 'wide')} className="w-4 h-4 text-[#3BB09A] border-gray-300 focus:ring-[#3BB09A]" />
                        <span className="ml-2 text-sm text-gray-700">
                          Wide (40% of screen)
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="viewWidth" checked={settings.viewWidth === 'fullScreen'} onChange={() => updateSetting('viewWidth', 'fullScreen')} className="w-4 h-4 text-[#3BB09A] border-gray-300 focus:ring-[#3BB09A]" />
                        <span className="ml-2 text-sm text-gray-700">
                          Full Screen (100%)
                        </span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Custom Width
                    </label>
                    <div className="flex items-center">
                      <input type="radio" name="viewWidth" checked={settings.viewWidth === 'custom'} onChange={() => updateSetting('viewWidth', 'custom')} className="w-4 h-4 text-[#3BB09A] border-gray-300 focus:ring-[#3BB09A]" />
                      <span className="ml-2 text-sm text-gray-700 mr-4">
                        Custom
                      </span>
                      <div className="flex items-center">
                        <input type="number" min="10" max="80" step="5" value={settings.customWidthPercentage} onChange={e => updateSetting('customWidthPercentage', parseInt(e.target.value) || 25)} disabled={settings.viewWidth !== 'custom'} className="w-16 h-9 rounded-md border-gray-300 text-sm px-2 focus:ring-[#3BB09A] focus:border-[#3BB09A] disabled:bg-gray-100 disabled:text-gray-500" />
                        <span className="ml-2 text-sm text-gray-700">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionSection>
              <AccordionSection title="Keyboard Shortcuts" icon={<Keyboard />} isOpen={openAccordions.shortcuts} onToggle={() => toggleAccordion('shortcuts')}>
                <div className="space-y-3 animate-slideIn">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-700">Close panel</span>
                    <kbd className="px-2.5 py-1.5 bg-gray-100 border border-gray-200 rounded-md text-xs font-mono text-gray-600 shadow-sm">
                      ESC
                    </kbd>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-700">Save settings</span>
                    <kbd className="px-2.5 py-1.5 bg-gray-100 border border-gray-200 rounded-md text-xs font-mono text-gray-600 shadow-sm">
                      {navigator.platform.indexOf('Mac') > -1 ? '⌘' : 'Ctrl'} +
                      S
                    </kbd>
                  </div>
                </div>
              </AccordionSection>
            </div> /* Desktop View - Sidebar + Content Layout */ : <div className="flex flex-1 overflow-hidden">
              {/* Sidebar Navigation */}
              <div className="w-52 bg-gray-50 border-r border-gray-100 overflow-y-auto apple-scroll">
                <nav className="p-4 space-y-1">
                  {[{
                id: 'workflow',
                label: 'Workflow',
                icon: <Settings size={16} />
              }, {
                id: 'display',
                label: 'Team Display',
                icon: <Users size={16} />
              }, {
                id: 'cardData',
                label: 'Card Data',
                icon: <Layout size={16} />
              }, {
                id: 'uiControls',
                label: 'UI Controls',
                icon: <Eye size={16} />
              }, {
                id: 'viewsWidths',
                label: 'Views & Widths',
                icon: <Sliders size={16} />
              }, {
                id: 'shortcuts',
                label: 'Shortcuts',
                icon: <Keyboard size={16} />
              }].map(item => <button key={item.id} onClick={() => setActiveSection(item.id)} className={`w-full flex items-center px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${activeSection === item.id ? 'bg-white text-[#3BB09A] font-medium shadow-sm border border-gray-100' : 'text-gray-700 hover:bg-white/60 hover:text-gray-900'}`}>
                      <span className="mr-2.5">{item.icon}</span>
                      {item.label}
                      {activeSection === item.id && <ArrowRight size={14} className="ml-auto text-[#3BB09A]" />}
                    </button>)}
                </nav>
              </div>
              {/* Content Area */}
              <div className="flex-1 overflow-y-auto apple-scroll p-6 bg-white">
                {/* Workflow Preferences */}
                {activeSection === 'workflow' && <div className="space-y-8 animate-fadeIn">
                    <SectionHeader title="Workflow Preferences" icon={<Settings />} />
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 shadow-sm">
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            On Card Click
                          </label>
                          <SegmentedControl options={[{
                      value: 'openOptions',
                      label: 'Open Staff Options'
                    }, {
                      value: 'createTicket',
                      label: 'Create New Ticket'
                    }]} value={settings.onCardClick} onChange={value => updateSetting('onCardClick', value as 'openOptions' | 'createTicket')} name="onCardClick" />
                        </div>
                        {settings.onCardClick === 'createTicket' && <div className="space-y-4 p-4 bg-[#3BB09A]/5 rounded-xl border border-[#3BB09A]/10 animate-slideIn">
                            <div className="flex items-start mb-2">
                              <Info size={16} className="text-[#3BB09A] mt-0.5 mr-2 flex-shrink-0" />
                              <p className="text-xs text-gray-500">
                                These options only apply when "Create New
                                Ticket" is selected
                              </p>
                            </div>
                            <ToggleSwitch checked={settings.filterWaitingList} onChange={checked => updateSetting('filterWaitingList', checked)} label="Filter Waiting List" description="Filter waiting list before creating ticket" />
                            <ToggleSwitch checked={settings.allowSelectActiveTicket} onChange={checked => updateSetting('allowSelectActiveTicket', checked)} label="Select Active Ticket" description="If staff is Busy, allow selecting an active ticket" />
                          </div>}
                      </div>
                    </div>
                  </div>}
                {/* Team Display Structure */}
                {activeSection === 'display' && <div className="space-y-8 animate-fadeIn">
                    <SectionHeader title="Team Display Structure" icon={<Users />} />
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 shadow-sm">
                      <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Organize Team By
                        </label>
                        <SegmentedControl options={[{
                    value: 'clockedStatus',
                    label: 'Clocked In/Out'
                  }, {
                    value: 'busyStatus',
                    label: 'Busy/Ready'
                  }]} value={settings.organizeBy} onChange={value => updateSetting('organizeBy', value as 'clockedStatus' | 'busyStatus')} name="organizeBy" />
                        <p className="text-xs text-gray-500 mt-2 flex items-center">
                          <HelpCircle size={14} className="mr-1 text-gray-400" />
                          Grouping changes do not alter content priority rules
                        </p>
                      </div>
                    </div>
                  </div>}
                {/* Card Data Toggles */}
                {activeSection === 'cardData' && <div className="space-y-8 animate-fadeIn">
                    <SectionHeader title="Card Data Toggles" icon={<Layout />} />
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 shadow-sm">
                      <div className="space-y-1 divide-y divide-gray-100">
                        <ToggleSwitch checked={settings.showTurnCount} onChange={checked => updateSetting('showTurnCount', checked)} label="Turn Count" description="Number of turns the staff member has taken" />
                        <ToggleSwitch checked={settings.showNextAppointment} onChange={checked => updateSetting('showNextAppointment', checked)} label="Next Appointment Time" description="Shows upcoming appointment time and details" />
                        <ToggleSwitch checked={settings.showServicedAmount} onChange={checked => updateSetting('showServicedAmount', checked)} label="Serviced Amount" description="Total monetary value of services provided" />
                        <ToggleSwitch checked={settings.showTicketCount} onChange={checked => updateSetting('showTicketCount', checked)} label="Ticket Count" description="Number of tickets serviced" />
                        <ToggleSwitch checked={settings.showLastDone} onChange={checked => updateSetting('showLastDone', checked)} label="Last Done" description="Time of the most recent completed service" />
                        <ToggleSwitch checked={settings.showMoreOptionsButton} onChange={checked => updateSetting('showMoreOptionsButton', checked)} label="More Options Button" description="Button to access additional staff actions" />
                      </div>
                      <p className="text-xs text-gray-500 mt-4 flex items-center">
                        <Info size={14} className="mr-1 text-gray-400" />
                        Hidden items remain available in staff options
                      </p>
                    </div>
                  </div>}
                {/* UI Controls */}
                {activeSection === 'uiControls' && <div className="space-y-8 animate-fadeIn">
                    <SectionHeader title="UI Controls" icon={<Eye />} />
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 shadow-sm">
                      <div className="space-y-1 divide-y divide-gray-100">
                        <ToggleSwitch checked={settings.showSearch} onChange={checked => updateSetting('showSearch', checked)} label="Show Search" description="Displays search bar in team view header" />
                        <ToggleSwitch checked={settings.showMinimizeExpandIcon} onChange={checked => updateSetting('showMinimizeExpandIcon', checked)} label="Show Minimize/Expand Icon" description="Displays icon to toggle between compact and normal views" />
                      </div>
                    </div>
                  </div>}
                {/* Views & Widths */}
                {activeSection === 'viewsWidths' && <div className="space-y-8 animate-fadeIn">
                    <SectionHeader title="Views & Widths" icon={<Sliders />} />
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 shadow-sm">
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Fixed Widths
                          </label>
                          <div className="space-y-2.5">
                            <label className="flex items-center">
                              <input type="radio" name="viewWidth" checked={settings.viewWidth === 'ultraCompact'} onChange={() => updateSetting('viewWidth', 'ultraCompact')} className="w-4 h-4 text-[#3BB09A] border-gray-300 focus:ring-[#3BB09A]" />
                              <span className="ml-2 text-sm text-gray-700">
                                Ultra Compact (100px) — icons only
                              </span>
                            </label>
                            <label className="flex items-center">
                              <input type="radio" name="viewWidth" checked={settings.viewWidth === 'compact'} onChange={() => updateSetting('viewWidth', 'compact')} className="w-4 h-4 text-[#3BB09A] border-gray-300 focus:ring-[#3BB09A]" />
                              <span className="ml-2 text-sm text-gray-700">
                                Compact (300px) — names + key details
                              </span>
                            </label>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Responsive Widths
                          </label>
                          <div className="space-y-2.5">
                            <label className="flex items-center">
                              <input type="radio" name="viewWidth" checked={settings.viewWidth === 'wide'} onChange={() => updateSetting('viewWidth', 'wide')} className="w-4 h-4 text-[#3BB09A] border-gray-300 focus:ring-[#3BB09A]" />
                              <span className="ml-2 text-sm text-gray-700">
                                Wide (40% of screen)
                              </span>
                            </label>
                            <label className="flex items-center">
                              <input type="radio" name="viewWidth" checked={settings.viewWidth === 'fullScreen'} onChange={() => updateSetting('viewWidth', 'fullScreen')} className="w-4 h-4 text-[#3BB09A] border-gray-300 focus:ring-[#3BB09A]" />
                              <span className="ml-2 text-sm text-gray-700">
                                Full Screen (entire screen)
                              </span>
                            </label>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Custom Width
                          </label>
                          <div className="flex items-center">
                            <input type="radio" name="viewWidth" checked={settings.viewWidth === 'custom'} onChange={() => updateSetting('viewWidth', 'custom')} className="w-4 h-4 text-[#3BB09A] border-gray-300 focus:ring-[#3BB09A]" />
                            <span className="ml-2 text-sm text-gray-700 mr-4">
                              Custom Percentage
                            </span>
                            <div className="flex items-center">
                              <input type="number" min="10" max="80" step="5" value={settings.customWidthPercentage} onChange={e => updateSetting('customWidthPercentage', parseInt(e.target.value) || 25)} disabled={settings.viewWidth !== 'custom'} className="w-20 h-9 rounded-md border-gray-300 text-sm px-3 focus:ring-[#3BB09A] focus:border-[#3BB09A] disabled:bg-gray-100 disabled:text-gray-500" />
                              <span className="ml-2 text-sm text-gray-700">
                                %
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 flex items-center">
                          <HelpCircle size={14} className="mr-1 text-gray-400" />
                          View changes do not alter content priority rules
                        </p>
                      </div>
                    </div>
                  </div>}
                {/* Keyboard Shortcuts */}
                {activeSection === 'shortcuts' && <div className="space-y-8 animate-fadeIn">
                    <SectionHeader title="Keyboard Shortcuts" icon={<Keyboard />} />
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 shadow-sm">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                          <span className="text-sm text-gray-700">
                            Close panel
                          </span>
                          <kbd className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-mono text-gray-600 shadow-sm">
                            ESC
                          </kbd>
                        </div>
                        <div className="flex justify-between items-center py-3">
                          <span className="text-sm text-gray-700">
                            Save settings
                          </span>
                          <kbd className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-mono text-gray-600 shadow-sm">
                            {navigator.platform.indexOf('Mac') > -1 ? '⌘' : 'Ctrl'}{' '}
                            + S
                          </kbd>
                        </div>
                      </div>
                    </div>
                  </div>}
              </div>
            </div>}
          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-white">
            <button onClick={onClose} className="px-5 py-2.5 rounded-full border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3BB09A]/30 transition-colors shadow-sm">
              Cancel
            </button>
            <button onClick={saveSettings} className={`px-5 py-2.5 rounded-full text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3BB09A]/30 transition-colors shadow-sm ${hasChanges ? 'bg-[#3BB09A] hover:bg-[#309886]' : 'bg-[#3BB09A]/60 cursor-not-allowed'}`} disabled={!hasChanges}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </FocusTrap>;
  return createPortal(modalContent, document.body);
};