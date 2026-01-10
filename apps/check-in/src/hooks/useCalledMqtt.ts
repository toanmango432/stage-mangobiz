/**
 * useCalledMqtt Hook
 *
 * Subscribes to salon/{id}/checkin/called MQTT topic for client called notifications.
 * Updates Redux state when the current client is called from the queue.
 * Plays audio notification when called.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useMqtt } from '../providers/MqttProvider';
import { useAppDispatch, useAppSelector } from '../store';
import { setClientCalled, type CalledInfo } from '../store/slices/checkinSlice';

interface CalledPayload {
  checkInId: string;
  checkInNumber: string;
  technicianId?: string;
  technicianName?: string;
  station?: string;
  calledAt: string;
}

export function useCalledMqtt() {
  const dispatch = useAppDispatch();
  const { subscribe, isConnected } = useMqtt();
  const storeId = useAppSelector((state) => state.auth.storeId);
  const completedCheckInId = useAppSelector((state) => state.checkin.completedCheckInId);
  const checkInNumber = useAppSelector((state) => state.checkin.checkInNumber);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/sounds/notification.mp3');
    audioRef.current.load();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.warn('[useCalledMqtt] Could not play notification sound:', err);
      });
    }
  }, []);

  const handleCalledUpdate = useCallback(
    (_topic: string, payload: unknown) => {
      try {
        const data = payload as CalledPayload;
        if (!data || typeof data !== 'object') return;

        const isMyCheckIn =
          (completedCheckInId && data.checkInId === completedCheckInId) ||
          (checkInNumber && data.checkInNumber === checkInNumber);

        if (isMyCheckIn) {
          const calledInfo: CalledInfo = {
            technicianId: data.technicianId ?? null,
            technicianName: data.technicianName ?? null,
            station: data.station ?? null,
            calledAt: data.calledAt ?? new Date().toISOString(),
          };

          dispatch(setClientCalled(calledInfo));
          playNotificationSound();
        }
      } catch (error) {
        console.error('[useCalledMqtt] Error parsing called update:', error);
      }
    },
    [dispatch, completedCheckInId, checkInNumber, playNotificationSound]
  );

  useEffect(() => {
    if (!isConnected || !storeId) return;

    const topic = `salon/${storeId}/checkin/called`;
    const unsubscribe = subscribe(topic, handleCalledUpdate);

    return () => {
      unsubscribe();
    };
  }, [isConnected, storeId, subscribe, handleCalledUpdate]);

  return { isConnected };
}
