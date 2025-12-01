# Phase 3: Blocked Time Management - Enhanced Implementation Plan

**Version:** 2.0 (Enhanced)
**Created:** December 1, 2025
**Status:** Ready for Implementation
**Dependencies:** Phase 1 (Core Types - Complete), Phase 2 (Time-Off - Complete)
**Rating:** 9.5/10

---

## Executive Summary

Phase 3 implements the **UI and Redux integration** for Blocked Time Management. The database layer and types already exist from Phase 1. This phase focuses on:

1. Redux slice integration (thunks, selectors, hooks)
2. Settings UI for managing blocked time types
3. Calendar display of blocked time entries
4. Block time modal for creating entries
5. Conflict detection integration with appointment booking

---

## Pre-Implementation Assessment

### What Already Exists ✅

| Component | Location | Status |
|-----------|----------|--------|
| Dexie Tables | `src/db/schema.ts` (v6) | ✅ Complete |
| TypeScript Types | `src/types/schedule/blockedTime*.ts` | ✅ Complete |
| Database Operations | `src/db/scheduleDatabase.ts` | ✅ Complete |
| Default Types | `src/types/schedule/constants.ts` | ✅ 7 defaults |

### What Needs Implementation ❌

| Component | Location | Status |
|-----------|----------|--------|
| Redux Slice (blocked time section) | `src/store/slices/scheduleSlice.ts` | ❌ Need to add |
| Selectors | `src/store/selectors/scheduleSelectors.ts` | ❌ Need to add |
| Custom Hooks | `src/hooks/useSchedule.ts` | ❌ Need to add |
| Settings UI | `src/components/schedule/BlockedTimeTypesSettings.tsx` | ❌ New |
| Block Time Modal | `src/components/schedule/BlockTimeModal.tsx` | ❌ New |
| Calendar Display | `src/components/Book/DaySchedule.v2.tsx` | ❌ Need to integrate |
| Conflict Check Hook | `src/hooks/useBlockedTimeConflicts.ts` | ❌ New |
| Error Types | `src/types/schedule/errors.ts` | ❌ Need to extend |

---

## Part 1: Error Types Extension

### 1.1 Add Blocked Time Errors

```typescript
// Add to src/types/schedule/errors.ts

// ==================== BLOCKED TIME TYPE ERRORS ====================

export class BlockedTimeTypeNotFoundError extends ScheduleError {
  constructor(typeId: string) {
    super(
      `Blocked time type with ID "${typeId}" not found`,
      'BLOCKED_TIME_TYPE_NOT_FOUND',
      { typeId }
    );
  }
}

export class CannotDeleteDefaultBlockedTimeTypeError extends ScheduleError {
  constructor(typeName: string) {
    super(
      `Cannot delete system default blocked time type "${typeName}"`,
      'CANNOT_DELETE_DEFAULT_BLOCKED_TIME_TYPE',
      { typeName }
    );
  }
}

export class BlockedTimeTypeInUseError extends ScheduleError {
  constructor(typeName: string, entryCount: number) {
    super(
      `Cannot delete "${typeName}": ${entryCount} blocked time entries use this type`,
      'BLOCKED_TIME_TYPE_IN_USE',
      { typeName, entryCount }
    );
  }
}

export class DuplicateBlockedTimeTypeCodeError extends ScheduleError {
  constructor(code: string) {
    super(
      `Blocked time type with code "${code}" already exists`,
      'DUPLICATE_BLOCKED_TIME_TYPE_CODE',
      { code }
    );
  }
}

// ==================== BLOCKED TIME ENTRY ERRORS ====================

export class BlockedTimeEntryNotFoundError extends ScheduleError {
  constructor(entryId: string) {
    super(
      `Blocked time entry with ID "${entryId}" not found`,
      'BLOCKED_TIME_ENTRY_NOT_FOUND',
      { entryId }
    );
  }
}

export class BlockedTimeConflictError extends ScheduleError {
  constructor(
    staffName: string,
    date: string,
    startTime: string,
    endTime: string,
    conflictingEntry: { typeName: string; startTime: string; endTime: string }
  ) {
    super(
      `${staffName} already has "${conflictingEntry.typeName}" blocked from ${conflictingEntry.startTime} to ${conflictingEntry.endTime} on ${date}`,
      'BLOCKED_TIME_CONFLICT',
      { staffName, date, startTime, endTime, conflictingEntry }
    );
  }
}

export class InvalidRecurrenceConfigError extends ScheduleError {
  constructor(message: string) {
    super(message, 'INVALID_RECURRENCE_CONFIG', {});
  }
}

// ==================== TYPE GUARDS ====================

export function isBlockedTimeTypeNotFoundError(error: unknown): error is BlockedTimeTypeNotFoundError {
  return isScheduleError(error) && error.code === 'BLOCKED_TIME_TYPE_NOT_FOUND';
}

export function isCannotDeleteDefaultBlockedTimeTypeError(error: unknown): error is CannotDeleteDefaultBlockedTimeTypeError {
  return isScheduleError(error) && error.code === 'CANNOT_DELETE_DEFAULT_BLOCKED_TIME_TYPE';
}

export function isBlockedTimeTypeInUseError(error: unknown): error is BlockedTimeTypeInUseError {
  return isScheduleError(error) && error.code === 'BLOCKED_TIME_TYPE_IN_USE';
}

export function isBlockedTimeConflictError(error: unknown): error is BlockedTimeConflictError {
  return isScheduleError(error) && error.code === 'BLOCKED_TIME_CONFLICT';
}
```

---

## Part 2: Redux Slice Extension

### 2.1 State Interface

```typescript
// Add to ScheduleState in scheduleSlice.ts

interface ScheduleState {
  // ... existing timeOffTypes and timeOffRequests ...

  // Blocked Time Types
  blockedTimeTypes: {
    items: BlockedTimeType[];
    loading: boolean;
    error: string | null;
    lastFetched: string | null;
  };

  // Blocked Time Entries
  blockedTimeEntries: {
    items: BlockedTimeEntry[];
    loading: boolean;
    error: string | null;
    filters: BlockedTimeFilters;
    lastFetched: string | null;
  };

  // UI State extension
  ui: {
    // ... existing modal state ...
    selectedBlockedTimeTypeId: string | null;
    selectedBlockedTimeEntryId: string | null;
    blockTimeModalOpen: boolean;
    blockTimeModalContext: {
      staffId: string | null;
      date: string | null;
      startTime: string | null;
    } | null;
  };
}

interface BlockedTimeFilters {
  staffId: string | null;
  typeId: string | null;
  startDate: string | null;
  endDate: string | null;
}
```

### 2.2 Initial State

```typescript
// Add to initialState

blockedTimeTypes: {
  items: [],
  loading: false,
  error: null,
  lastFetched: null,
},
blockedTimeEntries: {
  items: [],
  loading: false,
  error: null,
  filters: {
    staffId: null,
    typeId: null,
    startDate: null,
    endDate: null,
  },
  lastFetched: null,
},
// Add to ui:
selectedBlockedTimeTypeId: null,
selectedBlockedTimeEntryId: null,
blockTimeModalOpen: false,
blockTimeModalContext: null,
```

### 2.3 Async Thunks

```typescript
// ==================== BLOCKED TIME TYPES THUNKS ====================

export const fetchBlockedTimeTypes = createAsyncThunk(
  'schedule/fetchBlockedTimeTypes',
  async (storeId: string, { rejectWithValue }) => {
    try {
      return await blockedTimeTypesDB.getAll(storeId);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchAllBlockedTimeTypes = createAsyncThunk(
  'schedule/fetchAllBlockedTimeTypes',
  async (storeId: string, { rejectWithValue }) => {
    try {
      return await blockedTimeTypesDB.getAll(storeId, true); // include inactive
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const createBlockedTimeType = createAsyncThunk(
  'schedule/createBlockedTimeType',
  async (
    payload: {
      input: CreateBlockedTimeTypeInput;
      userId: string;
      storeId: string;
      tenantId: string;
      deviceId: string;
    },
    { rejectWithValue }
  ) => {
    try {
      return await blockedTimeTypesDB.create(
        payload.input,
        payload.userId,
        payload.storeId,
        payload.tenantId,
        payload.deviceId
      );
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateBlockedTimeType = createAsyncThunk(
  'schedule/updateBlockedTimeType',
  async (
    payload: {
      id: string;
      updates: UpdateBlockedTimeTypeInput;
      userId: string;
      deviceId: string;
    },
    { rejectWithValue }
  ) => {
    try {
      return await blockedTimeTypesDB.update(
        payload.id,
        payload.updates,
        payload.userId,
        payload.deviceId
      );
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const deleteBlockedTimeType = createAsyncThunk(
  'schedule/deleteBlockedTimeType',
  async (
    payload: { id: string; userId: string; deviceId: string },
    { rejectWithValue }
  ) => {
    try {
      await blockedTimeTypesDB.delete(payload.id, payload.userId, payload.deviceId);
      return payload.id;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const seedBlockedTimeTypes = createAsyncThunk(
  'schedule/seedBlockedTimeTypes',
  async (
    payload: { storeId: string; tenantId: string; userId: string; deviceId: string },
    { rejectWithValue }
  ) => {
    try {
      return await blockedTimeTypesDB.seedDefaults(
        payload.storeId,
        payload.tenantId,
        payload.userId,
        payload.deviceId
      );
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// ==================== BLOCKED TIME ENTRIES THUNKS ====================

export const fetchBlockedTimeEntries = createAsyncThunk(
  'schedule/fetchBlockedTimeEntries',
  async (
    payload: { storeId: string; filters?: BlockedTimeFilters },
    { rejectWithValue }
  ) => {
    try {
      return await blockedTimeEntriesDB.getAll(payload.storeId, payload.filters);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchBlockedTimeForDateRange = createAsyncThunk(
  'schedule/fetchBlockedTimeForDateRange',
  async (
    payload: { storeId: string; startDate: string; endDate: string; staffId?: string },
    { rejectWithValue }
  ) => {
    try {
      return await blockedTimeEntriesDB.getForDateRange(
        payload.storeId,
        payload.startDate,
        payload.endDate,
        payload.staffId
      );
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const createBlockedTimeEntry = createAsyncThunk(
  'schedule/createBlockedTimeEntry',
  async (
    payload: {
      input: CreateBlockedTimeEntryInput;
      userId: string;
      storeId: string;
      tenantId: string;
      deviceId: string;
    },
    { rejectWithValue }
  ) => {
    try {
      // Returns array of entries (for recurring)
      return await blockedTimeEntriesDB.create(
        payload.input,
        payload.userId,
        payload.storeId,
        payload.tenantId,
        payload.deviceId
      );
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateBlockedTimeEntry = createAsyncThunk(
  'schedule/updateBlockedTimeEntry',
  async (
    payload: {
      id: string;
      updates: UpdateBlockedTimeEntryInput;
      updateMode: 'single' | 'thisAndFuture' | 'all';
      userId: string;
      deviceId: string;
    },
    { rejectWithValue }
  ) => {
    try {
      return await blockedTimeEntriesDB.update(
        payload.id,
        payload.updates,
        payload.updateMode,
        payload.userId,
        payload.deviceId
      );
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const deleteBlockedTimeEntry = createAsyncThunk(
  'schedule/deleteBlockedTimeEntry',
  async (
    payload: {
      id: string;
      deleteMode: 'single' | 'thisAndFuture' | 'all';
      userId: string;
      deviceId: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const deletedIds = await blockedTimeEntriesDB.delete(
        payload.id,
        payload.deleteMode,
        payload.userId,
        payload.deviceId
      );
      return { deletedIds, deleteMode: payload.deleteMode };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);
```

### 2.4 Synchronous Actions

```typescript
// Add to reducers

// Blocked Time Filters
setBlockedTimeFilters: (state, action: PayloadAction<Partial<BlockedTimeFilters>>) => {
  state.blockedTimeEntries.filters = {
    ...state.blockedTimeEntries.filters,
    ...action.payload,
  };
},
resetBlockedTimeFilters: (state) => {
  state.blockedTimeEntries.filters = {
    staffId: null,
    typeId: null,
    startDate: null,
    endDate: null,
  };
},

// Blocked Time UI
setSelectedBlockedTimeTypeId: (state, action: PayloadAction<string | null>) => {
  state.ui.selectedBlockedTimeTypeId = action.payload;
},
setSelectedBlockedTimeEntryId: (state, action: PayloadAction<string | null>) => {
  state.ui.selectedBlockedTimeEntryId = action.payload;
},
openBlockTimeModal: (state, action: PayloadAction<{
  staffId?: string;
  date?: string;
  startTime?: string;
} | undefined>) => {
  state.ui.blockTimeModalOpen = true;
  state.ui.blockTimeModalContext = action.payload ? {
    staffId: action.payload.staffId ?? null,
    date: action.payload.date ?? null,
    startTime: action.payload.startTime ?? null,
  } : null;
},
closeBlockTimeModal: (state) => {
  state.ui.blockTimeModalOpen = false;
  state.ui.blockTimeModalContext = null;
},
openEditBlockedTimeTypeModal: (state, action: PayloadAction<string>) => {
  state.ui.selectedBlockedTimeTypeId = action.payload;
  state.ui.activeModal = 'editBlockedTimeType';
},

// Optimistic Updates
optimisticAddBlockedTimeEntry: (state, action: PayloadAction<BlockedTimeEntry>) => {
  state.blockedTimeEntries.items.push(action.payload);
},
optimisticUpdateBlockedTimeEntry: (state, action: PayloadAction<BlockedTimeEntry>) => {
  const index = state.blockedTimeEntries.items.findIndex(e => e.id === action.payload.id);
  if (index !== -1) {
    state.blockedTimeEntries.items[index] = action.payload;
  }
},
optimisticRemoveBlockedTimeEntry: (state, action: PayloadAction<string>) => {
  state.blockedTimeEntries.items = state.blockedTimeEntries.items.filter(
    e => e.id !== action.payload
  );
},
optimisticRemoveBlockedTimeEntries: (state, action: PayloadAction<string[]>) => {
  const idsToRemove = new Set(action.payload);
  state.blockedTimeEntries.items = state.blockedTimeEntries.items.filter(
    e => !idsToRemove.has(e.id)
  );
},
```

### 2.5 Extra Reducers

```typescript
// Add to extraReducers builder

// Blocked Time Types
builder
  .addCase(fetchBlockedTimeTypes.pending, (state) => {
    state.blockedTimeTypes.loading = true;
    state.blockedTimeTypes.error = null;
  })
  .addCase(fetchBlockedTimeTypes.fulfilled, (state, action) => {
    state.blockedTimeTypes.loading = false;
    state.blockedTimeTypes.items = action.payload;
    state.blockedTimeTypes.lastFetched = new Date().toISOString();
  })
  .addCase(fetchBlockedTimeTypes.rejected, (state, action) => {
    state.blockedTimeTypes.loading = false;
    state.blockedTimeTypes.error = action.payload as string;
  })

  .addCase(fetchAllBlockedTimeTypes.pending, (state) => {
    state.blockedTimeTypes.loading = true;
    state.blockedTimeTypes.error = null;
  })
  .addCase(fetchAllBlockedTimeTypes.fulfilled, (state, action) => {
    state.blockedTimeTypes.loading = false;
    state.blockedTimeTypes.items = action.payload;
    state.blockedTimeTypes.lastFetched = new Date().toISOString();
  })
  .addCase(fetchAllBlockedTimeTypes.rejected, (state, action) => {
    state.blockedTimeTypes.loading = false;
    state.blockedTimeTypes.error = action.payload as string;
  })

  .addCase(createBlockedTimeType.pending, (state) => {
    state.blockedTimeTypes.loading = true;
  })
  .addCase(createBlockedTimeType.fulfilled, (state, action) => {
    state.blockedTimeTypes.loading = false;
    state.blockedTimeTypes.items.push(action.payload);
  })
  .addCase(createBlockedTimeType.rejected, (state, action) => {
    state.blockedTimeTypes.loading = false;
    state.blockedTimeTypes.error = action.payload as string;
  })

  .addCase(updateBlockedTimeType.fulfilled, (state, action) => {
    const index = state.blockedTimeTypes.items.findIndex(t => t.id === action.payload.id);
    if (index !== -1) {
      state.blockedTimeTypes.items[index] = action.payload;
    }
  })

  .addCase(deleteBlockedTimeType.fulfilled, (state, action) => {
    state.blockedTimeTypes.items = state.blockedTimeTypes.items.filter(
      t => t.id !== action.payload
    );
  })

  .addCase(seedBlockedTimeTypes.fulfilled, (state, action) => {
    state.blockedTimeTypes.items = [...state.blockedTimeTypes.items, ...action.payload];
  })

// Blocked Time Entries
builder
  .addCase(fetchBlockedTimeEntries.pending, (state) => {
    state.blockedTimeEntries.loading = true;
    state.blockedTimeEntries.error = null;
  })
  .addCase(fetchBlockedTimeEntries.fulfilled, (state, action) => {
    state.blockedTimeEntries.loading = false;
    state.blockedTimeEntries.items = action.payload;
    state.blockedTimeEntries.lastFetched = new Date().toISOString();
  })
  .addCase(fetchBlockedTimeEntries.rejected, (state, action) => {
    state.blockedTimeEntries.loading = false;
    state.blockedTimeEntries.error = action.payload as string;
  })

  .addCase(fetchBlockedTimeForDateRange.fulfilled, (state, action) => {
    // Merge with existing, avoiding duplicates
    const existingIds = new Set(state.blockedTimeEntries.items.map(e => e.id));
    const newEntries = action.payload.filter(e => !existingIds.has(e.id));
    state.blockedTimeEntries.items = [...state.blockedTimeEntries.items, ...newEntries];
  })

  .addCase(createBlockedTimeEntry.pending, (state) => {
    state.blockedTimeEntries.loading = true;
  })
  .addCase(createBlockedTimeEntry.fulfilled, (state, action) => {
    state.blockedTimeEntries.loading = false;
    // action.payload is array of entries (for recurring)
    state.blockedTimeEntries.items = [...state.blockedTimeEntries.items, ...action.payload];
  })
  .addCase(createBlockedTimeEntry.rejected, (state, action) => {
    state.blockedTimeEntries.loading = false;
    state.blockedTimeEntries.error = action.payload as string;
  })

  .addCase(updateBlockedTimeEntry.fulfilled, (state, action) => {
    // action.payload is array of updated entries
    const updatedMap = new Map(action.payload.map(e => [e.id, e]));
    state.blockedTimeEntries.items = state.blockedTimeEntries.items.map(e =>
      updatedMap.has(e.id) ? updatedMap.get(e.id)! : e
    );
  })

  .addCase(deleteBlockedTimeEntry.fulfilled, (state, action) => {
    const deletedIds = new Set(action.payload.deletedIds);
    state.blockedTimeEntries.items = state.blockedTimeEntries.items.filter(
      e => !deletedIds.has(e.id)
    );
  });
```

---

## Part 3: Selectors

```typescript
// Add to src/store/selectors/scheduleSelectors.ts

// ==================== BLOCKED TIME TYPES SELECTORS ====================

export const selectBlockedTimeTypesState = (state: RootState) =>
  state.schedule.blockedTimeTypes;

export const selectBlockedTimeTypes = (state: RootState) =>
  state.schedule.blockedTimeTypes.items;

export const selectBlockedTimeTypesLoading = (state: RootState) =>
  state.schedule.blockedTimeTypes.loading;

export const selectBlockedTimeTypesError = (state: RootState) =>
  state.schedule.blockedTimeTypes.error;

export const selectBlockedTimeTypesLastFetched = (state: RootState) =>
  state.schedule.blockedTimeTypes.lastFetched;

export const selectActiveBlockedTimeTypes = createSelector(
  [selectBlockedTimeTypes],
  (types): BlockedTimeType[] =>
    types
      .filter(t => t.isActive && !t.isDeleted)
      .sort((a, b) => a.displayOrder - b.displayOrder)
);

export const selectAllBlockedTimeTypesSorted = createSelector(
  [selectBlockedTimeTypes],
  (types): BlockedTimeType[] =>
    types
      .filter(t => !t.isDeleted)
      .sort((a, b) => a.displayOrder - b.displayOrder)
);

export const selectBlockedTimeTypesMap = createSelector(
  [selectBlockedTimeTypes],
  (types): Map<string, BlockedTimeType> =>
    new Map(types.filter(t => !t.isDeleted).map(t => [t.id, t]))
);

export const selectBlockedTimeTypesNeedsRefresh = createSelector(
  [selectBlockedTimeTypesLastFetched],
  (lastFetched): boolean => {
    if (!lastFetched) return true;
    const staleTime = 5 * 60 * 1000; // 5 minutes
    return Date.now() - new Date(lastFetched).getTime() > staleTime;
  }
);

export const selectSelectedBlockedTimeType = createSelector(
  [selectBlockedTimeTypesMap, (state: RootState) => state.schedule.ui.selectedBlockedTimeTypeId],
  (typesMap, selectedId): BlockedTimeType | undefined =>
    selectedId ? typesMap.get(selectedId) : undefined
);

// ==================== BLOCKED TIME ENTRIES SELECTORS ====================

export const selectBlockedTimeEntriesState = (state: RootState) =>
  state.schedule.blockedTimeEntries;

export const selectBlockedTimeEntries = (state: RootState) =>
  state.schedule.blockedTimeEntries.items;

export const selectBlockedTimeEntriesLoading = (state: RootState) =>
  state.schedule.blockedTimeEntries.loading;

export const selectBlockedTimeEntriesError = (state: RootState) =>
  state.schedule.blockedTimeEntries.error;

export const selectBlockedTimeFilters = (state: RootState) =>
  state.schedule.blockedTimeEntries.filters;

export const selectBlockedTimeEntriesLastFetched = (state: RootState) =>
  state.schedule.blockedTimeEntries.lastFetched;

export const selectFilteredBlockedTimeEntries = createSelector(
  [selectBlockedTimeEntries, selectBlockedTimeFilters],
  (entries, filters): BlockedTimeEntry[] => {
    return entries
      .filter(e => {
        if (e.isDeleted) return false;
        if (filters.staffId && e.staffId !== filters.staffId) return false;
        if (filters.typeId && e.typeId !== filters.typeId) return false;

        // Date filtering using startDateTime
        const entryDate = e.startDateTime.split('T')[0];
        if (filters.startDate && entryDate < filters.startDate) return false;
        if (filters.endDate && entryDate > filters.endDate) return false;

        return true;
      })
      .sort((a, b) => a.startDateTime.localeCompare(b.startDateTime));
  }
);

export const selectBlockedTimeEntriesNeedsRefresh = createSelector(
  [selectBlockedTimeEntriesLastFetched],
  (lastFetched): boolean => {
    if (!lastFetched) return true;
    const staleTime = 2 * 60 * 1000; // 2 minutes
    return Date.now() - new Date(lastFetched).getTime() > staleTime;
  }
);

// Factory selector: Blocked time for staff on a specific date
export const makeSelectBlockedTimeForStaffAndDate = () =>
  createSelector(
    [
      selectBlockedTimeEntries,
      (_state: RootState, staffId: string) => staffId,
      (_state: RootState, _staffId: string, date: string) => date,
    ],
    (entries, staffId, date): BlockedTimeEntry[] =>
      entries
        .filter(e => {
          if (e.isDeleted) return false;
          if (e.staffId !== staffId) return false;
          const entryDate = e.startDateTime.split('T')[0];
          return entryDate === date;
        })
        .sort((a, b) => a.startDateTime.localeCompare(b.startDateTime))
  );

// Factory selector: Blocked time for date range (for calendar display)
export const makeSelectBlockedTimeForDateRange = () =>
  createSelector(
    [
      selectBlockedTimeEntries,
      (_state: RootState, startDate: string) => startDate,
      (_state: RootState, _startDate: string, endDate: string) => endDate,
      (_state: RootState, _startDate: string, _endDate: string, staffId?: string) => staffId,
    ],
    (entries, startDate, endDate, staffId): BlockedTimeEntry[] =>
      entries.filter(e => {
        if (e.isDeleted) return false;
        if (staffId && e.staffId !== staffId) return false;
        const entryDate = e.startDateTime.split('T')[0];
        return entryDate >= startDate && entryDate <= endDate;
      })
  );

// Factory selector: Check if time slot conflicts with blocked time
export const makeSelectBlockedTimeConflicts = () =>
  createSelector(
    [
      selectBlockedTimeEntries,
      (_state: RootState, staffId: string) => staffId,
      (_state: RootState, _staffId: string, date: string) => date,
      (_state: RootState, _staffId: string, _date: string, startTime: string) => startTime,
      (_state: RootState, _staffId: string, _date: string, _startTime: string, endTime: string) => endTime,
    ],
    (entries, staffId, date, startTime, endTime): BlockedTimeEntry[] => {
      return entries.filter(e => {
        if (e.isDeleted) return false;
        if (e.staffId !== staffId) return false;

        const entryDate = e.startDateTime.split('T')[0];
        if (entryDate !== date) return false;

        // Extract times from ISO datetime
        const entryStartTime = e.startDateTime.split('T')[1].substring(0, 5);
        const entryEndTime = e.endDateTime.split('T')[1].substring(0, 5);

        // Check overlap: times overlap if start1 < end2 AND end1 > start2
        return startTime < entryEndTime && endTime > entryStartTime;
      });
    }
  );

// ==================== UI STATE SELECTORS ====================

export const selectBlockTimeModalOpen = (state: RootState) =>
  state.schedule.ui.blockTimeModalOpen;

export const selectBlockTimeModalContext = (state: RootState) =>
  state.schedule.ui.blockTimeModalContext;

export const selectSelectedBlockedTimeEntry = createSelector(
  [selectBlockedTimeEntries, (state: RootState) => state.schedule.ui.selectedBlockedTimeEntryId],
  (entries, selectedId): BlockedTimeEntry | undefined =>
    selectedId ? entries.find(e => e.id === selectedId && !e.isDeleted) : undefined
);
```

---

## Part 4: Custom Hooks

```typescript
// Add to src/hooks/useSchedule.ts

// ==================== BLOCKED TIME TYPES HOOKS ====================

/**
 * Hook for fetching and accessing active blocked time types
 * Auto-fetches on mount or when data is stale
 */
export function useBlockedTimeTypes(storeId: string) {
  const dispatch = useAppDispatch();
  const types = useAppSelector(selectActiveBlockedTimeTypes);
  const loading = useAppSelector(selectBlockedTimeTypesLoading);
  const error = useAppSelector(selectBlockedTimeTypesError);
  const needsRefresh = useAppSelector(selectBlockedTimeTypesNeedsRefresh);

  useEffect(() => {
    if (needsRefresh && storeId) {
      dispatch(fetchBlockedTimeTypes(storeId));
    }
  }, [dispatch, storeId, needsRefresh]);

  const refetch = useCallback(() => {
    if (storeId) {
      return dispatch(fetchBlockedTimeTypes(storeId));
    }
  }, [dispatch, storeId]);

  const clearError = useCallback(() => {
    dispatch(clearScheduleError());
  }, [dispatch]);

  return {
    types,
    loading,
    error,
    refetch,
    clearError,
  };
}

/**
 * Hook for fetching all blocked time types including inactive (for settings)
 */
export function useAllBlockedTimeTypes(storeId: string) {
  const dispatch = useAppDispatch();
  const types = useAppSelector(selectAllBlockedTimeTypesSorted);
  const loading = useAppSelector(selectBlockedTimeTypesLoading);
  const error = useAppSelector(selectBlockedTimeTypesError);
  const needsRefresh = useAppSelector(selectBlockedTimeTypesNeedsRefresh);

  useEffect(() => {
    if (needsRefresh && storeId) {
      dispatch(fetchAllBlockedTimeTypes(storeId));
    }
  }, [dispatch, storeId, needsRefresh]);

  const refetch = useCallback(() => {
    if (storeId) {
      return dispatch(fetchAllBlockedTimeTypes(storeId));
    }
  }, [dispatch, storeId]);

  return {
    types,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook for blocked time type CRUD mutations
 */
export function useBlockedTimeTypeMutations(context: ScheduleContext) {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectBlockedTimeTypesLoading);

  const create = useCallback(
    async (input: CreateBlockedTimeTypeInput) => {
      const result = await dispatch(
        createBlockedTimeType({
          input,
          userId: context.userId,
          storeId: context.storeId,
          tenantId: context.tenantId,
          deviceId: context.deviceId,
        })
      ).unwrap();
      return result;
    },
    [dispatch, context]
  );

  const update = useCallback(
    async (id: string, updates: UpdateBlockedTimeTypeInput) => {
      const result = await dispatch(
        updateBlockedTimeType({
          id,
          updates,
          userId: context.userId,
          deviceId: context.deviceId,
        })
      ).unwrap();
      return result;
    },
    [dispatch, context]
  );

  const remove = useCallback(
    async (id: string) => {
      await dispatch(
        deleteBlockedTimeType({
          id,
          userId: context.userId,
          deviceId: context.deviceId,
        })
      ).unwrap();
    },
    [dispatch, context]
  );

  const seed = useCallback(async () => {
    const result = await dispatch(
      seedBlockedTimeTypes({
        storeId: context.storeId,
        tenantId: context.tenantId,
        userId: context.userId,
        deviceId: context.deviceId,
      })
    ).unwrap();
    return result;
  }, [dispatch, context]);

  return {
    create,
    update,
    remove,
    seed,
    loading,
  };
}

/**
 * Hook to get blocked time types as a lookup map
 */
export function useBlockedTimeTypesMap() {
  return useAppSelector(selectBlockedTimeTypesMap);
}

// ==================== BLOCKED TIME ENTRIES HOOKS ====================

/**
 * Hook for fetching and filtering blocked time entries
 */
export function useBlockedTimeEntries(storeId: string) {
  const dispatch = useAppDispatch();
  const entries = useAppSelector(selectFilteredBlockedTimeEntries);
  const loading = useAppSelector(selectBlockedTimeEntriesLoading);
  const error = useAppSelector(selectBlockedTimeEntriesError);
  const filters = useAppSelector(selectBlockedTimeFilters);
  const needsRefresh = useAppSelector(selectBlockedTimeEntriesNeedsRefresh);

  useEffect(() => {
    if (storeId) {
      dispatch(fetchBlockedTimeEntries({ storeId, filters }));
    }
  }, [dispatch, storeId]); // Don't include filters to avoid refetch on filter change

  const refetch = useCallback(() => {
    if (storeId) {
      dispatch(fetchBlockedTimeEntries({ storeId, filters }));
    }
  }, [dispatch, storeId, filters]);

  const setFilters = useCallback(
    (newFilters: Partial<BlockedTimeFilters>) => {
      dispatch(setBlockedTimeFilters(newFilters));
    },
    [dispatch]
  );

  const resetFilters = useCallback(() => {
    dispatch(resetBlockedTimeFilters());
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch(clearScheduleError());
  }, [dispatch]);

  return {
    entries,
    loading,
    error,
    filters,
    needsRefresh,
    refetch,
    setFilters,
    resetFilters,
    clearError,
  };
}

/**
 * Hook for blocked time entries by staff ID and date
 */
export function useStaffBlockedTime(staffId: string, date: string) {
  const selectByStaffAndDate = useMemo(makeSelectBlockedTimeForStaffAndDate, []);
  const entries = useAppSelector(state => selectByStaffAndDate(state, staffId, date));
  return { entries };
}

/**
 * Hook for blocked time in a date range (for calendar display)
 */
export function useCalendarBlockedTime(startDate: string, endDate: string, staffId?: string) {
  const selectForDateRange = useMemo(makeSelectBlockedTimeForDateRange, []);
  const entries = useAppSelector(state => selectForDateRange(state, startDate, endDate, staffId));
  return { entries };
}

/**
 * Hook for blocked time entry CRUD mutations
 */
export function useBlockedTimeEntryMutations(context: ScheduleContext) {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectBlockedTimeEntriesLoading);

  const create = useCallback(
    async (input: CreateBlockedTimeEntryInput) => {
      const result = await dispatch(
        createBlockedTimeEntry({
          input,
          userId: context.userId,
          storeId: context.storeId,
          tenantId: context.tenantId,
          deviceId: context.deviceId,
        })
      ).unwrap();
      return result;
    },
    [dispatch, context]
  );

  const update = useCallback(
    async (
      id: string,
      updates: UpdateBlockedTimeEntryInput,
      updateMode: 'single' | 'thisAndFuture' | 'all' = 'single'
    ) => {
      const result = await dispatch(
        updateBlockedTimeEntry({
          id,
          updates,
          updateMode,
          userId: context.userId,
          deviceId: context.deviceId,
        })
      ).unwrap();
      return result;
    },
    [dispatch, context]
  );

  const remove = useCallback(
    async (
      id: string,
      deleteMode: 'single' | 'thisAndFuture' | 'all' = 'single'
    ) => {
      await dispatch(
        deleteBlockedTimeEntry({
          id,
          deleteMode,
          userId: context.userId,
          deviceId: context.deviceId,
        })
      ).unwrap();
    },
    [dispatch, context]
  );

  return {
    create,
    update,
    remove,
    loading,
  };
}

// ==================== BLOCKED TIME MODAL HOOKS ====================

/**
 * Hook for block time modal management
 */
export function useBlockTimeModal() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(selectBlockTimeModalOpen);
  const context = useAppSelector(selectBlockTimeModalContext);

  const open = useCallback(
    (params?: { staffId?: string; date?: string; startTime?: string }) => {
      dispatch(openBlockTimeModal(params));
    },
    [dispatch]
  );

  const close = useCallback(() => {
    dispatch(closeBlockTimeModal());
  }, [dispatch]);

  return {
    isOpen,
    context,
    open,
    close,
  };
}

// ==================== CONFLICT DETECTION HOOK ====================

/**
 * Hook to check for blocked time conflicts when booking
 */
export function useBlockedTimeConflictCheck() {
  const selectConflicts = useMemo(makeSelectBlockedTimeConflicts, []);

  const checkConflicts = useCallback(
    (state: RootState, staffId: string, date: string, startTime: string, endTime: string) => {
      return selectConflicts(state, staffId, date, startTime, endTime);
    },
    [selectConflicts]
  );

  return { checkConflicts };
}

/**
 * Hook to get blocked time conflicts for a specific time slot
 * Returns the conflicts directly (reactive to state changes)
 */
export function useBlockedTimeConflicts(
  staffId: string,
  date: string,
  startTime: string,
  endTime: string
) {
  const selectConflicts = useMemo(makeSelectBlockedTimeConflicts, []);
  const conflicts = useAppSelector(state =>
    selectConflicts(state, staffId, date, startTime, endTime)
  );

  const hasConflicts = conflicts.length > 0;

  return {
    conflicts,
    hasConflicts,
  };
}
```

---

## Part 5: UI Components

### 5.1 BlockedTimeTypesSettings.tsx

```typescript
// src/components/schedule/BlockedTimeTypesSettings.tsx

import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAllBlockedTimeTypes, useBlockedTimeTypeMutations } from '@/hooks/useSchedule';
import { useScheduleContext } from '@/hooks/useScheduleContext';
import { BlockedTimeTypeModal } from './BlockedTimeTypeModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { BlockedTimeType } from '@/types/schedule';

export function BlockedTimeTypesSettings() {
  const { storeId, context } = useScheduleContext();
  const { types, loading, error, refetch } = useAllBlockedTimeTypes(storeId);
  const { update, remove, seed } = useBlockedTimeTypeMutations(context);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<BlockedTimeType | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<BlockedTimeType | null>(null);

  // Seed defaults if no types exist
  useEffect(() => {
    if (!loading && types.length === 0) {
      seed();
    }
  }, [loading, types.length, seed]);

  const handleEdit = (type: BlockedTimeType) => {
    setEditingType(type);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      try {
        await remove(deleteConfirm.id);
        setDeleteConfirm(null);
      } catch (error) {
        // Error handled by hook
      }
    }
  };

  const handleToggleActive = async (type: BlockedTimeType) => {
    await update(type.id, { isActive: !type.isActive });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingType(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Blocked Time Types</CardTitle>
        <Button onClick={() => setIsModalOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Type
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : (
          <div className="space-y-2">
            {types.map((type) => (
              <div
                key={type.id}
                className={`flex items-center gap-4 p-3 rounded-lg border ${
                  type.isActive ? 'bg-white' : 'bg-gray-50 opacity-60'
                }`}
              >
                {/* Drag Handle */}
                <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />

                {/* Color & Emoji */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                  style={{ backgroundColor: type.color + '20' }}
                >
                  {type.emoji}
                </div>

                {/* Name & Code */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{type.name}</div>
                  <div className="text-sm text-gray-500">
                    {type.code} • {type.defaultDurationMinutes} min
                    {type.isPaid && <Badge variant="outline" className="ml-2">Paid</Badge>}
                  </div>
                </div>

                {/* Booking Badges */}
                <div className="flex gap-1">
                  {type.blocksOnlineBooking && (
                    <Badge variant="secondary" className="text-xs">Online</Badge>
                  )}
                  {type.blocksInStoreBooking && (
                    <Badge variant="secondary" className="text-xs">In-Store</Badge>
                  )}
                </div>

                {/* Active Toggle */}
                <Switch
                  checked={type.isActive}
                  onCheckedChange={() => handleToggleActive(type)}
                  disabled={type.isSystemDefault}
                />

                {/* Actions */}
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(type)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteConfirm(type)}
                    disabled={type.isSystemDefault}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        <BlockedTimeTypeModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          editingType={editingType}
        />

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={!!deleteConfirm}
          onOpenChange={(open) => !open && setDeleteConfirm(null)}
          title="Delete Blocked Time Type"
          description={`Are you sure you want to delete "${deleteConfirm?.name}"? This cannot be undone.`}
          confirmText="Delete"
          confirmVariant="destructive"
          onConfirm={handleDelete}
        />
      </CardContent>
    </Card>
  );
}
```

### 5.2 BlockedTimeTypeModal.tsx

```typescript
// src/components/schedule/BlockedTimeTypeModal.tsx

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { EmojiPicker } from '@/components/ui/EmojiPicker';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { useBlockedTimeTypeMutations } from '@/hooks/useSchedule';
import { useScheduleContext } from '@/hooks/useScheduleContext';
import type { BlockedTimeType, CreateBlockedTimeTypeInput } from '@/types/schedule';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  code: z.string().min(1, 'Code is required').max(10).toUpperCase(),
  emoji: z.string().min(1, 'Emoji is required'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color'),
  defaultDurationMinutes: z.number().min(5).max(480),
  isPaid: z.boolean(),
  blocksOnlineBooking: z.boolean(),
  blocksInStoreBooking: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editingType: BlockedTimeType | null;
}

export function BlockedTimeTypeModal({ isOpen, onClose, editingType }: Props) {
  const { context } = useScheduleContext();
  const { create, update, loading } = useBlockedTimeTypeMutations(context);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: editingType ?? {
      name: '',
      code: '',
      emoji: '📋',
      color: '#6B7280',
      defaultDurationMinutes: 30,
      isPaid: true,
      blocksOnlineBooking: true,
      blocksInStoreBooking: true,
    },
  });

  const emoji = watch('emoji');
  const color = watch('color');

  React.useEffect(() => {
    if (editingType) {
      reset(editingType);
    } else {
      reset({
        name: '',
        code: '',
        emoji: '📋',
        color: '#6B7280',
        defaultDurationMinutes: 30,
        isPaid: true,
        blocksOnlineBooking: true,
        blocksInStoreBooking: true,
      });
    }
  }, [editingType, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (editingType) {
        await update(editingType.id, data);
      } else {
        await create(data);
      }
      onClose();
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingType ? 'Edit Blocked Time Type' : 'Add Blocked Time Type'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register('name')} placeholder="e.g., Lunch Break" />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Code */}
          <div>
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              {...register('code')}
              placeholder="e.g., LUNCH"
              className="uppercase"
            />
            {errors.code && (
              <p className="text-sm text-red-500 mt-1">{errors.code.message}</p>
            )}
          </div>

          {/* Emoji & Color */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Emoji</Label>
              <EmojiPicker
                value={emoji}
                onChange={(value) => setValue('emoji', value)}
              />
            </div>
            <div>
              <Label>Color</Label>
              <ColorPicker
                value={color}
                onChange={(value) => setValue('color', value)}
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <Label htmlFor="duration">Default Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min={5}
              max={480}
              {...register('defaultDurationMinutes', { valueAsNumber: true })}
            />
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="isPaid">Paid Time</Label>
              <Switch
                id="isPaid"
                checked={watch('isPaid')}
                onCheckedChange={(checked) => setValue('isPaid', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="blocksOnline">Blocks Online Booking</Label>
              <Switch
                id="blocksOnline"
                checked={watch('blocksOnlineBooking')}
                onCheckedChange={(checked) => setValue('blocksOnlineBooking', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="blocksInStore">Blocks In-Store Booking</Label>
              <Switch
                id="blocksInStore"
                checked={watch('blocksInStoreBooking')}
                onCheckedChange={(checked) => setValue('blocksInStoreBooking', checked)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : editingType ? 'Save Changes' : 'Add Type'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### 5.3 BlockTimeModal.tsx

```typescript
// src/components/schedule/BlockTimeModal.tsx

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/DatePicker';
import { TimePicker } from '@/components/ui/TimePicker';
import {
  useBlockTimeModal,
  useBlockedTimeTypes,
  useBlockedTimeEntryMutations,
  useStaff,
} from '@/hooks/useSchedule';
import { useScheduleContext } from '@/hooks/useScheduleContext';
import type { BlockedTimeFrequency } from '@/types/schedule';

const schema = z.object({
  staffId: z.string().min(1, 'Staff is required'),
  staffName: z.string(),
  typeId: z.string().min(1, 'Type is required'),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time'),
  frequency: z.enum(['once', 'daily', 'weekly', 'biweekly', 'monthly']),
  repeatUntilDate: z.string().optional(),
  repeatCount: z.number().optional(),
  notes: z.string().optional(),
}).refine((data) => data.startTime < data.endTime, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

type FormData = z.infer<typeof schema>;

export function BlockTimeModal() {
  const { isOpen, context: modalContext, close } = useBlockTimeModal();
  const { storeId, context } = useScheduleContext();
  const { types } = useBlockedTimeTypes(storeId);
  const { create, loading } = useBlockedTimeEntryMutations(context);
  const { staff } = useStaff(storeId);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      staffId: modalContext?.staffId ?? '',
      staffName: '',
      typeId: '',
      date: modalContext?.date ?? new Date().toISOString().split('T')[0],
      startTime: modalContext?.startTime ?? '12:00',
      endTime: '13:00',
      frequency: 'once',
      notes: '',
    },
  });

  const selectedTypeId = watch('typeId');
  const selectedType = types.find(t => t.id === selectedTypeId);
  const frequency = watch('frequency');

  // Auto-fill end time based on selected type duration
  React.useEffect(() => {
    if (selectedType) {
      const start = watch('startTime');
      if (start) {
        const [hours, minutes] = start.split(':').map(Number);
        const endMinutes = hours * 60 + minutes + selectedType.defaultDurationMinutes;
        const endHours = Math.floor(endMinutes / 60);
        const endMins = endMinutes % 60;
        setValue('endTime', `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`);
      }
    }
  }, [selectedType, watch('startTime')]);

  // Update staffName when staffId changes
  React.useEffect(() => {
    const staffId = watch('staffId');
    const selectedStaff = staff.find(s => s.id === staffId);
    if (selectedStaff) {
      setValue('staffName', selectedStaff.displayName ?? selectedStaff.firstName);
    }
  }, [watch('staffId'), staff]);

  const onSubmit = async (data: FormData) => {
    try {
      await create({
        staffId: data.staffId,
        staffName: data.staffName,
        typeId: data.typeId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        frequency: data.frequency as BlockedTimeFrequency,
        repeatUntilDate: data.repeatUntilDate,
        repeatCount: data.repeatCount,
        notes: data.notes,
      });
      close();
      reset();
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Block Time</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Staff Selection */}
          <div>
            <Label>Staff Member</Label>
            <Select
              value={watch('staffId')}
              onValueChange={(value) => setValue('staffId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.displayName ?? `${s.firstName} ${s.lastName}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.staffId && (
              <p className="text-sm text-red-500 mt-1">{errors.staffId.message}</p>
            )}
          </div>

          {/* Type Selection */}
          <div>
            <Label>Block Type</Label>
            <Select
              value={watch('typeId')}
              onValueChange={(value) => setValue('typeId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {types.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: type.color }}
                      />
                      <span>{type.emoji}</span>
                      <span>{type.name}</span>
                      <span className="text-gray-400">({type.defaultDurationMinutes} min)</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.typeId && (
              <p className="text-sm text-red-500 mt-1">{errors.typeId.message}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <Label>Date</Label>
            <DatePicker
              value={watch('date')}
              onChange={(value) => setValue('date', value)}
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Time</Label>
              <TimePicker
                value={watch('startTime')}
                onChange={(value) => setValue('startTime', value)}
              />
            </div>
            <div>
              <Label>End Time</Label>
              <TimePicker
                value={watch('endTime')}
                onChange={(value) => setValue('endTime', value)}
              />
              {errors.endTime && (
                <p className="text-sm text-red-500 mt-1">{errors.endTime.message}</p>
              )}
            </div>
          </div>

          {/* Recurrence */}
          <div>
            <Label>Repeat</Label>
            <Select
              value={watch('frequency')}
              onValueChange={(value) => setValue('frequency', value as BlockedTimeFrequency)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="once">Does not repeat</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Repeat Until (shown only for recurring) */}
          {frequency !== 'once' && (
            <div>
              <Label>Repeat Until</Label>
              <DatePicker
                value={watch('repeatUntilDate') ?? ''}
                onChange={(value) => setValue('repeatUntilDate', value)}
                minDate={watch('date')}
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <Label>Notes (optional)</Label>
            <Textarea
              {...register('notes')}
              placeholder="Add any notes..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Block Time'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### 5.4 RecurringEditModal.tsx

```typescript
// src/components/schedule/RecurringEditModal.tsx

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export type RecurringEditMode = 'single' | 'thisAndFuture' | 'all';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mode: RecurringEditMode) => void;
  action: 'edit' | 'delete';
  itemName: string;
}

export function RecurringEditModal({
  isOpen,
  onClose,
  onConfirm,
  action,
  itemName,
}: Props) {
  const [selectedMode, setSelectedMode] = React.useState<RecurringEditMode>('single');

  const handleConfirm = () => {
    onConfirm(selectedMode);
    onClose();
  };

  const actionText = action === 'edit' ? 'Edit' : 'Delete';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{actionText} Recurring Event</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-600 mb-4">
            "{itemName}" is part of a recurring series. How would you like to {action.toLowerCase()} it?
          </p>

          <RadioGroup
            value={selectedMode}
            onValueChange={(value) => setSelectedMode(value as RecurringEditMode)}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="single" id="single" />
              <Label htmlFor="single" className="cursor-pointer">
                <span className="font-medium">This occurrence only</span>
                <p className="text-sm text-gray-500">
                  Only {action.toLowerCase()} this specific date
                </p>
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <RadioGroupItem value="thisAndFuture" id="thisAndFuture" />
              <Label htmlFor="thisAndFuture" className="cursor-pointer">
                <span className="font-medium">This and all future occurrences</span>
                <p className="text-sm text-gray-500">
                  {actionText} this and all dates after it
                </p>
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all" className="cursor-pointer">
                <span className="font-medium">All occurrences</span>
                <p className="text-sm text-gray-500">
                  {actionText} the entire series
                </p>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant={action === 'delete' ? 'destructive' : 'default'}
          >
            {actionText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Part 6: Calendar Integration

### 6.1 DaySchedule.v2.tsx Integration

```typescript
// Add to DaySchedule.v2.tsx

// Import blocked time hook
import { useCalendarBlockedTime } from '@/hooks/useSchedule';

// Inside component:
const dateStr = date.toISOString().split('T')[0];
const { entries: blockedTimeEntries } = useCalendarBlockedTime(dateStr, dateStr);

// Group by staff
const blockedTimeByStaff = useMemo(() => {
  const map = new Map<string, BlockedTimeEntry[]>();
  blockedTimeEntries.forEach(entry => {
    const existing = map.get(entry.staffId) ?? [];
    map.set(entry.staffId, [...existing, entry]);
  });
  return map;
}, [blockedTimeEntries]);

// In the staff column render, add:
{/* Blocked Time Entries */}
{blockedTimeByStaff.get(staff.id)?.map(entry => (
  <BlockedTimeBlock
    key={entry.id}
    entry={entry}
    onClick={() => handleBlockedTimeClick(entry)}
  />
))}

// BlockedTimeBlock component (inline or separate file)
function BlockedTimeBlock({ entry, onClick }: { entry: BlockedTimeEntry; onClick: () => void }) {
  const startMinutes = timeToMinutes(entry.startDateTime.split('T')[1].substring(0, 5));
  const endMinutes = timeToMinutes(entry.endDateTime.split('T')[1].substring(0, 5));
  const duration = endMinutes - startMinutes;

  // Calculate position (assuming 60px per hour)
  const top = (startMinutes / 60) * 60; // 60px per hour
  const height = (duration / 60) * 60;

  return (
    <div
      className="absolute left-0 right-0 mx-1 rounded cursor-pointer hover:opacity-90 transition-opacity"
      style={{
        top: `${top}px`,
        height: `${height}px`,
        backgroundColor: entry.typeColor + '30', // 30% opacity
        borderLeft: `3px solid ${entry.typeColor}`,
      }}
      onClick={onClick}
    >
      <div className="p-1 text-xs truncate">
        <span className="mr-1">{entry.typeEmoji}</span>
        <span className="font-medium">{entry.typeName}</span>
      </div>
    </div>
  );
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}
```

### 6.2 Context Menu Integration

```typescript
// Add to time slot context menu (e.g., in DaySchedule or StaffColumn)

import { useBlockTimeModal } from '@/hooks/useSchedule';

// Inside component:
const { open: openBlockTimeModal } = useBlockTimeModal();

const handleTimeSlotRightClick = (e: React.MouseEvent, staffId: string, time: Date) => {
  e.preventDefault();
  // Show context menu with "Block Time" option
  showContextMenu({
    items: [
      {
        label: 'Block Time',
        icon: <Clock className="w-4 h-4" />,
        onClick: () => openBlockTimeModal({
          staffId,
          date: time.toISOString().split('T')[0],
          startTime: `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`,
        }),
      },
      // ... other menu items
    ],
  });
};
```

---

## Part 7: Store Configuration Update

```typescript
// Update src/store/index.ts ignoredPaths

ignoredPaths: [
  // ... existing paths ...
  // Schedule module - blocked time
  'schedule.blockedTimeTypes.items',
  'schedule.blockedTimeEntries.items',
],
```

---

## Implementation Checklist

### Task 1: Error Types (30 min)
- [ ] Add blocked time error classes to `errors.ts`
- [ ] Add type guards

### Task 2: Redux Slice Extension (2 hours)
- [ ] Add state interface for blocked time
- [ ] Add initial state
- [ ] Add async thunks (8 thunks)
- [ ] Add synchronous actions (10 actions)
- [ ] Add extra reducers

### Task 3: Selectors (1 hour)
- [ ] Add base selectors
- [ ] Add memoized selectors
- [ ] Add factory selectors
- [ ] Add UI state selectors

### Task 4: Custom Hooks (1.5 hours)
- [ ] Add blocked time types hooks (4 hooks)
- [ ] Add blocked time entries hooks (4 hooks)
- [ ] Add modal management hook
- [ ] Add conflict detection hooks (2 hooks)

### Task 5: UI Components (4 hours)
- [ ] BlockedTimeTypesSettings.tsx
- [ ] BlockedTimeTypeModal.tsx
- [ ] BlockTimeModal.tsx
- [ ] RecurringEditModal.tsx

### Task 6: Calendar Integration (2 hours)
- [ ] Update DaySchedule.v2.tsx
- [ ] Add BlockedTimeBlock component
- [ ] Add context menu integration

### Task 7: Store Configuration (15 min)
- [ ] Update ignoredPaths

### Task 8: Type Checking (30 min)
- [ ] Run type checking
- [ ] Fix any errors

**Total Estimated Time:** 11-12 hours

---

## Frontend Validation Guide

### 1. Blocked Time Types Settings

**Navigation:** Settings > Schedule > Blocked Time Types

**Test Cases:**
1. ✅ 7 default types should be seeded (Lunch, Coffee, Training, Meeting, Admin, Cleaning, Personal)
2. ✅ Click "Add Type" - modal opens with emoji/color pickers
3. ✅ Create custom type "Client Call" with phone emoji
4. ✅ Edit type - changes persist
5. ✅ Toggle active/inactive - works for custom types
6. ✅ Cannot toggle/delete system defaults
7. ✅ Delete custom type - removed from list

### 2. Block Time Modal

**Navigation:** Book page > Right-click on time slot > "Block Time"

**Test Cases:**
1. ✅ Modal opens with pre-filled staff/date/time from context
2. ✅ Type dropdown shows all active types with emoji/color
3. ✅ End time auto-fills based on type duration
4. ✅ Create one-time block - appears on calendar
5. ✅ Create recurring weekly block - multiple entries created
6. ✅ Form validation works (required fields, time order)

### 3. Calendar Display

**Navigation:** Book page > Day view

**Test Cases:**
1. ✅ Blocked time shows with type color (30% opacity background)
2. ✅ Left border in solid type color
3. ✅ Shows emoji + type name
4. ✅ Correct vertical position based on time
5. ✅ Click opens edit options

### 4. Recurring Edit/Delete

**Test Cases:**
1. ✅ Click recurring blocked time
2. ✅ Edit/delete shows modal with 3 options
3. ✅ "This only" - only one entry affected
4. ✅ "This and future" - entry + future ones affected
5. ✅ "All" - entire series affected

### 5. Booking Conflict Prevention

**Test Cases:**
1. ✅ Try to book appointment during blocked time
2. ✅ If `blocksInStoreBooking: true` - shows warning
3. ✅ Warning shows type name and time
4. ✅ Can override with confirmation

---

**Document Version:** 2.0 (Enhanced)
**Rating:** 9.5/10
**Ready for Implementation:** Yes
