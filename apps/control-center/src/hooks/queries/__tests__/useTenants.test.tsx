/**
 * useTenants Hook Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the repository
vi.mock('@/services/supabase/repositories', () => ({
  tenantsRepository: {
    getAll: vi.fn(),
    getById: vi.fn(),
    createTenant: vi.fn(),
    updateTenant: vi.fn(),
    suspend: vi.fn(),
    activate: vi.fn(),
  },
}));

import { tenantsRepository } from '@/services/supabase/repositories';
import { useTenants, useTenant, useCreateTenant, useUpdateTenant } from '../useTenants';

// Helper to create wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('useTenants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useTenants query', () => {
    it('should fetch all tenants', async () => {
      const mockTenants = [
        { id: '1', name: 'Tenant 1', email: 'tenant1@example.com', status: 'active', planType: 'basic', maxStores: 1 },
        { id: '2', name: 'Tenant 2', email: 'tenant2@example.com', status: 'active', planType: 'professional', maxStores: 5 },
      ];

      (tenantsRepository.getAll as any).mockResolvedValue(mockTenants);

      const { result } = renderHook(() => useTenants(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockTenants);
      expect(tenantsRepository.getAll).toHaveBeenCalledTimes(1);
    });

    it('should handle error', async () => {
      const error = new Error('Failed to fetch');
      (tenantsRepository.getAll as any).mockRejectedValue(error);

      const { result } = renderHook(() => useTenants(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('useTenant query', () => {
    it('should fetch single tenant by id', async () => {
      const mockTenant = { id: '1', name: 'Tenant 1', email: 'tenant1@example.com', status: 'active', planType: 'basic', maxStores: 1 };

      (tenantsRepository.getById as any).mockResolvedValue(mockTenant);

      const { result } = renderHook(() => useTenant('1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockTenant);
      expect(tenantsRepository.getById).toHaveBeenCalledWith('1');
    });

    it('should not fetch when id is undefined', async () => {
      const { result } = renderHook(() => useTenant(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(tenantsRepository.getById).not.toHaveBeenCalled();
    });
  });

  describe('useCreateTenant mutation', () => {
    it('should create a tenant', async () => {
      const newTenant = { name: 'New Tenant', email: 'new@example.com', status: 'active' as const, planType: 'basic' as const, maxStores: 1 };
      const createdTenant = { id: '123', ...newTenant };

      (tenantsRepository.createTenant as any).mockResolvedValue(createdTenant);

      const { result } = renderHook(() => useCreateTenant(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync(newTenant);

      expect(tenantsRepository.createTenant).toHaveBeenCalledWith(newTenant);
    });
  });

  describe('useUpdateTenant mutation', () => {
    it('should update a tenant', async () => {
      const updateData = { id: '1', data: { name: 'Updated Name' } };
      const updatedTenant = { id: '1', name: 'Updated Name', email: 'tenant@example.com', status: 'active', planType: 'basic', maxStores: 1 };

      (tenantsRepository.updateTenant as any).mockResolvedValue(updatedTenant);

      const { result } = renderHook(() => useUpdateTenant(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync(updateData);

      expect(tenantsRepository.updateTenant).toHaveBeenCalledWith('1', { name: 'Updated Name' });
    });
  });
});
