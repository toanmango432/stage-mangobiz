import { v4 as uuidv4 } from 'uuid';
import { adminDb } from './schema';
import type {
  Tenant,
  CreateTenantInput,
  UpdateTenantInput,
  License,
  CreateLicenseInput,
  UpdateLicenseInput,
  Store,
  CreateStoreInput,
  UpdateStoreInput,
  Member,
  CreateMemberInput,
  UpdateMemberInput,
  Device,
  CreateDeviceInput,
  UpdateDeviceInput,
  AdminUser,
  CreateAdminUserInput,
  UpdateAdminUserInput,
  AdminSession,
  AuditLog,
  CreateAuditLogInput,
  FeatureFlag,
  CreateFeatureFlagInput,
  UpdateFeatureFlagInput,
  SystemConfig,
  UpdateSystemConfigInput,
  Announcement,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
  AnnouncementStatus,
  AnnouncementInteraction,
  DeliveryChannel,
  AnnouncementCategory,
  AnnouncementStats,
  Survey,
  SurveyResponse,
  SurveyStatus,
  SurveyType,
  SurveyStats,
  CreateSurveyInput,
  UpdateSurveyInput,
  CreateSurveyResponseInput,
  SurveyQuestion,
} from '../types';
import { CATEGORY_CONFIG, PRIORITY_CONFIG } from '../types/announcement';
import {
  SURVEY_TYPE_CONFIG,
  createEmptySurveyStats,
  createDefaultAppearance,
  createDefaultThankYou,
  calculateNPSScore,
  calculateAverageScore,
  analyzeSentiment,
} from '../types/survey';
import { DEFAULT_FEATURE_FLAGS } from '../types/featureFlag';
import { DEFAULT_SYSTEM_CONFIG } from '../types/systemConfig';
import { LICENSE_TIER_CONFIG } from '../types/license';
import { generateStoreLoginId } from '../types/store';
import { MEMBER_ROLE_PERMISSIONS } from '../types/member';
import { generateLicenseKey } from '../utils/licenseKeyGenerator';
import { hashPassword, verifyPassword } from '../utils/auth';

// Re-export adminDb for external use
export { adminDb };

// ==================== TENANTS ====================

export const tenantsDB = {
  async getAll(limit: number = 100, offset: number = 0): Promise<Tenant[]> {
    return await adminDb.tenants
      .orderBy('createdAt')
      .reverse()
      .offset(offset)
      .limit(limit)
      .toArray();
  },

  async getById(id: string): Promise<Tenant | undefined> {
    return await adminDb.tenants.get(id);
  },

  async getByEmail(email: string): Promise<Tenant | undefined> {
    return await adminDb.tenants.where('email').equals(email).first();
  },

  async getByStatus(status: string, limit: number = 100): Promise<Tenant[]> {
    return await adminDb.tenants
      .where('status')
      .equals(status)
      .limit(limit)
      .toArray();
  },

  async search(query: string, limit: number = 50): Promise<Tenant[]> {
    const lowerQuery = query.toLowerCase();
    return await adminDb.tenants
      .filter(tenant =>
        tenant.name.toLowerCase().includes(lowerQuery) ||
        tenant.email.toLowerCase().includes(lowerQuery) ||
        (tenant.company?.toLowerCase().includes(lowerQuery) || false)
      )
      .limit(limit)
      .toArray();
  },

  async create(input: CreateTenantInput): Promise<Tenant> {
    const now = new Date();
    const tenant: Tenant = {
      id: uuidv4(),
      ...input,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    await adminDb.tenants.add(tenant);
    return tenant;
  },

  async update(id: string, updates: UpdateTenantInput): Promise<Tenant | undefined> {
    const tenant = await adminDb.tenants.get(id);
    if (!tenant) return undefined;

    const updated: Tenant = {
      ...tenant,
      ...updates,
      updatedAt: new Date(),
    };

    await adminDb.tenants.put(updated);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    const tenant = await adminDb.tenants.get(id);
    if (!tenant) return false;

    await adminDb.tenants.delete(id);
    return true;
  },

  async suspend(id: string): Promise<Tenant | undefined> {
    return await this.update(id, { status: 'suspended' });
  },

  async activate(id: string): Promise<Tenant | undefined> {
    return await this.update(id, { status: 'active' });
  },

  async count(): Promise<number> {
    return await adminDb.tenants.count();
  },

  async countByStatus(status: string): Promise<number> {
    return await adminDb.tenants.where('status').equals(status).count();
  },
};

// ==================== LICENSES ====================

export const licensesDB = {
  async getAll(limit: number = 100, offset: number = 0): Promise<License[]> {
    return await adminDb.licenses
      .orderBy('createdAt')
      .reverse()
      .offset(offset)
      .limit(limit)
      .toArray();
  },

  async getById(id: string): Promise<License | undefined> {
    return await adminDb.licenses.get(id);
  },

  async getByLicenseKey(licenseKey: string): Promise<License | undefined> {
    return await adminDb.licenses.where('licenseKey').equals(licenseKey).first();
  },

  async getByTenantId(tenantId: string, limit: number = 100): Promise<License[]> {
    return await adminDb.licenses
      .where('tenantId')
      .equals(tenantId)
      .limit(limit)
      .toArray();
  },

  async getByStatus(status: string, limit: number = 100): Promise<License[]> {
    return await adminDb.licenses
      .where('status')
      .equals(status)
      .limit(limit)
      .toArray();
  },

  async getExpiring(days: number = 30, limit: number = 100): Promise<License[]> {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return await adminDb.licenses
      .where('status')
      .equals('active')
      .filter(license =>
        license.expiresAt !== undefined &&
        license.expiresAt > now &&
        license.expiresAt <= future
      )
      .limit(limit)
      .toArray();
  },

  async create(input: CreateLicenseInput): Promise<License> {
    const now = new Date();
    const tierConfig = LICENSE_TIER_CONFIG[input.tier];

    const license: License = {
      id: uuidv4(),
      tenantId: input.tenantId,
      licenseKey: generateLicenseKey(),
      tier: input.tier,
      status: 'active',
      maxStores: input.maxStores ?? tierConfig.maxStores,
      maxDevicesPerStore: input.maxDevicesPerStore ?? tierConfig.maxDevicesPerStore,
      features: input.features ?? tierConfig.features,
      expiresAt: input.expiresAt,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };

    await adminDb.licenses.add(license);
    return license;
  },

  async update(id: string, updates: UpdateLicenseInput): Promise<License | undefined> {
    const license = await adminDb.licenses.get(id);
    if (!license) return undefined;

    const updated: License = {
      ...license,
      ...updates,
      updatedAt: new Date(),
    };

    await adminDb.licenses.put(updated);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    const license = await adminDb.licenses.get(id);
    if (!license) return false;

    await adminDb.licenses.delete(id);
    return true;
  },

  async revoke(id: string): Promise<License | undefined> {
    return await this.update(id, { status: 'revoked' });
  },

  async activate(id: string): Promise<License | undefined> {
    const license = await adminDb.licenses.get(id);
    if (!license) return undefined;

    return await this.update(id, {
      status: 'active',
      ...(!license.activatedAt ? { activatedAt: new Date() } : {}),
    } as UpdateLicenseInput);
  },

  async recordValidation(id: string): Promise<License | undefined> {
    const license = await adminDb.licenses.get(id);
    if (!license) return undefined;

    const updated: License = {
      ...license,
      lastValidatedAt: new Date(),
      updatedAt: new Date(),
    };

    await adminDb.licenses.put(updated);
    return updated;
  },

  async count(): Promise<number> {
    return await adminDb.licenses.count();
  },

  async countByStatus(status: string): Promise<number> {
    return await adminDb.licenses.where('status').equals(status).count();
  },

  async countByTenant(tenantId: string): Promise<number> {
    return await adminDb.licenses.where('tenantId').equals(tenantId).count();
  },
};

// ==================== STORES ====================

export const storesDB = {
  async getAll(limit: number = 100, offset: number = 0): Promise<Store[]> {
    return await adminDb.stores
      .orderBy('createdAt')
      .reverse()
      .offset(offset)
      .limit(limit)
      .toArray();
  },

  async getById(id: string): Promise<Store | undefined> {
    return await adminDb.stores.get(id);
  },

  async getByStoreLoginId(storeLoginId: string): Promise<Store | undefined> {
    return await adminDb.stores.where('storeLoginId').equals(storeLoginId.toLowerCase()).first();
  },

  async getByLicenseId(licenseId: string, limit: number = 100): Promise<Store[]> {
    return await adminDb.stores
      .where('licenseId')
      .equals(licenseId)
      .limit(limit)
      .toArray();
  },

  async getByTenantId(tenantId: string, limit: number = 100): Promise<Store[]> {
    return await adminDb.stores
      .where('tenantId')
      .equals(tenantId)
      .limit(limit)
      .toArray();
  },

  async create(input: CreateStoreInput): Promise<Store> {
    const now = new Date();
    const storeLoginId = generateStoreLoginId(input.storeEmail);

    const store: Store = {
      id: uuidv4(),
      licenseId: input.licenseId,
      tenantId: input.tenantId,
      name: input.name,
      address: input.address,
      phone: input.phone,
      timezone: input.timezone,
      storeLoginId,
      passwordHash: await hashPassword(input.password),
      status: 'active',
      deviceCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    await adminDb.stores.add(store);
    return store;
  },

  async update(id: string, updates: UpdateStoreInput): Promise<Store | undefined> {
    const store = await adminDb.stores.get(id);
    if (!store) return undefined;

    const updated: Store = {
      ...store,
      ...updates,
      ...(updates.password ? { passwordHash: await hashPassword(updates.password) } : {}),
      updatedAt: new Date(),
    };

    // Remove password field if present
    delete (updated as any).password;

    await adminDb.stores.put(updated);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    const store = await adminDb.stores.get(id);
    if (!store) return false;

    await adminDb.stores.delete(id);
    return true;
  },

  async verifyPassword(storeLoginId: string, password: string): Promise<Store | null> {
    const store = await this.getByStoreLoginId(storeLoginId);
    if (!store) return null;

    const isValid = await verifyPassword(password, store.passwordHash);
    if (!isValid) return null;

    return store;
  },

  async recordLogin(id: string): Promise<Store | undefined> {
    const store = await adminDb.stores.get(id);
    if (!store) return undefined;

    const updated: Store = {
      ...store,
      lastLoginAt: new Date(),
      lastSeenAt: new Date(),
      activatedAt: store.activatedAt || new Date(),
      updatedAt: new Date(),
    };

    await adminDb.stores.put(updated);
    return updated;
  },

  async recordActivity(id: string): Promise<Store | undefined> {
    const store = await adminDb.stores.get(id);
    if (!store) return undefined;

    const updated: Store = {
      ...store,
      lastSeenAt: new Date(),
      updatedAt: new Date(),
    };

    await adminDb.stores.put(updated);
    return updated;
  },

  async incrementDeviceCount(id: string): Promise<Store | undefined> {
    const store = await adminDb.stores.get(id);
    if (!store) return undefined;

    const updated: Store = {
      ...store,
      deviceCount: store.deviceCount + 1,
      updatedAt: new Date(),
    };

    await adminDb.stores.put(updated);
    return updated;
  },

  async decrementDeviceCount(id: string): Promise<Store | undefined> {
    const store = await adminDb.stores.get(id);
    if (!store) return undefined;

    const updated: Store = {
      ...store,
      deviceCount: Math.max(0, store.deviceCount - 1),
      updatedAt: new Date(),
    };

    await adminDb.stores.put(updated);
    return updated;
  },

  async count(): Promise<number> {
    return await adminDb.stores.count();
  },

  async countByLicense(licenseId: string): Promise<number> {
    return await adminDb.stores.where('licenseId').equals(licenseId).count();
  },
};

// ==================== MEMBERS ====================

export const membersDB = {
  async getAll(limit: number = 100, offset: number = 0): Promise<Member[]> {
    return await adminDb.members
      .orderBy('createdAt')
      .reverse()
      .offset(offset)
      .limit(limit)
      .toArray();
  },

  async getById(id: string): Promise<Member | undefined> {
    return await adminDb.members.get(id);
  },

  async getByEmail(email: string): Promise<Member | undefined> {
    return await adminDb.members.where('email').equals(email.toLowerCase()).first();
  },

  async getByTenantId(tenantId: string, limit: number = 100): Promise<Member[]> {
    return await adminDb.members
      .where('tenantId')
      .equals(tenantId)
      .limit(limit)
      .toArray();
  },

  async getByStoreId(storeId: string, limit: number = 100): Promise<Member[]> {
    return await adminDb.members
      .filter(member => member.storeIds.includes(storeId))
      .limit(limit)
      .toArray();
  },

  async getByRole(tenantId: string, role: string, limit: number = 100): Promise<Member[]> {
    return await adminDb.members
      .where('[tenantId+role]')
      .equals([tenantId, role])
      .limit(limit)
      .toArray();
  },

  async search(tenantId: string, query: string, limit: number = 50): Promise<Member[]> {
    const lowerQuery = query.toLowerCase();
    return await adminDb.members
      .where('tenantId')
      .equals(tenantId)
      .filter(member =>
        member.name.toLowerCase().includes(lowerQuery) ||
        member.email.toLowerCase().includes(lowerQuery)
      )
      .limit(limit)
      .toArray();
  },

  async create(input: CreateMemberInput): Promise<Member> {
    const now = new Date();
    const rolePermissions = MEMBER_ROLE_PERMISSIONS[input.role];

    const member: Member = {
      id: uuidv4(),
      tenantId: input.tenantId,
      storeIds: input.storeIds,
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone,
      passwordHash: await hashPassword(input.password),
      pin: input.pin,
      role: input.role,
      permissions: input.permissions ?? rolePermissions,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    await adminDb.members.add(member);
    return member;
  },

  async update(id: string, updates: UpdateMemberInput): Promise<Member | undefined> {
    const member = await adminDb.members.get(id);
    if (!member) return undefined;

    const updated: Member = {
      ...member,
      ...updates,
      ...(updates.email ? { email: updates.email.toLowerCase() } : {}),
      ...(updates.password ? { passwordHash: await hashPassword(updates.password) } : {}),
      updatedAt: new Date(),
    };

    // Remove password field if present
    delete (updated as any).password;

    await adminDb.members.put(updated);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    const member = await adminDb.members.get(id);
    if (!member) return false;

    await adminDb.members.delete(id);
    return true;
  },

  async verifyPassword(email: string, password: string): Promise<Member | null> {
    const member = await this.getByEmail(email);
    if (!member) return null;

    const isValid = await verifyPassword(password, member.passwordHash);
    if (!isValid) return null;

    return member;
  },

  async verifyPin(email: string, pin: string): Promise<Member | null> {
    const member = await this.getByEmail(email);
    if (!member || !member.pin) return null;

    if (member.pin !== pin) return null;

    return member;
  },

  async recordLogin(id: string): Promise<Member | undefined> {
    const member = await adminDb.members.get(id);
    if (!member) return undefined;

    const updated: Member = {
      ...member,
      lastLoginAt: new Date(),
      lastActiveAt: new Date(),
      updatedAt: new Date(),
    };

    await adminDb.members.put(updated);
    return updated;
  },

  async recordActivity(id: string): Promise<Member | undefined> {
    const member = await adminDb.members.get(id);
    if (!member) return undefined;

    const updated: Member = {
      ...member,
      lastActiveAt: new Date(),
      updatedAt: new Date(),
    };

    await adminDb.members.put(updated);
    return updated;
  },

  async addToStore(id: string, storeId: string): Promise<Member | undefined> {
    const member = await adminDb.members.get(id);
    if (!member) return undefined;

    if (member.storeIds.includes(storeId)) return member;

    const updated: Member = {
      ...member,
      storeIds: [...member.storeIds, storeId],
      updatedAt: new Date(),
    };

    await adminDb.members.put(updated);
    return updated;
  },

  async removeFromStore(id: string, storeId: string): Promise<Member | undefined> {
    const member = await adminDb.members.get(id);
    if (!member) return undefined;

    const updated: Member = {
      ...member,
      storeIds: member.storeIds.filter(sid => sid !== storeId),
      updatedAt: new Date(),
    };

    await adminDb.members.put(updated);
    return updated;
  },

  async suspend(id: string): Promise<Member | undefined> {
    return await this.update(id, { status: 'suspended' });
  },

  async activate(id: string): Promise<Member | undefined> {
    return await this.update(id, { status: 'active' });
  },

  async count(): Promise<number> {
    return await adminDb.members.count();
  },

  async countByTenant(tenantId: string): Promise<number> {
    return await adminDb.members.where('tenantId').equals(tenantId).count();
  },

  async countByStore(storeId: string): Promise<number> {
    return await adminDb.members
      .filter(member => member.storeIds.includes(storeId))
      .count();
  },
};

// ==================== DEVICES ====================

export const devicesDB = {
  async getAll(limit: number = 100, offset: number = 0): Promise<Device[]> {
    return await adminDb.devices
      .orderBy('createdAt')
      .reverse()
      .offset(offset)
      .limit(limit)
      .toArray();
  },

  async getById(id: string): Promise<Device | undefined> {
    return await adminDb.devices.get(id);
  },

  async getByFingerprint(fingerprint: string): Promise<Device | undefined> {
    return await adminDb.devices.where('deviceFingerprint').equals(fingerprint).first();
  },

  async getByStoreId(storeId: string, limit: number = 100): Promise<Device[]> {
    return await adminDb.devices
      .where('storeId')
      .equals(storeId)
      .limit(limit)
      .toArray();
  },

  async getByLicenseId(licenseId: string, limit: number = 100): Promise<Device[]> {
    return await adminDb.devices
      .where('licenseId')
      .equals(licenseId)
      .limit(limit)
      .toArray();
  },

  async create(input: CreateDeviceInput): Promise<Device> {
    const now = new Date();
    const device: Device = {
      id: uuidv4(),
      ...input,
      status: 'active',
      lastSeenAt: now,
      createdAt: now,
      updatedAt: now,
    };

    await adminDb.devices.add(device);
    return device;
  },

  async update(id: string, updates: UpdateDeviceInput): Promise<Device | undefined> {
    const device = await adminDb.devices.get(id);
    if (!device) return undefined;

    const updated: Device = {
      ...device,
      ...updates,
      updatedAt: new Date(),
    };

    await adminDb.devices.put(updated);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    const device = await adminDb.devices.get(id);
    if (!device) return false;

    await adminDb.devices.delete(id);
    return true;
  },

  async block(id: string): Promise<Device | undefined> {
    return await this.update(id, { status: 'blocked' });
  },

  async unblock(id: string): Promise<Device | undefined> {
    return await this.update(id, { status: 'active' });
  },

  async recordActivity(id: string, ipAddress?: string): Promise<Device | undefined> {
    const device = await adminDb.devices.get(id);
    if (!device) return undefined;

    const updated: Device = {
      ...device,
      lastSeenAt: new Date(),
      ...(ipAddress ? { ipAddress } : {}),
      updatedAt: new Date(),
    };

    await adminDb.devices.put(updated);
    return updated;
  },

  async count(): Promise<number> {
    return await adminDb.devices.count();
  },

  async countByStore(storeId: string): Promise<number> {
    return await adminDb.devices.where('storeId').equals(storeId).count();
  },

  async countByLicense(licenseId: string): Promise<number> {
    return await adminDb.devices.where('licenseId').equals(licenseId).count();
  },
};

// ==================== ADMIN USERS ====================

export const adminUsersDB = {
  async getAll(limit: number = 100, offset: number = 0): Promise<AdminUser[]> {
    return await adminDb.adminUsers
      .offset(offset)
      .limit(limit)
      .toArray();
  },

  async getById(id: string): Promise<AdminUser | undefined> {
    return await adminDb.adminUsers.get(id);
  },

  async getByEmail(email: string): Promise<AdminUser | undefined> {
    return await adminDb.adminUsers.where('email').equals(email).first();
  },

  async create(input: CreateAdminUserInput): Promise<AdminUser> {
    const now = new Date();
    const adminUser: AdminUser = {
      id: uuidv4(),
      email: input.email,
      passwordHash: await hashPassword(input.password),
      name: input.name,
      role: input.role,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await adminDb.adminUsers.add(adminUser);
    return adminUser;
  },

  async update(id: string, updates: UpdateAdminUserInput): Promise<AdminUser | undefined> {
    const adminUser = await adminDb.adminUsers.get(id);
    if (!adminUser) return undefined;

    const updated: AdminUser = {
      ...adminUser,
      ...updates,
      ...(updates.password ? { passwordHash: await hashPassword(updates.password) } : {}),
      updatedAt: new Date(),
    };

    // Remove password from updates if it was set
    delete (updated as any).password;

    await adminDb.adminUsers.put(updated);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    const adminUser = await adminDb.adminUsers.get(id);
    if (!adminUser) return false;

    await adminDb.adminUsers.delete(id);
    return true;
  },

  async verifyPassword(email: string, password: string): Promise<AdminUser | null> {
    const adminUser = await this.getByEmail(email);
    if (!adminUser) return null;

    const isValid = await verifyPassword(password, adminUser.passwordHash);
    if (!isValid) return null;

    return adminUser;
  },

  async recordLogin(id: string): Promise<AdminUser | undefined> {
    const adminUser = await adminDb.adminUsers.get(id);
    if (!adminUser) return undefined;

    const updated: AdminUser = {
      ...adminUser,
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    };

    await adminDb.adminUsers.put(updated);
    return updated;
  },

  async count(): Promise<number> {
    return await adminDb.adminUsers.count();
  },
};

// ==================== ADMIN SESSIONS ====================

export const adminSessionsDB = {
  async getById(id: string): Promise<AdminSession | undefined> {
    return await adminDb.adminSessions.get(id);
  },

  async getByToken(token: string): Promise<AdminSession | undefined> {
    return await adminDb.adminSessions.where('token').equals(token).first();
  },

  async getByUserId(userId: string): Promise<AdminSession[]> {
    return await adminDb.adminSessions
      .where('userId')
      .equals(userId)
      .toArray();
  },

  async create(userId: string, token: string, expiresInHours: number = 24): Promise<AdminSession> {
    const now = new Date();
    const session: AdminSession = {
      id: uuidv4(),
      userId,
      token,
      expiresAt: new Date(now.getTime() + expiresInHours * 60 * 60 * 1000),
      createdAt: now,
    };

    await adminDb.adminSessions.add(session);
    return session;
  },

  async delete(id: string): Promise<boolean> {
    const session = await adminDb.adminSessions.get(id);
    if (!session) return false;

    await adminDb.adminSessions.delete(id);
    return true;
  },

  async deleteByToken(token: string): Promise<boolean> {
    const session = await this.getByToken(token);
    if (!session) return false;

    await adminDb.adminSessions.delete(session.id);
    return true;
  },

  async deleteExpired(): Promise<number> {
    const now = new Date();
    const expired = await adminDb.adminSessions
      .filter(session => session.expiresAt <= now)
      .toArray();

    for (const session of expired) {
      await adminDb.adminSessions.delete(session.id);
    }

    return expired.length;
  },

  async deleteByUserId(userId: string): Promise<number> {
    const sessions = await this.getByUserId(userId);

    for (const session of sessions) {
      await adminDb.adminSessions.delete(session.id);
    }

    return sessions.length;
  },
};

// ==================== AUDIT LOGS ====================

export const auditLogsDB = {
  async getAll(limit: number = 100, offset: number = 0): Promise<AuditLog[]> {
    return await adminDb.auditLogs
      .orderBy('createdAt')
      .reverse()
      .offset(offset)
      .limit(limit)
      .toArray();
  },

  async getById(id: string): Promise<AuditLog | undefined> {
    return await adminDb.auditLogs.get(id);
  },

  async getByEntity(entityType: string, entityId: string, limit: number = 100): Promise<AuditLog[]> {
    return await adminDb.auditLogs
      .where('[entityType+entityId]')
      .equals([entityType, entityId])
      .reverse()
      .limit(limit)
      .toArray();
  },

  async getByAdminUser(adminUserId: string, limit: number = 100): Promise<AuditLog[]> {
    return await adminDb.auditLogs
      .where('adminUserId')
      .equals(adminUserId)
      .reverse()
      .limit(limit)
      .toArray();
  },

  async getByAction(action: string, limit: number = 100): Promise<AuditLog[]> {
    return await adminDb.auditLogs
      .where('action')
      .equals(action)
      .reverse()
      .limit(limit)
      .toArray();
  },

  async create(input: CreateAuditLogInput): Promise<AuditLog> {
    const auditLog: AuditLog = {
      id: uuidv4(),
      ...input,
      createdAt: new Date(),
    };

    await adminDb.auditLogs.add(auditLog);
    return auditLog;
  },

  async count(): Promise<number> {
    return await adminDb.auditLogs.count();
  },
};

// ==================== FEATURE FLAGS ====================

export const featureFlagsDB = {
  async getAll(): Promise<FeatureFlag[]> {
    return await adminDb.featureFlags
      .orderBy('createdAt')
      .toArray();
  },

  async getById(id: string): Promise<FeatureFlag | undefined> {
    return await adminDb.featureFlags.get(id);
  },

  async getByKey(key: string): Promise<FeatureFlag | undefined> {
    return await adminDb.featureFlags.where('key').equals(key).first();
  },

  async getByCategory(category: string): Promise<FeatureFlag[]> {
    return await adminDb.featureFlags
      .where('category')
      .equals(category)
      .toArray();
  },

  async getEnabled(): Promise<FeatureFlag[]> {
    return await adminDb.featureFlags
      .where('globallyEnabled')
      .equals(1)
      .toArray();
  },

  async create(input: CreateFeatureFlagInput): Promise<FeatureFlag> {
    const now = new Date();
    const featureFlag: FeatureFlag = {
      id: uuidv4(),
      name: input.name,
      key: input.key,
      description: input.description,
      category: input.category,
      enabledForFree: input.enabledForFree ?? false,
      enabledForBasic: input.enabledForBasic ?? false,
      enabledForProfessional: input.enabledForProfessional ?? false,
      enabledForEnterprise: input.enabledForEnterprise ?? false,
      globallyEnabled: input.globallyEnabled ?? false,
      rolloutPercentage: input.rolloutPercentage ?? 0,
      metadata: input.metadata,
      createdAt: now,
      updatedAt: now,
    };

    await adminDb.featureFlags.add(featureFlag);
    return featureFlag;
  },

  async update(id: string, updates: UpdateFeatureFlagInput): Promise<FeatureFlag | undefined> {
    const flag = await adminDb.featureFlags.get(id);
    if (!flag) return undefined;

    const updated: FeatureFlag = {
      ...flag,
      ...updates,
      updatedAt: new Date(),
    };

    await adminDb.featureFlags.put(updated);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    const flag = await adminDb.featureFlags.get(id);
    if (!flag) return false;

    await adminDb.featureFlags.delete(id);
    return true;
  },

  async toggleGlobal(id: string): Promise<FeatureFlag | undefined> {
    const flag = await adminDb.featureFlags.get(id);
    if (!flag) return undefined;

    return await this.update(id, { globallyEnabled: !flag.globallyEnabled });
  },

  async toggleTier(id: string, tier: 'free' | 'basic' | 'professional' | 'enterprise'): Promise<FeatureFlag | undefined> {
    const flag = await adminDb.featureFlags.get(id);
    if (!flag) return undefined;

    const tierKey = `enabledFor${tier.charAt(0).toUpperCase() + tier.slice(1)}` as keyof FeatureFlag;
    return await this.update(id, { [tierKey]: !flag[tierKey] } as UpdateFeatureFlagInput);
  },

  async count(): Promise<number> {
    return await adminDb.featureFlags.count();
  },

  async seedDefaults(): Promise<void> {
    const existingCount = await adminDb.featureFlags.count();
    if (existingCount > 0) return;

    for (const flag of DEFAULT_FEATURE_FLAGS) {
      await this.create(flag);
    }
    console.log(`✅ Seeded ${DEFAULT_FEATURE_FLAGS.length} default feature flags`);
  },
};

// ==================== DATABASE STATS ====================

/**
 * Get admin database statistics
 */
export async function getAdminDBStats() {
  const [tenantCount, licenseCount, storeCount, memberCount, deviceCount, adminUserCount, auditLogCount] = await Promise.all([
    adminDb.tenants.count(),
    adminDb.licenses.count(),
    adminDb.stores.count(),
    adminDb.members.count(),
    adminDb.devices.count(),
    adminDb.adminUsers.count(),
    adminDb.auditLogs.count(),
  ]);

  const [activeLicenses, expiredLicenses, revokedLicenses] = await Promise.all([
    adminDb.licenses.where('status').equals('active').count(),
    adminDb.licenses.where('status').equals('expired').count(),
    adminDb.licenses.where('status').equals('revoked').count(),
  ]);

  return {
    tenants: tenantCount,
    licenses: {
      total: licenseCount,
      active: activeLicenses,
      expired: expiredLicenses,
      revoked: revokedLicenses,
    },
    stores: storeCount,
    members: memberCount,
    devices: deviceCount,
    adminUsers: adminUserCount,
    auditLogs: auditLogCount,
  };
}

// ==================== SYSTEM CONFIG ====================

export const systemConfigDB = {
  /**
   * Get the system configuration (singleton record)
   */
  async get(): Promise<SystemConfig | undefined> {
    return await adminDb.systemConfig.get('default');
  },

  /**
   * Update system configuration
   */
  async update(updates: UpdateSystemConfigInput, updatedBy?: string): Promise<SystemConfig> {
    const existing = await adminDb.systemConfig.get('default');

    if (!existing) {
      // Create default config first
      await this.seedDefaults();
      const newConfig = await adminDb.systemConfig.get('default');
      if (!newConfig) throw new Error('Failed to create system config');
      return this.update(updates, updatedBy);
    }

    const updated: SystemConfig = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
      updatedBy,
    };

    await adminDb.systemConfig.put(updated);
    return updated;
  },

  /**
   * Add a tax setting
   */
  async addTaxSetting(taxSetting: Omit<SystemConfig['taxSettings'][0], 'id'>): Promise<SystemConfig> {
    const config = await this.get();
    if (!config) throw new Error('System config not found');

    const newTax = { ...taxSetting, id: uuidv4() };
    return this.update({
      taxSettings: [...config.taxSettings, newTax],
    });
  },

  /**
   * Update a tax setting
   */
  async updateTaxSetting(id: string, updates: Partial<SystemConfig['taxSettings'][0]>): Promise<SystemConfig> {
    const config = await this.get();
    if (!config) throw new Error('System config not found');

    return this.update({
      taxSettings: config.taxSettings.map(t => t.id === id ? { ...t, ...updates } : t),
    });
  },

  /**
   * Remove a tax setting
   */
  async removeTaxSetting(id: string): Promise<SystemConfig> {
    const config = await this.get();
    if (!config) throw new Error('System config not found');

    return this.update({
      taxSettings: config.taxSettings.filter(t => t.id !== id),
    });
  },

  /**
   * Add a service category
   */
  async addCategory(category: Omit<SystemConfig['categories'][0], 'id'>): Promise<SystemConfig> {
    const config = await this.get();
    if (!config) throw new Error('System config not found');

    const newCat = { ...category, id: uuidv4() };
    return this.update({
      categories: [...config.categories, newCat],
    });
  },

  /**
   * Update a service category
   */
  async updateCategory(id: string, updates: Partial<SystemConfig['categories'][0]>): Promise<SystemConfig> {
    const config = await this.get();
    if (!config) throw new Error('System config not found');

    return this.update({
      categories: config.categories.map(c => c.id === id ? { ...c, ...updates } : c),
    });
  },

  /**
   * Remove a service category
   */
  async removeCategory(id: string): Promise<SystemConfig> {
    const config = await this.get();
    if (!config) throw new Error('System config not found');

    return this.update({
      categories: config.categories.filter(c => c.id !== id),
      // Also remove items in this category
      items: config.items.filter(i => i.categoryId !== id),
    });
  },

  /**
   * Add a service item
   */
  async addItem(item: Omit<SystemConfig['items'][0], 'id'>): Promise<SystemConfig> {
    const config = await this.get();
    if (!config) throw new Error('System config not found');

    const newItem = { ...item, id: uuidv4() };
    return this.update({
      items: [...config.items, newItem],
    });
  },

  /**
   * Update a service item
   */
  async updateItem(id: string, updates: Partial<SystemConfig['items'][0]>): Promise<SystemConfig> {
    const config = await this.get();
    if (!config) throw new Error('System config not found');

    return this.update({
      items: config.items.map(i => i.id === id ? { ...i, ...updates } : i),
    });
  },

  /**
   * Remove a service item
   */
  async removeItem(id: string): Promise<SystemConfig> {
    const config = await this.get();
    if (!config) throw new Error('System config not found');

    return this.update({
      items: config.items.filter(i => i.id !== id),
    });
  },

  /**
   * Add an employee role
   */
  async addEmployeeRole(role: Omit<SystemConfig['employeeRoles'][0], 'id'>): Promise<SystemConfig> {
    const config = await this.get();
    if (!config) throw new Error('System config not found');

    const newRole = { ...role, id: uuidv4() };
    return this.update({
      employeeRoles: [...config.employeeRoles, newRole],
    });
  },

  /**
   * Update an employee role
   */
  async updateEmployeeRole(id: string, updates: Partial<SystemConfig['employeeRoles'][0]>): Promise<SystemConfig> {
    const config = await this.get();
    if (!config) throw new Error('System config not found');

    return this.update({
      employeeRoles: config.employeeRoles.map(r => r.id === id ? { ...r, ...updates } : r),
    });
  },

  /**
   * Remove an employee role
   */
  async removeEmployeeRole(id: string): Promise<SystemConfig> {
    const config = await this.get();
    if (!config) throw new Error('System config not found');

    return this.update({
      employeeRoles: config.employeeRoles.filter(r => r.id !== id),
    });
  },

  /**
   * Add a payment method
   */
  async addPaymentMethod(method: Omit<SystemConfig['paymentMethods'][0], 'id'>): Promise<SystemConfig> {
    const config = await this.get();
    if (!config) throw new Error('System config not found');

    const newMethod = { ...method, id: uuidv4() };
    return this.update({
      paymentMethods: [...config.paymentMethods, newMethod],
    });
  },

  /**
   * Update a payment method
   */
  async updatePaymentMethod(id: string, updates: Partial<SystemConfig['paymentMethods'][0]>): Promise<SystemConfig> {
    const config = await this.get();
    if (!config) throw new Error('System config not found');

    return this.update({
      paymentMethods: config.paymentMethods.map(m => m.id === id ? { ...m, ...updates } : m),
    });
  },

  /**
   * Remove a payment method
   */
  async removePaymentMethod(id: string): Promise<SystemConfig> {
    const config = await this.get();
    if (!config) throw new Error('System config not found');

    return this.update({
      paymentMethods: config.paymentMethods.filter(m => m.id !== id),
    });
  },

  /**
   * Seed default system configuration
   */
  async seedDefaults(): Promise<void> {
    const existing = await adminDb.systemConfig.get('default');
    if (existing) {
      console.log('ℹ️ System config already exists');
      return;
    }

    const config: SystemConfig = {
      id: 'default',
      ...DEFAULT_SYSTEM_CONFIG,
      updatedAt: new Date(),
    };

    await adminDb.systemConfig.add(config);
    console.log('✅ Default system configuration seeded');
  },

  /**
   * Get configuration formatted for POS activation
   * This is what gets sent to stores on first login
   */
  async getForActivation(): Promise<{
    taxSettings: Array<{ name: string; rate: number; isDefault: boolean }>;
    categories: Array<{ name: string; icon: string; color: string }>;
    items: Array<{ name: string; category: string; description: string; duration: number; price: number; commissionRate: number }>;
    employeeRoles: Array<{ name: string; permissions: string[]; color: string }>;
    paymentMethods: Array<{ name: string; type: string; isActive: boolean }>;
  }> {
    const config = await this.get();
    if (!config) {
      await this.seedDefaults();
      const newConfig = await this.get();
      if (!newConfig) throw new Error('Failed to create system config');
      return this.getForActivation();
    }

    // Build category lookup map
    const categoryMap = new Map(config.categories.map(c => [c.id, c.name]));

    return {
      taxSettings: config.taxSettings.map(t => ({
        name: t.name,
        rate: t.rate,
        isDefault: t.isDefault,
      })),
      categories: config.categories
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(c => ({
          name: c.name,
          icon: c.icon,
          color: c.color,
        })),
      items: config.items
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(i => ({
          name: i.name,
          category: categoryMap.get(i.categoryId) || 'Uncategorized',
          description: i.description,
          duration: i.duration,
          price: i.price,
          commissionRate: i.commissionRate,
        })),
      employeeRoles: config.employeeRoles
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(r => ({
          name: r.name,
          permissions: r.permissions,
          color: r.color,
        })),
      paymentMethods: config.paymentMethods
        .filter(m => m.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(m => ({
          name: m.name,
          type: m.type,
          isActive: m.isActive,
        })),
    };
  },
};

// ==================== ANNOUNCEMENTS ====================

/**
 * Create default empty stats object
 */
function createEmptyStats(): AnnouncementStats {
  return {
    totalViews: 0,
    uniqueViews: 0,
    dismissals: 0,
    acknowledgments: 0,
    ctaClicks: {},
    emailsSent: 0,
    emailsOpened: 0,
    emailsClicked: 0,
  };
}

export const announcementsDB = {
  /**
   * Get all announcements
   */
  async getAll(limit: number = 100, offset: number = 0): Promise<Announcement[]> {
    return await adminDb.announcements
      .orderBy('createdAt')
      .reverse()
      .offset(offset)
      .limit(limit)
      .toArray();
  },

  /**
   * Get announcement by ID
   */
  async getById(id: string): Promise<Announcement | undefined> {
    return await adminDb.announcements.get(id);
  },

  /**
   * Get active announcements for a specific context
   */
  async getActive(options?: {
    tier?: string;
    role?: string;
    tenantId?: string;
    channel?: DeliveryChannel;
  }): Promise<Announcement[]> {
    const now = new Date();
    let announcements = await adminDb.announcements
      .where('status')
      .equals('active')
      .toArray();

    // Filter by date range
    announcements = announcements.filter(a => {
      const startsAt = a.behavior.startsAt;
      const expiresAt = a.behavior.expiresAt;
      if (startsAt && new Date(startsAt) > now) return false;
      if (expiresAt && new Date(expiresAt) < now) return false;
      return true;
    });

    // Filter by tier
    if (options?.tier) {
      announcements = announcements.filter(a =>
        a.targeting.tiers.includes('all') || a.targeting.tiers.includes(options.tier as any)
      );
    }

    // Filter by role
    if (options?.role) {
      announcements = announcements.filter(a =>
        a.targeting.roles.includes('all') || a.targeting.roles.includes(options.role as any)
      );
    }

    // Filter by specific tenant
    if (options?.tenantId) {
      announcements = announcements.filter(a =>
        !a.targeting.specificTenantIds?.length ||
        a.targeting.specificTenantIds.includes(options.tenantId!)
      );
    }

    // Filter by channel
    if (options?.channel) {
      announcements = announcements.filter(a =>
        a.channels.includes(options.channel!)
      );
    }

    // Sort by priority (critical first, then by order number)
    return announcements.sort((a, b) => {
      const priorityA = PRIORITY_CONFIG[a.priority].order;
      const priorityB = PRIORITY_CONFIG[b.priority].order;
      return priorityB - priorityA;
    });
  },

  /**
   * Get announcements by status
   */
  async getByStatus(status: AnnouncementStatus): Promise<Announcement[]> {
    return await adminDb.announcements
      .where('status')
      .equals(status)
      .toArray();
  },

  /**
   * Get announcements by category
   */
  async getByCategory(category: AnnouncementCategory): Promise<Announcement[]> {
    return await adminDb.announcements
      .where('category')
      .equals(category)
      .toArray();
  },

  /**
   * Search announcements
   */
  async search(query: string, limit: number = 50): Promise<Announcement[]> {
    const lowerQuery = query.toLowerCase();
    return await adminDb.announcements
      .filter(a =>
        a.content.title.toLowerCase().includes(lowerQuery) ||
        a.content.body.toLowerCase().includes(lowerQuery) ||
        (a.tags?.some(t => t.toLowerCase().includes(lowerQuery)) ?? false)
      )
      .limit(limit)
      .toArray();
  },

  /**
   * Create new announcement
   */
  async create(input: CreateAnnouncementInput, createdBy: string): Promise<Announcement> {
    const now = new Date();
    const categoryConfig = CATEGORY_CONFIG[input.category];

    // Determine initial status based on scheduling
    let status: AnnouncementStatus = 'draft';
    if (input.behavior.startsAt && new Date(input.behavior.startsAt) > now) {
      status = 'scheduled';
    }

    const announcement: Announcement = {
      id: uuidv4(),
      content: input.content,
      category: input.category,
      severity: input.severity ?? categoryConfig.defaultSeverity,
      priority: input.priority ?? 'normal',
      channels: input.channels.length > 0 ? input.channels : categoryConfig.defaultChannels,
      channelConfig: input.channelConfig,
      targeting: input.targeting,
      behavior: {
        dismissible: input.behavior.dismissible ?? true,
        requireAcknowledgment: input.behavior.requireAcknowledgment ?? false,
        showOnce: input.behavior.showOnce ?? false,
        ...input.behavior,
      },
      status,
      stats: createEmptyStats(),
      tags: input.tags,
      internalNotes: input.internalNotes,
      createdBy,
      createdAt: now,
      updatedAt: now,
    };

    await adminDb.announcements.add(announcement);
    return announcement;
  },

  /**
   * Update announcement
   */
  async update(id: string, updates: UpdateAnnouncementInput): Promise<Announcement | undefined> {
    const announcement = await adminDb.announcements.get(id);
    if (!announcement) return undefined;

    const updated: Announcement = {
      ...announcement,
      ...updates,
      content: updates.content
        ? { ...announcement.content, ...updates.content }
        : announcement.content,
      targeting: updates.targeting
        ? { ...announcement.targeting, ...updates.targeting }
        : announcement.targeting,
      behavior: updates.behavior
        ? { ...announcement.behavior, ...updates.behavior }
        : announcement.behavior,
      updatedAt: new Date(),
    };

    await adminDb.announcements.put(updated);
    return updated;
  },

  /**
   * Delete announcement
   */
  async delete(id: string): Promise<boolean> {
    const announcement = await adminDb.announcements.get(id);
    if (!announcement) return false;

    // Also delete related interactions
    await adminDb.announcementInteractions
      .where('announcementId')
      .equals(id)
      .delete();

    await adminDb.announcements.delete(id);
    return true;
  },

  /**
   * Publish announcement (set to active)
   */
  async publish(id: string): Promise<Announcement | undefined> {
    const announcement = await adminDb.announcements.get(id);
    if (!announcement) return undefined;

    return this.update(id, {
      status: 'active',
    });
  },

  /**
   * Pause active announcement
   */
  async pause(id: string): Promise<Announcement | undefined> {
    return this.update(id, { status: 'paused' });
  },

  /**
   * Resume paused announcement
   */
  async resume(id: string): Promise<Announcement | undefined> {
    return this.update(id, { status: 'active' });
  },

  /**
   * Archive announcement
   */
  async archive(id: string): Promise<Announcement | undefined> {
    const now = new Date();
    const announcement = await adminDb.announcements.get(id);
    if (!announcement) return undefined;

    const updated: Announcement = {
      ...announcement,
      status: 'archived',
      archivedAt: now,
      updatedAt: now,
    };

    await adminDb.announcements.put(updated);
    return updated;
  },

  /**
   * Duplicate announcement (for creating similar ones)
   */
  async duplicate(id: string, createdBy: string): Promise<Announcement | undefined> {
    const original = await adminDb.announcements.get(id);
    if (!original) return undefined;

    const now = new Date();
    const duplicate: Announcement = {
      ...original,
      id: uuidv4(),
      content: {
        ...original.content,
        title: `${original.content.title} (Copy)`,
      },
      status: 'draft',
      stats: createEmptyStats(),
      createdBy,
      createdAt: now,
      updatedAt: now,
      publishedAt: undefined,
      archivedAt: undefined,
    };

    await adminDb.announcements.add(duplicate);
    return duplicate;
  },

  /**
   * Count announcements
   */
  async count(): Promise<number> {
    return await adminDb.announcements.count();
  },

  /**
   * Count by status
   */
  async countByStatus(status: AnnouncementStatus): Promise<number> {
    return await adminDb.announcements.where('status').equals(status).count();
  },

  /**
   * Count active announcements
   */
  async countActive(): Promise<number> {
    const active = await this.getActive();
    return active.length;
  },

  /**
   * Update expired announcements status
   */
  async updateExpiredStatus(): Promise<number> {
    const now = new Date();
    const active = await adminDb.announcements
      .where('status')
      .equals('active')
      .toArray();

    let expiredCount = 0;
    for (const announcement of active) {
      if (announcement.behavior.expiresAt && new Date(announcement.behavior.expiresAt) < now) {
        await this.update(announcement.id, { status: 'expired' });
        expiredCount++;
      }
    }

    return expiredCount;
  },

  /**
   * Activate scheduled announcements
   */
  async activateScheduled(): Promise<number> {
    const now = new Date();
    const scheduled = await adminDb.announcements
      .where('status')
      .equals('scheduled')
      .toArray();

    let activatedCount = 0;
    for (const announcement of scheduled) {
      const startsAt = announcement.behavior.startsAt;
      if (!startsAt || new Date(startsAt) <= now) {
        const updated: Announcement = {
          ...announcement,
          status: 'active',
          publishedAt: now,
          updatedAt: now,
        };
        await adminDb.announcements.put(updated);
        activatedCount++;
      }
    }

    return activatedCount;
  },

  /**
   * Get announcement analytics summary
   */
  async getAnalytics(): Promise<{
    total: number;
    byStatus: Record<AnnouncementStatus, number>;
    byCategory: Record<AnnouncementCategory, number>;
    totalViews: number;
    totalDismissals: number;
    totalCtaClicks: number;
  }> {
    const announcements = await adminDb.announcements.toArray();

    const byStatus: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    let totalViews = 0;
    let totalDismissals = 0;
    let totalCtaClicks = 0;

    for (const a of announcements) {
      byStatus[a.status] = (byStatus[a.status] || 0) + 1;
      byCategory[a.category] = (byCategory[a.category] || 0) + 1;
      totalViews += a.stats.totalViews;
      totalDismissals += a.stats.dismissals;
      totalCtaClicks += Object.values(a.stats.ctaClicks).reduce((sum, n) => sum + n, 0);
    }

    return {
      total: announcements.length,
      byStatus: byStatus as Record<AnnouncementStatus, number>,
      byCategory: byCategory as Record<AnnouncementCategory, number>,
      totalViews,
      totalDismissals,
      totalCtaClicks,
    };
  },
};

// ==================== ANNOUNCEMENT INTERACTIONS ====================

export const announcementInteractionsDB = {
  /**
   * Record an interaction (view, dismiss, click, etc.)
   */
  async record(input: Omit<AnnouncementInteraction, 'id' | 'timestamp'>): Promise<AnnouncementInteraction> {
    const interaction: AnnouncementInteraction = {
      id: uuidv4(),
      ...input,
      timestamp: new Date(),
    };

    await adminDb.announcementInteractions.add(interaction);

    // Update announcement stats
    await this.updateAnnouncementStats(input.announcementId, input.action, input.ctaLabel);

    return interaction;
  },

  /**
   * Update announcement stats after recording an interaction
   */
  async updateAnnouncementStats(
    announcementId: string,
    action: AnnouncementInteraction['action'],
    ctaLabel?: string
  ): Promise<void> {
    const announcement = await adminDb.announcements.get(announcementId);
    if (!announcement) return;

    const stats = { ...announcement.stats };

    switch (action) {
      case 'view':
        stats.totalViews++;
        break;
      case 'dismiss':
        stats.dismissals++;
        break;
      case 'acknowledge':
        stats.acknowledgments++;
        break;
      case 'cta_click':
        if (ctaLabel) {
          stats.ctaClicks[ctaLabel] = (stats.ctaClicks[ctaLabel] || 0) + 1;
        }
        break;
      case 'email_open':
        stats.emailsOpened++;
        break;
      case 'email_click':
        stats.emailsClicked++;
        break;
    }

    await adminDb.announcements.update(announcementId, { stats });
  },

  /**
   * Get interactions for an announcement
   */
  async getByAnnouncement(announcementId: string, limit: number = 100): Promise<AnnouncementInteraction[]> {
    return await adminDb.announcementInteractions
      .where('announcementId')
      .equals(announcementId)
      .reverse()
      .limit(limit)
      .toArray();
  },

  /**
   * Get interactions by tenant
   */
  async getByTenant(tenantId: string, limit: number = 100): Promise<AnnouncementInteraction[]> {
    return await adminDb.announcementInteractions
      .where('tenantId')
      .equals(tenantId)
      .reverse()
      .limit(limit)
      .toArray();
  },

  /**
   * Check if user has seen/dismissed an announcement
   */
  async hasUserSeen(announcementId: string, tenantId: string, userId?: string): Promise<boolean> {
    const interactions = await adminDb.announcementInteractions
      .where('[tenantId+announcementId]')
      .equals([tenantId, announcementId])
      .toArray();

    if (userId) {
      return interactions.some(i => i.userId === userId && (i.action === 'view' || i.action === 'dismiss'));
    }

    return interactions.some(i => i.action === 'view' || i.action === 'dismiss');
  },

  /**
   * Check if user has acknowledged an announcement
   */
  async hasUserAcknowledged(announcementId: string, tenantId: string, userId?: string): Promise<boolean> {
    const interactions = await adminDb.announcementInteractions
      .where('[tenantId+announcementId]')
      .equals([tenantId, announcementId])
      .toArray();

    if (userId) {
      return interactions.some(i => i.userId === userId && i.action === 'acknowledge');
    }

    return interactions.some(i => i.action === 'acknowledge');
  },

  /**
   * Get unique view count for an announcement
   */
  async getUniqueViewCount(announcementId: string): Promise<number> {
    const interactions = await adminDb.announcementInteractions
      .where('[announcementId+action]')
      .equals([announcementId, 'view'])
      .toArray();

    const uniqueTenants = new Set(interactions.map(i => i.tenantId));
    return uniqueTenants.size;
  },

  /**
   * Get interaction stats for an announcement
   */
  async getStats(announcementId: string): Promise<{
    views: number;
    uniqueViews: number;
    dismissals: number;
    acknowledgments: number;
    ctaClicks: number;
  }> {
    const interactions = await adminDb.announcementInteractions
      .where('announcementId')
      .equals(announcementId)
      .toArray();

    const viewTenants = new Set<string>();
    let views = 0;
    let dismissals = 0;
    let acknowledgments = 0;
    let ctaClicks = 0;

    for (const i of interactions) {
      switch (i.action) {
        case 'view':
          views++;
          viewTenants.add(i.tenantId);
          break;
        case 'dismiss':
          dismissals++;
          break;
        case 'acknowledge':
          acknowledgments++;
          break;
        case 'cta_click':
          ctaClicks++;
          break;
      }
    }

    return {
      views,
      uniqueViews: viewTenants.size,
      dismissals,
      acknowledgments,
      ctaClicks,
    };
  },

  /**
   * Delete old interactions (cleanup)
   */
  async deleteOlderThan(days: number): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const old = await adminDb.announcementInteractions
      .filter(i => new Date(i.timestamp) < cutoff)
      .toArray();

    for (const interaction of old) {
      await adminDb.announcementInteractions.delete(interaction.id);
    }

    return old.length;
  },

  /**
   * Count all interactions
   */
  async count(): Promise<number> {
    return await adminDb.announcementInteractions.count();
  },
};

// ==================== SURVEYS ====================

export const surveysDB = {
  /**
   * Get all surveys
   */
  async getAll(limit: number = 100, offset: number = 0): Promise<Survey[]> {
    return await adminDb.surveys
      .orderBy('createdAt')
      .reverse()
      .offset(offset)
      .limit(limit)
      .toArray();
  },

  /**
   * Get survey by ID
   */
  async getById(id: string): Promise<Survey | undefined> {
    return await adminDb.surveys.get(id);
  },

  /**
   * Get surveys by status
   */
  async getByStatus(status: SurveyStatus): Promise<Survey[]> {
    return await adminDb.surveys
      .where('status')
      .equals(status)
      .toArray();
  },

  /**
   * Get surveys by type
   */
  async getByType(type: SurveyType): Promise<Survey[]> {
    return await adminDb.surveys
      .where('type')
      .equals(type)
      .toArray();
  },

  /**
   * Get active surveys for a specific context
   */
  async getActive(options?: {
    tier?: string;
    role?: string;
    tenantId?: string;
    trigger?: string;
  }): Promise<Survey[]> {
    const now = new Date();
    let surveys = await adminDb.surveys
      .where('status')
      .equals('active')
      .toArray();

    // Filter by date range
    surveys = surveys.filter(s => {
      if (s.startsAt && new Date(s.startsAt) > now) return false;
      if (s.endsAt && new Date(s.endsAt) < now) return false;
      return true;
    });

    // Filter by tier
    if (options?.tier) {
      surveys = surveys.filter(s =>
        s.targeting.tiers.includes('all') || s.targeting.tiers.includes(options.tier as any)
      );
    }

    // Filter by role
    if (options?.role) {
      surveys = surveys.filter(s =>
        s.targeting.roles.includes('all') || s.targeting.roles.includes(options.role as any)
      );
    }

    // Filter by specific tenant
    if (options?.tenantId) {
      surveys = surveys.filter(s =>
        !s.targeting.specificTenantIds?.length ||
        s.targeting.specificTenantIds.includes(options.tenantId!)
      );
    }

    // Filter by trigger
    if (options?.trigger) {
      surveys = surveys.filter(s => s.trigger.trigger === options.trigger);
    }

    return surveys;
  },

  /**
   * Search surveys
   */
  async search(query: string, limit: number = 50): Promise<Survey[]> {
    const lowerQuery = query.toLowerCase();
    return await adminDb.surveys
      .filter(s =>
        s.name.toLowerCase().includes(lowerQuery) ||
        s.title.toLowerCase().includes(lowerQuery) ||
        (s.tags?.some(t => t.toLowerCase().includes(lowerQuery)) ?? false)
      )
      .limit(limit)
      .toArray();
  },

  /**
   * Create new survey
   */
  async create(input: CreateSurveyInput, createdBy: string): Promise<Survey> {
    const now = new Date();
    const typeConfig = SURVEY_TYPE_CONFIG[input.type];

    // Add IDs to questions
    const questions: SurveyQuestion[] = input.questions.map((q, idx) => ({
      ...q,
      id: uuidv4(),
      order: q.order ?? idx,
    }));

    // If no questions provided for standard types, add default question
    if (questions.length === 0 && input.type !== 'custom' && typeConfig.defaultQuestion) {
      questions.push({
        id: uuidv4(),
        order: 0,
        required: true,
        ...typeConfig.defaultQuestion,
      } as SurveyQuestion);
    }

    // Determine initial status
    let status: SurveyStatus = 'draft';
    if (input.startsAt && new Date(input.startsAt) > now) {
      status = 'scheduled';
    }

    const survey: Survey = {
      id: uuidv4(),
      name: input.name,
      title: input.title,
      description: input.description,
      type: input.type,
      status,
      questions,
      targeting: input.targeting,
      trigger: input.trigger,
      appearance: {
        ...createDefaultAppearance(),
        ...input.appearance,
      },
      thankYou: {
        ...createDefaultThankYou(),
        ...input.thankYou,
      },
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      maxResponses: input.maxResponses,
      maxResponsesPerUser: input.maxResponsesPerUser,
      stats: createEmptySurveyStats(),
      tags: input.tags,
      internalNotes: input.internalNotes,
      createdBy,
      createdAt: now,
      updatedAt: now,
    };

    await adminDb.surveys.add(survey);
    return survey;
  },

  /**
   * Update survey
   */
  async update(id: string, updates: UpdateSurveyInput): Promise<Survey | undefined> {
    const survey = await adminDb.surveys.get(id);
    if (!survey) return undefined;

    const updated: Survey = {
      ...survey,
      ...updates,
      targeting: updates.targeting
        ? { ...survey.targeting, ...updates.targeting }
        : survey.targeting,
      trigger: updates.trigger
        ? { ...survey.trigger, ...updates.trigger }
        : survey.trigger,
      appearance: updates.appearance
        ? { ...survey.appearance, ...updates.appearance }
        : survey.appearance,
      thankYou: updates.thankYou
        ? { ...survey.thankYou, ...updates.thankYou }
        : survey.thankYou,
      updatedAt: new Date(),
    };

    await adminDb.surveys.put(updated);
    return updated;
  },

  /**
   * Delete survey
   */
  async delete(id: string): Promise<boolean> {
    const survey = await adminDb.surveys.get(id);
    if (!survey) return false;

    // Also delete related responses
    await adminDb.surveyResponses
      .where('surveyId')
      .equals(id)
      .delete();

    await adminDb.surveys.delete(id);
    return true;
  },

  /**
   * Publish survey (set to active)
   */
  async publish(id: string): Promise<Survey | undefined> {
    const survey = await adminDb.surveys.get(id);
    if (!survey) return undefined;

    const now = new Date();
    const updated: Survey = {
      ...survey,
      status: 'active',
      publishedAt: now,
      updatedAt: now,
    };

    await adminDb.surveys.put(updated);
    return updated;
  },

  /**
   * Pause survey
   */
  async pause(id: string): Promise<Survey | undefined> {
    return this.update(id, { status: 'paused' });
  },

  /**
   * Resume survey
   */
  async resume(id: string): Promise<Survey | undefined> {
    return this.update(id, { status: 'active' });
  },

  /**
   * Close survey
   */
  async close(id: string): Promise<Survey | undefined> {
    const survey = await adminDb.surveys.get(id);
    if (!survey) return undefined;

    const now = new Date();
    const updated: Survey = {
      ...survey,
      status: 'closed',
      closedAt: now,
      updatedAt: now,
    };

    await adminDb.surveys.put(updated);
    return updated;
  },

  /**
   * Archive survey
   */
  async archive(id: string): Promise<Survey | undefined> {
    return this.update(id, { status: 'archived' });
  },

  /**
   * Duplicate survey
   */
  async duplicate(id: string, createdBy: string): Promise<Survey | undefined> {
    const original = await adminDb.surveys.get(id);
    if (!original) return undefined;

    const now = new Date();
    const duplicate: Survey = {
      ...original,
      id: uuidv4(),
      name: `${original.name} (Copy)`,
      status: 'draft',
      stats: createEmptySurveyStats(),
      questions: original.questions.map(q => ({ ...q, id: uuidv4() })),
      createdBy,
      createdAt: now,
      updatedAt: now,
      publishedAt: undefined,
      closedAt: undefined,
    };

    await adminDb.surveys.add(duplicate);
    return duplicate;
  },

  /**
   * Count surveys
   */
  async count(): Promise<number> {
    return await adminDb.surveys.count();
  },

  /**
   * Count by status
   */
  async countByStatus(status: SurveyStatus): Promise<number> {
    return await adminDb.surveys.where('status').equals(status).count();
  },

  /**
   * Update survey stats
   */
  async updateStats(id: string): Promise<void> {
    const survey = await adminDb.surveys.get(id);
    if (!survey) return;

    const responses = await adminDb.surveyResponses
      .where('surveyId')
      .equals(id)
      .toArray();

    const stats: SurveyStats = {
      totalResponses: responses.length,
      completionRate: responses.length > 0 ? 1 : 0, // Simplified for now
      avgDurationSeconds: responses.length > 0
        ? responses.reduce((sum, r) => sum + r.durationSeconds, 0) / responses.length
        : 0,
    };

    // Calculate NPS if applicable
    if (survey.type === 'nps') {
      const npsScores = responses
        .filter(r => r.npsScore !== undefined)
        .map(r => r.npsScore!);
      if (npsScores.length > 0) {
        stats.npsDistribution = calculateNPSScore(npsScores);
      }
    }

    // Calculate CSAT if applicable
    if (survey.type === 'csat') {
      const csatScores = responses
        .filter(r => r.csatScore !== undefined)
        .map(r => r.csatScore!);
      if (csatScores.length > 0) {
        const scores: Record<number, number> = {};
        for (const score of csatScores) {
          scores[score] = (scores[score] || 0) + 1;
        }
        stats.csatDistribution = {
          scores,
          avgScore: calculateAverageScore(csatScores),
        };
      }
    }

    // Calculate CES if applicable
    if (survey.type === 'ces') {
      const cesScores = responses
        .filter(r => r.cesScore !== undefined)
        .map(r => r.cesScore!);
      if (cesScores.length > 0) {
        const scores: Record<number, number> = {};
        for (const score of cesScores) {
          scores[score] = (scores[score] || 0) + 1;
        }
        stats.cesDistribution = {
          scores,
          avgScore: calculateAverageScore(cesScores),
        };
      }
    }

    // Calculate sentiment breakdown
    const sentiments = responses.filter(r => r.sentiment).map(r => r.sentiment!);
    if (sentiments.length > 0) {
      stats.sentimentBreakdown = {
        positive: sentiments.filter(s => s === 'positive').length,
        neutral: sentiments.filter(s => s === 'neutral').length,
        negative: sentiments.filter(s => s === 'negative').length,
      };
    }

    await adminDb.surveys.update(id, { stats });
  },

  /**
   * Get survey analytics
   */
  async getAnalytics(): Promise<{
    total: number;
    byStatus: Record<SurveyStatus, number>;
    byType: Record<SurveyType, number>;
    totalResponses: number;
    avgResponseRate: number;
  }> {
    const surveys = await adminDb.surveys.toArray();
    const responses = await adminDb.surveyResponses.toArray();

    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const s of surveys) {
      byStatus[s.status] = (byStatus[s.status] || 0) + 1;
      byType[s.type] = (byType[s.type] || 0) + 1;
    }

    return {
      total: surveys.length,
      byStatus: byStatus as Record<SurveyStatus, number>,
      byType: byType as Record<SurveyType, number>,
      totalResponses: responses.length,
      avgResponseRate: surveys.length > 0
        ? responses.length / surveys.length
        : 0,
    };
  },
};

// ==================== SURVEY RESPONSES ====================

export const surveyResponsesDB = {
  /**
   * Get all responses for a survey
   */
  async getBySurvey(surveyId: string, limit: number = 100, offset: number = 0): Promise<SurveyResponse[]> {
    return await adminDb.surveyResponses
      .where('surveyId')
      .equals(surveyId)
      .reverse()
      .offset(offset)
      .limit(limit)
      .toArray();
  },

  /**
   * Get response by ID
   */
  async getById(id: string): Promise<SurveyResponse | undefined> {
    return await adminDb.surveyResponses.get(id);
  },

  /**
   * Get responses by tenant
   */
  async getByTenant(tenantId: string, limit: number = 100): Promise<SurveyResponse[]> {
    return await adminDb.surveyResponses
      .where('tenantId')
      .equals(tenantId)
      .reverse()
      .limit(limit)
      .toArray();
  },

  /**
   * Check if user has already responded to survey
   */
  async hasUserResponded(surveyId: string, tenantId: string, userId?: string): Promise<boolean> {
    const responses = await adminDb.surveyResponses
      .where('[tenantId+surveyId]')
      .equals([tenantId, surveyId])
      .toArray();

    if (userId) {
      return responses.some(r => r.userId === userId);
    }

    return responses.length > 0;
  },

  /**
   * Get response count for user
   */
  async getUserResponseCount(surveyId: string, tenantId: string, userId?: string): Promise<number> {
    const responses = await adminDb.surveyResponses
      .where('[tenantId+surveyId]')
      .equals([tenantId, surveyId])
      .toArray();

    if (userId) {
      return responses.filter(r => r.userId === userId).length;
    }

    return responses.length;
  },

  /**
   * Submit survey response
   */
  async submit(input: CreateSurveyResponseInput): Promise<SurveyResponse> {
    const now = new Date();
    const durationSeconds = Math.round((now.getTime() - new Date(input.startedAt).getTime()) / 1000);

    // Get survey to determine type
    const survey = await adminDb.surveys.get(input.surveyId);

    // Calculate scores based on survey type
    let npsScore: number | undefined;
    let csatScore: number | undefined;
    let cesScore: number | undefined;

    if (survey) {
      // Find the primary rating answer
      for (const answer of input.answers) {
        if (answer.questionType === 'nps_scale' && typeof answer.value === 'number') {
          npsScore = answer.value;
        } else if (answer.questionType === 'rating_stars' && typeof answer.value === 'number') {
          csatScore = answer.value;
        } else if (answer.questionType === 'rating_numeric' && typeof answer.value === 'number') {
          if (survey.type === 'ces') {
            cesScore = answer.value;
          }
        }
      }
    }

    // Analyze sentiment from text answers
    let sentiment: 'positive' | 'neutral' | 'negative' | undefined;
    let sentimentScore: number | undefined;

    const textAnswers = input.answers
      .filter(a => a.questionType === 'text_short' || a.questionType === 'text_long')
      .map(a => String(a.value || a.text || ''))
      .join(' ');

    if (textAnswers.trim()) {
      const analysis = analyzeSentiment(textAnswers);
      sentiment = analysis.sentiment;
      sentimentScore = analysis.score;
    }

    const response: SurveyResponse = {
      id: uuidv4(),
      surveyId: input.surveyId,
      tenantId: input.tenantId,
      storeId: input.storeId,
      userId: input.userId,
      answers: input.answers,
      npsScore,
      csatScore,
      cesScore,
      sentiment,
      sentimentScore,
      completedAt: now,
      startedAt: input.startedAt,
      durationSeconds,
      deviceType: input.deviceType,
      source: input.source,
    };

    await adminDb.surveyResponses.add(response);

    // Update survey stats
    await surveysDB.updateStats(input.surveyId);

    return response;
  },

  /**
   * Update follow-up status
   */
  async updateFollowUp(
    id: string,
    status: 'pending' | 'contacted' | 'resolved',
    notes?: string
  ): Promise<SurveyResponse | undefined> {
    const response = await adminDb.surveyResponses.get(id);
    if (!response) return undefined;

    const updated: SurveyResponse = {
      ...response,
      followUpStatus: status,
      followUpNotes: notes ?? response.followUpNotes,
    };

    await adminDb.surveyResponses.put(updated);
    return updated;
  },

  /**
   * Get responses needing follow-up
   */
  async getNeedingFollowUp(surveyId?: string): Promise<SurveyResponse[]> {
    let responses = await adminDb.surveyResponses
      .filter(r => r.followUpRequested === true && r.followUpStatus !== 'resolved')
      .toArray();

    if (surveyId) {
      responses = responses.filter(r => r.surveyId === surveyId);
    }

    return responses;
  },

  /**
   * Get responses by sentiment
   */
  async getBySentiment(
    surveyId: string,
    sentiment: 'positive' | 'neutral' | 'negative'
  ): Promise<SurveyResponse[]> {
    return await adminDb.surveyResponses
      .where('[surveyId+sentiment]')
      .equals([surveyId, sentiment])
      .toArray();
  },

  /**
   * Delete response
   */
  async delete(id: string): Promise<boolean> {
    const response = await adminDb.surveyResponses.get(id);
    if (!response) return false;

    await adminDb.surveyResponses.delete(id);

    // Update survey stats
    await surveysDB.updateStats(response.surveyId);

    return true;
  },

  /**
   * Count responses for survey
   */
  async countBySurvey(surveyId: string): Promise<number> {
    return await adminDb.surveyResponses
      .where('surveyId')
      .equals(surveyId)
      .count();
  },

  /**
   * Count all responses
   */
  async count(): Promise<number> {
    return await adminDb.surveyResponses.count();
  },

  /**
   * Export responses as array (for CSV export)
   */
  async exportBySurvey(surveyId: string): Promise<{
    headers: string[];
    rows: (string | number)[][];
  }> {
    const survey = await adminDb.surveys.get(surveyId);
    const responses = await this.getBySurvey(surveyId, 10000);

    if (!survey) {
      return { headers: [], rows: [] };
    }

    // Build headers
    const headers = [
      'Response ID',
      'Tenant ID',
      'Store ID',
      'User ID',
      'Completed At',
      'Duration (s)',
      'Sentiment',
    ];

    // Add question headers
    for (const q of survey.questions) {
      headers.push(q.text);
    }

    // Add score headers based on type
    if (survey.type === 'nps') headers.push('NPS Score');
    if (survey.type === 'csat') headers.push('CSAT Score');
    if (survey.type === 'ces') headers.push('CES Score');

    // Build rows
    const rows: (string | number)[][] = [];
    for (const r of responses) {
      const row: (string | number)[] = [
        r.id,
        r.tenantId,
        r.storeId || '',
        r.userId || '',
        new Date(r.completedAt).toISOString(),
        r.durationSeconds,
        r.sentiment || '',
      ];

      // Add answers
      for (const q of survey.questions) {
        const answer = r.answers.find(a => a.questionId === q.id);
        if (answer) {
          if (typeof answer.value === 'object') {
            row.push(JSON.stringify(answer.value));
          } else {
            row.push(String(answer.value ?? answer.text ?? ''));
          }
        } else {
          row.push('');
        }
      }

      // Add scores
      if (survey.type === 'nps') row.push(r.npsScore ?? '');
      if (survey.type === 'csat') row.push(r.csatScore ?? '');
      if (survey.type === 'ces') row.push(r.cesScore ?? '');

      rows.push(row);
    }

    return { headers, rows };
  },
};
