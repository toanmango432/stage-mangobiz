import Dexie, { Table } from 'dexie';
import type {
  Tenant,
  License,
  Store,
  Member,
  Device,
  AdminUser,
  AdminSession,
  AuditLog,
  FeatureFlag,
  SystemConfig,
  Announcement,
  AnnouncementInteraction,
  Survey,
  SurveyResponse,
} from '@/types';

/**
 * Admin Database Schema
 * Separate database for the Control Center / Admin Portal
 * Uses IndexedDB via Dexie.js for local development
 * Can be swapped to a REST API backend for production
 */
export class AdminDatabase extends Dexie {
  tenants!: Table<Tenant, string>;
  licenses!: Table<License, string>;
  stores!: Table<Store, string>;
  members!: Table<Member, string>;
  devices!: Table<Device, string>;
  adminUsers!: Table<AdminUser, string>;
  adminSessions!: Table<AdminSession, string>;
  auditLogs!: Table<AuditLog, string>;
  featureFlags!: Table<FeatureFlag, string>;
  systemConfig!: Table<SystemConfig, string>;
  announcements!: Table<Announcement, string>;
  announcementInteractions!: Table<AnnouncementInteraction, string>;
  surveys!: Table<Survey, string>;
  surveyResponses!: Table<SurveyResponse, string>;

  constructor() {
    super('mango_admin_db');

    // Version 6: Added surveys and survey responses for feedback collection
    this.version(6).stores({
      // Tenants - customers who purchase licenses
      tenants: 'id, email, status, createdAt, [status+createdAt]',

      // Licenses - issued to tenants
      licenses: 'id, tenantId, licenseKey, tier, status, expiresAt, createdAt, [tenantId+status], [status+createdAt]',

      // Stores - POS instances with login credentials
      stores: 'id, licenseId, tenantId, storeLoginId, status, lastSeenAt, createdAt, [licenseId+status], [tenantId+status]',

      // Members - users who can access POS (staff, managers, admins)
      members: 'id, tenantId, email, role, status, createdAt, [tenantId+status], [tenantId+role], [email]',

      // Devices - specific machines/browsers that access POS
      devices: 'id, storeId, licenseId, tenantId, deviceFingerprint, status, lastSeenAt, [storeId+status], [licenseId+status]',

      // Admin users - people who can access the Control Center
      adminUsers: 'id, email, role, isActive, [role+isActive]',

      // Admin sessions - active login sessions
      adminSessions: 'id, userId, token, expiresAt, [userId+expiresAt]',

      // Audit logs - track all actions
      auditLogs: 'id, action, entityType, entityId, adminUserId, createdAt, [entityType+entityId], [adminUserId+createdAt], [action+createdAt]',

      // Feature flags - control feature availability
      featureFlags: 'id, key, category, globallyEnabled, createdAt, [category+globallyEnabled]',

      // System configuration - default store setup
      systemConfig: 'id',

      // Announcements - multi-channel notifications with targeting
      announcements: 'id, category, severity, priority, status, *channels, createdAt, publishedAt, [status+priority], [status+category], [category+status]',

      // Announcement interactions - track user engagement
      announcementInteractions: 'id, announcementId, tenantId, userId, storeId, action, channel, timestamp, [announcementId+action], [tenantId+announcementId], [announcementId+timestamp]',

      // Surveys - feedback collection forms
      surveys: 'id, type, status, createdAt, publishedAt, [status+type], [status+createdAt]',

      // Survey responses - user feedback data
      surveyResponses: 'id, surveyId, tenantId, storeId, userId, completedAt, sentiment, [surveyId+completedAt], [tenantId+surveyId], [surveyId+sentiment]',
    });
  }
}

// Create singleton instance
export const adminDb = new AdminDatabase();

/**
 * Initialize admin database
 */
export async function initializeAdminDatabase(): Promise<boolean> {
  try {
    await adminDb.open();
    console.log('✅ Admin IndexedDB initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Admin IndexedDB:', error);
    return false;
  }
}

/**
 * Clear all admin data (for testing/reset)
 */
export async function clearAdminDatabase(): Promise<void> {
  await adminDb.tenants.clear();
  await adminDb.licenses.clear();
  await adminDb.stores.clear();
  await adminDb.members.clear();
  await adminDb.devices.clear();
  await adminDb.adminUsers.clear();
  await adminDb.adminSessions.clear();
  await adminDb.auditLogs.clear();
  await adminDb.featureFlags.clear();
  await adminDb.systemConfig.clear();
  await adminDb.announcements.clear();
  await adminDb.announcementInteractions.clear();
  await adminDb.surveys.clear();
  await adminDb.surveyResponses.clear();
  console.log('🗑️ Admin database cleared');
}

/**
 * Seed admin database with initial data (for development)
 */
export async function seedAdminDatabase(): Promise<void> {
  const { tenantsDB, licensesDB, storesDB, membersDB, adminUsersDB, featureFlagsDB, systemConfigDB } = await import('./database');

  // Check if already seeded
  const existingAdmins = await adminDb.adminUsers.count();
  if (existingAdmins > 0) {
    console.log('ℹ️ Admin database already seeded');
    return;
  }

  console.log('🌱 Seeding admin database...');

  // Create default super admin (for Control Center)
  await adminUsersDB.create({
    email: 'admin@mangobiz.com',
    password: 'admin123',
    name: 'Super Admin',
    role: 'super_admin',
  });

  // Create a demo tenant
  const demoTenant = await tenantsDB.create({
    name: 'Demo Salon',
    email: 'owner@demosalon.com',
    phone: '555-0100',
    company: 'Demo Salon LLC',
  });

  // Create a demo license for the tenant
  const demoLicense = await licensesDB.create({
    tenantId: demoTenant.id,
    tier: 'professional',
    notes: 'Demo license for testing',
  });

  // Create a demo store with login credentials
  const demoStore = await storesDB.create({
    licenseId: demoLicense.id,
    tenantId: demoTenant.id,
    name: 'Demo Salon Downtown',
    storeEmail: 'demo@salon.com',
    password: 'demo123',
    address: '123 Main St, Downtown',
    phone: '555-0101',
  });

  // Create a demo owner/admin member
  await membersDB.create({
    tenantId: demoTenant.id,
    storeIds: [demoStore.id],
    name: 'Salon Owner',
    email: 'owner@demosalon.com',
    password: 'owner123',
    pin: '1234',
    role: 'admin',
  });

  // Create a demo staff member
  await membersDB.create({
    tenantId: demoTenant.id,
    storeIds: [demoStore.id],
    name: 'Jane Technician',
    email: 'jane@demosalon.com',
    password: 'jane123',
    pin: '5678',
    role: 'staff',
  });

  // Seed default feature flags
  await featureFlagsDB.seedDefaults();

  // Seed default system configuration
  await systemConfigDB.seedDefaults();

  console.log('');
  console.log('✅ Admin database seeded with demo data');
  console.log('');
  console.log('   Control Center (Super Admin):');
  console.log('     Email: admin@mangobiz.com');
  console.log('     Password: admin123');
  console.log('');
  console.log('   Demo Store Login:');
  console.log('     Store ID: demo@salon.com');
  console.log('     Password: demo123');
  console.log('');
  console.log('   Demo Member Logins:');
  console.log('     Owner: owner@demosalon.com / owner123 (PIN: 1234)');
  console.log('     Staff: jane@demosalon.com / jane123 (PIN: 5678)');
  console.log('');
}
