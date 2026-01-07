import { useState, useEffect } from 'react';
import { CheckoutFormData } from '@/types/order';

const STORAGE_KEY = 'mango-checkout-draft';

const defaultFormData: CheckoutFormData = {
  email: '',
  phone: '',
  createAccount: false,
  newsletter: false,
  shippingType: 'shipping',
  sameAsBilling: true,
  agreeToTerms: false,
  agreeToPrivacy: false,
};

export const useCheckout = () => {
  const [formData, setFormData] = useState<CheckoutFormData>(defaultFormData);
  const [currentStep, setCurrentStep] = useState(1);

  // Load saved data on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load checkout data:', e);
      }
    }
  }, []);

  // Auto-save on changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const updateFormData = (data: Partial<CheckoutFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const clearCheckoutData = () => {
    setFormData(defaultFormData);
    setCurrentStep(1);
    localStorage.removeItem(STORAGE_KEY);
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  return {
    formData,
    updateFormData,
    clearCheckoutData,
    currentStep,
    goToStep,
    nextStep,
    prevStep,
  };
};
