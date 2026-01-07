/**
 * System Config Query Hooks
 * React Query hooks for system configuration management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemConfigRepository } from '@/services/supabase/repositories';
import { queryKeys } from './keys';
import {
  SystemConfig,
  UpdateSystemConfigInput,
  TaxSetting,
  ServiceCategory,
  ServiceItem,
  EmployeeRole,
  PaymentMethod,
} from '@/types/systemConfig';
import { toast } from 'sonner';

// ============================================================================
// MAIN CONFIG
// ============================================================================

/**
 * Fetch system configuration
 */
export function useSystemConfig() {
  return useQuery({
    queryKey: queryKeys.systemConfig.config(),
    queryFn: () => systemConfigRepository.get(),
    staleTime: 10 * 60 * 1000, // 10 minutes - config rarely changes
  });
}

/**
 * Update system configuration
 */
export function useUpdateSystemConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, updatedBy }: { data: UpdateSystemConfigInput; updatedBy?: string }) =>
      systemConfigRepository.updateConfig(data, updatedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.systemConfig.all });
      toast.success('Configuration updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update configuration', { description: error.message });
    },
  });
}

/**
 * Reset to defaults
 */
export function useResetSystemConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updatedBy?: string) => systemConfigRepository.resetToDefaults(updatedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.systemConfig.all });
      toast.success('Configuration reset to defaults');
    },
    onError: (error: Error) => {
      toast.error('Failed to reset configuration', { description: error.message });
    },
  });
}

// ============================================================================
// TAX SETTINGS
// ============================================================================

/**
 * Fetch tax settings
 */
export function useTaxSettings() {
  return useQuery({
    queryKey: queryKeys.systemConfig.taxes(),
    queryFn: () => systemConfigRepository.getTaxes(),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Add a tax setting
 */
export function useAddTax() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tax, updatedBy }: { tax: Omit<TaxSetting, 'id'>; updatedBy?: string }) =>
      systemConfigRepository.addTax(tax, updatedBy),
    onSuccess: (newTax) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.systemConfig.all });
      toast.success('Tax added', { description: `${newTax.name} has been added.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to add tax', { description: error.message });
    },
  });
}

/**
 * Update a tax setting
 */
export function useUpdateTax() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates, updatedBy }: { id: string; updates: Partial<TaxSetting>; updatedBy?: string }) =>
      systemConfigRepository.updateTax(id, updates, updatedBy),
    onSuccess: (updatedTax) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.systemConfig.all });
      toast.success('Tax updated', { description: `${updatedTax.name} has been updated.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to update tax', { description: error.message });
    },
  });
}

/**
 * Delete a tax setting
 */
export function useDeleteTax() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updatedBy }: { id: string; updatedBy?: string }) =>
      systemConfigRepository.deleteTax(id, updatedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.systemConfig.all });
      toast.success('Tax deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete tax', { description: error.message });
    },
  });
}

// ============================================================================
// SERVICE CATEGORIES
// ============================================================================

/**
 * Fetch service categories
 */
export function useServiceCategories() {
  return useQuery({
    queryKey: queryKeys.systemConfig.categories(),
    queryFn: () => systemConfigRepository.getCategories(),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Add a service category
 */
export function useAddCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ category, updatedBy }: { category: Omit<ServiceCategory, 'id'>; updatedBy?: string }) =>
      systemConfigRepository.addCategory(category, updatedBy),
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.systemConfig.all });
      toast.success('Category added', { description: `${newCategory.name} has been added.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to add category', { description: error.message });
    },
  });
}

/**
 * Update a service category
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates, updatedBy }: { id: string; updates: Partial<ServiceCategory>; updatedBy?: string }) =>
      systemConfigRepository.updateCategory(id, updates, updatedBy),
    onSuccess: (updatedCategory) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.systemConfig.all });
      toast.success('Category updated', { description: `${updatedCategory.name} has been updated.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to update category', { description: error.message });
    },
  });
}

/**
 * Delete a service category
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updatedBy }: { id: string; updatedBy?: string }) =>
      systemConfigRepository.deleteCategory(id, updatedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.systemConfig.all });
      toast.success('Category deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete category', { description: error.message });
    },
  });
}

// ============================================================================
// SERVICE ITEMS
// ============================================================================

/**
 * Fetch service items
 */
export function useServiceItems() {
  return useQuery({
    queryKey: queryKeys.systemConfig.items(),
    queryFn: () => systemConfigRepository.getItems(),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Add a service item
 */
export function useAddServiceItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ item, updatedBy }: { item: Omit<ServiceItem, 'id'>; updatedBy?: string }) =>
      systemConfigRepository.addItem(item, updatedBy),
    onSuccess: (newItem) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.systemConfig.all });
      toast.success('Service added', { description: `${newItem.name} has been added.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to add service', { description: error.message });
    },
  });
}

/**
 * Update a service item
 */
export function useUpdateServiceItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates, updatedBy }: { id: string; updates: Partial<ServiceItem>; updatedBy?: string }) =>
      systemConfigRepository.updateItem(id, updates, updatedBy),
    onSuccess: (updatedItem) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.systemConfig.all });
      toast.success('Service updated', { description: `${updatedItem.name} has been updated.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to update service', { description: error.message });
    },
  });
}

/**
 * Delete a service item
 */
export function useDeleteServiceItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updatedBy }: { id: string; updatedBy?: string }) =>
      systemConfigRepository.deleteItem(id, updatedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.systemConfig.all });
      toast.success('Service deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete service', { description: error.message });
    },
  });
}

// ============================================================================
// EMPLOYEE ROLES
// ============================================================================

/**
 * Fetch employee roles
 */
export function useEmployeeRoles() {
  return useQuery({
    queryKey: queryKeys.systemConfig.roles(),
    queryFn: () => systemConfigRepository.getRoles(),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Add an employee role
 */
export function useAddRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ role, updatedBy }: { role: Omit<EmployeeRole, 'id'>; updatedBy?: string }) =>
      systemConfigRepository.addRole(role, updatedBy),
    onSuccess: (newRole) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.systemConfig.all });
      toast.success('Role added', { description: `${newRole.name} has been added.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to add role', { description: error.message });
    },
  });
}

/**
 * Update an employee role
 */
export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates, updatedBy }: { id: string; updates: Partial<EmployeeRole>; updatedBy?: string }) =>
      systemConfigRepository.updateRole(id, updates, updatedBy),
    onSuccess: (updatedRole) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.systemConfig.all });
      toast.success('Role updated', { description: `${updatedRole.name} has been updated.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to update role', { description: error.message });
    },
  });
}

/**
 * Delete an employee role
 */
export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updatedBy }: { id: string; updatedBy?: string }) =>
      systemConfigRepository.deleteRole(id, updatedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.systemConfig.all });
      toast.success('Role deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete role', { description: error.message });
    },
  });
}

// ============================================================================
// PAYMENT METHODS
// ============================================================================

/**
 * Fetch payment methods
 */
export function usePaymentMethods() {
  return useQuery({
    queryKey: queryKeys.systemConfig.paymentMethods(),
    queryFn: () => systemConfigRepository.getPaymentMethods(),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Add a payment method
 */
export function useAddPaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ method, updatedBy }: { method: Omit<PaymentMethod, 'id'>; updatedBy?: string }) =>
      systemConfigRepository.addPaymentMethod(method, updatedBy),
    onSuccess: (newMethod) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.systemConfig.all });
      toast.success('Payment method added', { description: `${newMethod.name} has been added.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to add payment method', { description: error.message });
    },
  });
}

/**
 * Update a payment method
 */
export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates, updatedBy }: { id: string; updates: Partial<PaymentMethod>; updatedBy?: string }) =>
      systemConfigRepository.updatePaymentMethod(id, updates, updatedBy),
    onSuccess: (updatedMethod) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.systemConfig.all });
      toast.success('Payment method updated', { description: `${updatedMethod.name} has been updated.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to update payment method', { description: error.message });
    },
  });
}

/**
 * Delete a payment method
 */
export function useDeletePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updatedBy }: { id: string; updatedBy?: string }) =>
      systemConfigRepository.deletePaymentMethod(id, updatedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.systemConfig.all });
      toast.success('Payment method deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete payment method', { description: error.message });
    },
  });
}
