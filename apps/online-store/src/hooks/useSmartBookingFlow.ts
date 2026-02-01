import { useState, useCallback, useEffect, useRef } from 'react';
import { BookingFormData } from '@/types/booking';

export type SectionState = 'collapsed' | 'expanded' | 'completed' | 'error';

export interface Conflict {
  type: 'time' | 'staff' | 'service';
  message: string;
  suggestion?: string;
}

export interface Alternative {
  type: 'time' | 'staff' | 'service';
  option: any;
  reason: string;
}

export interface SmartBookingFlow {
  // Section states
  sections: {
    groupSelection: { state: SectionState; isExpanded: boolean };
    serviceSelection: { state: SectionState; isExpanded: boolean };
    addOns: { state: SectionState; isExpanded: boolean };
    questions: { state: SectionState; isExpanded: boolean };
    staffSelection: { state: SectionState; isExpanded: boolean };
    dateTime: { state: SectionState; isExpanded: boolean };
    clientInfo: { state: SectionState; isExpanded: boolean };
    agreements: { state: SectionState; isExpanded: boolean };
    payment: { state: SectionState; isExpanded: boolean };
  };

  // Actions
  expandSection: (section: string) => void;
  collapseSection: (section: string) => void;
  completeSection: (section: string, data?: any) => void;
  editSection: (section: string) => void;

  // Smart features
  autoSave: () => void;
  detectConflicts: () => Conflict[];
  suggestAlternatives: () => Alternative[];

  // Form data
  formData: Partial<BookingFormData>;
  updateFormData: (data: Partial<BookingFormData>) => void;

  // Progress
  currentSection: string | null;
  progress: number; // 0-100
  canProceed: boolean;

  // Helper methods for component compatibility
  isSectionExpanded: (section: string) => boolean;
  isSectionCompleted: (section: string) => boolean;
  getProgressPercentage: () => number;
}

const DRAFT_KEY = 'smart-booking-draft';
const AUTO_SAVE_INTERVAL = 2000; // 2 seconds

export const useSmartBookingFlow = (): SmartBookingFlow => {
  const [formData, setFormData] = useState<Partial<BookingFormData>>(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    return draft ? JSON.parse(draft) : { 
      addOns: [], 
      agreedToPolicies: false,
      isGroup: false,
      groupChoiceMade: false,
      groupSetupComplete: false,
      members: [],
    };
  });

  const [sections, setSections] = useState({
    groupSelection: { state: 'expanded' as SectionState, isExpanded: true },
    serviceSelection: { state: 'collapsed' as SectionState, isExpanded: false },
    addOns: { state: 'collapsed' as SectionState, isExpanded: false },
    questions: { state: 'collapsed' as SectionState, isExpanded: false },
    staffSelection: { state: 'collapsed' as SectionState, isExpanded: false },
    dateTime: { state: 'collapsed' as SectionState, isExpanded: false },
    clientInfo: { state: 'collapsed' as SectionState, isExpanded: false },
    agreements: { state: 'collapsed' as SectionState, isExpanded: false },
    payment: { state: 'collapsed' as SectionState, isExpanded: false },
  });

  const [currentSection, setCurrentSection] = useState<string | null>('groupSelection');
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Auto-save functionality
  const autoSave = useCallback(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
  }, [formData]);

  // Debounced auto-save
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, AUTO_SAVE_INTERVAL);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formData, autoSave]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      autoSave();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [autoSave]);

  const updateFormData = useCallback((data: Partial<BookingFormData>) => {
    setFormData((prev) => {
      const newData = { ...prev, ...data };
      
      // Auto-expand next section based on completion
      if (data.groupChoiceMade && !prev.groupChoiceMade) {
        setSections(prev => ({
          ...prev,
          groupSelection: { state: 'completed', isExpanded: false },
          serviceSelection: { state: 'expanded', isExpanded: true }
        }));
        setCurrentSection('serviceSelection');
      }
      
      if (data.service && !prev.service) {
        setSections(prev => ({
          ...prev,
          serviceSelection: { state: 'completed', isExpanded: false },
          addOns: { state: 'expanded', isExpanded: true }
        }));
        setCurrentSection('addOns');
      }
      
      if (data.addOns && data.addOns.length > 0 && (!prev.addOns || prev.addOns.length === 0)) {
        setSections(prev => ({
          ...prev,
          addOns: { state: 'completed', isExpanded: false },
          questions: { state: 'expanded', isExpanded: true }
        }));
        setCurrentSection('questions');
      }
      
      if (data.questionsAnswered && !prev.questionsAnswered) {
        setSections(prev => ({
          ...prev,
          questions: { state: 'completed', isExpanded: false },
          staffSelection: { state: 'expanded', isExpanded: true }
        }));
        setCurrentSection('staffSelection');
      }
      
      if (data.staff && !prev.staff) {
        setSections(prev => ({
          ...prev,
          staffSelection: { state: 'completed', isExpanded: false },
          dateTime: { state: 'expanded', isExpanded: true }
        }));
        setCurrentSection('dateTime');
      }
      
      if (data.date && data.time && (!prev.date || !prev.time)) {
        setSections(prev => ({
          ...prev,
          dateTime: { state: 'completed', isExpanded: false },
          clientInfo: { state: 'expanded', isExpanded: true }
        }));
        setCurrentSection('clientInfo');
      }
      
      return newData;
    });
  }, []);

  const expandSection = useCallback((section: string) => {
    setSections(prev => ({
      ...prev,
      [section]: { state: 'expanded', isExpanded: true }
    }));
    setCurrentSection(section);
  }, []);

  const collapseSection = useCallback((section: string) => {
    setSections(prev => ({
      ...prev,
      [section]: { state: 'collapsed', isExpanded: false }
    }));
    if (currentSection === section) {
      setCurrentSection(null);
    }
  }, [currentSection]);

  const completeSection = useCallback((section: string, data?: any) => {
    setSections(prev => ({
      ...prev,
      [section]: { state: 'completed', isExpanded: true }
    }));
    
    // Update form data with completed section data
    if (data) {
      updateFormData(data);
    }
    
    // Auto-collapse after 1 second
    setTimeout(() => {
      setSections(prev => ({
        ...prev,
        [section]: { state: 'completed', isExpanded: false }
      }));
    }, 1000);
  }, [updateFormData]);

  const editSection = useCallback((section: string) => {
    setSections(prev => ({
      ...prev,
      [section]: { state: 'expanded', isExpanded: true }
    }));
    setCurrentSection(section);
  }, []);

  // Conflict detection
  const detectConflicts = useCallback((): Conflict[] => {
    const conflicts: Conflict[] = [];
    
    // Check for time conflicts
    if (formData.date && formData.time) {
      // This would integrate with actual availability checking
      // For now, just a placeholder
    }
    
    // Check for staff conflicts
    if (formData.staff && formData.date && formData.time) {
      // This would check if staff is available at the selected time
    }
    
    return conflicts;
  }, [formData]);

  // Alternative suggestions
  const suggestAlternatives = useCallback((): Alternative[] => {
    const alternatives: Alternative[] = [];
    
    // Suggest alternative times if current time is unavailable
    if (formData.date && formData.time) {
      alternatives.push({
        type: 'time',
        option: { date: formData.date, time: '10:00 AM' },
        reason: 'Earlier time available'
      });
    }
    
    return alternatives;
  }, [formData]);

  // Calculate progress
  const progress = useCallback(() => {
    const totalSections = Object.keys(sections).length;
    const completedSections = Object.values(sections).filter(s => s.state === 'completed').length;
    return Math.round((completedSections / totalSections) * 100);
  }, [sections]);

  // Helper methods for component compatibility
  const isSectionExpanded = useCallback((section: string): boolean => {
    const sectionData = sections[section as keyof typeof sections];
    return sectionData ? sectionData.isExpanded : false;
  }, [sections]);

  const isSectionCompleted = useCallback((section: string): boolean => {
    const sectionData = sections[section as keyof typeof sections];
    return sectionData ? sectionData.state === 'completed' : false;
  }, [sections]);

  const getProgressPercentage = useCallback((): number => {
    return progress();
  }, [progress]);

  // Check if can proceed
  const canProceed = useCallback(() => {
    return !!(
      formData.groupChoiceMade &&
      formData.service &&
      formData.staff &&
      formData.date &&
      formData.time
    );
  }, [formData]);

  return {
    sections,
    expandSection,
    collapseSection,
    completeSection,
    editSection,
    autoSave,
    detectConflicts,
    suggestAlternatives,
    formData,
    updateFormData,
    currentSection,
    progress: progress(),
    canProceed: canProceed(),
    isSectionExpanded,
    isSectionCompleted,
    getProgressPercentage,
  };
};
