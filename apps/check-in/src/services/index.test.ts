import { describe, it, expect } from 'vitest';
import * as services from './index';

describe('services barrel exports', () => {
  it('should export dataService', () => {
    expect(services.dataService).toBeDefined();
    expect(typeof services.dataService).toBe('object');
  });

  it('should export supabase', () => {
    expect(services.supabase).toBeDefined();
  });

  it('should export db', () => {
    expect(services.db).toBeDefined();
  });

  it('should export smsService', () => {
    expect(services.smsService).toBeDefined();
    expect(typeof services.smsService).toBe('object');
  });

  it('should export analyticsService', () => {
    expect(services.analyticsService).toBeDefined();
    expect(typeof services.analyticsService).toBe('object');
  });

  it('should have dataService with clients module', () => {
    expect(services.dataService.clients).toBeDefined();
  });

  it('should have dataService with services module', () => {
    expect(services.dataService.services).toBeDefined();
  });

  it('should have dataService with checkins module', () => {
    expect(services.dataService.checkins).toBeDefined();
  });

  it('should have dataService with technicians module', () => {
    expect(services.dataService.technicians).toBeDefined();
  });

  it('should have analyticsService with track method', () => {
    expect(services.analyticsService.track).toBeDefined();
    expect(typeof services.analyticsService.track).toBe('function');
  });

  it('should have smsService with sendQueueCalledNotification method', () => {
    expect(services.smsService.sendQueueCalledNotification).toBeDefined();
    expect(typeof services.smsService.sendQueueCalledNotification).toBe('function');
  });
});
