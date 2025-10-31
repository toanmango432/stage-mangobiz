import React, { useEffect, useState, useRef } from 'react';
import { X, ArrowLeft, Check, Layers, Users, FileText, Clock, LayoutDashboard, ArrowRight, Settings, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { SalonCenterSettingsData } from './SalonCenterSettings';
import { createPortal } from 'react-dom';
interface OperationTemplateSetupProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: SalonCenterSettingsData;
  onSettingsChange: (settings: Partial<SalonCenterSettingsData>) => void;
}
interface QuickAnswers {
  primaryFocus: 'frontDesk' | 'staff';
  operationStyle: 'flow' | 'inOut';
  showAppointments: boolean;
}
export const OperationTemplateSetup: React.FC<OperationTemplateSetupProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSettingsChange
}) => {
  const [settings, setSettings] = useState<SalonCenterSettingsData>(currentSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [quickAnswers, setQuickAnswers] = useState<QuickAnswers>({
    primaryFocus: currentSettings.viewWidth === 'fullScreen' || currentSettings.viewWidth === 'wide' && currentSettings.customWidthPercentage >= 60 ? 'staff' : 'frontDesk',
    operationStyle: currentSettings.organizeBy === 'busyStatus' ? 'flow' : 'inOut',
    showAppointments: currentSettings.showComingAppointments
  });
  const [showToast, setShowToast] = useState(false);
  const [expandedSettings, setExpandedSettings] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentTemplateIndex, setCurrentTemplateIndex] = useState(0);
  const suggestedTemplateRef = useRef<HTMLDivElement>(null);
  // Refs for question sections to enable auto-scrolling
  const question1Ref = useRef<HTMLDivElement>(null);
  const question2Ref = useRef<HTMLDivElement>(null);
  const question3Ref = useRef<HTMLDivElement>(null);
  // Update local state when props change
  useEffect(() => {
    setSettings(currentSettings);
    setHasChanges(false);
    // Update quick answers based on current settings
    setQuickAnswers({
      primaryFocus: currentSettings.viewWidth === 'fullScreen' || currentSettings.viewWidth === 'wide' && currentSettings.customWidthPercentage >= 60 ? 'staff' : 'frontDesk',
      operationStyle: currentSettings.organizeBy === 'busyStatus' ? 'flow' : 'inOut',
      showAppointments: currentSettings.showComingAppointments
    });
  }, [currentSettings]);
  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  // Scroll to suggested template when answers change
  useEffect(() => {
    const suggestedTemplate = getSuggestedTemplate();
    if (isMobile) {
      // For mobile, set the current template index to the suggested template
      const templateIndex = templates.findIndex(t => t === suggestedTemplate);
      if (templateIndex !== -1) {
        setCurrentTemplateIndex(templateIndex);
      }
    } else {
      // For desktop, scroll to the suggested template
      if (suggestedTemplateRef.current) {
        setTimeout(() => {
          suggestedTemplateRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }, 300);
      }
    }
  }, [quickAnswers]);
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
    // Update settings and mark changes
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
    setHasChanges(true);
    // Update quick answers based on template
    setQuickAnswers({
      primaryFocus: template === 'teamWithOperationFlow' || template === 'teamInOut' ? 'staff' : 'frontDesk',
      operationStyle: template === 'teamInOut' ? 'inOut' : 'flow',
      showAppointments: template !== 'teamInOut'
    });
  };
  // Update quick answers and apply changes
  const updateQuickAnswer = (key: keyof QuickAnswers, value: any) => {
    setQuickAnswers(prev => {
      const newAnswers = {
        ...prev,
        [key]: value
      };
      return newAnswers;
    });
    // Auto-scroll to next question after selecting an answer
    setTimeout(() => {
      if (key === 'primaryFocus' && question2Ref.current) {
        question2Ref.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      } else if (key === 'operationStyle' && question3Ref.current) {
        question3Ref.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 300);
  };
  // Save settings and close with toast notification
  const saveSettings = () => {
    onSettingsChange(settings);
    setShowToast(true);
    // Hide toast after 3 seconds
    setTimeout(() => {
      setShowToast(false);
      onClose();
    }, 3000);
  };
  // Get suggested template based on quick answers
  const getSuggestedTemplate = (): SalonCenterSettingsData['operationTemplate'] => {
    if (quickAnswers.primaryFocus === 'frontDesk') {
      return quickAnswers.operationStyle === 'flow' ? 'frontDeskBalanced' : 'frontDeskTicketCenter';
    } else {
      return quickAnswers.operationStyle === 'flow' ? 'teamWithOperationFlow' : 'teamInOut';
    }
  };
  // Toggle expanded settings
  const toggleExpandSettings = (section: string) => {
    setExpandedSettings(prev => prev === section ? null : section);
  };
  // Handle mobile template navigation
  const navigateTemplate = (direction: 'next' | 'prev') => {
    if (direction === 'next') {
      setCurrentTemplateIndex(prev => prev === 3 ? 0 : prev + 1);
    } else {
      setCurrentTemplateIndex(prev => prev === 0 ? 3 : prev - 1);
    }
  };
  // Get template details
  const getTemplateDetails = (template: SalonCenterSettingsData['operationTemplate']) => {
    switch (template) {
      case 'frontDeskBalanced':
        return {
          title: 'Front Desk Balanced',
          description: 'Best for front desk–led salons that want balanced staff & ticket visibility',
          teamRatio: 40,
          ticketRatio: 60,
          teamMode: 'column',
          ticketMode: 'column',
          showAppointments: true,
          organizeBy: 'busyStatus'
        };
      case 'frontDeskTicketCenter':
        return {
          title: 'Front Desk Ticket Center',
          description: 'Best for busy salons where reception prioritizes ticket speed',
          teamRatio: 10,
          ticketRatio: 90,
          teamMode: 'tab',
          ticketMode: 'column',
          showAppointments: true,
          organizeBy: 'busyStatus'
        };
      case 'teamWithOperationFlow':
        return {
          title: 'Team with Operation Flow',
          description: 'Best for staff-driven salons that still want waitlist + in service flow',
          teamRatio: 80,
          ticketRatio: 20,
          teamMode: 'column',
          ticketMode: 'tab',
          showAppointments: true,
          organizeBy: 'busyStatus'
        };
      case 'teamInOut':
        return {
          title: 'Team In/Out',
          description: 'Best for salons with Quick In/Out (booth rentals, barbershops)',
          teamRatio: 100,
          ticketRatio: 0,
          teamMode: 'column',
          ticketMode: 'none',
          showAppointments: false,
          organizeBy: 'clockedStatus'
        };
    }
  };
  // Template cards array for easier rendering
  const templates: SalonCenterSettingsData['operationTemplate'][] = ['frontDeskBalanced', 'frontDeskTicketCenter', 'teamWithOperationFlow', 'teamInOut'];
  if (!isOpen) return null;
  // Render the Toast component
  const Toast = () => {
    if (!showToast) return null;
    return createPortal(<div className="template-setup-toast fixed bottom-6 right-6 z-[2000] animate-slideInUp">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 flex items-center max-w-md">
          <div className="bg-[#27AE60]/10 text-[#27AE60] p-2 rounded-full mr-3">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="font-medium text-gray-800">Template applied</p>
            <p className="text-sm text-gray-600">
              You can fine-tune in Team, Ticket, Workflow, and Layout sections.
            </p>
          </div>
        </div>
      </div>, document.body);
  };
  return <div className="template-setup fixed inset-0 z-[1060] bg-white overflow-hidden flex flex-col">
      <style>
        {`
          @keyframes slideInUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .animate-slideInUp {
            animation: slideInUp 0.3s ease-out forwards;
          }
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(39, 174, 96, 0.3); }
            70% { box-shadow: 0 0 0 10px rgba(39, 174, 96, 0); }
            100% { box-shadow: 0 0 0 0 rgba(39, 174, 96, 0); }
          }
          .animate-pulse-green {
            animation: pulse 1.5s infinite;
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
          .template-card {
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          .template-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
          }
          .template-card.suggested {
            border-color: #27AE60;
            background-color: rgba(39, 174, 96, 0.05);
          }
          .template-card.selected {
            border-color: #27AE60;
            background-color: rgba(39, 174, 96, 0.1);
          }
          .template-card.suggested::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            border-radius: 0.75rem;
            background: linear-gradient(45deg, #27AE60, #3498DB, #FF5CA2, #FF7B54);
            z-index: -1;
            opacity: 0.5;
            animation: border-glow 3s ease-in-out infinite;
          }
          @keyframes border-glow {
            0% { opacity: 0.3; }
            50% { opacity: 0.7; }
            100% { opacity: 0.3; }
          }
          .answer-option {
            transition: all 0.2s ease;
            border-width: 1px;
            border-color: #e5e7eb;
          }
          .answer-option:hover {
            border-color: #d1d5db;
            background-color: #f9fafb;
          }
          .answer-option.selected {
            border-color: #27AE60;
            background-color: rgba(39, 174, 96, 0.05);
          }
          .swipe-indicator {
            display: flex;
            justify-content: center;
            gap: 6px;
            margin-top: 16px;
          }
          .swipe-indicator div {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #e5e7eb;
            transition: all 0.2s ease;
          }
          .swipe-indicator div.active {
            background-color: #27AE60;
            width: 24px;
            border-radius: 4px;
          }
          .section-preview {
            position: relative;
            box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05);
            border-radius: 0.375rem;
            overflow: hidden;
          }
          .section-preview-header {
            padding: 0.375rem 0.5rem;
            font-size: 0.7rem;
            font-weight: 500;
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          }
          .section-preview-content {
            padding: 0.5rem;
          }
          .section-preview-card {
            margin-bottom: 0.375rem;
            padding: 0.375rem 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.65rem;
            font-weight: 500;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          }
          .appointments-rail {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 0.375rem 0.5rem;
            font-size: 0.65rem;
            font-weight: 500;
            border-top: 1px solid rgba(0, 0, 0, 0.05);
            display: flex;
            align-items: center;
            gap: 0.25rem;
          }
          .settings-panel {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease-out;
          }
          .settings-panel.expanded {
            max-height: 500px;
            transition: max-height 0.5s ease-in;
          }
          .step-indicator {
            display: inline-flex;
            justify-content: center;
            align-items: center;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background-color: #27AE60;
            color: white;
            font-size: 12px;
            font-weight: 600;
            margin-right: 10px;
          }
          .question-card {
            transition: all 0.3s ease;
            border: 1px solid #f0f0f0;
          }
          .question-card.answered {
            opacity: 0.85;
          }
        `}
      </style>
      {/* Header */}
      <header className="template-setup-header px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10 bg-white shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900 flex items-center">
            <div className="bg-[#27AE60] text-white p-1.5 rounded-lg mr-3 shadow-sm">
              <Layers size={20} />
            </div>
            Choose Your Operation Template
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Every salon runs differently. Answer a few quick questions, and
            we'll suggest the best setup for you.
          </p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors" aria-label="Close template setup">
          <X size={24} />
        </button>
      </header>
      {/* Main Content */}
      <main className="template-setup-main flex-1 overflow-y-auto apple-scroll">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 md:py-6">
          {/* Questions Section - Redesigned for compact layout */}
          <section className="template-setup-questions mb-4 max-w-3xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-800 mb-2 px-1 flex items-center">
              <span>Tell us about your salon</span>
              <span className="text-xs text-gray-500 ml-2">
                (3 quick questions)
              </span>
            </h2>
            <div className="space-y-2">
              {/* Question 1: Primary Focus */}
              <div ref={question1Ref} className={`question-card rounded-lg p-3 bg-white shadow-sm ${quickAnswers.primaryFocus ? 'answered border-l-2 border-[#27AE60]' : ''}`}>
                <div className="flex items-center">
                  <div className="step-indicator w-5 h-5 text-xs flex-shrink-0">
                    1
                  </div>
                  <div className="ml-2 flex-grow">
                    <h3 className="text-sm font-medium text-gray-800">
                      Who runs the front of your salon?
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5 mb-1.5">
                      This helps us determine the best layout for your team
                    </p>
                  </div>
                  {quickAnswers.primaryFocus && <div className="ml-auto text-[#27AE60] flex-shrink-0">
                      <CheckCircle size={16} />
                    </div>}
                </div>
                <div className="mt-1.5 flex gap-2 items-stretch">
                  <button className={`answer-option flex-1 px-2 py-1.5 rounded-md text-sm ${quickAnswers.primaryFocus === 'frontDesk' ? 'selected bg-[#27AE60]/5 border-[#27AE60] text-gray-900' : 'bg-white text-gray-700'}`} onClick={() => updateQuickAnswer('primaryFocus', 'frontDesk')}>
                    <div className="flex items-center justify-center">
                      {quickAnswers.primaryFocus === 'frontDesk' && <Check size={12} className="text-[#27AE60] mr-1" />}
                      <span>Front Desk Staff</span>
                    </div>
                    <span className="text-xs text-gray-500 block mt-0.5">
                      Reception handles tickets
                    </span>
                  </button>
                  <button className={`answer-option flex-1 px-2 py-1.5 rounded-md text-sm ${quickAnswers.primaryFocus === 'staff' ? 'selected bg-[#27AE60]/5 border-[#27AE60] text-gray-900' : 'bg-white text-gray-700'}`} onClick={() => updateQuickAnswer('primaryFocus', 'staff')}>
                    <div className="flex items-center justify-center">
                      {quickAnswers.primaryFocus === 'staff' && <Check size={12} className="text-[#27AE60] mr-1" />}
                      <span>Service Providers</span>
                    </div>
                    <span className="text-xs text-gray-500 block mt-0.5">
                      Stylists manage clients
                    </span>
                  </button>
                </div>
              </div>
              {/* Question 2: Operation Style - Conditional based on Q1 */}
              <div ref={question2Ref} className={`question-card rounded-lg p-3 bg-white shadow-sm ${quickAnswers.operationStyle ? 'answered border-l-2 border-[#27AE60]' : ''}`}>
                <div className="flex items-center">
                  <div className="step-indicator w-5 h-5 text-xs flex-shrink-0">
                    2
                  </div>
                  <div className="ml-2 flex-grow">
                    <h3 className="text-sm font-medium text-gray-800">
                      {quickAnswers.primaryFocus === 'frontDesk' ? 'What do you want to focus on more?' : 'How do staff handle clients?'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5 mb-1.5">
                      {quickAnswers.primaryFocus === 'frontDesk' ? 'Choose how to balance staff visibility and tickets' : 'Select the workflow that matches your salon'}
                    </p>
                  </div>
                  {quickAnswers.operationStyle && <div className="ml-auto text-[#27AE60] flex-shrink-0">
                      <CheckCircle size={16} />
                    </div>}
                </div>
                <div className="mt-1.5 flex gap-2 items-stretch">
                  <button className={`answer-option flex-1 px-2 py-1.5 rounded-md text-sm ${quickAnswers.operationStyle === 'flow' ? 'selected bg-[#27AE60]/5 border-[#27AE60] text-gray-900' : 'bg-white text-gray-700'}`} onClick={() => updateQuickAnswer('operationStyle', 'flow')}>
                    <div className="flex items-center justify-center">
                      {quickAnswers.operationStyle === 'flow' && <Check size={12} className="text-[#27AE60] mr-1" />}
                      <span>
                        {quickAnswers.primaryFocus === 'frontDesk' ? 'Both staff & tickets' : 'Step by Step Flow'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 block mt-0.5">
                      {quickAnswers.primaryFocus === 'frontDesk' ? 'Balanced team & ticket view' : 'Waitlist → Service → Checkout'}
                    </span>
                  </button>
                  <button className={`answer-option flex-1 px-2 py-1.5 rounded-md text-sm ${quickAnswers.operationStyle === 'inOut' ? 'selected bg-[#27AE60]/5 border-[#27AE60] text-gray-900' : 'bg-white text-gray-700'}`} onClick={() => updateQuickAnswer('operationStyle', 'inOut')}>
                    <div className="flex items-center justify-center">
                      {quickAnswers.operationStyle === 'inOut' && <Check size={12} className="text-[#27AE60] mr-1" />}
                      <span>
                        {quickAnswers.primaryFocus === 'frontDesk' ? 'Tickets & clients' : 'Quick In/Out'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 block mt-0.5">
                      {quickAnswers.primaryFocus === 'frontDesk' ? 'Focus on ticket board' : 'Clock in/out only'}
                    </span>
                  </button>
                </div>
              </div>
              {/* Question 3: Appointment Relevance */}
              <div ref={question3Ref} className={`question-card rounded-lg p-3 bg-white shadow-sm ${quickAnswers.showAppointments !== undefined ? 'answered border-l-2 border-[#27AE60]' : ''}`}>
                <div className="flex items-center">
                  <div className="step-indicator w-5 h-5 text-xs flex-shrink-0">
                    3
                  </div>
                  <div className="ml-2 flex-grow">
                    <h3 className="text-sm font-medium text-gray-800">
                      Do you want to see upcoming appointments?
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5 mb-1.5">
                      Choose whether to display upcoming appointments
                    </p>
                  </div>
                  {quickAnswers.showAppointments !== undefined && <div className="ml-auto text-[#27AE60] flex-shrink-0">
                      <CheckCircle size={16} />
                    </div>}
                </div>
                <div className="mt-1.5 flex gap-2 items-stretch">
                  <button className={`answer-option flex-1 px-2 py-1.5 rounded-md text-sm ${quickAnswers.showAppointments === true ? 'selected bg-[#27AE60]/5 border-[#27AE60] text-gray-900' : 'bg-white text-gray-700'}`} onClick={() => updateQuickAnswer('showAppointments', true)}>
                    <div className="flex items-center justify-center">
                      {quickAnswers.showAppointments === true && <Check size={12} className="text-[#27AE60] mr-1" />}
                      <span>Yes, show appointments</span>
                    </div>
                    <span className="text-xs text-gray-500 block mt-0.5">
                      See upcoming client bookings
                    </span>
                  </button>
                  <button className={`answer-option flex-1 px-2 py-1.5 rounded-md text-sm ${quickAnswers.showAppointments === false ? 'selected bg-[#27AE60]/5 border-[#27AE60] text-gray-900' : 'bg-white text-gray-700'}`} onClick={() => updateQuickAnswer('showAppointments', false)}>
                    <div className="flex items-center justify-center">
                      {quickAnswers.showAppointments === false && <Check size={12} className="text-[#27AE60] mr-1" />}
                      <span>No, focus on today</span>
                    </div>
                    <span className="text-xs text-gray-500 block mt-0.5">
                      Prioritize current operations
                    </span>
                  </button>
                </div>
              </div>
              {/* Suggested Template Message */}
              {quickAnswers.primaryFocus && quickAnswers.operationStyle && quickAnswers.showAppointments !== undefined && <div className="text-center py-1.5 px-3 rounded-md bg-[#27AE60]/10 text-[#27AE60] text-sm font-medium flex items-center justify-center">
                    <CheckCircle size={14} className="mr-1.5" />
                    <span>
                      Suggested:{' '}
                      <strong>
                        {getTemplateDetails(getSuggestedTemplate())?.title}
                      </strong>
                    </span>
                    <ArrowRight size={14} className="ml-1.5" />
                  </div>}
            </div>
          </section>
          {/* Template Grid - Keeping this section unchanged */}
          <section className="template-setup-templates mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 px-1 flex justify-between items-center">
              <span>Choose a template</span>
              {isMobile && <div className="flex space-x-2">
                  <button onClick={() => navigateTemplate('prev')} className="p-1.5 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200" aria-label="Previous template">
                    <ArrowLeft size={16} />
                  </button>
                  <button onClick={() => navigateTemplate('next')} className="p-1.5 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200" aria-label="Next template">
                    <ArrowRight size={16} />
                  </button>
                </div>}
            </h2>
            {/* Desktop Grid */}
            {!isMobile ? <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {templates.map(template => {
              const details = getTemplateDetails(template);
              const isSuggested = getSuggestedTemplate() === template;
              const isSelected = settings.operationTemplate === template;
              return <div key={template} ref={isSuggested ? suggestedTemplateRef : null} className={`template-card border-2 rounded-xl overflow-hidden relative ${isSuggested ? 'suggested' : 'border-gray-200'} ${isSelected ? 'selected' : ''}`}>
                      {isSuggested && <div className="absolute -top-2 -right-2 bg-[#FF7B54] text-white text-xs font-medium py-1 px-2.5 rounded-full shadow-sm z-10">
                          Suggested for You
                        </div>}
                      {isSelected && <div className="absolute top-3 right-3 text-[#27AE60] z-10">
                          <CheckCircle size={20} />
                        </div>}
                      {/* Enhanced Template Preview */}
                      <div className="template-preview h-64 bg-white border-b border-gray-200">
                        {/* Template header */}
                        <div className="bg-gray-100 py-2 px-4 flex items-center justify-between border-b border-gray-200">
                          <div className="flex items-center">
                            <div className="bg-[#27AE60] text-white p-1 rounded mr-2 shadow-sm">
                              <LayoutDashboard size={14} />
                            </div>
                            <h3 className="text-sm font-medium text-gray-800">
                              {details.title}
                            </h3>
                          </div>
                          <span className="text-xs font-medium bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                            {details.teamRatio}/{details.ticketRatio}
                          </span>
                        </div>
                        {/* Template body - realistic mockup */}
                        <div className="flex h-[calc(100%-40px)]">
                          {/* Team Section - Only show if teamRatio > 0 */}
                          {details.teamRatio > 0 && <div className="h-full flex flex-col border-r border-gray-200 overflow-hidden" style={{
                      width: `${details.teamRatio}%`
                    }}>
                              {/* Team Header */}
                              <div className="flex items-center justify-between bg-[#E8F2FF] px-2 py-1.5 border-b border-[#3B82F6]/20">
                                <div className="flex items-center">
                                  <Users size={14} className="text-[#3B82F6] mr-1.5" />
                                  <span className="text-xs font-medium text-[#3B82F6]">
                                    Team
                                  </span>
                                </div>
                                {/* Tab/Column toggle based on teamMode */}
                                {details.teamMode === 'tab' ? <div className="flex text-[10px] bg-[#3B82F6]/10 rounded-sm overflow-hidden">
                                    <div className={`px-1.5 py-0.5 ${details.organizeBy === 'busyStatus' ? 'bg-[#3B82F6] text-white' : 'text-[#3B82F6]'}`}>
                                      Ready
                                    </div>
                                    <div className={`px-1.5 py-0.5 ${details.organizeBy === 'busyStatus' ? 'text-[#3B82F6]' : 'bg-[#3B82F6] text-white'}`}>
                                      Busy
                                    </div>
                                  </div> : <div className="text-[10px] text-[#3B82F6] font-medium">
                                    {details.organizeBy === 'busyStatus' ? 'Ready/Busy' : 'Clocked In/Out'}
                                  </div>}
                              </div>
                              {/* Team Content */}
                              <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5">
                                {details.organizeBy === 'busyStatus' ? <>
                                    {/* Ready Staff */}
                                    <div className="text-[10px] font-medium text-[#27AE60] mb-1 px-0.5">
                                      Ready
                                    </div>
                                    <div className="staff-card bg-white rounded border border-gray-100 shadow-sm p-1.5">
                                      <div className="flex items-center">
                                        <div className="w-4 h-4 rounded-full bg-[#27AE60]/20 flex items-center justify-center mr-1.5">
                                          <div className="w-2 h-2 rounded-full bg-[#27AE60]"></div>
                                        </div>
                                        <span className="text-xs font-medium text-gray-800">
                                          Sarah T.
                                        </span>
                                        {template !== 'teamInOut' && <span className="ml-auto text-[9px] text-[#3B82F6] bg-[#3B82F6]/10 px-1 py-0.5 rounded">
                                            1 client
                                          </span>}
                                      </div>
                                    </div>
                                    {/* Busy Staff */}
                                    <div className="text-[10px] font-medium text-gray-500 mb-1 mt-2 px-0.5">
                                      Busy
                                    </div>
                                    <div className="staff-card bg-white rounded border border-gray-100 shadow-sm p-1.5">
                                      <div className="flex items-center">
                                        <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center mr-1.5">
                                          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                        </div>
                                        <span className="text-xs font-medium text-gray-800">
                                          Mike R.
                                        </span>
                                        {template !== 'teamInOut' && <span className="ml-auto text-[9px] text-amber-600 bg-amber-50 px-1 py-0.5 rounded">
                                            In service
                                          </span>}
                                      </div>
                                    </div>
                                    <div className="staff-card bg-white rounded border border-gray-100 shadow-sm p-1.5">
                                      <div className="flex items-center">
                                        <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center mr-1.5">
                                          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                        </div>
                                        <span className="text-xs font-medium text-gray-800">
                                          Emma S.
                                        </span>
                                        {template !== 'teamInOut' && <span className="ml-auto text-[9px] text-amber-600 bg-amber-50 px-1 py-0.5 rounded">
                                            In service
                                          </span>}
                                      </div>
                                    </div>
                                  </> : <>
                                    {/* Clocked In Staff */}
                                    <div className="text-[10px] font-medium text-[#27AE60] mb-1 px-0.5">
                                      Clocked In
                                    </div>
                                    <div className="staff-card bg-white rounded border border-gray-100 shadow-sm p-1.5">
                                      <div className="flex items-center">
                                        <span className="text-xs font-medium text-gray-800">
                                          Sarah T.
                                        </span>
                                        <span className="ml-auto text-[9px] text-[#27AE60] bg-[#27AE60]/10 px-1 py-0.5 rounded">
                                          8:30 AM
                                        </span>
                                      </div>
                                    </div>
                                    <div className="staff-card bg-white rounded border border-gray-100 shadow-sm p-1.5">
                                      <div className="flex items-center">
                                        <span className="text-xs font-medium text-gray-800">
                                          Mike R.
                                        </span>
                                        <span className="ml-auto text-[9px] text-[#27AE60] bg-[#27AE60]/10 px-1 py-0.5 rounded">
                                          9:15 AM
                                        </span>
                                      </div>
                                    </div>
                                    {/* Clocked Out Staff */}
                                    <div className="text-[10px] font-medium text-gray-500 mb-1 mt-2 px-0.5">
                                      Clocked Out
                                    </div>
                                    <div className="staff-card bg-white rounded border border-gray-100 shadow-sm p-1.5 opacity-70">
                                      <div className="flex items-center">
                                        <span className="text-xs font-medium text-gray-600">
                                          Emma S.
                                        </span>
                                      </div>
                                    </div>
                                  </>}
                              </div>
                            </div>}
                          {/* Ticket Section - Only show if ticketRatio > 0 */}
                          {details.ticketRatio > 0 && <div className="h-full flex flex-col border-r border-gray-200 overflow-hidden" style={{
                      width: `${details.ticketRatio}%`
                    }}>
                              {/* Ticket Header */}
                              <div className="flex items-center justify-between bg-[#FFF8E6] px-2 py-1.5 border-b border-[#F59E0B]/20">
                                <div className="flex items-center">
                                  <FileText size={14} className="text-[#F59E0B] mr-1.5" />
                                  <span className="text-xs font-medium text-[#F59E0B]">
                                    Tickets
                                  </span>
                                </div>
                                {/* Tab/Column toggle based on ticketMode */}
                                {details.ticketMode === 'tab' ? <div className="flex text-[10px] bg-[#F59E0B]/10 rounded-sm overflow-hidden">
                                    <div className="px-1.5 py-0.5 bg-[#F59E0B] text-white">
                                      Waiting
                                    </div>
                                    <div className="px-1.5 py-0.5 text-[#F59E0B]">
                                      In Service
                                    </div>
                                  </div> : <div className="text-[10px] text-[#F59E0B] font-medium">
                                    Waitlist + In Service
                                  </div>}
                              </div>
                              {/* Ticket Content */}
                              <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5">
                                {/* Waiting Section */}
                                <div className="text-[10px] font-medium text-gray-500 mb-1 px-0.5">
                                  Waiting
                                </div>
                                <div className="ticket-card bg-white rounded border border-gray-100 shadow-sm p-1.5">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="text-xs font-medium text-gray-800">
                                        John D.
                                      </div>
                                      <div className="text-[9px] text-gray-500">
                                        Haircut + Color
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                      <span className="text-[9px] text-gray-500">
                                        5m
                                      </span>
                                      {template === 'frontDeskTicketCenter' && <span className="text-[9px] text-[#3B82F6] bg-[#3B82F6]/10 px-1 rounded">
                                          Assign
                                        </span>}
                                    </div>
                                  </div>
                                </div>
                                <div className="ticket-card bg-white rounded border border-gray-100 shadow-sm p-1.5">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="text-xs font-medium text-gray-800">
                                        Lisa M.
                                      </div>
                                      <div className="text-[9px] text-gray-500">
                                        Blowout
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                      <span className="text-[9px] text-gray-500">
                                        12m
                                      </span>
                                      {template === 'frontDeskTicketCenter' && <span className="text-[9px] text-[#3B82F6] bg-[#3B82F6]/10 px-1 rounded">
                                          Assign
                                        </span>}
                                    </div>
                                  </div>
                                </div>
                                {/* In Service Section */}
                                <div className="text-[10px] font-medium text-gray-500 mb-1 mt-2 px-0.5">
                                  In Service
                                </div>
                                <div className="ticket-card bg-white rounded border border-gray-100 shadow-sm p-1.5">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="text-xs font-medium text-gray-800">
                                        Emma S.
                                      </div>
                                      <div className="text-[9px] text-gray-500">
                                        Full Color
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                      <span className="text-[9px] text-gray-500">
                                        15m
                                      </span>
                                      <span className="text-[9px] text-amber-600">
                                        Mike R.
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="ticket-card bg-white rounded border border-gray-100 shadow-sm p-1.5">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="text-xs font-medium text-gray-800">
                                        David K.
                                      </div>
                                      <div className="text-[9px] text-gray-500">
                                        Haircut
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                      <span className="text-[9px] text-gray-500">
                                        8m
                                      </span>
                                      <span className="text-[9px] text-amber-600">
                                        Emma S.
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>}
                          {/* Appointments Rail - Only show if showAppointments is true */}
                          {details.showAppointments && <div className="absolute bottom-0 left-0 right-0 bg-[#8E44AD]/10 px-2 py-1.5 border-t border-[#8E44AD]/20 flex items-center">
                              <Clock size={14} className="text-[#8E44AD] mr-1.5" />
                              <span className="text-xs font-medium text-[#8E44AD]">
                                Upcoming Appointments
                              </span>
                              <div className="ml-auto flex space-x-1.5">
                                <div className="w-2 h-2 rounded-full bg-[#8E44AD]/40"></div>
                                <div className="w-2 h-2 rounded-full bg-[#8E44AD]"></div>
                                <div className="w-2 h-2 rounded-full bg-[#8E44AD]/40"></div>
                              </div>
                            </div>}
                          {/* Quick Actions for Team In/Out - Only for teamInOut template */}
                          {template === 'teamInOut' && <div className="absolute bottom-4 right-4 flex space-x-2">
                              <div className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center border border-gray-200">
                                <FileText size={14} className="text-gray-600" />
                              </div>
                              <div className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center border border-gray-200">
                                <Clock size={14} className="text-gray-600" />
                              </div>
                            </div>}
                        </div>
                      </div>
                      {/* Template Info */}
                      <div className="p-4 bg-white">
                        <h3 className="text-base font-semibold text-gray-800 mb-1.5 flex items-center">
                          {details.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4 min-h-[40px]">
                          {details.description}
                        </p>
                        {/* Pre-Config Settings (Collapsible) */}
                        <div className="mb-4">
                          <button className="w-full flex items-center justify-between p-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors" onClick={() => toggleExpandSettings(template)} aria-expanded={expandedSettings === template}>
                            <span className="flex items-center">
                              <Settings size={14} className="mr-2" />
                              Pre-configured Settings
                            </span>
                            {expandedSettings === template ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                          <div className={`settings-panel mt-3 ${expandedSettings === template ? 'expanded' : ''}`}>
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                              <div className="space-y-3">
                                <div>
                                  <h4 className="font-medium text-gray-800 mb-1 flex items-center">
                                    <div className="w-3 h-3 bg-[#3B82F6] rounded-sm mr-2"></div>
                                    Team Section
                                  </h4>
                                  <ul className="ml-5 space-y-1 text-gray-600 text-xs">
                                    <li>
                                      Width:{' '}
                                      <span className="font-medium">
                                        {details.teamRatio}%
                                      </span>{' '}
                                      of screen
                                    </li>
                                    <li>
                                      Display mode:{' '}
                                      <span className="font-medium">
                                        {details.teamMode === 'column' ? 'Column View' : 'Tab View'}
                                      </span>
                                    </li>
                                    <li>
                                      Card data:{' '}
                                      <span className="font-medium">
                                        Name, Status, Active Ticket
                                      </span>
                                    </li>
                                    <li>
                                      Staff UI:{' '}
                                      <span className="font-medium">
                                        {details.organizeBy === 'busyStatus' ? 'Ready/Busy Status Icons' : 'Clock In/Out Controls'}
                                      </span>
                                    </li>
                                  </ul>
                                </div>
                                {details.ticketRatio > 0 && <div>
                                    <h4 className="font-medium text-gray-800 mb-1 flex items-center">
                                      <div className="w-3 h-3 bg-[#F59E0B] rounded-sm mr-2"></div>
                                      Ticket Section
                                    </h4>
                                    <ul className="ml-5 space-y-1 text-gray-600 text-xs">
                                      <li>
                                        Width:{' '}
                                        <span className="font-medium">
                                          {details.ticketRatio}%
                                        </span>{' '}
                                        of screen
                                      </li>
                                      <li>
                                        Display mode:{' '}
                                        <span className="font-medium">
                                          {details.ticketMode === 'column' ? 'Column View' : 'Tab View'}
                                        </span>
                                      </li>
                                      <li>
                                        Sections:{' '}
                                        <span className="font-medium">
                                          Waiting, In Service, Complete
                                        </span>
                                      </li>
                                      <li>
                                        Ticket UI:{' '}
                                        <span className="font-medium">
                                          Client Name, Service, Time, Stylist
                                        </span>
                                      </li>
                                    </ul>
                                  </div>}
                                <div>
                                  <h4 className="font-medium text-gray-800 mb-1 flex items-center">
                                    <div className="w-3 h-3 bg-[#8E44AD] rounded-sm mr-2"></div>
                                    Workflow & Rules
                                  </h4>
                                  <ul className="ml-5 space-y-1 text-gray-600 text-xs">
                                    <li>
                                      Lifecycle:{' '}
                                      <span className="font-medium">
                                        {details.organizeBy === 'busyStatus' ? 'Ready/Busy Status Flow' : 'Clock In/Out Only'}
                                      </span>
                                    </li>
                                    <li>
                                      Appointments:{' '}
                                      <span className="font-medium">
                                        {details.showAppointments ? 'Visible' : 'Hidden'}
                                      </span>
                                    </li>
                                    <li>
                                      Ticket flow:{' '}
                                      <span className="font-medium">
                                        {details.ticketRatio > 0 ? 'Active' : 'Disabled'}
                                      </span>
                                    </li>
                                    <li>
                                      Auto-assign:{' '}
                                      <span className="font-medium">
                                        {template === 'frontDeskTicketCenter' ? 'Manual' : 'Automatic'}
                                      </span>
                                    </li>
                                  </ul>
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-800 mb-1 flex items-center">
                                    <div className="w-3 h-3 bg-[#27AE60] rounded-sm mr-2"></div>
                                    Layout Section
                                  </h4>
                                  <ul className="ml-5 space-y-1 text-gray-600 text-xs">
                                    <li>
                                      Width:{' '}
                                      <span className="font-medium">
                                        {template === 'frontDeskTicketCenter' ? 'Compact' : template === 'teamInOut' ? 'Full Screen' : 'Wide'}
                                      </span>
                                    </li>
                                    <li>
                                      Team/Ticket ratio:{' '}
                                      <span className="font-medium">
                                        {details.teamRatio}/
                                        {details.ticketRatio}
                                      </span>
                                    </li>
                                    <li>
                                      Mobile view:{' '}
                                      <span className="font-medium">
                                        {template === 'frontDeskTicketCenter' || template === 'teamWithOperationFlow' ? 'Tabs' : 'Columns'}
                                      </span>
                                    </li>
                                  </ul>
                                </div>
                                <a href="#" className="text-[#27AE60] hover:text-[#219653] text-xs font-medium inline-flex items-center">
                                  <Settings size={12} className="mr-1" />
                                  Customize These Settings
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Template Actions */}
                        <div className="flex justify-between items-center">
                          <button onClick={() => applyTemplate(template)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isSelected ? 'bg-[#27AE60] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                            {isSelected ? 'Selected' : 'Select Template'}
                          </button>
                          {isSelected && <button className="text-gray-500 hover:text-gray-700 text-sm flex items-center" onClick={() => applyTemplate(template)}>
                              <ArrowRight size={14} className="mr-1" />
                              <span>Reset Defaults</span>
                            </button>}
                        </div>
                      </div>
                    </div>;
            })}
              </div> :
          // Mobile Swipeable Card - Same structure as desktop but with navigation
          <div>
                {templates.map((template, index) => {
              const details = getTemplateDetails(template);
              const isSuggested = getSuggestedTemplate() === template;
              const isSelected = settings.operationTemplate === template;
              if (index !== currentTemplateIndex) return null;
              return <div key={template} className={`template-card border-2 rounded-xl overflow-hidden relative ${isSuggested ? 'suggested' : 'border-gray-200'} ${isSelected ? 'selected' : ''}`}>
                      {isSuggested && <div className="absolute -top-2 -right-2 bg-[#FF7B54] text-white text-xs font-medium py-1 px-2.5 rounded-full shadow-sm z-10">
                          Suggested for You
                        </div>}
                      {isSelected && <div className="absolute top-3 right-3 text-[#27AE60] z-10">
                          <CheckCircle size={20} />
                        </div>}
                      {/* Enhanced Template Preview - Same as desktop */}
                      <div className="template-preview h-64 bg-white border-b border-gray-200">
                        {/* Template header */}
                        <div className="bg-gray-100 py-2 px-4 flex items-center justify-between border-b border-gray-200">
                          <div className="flex items-center">
                            <div className="bg-[#27AE60] text-white p-1 rounded mr-2 shadow-sm">
                              <LayoutDashboard size={14} />
                            </div>
                            <h3 className="text-sm font-medium text-gray-800">
                              {details.title}
                            </h3>
                          </div>
                          <span className="text-xs font-medium bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                            {details.teamRatio}/{details.ticketRatio}
                          </span>
                        </div>
                        {/* Template body - realistic mockup */}
                        <div className="flex h-[calc(100%-40px)]">
                          {/* Team Section - Only show if teamRatio > 0 */}
                          {details.teamRatio > 0 && <div className="h-full flex flex-col border-r border-gray-200 overflow-hidden" style={{
                      width: `${details.teamRatio}%`
                    }}>
                              {/* Team Header */}
                              <div className="flex items-center justify-between bg-[#E8F2FF] px-2 py-1.5 border-b border-[#3B82F6]/20">
                                <div className="flex items-center">
                                  <Users size={14} className="text-[#3B82F6] mr-1.5" />
                                  <span className="text-xs font-medium text-[#3B82F6]">
                                    Team
                                  </span>
                                </div>
                                {/* Tab/Column toggle based on teamMode */}
                                {details.teamMode === 'tab' ? <div className="flex text-[10px] bg-[#3B82F6]/10 rounded-sm overflow-hidden">
                                    <div className={`px-1.5 py-0.5 ${details.organizeBy === 'busyStatus' ? 'bg-[#3B82F6] text-white' : 'text-[#3B82F6]'}`}>
                                      Ready
                                    </div>
                                    <div className={`px-1.5 py-0.5 ${details.organizeBy === 'busyStatus' ? 'text-[#3B82F6]' : 'bg-[#3B82F6] text-white'}`}>
                                      Busy
                                    </div>
                                  </div> : <div className="text-[10px] text-[#3B82F6] font-medium">
                                    {details.organizeBy === 'busyStatus' ? 'Ready/Busy' : 'Clocked In/Out'}
                                  </div>}
                              </div>
                              {/* Team Content */}
                              <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5">
                                {details.organizeBy === 'busyStatus' ? <>
                                    {/* Ready Staff */}
                                    <div className="text-[10px] font-medium text-[#27AE60] mb-1 px-0.5">
                                      Ready
                                    </div>
                                    <div className="staff-card bg-white rounded border border-gray-100 shadow-sm p-1.5">
                                      <div className="flex items-center">
                                        <div className="w-4 h-4 rounded-full bg-[#27AE60]/20 flex items-center justify-center mr-1.5">
                                          <div className="w-2 h-2 rounded-full bg-[#27AE60]"></div>
                                        </div>
                                        <span className="text-xs font-medium text-gray-800">
                                          Sarah T.
                                        </span>
                                        {template !== 'teamInOut' && <span className="ml-auto text-[9px] text-[#3B82F6] bg-[#3B82F6]/10 px-1 py-0.5 rounded">
                                            1 client
                                          </span>}
                                      </div>
                                    </div>
                                    {/* Busy Staff */}
                                    <div className="text-[10px] font-medium text-gray-500 mb-1 mt-2 px-0.5">
                                      Busy
                                    </div>
                                    <div className="staff-card bg-white rounded border border-gray-100 shadow-sm p-1.5">
                                      <div className="flex items-center">
                                        <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center mr-1.5">
                                          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                        </div>
                                        <span className="text-xs font-medium text-gray-800">
                                          Mike R.
                                        </span>
                                        {template !== 'teamInOut' && <span className="ml-auto text-[9px] text-amber-600 bg-amber-50 px-1 py-0.5 rounded">
                                            In service
                                          </span>}
                                      </div>
                                    </div>
                                  </> : <>
                                    {/* Clocked In Staff */}
                                    <div className="text-[10px] font-medium text-[#27AE60] mb-1 px-0.5">
                                      Clocked In
                                    </div>
                                    <div className="staff-card bg-white rounded border border-gray-100 shadow-sm p-1.5">
                                      <div className="flex items-center">
                                        <span className="text-xs font-medium text-gray-800">
                                          Sarah T.
                                        </span>
                                        <span className="ml-auto text-[9px] text-[#27AE60] bg-[#27AE60]/10 px-1 py-0.5 rounded">
                                          8:30 AM
                                        </span>
                                      </div>
                                    </div>
                                    <div className="staff-card bg-white rounded border border-gray-100 shadow-sm p-1.5">
                                      <div className="flex items-center">
                                        <span className="text-xs font-medium text-gray-800">
                                          Mike R.
                                        </span>
                                        <span className="ml-auto text-[9px] text-[#27AE60] bg-[#27AE60]/10 px-1 py-0.5 rounded">
                                          9:15 AM
                                        </span>
                                      </div>
                                    </div>
                                    {/* Clocked Out Staff */}
                                    <div className="text-[10px] font-medium text-gray-500 mb-1 mt-2 px-0.5">
                                      Clocked Out
                                    </div>
                                    <div className="staff-card bg-white rounded border border-gray-100 shadow-sm p-1.5 opacity-70">
                                      <div className="flex items-center">
                                        <span className="text-xs font-medium text-gray-600">
                                          Emma S.
                                        </span>
                                      </div>
                                    </div>
                                  </>}
                              </div>
                            </div>}
                          {/* Ticket Section - Only show if ticketRatio > 0 */}
                          {details.ticketRatio > 0 && <div className="h-full flex flex-col border-r border-gray-200 overflow-hidden" style={{
                      width: `${details.ticketRatio}%`
                    }}>
                              {/* Ticket Header */}
                              <div className="flex items-center justify-between bg-[#FFF8E6] px-2 py-1.5 border-b border-[#F59E0B]/20">
                                <div className="flex items-center">
                                  <FileText size={14} className="text-[#F59E0B] mr-1.5" />
                                  <span className="text-xs font-medium text-[#F59E0B]">
                                    Tickets
                                  </span>
                                </div>
                                {/* Tab/Column toggle based on ticketMode */}
                                {details.ticketMode === 'tab' ? <div className="flex text-[10px] bg-[#F59E0B]/10 rounded-sm overflow-hidden">
                                    <div className="px-1.5 py-0.5 bg-[#F59E0B] text-white">
                                      Waiting
                                    </div>
                                    <div className="px-1.5 py-0.5 text-[#F59E0B]">
                                      In Service
                                    </div>
                                  </div> : <div className="text-[10px] text-[#F59E0B] font-medium">
                                    Waitlist + In Service
                                  </div>}
                              </div>
                              {/* Ticket Content */}
                              <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5">
                                {/* Waiting Section */}
                                <div className="text-[10px] font-medium text-gray-500 mb-1 px-0.5">
                                  Waiting
                                </div>
                                <div className="ticket-card bg-white rounded border border-gray-100 shadow-sm p-1.5">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="text-xs font-medium text-gray-800">
                                        John D.
                                      </div>
                                      <div className="text-[9px] text-gray-500">
                                        Haircut + Color
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                      <span className="text-[9px] text-gray-500">
                                        5m
                                      </span>
                                      {template === 'frontDeskTicketCenter' && <span className="text-[9px] text-[#3B82F6] bg-[#3B82F6]/10 px-1 rounded">
                                          Assign
                                        </span>}
                                    </div>
                                  </div>
                                </div>
                                {/* In Service Section */}
                                <div className="text-[10px] font-medium text-gray-500 mb-1 mt-2 px-0.5">
                                  In Service
                                </div>
                                <div className="ticket-card bg-white rounded border border-gray-100 shadow-sm p-1.5">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="text-xs font-medium text-gray-800">
                                        Emma S.
                                      </div>
                                      <div className="text-[9px] text-gray-500">
                                        Full Color
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                      <span className="text-[9px] text-gray-500">
                                        15m
                                      </span>
                                      <span className="text-[9px] text-amber-600">
                                        Mike R.
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>}
                          {/* Appointments Rail - Only show if showAppointments is true */}
                          {details.showAppointments && <div className="absolute bottom-0 left-0 right-0 bg-[#8E44AD]/10 px-2 py-1.5 border-t border-[#8E44AD]/20 flex items-center">
                              <Clock size={14} className="text-[#8E44AD] mr-1.5" />
                              <span className="text-xs font-medium text-[#8E44AD]">
                                Upcoming Appointments
                              </span>
                              <div className="ml-auto flex space-x-1.5">
                                <div className="w-2 h-2 rounded-full bg-[#8E44AD]/40"></div>
                                <div className="w-2 h-2 rounded-full bg-[#8E44AD]"></div>
                                <div className="w-2 h-2 rounded-full bg-[#8E44AD]/40"></div>
                              </div>
                            </div>}
                          {/* Quick Actions for Team In/Out - Only for teamInOut template */}
                          {template === 'teamInOut' && <div className="absolute bottom-4 right-4 flex space-x-2">
                              <div className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center border border-gray-200">
                                <FileText size={14} className="text-gray-600" />
                              </div>
                              <div className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center border border-gray-200">
                                <Clock size={14} className="text-gray-600" />
                              </div>
                            </div>}
                        </div>
                      </div>
                      {/* Template Info */}
                      <div className="p-4 bg-white">
                        <h3 className="text-base font-semibold text-gray-800 mb-1.5 flex items-center">
                          {details.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          {details.description}
                        </p>
                        {/* Pre-Config Settings (Collapsible) */}
                        <div className="mb-4">
                          <button className="w-full flex items-center justify-between p-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors" onClick={() => toggleExpandSettings(template)} aria-expanded={expandedSettings === template}>
                            <span className="flex items-center">
                              <Settings size={14} className="mr-2" />
                              Pre-configured Settings
                            </span>
                            {expandedSettings === template ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                          <div className={`settings-panel mt-3 ${expandedSettings === template ? 'expanded' : ''}`}>
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                              <div className="space-y-3">
                                <div>
                                  <h4 className="font-medium text-gray-800 mb-1 flex items-center">
                                    <div className="w-3 h-3 bg-[#3B82F6] rounded-sm mr-2"></div>
                                    Team Section
                                  </h4>
                                  <ul className="ml-5 space-y-1 text-gray-600 text-xs">
                                    <li>
                                      Width:{' '}
                                      <span className="font-medium">
                                        {details.teamRatio}%
                                      </span>{' '}
                                      of screen
                                    </li>
                                    <li>
                                      Display mode:{' '}
                                      <span className="font-medium">
                                        {details.teamMode === 'column' ? 'Column View' : 'Tab View'}
                                      </span>
                                    </li>
                                    <li>
                                      Card data:{' '}
                                      <span className="font-medium">
                                        Name, Status, Active Ticket
                                      </span>
                                    </li>
                                    <li>
                                      Staff UI:{' '}
                                      <span className="font-medium">
                                        {details.organizeBy === 'busyStatus' ? 'Ready/Busy Status Icons' : 'Clock In/Out Controls'}
                                      </span>
                                    </li>
                                  </ul>
                                </div>
                                {details.ticketRatio > 0 && <div>
                                    <h4 className="font-medium text-gray-800 mb-1 flex items-center">
                                      <div className="w-3 h-3 bg-[#F59E0B] rounded-sm mr-2"></div>
                                      Ticket Section
                                    </h4>
                                    <ul className="ml-5 space-y-1 text-gray-600 text-xs">
                                      <li>
                                        Width:{' '}
                                        <span className="font-medium">
                                          {details.ticketRatio}%
                                        </span>{' '}
                                        of screen
                                      </li>
                                      <li>
                                        Display mode:{' '}
                                        <span className="font-medium">
                                          {details.ticketMode === 'column' ? 'Column View' : 'Tab View'}
                                        </span>
                                      </li>
                                      <li>
                                        Sections:{' '}
                                        <span className="font-medium">
                                          Waiting, In Service, Complete
                                        </span>
                                      </li>
                                      <li>
                                        Ticket UI:{' '}
                                        <span className="font-medium">
                                          Client Name, Service, Time, Stylist
                                        </span>
                                      </li>
                                    </ul>
                                  </div>}
                                <div>
                                  <h4 className="font-medium text-gray-800 mb-1 flex items-center">
                                    <div className="w-3 h-3 bg-[#8E44AD] rounded-sm mr-2"></div>
                                    Workflow & Rules
                                  </h4>
                                  <ul className="ml-5 space-y-1 text-gray-600 text-xs">
                                    <li>
                                      Lifecycle:{' '}
                                      <span className="font-medium">
                                        {details.organizeBy === 'busyStatus' ? 'Ready/Busy Status Flow' : 'Clock In/Out Only'}
                                      </span>
                                    </li>
                                    <li>
                                      Appointments:{' '}
                                      <span className="font-medium">
                                        {details.showAppointments ? 'Visible' : 'Hidden'}
                                      </span>
                                    </li>
                                    <li>
                                      Ticket flow:{' '}
                                      <span className="font-medium">
                                        {details.ticketRatio > 0 ? 'Active' : 'Disabled'}
                                      </span>
                                    </li>
                                    <li>
                                      Auto-assign:{' '}
                                      <span className="font-medium">
                                        {template === 'frontDeskTicketCenter' ? 'Manual' : 'Automatic'}
                                      </span>
                                    </li>
                                  </ul>
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-800 mb-1 flex items-center">
                                    <div className="w-3 h-3 bg-[#27AE60] rounded-sm mr-2"></div>
                                    Layout Section
                                  </h4>
                                  <ul className="ml-5 space-y-1 text-gray-600 text-xs">
                                    <li>
                                      Width:{' '}
                                      <span className="font-medium">
                                        {template === 'frontDeskTicketCenter' ? 'Compact' : template === 'teamInOut' ? 'Full Screen' : 'Wide'}
                                      </span>
                                    </li>
                                    <li>
                                      Team/Ticket ratio:{' '}
                                      <span className="font-medium">
                                        {details.teamRatio}/
                                        {details.ticketRatio}
                                      </span>
                                    </li>
                                    <li>
                                      Mobile view:{' '}
                                      <span className="font-medium">
                                        {template === 'frontDeskTicketCenter' || template === 'teamWithOperationFlow' ? 'Tabs' : 'Columns'}
                                      </span>
                                    </li>
                                  </ul>
                                </div>
                                <a href="#" className="text-[#27AE60] hover:text-[#219653] text-xs font-medium inline-flex items-center">
                                  <Settings size={12} className="mr-1" />
                                  Customize These Settings
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Template Actions */}
                        <div className="flex justify-between items-center">
                          <button onClick={() => applyTemplate(template)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isSelected ? 'bg-[#27AE60] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                            {isSelected ? 'Selected' : 'Select Template'}
                          </button>
                          {isSelected && <button className="text-gray-500 hover:text-gray-700 text-sm flex items-center" onClick={() => applyTemplate(template)}>
                              <ArrowRight size={14} className="mr-1" />
                              <span>Reset Defaults</span>
                            </button>}
                        </div>
                      </div>
                    </div>;
            })}
                {/* Mobile swipe indicators */}
                <div className="swipe-indicator">
                  {templates.map((_, index) => <div key={index} className={index === currentTemplateIndex ? 'active' : ''} onClick={() => setCurrentTemplateIndex(index)} />)}
                </div>
              </div>}
          </section>
        </div>
      </main>
      {/* Footer */}
      <footer className="template-setup-footer px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-white sticky bottom-0 shadow-md">
        <button onClick={onClose} className="px-5 py-2.5 rounded-full border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#27AE60]/30 transition-colors shadow-sm">
          <div className="flex items-center">
            <ArrowLeft size={16} className="mr-2" />
            Back to Settings
          </div>
        </button>
        <button onClick={saveSettings} className={`px-6 py-2.5 rounded-full text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#27AE60]/30 transition-colors shadow-sm ${hasChanges ? 'bg-[#27AE60] hover:bg-[#219653]' : 'bg-[#27AE60]/60 cursor-not-allowed'}`} disabled={!hasChanges}>
          Save & Continue
        </button>
      </footer>
      {/* Toast Notification */}
      <Toast />
    </div>;
};