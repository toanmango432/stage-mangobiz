/**
 * Admin Portal Integration Tests
 * Tests the full CRUD operations for Tenants, Licenses, Stores, and Members
 */

import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { adminDb } from '../db/schema';
import { tenantsDB, licensesDB, storesDB, membersDB, getAdminDBStats, adminUsersDB } from '../db/database';

describe('Admin Portal Database Operations', () => {
  beforeEach(async () => {
    // Clear all tables before each test
    await adminDb.tenants.clear();
    await adminDb.licenses.clear();
    await adminDb.stores.clear();
    await adminDb.members.clear();
    await adminDb.devices.clear();
    await adminDb.adminUsers.clear();
    await adminDb.adminSessions.clear();
    await adminDb.auditLogs.clear();
  });

  describe('Tenant CRUD Operations', () => {
    it('should create a tenant', async () => {
      const tenant = await tenantsDB.create({
        name: 'John Smith',
        email: 'john@example.com',
        phone: '555-1234',
        company: 'Test Salon',
      });

      expect(tenant).toBeDefined();
      expect(tenant.id).toBeDefined();
      expect(tenant.name).toBe('John Smith');
      expect(tenant.email).toBe('john@example.com');
      expect(tenant.status).toBe('active');
    });

    it('should get tenant by ID', async () => {
      const created = await tenantsDB.create({
        name: 'Jane Doe',
        email: 'jane@example.com',
      });

      const found = await tenantsDB.getById(created.id);
      expect(found).toBeDefined();
      expect(found?.name).toBe('Jane Doe');
    });

    it('should update a tenant', async () => {
      const tenant = await tenantsDB.create({
        name: 'Original Name',
        email: 'original@example.com',
      });

      const updated = await tenantsDB.update(tenant.id, {
        name: 'Updated Name',
        phone: '555-9999',
      });

      expect(updated?.name).toBe('Updated Name');
      expect(updated?.phone).toBe('555-9999');
      expect(updated?.email).toBe('original@example.com'); // Unchanged
    });

    it('should delete a tenant', async () => {
      const tenant = await tenantsDB.create({
        name: 'To Delete',
        email: 'delete@example.com',
      });

      const deleted = await tenantsDB.delete(tenant.id);
      expect(deleted).toBe(true);

      const found = await tenantsDB.getById(tenant.id);
      expect(found).toBeUndefined();
    });

    it('should suspend and activate a tenant', async () => {
      const tenant = await tenantsDB.create({
        name: 'Status Test',
        email: 'status@example.com',
      });

      expect(tenant.status).toBe('active');

      const suspended = await tenantsDB.suspend(tenant.id);
      expect(suspended?.status).toBe('suspended');

      const activated = await tenantsDB.activate(tenant.id);
      expect(activated?.status).toBe('active');
    });

    it('should search tenants', async () => {
      await tenantsDB.create({ name: 'Luxury Nails', email: 'luxury@example.com', company: 'Luxury Nails LLC' });
      await tenantsDB.create({ name: 'Bella Salon', email: 'bella@example.com', company: 'Bella Beauty' });
      await tenantsDB.create({ name: 'Elite Spa', email: 'elite@example.com' });

      const results = await tenantsDB.search('luxury');
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Luxury Nails');

      const emailSearch = await tenantsDB.search('bella');
      expect(emailSearch.length).toBe(1);
    });
  });

  describe('License CRUD Operations', () => {
    let tenantId: string;

    beforeEach(async () => {
      const tenant = await tenantsDB.create({
        name: 'License Test Tenant',
        email: 'license-test@example.com',
      });
      tenantId = tenant.id;
    });

    it('should create a license with auto-generated key', async () => {
      const license = await licensesDB.create({
        tenantId,
        tier: 'professional',
      });

      expect(license).toBeDefined();
      expect(license.licenseKey).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      expect(license.tier).toBe('professional');
      expect(license.status).toBe('active');
      expect(license.maxStores).toBe(3); // Professional tier default
      expect(license.maxDevicesPerStore).toBe(5);
    });

    it('should create licenses with different tiers', async () => {
      const free = await licensesDB.create({ tenantId, tier: 'free' });
      const basic = await licensesDB.create({ tenantId, tier: 'basic' });
      const professional = await licensesDB.create({ tenantId, tier: 'professional' });
      const enterprise = await licensesDB.create({ tenantId, tier: 'enterprise' });

      expect(free.maxStores).toBe(1);
      expect(basic.maxStores).toBe(1);
      expect(professional.maxStores).toBe(3);
      expect(enterprise.maxStores).toBe(999);
    });

    it('should get license by license key', async () => {
      const created = await licensesDB.create({
        tenantId,
        tier: 'basic',
      });

      const found = await licensesDB.getByLicenseKey(created.licenseKey);
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });

    it('should revoke and reactivate a license', async () => {
      const license = await licensesDB.create({
        tenantId,
        tier: 'professional',
      });

      const revoked = await licensesDB.revoke(license.id);
      expect(revoked?.status).toBe('revoked');

      const reactivated = await licensesDB.activate(license.id);
      expect(reactivated?.status).toBe('active');
    });

    it('should get licenses by tenant', async () => {
      await licensesDB.create({ tenantId, tier: 'free' });
      await licensesDB.create({ tenantId, tier: 'professional' });

      const licenses = await licensesDB.getByTenantId(tenantId);
      expect(licenses.length).toBe(2);
    });
  });

  describe('Store CRUD Operations', () => {
    let tenantId: string;
    let licenseId: string;

    beforeEach(async () => {
      const tenant = await tenantsDB.create({
        name: 'Store Test Tenant',
        email: 'store-test@example.com',
      });
      tenantId = tenant.id;

      const license = await licensesDB.create({
        tenantId,
        tier: 'professional',
      });
      licenseId = license.id;
    });

    it('should create a store with generated login ID', async () => {
      const store = await storesDB.create({
        tenantId,
        licenseId,
        name: 'Downtown Location',
        storeEmail: 'downtown@testsalon.com',
        password: 'securepass123',
        address: '123 Main St',
        timezone: 'America/New_York',
      });

      expect(store).toBeDefined();
      expect(store.storeLoginId).toBeDefined();
      expect(store.storeLoginId).toContain('downtown');
      expect(store.status).toBe('active');
      expect(store.deviceCount).toBe(0);
    });

    it('should verify store password', async () => {
      const store = await storesDB.create({
        tenantId,
        licenseId,
        name: 'Auth Test Store',
        storeEmail: 'auth@testsalon.com',
        password: 'testpass123',
        timezone: 'America/New_York',
      });

      const verified = await storesDB.verifyPassword(store.storeLoginId, 'testpass123');
      expect(verified).not.toBeNull();
      expect(verified?.id).toBe(store.id);

      const wrongPass = await storesDB.verifyPassword(store.storeLoginId, 'wrongpassword');
      expect(wrongPass).toBeNull();
    });

    it('should record store login activity', async () => {
      const store = await storesDB.create({
        tenantId,
        licenseId,
        name: 'Activity Store',
        storeEmail: 'activity@testsalon.com',
        password: 'testpass',
        timezone: 'America/New_York',
      });

      expect(store.lastLoginAt).toBeUndefined();

      const updated = await storesDB.recordLogin(store.id);
      expect(updated?.lastLoginAt).toBeDefined();
      expect(updated?.activatedAt).toBeDefined();
    });

    it('should get stores by license', async () => {
      await storesDB.create({
        tenantId,
        licenseId,
        name: 'Store 1',
        storeEmail: 'store1@test.com',
        password: 'pass1',
        timezone: 'America/New_York',
      });

      await storesDB.create({
        tenantId,
        licenseId,
        name: 'Store 2',
        storeEmail: 'store2@test.com',
        password: 'pass2',
        timezone: 'America/New_York',
      });

      const stores = await storesDB.getByLicenseId(licenseId);
      expect(stores.length).toBe(2);
    });
  });

  describe('Member CRUD Operations', () => {
    let tenantId: string;
    let storeId: string;

    beforeEach(async () => {
      const tenant = await tenantsDB.create({
        name: 'Member Test Tenant',
        email: 'member-test@example.com',
      });
      tenantId = tenant.id;

      const license = await licensesDB.create({
        tenantId,
        tier: 'professional',
      });

      const store = await storesDB.create({
        tenantId,
        licenseId: license.id,
        name: 'Member Test Store',
        storeEmail: 'member-store@test.com',
        password: 'storepass',
        timezone: 'America/New_York',
      });
      storeId = store.id;
    });

    it('should create a member with role permissions', async () => {
      const member = await membersDB.create({
        tenantId,
        storeIds: [storeId],
        name: 'Jane Admin',
        email: 'jane@testsalon.com',
        password: 'adminpass123',
        pin: '1234',
        role: 'admin',
      });

      expect(member).toBeDefined();
      expect(member.role).toBe('admin');
      expect(member.permissions).toBeDefined();
      expect(member.permissions.length).toBeGreaterThan(0);
      expect(member.status).toBe('active');
    });

    it('should verify member password', async () => {
      const member = await membersDB.create({
        tenantId,
        storeIds: [storeId],
        name: 'Auth Member',
        email: 'authmember@test.com',
        password: 'memberpass',
        role: 'staff',
      });

      const verified = await membersDB.verifyPassword('authmember@test.com', 'memberpass');
      expect(verified).not.toBeNull();
      expect(verified?.id).toBe(member.id);

      const wrong = await membersDB.verifyPassword('authmember@test.com', 'wrongpass');
      expect(wrong).toBeNull();
    });

    it('should verify member PIN', async () => {
      const member = await membersDB.create({
        tenantId,
        storeIds: [storeId],
        name: 'PIN Member',
        email: 'pinmember@test.com',
        password: 'memberpass',
        pin: '5678',
        role: 'staff',
      });

      const verified = await membersDB.verifyPin('pinmember@test.com', '5678');
      expect(verified).not.toBeNull();

      const wrong = await membersDB.verifyPin('pinmember@test.com', '0000');
      expect(wrong).toBeNull();
    });

    it('should add/remove member from stores', async () => {
      const member = await membersDB.create({
        tenantId,
        storeIds: [storeId],
        name: 'Multi-Store Member',
        email: 'multistore@test.com',
        password: 'pass',
        role: 'manager',
      });

      expect(member.storeIds.length).toBe(1);

      // Create another store
      const license = (await licensesDB.getByTenantId(tenantId))[0];
      const store2 = await storesDB.create({
        tenantId,
        licenseId: license.id,
        name: 'Second Store',
        storeEmail: 'second@test.com',
        password: 'pass2',
        timezone: 'America/New_York',
      });

      const added = await membersDB.addToStore(member.id, store2.id);
      expect(added?.storeIds.length).toBe(2);

      const removed = await membersDB.removeFromStore(member.id, store2.id);
      expect(removed?.storeIds.length).toBe(1);
    });

    it('should create members with different roles', async () => {
      const admin = await membersDB.create({
        tenantId,
        storeIds: [storeId],
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'pass',
        role: 'admin',
      });

      const manager = await membersDB.create({
        tenantId,
        storeIds: [storeId],
        name: 'Manager User',
        email: 'manager@test.com',
        password: 'pass',
        role: 'manager',
      });

      const staff = await membersDB.create({
        tenantId,
        storeIds: [storeId],
        name: 'Staff User',
        email: 'staff@test.com',
        password: 'pass',
        role: 'staff',
      });

      // Admin should have more permissions than staff
      expect(admin.permissions.length).toBeGreaterThan(staff.permissions.length);
      expect(manager.permissions.length).toBeGreaterThan(staff.permissions.length);
    });
  });

  describe('Database Stats', () => {
    it('should return correct statistics', async () => {
      // Create test data
      const tenant = await tenantsDB.create({
        name: 'Stats Tenant',
        email: 'stats@example.com',
      });

      const license = await licensesDB.create({
        tenantId: tenant.id,
        tier: 'professional',
      });

      await storesDB.create({
        tenantId: tenant.id,
        licenseId: license.id,
        name: 'Stats Store',
        storeEmail: 'stats-store@test.com',
        password: 'pass',
        timezone: 'America/New_York',
      });

      const stats = await getAdminDBStats();

      expect(stats.tenants).toBe(1);
      expect(stats.licenses.total).toBe(1);
      expect(stats.licenses.active).toBe(1);
      expect(stats.stores).toBe(1);
    });
  });

  describe('Admin User Operations', () => {
    it('should create admin user with hashed password', async () => {
      const admin = await adminUsersDB.create({
        email: 'test@admin.com',
        password: 'testpass',
        name: 'Test Admin',
        role: 'admin',
      });

      expect(admin).toBeDefined();
      expect(admin.email).toBe('test@admin.com');
      expect(admin.passwordHash).toBeDefined();
      expect(admin.passwordHash).not.toBe('testpass'); // Should be hashed
    });

    it('should verify admin password', async () => {
      await adminUsersDB.create({
        email: 'verify@admin.com',
        password: 'mypassword',
        name: 'Verify Admin',
        role: 'admin',
      });

      const verified = await adminUsersDB.verifyPassword('verify@admin.com', 'mypassword');
      expect(verified).not.toBeNull();

      const wrong = await adminUsersDB.verifyPassword('verify@admin.com', 'wrongpass');
      expect(wrong).toBeNull();
    });
  });

  describe('Quick Onboard Flow Simulation', () => {
    it('should create full customer setup (tenant -> license -> store -> member)', async () => {
      // Step 1: Create Tenant
      const tenant = await tenantsDB.create({
        name: 'New Customer',
        email: 'newcustomer@example.com',
        phone: '555-1234',
        company: 'New Salon LLC',
        address: '456 Oak Ave',
      });

      expect(tenant.id).toBeDefined();

      // Step 2: Create License
      const license = await licensesDB.create({
        tenantId: tenant.id,
        tier: 'professional',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });

      expect(license.licenseKey).toBeDefined();
      expect(license.tenantId).toBe(tenant.id);

      // Step 3: Create Store
      const store = await storesDB.create({
        tenantId: tenant.id,
        licenseId: license.id,
        name: 'Main Location',
        storeEmail: 'main@newsalon.com',
        password: 'storepass123',
        address: '456 Oak Ave',
        phone: '555-1234',
        timezone: 'America/New_York',
      });

      expect(store.storeLoginId).toBeDefined();
      expect(store.tenantId).toBe(tenant.id);
      expect(store.licenseId).toBe(license.id);

      // Step 4: Create Admin Member
      const member = await membersDB.create({
        tenantId: tenant.id,
        storeIds: [store.id],
        name: 'Store Admin',
        email: 'admin@newsalon.com',
        password: 'adminpass123',
        pin: '1234',
        role: 'admin',
      });

      expect(member.tenantId).toBe(tenant.id);
      expect(member.storeIds).toContain(store.id);
      expect(member.role).toBe('admin');

      // Verify relationships
      const tenantLicenses = await licensesDB.getByTenantId(tenant.id);
      expect(tenantLicenses.length).toBe(1);

      const licenseStores = await storesDB.getByLicenseId(license.id);
      expect(licenseStores.length).toBe(1);

      const tenantMembers = await membersDB.getByTenantId(tenant.id);
      expect(tenantMembers.length).toBe(1);

      // Verify store can authenticate
      const authResult = await storesDB.verifyPassword(store.storeLoginId, 'storepass123');
      expect(authResult).not.toBeNull();

      // Verify member can authenticate
      const memberAuth = await membersDB.verifyPassword('admin@newsalon.com', 'adminpass123');
      expect(memberAuth).not.toBeNull();

      // Verify member PIN
      const pinAuth = await membersDB.verifyPin('admin@newsalon.com', '1234');
      expect(pinAuth).not.toBeNull();
    });
  });
});
