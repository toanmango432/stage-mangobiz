/**
 * Database Health Monitoring Module
 *
 * Provides proactive database health checks and corruption detection.
 *
 * @module sqlite-adapter/health
 */

export {
  // Main service class
  DatabaseHealthService,
  // Factory functions
  createHealthService,
  quickHealthCheck,
  fullHealthCheck,
  // Types
  type HealthCheckResult,
  type DatabaseHealthStatus,
  type BackupInfo,
  type BackupResult,
  type HealthScheduleStatus,
  type CorruptionCallback,
} from './dbHealth';
