/**
 * useTechnicianMqtt Hook
 *
 * Subscribes to salon/{id}/staff/status MQTT topic for real-time technician status updates.
 * Updates Redux state when technician status changes.
 */

import { useEffect, useCallback } from 'react';
import { useMqtt } from '../providers/MqttProvider';
import { useAppDispatch, useAppSelector } from '../store';
import { updateTechnicianStatuses, type StaffStatusUpdate } from '../store/slices/technicianSlice';

interface StaffStatusPayload {
  updates: Array<{
    technicianId: string;
    status: 'available' | 'with_client' | 'on_break' | 'unavailable';
    estimatedWaitMinutes?: number;
  }>;
}

export function useTechnicianMqtt() {
  const dispatch = useAppDispatch();
  const { subscribe, isConnected } = useMqtt();
  const storeId = useAppSelector((state) => state.auth.storeId);

  const handleStaffStatusUpdate = useCallback(
    (_topic: string, payload: unknown) => {
      try {
        const data = payload as StaffStatusPayload;
        if (data.updates && Array.isArray(data.updates)) {
          const updates: StaffStatusUpdate[] = data.updates.map((u) => ({
            technicianId: u.technicianId,
            status: u.status,
            estimatedWaitMinutes: u.estimatedWaitMinutes,
          }));
          dispatch(updateTechnicianStatuses(updates));
        }
      } catch (error) {
        console.error('[useTechnicianMqtt] Error parsing staff status update:', error);
      }
    },
    [dispatch]
  );

  useEffect(() => {
    if (!isConnected || !storeId) return;

    const topic = `salon/${storeId}/staff/status`;
    const unsubscribe = subscribe(topic, handleStaffStatusUpdate);

    return () => {
      unsubscribe();
    };
  }, [isConnected, storeId, subscribe, handleStaffStatusUpdate]);

  return { isConnected };
}
