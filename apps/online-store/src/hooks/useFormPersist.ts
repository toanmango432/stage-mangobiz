import { useState, useEffect } from 'react';

interface UseFormPersistOptions<T> {
  key: string;
  initialValues: T;
  ttl?: number; // Time to live in milliseconds
}

/**
 * Hook to persist form data in localStorage
 * Automatically saves and restores form state
 */
export const useFormPersist = <T extends Record<string, any>>({
  key,
  initialValues,
  ttl,
}: UseFormPersistOptions<T>) => {
  const storageKey = `form-${key}`;
  const timestampKey = `${storageKey}-timestamp`;

  const [values, setValues] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      const timestamp = localStorage.getItem(timestampKey);

      if (stored && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        if (!ttl || age < ttl) {
          return JSON.parse(stored);
        }
      }
    } catch (error) {
      console.error('Error loading persisted form data:', error);
    }
    return initialValues;
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(values));
      localStorage.setItem(timestampKey, Date.now().toString());
    } catch (error) {
      console.error('Error persisting form data:', error);
    }
  }, [values, storageKey, timestampKey]);

  const updateValue = (field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
  };

  const updateValues = (updates: Partial<T>) => {
    setValues(prev => ({ ...prev, ...updates }));
  };

  const clearForm = () => {
    setValues(initialValues);
    try {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(timestampKey);
    } catch (error) {
      console.error('Error clearing form data:', error);
    }
  };

  const resetForm = () => {
    setValues(initialValues);
  };

  return {
    values,
    updateValue,
    updateValues,
    clearForm,
    resetForm,
    setValues,
  };
};
