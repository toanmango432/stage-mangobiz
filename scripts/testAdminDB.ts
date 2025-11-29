/**
 * Simple Admin Portal Database Test Script
 * Run with: npx tsx scripts/testAdminDB.ts
 */

import 'fake-indexeddb/auto';
import { adminDb } from '../src/admin/db/schema';
import { tenantsDB, licensesDB, storesDB, membersDB, adminUsersDB, getAdminDBStats } from '../src/admin/db/database';

async function runTests() {
  console.log('🧪 Starting Admin Portal Database Tests\n');
  let passed = 0;
  let failed = 0;

  // Helper
  const test = async (name: string, fn: () => Promise<boolean>) => {
    try {
      const result = await fn();
      if (result) {
        console.log(`  ✅ ${name}`);
        passed++;
      } else {
        console.log(`  ❌ ${name}`);
        failed++;
      }
    } catch (error) {
      console.log(`  ❌ ${name}: ${error}`);
      failed++;
    }
  };

  // Clean database
  await adminDb.tenants.clear();
  await adminDb.licenses.clear();
  await adminDb.stores.clear();
  await adminDb.members.clear();
  await adminDb.adminUsers.clear();

  // ==================== TENANT TESTS ====================
  console.log('\n📦 Tenant CRUD Tests:');

  await test('Create tenant', async () => {
    const tenant = await tenantsDB.create({
      name: 'Test Tenant',
      email: 'test@tenant.com',
      company: 'Test Company',
    });
    return tenant.id !== undefined && tenant.name === 'Test Tenant';
  });

  await test('Get tenant by ID', async () => {
    const all = await tenantsDB.getAll();
    const tenant = await tenantsDB.getById(all[0].id);
    return tenant !== undefined && tenant.email === 'test@tenant.com';
  });

  await test('Update tenant', async () => {
    const all = await tenantsDB.getAll();
    const updated = await tenantsDB.update(all[0].id, { name: 'Updated Tenant' });
    return updated?.name === 'Updated Tenant';
  });

  await test('Suspend tenant', async () => {
    const all = await tenantsDB.getAll();
    const suspended = await tenantsDB.suspend(all[0].id);
    return suspended?.status === 'suspended';
  });

  await test('Activate tenant', async () => {
    const all = await tenantsDB.getAll();
    const activated = await tenantsDB.activate(all[0].id);
    return activated?.status === 'active';
  });

  await test('Search tenant', async () => {
    const results = await tenantsDB.search('Updated');
    return results.length === 1 && results[0].name === 'Updated Tenant';
  });

  // ==================== LICENSE TESTS ====================
  console.log('\n🔑 License CRUD Tests:');

  const tenants = await tenantsDB.getAll();
  const tenantId = tenants[0].id;

  await test('Create license with auto-generated key', async () => {
    const license = await licensesDB.create({
      tenantId,
      tier: 'professional',
    });
    return license.licenseKey.match(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/) !== null;
  });

  await test('License has correct tier defaults', async () => {
    const licenses = await licensesDB.getByTenantId(tenantId);
    const license = licenses[0];
    return license.maxStores === 3 && license.maxDevicesPerStore === 5 && license.tier === 'professional';
  });

  await test('Get license by key', async () => {
    const licenses = await licensesDB.getByTenantId(tenantId);
    const found = await licensesDB.getByLicenseKey(licenses[0].licenseKey);
    return found !== undefined && found.id === licenses[0].id;
  });

  await test('Revoke license', async () => {
    const licenses = await licensesDB.getByTenantId(tenantId);
    const revoked = await licensesDB.revoke(licenses[0].id);
    return revoked?.status === 'revoked';
  });

  await test('Reactivate license', async () => {
    const licenses = await licensesDB.getByTenantId(tenantId);
    const activated = await licensesDB.activate(licenses[0].id);
    return activated?.status === 'active';
  });

  // ==================== STORE TESTS ====================
  console.log('\n🏪 Store CRUD Tests:');

  const licenses = await licensesDB.getByTenantId(tenantId);
  const licenseId = licenses[0].id;

  await test('Create store with generated login ID', async () => {
    const store = await storesDB.create({
      tenantId,
      licenseId,
      name: 'Test Store',
      storeEmail: 'test@store.com',
      password: 'testpass123',
      timezone: 'America/New_York',
    });
    return store.storeLoginId !== undefined && store.storeLoginId.includes('test');
  });

  await test('Verify store password - correct', async () => {
    const stores = await storesDB.getByLicenseId(licenseId);
    const verified = await storesDB.verifyPassword(stores[0].storeLoginId, 'testpass123');
    return verified !== null && verified.id === stores[0].id;
  });

  await test('Verify store password - incorrect', async () => {
    const stores = await storesDB.getByLicenseId(licenseId);
    const verified = await storesDB.verifyPassword(stores[0].storeLoginId, 'wrongpass');
    return verified === null;
  });

  await test('Record store login', async () => {
    const stores = await storesDB.getByLicenseId(licenseId);
    const updated = await storesDB.recordLogin(stores[0].id);
    return updated?.lastLoginAt !== undefined && updated?.activatedAt !== undefined;
  });

  // ==================== MEMBER TESTS ====================
  console.log('\n👤 Member CRUD Tests:');

  const stores = await storesDB.getByLicenseId(licenseId);
  const storeId = stores[0].id;

  await test('Create admin member', async () => {
    const member = await membersDB.create({
      tenantId,
      storeIds: [storeId],
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'adminpass',
      pin: '1234',
      role: 'admin',
    });
    return member.role === 'admin' && member.permissions.length > 0;
  });

  await test('Verify member password - correct', async () => {
    const verified = await membersDB.verifyPassword('admin@test.com', 'adminpass');
    return verified !== null && verified.name === 'Test Admin';
  });

  await test('Verify member password - incorrect', async () => {
    const verified = await membersDB.verifyPassword('admin@test.com', 'wrongpass');
    return verified === null;
  });

  await test('Verify member PIN - correct', async () => {
    const verified = await membersDB.verifyPin('admin@test.com', '1234');
    return verified !== null && verified.name === 'Test Admin';
  });

  await test('Verify member PIN - incorrect', async () => {
    const verified = await membersDB.verifyPin('admin@test.com', '0000');
    return verified === null;
  });

  await test('Create staff member with fewer permissions', async () => {
    const staff = await membersDB.create({
      tenantId,
      storeIds: [storeId],
      name: 'Test Staff',
      email: 'staff@test.com',
      password: 'staffpass',
      role: 'staff',
    });
    const admins = await membersDB.getByRole(tenantId, 'admin');
    return staff.permissions.length < admins[0].permissions.length;
  });

  // ==================== ADMIN USER TESTS ====================
  console.log('\n🔐 Admin User Tests:');

  await test('Create admin user with hashed password', async () => {
    const admin = await adminUsersDB.create({
      email: 'super@admin.com',
      password: 'superpass',
      name: 'Super Admin',
      role: 'super_admin',
    });
    return admin.passwordHash !== 'superpass' && admin.passwordHash.length > 0;
  });

  await test('Verify admin password - correct', async () => {
    const verified = await adminUsersDB.verifyPassword('super@admin.com', 'superpass');
    return verified !== null && verified.name === 'Super Admin';
  });

  await test('Verify admin password - incorrect', async () => {
    const verified = await adminUsersDB.verifyPassword('super@admin.com', 'wrongpass');
    return verified === null;
  });

  // ==================== STATS TEST ====================
  console.log('\n📊 Database Stats Test:');

  await test('Get correct database statistics', async () => {
    const stats = await getAdminDBStats();
    return stats.tenants >= 1 &&
           stats.licenses.total >= 1 &&
           stats.stores >= 1 &&
           stats.members >= 2 &&
           stats.adminUsers >= 1;
  });

  // ==================== QUICK ONBOARD FLOW ====================
  console.log('\n🚀 Quick Onboard Flow Test:');

  // Clear and test full flow
  await adminDb.tenants.clear();
  await adminDb.licenses.clear();
  await adminDb.stores.clear();
  await adminDb.members.clear();

  await test('Complete onboarding flow (tenant → license → store → member)', async () => {
    // Create tenant
    const tenant = await tenantsDB.create({
      name: 'New Customer',
      email: 'customer@newsalon.com',
      company: 'New Salon LLC',
    });

    // Create license
    const license = await licensesDB.create({
      tenantId: tenant.id,
      tier: 'professional',
    });

    // Create store
    const store = await storesDB.create({
      tenantId: tenant.id,
      licenseId: license.id,
      name: 'Main Store',
      storeEmail: 'main@newsalon.com',
      password: 'storepass',
      timezone: 'America/New_York',
    });

    // Create admin member
    const member = await membersDB.create({
      tenantId: tenant.id,
      storeIds: [store.id],
      name: 'Store Owner',
      email: 'owner@newsalon.com',
      password: 'ownerpass',
      pin: '5678',
      role: 'admin',
    });

    // Verify all relationships
    const tenantLicenses = await licensesDB.getByTenantId(tenant.id);
    const licenseStores = await storesDB.getByLicenseId(license.id);
    const tenantMembers = await membersDB.getByTenantId(tenant.id);

    // Verify authentication
    const storeAuth = await storesDB.verifyPassword(store.storeLoginId, 'storepass');
    const memberAuth = await membersDB.verifyPassword('owner@newsalon.com', 'ownerpass');
    const pinAuth = await membersDB.verifyPin('owner@newsalon.com', '5678');

    return tenantLicenses.length === 1 &&
           licenseStores.length === 1 &&
           tenantMembers.length === 1 &&
           storeAuth !== null &&
           memberAuth !== null &&
           pinAuth !== null;
  });

  // ==================== SUMMARY ====================
  console.log('\n' + '='.repeat(50));
  console.log(`📋 Test Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50) + '\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error('Test runner error:', error);
  process.exit(1);
});
