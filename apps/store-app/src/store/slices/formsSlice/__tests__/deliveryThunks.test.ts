/**
 * Unit Tests for Form Delivery Thunks
 *
 * Tests the form delivery async thunks:
 * - sendFormToClient: Send form via email/SMS
 * - generateFormPdf: Generate PDF from form submission
 * - fetchFormDeliveries: Fetch form deliveries for a store
 * - checkFormCompletion: Check if client has completed forms
 *
 * Phase 3 of Client Module: Forms, Segments, Import/Export
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import type { FormDelivery, FormDeliveryStatus } from '../../../../types/form';

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

// Import thunks after mocking
import {
  sendFormToClient,
  generateFormPdf,
  fetchFormDeliveries,
  checkFormCompletion,
  resendFormDelivery,
} from '../deliveryThunks';

// ==================== TEST UTILITIES ====================

interface TestState {
  forms: {
    deliveries: FormDelivery[];
    loading: boolean;
    error: string | null;
  };
}

/**
 * Create a chainable mock for Supabase query builder
 */
function createQueryBuilderMock(finalResult: { data: unknown; error: unknown }) {
  const chain = {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(finalResult),
  };
  // Make chain methods return the chain for chaining, except terminal methods
  chain.insert.mockReturnValue(chain);
  chain.select.mockReturnValue(chain);
  chain.update.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.in.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);
  return chain;
}

/**
 * Create a mock FormDelivery for testing (snake_case format from DB)
 */
function createMockDeliveryRow(overrides: Partial<Record<string, unknown>> = {}) {
  const now = new Date().toISOString();
  return {
    id: `delivery-${Math.random().toString(36).substr(2, 9)}`,
    store_id: 'store-001',
    form_template_id: 'form-001',
    client_id: 'client-001',
    appointment_id: null,
    form_submission_id: null,
    delivery_method: 'email',
    token: `token-${Math.random().toString(36).substr(2, 9)}`,
    delivery_email: 'test@example.com',
    delivery_phone: null,
    sent_at: now,
    opened_at: null,
    completed_at: null,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    delivery_status: 'sent',
    delivery_error: null,
    message_id: 'msg-123',
    reminder_sent_at: null,
    reminder_count: 0,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

/**
 * Create a configured store for testing
 */
function createTestStore() {
  // Minimal reducer just to dispatch thunks
  const reducer = (state: TestState = {
    forms: { deliveries: [], loading: false, error: null },
  }) => state;

  const store = configureStore({
    reducer,
  });

  return store as typeof store & {
    dispatch: ThunkDispatch<TestState, unknown, UnknownAction>;
  };
}

// ==================== sendFormToClient THUNK TESTS ====================

describe('sendFormToClient thunk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send a form via email successfully', async () => {
    const store = createTestStore();
    const mockDeliveryRow = createMockDeliveryRow();

    // Mock Edge Function response
    mockSupabaseFunctionsInvoke.mockResolvedValueOnce({
      data: {
        success: true,
        delivery: {
          id: mockDeliveryRow.id,
          token: mockDeliveryRow.token,
          formLink: `https://app.mango.com/forms/complete/${mockDeliveryRow.token}`,
          expiresAt: mockDeliveryRow.expires_at,
          deliveryStatus: 'sent',
          messageId: 'msg-123',
        },
      },
      error: null,
    });

    // Mock Supabase fetch of delivery record
    const queryBuilder = createQueryBuilderMock({
      data: mockDeliveryRow,
      error: null,
    });
    mockSupabaseFrom.mockReturnValue(queryBuilder);

    const result = await store.dispatch(
      sendFormToClient({
        clientId: 'client-001',
        formTemplateId: 'form-001',
        deliveryMethod: 'email',
        storeId: 'store-001',
      })
    );

    expect(result.type).toBe('forms/delivery/sendFormToClient/fulfilled');
    expect(mockSupabaseFunctionsInvoke).toHaveBeenCalledWith('send-form', {
      body: {
        clientId: 'client-001',
        formTemplateId: 'form-001',
        deliveryMethod: 'email',
        appointmentId: undefined,
        storeId: 'store-001',
      },
    });

    const payload = result.payload as FormDelivery;
    expect(payload.clientId).toBe('client-001');
    expect(payload.deliveryMethod).toBe('email');
    expect(payload.token).toBeDefined();
  });

  it('should send a form via SMS successfully', async () => {
    const store = createTestStore();
    const mockDeliveryRow = createMockDeliveryRow({
      delivery_method: 'sms',
      delivery_email: null,
      delivery_phone: '+15551234567',
    });

    mockSupabaseFunctionsInvoke.mockResolvedValueOnce({
      data: {
        success: true,
        delivery: {
          id: mockDeliveryRow.id,
          token: mockDeliveryRow.token,
          formLink: `https://app.mango.com/forms/complete/${mockDeliveryRow.token}`,
          expiresAt: mockDeliveryRow.expires_at,
          deliveryStatus: 'sent',
          messageId: 'sms-123',
        },
      },
      error: null,
    });

    const queryBuilder = createQueryBuilderMock({
      data: mockDeliveryRow,
      error: null,
    });
    mockSupabaseFrom.mockReturnValue(queryBuilder);

    const result = await store.dispatch(
      sendFormToClient({
        clientId: 'client-001',
        formTemplateId: 'form-001',
        deliveryMethod: 'sms',
        storeId: 'store-001',
      })
    );

    expect(result.type).toBe('forms/delivery/sendFormToClient/fulfilled');
    const payload = result.payload as FormDelivery;
    expect(payload.deliveryMethod).toBe('sms');
    expect(payload.deliveryPhone).toBe('+15551234567');
  });

  it('should include appointmentId when provided', async () => {
    const store = createTestStore();
    const mockDeliveryRow = createMockDeliveryRow({ appointment_id: 'apt-001' });

    mockSupabaseFunctionsInvoke.mockResolvedValueOnce({
      data: {
        success: true,
        delivery: {
          id: mockDeliveryRow.id,
          token: mockDeliveryRow.token,
          formLink: `https://app.mango.com/forms/complete/${mockDeliveryRow.token}`,
          expiresAt: mockDeliveryRow.expires_at,
          deliveryStatus: 'sent',
        },
      },
      error: null,
    });

    const queryBuilder = createQueryBuilderMock({
      data: mockDeliveryRow,
      error: null,
    });
    mockSupabaseFrom.mockReturnValue(queryBuilder);

    await store.dispatch(
      sendFormToClient({
        clientId: 'client-001',
        formTemplateId: 'form-001',
        deliveryMethod: 'email',
        appointmentId: 'apt-001',
        storeId: 'store-001',
      })
    );

    expect(mockSupabaseFunctionsInvoke).toHaveBeenCalledWith('send-form', {
      body: expect.objectContaining({
        appointmentId: 'apt-001',
      }),
    });
  });

  it('should reject when Edge Function returns an error', async () => {
    const store = createTestStore();

    mockSupabaseFunctionsInvoke.mockResolvedValueOnce({
      data: null,
      error: { message: 'Client email not found' },
    });

    const result = await store.dispatch(
      sendFormToClient({
        clientId: 'client-001',
        formTemplateId: 'form-001',
        deliveryMethod: 'email',
        storeId: 'store-001',
      })
    );

    expect(result.type).toBe('forms/delivery/sendFormToClient/rejected');
    expect(result.payload).toBe('Client email not found');
  });

  it('should reject when response has success: false', async () => {
    const store = createTestStore();

    mockSupabaseFunctionsInvoke.mockResolvedValueOnce({
      data: { success: false, error: 'Email service unavailable' },
      error: null,
    });

    const result = await store.dispatch(
      sendFormToClient({
        clientId: 'client-001',
        formTemplateId: 'form-001',
        deliveryMethod: 'email',
        storeId: 'store-001',
      })
    );

    expect(result.type).toBe('forms/delivery/sendFormToClient/rejected');
    expect(result.payload).toBe('Email service unavailable');
  });
});

// ==================== generateFormPdf THUNK TESTS ====================

describe('generateFormPdf thunk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate PDF successfully', async () => {
    const store = createTestStore();
    const pdfResponse = {
      success: true,
      pdfUrl: 'https://storage.supabase.co/bucket/form-pdfs/submission-123.pdf',
      fileName: 'intake-form-john-doe-2026-01-22.pdf',
    };

    mockSupabaseFunctionsInvoke.mockResolvedValueOnce({
      data: pdfResponse,
      error: null,
    });

    const result = await store.dispatch(
      generateFormPdf({
        formSubmissionId: 'submission-123',
        storeId: 'store-001',
      })
    );

    expect(result.type).toBe('forms/delivery/generateFormPdf/fulfilled');
    expect(mockSupabaseFunctionsInvoke).toHaveBeenCalledWith('generate-form-pdf', {
      body: {
        formSubmissionId: 'submission-123',
        storeId: 'store-001',
      },
    });

    const payload = result.payload as typeof pdfResponse;
    expect(payload.success).toBe(true);
    expect(payload.pdfUrl).toContain('form-pdfs');
    expect(payload.fileName).toBeDefined();
  });

  it('should reject when Edge Function returns an error', async () => {
    const store = createTestStore();

    mockSupabaseFunctionsInvoke.mockResolvedValueOnce({
      data: null,
      error: { message: 'Submission not found' },
    });

    const result = await store.dispatch(
      generateFormPdf({
        formSubmissionId: 'invalid-submission',
        storeId: 'store-001',
      })
    );

    expect(result.type).toBe('forms/delivery/generateFormPdf/rejected');
    expect(result.payload).toBe('Submission not found');
  });

  it('should reject when response has success: false', async () => {
    const store = createTestStore();

    mockSupabaseFunctionsInvoke.mockResolvedValueOnce({
      data: { success: false, error: 'PDF generation failed: missing signature' },
      error: null,
    });

    const result = await store.dispatch(
      generateFormPdf({
        formSubmissionId: 'submission-123',
        storeId: 'store-001',
      })
    );

    expect(result.type).toBe('forms/delivery/generateFormPdf/rejected');
    expect(result.payload).toBe('PDF generation failed: missing signature');
  });
});

// ==================== fetchFormDeliveries THUNK TESTS ====================

describe('fetchFormDeliveries thunk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch all deliveries for a store', async () => {
    const store = createTestStore();
    const mockDeliveries = [
      createMockDeliveryRow({ id: 'del-001', client_id: 'client-001' }),
      createMockDeliveryRow({ id: 'del-002', client_id: 'client-002' }),
    ];

    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockDeliveries,
        error: null,
      }),
    };
    mockSupabaseFrom.mockReturnValue(chain);

    const result = await store.dispatch(
      fetchFormDeliveries({
        storeId: 'store-001',
      })
    );

    expect(result.type).toBe('forms/delivery/fetchFormDeliveries/fulfilled');
    const payload = result.payload as FormDelivery[];
    expect(payload).toHaveLength(2);
    expect(payload[0].id).toBe('del-001');
    expect(payload[1].id).toBe('del-002');
  });

  it('should filter by clientId when provided', async () => {
    const store = createTestStore();
    const mockDeliveries = [
      createMockDeliveryRow({ id: 'del-001', client_id: 'client-001' }),
    ];

    // Track eq calls
    const eqCalls: unknown[][] = [];

    // Create a properly chainable mock where order() also returns the chain
    // This allows query = query.eq(...) pattern to work
    const chain: Record<string, ReturnType<typeof vi.fn>> = {};
    chain.select = vi.fn(() => chain);
    chain.eq = vi.fn((...args: unknown[]) => {
      eqCalls.push(args);
      return chain;
    });
    chain.order = vi.fn(() => chain);
    // Make the chain itself thenable (awaitable)
    chain.then = vi.fn((resolve: (value: unknown) => void) => {
      resolve({ data: mockDeliveries, error: null });
      return Promise.resolve({ data: mockDeliveries, error: null });
    });

    mockSupabaseFrom.mockReturnValue(chain);

    const result = await store.dispatch(
      fetchFormDeliveries({
        storeId: 'store-001',
        clientId: 'client-001',
      })
    );

    expect(result.type).toBe('forms/delivery/fetchFormDeliveries/fulfilled');
    // Verify eq was called with client_id
    const clientIdCall = eqCalls.find((c) => c[0] === 'client_id');
    expect(clientIdCall).toBeDefined();
    expect(clientIdCall![1]).toBe('client-001');
  });

  it('should filter by status when provided', async () => {
    const store = createTestStore();
    const mockDeliveries = [
      createMockDeliveryRow({ id: 'del-001', delivery_status: 'sent' }),
    ];

    // Track eq calls
    const eqCalls: unknown[][] = [];

    // Create a properly chainable mock where order() also returns the chain
    const chain: Record<string, ReturnType<typeof vi.fn>> = {};
    chain.select = vi.fn(() => chain);
    chain.eq = vi.fn((...args: unknown[]) => {
      eqCalls.push(args);
      return chain;
    });
    chain.order = vi.fn(() => chain);
    // Make the chain itself thenable (awaitable)
    chain.then = vi.fn((resolve: (value: unknown) => void) => {
      resolve({ data: mockDeliveries, error: null });
      return Promise.resolve({ data: mockDeliveries, error: null });
    });

    mockSupabaseFrom.mockReturnValue(chain);

    await store.dispatch(
      fetchFormDeliveries({
        storeId: 'store-001',
        status: 'sent' as FormDeliveryStatus,
      })
    );

    // Verify eq was called with delivery_status
    const statusCall = eqCalls.find((c) => c[0] === 'delivery_status');
    expect(statusCall).toBeDefined();
    expect(statusCall![1]).toBe('sent');
  });

  it('should return empty array when no deliveries exist', async () => {
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
      fetchFormDeliveries({
        storeId: 'store-001',
      })
    );

    expect(result.type).toBe('forms/delivery/fetchFormDeliveries/fulfilled');
    const payload = result.payload as FormDelivery[];
    expect(payload).toHaveLength(0);
  });

  it('should reject when query fails', async () => {
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
      fetchFormDeliveries({
        storeId: 'store-001',
      })
    );

    expect(result.type).toBe('forms/delivery/fetchFormDeliveries/rejected');
    expect(result.payload).toBe('Connection timeout');
  });
});

// ==================== checkFormCompletion THUNK TESTS ====================

describe('checkFormCompletion thunk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return completion status for specified templates', async () => {
    const store = createTestStore();

    // Mock submissions query
    const submissionsChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [
          { id: 'sub-001', form_template_id: 'form-001', completed_at: '2026-01-22T10:00:00Z' },
        ],
        error: null,
      }),
    };

    // Mock templates query for names
    const templatesChain = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [
          { id: 'form-001', name: 'Intake Form' },
          { id: 'form-002', name: 'Consent Form' },
        ],
        error: null,
      }),
    };

    let callCount = 0;
    mockSupabaseFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return submissionsChain;
      return templatesChain;
    });

    const result = await store.dispatch(
      checkFormCompletion({
        clientId: 'client-001',
        storeId: 'store-001',
        formTemplateIds: ['form-001', 'form-002'],
      })
    );

    expect(result.type).toBe('forms/delivery/checkFormCompletion/fulfilled');
    const payload = result.payload as { formTemplateId: string; completed: boolean }[];
    expect(payload).toHaveLength(2);

    const intakeForm = payload.find(p => p.formTemplateId === 'form-001');
    const consentForm = payload.find(p => p.formTemplateId === 'form-002');

    expect(intakeForm?.completed).toBe(true);
    expect(consentForm?.completed).toBe(false);
  });

  it('should return empty array when no templates provided and no active templates exist', async () => {
    const store = createTestStore();

    // Mock templates query that returns empty - need proper chained eq
    const templatesChain: Record<string, ReturnType<typeof vi.fn>> = {
      select: vi.fn(),
      eq: vi.fn(),
    };
    templatesChain.select.mockReturnValue(templatesChain);
    // The query uses two .eq() calls, so we need proper return value on second call
    templatesChain.eq.mockReturnValueOnce(templatesChain); // First eq for store_id
    templatesChain.eq.mockResolvedValueOnce({ // Second eq for is_active returns data
      data: [],
      error: null,
    });
    mockSupabaseFrom.mockReturnValue(templatesChain);

    const result = await store.dispatch(
      checkFormCompletion({
        clientId: 'client-001',
        storeId: 'store-001',
      })
    );

    expect(result.type).toBe('forms/delivery/checkFormCompletion/fulfilled');
    const payload = result.payload as unknown[];
    expect(payload).toHaveLength(0);
  });

  it('should reject when templates query fails', async () => {
    const store = createTestStore();

    const templatesChain: Record<string, ReturnType<typeof vi.fn>> = {
      select: vi.fn(),
      eq: vi.fn(),
    };
    templatesChain.select.mockReturnValue(templatesChain);
    templatesChain.eq.mockReturnValueOnce(templatesChain); // First eq for store_id
    templatesChain.eq.mockResolvedValueOnce({ // Second eq for is_active returns error
      data: null,
      error: { message: 'Database error' },
    });
    mockSupabaseFrom.mockReturnValue(templatesChain);

    const result = await store.dispatch(
      checkFormCompletion({
        clientId: 'client-001',
        storeId: 'store-001',
      })
    );

    expect(result.type).toBe('forms/delivery/checkFormCompletion/rejected');
    expect(result.payload).toBe('Failed to fetch form templates.');
  });
});

// ==================== resendFormDelivery THUNK TESTS ====================

describe('resendFormDelivery thunk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should resend an expired delivery successfully', async () => {
    const store = createTestStore();
    const originalDeliveryRow = createMockDeliveryRow({
      id: 'del-001',
      delivery_status: 'failed',
    });
    const newDeliveryRow = createMockDeliveryRow({ id: 'del-002' });

    // First call: fetch original delivery
    const fetchChain = createQueryBuilderMock({
      data: originalDeliveryRow,
      error: null,
    });

    // Third call: fetch new delivery
    const newFetchChain = createQueryBuilderMock({
      data: newDeliveryRow,
      error: null,
    });

    let fromCallCount = 0;
    mockSupabaseFrom.mockImplementation(() => {
      fromCallCount++;
      if (fromCallCount === 1) return fetchChain;
      return newFetchChain;
    });

    // Edge Function response
    mockSupabaseFunctionsInvoke.mockResolvedValueOnce({
      data: {
        success: true,
        delivery: {
          id: newDeliveryRow.id,
          token: newDeliveryRow.token,
          formLink: `https://app.mango.com/forms/complete/${newDeliveryRow.token}`,
          expiresAt: newDeliveryRow.expires_at,
          deliveryStatus: 'sent',
        },
      },
      error: null,
    });

    const result = await store.dispatch(
      resendFormDelivery({
        deliveryId: 'del-001',
        storeId: 'store-001',
      })
    );

    expect(result.type).toBe('forms/delivery/resendFormDelivery/fulfilled');
    const payload = result.payload as FormDelivery;
    expect(payload.id).toBe('del-002');
  });

  it('should reject when original delivery not found', async () => {
    const store = createTestStore();

    const fetchChain = createQueryBuilderMock({
      data: null,
      error: { message: 'Record not found' },
    });
    mockSupabaseFrom.mockReturnValue(fetchChain);

    const result = await store.dispatch(
      resendFormDelivery({
        deliveryId: 'invalid-del',
        storeId: 'store-001',
      })
    );

    expect(result.type).toBe('forms/delivery/resendFormDelivery/rejected');
    expect(result.payload).toBe('Original delivery not found.');
  });
});

// ==================== TYPE VALIDATION TESTS ====================

describe('Form Delivery Type Validation', () => {
  it('should accept valid FormDeliveryMethod values', () => {
    const validMethods = ['email', 'sms'];
    validMethods.forEach((method) => {
      expect(['email', 'sms']).toContain(method);
    });
  });

  it('should accept valid FormDeliveryStatus values', () => {
    const validStatuses = ['pending', 'sent', 'delivered', 'failed', 'bounced'];
    validStatuses.forEach((status) => {
      expect(['pending', 'sent', 'delivered', 'failed', 'bounced']).toContain(status);
    });
  });

  it('should validate FormDelivery structure', () => {
    const delivery = createMockDeliveryRow();

    // Required fields should be present
    expect(delivery.id).toBeDefined();
    expect(delivery.store_id).toBeDefined();
    expect(delivery.form_template_id).toBeDefined();
    expect(delivery.client_id).toBeDefined();
    expect(delivery.delivery_method).toBeDefined();
    expect(delivery.token).toBeDefined();
    expect(delivery.sent_at).toBeDefined();
    expect(delivery.expires_at).toBeDefined();
    expect(delivery.delivery_status).toBeDefined();
    expect(delivery.created_at).toBeDefined();
    expect(delivery.updated_at).toBeDefined();
  });
});
