/**
 * Surveys Query Hooks
 * React Query hooks for survey management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { surveysRepository } from '@/services/supabase/repositories';
import { queryKeys } from './keys';
import {
  Survey,
  SurveyStatus,
  CreateSurveyInput,
  UpdateSurveyInput,
  CreateSurveyResponseInput,
} from '@/types/survey';
import { toast } from 'sonner';

/**
 * Fetch all surveys
 */
export function useSurveys() {
  return useQuery({
    queryKey: queryKeys.surveys.list(),
    queryFn: () => surveysRepository.getAll(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch a single survey by ID
 */
export function useSurvey(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.surveys.detail(id || ''),
    queryFn: () => surveysRepository.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch active surveys
 */
export function useActiveSurveys() {
  return useQuery({
    queryKey: queryKeys.surveys.active(),
    queryFn: () => surveysRepository.getActive(),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Fetch surveys by status
 */
export function useSurveysByStatus(status: SurveyStatus | undefined) {
  return useQuery({
    queryKey: queryKeys.surveys.byStatus(status || ''),
    queryFn: () => surveysRepository.getByStatus(status!),
    enabled: !!status,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch surveys by type
 */
export function useSurveysByType(type: Survey['type'] | undefined) {
  return useQuery({
    queryKey: queryKeys.surveys.byType(type || ''),
    queryFn: () => surveysRepository.getByType(type!),
    enabled: !!type,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch survey responses
 */
export function useSurveyResponses(surveyId: string | undefined, limit?: number) {
  return useQuery({
    queryKey: queryKeys.surveys.responses(surveyId || ''),
    queryFn: () => surveysRepository.getResponses(surveyId!, { limit }),
    enabled: !!surveyId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Fetch survey stats
 */
export function useSurveyStats() {
  return useQuery({
    queryKey: queryKeys.surveys.stats(),
    queryFn: () => surveysRepository.getCountByStatus(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Create a new survey
 */
export function useCreateSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, createdBy }: { data: CreateSurveyInput; createdBy: string }) =>
      surveysRepository.createSurvey(data, createdBy),
    onSuccess: (newSurvey) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.surveys.all });
      toast.success('Survey created', { description: `${newSurvey.name} has been created.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to create survey', { description: error.message });
    },
  });
}

/**
 * Update a survey
 */
export function useUpdateSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSurveyInput }) =>
      surveysRepository.updateSurvey(id, data),
    onSuccess: (updatedSurvey) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.surveys.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.surveys.detail(updatedSurvey.id) });
      toast.success('Survey updated', { description: `${updatedSurvey.name} has been updated.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to update survey', { description: error.message });
    },
  });
}

/**
 * Delete a survey
 */
export function useDeleteSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => surveysRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.surveys.all });
      toast.success('Survey deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete survey', { description: error.message });
    },
  });
}

/**
 * Publish a survey
 */
export function usePublishSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => surveysRepository.publish(id),
    onSuccess: (survey) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.surveys.all });
      toast.success('Survey published', { description: `${survey.name} is now active.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to publish survey', { description: error.message });
    },
  });
}

/**
 * Pause a survey
 */
export function usePauseSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => surveysRepository.pause(id),
    onSuccess: (survey) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.surveys.all });
      toast.success('Survey paused', { description: `${survey.name} has been paused.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to pause survey', { description: error.message });
    },
  });
}

/**
 * Close a survey
 */
export function useCloseSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => surveysRepository.close(id),
    onSuccess: (survey) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.surveys.all });
      toast.success('Survey closed', { description: `${survey.name} is no longer accepting responses.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to close survey', { description: error.message });
    },
  });
}

/**
 * Submit a survey response
 */
export function useSubmitSurveyResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSurveyResponseInput) => surveysRepository.createResponse(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.surveys.responses(response.surveyId) });
      toast.success('Response submitted', { description: 'Thank you for your feedback!' });
    },
    onError: (error: Error) => {
      toast.error('Failed to submit response', { description: error.message });
    },
  });
}
