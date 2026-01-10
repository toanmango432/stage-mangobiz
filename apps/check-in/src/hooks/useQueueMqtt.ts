/**
 * useQueueMqtt Hook
 *
 * Subscribes to salon/{id}/queue/status MQTT topic for real-time queue position updates.
 * Updates Redux state when queue status changes.
 */

import { useEffect, useCallback } from 'react';
import { useMqtt } from '../providers/MqttProvider';
import { useAppDispatch, useAppSelector } from '../store';
import { setQueuePosition, setEstimatedWaitMinutes, setQueueStatus } from '../store/slices/checkinSlice';
import type { QueueStatus, QueuePosition } from '../types';

interface QueueStatusPayload {
  totalInQueue: number;
  averageWaitMinutes: number;
  positions: Array<{
    checkInId: string;
    position: number;
    estimatedWaitMinutes: number;
  }>;
  lastUpdated: string;
}

export function useQueueMqtt() {
  const dispatch = useAppDispatch();
  const { subscribe, isConnected } = useMqtt();
  const storeId = useAppSelector((state) => state.auth.storeId);
  const completedCheckInId = useAppSelector((state) => state.checkin.completedCheckInId);

  const handleQueueStatusUpdate = useCallback(
    (_topic: string, payload: unknown) => {
      try {
        const data = payload as QueueStatusPayload;
        if (!data || typeof data !== 'object') return;

        const queueStatus: QueueStatus = {
          totalInQueue: data.totalInQueue ?? 0,
          averageWaitMinutes: data.averageWaitMinutes ?? 0,
          positions: (data.positions ?? []).map((p): QueuePosition => ({
            checkInId: p.checkInId,
            position: p.position,
            estimatedWaitMinutes: p.estimatedWaitMinutes,
          })),
          lastUpdated: data.lastUpdated ?? new Date().toISOString(),
        };

        dispatch(setQueueStatus(queueStatus));

        if (completedCheckInId && data.positions) {
          const myPosition = data.positions.find((p) => p.checkInId === completedCheckInId);
          if (myPosition) {
            dispatch(setQueuePosition(myPosition.position));
            dispatch(setEstimatedWaitMinutes(myPosition.estimatedWaitMinutes));
          }
        }
      } catch (error) {
        console.error('[useQueueMqtt] Error parsing queue status update:', error);
      }
    },
    [dispatch, completedCheckInId]
  );

  useEffect(() => {
    if (!isConnected || !storeId) return;

    const topic = `salon/${storeId}/queue/status`;
    const unsubscribe = subscribe(topic, handleQueueStatusUpdate);

    return () => {
      unsubscribe();
    };
  }, [isConnected, storeId, subscribe, handleQueueStatusUpdate]);

  return { isConnected };
}
