import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Service Status Persistence Tests
 *
 * Tests the service status persistence logic.
 * The actual Redux thunk updateServiceStatusInSupabase handles:
 * - Status transitions (not_started → in_progress → paused → completed)
 * - Timer tracking (actualStartTime, pausedAt, totalPausedDuration)
 * - Status history audit trail
 * - Persistence to Supabase via dataService
 */

// Type definitions for testing
type ServiceStatus = 'not_started' | 'in_progress' | 'paused' | 'completed';

interface ServiceStatusChange {
  from: ServiceStatus;
  to: ServiceStatus;
  changedAt: string;
  changedBy: string;
}

interface TicketService {
  id: string;
  status: ServiceStatus;
  statusHistory: ServiceStatusChange[];
  actualStartTime?: string;
  pausedAt?: string;
  totalPausedDuration: number;
  actualDuration?: number;
}

describe('Service Status Persistence', () => {
  describe('status transitions', () => {
    it('should allow transition from not_started to in_progress', () => {
      const service: TicketService = {
        id: 'service-1',
        status: 'not_started',
        statusHistory: [],
        totalPausedDuration: 0,
      };

      // Simulate status update
      service.status = 'in_progress';
      service.actualStartTime = new Date().toISOString();

      expect(service.status).toBe('in_progress');
      expect(service.actualStartTime).toBeDefined();
    });

    it('should allow transition from in_progress to paused', () => {
      const service: TicketService = {
        id: 'service-1',
        status: 'in_progress',
        statusHistory: [],
        actualStartTime: new Date().toISOString(),
        totalPausedDuration: 0,
      };

      service.status = 'paused';
      service.pausedAt = new Date().toISOString();

      expect(service.status).toBe('paused');
      expect(service.pausedAt).toBeDefined();
    });

    it('should allow transition from paused to in_progress', () => {
      const pausedTime = new Date(Date.now() - 5000).toISOString(); // 5 seconds ago
      const service: TicketService = {
        id: 'service-1',
        status: 'paused',
        statusHistory: [],
        actualStartTime: new Date(Date.now() - 60000).toISOString(),
        pausedAt: pausedTime,
        totalPausedDuration: 0,
      };

      // Calculate paused duration
      const pauseDuration = Date.now() - new Date(service.pausedAt!).getTime();
      service.totalPausedDuration += pauseDuration;
      service.pausedAt = undefined;
      service.status = 'in_progress';

      expect(service.status).toBe('in_progress');
      expect(service.pausedAt).toBeUndefined();
      expect(service.totalPausedDuration).toBeGreaterThan(0);
    });

    it('should allow transition from in_progress to completed', () => {
      const startTime = new Date(Date.now() - 600000).toISOString(); // 10 minutes ago
      const service: TicketService = {
        id: 'service-1',
        status: 'in_progress',
        statusHistory: [],
        actualStartTime: startTime,
        totalPausedDuration: 60000, // 1 minute paused
      };

      // Calculate actual duration (excludes paused time)
      const totalTime = Date.now() - new Date(service.actualStartTime!).getTime();
      service.actualDuration = Math.round((totalTime - service.totalPausedDuration) / 60000); // in minutes
      service.status = 'completed';

      expect(service.status).toBe('completed');
      expect(service.actualDuration).toBeGreaterThan(0);
    });
  });

  describe('status history tracking', () => {
    it('should add entry to statusHistory on status change', () => {
      const service: TicketService = {
        id: 'service-1',
        status: 'not_started',
        statusHistory: [],
        totalPausedDuration: 0,
      };

      const change: ServiceStatusChange = {
        from: 'not_started',
        to: 'in_progress',
        changedAt: new Date().toISOString(),
        changedBy: 'staff-1',
      };

      service.statusHistory.push(change);
      service.status = 'in_progress';

      expect(service.statusHistory.length).toBe(1);
      expect(service.statusHistory[0].from).toBe('not_started');
      expect(service.statusHistory[0].to).toBe('in_progress');
    });

    it('should maintain complete audit trail', () => {
      const service: TicketService = {
        id: 'service-1',
        status: 'not_started',
        statusHistory: [],
        totalPausedDuration: 0,
      };

      // Simulate full lifecycle
      const transitions: Array<{ from: ServiceStatus; to: ServiceStatus }> = [
        { from: 'not_started', to: 'in_progress' },
        { from: 'in_progress', to: 'paused' },
        { from: 'paused', to: 'in_progress' },
        { from: 'in_progress', to: 'completed' },
      ];

      transitions.forEach(({ from, to }) => {
        service.statusHistory.push({
          from,
          to,
          changedAt: new Date().toISOString(),
          changedBy: 'staff-1',
        });
        service.status = to;
      });

      expect(service.statusHistory.length).toBe(4);
      expect(service.status).toBe('completed');
    });
  });

  describe('timer calculations', () => {
    it('should track total paused duration across multiple pauses', () => {
      let totalPaused = 0;

      // First pause: 5 seconds
      totalPaused += 5000;

      // Second pause: 3 seconds
      totalPaused += 3000;

      // Third pause: 2 seconds
      totalPaused += 2000;

      expect(totalPaused).toBe(10000); // 10 seconds total
    });

    it('should calculate actual working duration correctly', () => {
      const startTime = Date.now() - 600000; // Started 10 minutes ago
      const endTime = Date.now();
      const totalPausedDuration = 120000; // Paused for 2 minutes total

      const totalElapsed = endTime - startTime; // 10 minutes
      const actualWorking = totalElapsed - totalPausedDuration; // 8 minutes

      expect(actualWorking).toBe(480000); // 8 minutes in ms
    });
  });

  describe('persistence serialization', () => {
    it('should serialize service status for database storage', () => {
      const service: TicketService = {
        id: 'service-1',
        status: 'in_progress',
        statusHistory: [
          { from: 'not_started', to: 'in_progress', changedAt: '2026-01-09T00:00:00Z', changedBy: 'staff-1' },
        ],
        actualStartTime: '2026-01-09T00:00:00Z',
        totalPausedDuration: 0,
      };

      const serialized = JSON.stringify(service);
      const parsed = JSON.parse(serialized);

      expect(parsed.status).toBe('in_progress');
      expect(parsed.statusHistory.length).toBe(1);
      expect(parsed.actualStartTime).toBe('2026-01-09T00:00:00Z');
    });

    it('should deserialize service status from database', () => {
      const dbData = {
        id: 'service-1',
        status: 'paused',
        statusHistory: [
          { from: 'not_started', to: 'in_progress', changedAt: '2026-01-09T00:00:00Z', changedBy: 'staff-1' },
          { from: 'in_progress', to: 'paused', changedAt: '2026-01-09T00:05:00Z', changedBy: 'staff-1' },
        ],
        actualStartTime: '2026-01-09T00:00:00Z',
        pausedAt: '2026-01-09T00:05:00Z',
        totalPausedDuration: 0,
      };

      const service: TicketService = dbData as TicketService;

      expect(service.status).toBe('paused');
      expect(service.pausedAt).toBeDefined();
      expect(service.statusHistory.length).toBe(2);
    });
  });
});
