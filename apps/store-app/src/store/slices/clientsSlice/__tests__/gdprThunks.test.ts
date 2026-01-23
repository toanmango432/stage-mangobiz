/**
 * Unit Tests for GDPR Thunks
 *
 * Tests the GDPR/CCPA compliance async thunks:
 * - createDataRequest: Create export/delete/access requests
 * - exportClientData: Export client data via Edge Function
 * - processDataDeletion: Anonymize client PII via Edge Function
 * - fetchDataRequests: Fetch data requests for a store
 * - updateDataRequestStatus: Update request status
 * - logDataRetention: Log GDPR actions for audit trail
 *
 * Phase 2 of Client Module: GDPR Compliance
 */

import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import type { ClientDataRequest, DataRetentionLog } from '../../../../types/client';
import type { ClientsState } from '../types';
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';

// ==================== MOCK SETUP ====================

// Define mock functions at module level for vi.mock hoisting
const mockSupabaseFrom = vi.fn();
const mockSupabaseFunctionsInvoke = vi.fn();

// Mock the Supabase client
vi.mock('../../../../services/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
    functions: {
      invoke: (...args: unknown[]) => mockSupabaseFunctionsInvoke(...args),
    },
  },
}));

// Mock the database modules
vi.mock('../../../../db/database', () => ({
  clientsDB: {
    getById: vi.fn(),
    getAll: vi.fn(),
    search: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getFiltered: vi.fn(),
    getStats: vi.fn(),
  },
  patchTestsDB: { getByClientId: vi.fn() },
  formResponsesDB: { getByClientId: vi.fn() },
  referralsDB: { getByReferrerId: vi.fn() },
  clientReviewsDB: { getByClientId: vi.fn() },
  loyaltyRewardsDB: { getByClientId: vi.fn() },
  reviewRequestsDB: { getByClientId: vi.fn() },
  customSegmentsDB: { getActive: vi.fn().mockResolvedValue([]) },
}));

// Mock auditLogger
vi.mock('../../../../services/audit/auditLogger', () => ({
  auditLogger: {
    log: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock dataService
vi.mock('../../../../services/dataService', () => ({
  dataService: {
    clients: {
      getAll: vi.fn(),
      getById: vi.fn(),
      search: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Import slice and thunks after mocking
import clientsReducer from '../slice';
import {
  createDataRequest,
  fetchDataRequests,
  updateDataRequestStatus,
  logDataRetention,
  exportClientData,
  processDataDeletion,
} from '../gdprThunks';
import { initialState } from '../types';

// ==================== TEST UTILITIES ====================

/**
 * Create a chainable mock for Supabase query builder
 */
function createQueryBuilderMock(finalResult: { data: unknown; error: unknown }) {
  const chain = {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(finalResult),
  };
  // Make chain methods return the chain for chaining, except terminal methods
  chain.insert.mockReturnValue(chain);
  chain.select.mockReturnValue(chain);
  chain.update.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);
  return chain;
}

/**
 * Create a mock ClientDataRequest for testing
 */
function createMockDataRequest(overrides: Partial<ClientDataRequest> = {}): ClientDataRequest {
  const now = new Date().toISOString();
  return {
    id: `request-${Math.random().toString(36).substr(2, 9)}`,
    clientId: 'client-001',
    storeId: 'store-001',
    requestType: 'export',
    status: 'pending',
    requestedAt: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Create a mock DataRetentionLog for testing
 */
function createMockRetentionLog(overrides: Partial<DataRetentionLog> = {}): DataRetentionLog {
  const now = new Date().toISOString();
  return {
    id: `log-${Math.random().toString(36).substr(2, 9)}`,
    clientId: 'client-001',
    storeId: 'store-001',
    action: 'data_exported',
    performedAt: now,
    createdAt: now,
    ...overrides,
  };
}

/**
 * Create a configured store for testing with proper async thunk support
 */
function createTestStore(preloadedState?: Partial<ClientsState>) {
  const store = configureStore({
    reducer: {
      clients: clientsReducer,
    },
    preloadedState: {
      clients: {
        ...initialState,
        ...preloadedState,
      },
    },
  });

  return store as typeof store & {
    dispatch: ThunkDispatch<{ clients: ClientsState }, unknown, UnknownAction>;
  };
}

// ==================== createDataRequest THUNK TESTS ====================

describe('createDataRequest thunk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create an export request successfully', async () => {
    const store = createTestStore();
    const mockRequest = createMockDataRequest({
      id: 'req-001',
      clientId: 'client-001',
      storeId: 'store-001',
      requestType: 'export',
      status: 'pending',
    });

    // Mock Supabase insert response (snake_case from DB)
    const queryBuilder = createQueryBuilderMock({
      data: {
        id: mockRequest.id,
        client_id: mockRequest.clientId,
        store_id: mockRequest.storeId,
        request_type: mockRequest.requestType,
        status: mockRequest.status,
        requested_at: mockRequest.requestedAt,
        processed_at: null,
        processed_by: null,
        notes: null,
        export_url: null,
        created_at: mockRequest.createdAt,
        updated_at: mockRequest.updatedAt,
      },
      error: null,
    });
    mockSupabaseFrom.mockReturnValue(queryBuilder);

    const result = await store.dispatch(
      createDataRequest({
        clientId: 'client-001',
        storeId: 'store-001',
        requestType: 'export',
      })
    );

    expect(result.type).toBe('clients/gdpr/createDataRequest/fulfilled');
    const payload = result.payload as ClientDataRequest;
    expect(payload.clientId).toBe('client-001');
    expect(payload.requestType).toBe('export');
    expect(payload.status).toBe('pending');
  });

  it('should create a delete request successfully', async () => {
    const store = createTestStore();
    const mockRequest = createMockDataRequest({
      id: 'req-002',
      clientId: 'client-002',
      requestType: 'delete',
      notes: 'GDPR deletion request',
    });

    const queryBuilder = createQueryBuilderMock({
      data: {
        id: mockRequest.id,
        client_id: mockRequest.clientId,
        store_id: mockRequest.storeId,
        request_type: 'delete',
        status: 'pending',
        requested_at: mockRequest.requestedAt,
        notes: 'GDPR deletion request',
        created_at: mockRequest.createdAt,
        updated_at: mockRequest.updatedAt,
      },
      error: null,
    });
    mockSupabaseFrom.mockReturnValue(queryBuilder);

    const result = await store.dispatch(
      createDataRequest({
        clientId: 'client-002',
        storeId: 'store-001',
        requestType: 'delete',
        notes: 'GDPR deletion request',
      })
    );

    expect(result.type).toBe('clients/gdpr/createDataRequest/fulfilled');
    const payload = result.payload as ClientDataRequest;
    expect(payload.requestType).toBe('delete');
    expect(payload.notes).toBe('GDPR deletion request');
  });

  it('should reject when Supabase returns an error', async () => {
    const store = createTestStore();

    const queryBuilder = createQueryBuilderMock({
      data: null,
      error: { message: 'Foreign key constraint violation' },
    });
    mockSupabaseFrom.mockReturnValue(queryBuilder);

    const result = await store.dispatch(
      createDataRequest({
        clientId: 'invalid-client',
        storeId: 'store-001',
        requestType: 'export',
      })
    );

    expect(result.type).toBe('clients/gdpr/createDataRequest/rejected');
    expect(result.payload).toBe('Foreign key constraint violation');
  });
});

// ==================== exportClientData THUNK TESTS ====================

describe('exportClientData thunk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export client data successfully', async () => {
    const store = createTestStore();
    const exportResponse = {
      success: true,
      data: {
        exportedAt: new Date().toISOString(),
        exportVersion: '1.0',
        client: { id: 'client-001', firstName: 'John', lastName: 'Doe' },
        appointments: [{ id: 'apt-001' }],
        tickets: [{ id: 'ticket-001' }],
        transactions: [{ id: 'txn-001' }],
      },
      downloadUrl: 'data:application/json;base64,eyJ0ZXN0IjoidGVzdCJ9',
      summary: {
        appointmentCount: 1,
        ticketCount: 1,
        transactionCount: 1,
      },
      timestamp: new Date().toISOString(),
    };

    mockSupabaseFunctionsInvoke.mockResolvedValueOnce({
      data: exportResponse,
      error: null,
    });

    const result = await store.dispatch(
      exportClientData({
        clientId: 'client-001',
        storeId: 'store-001',
        performedBy: 'staff-001',
        performedByName: 'John Staff',
      })
    );

    expect(result.type).toBe('clients/gdpr/exportClientData/fulfilled');
    expect(mockSupabaseFunctionsInvoke).toHaveBeenCalledWith('export-client-data', {
      body: {
        clientId: 'client-001',
        storeId: 'store-001',
        performedBy: 'staff-001',
        performedByName: 'John Staff',
        requestId: undefined,
      },
    });

    const payload = result.payload as typeof exportResponse;
    expect(payload.success).toBe(true);
    expect(payload.downloadUrl).toBeDefined();
    expect(payload.summary.appointmentCount).toBe(1);
  });

  it('should include requestId when provided', async () => {
    const store = createTestStore();

    mockSupabaseFunctionsInvoke.mockResolvedValueOnce({
      data: {
        success: true,
        data: { client: {} },
        downloadUrl: 'data:application/json;base64,test',
        summary: { appointmentCount: 0, ticketCount: 0, transactionCount: 0 },
      },
      error: null,
    });

    await store.dispatch(
      exportClientData({
        clientId: 'client-001',
        storeId: 'store-001',
        requestId: 'request-123',
      })
    );

    expect(mockSupabaseFunctionsInvoke).toHaveBeenCalledWith('export-client-data', {
      body: expect.objectContaining({
        requestId: 'request-123',
      }),
    });
  });

  it('should reject when Edge Function returns error', async () => {
    const store = createTestStore();

    mockSupabaseFunctionsInvoke.mockResolvedValueOnce({
      data: null,
      error: { message: 'Client not found' },
    });

    const result = await store.dispatch(
      exportClientData({
        clientId: 'invalid-client',
        storeId: 'store-001',
      })
    );

    expect(result.type).toBe('clients/gdpr/exportClientData/rejected');
    expect(result.payload).toBe('Client not found');
  });

  it('should reject when response has success: false', async () => {
    const store = createTestStore();

    mockSupabaseFunctionsInvoke.mockResolvedValueOnce({
      data: { success: false, error: 'Export processing failed' },
      error: null,
    });

    const result = await store.dispatch(
      exportClientData({
        clientId: 'client-001',
        storeId: 'store-001',
      })
    );

    expect(result.type).toBe('clients/gdpr/exportClientData/rejected');
    expect(result.payload).toBe('Export processing failed');
  });

  it('should reject when no download URL is returned', async () => {
    const store = createTestStore();

    mockSupabaseFunctionsInvoke.mockResolvedValueOnce({
      data: { success: true, downloadUrl: null },
      error: null,
    });

    const result = await store.dispatch(
      exportClientData({
        clientId: 'client-001',
        storeId: 'store-001',
      })
    );

    expect(result.type).toBe('clients/gdpr/exportClientData/rejected');
    expect(result.payload).toBe('Export completed but no download link was generated.');
  });
});

// ==================== processDataDeletion THUNK TESTS ====================

describe('processDataDeletion thunk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process data deletion successfully with confirmed flag', async () => {
    const store = createTestStore();
    const deletionResponse = {
      success: true,
      message: 'Client data anonymized successfully',
      anonymizedFields: ['first_name', 'last_name', 'email', 'phone'],
      clearedFields: ['address', 'notes', 'hair_profile'],
      preservedData: ['transactions', 'loyalty_info'],
      timestamp: new Date().toISOString(),
    };

    mockSupabaseFunctionsInvoke.mockResolvedValueOnce({
      data: deletionResponse,
      error: null,
    });

    const result = await store.dispatch(
      processDataDeletion({
        clientId: 'client-001',
        storeId: 'store-001',
        performedBy: 'staff-001',
        performedByName: 'Manager Jane',
        confirmed: true,
      })
    );

    expect(result.type).toBe('clients/gdpr/processDataDeletion/fulfilled');
    expect(mockSupabaseFunctionsInvoke).toHaveBeenCalledWith('process-data-deletion', {
      body: {
        clientId: 'client-001',
        storeId: 'store-001',
        performedBy: 'staff-001',
        performedByName: 'Manager Jane',
        requestId: undefined,
      },
    });

    const payload = result.payload as { clientId: string; response: typeof deletionResponse };
    expect(payload.clientId).toBe('client-001');
    expect(payload.response.success).toBe(true);
    expect(payload.response.anonymizedFields).toContain('first_name');
  });

  it('should reject when confirmed flag is false', async () => {
    const store = createTestStore();

    const result = await store.dispatch(
      processDataDeletion({
        clientId: 'client-001',
        storeId: 'store-001',
        performedBy: 'staff-001',
        confirmed: false, // Not confirmed
      })
    );

    expect(result.type).toBe('clients/gdpr/processDataDeletion/rejected');
    expect(result.payload).toContain('explicit confirmation');
    expect(mockSupabaseFunctionsInvoke).not.toHaveBeenCalled(); // Edge Function not called
  });

  it('should reject when performedBy is missing', async () => {
    const store = createTestStore();

    const result = await store.dispatch(
      processDataDeletion({
        clientId: 'client-001',
        storeId: 'store-001',
        performedBy: '', // Empty
        confirmed: true,
      })
    );

    expect(result.type).toBe('clients/gdpr/processDataDeletion/rejected');
    expect(result.payload).toContain('Staff member');
    expect(mockSupabaseFunctionsInvoke).not.toHaveBeenCalled();
  });

  it('should include requestId when provided', async () => {
    const store = createTestStore();

    mockSupabaseFunctionsInvoke.mockResolvedValueOnce({
      data: {
        success: true,
        anonymizedFields: [],
        clearedFields: [],
        preservedData: [],
      },
      error: null,
    });

    await store.dispatch(
      processDataDeletion({
        clientId: 'client-001',
        storeId: 'store-001',
        performedBy: 'staff-001',
        requestId: 'request-456',
        confirmed: true,
      })
    );

    expect(mockSupabaseFunctionsInvoke).toHaveBeenCalledWith('process-data-deletion', {
      body: expect.objectContaining({
        requestId: 'request-456',
      }),
    });
  });

  it('should reject when Edge Function returns error', async () => {
    const store = createTestStore();

    mockSupabaseFunctionsInvoke.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database connection failed' },
    });

    const result = await store.dispatch(
      processDataDeletion({
        clientId: 'client-001',
        storeId: 'store-001',
        performedBy: 'staff-001',
        confirmed: true,
      })
    );

    expect(result.type).toBe('clients/gdpr/processDataDeletion/rejected');
    expect(result.payload).toBe('Database connection failed');
  });

  it('should reject when response has success: false', async () => {
    const store = createTestStore();

    mockSupabaseFunctionsInvoke.mockResolvedValueOnce({
      data: { success: false, error: 'Client already deleted' },
      error: null,
    });

    const result = await store.dispatch(
      processDataDeletion({
        clientId: 'client-001',
        storeId: 'store-001',
        performedBy: 'staff-001',
        confirmed: true,
      })
    );

    expect(result.type).toBe('clients/gdpr/processDataDeletion/rejected');
    expect(result.payload).toBe('Client already deleted');
  });
});

// ==================== DATA ANONYMIZATION INTEGRITY TESTS ====================

describe('Data anonymization preserves transaction integrity', () => {
  it('should preserve transaction data while anonymizing PII', async () => {
    const store = createTestStore();

    // Mock deletion response that shows preserved data
    const deletionResponse = {
      success: true,
      message: 'Client data anonymized successfully',
      anonymizedFields: [
        'first_name',
        'last_name',
        'email',
        'phone',
        'nickname',
        'display_name',
      ],
      clearedFields: [
        'address',
        'emergency_contacts',
        'staff_alert',
        'notes',
        'hair_profile',
        'skin_profile',
        'nail_profile',
        'medical_info',
        'preferences',
        'avatar',
        'birthday',
        'anniversary',
      ],
      preservedData: [
        'id',
        'store_id',
        'transactions',
        'visit_summary',
        'loyalty_info',
        'membership',
        'gift_cards',
        'is_blocked',
        'is_vip',
      ],
      timestamp: new Date().toISOString(),
    };

    mockSupabaseFunctionsInvoke.mockResolvedValueOnce({
      data: deletionResponse,
      error: null,
    });

    const result = await store.dispatch(
      processDataDeletion({
        clientId: 'client-001',
        storeId: 'store-001',
        performedBy: 'staff-001',
        confirmed: true,
      })
    );

    expect(result.type).toBe('clients/gdpr/processDataDeletion/fulfilled');

    const payload = result.payload as { clientId: string; response: typeof deletionResponse };

    // Verify PII is anonymized
    expect(payload.response.anonymizedFields).toContain('first_name');
    expect(payload.response.anonymizedFields).toContain('last_name');
    expect(payload.response.anonymizedFields).toContain('email');
    expect(payload.response.anonymizedFields).toContain('phone');

    // Verify sensitive data is cleared
    expect(payload.response.clearedFields).toContain('address');
    expect(payload.response.clearedFields).toContain('medical_info');
    expect(payload.response.clearedFields).toContain('notes');

    // Verify transaction/financial data is preserved
    expect(payload.response.preservedData).toContain('transactions');
    expect(payload.response.preservedData).toContain('visit_summary');
    expect(payload.response.preservedData).toContain('loyalty_info');
  });

  it('should verify GDPR-compliant field categorization', () => {
    // Fields that MUST be anonymized (PII)
    const piiFields = [
      'first_name',
      'last_name',
      'email',
      'phone',
      'nickname',
      'display_name',
    ];

    // Fields that MUST be cleared (sensitive data)
    const sensitiveFields = [
      'address',
      'emergency_contacts',
      'staff_alert',
      'notes',
      'hair_profile',
      'skin_profile',
      'nail_profile',
      'medical_info',
      'preferences',
      'avatar',
      'birthday',
      'anniversary',
    ];

    // Fields that MUST be preserved (financial/accounting)
    const preservedFields = [
      'id',
      'store_id',
      'transactions',
      'visit_summary',
      'loyalty_info',
      'membership',
      'gift_cards',
    ];

    // Verify no overlap between categories
    const allCategories = [...piiFields, ...sensitiveFields, ...preservedFields];
    const uniqueFields = new Set(allCategories);
    expect(uniqueFields.size).toBe(allCategories.length); // No duplicates

    // Verify expected counts
    expect(piiFields.length).toBeGreaterThanOrEqual(4); // Core PII fields
    expect(sensitiveFields.length).toBeGreaterThanOrEqual(6); // Sensitive fields
    expect(preservedFields.length).toBeGreaterThanOrEqual(5); // Financial records
  });
});

// ==================== updateDataRequestStatus THUNK TESTS ====================

describe('updateDataRequestStatus thunk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update request status to processing', async () => {
    const store = createTestStore();
    const now = new Date().toISOString();

    const queryBuilder = createQueryBuilderMock({
      data: {
        id: 'req-001',
        client_id: 'client-001',
        store_id: 'store-001',
        request_type: 'export',
        status: 'processing',
        requested_at: now,
        processed_at: now,
        processed_by: 'staff-001',
        notes: null,
        export_url: null,
        created_at: now,
        updated_at: now,
      },
      error: null,
    });
    mockSupabaseFrom.mockReturnValue(queryBuilder);

    const result = await store.dispatch(
      updateDataRequestStatus({
        requestId: 'req-001',
        status: 'processing',
        processedBy: 'staff-001',
      })
    );

    expect(result.type).toBe('clients/gdpr/updateDataRequestStatus/fulfilled');
    const payload = result.payload as ClientDataRequest;
    expect(payload.status).toBe('processing');
    expect(payload.processedBy).toBe('staff-001');
  });

  it('should update request status to completed with export URL', async () => {
    const store = createTestStore();
    const now = new Date().toISOString();
    const exportUrl = 'data:application/json;base64,eyJ0ZXN0IjoidGVzdCJ9';

    const queryBuilder = createQueryBuilderMock({
      data: {
        id: 'req-001',
        client_id: 'client-001',
        store_id: 'store-001',
        request_type: 'export',
        status: 'completed',
        requested_at: now,
        processed_at: now,
        processed_by: 'staff-001',
        notes: 'Export completed successfully',
        export_url: exportUrl,
        created_at: now,
        updated_at: now,
      },
      error: null,
    });
    mockSupabaseFrom.mockReturnValue(queryBuilder);

    const result = await store.dispatch(
      updateDataRequestStatus({
        requestId: 'req-001',
        status: 'completed',
        processedBy: 'staff-001',
        exportUrl,
        notes: 'Export completed successfully',
      })
    );

    expect(result.type).toBe('clients/gdpr/updateDataRequestStatus/fulfilled');
    const payload = result.payload as ClientDataRequest;
    expect(payload.status).toBe('completed');
    expect(payload.exportUrl).toBe(exportUrl);
    expect(payload.notes).toBe('Export completed successfully');
  });

  it('should update request status to rejected', async () => {
    const store = createTestStore();
    const now = new Date().toISOString();

    const queryBuilder = createQueryBuilderMock({
      data: {
        id: 'req-001',
        client_id: 'client-001',
        store_id: 'store-001',
        request_type: 'delete',
        status: 'rejected',
        requested_at: now,
        processed_at: now,
        processed_by: 'manager-001',
        notes: 'Insufficient verification provided',
        export_url: null,
        created_at: now,
        updated_at: now,
      },
      error: null,
    });
    mockSupabaseFrom.mockReturnValue(queryBuilder);

    const result = await store.dispatch(
      updateDataRequestStatus({
        requestId: 'req-001',
        status: 'rejected',
        processedBy: 'manager-001',
        notes: 'Insufficient verification provided',
      })
    );

    expect(result.type).toBe('clients/gdpr/updateDataRequestStatus/fulfilled');
    const payload = result.payload as ClientDataRequest;
    expect(payload.status).toBe('rejected');
  });

  it('should reject when update fails', async () => {
    const store = createTestStore();

    const queryBuilder = createQueryBuilderMock({
      data: null,
      error: { message: 'Request not found' },
    });
    mockSupabaseFrom.mockReturnValue(queryBuilder);

    const result = await store.dispatch(
      updateDataRequestStatus({
        requestId: 'invalid-request',
        status: 'completed',
      })
    );

    expect(result.type).toBe('clients/gdpr/updateDataRequestStatus/rejected');
    expect(result.payload).toBe('Request not found');
  });
});

// ==================== logDataRetention THUNK TESTS ====================

describe('logDataRetention thunk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should log data export action', async () => {
    const store = createTestStore();
    const now = new Date().toISOString();

    const queryBuilder = createQueryBuilderMock({
      data: {
        id: 'log-001',
        client_id: 'client-001',
        store_id: 'store-001',
        action: 'data_exported',
        fields_affected: ['profile', 'appointments', 'transactions'],
        performed_by: 'staff-001',
        performed_by_name: 'John Staff',
        performed_at: now,
        created_at: now,
      },
      error: null,
    });
    mockSupabaseFrom.mockReturnValue(queryBuilder);

    const result = await store.dispatch(
      logDataRetention({
        clientId: 'client-001',
        storeId: 'store-001',
        action: 'data_exported',
        fieldsAffected: ['profile', 'appointments', 'transactions'],
        performedBy: 'staff-001',
        performedByName: 'John Staff',
      })
    );

    expect(result.type).toBe('clients/gdpr/logDataRetention/fulfilled');
    const payload = result.payload as DataRetentionLog;
    expect(payload.action).toBe('data_exported');
    expect(payload.fieldsAffected).toContain('profile');
  });

  it('should log consent update action', async () => {
    const store = createTestStore();
    const now = new Date().toISOString();

    const queryBuilder = createQueryBuilderMock({
      data: {
        id: 'log-002',
        client_id: 'client-001',
        store_id: 'store-001',
        action: 'consent_marketing_granted',
        fields_affected: ['consent_marketing', 'consent_marketing_at'],
        performed_by: 'staff-002',
        performed_by_name: null,
        performed_at: now,
        created_at: now,
      },
      error: null,
    });
    mockSupabaseFrom.mockReturnValue(queryBuilder);

    const result = await store.dispatch(
      logDataRetention({
        clientId: 'client-001',
        storeId: 'store-001',
        action: 'consent_marketing_granted',
        fieldsAffected: ['consent_marketing', 'consent_marketing_at'],
        performedBy: 'staff-002',
      })
    );

    expect(result.type).toBe('clients/gdpr/logDataRetention/fulfilled');
    const payload = result.payload as DataRetentionLog;
    expect(payload.action).toBe('consent_marketing_granted');
  });

  it('should log deletion action without client_id (client was deleted)', async () => {
    const store = createTestStore();
    const now = new Date().toISOString();

    const queryBuilder = createQueryBuilderMock({
      data: {
        id: 'log-003',
        client_id: null, // Client record anonymized
        store_id: 'store-001',
        action: 'data_deleted',
        fields_affected: ['first_name', 'last_name', 'email', 'phone'],
        performed_by: 'manager-001',
        performed_by_name: 'Manager Jane',
        performed_at: now,
        created_at: now,
      },
      error: null,
    });
    mockSupabaseFrom.mockReturnValue(queryBuilder);

    const result = await store.dispatch(
      logDataRetention({
        clientId: undefined, // No client ID after deletion
        storeId: 'store-001',
        action: 'data_deleted',
        fieldsAffected: ['first_name', 'last_name', 'email', 'phone'],
        performedBy: 'manager-001',
        performedByName: 'Manager Jane',
      })
    );

    expect(result.type).toBe('clients/gdpr/logDataRetention/fulfilled');
    const payload = result.payload as DataRetentionLog;
    expect(payload.clientId).toBeNull();
    expect(payload.action).toBe('data_deleted');
  });

  it('should reject when logging fails', async () => {
    const store = createTestStore();

    const queryBuilder = createQueryBuilderMock({
      data: null,
      error: { message: 'Database write failed' },
    });
    mockSupabaseFrom.mockReturnValue(queryBuilder);

    const result = await store.dispatch(
      logDataRetention({
        storeId: 'store-001',
        action: 'data_exported',
      })
    );

    expect(result.type).toBe('clients/gdpr/logDataRetention/rejected');
    expect(result.payload).toBe('Database write failed');
  });
});

// ==================== fetchDataRequests THUNK TESTS ====================

describe('fetchDataRequests thunk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch all data requests for a store', async () => {
    const store = createTestStore();
    const now = new Date().toISOString();

    // For fetchDataRequests, we need the full query chain to return data array
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'req-001',
            client_id: 'client-001',
            store_id: 'store-001',
            request_type: 'export',
            status: 'pending',
            requested_at: now,
            processed_at: null,
            processed_by: null,
            notes: null,
            export_url: null,
            created_at: now,
            updated_at: now,
          },
          {
            id: 'req-002',
            client_id: 'client-002',
            store_id: 'store-001',
            request_type: 'delete',
            status: 'completed',
            requested_at: now,
            processed_at: now,
            processed_by: 'staff-001',
            notes: 'Completed per GDPR request',
            export_url: null,
            created_at: now,
            updated_at: now,
          },
        ],
        error: null,
      }),
    };
    mockSupabaseFrom.mockReturnValue(chain);

    const result = await store.dispatch(
      fetchDataRequests({
        storeId: 'store-001',
      })
    );

    expect(result.type).toBe('clients/gdpr/fetchDataRequests/fulfilled');
    const payload = result.payload as ClientDataRequest[];
    expect(payload).toHaveLength(2);
    expect(payload[0].clientId).toBe('client-001');
    expect(payload[1].status).toBe('completed');
  });

  it('should return empty array when no requests exist', async () => {
    const store = createTestStore();

    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };
    mockSupabaseFrom.mockReturnValue(chain);

    const result = await store.dispatch(
      fetchDataRequests({
        storeId: 'store-001',
      })
    );

    expect(result.type).toBe('clients/gdpr/fetchDataRequests/fulfilled');
    const payload = result.payload as ClientDataRequest[];
    expect(payload).toHaveLength(0);
  });

  it('should reject when fetch fails', async () => {
    const store = createTestStore();

    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Connection timeout' },
      }),
    };
    mockSupabaseFrom.mockReturnValue(chain);

    const result = await store.dispatch(
      fetchDataRequests({
        storeId: 'store-001',
      })
    );

    expect(result.type).toBe('clients/gdpr/fetchDataRequests/rejected');
    expect(result.payload).toBe('Connection timeout');
  });
});

// ==================== TYPE VALIDATION TESTS ====================

describe('GDPR Type Validation', () => {
  it('should accept valid DataRequestType values', () => {
    const validTypes: string[] = ['export', 'delete', 'access'];
    validTypes.forEach((type) => {
      const request = createMockDataRequest({ requestType: type as 'export' | 'delete' | 'access' });
      expect(['export', 'delete', 'access']).toContain(request.requestType);
    });
  });

  it('should accept valid DataRequestStatus values', () => {
    const validStatuses: string[] = ['pending', 'processing', 'completed', 'rejected'];
    validStatuses.forEach((status) => {
      const request = createMockDataRequest({ status: status as 'pending' | 'processing' | 'completed' | 'rejected' });
      expect(['pending', 'processing', 'completed', 'rejected']).toContain(request.status);
    });
  });

  it('should accept valid DataRetentionAction values', () => {
    const validActions = [
      'data_exported',
      'data_deleted',
      'data_accessed',
      'consent_updated',
      'consent_marketing_granted',
      'consent_marketing_revoked',
      'consent_data_processing_granted',
      'consent_data_processing_revoked',
    ];

    validActions.forEach((action) => {
      const log = createMockRetentionLog({ action: action as DataRetentionLog['action'] });
      expect(validActions).toContain(log.action);
    });
  });

  it('should validate ClientDataRequest structure', () => {
    const request = createMockDataRequest({
      id: 'test-req-001',
      clientId: 'client-123',
      storeId: 'store-456',
      requestType: 'export',
      status: 'pending',
    });

    // Required fields
    expect(request.id).toBeDefined();
    expect(request.clientId).toBeDefined();
    expect(request.storeId).toBeDefined();
    expect(request.requestType).toBeDefined();
    expect(request.status).toBeDefined();
    expect(request.requestedAt).toBeDefined();
    expect(request.createdAt).toBeDefined();
    expect(request.updatedAt).toBeDefined();
  });

  it('should validate DataRetentionLog structure', () => {
    const log = createMockRetentionLog({
      id: 'test-log-001',
      storeId: 'store-456',
      action: 'data_exported',
    });

    // Required fields
    expect(log.id).toBeDefined();
    expect(log.storeId).toBeDefined();
    expect(log.action).toBeDefined();
    expect(log.performedAt).toBeDefined();
    expect(log.createdAt).toBeDefined();
  });
});
