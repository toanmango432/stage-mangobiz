/**
 * Sync Queue Service for Mango Pad
 * Handles offline message queuing and replay when connection is restored
 */

import { v4 as uuidv4 } from 'uuid';

export interface QueuedMessage<T = unknown> {
  id: string;
  topic: string;
  payload: T;
  timestamp: string;
  attempts: number;
  priority: number;
}

type ReplayHandler = (message: QueuedMessage) => Promise<boolean>;

const STORAGE_KEY = 'mango-pad-sync-queue';
const MAX_RETRY_ATTEMPTS = 3;
const OFFLINE_ALERT_THRESHOLD_MS = 30000;

class SyncQueueService {
  private queue: QueuedMessage[] = [];
  private replayHandler: ReplayHandler | null = null;
  private isReplaying = false;
  private offlineStartTime: number | null = null;
  private offlineAlertCallback: ((durationMs: number) => void) | null = null;
  private offlineCheckInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.loadFromStorage();
  }

  setReplayHandler(handler: ReplayHandler): void {
    this.replayHandler = handler;
  }

  setOfflineAlertCallback(callback: (durationMs: number) => void): void {
    this.offlineAlertCallback = callback;
  }

  enqueue<T>(topic: string, payload: T, priority: number = 1): string {
    const message: QueuedMessage<T> = {
      id: uuidv4(),
      topic,
      payload,
      timestamp: new Date().toISOString(),
      attempts: 0,
      priority,
    };

    this.queue.push(message as QueuedMessage);
    this.queue.sort((a, b) => b.priority - a.priority);
    this.saveToStorage();

    return message.id;
  }

  getQueue(): QueuedMessage[] {
    return [...this.queue];
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  clearQueue(): void {
    this.queue = [];
    this.saveToStorage();
  }

  removeMessage(id: string): void {
    this.queue = this.queue.filter((m) => m.id !== id);
    this.saveToStorage();
  }

  async replayQueue(): Promise<{ success: number; failed: number }> {
    if (this.isReplaying || !this.replayHandler || this.queue.length === 0) {
      return { success: 0, failed: 0 };
    }

    this.isReplaying = true;
    let success = 0;
    let failed = 0;

    const messagesToReplay = [...this.queue];

    for (const message of messagesToReplay) {
      message.attempts += 1;

      try {
        const sent = await this.replayHandler(message);
        if (sent) {
          this.removeMessage(message.id);
          success += 1;
        } else if (message.attempts >= MAX_RETRY_ATTEMPTS) {
          this.removeMessage(message.id);
          failed += 1;
          console.warn(`[SyncQueue] Message ${message.id} failed after ${MAX_RETRY_ATTEMPTS} attempts`);
        }
      } catch (error) {
        if (message.attempts >= MAX_RETRY_ATTEMPTS) {
          this.removeMessage(message.id);
          failed += 1;
          console.error(`[SyncQueue] Message ${message.id} failed with error:`, error);
        }
      }
    }

    this.isReplaying = false;
    return { success, failed };
  }

  startOfflineTracking(): void {
    if (this.offlineStartTime !== null) return;

    this.offlineStartTime = Date.now();
    this.startOfflineAlertCheck();
  }

  stopOfflineTracking(): void {
    this.offlineStartTime = null;
    if (this.offlineCheckInterval) {
      clearInterval(this.offlineCheckInterval);
      this.offlineCheckInterval = null;
    }
  }

  getOfflineDuration(): number {
    if (this.offlineStartTime === null) return 0;
    return Date.now() - this.offlineStartTime;
  }

  isOfflineAlertThresholdReached(): boolean {
    return this.getOfflineDuration() >= OFFLINE_ALERT_THRESHOLD_MS;
  }

  private startOfflineAlertCheck(): void {
    if (this.offlineCheckInterval) return;

    this.offlineCheckInterval = setInterval(() => {
      if (this.isOfflineAlertThresholdReached() && this.offlineAlertCallback) {
        this.offlineAlertCallback(this.getOfflineDuration());
        if (this.offlineCheckInterval) {
          clearInterval(this.offlineCheckInterval);
          this.offlineCheckInterval = null;
        }
      }
    }, 5000);
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[SyncQueue] Failed to load from storage:', error);
      this.queue = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('[SyncQueue] Failed to save to storage:', error);
    }
  }
}

export const syncQueueService = new SyncQueueService();
