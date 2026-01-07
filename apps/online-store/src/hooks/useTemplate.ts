/**
 * Template Hook
 * React hook for loading and using templates from localStorage
 */

import { useState, useEffect } from 'react';
import { getPublishedTemplate } from '@/lib/template';
import type { StorefrontTemplate, TemplateSection } from '@/lib/storage/templateStorage';

export function useTemplate() {
  const [template, setTemplate] = useState<StorefrontTemplate | null>(null);
  const [sections, setSections] = useState<TemplateSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadTemplate() {
      try {
        setIsLoading(true);
        const { template: publishedTemplate, sections: templateSections } = await getPublishedTemplate();
        
        if (mounted) {
          setTemplate(publishedTemplate);
          setSections(templateSections);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to load template'));
          console.error('Template loading error:', err);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadTemplate();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    template,
    sections,
    isLoading,
    error,
  };
}
