import { useEffect, useState, useRef, RefObject } from 'react';
import { getTemplateSettings, getTemplateMetadata, getAllTemplateIds } from '../../frontdesk-settings/templateConfigs';
import type { FrontDeskSettingsData } from '../../frontdesk-settings/FrontDeskSettings';
import type { QuickAnswers, TemplateDetails } from '../types';
import { TOAST_DISPLAY_DURATION, SCROLL_DELAY, MOBILE_BREAKPOINT } from '../constants';

interface UseOperationTemplateSetupParams {
  currentSettings: FrontDeskSettingsData;
  onSettingsChange: (settings: FrontDeskSettingsData) => void;
  onClose: () => void;
}

interface UseOperationTemplateSetupReturn {
  // State
  settings: FrontDeskSettingsData;
  hasChanges: boolean;
  quickAnswers: QuickAnswers;
  showToast: boolean;
  expandedSettings: string | null;
  isMobile: boolean;
  currentTemplateIndex: number;
  templates: string[];
  // Refs
  suggestedTemplateRef: RefObject<HTMLDivElement>;
  question1Ref: RefObject<HTMLDivElement>;
  question2Ref: RefObject<HTMLDivElement>;
  question3Ref: RefObject<HTMLDivElement>;
  // Methods
  getSuggestedTemplate: () => FrontDeskSettingsData['operationTemplate'];
  getTemplateDetails: (template: FrontDeskSettingsData['operationTemplate'] | string) => TemplateDetails;
  applyTemplate: (template: FrontDeskSettingsData['operationTemplate']) => void;
  updateQuickAnswer: (key: keyof QuickAnswers, value: QuickAnswers[keyof QuickAnswers]) => void;
  saveSettings: () => void;
  toggleExpandSettings: (section: string) => void;
  navigateTemplate: (direction: 'next' | 'prev') => void;
}

export function useOperationTemplateSetup({
  currentSettings,
  onSettingsChange,
  onClose
}: UseOperationTemplateSetupParams): UseOperationTemplateSetupReturn {
  // State
  const [settings, setSettings] = useState<FrontDeskSettingsData>(currentSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [quickAnswers, setQuickAnswers] = useState<QuickAnswers>({
    primaryFocus: currentSettings.viewWidth === 'fullScreen' || currentSettings.viewWidth === 'wide' && currentSettings.customWidthPercentage >= 60 ? 'staff' : 'frontDesk',
    operationStyle: currentSettings.organizeBy === 'busyStatus' ? 'flow' : 'inOut',
    showAppointments: currentSettings.showComingAppointments
  });
  const [showToast, setShowToast] = useState(false);
  const [expandedSettings, setExpandedSettings] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);
  const [currentTemplateIndex, setCurrentTemplateIndex] = useState(0);

  // Refs
  const suggestedTemplateRef = useRef<HTMLDivElement>(null);
  const question1Ref = useRef<HTMLDivElement>(null);
  const question2Ref = useRef<HTMLDivElement>(null);
  const question3Ref = useRef<HTMLDivElement>(null);

  // Template cards array - ISSUE-001: Use centralized template list
  const templates = getAllTemplateIds();

  // Get suggested template based on quick answers
  const getSuggestedTemplate = (): FrontDeskSettingsData['operationTemplate'] => {
    if (quickAnswers.primaryFocus === 'frontDesk') {
      return quickAnswers.operationStyle === 'flow' ? 'frontDeskBalanced' : 'frontDeskTicketCenter';
    } else {
      return quickAnswers.operationStyle === 'flow' ? 'teamWithOperationFlow' : 'teamInOut';
    }
  };

  // Get template details - ISSUE-001: Use centralized template metadata
  // Returns extended metadata with computed ratios for UI display
  const getTemplateDetails = (template: FrontDeskSettingsData['operationTemplate'] | string): TemplateDetails => {
    const metadata = getTemplateMetadata(template as FrontDeskSettingsData['operationTemplate']);
    return {
      ...metadata,
      teamRatio: metadata.layoutRatio.team,
      ticketRatio: metadata.layoutRatio.ticket,
    };
  };

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
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
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
        }, SCROLL_DELAY);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickAnswers, isMobile, templates]);

  // Apply template presets
  // ISSUE-001: Use centralized template config
  const applyTemplate = (template: FrontDeskSettingsData['operationTemplate']) => {
    const newSettings = getTemplateSettings(template);
    // Update settings and mark changes
    const updatedSettings = {
      ...settings,
      ...newSettings
    };
    setSettings(updatedSettings);
    setHasChanges(true);
    // Update quick answers based on template
    setQuickAnswers({
      primaryFocus: template === 'teamWithOperationFlow' || template === 'teamInOut' ? 'staff' : 'frontDesk',
      operationStyle: template === 'teamInOut' ? 'inOut' : 'flow',
      showAppointments: template !== 'teamInOut'
    });
    // BUG-015 FIX: Auto-save template selection to Redux
    // This ensures template changes are immediately applied without requiring manual save
    onSettingsChange(updatedSettings);
  };

  // Update quick answers and apply changes
  const updateQuickAnswer = (key: keyof QuickAnswers, value: QuickAnswers[keyof QuickAnswers]) => {
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
    }, SCROLL_DELAY);
  };

  // Save settings and close with toast notification
  const saveSettings = () => {
    onSettingsChange(settings);
    setShowToast(true);
    // Hide toast after configured duration
    setTimeout(() => {
      setShowToast(false);
      onClose();
    }, TOAST_DISPLAY_DURATION);
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

  return {
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
  };
}
