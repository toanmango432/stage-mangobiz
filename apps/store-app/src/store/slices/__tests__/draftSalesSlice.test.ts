import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import checkoutReducer, {
  loadDrafts,
  saveDraft,
  deleteDraft,
  resumeDraft,
  DraftSale,
  selectDrafts,
  selectDraftsLoading,
  selectDraftsError,
} from '../checkoutSlice';

// Mock ticketsDB
vi.mock('@/db/database', () => ({
  ticketsDB: {
    cleanupExpiredDrafts: vi.fn().mockResolvedValue(undefined),
    getDrafts: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockResolvedValue({ id: 'ticket-1' }),
    delete: vi.fn().mockResolvedValue(undefined),
    getById: vi.fn().mockResolvedValue(null),
  },
}));

describe('Draft Sales System', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    store = configureStore({
      reducer: {
        checkout: checkoutReducer,
      },
    });
  });

  describe('DraftSale interface', () => {
    it('should have required fields', () => {
      const draft: DraftSale = {
        ticketId: 'ticket-1',
        createdAt: '2026-01-09T00:00:00Z',
        lastSavedAt: '2026-01-09T01:00:00Z',
        expiresAt: '2026-01-10T00:00:00Z',
        staffId: 'staff-1',
        staffName: 'John',
        totalAmount: 100,
      };

      expect(draft.ticketId).toBeDefined();
      expect(draft.createdAt).toBeDefined();
      expect(draft.lastSavedAt).toBeDefined();
      expect(draft.staffName).toBeDefined();
      expect(draft.totalAmount).toBeDefined();
    });

    it('should allow optional client name', () => {
      const draft: DraftSale = {
        ticketId: 'ticket-1',
        createdAt: '2026-01-09T00:00:00Z',
        lastSavedAt: '2026-01-09T01:00:00Z',
        expiresAt: '2026-01-10T00:00:00Z',
        staffId: 'staff-1',
        staffName: 'John',
        clientName: 'Jane Doe',
        totalAmount: 100,
      };

      expect(draft.clientName).toBe('Jane Doe');
    });
  });

  describe('loadDrafts', () => {
    it('should set loading state while fetching', async () => {
      const { ticketsDB } = await import('@/db/database');
      vi.mocked(ticketsDB.getDrafts).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
      );

      const promise = store.dispatch(loadDrafts('store-1'));

      expect(selectDraftsLoading(store.getState())).toBe(true);

      await promise;

      expect(selectDraftsLoading(store.getState())).toBe(false);
    });

    it('should populate drafts array on success', async () => {
      const { ticketsDB } = await import('@/db/database');
      vi.mocked(ticketsDB.getDrafts).mockResolvedValue([
        {
          id: 'ticket-1',
          ticketNumber: 1,
          createdAt: '2026-01-09T00:00:00Z',
          lastAutoSaveAt: '2026-01-09T01:00:00Z',
          draftExpiresAt: '2026-01-10T00:00:00Z',
          services: [{ staffId: 'staff-1', staffName: 'John' }],
          clientName: 'Jane',
          total: 100,
        },
      ] as any);

      await store.dispatch(loadDrafts('store-1'));

      const drafts = selectDrafts(store.getState());
      expect(drafts.length).toBe(1);
      expect(drafts[0].ticketId).toBe('ticket-1');
    });

    it('should set error on failure', async () => {
      const { ticketsDB } = await import('@/db/database');
      vi.mocked(ticketsDB.getDrafts).mockRejectedValue(new Error('Database error'));

      await store.dispatch(loadDrafts('store-1'));

      const error = selectDraftsError(store.getState());
      expect(error).toBe('Database error');
    });
  });

  describe('saveDraft', () => {
    it('should save draft to database', async () => {
      const { ticketsDB } = await import('@/db/database');
      vi.mocked(ticketsDB.update).mockResolvedValue({ id: 'ticket-1' } as any);

      await store.dispatch(
        saveDraft({
          ticketId: 'ticket-1',
          updates: { total: 150 },
          userId: 'user-1',
        })
      );

      expect(ticketsDB.update).toHaveBeenCalledWith(
        'ticket-1',
        expect.objectContaining({
          total: 150,
          isDraft: true,
        }),
        'user-1'
      );
    });

    it('should update lastAutoSave timestamp', async () => {
      const { ticketsDB } = await import('@/db/database');
      vi.mocked(ticketsDB.update).mockResolvedValue({ id: 'ticket-1' } as any);

      await store.dispatch(
        saveDraft({
          ticketId: 'ticket-1',
          updates: {},
          userId: 'user-1',
        })
      );

      const state = store.getState().checkout;
      expect(state.lastAutoSave).toBeDefined();
    });
  });

  describe('deleteDraft', () => {
    it('should remove draft from database', async () => {
      const { ticketsDB } = await import('@/db/database');

      await store.dispatch(deleteDraft('ticket-1'));

      expect(ticketsDB.delete).toHaveBeenCalledWith('ticket-1');
    });

    it('should remove draft from state', async () => {
      // First add a draft to state
      const { ticketsDB } = await import('@/db/database');
      vi.mocked(ticketsDB.getDrafts).mockResolvedValue([
        {
          id: 'ticket-1',
          ticketNumber: 1,
          createdAt: '2026-01-09T00:00:00Z',
          services: [{ staffId: 'staff-1', staffName: 'John' }],
          clientName: 'Walk-in',
          total: 100,
        },
      ] as any);

      await store.dispatch(loadDrafts('store-1'));
      expect(selectDrafts(store.getState()).length).toBe(1);

      // Delete the draft
      await store.dispatch(deleteDraft('ticket-1'));
      expect(selectDrafts(store.getState()).length).toBe(0);
    });
  });

  describe('resumeDraft', () => {
    it('should load draft from database', async () => {
      const { ticketsDB } = await import('@/db/database');
      vi.mocked(ticketsDB.getById).mockResolvedValue({
        id: 'ticket-1',
        isDraft: true,
        services: [],
        products: [],
        total: 100,
      } as any);

      const result = await store.dispatch(resumeDraft('ticket-1'));

      expect(result.type).toContain('fulfilled');
    });

    it('should reject if ticket not found', async () => {
      const { ticketsDB } = await import('@/db/database');
      vi.mocked(ticketsDB.getById).mockResolvedValue(null);

      const result = await store.dispatch(resumeDraft('ticket-1'));

      expect(result.type).toContain('rejected');
    });

    it('should reject if ticket is not a draft', async () => {
      const { ticketsDB } = await import('@/db/database');
      vi.mocked(ticketsDB.getById).mockResolvedValue({
        id: 'ticket-1',
        isDraft: false,
      } as any);

      const result = await store.dispatch(resumeDraft('ticket-1'));

      expect(result.type).toContain('rejected');
    });
  });

  describe('selectors', () => {
    it('selectDrafts should return empty array initially', () => {
      const drafts = selectDrafts(store.getState());
      expect(drafts).toEqual([]);
    });

    it('selectDraftsLoading should return false initially', () => {
      const loading = selectDraftsLoading(store.getState());
      expect(loading).toBe(false);
    });

    it('selectDraftsError should return null initially', () => {
      const error = selectDraftsError(store.getState());
      expect(error).toBeNull();
    });
  });
});
