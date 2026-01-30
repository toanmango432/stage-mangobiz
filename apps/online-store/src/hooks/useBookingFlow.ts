import { useState, useCallback, useEffect } from 'react';
import { BookingFormData } from '@/types/booking';

const DRAFT_KEY = 'booking-draft';

const DEFAULT_FORM_DATA: Partial<BookingFormData> = {
  addOns: [],
  agreedToPolicies: false,
  isGroup: false,
  groupChoiceMade: false,
  groupSetupComplete: false,
  members: [],
};

export const useBookingFlow = () => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  // SSR-safe: Use default state initially, load from localStorage in useEffect
  const [formData, setFormData] = useState<Partial<BookingFormData>>(DEFAULT_FORM_DATA);

  // Load draft from localStorage after client hydration
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        setFormData(JSON.parse(draft));
      }
    } catch (e) {
      // Ignore corrupted localStorage data
    }
  }, []);

  // Manual save function to prevent re-render loops
  const saveDraft = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
  }, [formData]);

  // Save on window beforeunload
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeUnload = () => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [formData]);

  const updateFormData = useCallback((data: Partial<BookingFormData>) => {
    setFormData((prev) => {
      const newData = { ...prev, ...data };
      
      // If group choice changes, reset everything after
      if (data.isGroup !== undefined && data.isGroup !== prev.isGroup) {
        newData.service = undefined;
        newData.members = [];
        newData.groupSetupComplete = false;
        newData.questionsAnswered = undefined;
        newData.readyForTechnician = false;
        newData.staff = undefined;
        newData.readyForDateTime = false;
        newData.date = undefined;
        newData.time = undefined;
        newData.readyForSummary = false;
      }
      
      // If service changes (solo only), reset progression
      if (!newData.isGroup && data.service && prev.service && data.service.id !== prev.service.id) {
        newData.questionsAnswered = undefined;
        newData.readyForTechnician = false;
        newData.staff = undefined;
        newData.readyForDateTime = false;
        newData.date = undefined;
        newData.time = undefined;
        newData.readyForSummary = false;
      }
      
      // Save draft when important fields change
      if (data.groupChoiceMade || data.service || data.members || data.staff || (data.date && data.time)) {
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(newData));
          }
        }, 0);
      }
      return newData;
    });
  }, []);

  const resetFlow = useCallback(() => {
    setFormData({
      addOns: [],
      agreedToPolicies: false,
      isGroup: false,
      groupChoiceMade: false,
      groupSetupComplete: false,
      members: [],
      questionsAnswered: undefined,
      readyForTechnician: false,
      readyForDateTime: false,
      readyForSummary: false,
    });
    setShowConfirmation(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  // Section completion checks
  const isGroupChoiceMade = formData.groupChoiceMade === true;
  
  // For solo: service selected directly
  // For group: all members have services
  const isServiceSelected = formData.isGroup 
    ? (formData.members && formData.members.length > 0 && formData.members.every(m => !!m.service))
    : !!formData.service;
  
  const areQuestionsAnswered = (() => {
    if (!formData.questionsAnswered) return false;
    
    if (formData.isGroup && formData.members) {
      return formData.members.every(member => {
        if (!member.service) return true;
        const questions = ('questions' in member.service ? member.service.questions : []) || [];
        const requiredQuestions = questions.filter((q: any) => q.required);
        if (requiredQuestions.length === 0) return true;
        return requiredQuestions.every((q: any) => member.answers?.[q.id]);
      });
    } else {
      if (!formData.service) return false;
      const questions = ('questions' in formData.service ? formData.service.questions : []) || [];
      const requiredQuestions = questions.filter((q: any) => q.required);
      if (requiredQuestions.length === 0) return true;
      return requiredQuestions.every((q: any) => formData.serviceQuestions?.[q.id]);
    }
  })();
  
  const isTechnicianSelected = formData.isGroup 
    ? (formData.members?.every(m => m.staff) ?? false)
    : !!formData.staff;
  const isDateTimeSelected = !!(formData.date && formData.time);
  
  // Progressive disclosure - Service selection is ALWAYS visible (first step)
  const showServiceSelection = true; // Always show services first
  const showRequiredQuestions = isServiceSelected; // Show after service selected
  const showTechnicianSection = areQuestionsAnswered && formData.readyForTechnician === true;
  const showDateTimeSection = showTechnicianSection && isTechnicianSelected && formData.readyForDateTime === true;
  const showBookingSummary = showDateTimeSection && isDateTimeSelected && formData.readyForSummary === true;
  
  // Can book when all required sections complete
  const canBookNow = showBookingSummary;

  const handleBookNow = useCallback(() => {
    if (canBookNow) {
      setShowConfirmation(true);
      // Scroll to confirmation section
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  }, [canBookNow]);

  const getTotalPrice = useCallback(() => {
    const servicePrice = formData.service?.price || 0;
    const addOnsTotal = (formData.addOns || []).reduce((sum, addon) => sum + addon.price, 0);
    return servicePrice + addOnsTotal;
  }, [formData]);

  const getTotalDuration = useCallback(() => {
    const serviceDuration = formData.service?.duration || 0;
    const addOnsDuration = (formData.addOns || []).reduce((sum, addon) => sum + addon.duration, 0);
    return serviceDuration + addOnsDuration;
  }, [formData]);

  return {
    formData,
    updateFormData,
    resetFlow,
    showConfirmation,
    setShowConfirmation,
    // Completion flags
    isServiceSelected,
    isGroupChoiceMade,
    areQuestionsAnswered,
    isTechnicianSelected,
    isDateTimeSelected,
    // Progressive disclosure flags
    showServiceSelection,
    showRequiredQuestions,
    showTechnicianSection,
    showDateTimeSection,
    showBookingSummary,
    // Actions
    canBookNow,
    handleBookNow,
    getTotalPrice,
    getTotalDuration,
  };
};
