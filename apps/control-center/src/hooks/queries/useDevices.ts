/**
 * Devices Query Hooks
 * React Query hooks for device management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { devicesRepository } from '@/services/supabase/repositories';
import { queryKeys } from './keys';
import { Device } from '@/types/device';
import { toast } from 'sonner';

/**
 * Fetch all devices
 */
export function useDevices() {
  return useQuery({
    queryKey: queryKeys.devices.list(),
    queryFn: () => devicesRepository.getAll({ orderBy: 'last_seen_at', orderDirection: 'desc' }),
    staleTime: 2 * 60 * 1000, // 2 minutes - devices change more frequently
  });
}

/**
 * Fetch a single device by ID
 */
export function useDevice(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.devices.detail(id || ''),
    queryFn: () => devicesRepository.getById(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Fetch devices by store
 */
export function useDevicesByStore(storeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.devices.byStore(storeId || ''),
    queryFn: () => devicesRepository.getByStore(storeId!),
    enabled: !!storeId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Fetch devices by license
 */
export function useDevicesByLicense(licenseId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.devices.byLicense(licenseId || ''),
    queryFn: () => devicesRepository.getByLicense(licenseId!),
    enabled: !!licenseId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Fetch device stats
 */
export function useDeviceStats() {
  return useQuery({
    queryKey: queryKeys.devices.stats(),
    queryFn: () => devicesRepository.getCountByStatus(),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Block a device
 */
export function useBlockDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => devicesRepository.block(id),
    onSuccess: (device) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.devices.all });
      toast.success('Device blocked', { description: `${device.name} has been blocked.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to block device', { description: error.message });
    },
  });
}

/**
 * Unblock a device
 */
export function useUnblockDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => devicesRepository.unblock(id),
    onSuccess: (device) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.devices.all });
      toast.success('Device unblocked', { description: `${device.name} has been unblocked.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to unblock device', { description: error.message });
    },
  });
}

/**
 * Update device name
 */
export function useUpdateDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Device> }) =>
      devicesRepository.updateDevice(id, data),
    onSuccess: (device) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.devices.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.devices.detail(device.id) });
      toast.success('Device updated', { description: `${device.name} has been updated.` });
    },
    onError: (error: Error) => {
      toast.error('Failed to update device', { description: error.message });
    },
  });
}

/**
 * Delete a device
 */
export function useDeleteDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => devicesRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.devices.all });
      toast.success('Device deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete device', { description: error.message });
    },
  });
}
