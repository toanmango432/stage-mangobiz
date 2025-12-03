/**
 * Development Server for Control Center API
 *
 * This creates a simple HTTP server that handles:
 * - Store Login (storeId + password)
 * - Member Login (email + password)
 * - PIN Login (quick auth for store staff)
 * - License Validation (legacy)
 *
 * All authentication uses the Supabase cloud database.
 *
 * Usage:
 *   npx tsx src/admin/api/devServer.ts
 *
 * Or add to package.json scripts:
 *   "admin:server": "tsx src/admin/api/devServer.ts"
 */

import http from 'http';
import { validateLicense, ValidateLicenseRequest } from './validateLicense';
import {
  storesDB,
  membersDB,
  licensesDB,
  auditLogsDB,
  initializeSupabaseDatabase,
  seedSupabaseDatabase,
} from '../db/supabaseDatabase';

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0';

// CORS headers for development
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

// Default store setup data (sent on first login)
// TODO: In production, this should be loaded from Supabase system_config table
// The Control Center UI at /admin manages these settings in IndexedDB (browser-side)
// For full integration, add a system_config table to Supabase and load from there
const DEFAULT_STORE_SETUP = {
  taxSettings: [
    { name: 'Sales Tax', rate: 8.5, isDefault: true },
  ],
  categories: [
    { name: 'Manicure', icon: '💅', color: '#FF6B9D' },
    { name: 'Pedicure', icon: '🦶', color: '#4ECDC4' },
    { name: 'Waxing', icon: '✨', color: '#95E1D3' },
    { name: 'Facial', icon: '🧖', color: '#F9ED69' },
  ],
  items: [
    { name: 'Basic Manicure', category: 'Manicure', description: 'Filing, shaping, cuticle care', duration: 30, price: 20, commissionRate: 50 },
    { name: 'Gel Manicure', category: 'Manicure', description: 'Premium gel polish', duration: 45, price: 35, commissionRate: 50 },
    { name: 'Basic Pedicure', category: 'Pedicure', description: 'Soak, filing, cuticle care', duration: 45, price: 30, commissionRate: 50 },
    { name: 'Spa Pedicure', category: 'Pedicure', description: 'Deluxe with massage and mask', duration: 60, price: 50, commissionRate: 50 },
  ],
  employeeRoles: [
    { name: 'Manager', permissions: ['all'], color: '#10B981' },
    { name: 'Technician', permissions: ['create_ticket', 'checkout'], color: '#3B82F6' },
  ],
  paymentMethods: [
    { name: 'Cash', type: 'cash', isActive: true },
    { name: 'Credit Card', type: 'card', isActive: true },
    { name: 'Debit Card', type: 'card', isActive: true },
    { name: 'Gift Card', type: 'gift_card', isActive: true },
  ],
};

// Track first logins for sending defaults
const activatedStores = new Set<string>();

// Mock mode flag (enabled when Supabase is unavailable)
let MOCK_MODE = false;

// Mock data for offline/development use
const MOCK_STORES: Record<string, { id: string; name: string; storeLoginId: string; password: string; status: string; licenseId: string }> = {
  'demo@salon.com': {
    id: 'store-demo-001',
    name: 'Demo Salon & Spa',
    storeLoginId: 'demo@salon.com',
    password: 'demo123',
    status: 'active',
    licenseId: 'license-demo-001',
  },
  'salon-001': {
    id: 'store-salon-001',
    name: 'Salon 001',
    storeLoginId: 'salon-001',
    password: '1234',
    status: 'active',
    licenseId: 'license-salon-001',
  },
};


const MOCK_LICENSES: Record<string, { id: string; tier: string; status: string }> = {
  'license-demo-001': { id: 'license-demo-001', tier: 'professional', status: 'active' },
  'license-salon-001': { id: 'license-salon-001', tier: 'basic', status: 'active' },
};

// ==================== RATE LIMITING ====================

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  blockedUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes block

function checkRateLimit(key: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry) {
    rateLimitStore.set(key, { attempts: 1, firstAttempt: now });
    return { allowed: true };
  }

  // Check if currently blocked
  if (entry.blockedUntil && now < entry.blockedUntil) {
    const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Reset if window expired
  if (now - entry.firstAttempt > RATE_LIMIT_WINDOW) {
    rateLimitStore.set(key, { attempts: 1, firstAttempt: now });
    return { allowed: true };
  }

  // Check if too many attempts
  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.blockedUntil = now + BLOCK_DURATION;
    const retryAfter = Math.ceil(BLOCK_DURATION / 1000);
    return { allowed: false, retryAfter };
  }

  // Increment attempts
  entry.attempts++;
  return { allowed: true };
}


// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.firstAttempt > RATE_LIMIT_WINDOW && (!entry.blockedUntil || now > entry.blockedUntil)) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

// ==================== HELPERS ====================

function getClientIp(req: http.IncomingMessage): string {
  return req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
         req.socket.remoteAddress ||
         'unknown';
}

function getUserAgent(req: http.IncomingMessage): string {
  return req.headers['user-agent'] || 'unknown';
}

// ==================== AUTH HANDLERS ====================

async function handleStoreLogin(body: any, req: http.IncomingMessage, res: http.ServerResponse) {
  const { storeId, password } = body;

  console.log(`[Store Login] Attempting: ${storeId}${MOCK_MODE ? ' (MOCK MODE)' : ''}`);

  if (!storeId || !password) {
    res.writeHead(400, corsHeaders);
    res.end(JSON.stringify({
      success: false,
      error: 'Missing storeId or password',
    }));
    return;
  }

  const clientIp = getClientIp(req);
  const userAgent = getUserAgent(req);

  // Use mock data if in mock mode
  if (MOCK_MODE) {
    const mockStore = MOCK_STORES[storeId];

    if (!mockStore || mockStore.password !== password) {
      console.log(`  ❌ Invalid credentials for: ${storeId}`);
      res.writeHead(401, corsHeaders);
      res.end(JSON.stringify({
        success: false,
        error: 'Invalid store ID or password',
      }));
      return;
    }

    if (mockStore.status === 'suspended') {
      res.writeHead(403, corsHeaders);
      res.end(JSON.stringify({
        success: false,
        error: 'This store has been suspended. Please contact support.',
        status: 'suspended',
      }));
      return;
    }

    const mockLicense = MOCK_LICENSES[mockStore.licenseId];
    const isFirstLogin = !activatedStores.has(mockStore.id);
    if (isFirstLogin) {
      activatedStores.add(mockStore.id);
    }

    console.log(`  ✅ Store login success: ${mockStore.name} (first: ${isFirstLogin})`);

    const response: any = {
      success: true,
      store: {
        id: mockStore.id,
        name: mockStore.name,
        storeLoginId: mockStore.storeLoginId,
      },
      license: {
        tier: mockLicense?.tier || 'basic',
        status: mockLicense?.status || 'active',
      },
      token: `store_token_${mockStore.id}_${Date.now()}`,
    };

    if (isFirstLogin) {
      response.defaults = DEFAULT_STORE_SETUP;
    }

    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify(response));
    return;
  }

  // Verify store credentials against real database
  const store = await storesDB.verifyPassword(storeId, password);

  if (!store) {
    console.log(`  ❌ Invalid credentials for: ${storeId}`);
    // Audit failed login
    await auditLogsDB.create({
      action: 'store_login_failed',
      entityType: 'store',
      details: { storeLoginId: storeId, reason: 'invalid_credentials' },
      ipAddress: clientIp,
      userAgent,
    });
    res.writeHead(401, corsHeaders);
    res.end(JSON.stringify({
      success: false,
      error: 'Invalid store ID or password',
    }));
    return;
  }

  if (store.status === 'suspended') {
    console.log(`  ❌ Store suspended: ${storeId}`);
    await auditLogsDB.create({
      action: 'store_login_failed',
      entityType: 'store',
      entityId: store.id,
      details: { storeLoginId: storeId, reason: 'suspended' },
      ipAddress: clientIp,
      userAgent,
    });
    res.writeHead(403, corsHeaders);
    res.end(JSON.stringify({
      success: false,
      error: 'This store has been suspended. Please contact support.',
      status: 'suspended',
    }));
    return;
  }

  if (store.status === 'inactive') {
    console.log(`  ❌ Store inactive: ${storeId}`);
    await auditLogsDB.create({
      action: 'store_login_failed',
      entityType: 'store',
      entityId: store.id,
      details: { storeLoginId: storeId, reason: 'inactive' },
      ipAddress: clientIp,
      userAgent,
    });
    res.writeHead(403, corsHeaders);
    res.end(JSON.stringify({
      success: false,
      error: 'This store is inactive. Please contact support.',
      status: 'inactive',
    }));
    return;
  }

  // Get license info
  const license = await licensesDB.getById(store.licenseId);
  const tier = license?.tier || 'free';

  // Check if first login
  const isFirstLogin = !activatedStores.has(store.id);
  if (isFirstLogin) {
    activatedStores.add(store.id);
  }

  // Record the login
  await storesDB.recordLogin(store.id);

  // Audit successful login
  await auditLogsDB.create({
    action: 'store_login',
    entityType: 'store',
    entityId: store.id,
    details: { storeLoginId: storeId, storeName: store.name, tier, isFirstLogin },
    ipAddress: clientIp,
    userAgent,
  });

  console.log(`  ✅ Store login success: ${store.name} (first: ${isFirstLogin})`);

  const response: any = {
    success: true,
    store: {
      id: store.id,
      name: store.name,
      storeLoginId: store.storeLoginId,
    },
    license: {
      tier: tier,
      status: license?.status || 'active',
    },
    token: `store_token_${store.id}_${Date.now()}`,
  };

  if (isFirstLogin) {
    response.defaults = DEFAULT_STORE_SETUP;
  }

  res.writeHead(200, corsHeaders);
  res.end(JSON.stringify(response));
}

async function handleMemberLogin(body: any, req: http.IncomingMessage, res: http.ServerResponse) {
  const { email, password, storeId } = body;

  console.log(`[Member Login] Attempting: ${email}`);

  if (!email || !password) {
    res.writeHead(400, corsHeaders);
    res.end(JSON.stringify({
      success: false,
      error: 'Missing email or password',
    }));
    return;
  }

  // Verify member credentials against real database
  const member = await membersDB.verifyPassword(email, password);

  const clientIp = getClientIp(req);
  const userAgent = getUserAgent(req);

  if (!member) {
    console.log(`  ❌ Invalid credentials for: ${email}`);
    await auditLogsDB.create({
      action: 'member_login_failed',
      entityType: 'member',
      details: { email, reason: 'invalid_credentials' },
      ipAddress: clientIp,
      userAgent,
    });
    res.writeHead(401, corsHeaders);
    res.end(JSON.stringify({
      success: false,
      error: 'Invalid email or password',
    }));
    return;
  }

  if (member.status === 'suspended') {
    console.log(`  ❌ Member suspended: ${email}`);
    await auditLogsDB.create({
      action: 'member_login_failed',
      entityType: 'member',
      entityId: member.id,
      details: { email, reason: 'suspended' },
      ipAddress: clientIp,
      userAgent,
    });
    res.writeHead(403, corsHeaders);
    res.end(JSON.stringify({
      success: false,
      error: 'Your account has been suspended. Please contact your administrator.',
      status: 'suspended',
    }));
    return;
  }

  if (member.status === 'inactive') {
    console.log(`  ❌ Member inactive: ${email}`);
    await auditLogsDB.create({
      action: 'member_login_failed',
      entityType: 'member',
      entityId: member.id,
      details: { email, reason: 'inactive' },
      ipAddress: clientIp,
      userAgent,
    });
    res.writeHead(403, corsHeaders);
    res.end(JSON.stringify({
      success: false,
      error: 'Your account is inactive. Please contact your administrator.',
      status: 'inactive',
    }));
    return;
  }

  // If storeId provided, verify access
  if (storeId && !member.storeIds.includes(storeId)) {
    console.log(`  ❌ Member doesn't have access to store: ${storeId}`);
    await auditLogsDB.create({
      action: 'member_login_failed',
      entityType: 'member',
      entityId: member.id,
      details: { email, storeId, reason: 'no_store_access' },
      ipAddress: clientIp,
      userAgent,
    });
    res.writeHead(403, corsHeaders);
    res.end(JSON.stringify({
      success: false,
      error: 'You do not have access to this store',
    }));
    return;
  }

  // Get stores this member can access
  const accessibleStores = await Promise.all(
    member.storeIds.map(async (sid) => {
      const store = await storesDB.getById(sid);
      if (store && store.status === 'active') {
        return {
          id: store.id,
          name: store.name,
          storeLoginId: store.storeLoginId,
        };
      }
      return null;
    })
  );
  const filteredStores = accessibleStores.filter(Boolean);

  // Record the login
  await membersDB.recordLogin(member.id);

  // Audit successful login
  await auditLogsDB.create({
    action: 'member_login',
    entityType: 'member',
    entityId: member.id,
    details: { email, memberName: member.name, role: member.role, storeCount: filteredStores.length },
    ipAddress: clientIp,
    userAgent,
  });

  console.log(`  ✅ Member login success: ${member.name} (stores: ${filteredStores.length})`);

  res.writeHead(200, corsHeaders);
  res.end(JSON.stringify({
    success: true,
    member: {
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
    },
    stores: filteredStores,
    requiresStoreSelection: filteredStores.length > 1 && !storeId,
    token: `member_token_${member.id}_${Date.now()}`,
  }));
}

async function handlePinLogin(body: any, req: http.IncomingMessage, res: http.ServerResponse) {
  const { pin, storeId } = body;

  console.log(`[PIN Login] Attempting with PIN in store: ${storeId}`);

  if (!pin || !storeId) {
    res.writeHead(400, corsHeaders);
    res.end(JSON.stringify({
      success: false,
      error: 'Missing PIN or storeId',
    }));
    return;
  }

  // Get all members for this store
  const storeMembers = await membersDB.getByStoreId(storeId);

  // Find member with matching PIN who is active
  const member = storeMembers.find(
    (m) => m.pin === pin && m.status === 'active'
  );

  const clientIp = getClientIp(req);
  const userAgent = getUserAgent(req);

  if (!member) {
    console.log(`  ❌ Invalid PIN or no access to store`);
    await auditLogsDB.create({
      action: 'pin_login_failed',
      entityType: 'store',
      entityId: storeId,
      details: { storeId, reason: 'invalid_pin' },
      ipAddress: clientIp,
      userAgent,
    });
    res.writeHead(401, corsHeaders);
    res.end(JSON.stringify({
      success: false,
      error: 'Invalid PIN',
    }));
    return;
  }

  // Record the login
  await membersDB.recordLogin(member.id);

  // Audit successful PIN login
  await auditLogsDB.create({
    action: 'pin_login',
    entityType: 'member',
    entityId: member.id,
    details: { storeId, memberName: member.name, role: member.role },
    ipAddress: clientIp,
    userAgent,
  });

  console.log(`  ✅ PIN login success: ${member.name}`);

  res.writeHead(200, corsHeaders);
  res.end(JSON.stringify({
    success: true,
    member: {
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
    },
    token: `pin_token_${member.id}_${Date.now()}`,
  }));
}

// ==================== REQUEST ROUTER ====================

async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = new URL(req.url || '/', `http://${HOST}:${PORT}`);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  // Store Login
  if (req.method === 'POST' && url.pathname === '/api/auth/store') {
    const clientIp = getClientIp(req);
    const rateLimitKey = `store:${clientIp}`;
    const rateLimit = checkRateLimit(rateLimitKey);

    if (!rateLimit.allowed) {
      console.log(`[Store Login] Rate limited: ${clientIp}`);
      res.writeHead(429, { ...corsHeaders, 'Retry-After': String(rateLimit.retryAfter) });
      res.end(JSON.stringify({
        success: false,
        error: 'Too many login attempts. Please try again later.',
        retryAfter: rateLimit.retryAfter,
      }));
      return;
    }

    try {
      const body = await parseBody(req);
      await handleStoreLogin(JSON.parse(body), req, res);
    } catch (error) {
      console.error('Error handling store login:', error);
      res.writeHead(400, corsHeaders);
      res.end(JSON.stringify({ success: false, error: 'Invalid request body' }));
    }
    return;
  }

  // Member Login
  if (req.method === 'POST' && url.pathname === '/api/auth/member') {
    const clientIp = getClientIp(req);
    const rateLimitKey = `member:${clientIp}`;
    const rateLimit = checkRateLimit(rateLimitKey);

    if (!rateLimit.allowed) {
      console.log(`[Member Login] Rate limited: ${clientIp}`);
      res.writeHead(429, { ...corsHeaders, 'Retry-After': String(rateLimit.retryAfter) });
      res.end(JSON.stringify({
        success: false,
        error: 'Too many login attempts. Please try again later.',
        retryAfter: rateLimit.retryAfter,
      }));
      return;
    }

    try {
      const body = await parseBody(req);
      await handleMemberLogin(JSON.parse(body), req, res);
    } catch (error) {
      console.error('Error handling member login:', error);
      res.writeHead(400, corsHeaders);
      res.end(JSON.stringify({ success: false, error: 'Invalid request body' }));
    }
    return;
  }

  // PIN Login
  if (req.method === 'POST' && url.pathname === '/api/auth/pin') {
    const clientIp = getClientIp(req);
    const rateLimitKey = `pin:${clientIp}`;
    const rateLimit = checkRateLimit(rateLimitKey);

    if (!rateLimit.allowed) {
      console.log(`[PIN Login] Rate limited: ${clientIp}`);
      res.writeHead(429, { ...corsHeaders, 'Retry-After': String(rateLimit.retryAfter) });
      res.end(JSON.stringify({
        success: false,
        error: 'Too many login attempts. Please try again later.',
        retryAfter: rateLimit.retryAfter,
      }));
      return;
    }

    try {
      const body = await parseBody(req);
      await handlePinLogin(JSON.parse(body), req, res);
    } catch (error) {
      console.error('Error handling PIN login:', error);
      res.writeHead(400, corsHeaders);
      res.end(JSON.stringify({ success: false, error: 'Invalid request body' }));
    }
    return;
  }

  // License validation endpoint (legacy)
  if (req.method === 'POST' && url.pathname === '/api/validate-license') {
    try {
      // Parse request body
      const body = await parseBody(req);
      const request: ValidateLicenseRequest = JSON.parse(body);

      // Get client IP
      const clientIp = req.headers['x-forwarded-for']?.toString() ||
                       req.socket.remoteAddress ||
                       'unknown';

      // Validate license
      const result = await validateLicense(request, clientIp);

      res.writeHead(result.status, corsHeaders);
      res.end(JSON.stringify(result.body));

      console.log(`[${new Date().toISOString()}] POST /api/validate-license - ${result.status}`);
    } catch (error) {
      console.error('Error handling request:', error);
      res.writeHead(400, corsHeaders);
      res.end(JSON.stringify({ valid: false, message: 'Invalid request body' }));
    }
    return;
  }

  // 404 for unknown routes
  res.writeHead(404, corsHeaders);
  res.end(JSON.stringify({ error: 'Not found' }));
}

function parseBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

async function startServer() {
  console.log('🚀 Connecting to Supabase...');

  // Initialize and seed database
  const connected = await initializeSupabaseDatabase();
  if (!connected) {
    console.warn('⚠️ Supabase unavailable - enabling MOCK MODE for local development');
    MOCK_MODE = true;
  } else {
    await seedSupabaseDatabase();
  }

  // Create server
  const server = http.createServer(handleRequest);

  server.listen(Number(PORT), HOST, () => {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  🎯 Mango POS Control Center API Server');
    if (MOCK_MODE) {
      console.log('  ⚠️  MOCK MODE ENABLED (No Supabase connection)');
    }
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log(`  Server running at: http://${HOST}:${PORT}`);
    console.log('');
    console.log('  📋 Endpoints:');
    console.log('     POST /api/auth/store        - Store Login');
    console.log('     POST /api/auth/member       - Member Login');
    console.log('     POST /api/auth/pin          - PIN Login (quick)');
    console.log('     POST /api/validate-license  - Legacy license validation');
    console.log('     GET  /health                - Health check');
    console.log('');
    console.log('  🔑 Test Store Login:');
    console.log('     Store ID: demo@salon.com');
    console.log('     Password: demo123');
    console.log('');
    console.log('  👤 Test Member Logins:');
    console.log('     Owner: owner@demosalon.com / owner123 (PIN: 1234)');
    console.log('     Staff: jane@demosalon.com / jane123 (PIN: 5678)');
    console.log('');
    console.log('  📝 Test with curl:');
    console.log(`     curl -X POST http://${HOST}:${PORT}/api/auth/store \\`);
    console.log('       -H "Content-Type: application/json" \\');
    console.log('       -d \'{"storeId":"demo@salon.com","password":"demo123"}\'');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
  });
}

// Start the server
startServer().catch(console.error);
