/**
 * Catalog Redux Slice
 * @deprecated This Redux slice is deprecated and will be removed.
 * Use the useCatalog hook from src/hooks/useCatalog.ts instead.
 *
 * The useCatalog hook uses Dexie live queries directly, which:
 * - Eliminates the Redux/Dexie sync complexity
 * - Provides automatic reactivity when data changes
 * - Simplifies the architecture (KISS principle)
 *
 * This file is kept temporarily for reference during migration.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  serviceCategoriesDB,
  menuServicesDB,
  serviceVariantsDB,
  servicePackagesDB,
  addOnGroupsDB,
  addOnOptionsDB,
  catalogSettingsDB,
} from '../../db/database';
import type {
  ServiceCategory,
  MenuService,
  ServiceVariant,
  ServicePackage,
  AddOnGroup,
  AddOnOption,
  CatalogSettings,
  CatalogTab,
  CatalogViewMode,
  CreateCategoryInput,
  CreateMenuServiceInput,
  CreateVariantInput,
  CreatePackageInput,
  CreateAddOnGroupInput,
  CreateAddOnOptionInput,
  CategoryWithCount,
  AddOnGroupWithOptions,
} from '../../types';
// RootState import removed - selectors are deprecated

// ==================== STATE INTERFACE ====================

interface CatalogState {
  // Data
  categories: ServiceCategory[];
  categoriesWithCounts: CategoryWithCount[];
  services: MenuService[];
  variants: ServiceVariant[];
  packages: ServicePackage[];
  addOnGroups: AddOnGroup[];
  addOnGroupsWithOptions: AddOnGroupWithOptions[];
  addOnOptions: AddOnOption[];
  settings: CatalogSettings | null;

  // UI State
  ui: {
    activeTab: CatalogTab;
    selectedCategoryId: string | null;
    searchQuery: string;
    viewMode: CatalogViewMode;
    showInactive: boolean;
    expandedCategories: string[];
  };

  // Loading states
  loading: boolean;
  error: string | null;
}

const initialState: CatalogState = {
  categories: [],
  categoriesWithCounts: [],
  services: [],
  variants: [],
  packages: [],
  addOnGroups: [],
  addOnGroupsWithOptions: [],
  addOnOptions: [],
  settings: null,

  ui: {
    activeTab: 'categories',
    selectedCategoryId: null,
    searchQuery: '',
    viewMode: 'grid',
    showInactive: false,
    expandedCategories: [],
  },

  loading: false,
  error: null,
};

// ==================== ASYNC THUNKS ====================

// Categories
export const fetchCategories = createAsyncThunk(
  'catalog/fetchCategories',
  async ({ storeId, includeInactive = false }: { storeId: string; includeInactive?: boolean }) => {
    return await serviceCategoriesDB.getAll(storeId, includeInactive);
  }
);

export const fetchCategoriesWithCounts = createAsyncThunk(
  'catalog/fetchCategoriesWithCounts',
  async ({ storeId, includeInactive = false }: { storeId: string; includeInactive?: boolean }) => {
    return await serviceCategoriesDB.getWithCounts(storeId, includeInactive);
  }
);

export const createCategory = createAsyncThunk(
  'catalog/createCategory',
  async ({ input, userId, storeId }: { input: CreateCategoryInput; userId: string; storeId: string }) => {
    return await serviceCategoriesDB.create(input, userId, storeId);
  }
);

export const updateCategory = createAsyncThunk(
  'catalog/updateCategory',
  async ({ id, updates, userId }: { id: string; updates: Partial<ServiceCategory>; userId: string }) => {
    return await serviceCategoriesDB.update(id, updates, userId);
  }
);

export const deleteCategory = createAsyncThunk(
  'catalog/deleteCategory',
  async (id: string) => {
    await serviceCategoriesDB.delete(id);
    return id;
  }
);

export const reorderCategories = createAsyncThunk(
  'catalog/reorderCategories',
  async ({ storeId, orderedIds, userId }: { storeId: string; orderedIds: string[]; userId: string }) => {
    await serviceCategoriesDB.reorder(storeId, orderedIds, userId);
    return orderedIds;
  }
);

// Services
export const fetchServices = createAsyncThunk(
  'catalog/fetchServices',
  async ({ storeId, includeInactive = false }: { storeId: string; includeInactive?: boolean }) => {
    return await menuServicesDB.getAll(storeId, includeInactive);
  }
);

export const fetchServicesByCategory = createAsyncThunk(
  'catalog/fetchServicesByCategory',
  async ({ storeId, categoryId, includeInactive = false }: { storeId: string; categoryId: string; includeInactive?: boolean }) => {
    return await menuServicesDB.getByCategory(storeId, categoryId, includeInactive);
  }
);

export const createService = createAsyncThunk(
  'catalog/createService',
  async ({ input, userId, storeId }: { input: CreateMenuServiceInput; userId: string; storeId: string }) => {
    return await menuServicesDB.create(input, userId, storeId);
  }
);

export const updateService = createAsyncThunk(
  'catalog/updateService',
  async ({ id, updates, userId }: { id: string; updates: Partial<MenuService>; userId: string }) => {
    return await menuServicesDB.update(id, updates, userId);
  }
);

export const deleteService = createAsyncThunk(
  'catalog/deleteService',
  async (id: string) => {
    await menuServicesDB.delete(id);
    return id;
  }
);

export const archiveService = createAsyncThunk(
  'catalog/archiveService',
  async ({ id, userId }: { id: string; userId: string }) => {
    return await menuServicesDB.archive(id, userId);
  }
);

// Variants
export const fetchVariants = createAsyncThunk(
  'catalog/fetchVariants',
  async ({ serviceId, includeInactive = false }: { serviceId: string; includeInactive?: boolean }) => {
    return await serviceVariantsDB.getByService(serviceId, includeInactive);
  }
);

export const createVariant = createAsyncThunk(
  'catalog/createVariant',
  async ({ input, storeId }: { input: CreateVariantInput; storeId: string }) => {
    return await serviceVariantsDB.create(input, storeId);
  }
);

export const updateVariant = createAsyncThunk(
  'catalog/updateVariant',
  async ({ id, updates }: { id: string; updates: Partial<ServiceVariant> }) => {
    return await serviceVariantsDB.update(id, updates);
  }
);

export const deleteVariant = createAsyncThunk(
  'catalog/deleteVariant',
  async (id: string) => {
    await serviceVariantsDB.delete(id);
    return id;
  }
);

// Packages
export const fetchPackages = createAsyncThunk(
  'catalog/fetchPackages',
  async ({ storeId, includeInactive = false }: { storeId: string; includeInactive?: boolean }) => {
    return await servicePackagesDB.getAll(storeId, includeInactive);
  }
);

export const createPackage = createAsyncThunk(
  'catalog/createPackage',
  async ({ input, userId, storeId }: { input: CreatePackageInput; userId: string; storeId: string }) => {
    return await servicePackagesDB.create(input, userId, storeId);
  }
);

export const updatePackage = createAsyncThunk(
  'catalog/updatePackage',
  async ({ id, updates, userId }: { id: string; updates: Partial<ServicePackage>; userId: string }) => {
    return await servicePackagesDB.update(id, updates, userId);
  }
);

export const deletePackage = createAsyncThunk(
  'catalog/deletePackage',
  async (id: string) => {
    await servicePackagesDB.delete(id);
    return id;
  }
);

// Add-on Groups
export const fetchAddOnGroups = createAsyncThunk(
  'catalog/fetchAddOnGroups',
  async ({ storeId, includeInactive = false }: { storeId: string; includeInactive?: boolean }) => {
    return await addOnGroupsDB.getAll(storeId, includeInactive);
  }
);

export const fetchAddOnGroupsWithOptions = createAsyncThunk(
  'catalog/fetchAddOnGroupsWithOptions',
  async ({ storeId, includeInactive = false }: { storeId: string; includeInactive?: boolean }) => {
    return await addOnGroupsDB.getAllWithOptions(storeId, includeInactive);
  }
);

export const createAddOnGroup = createAsyncThunk(
  'catalog/createAddOnGroup',
  async ({ input, storeId }: { input: CreateAddOnGroupInput; storeId: string }) => {
    return await addOnGroupsDB.create(input, storeId);
  }
);

export const updateAddOnGroup = createAsyncThunk(
  'catalog/updateAddOnGroup',
  async ({ id, updates }: { id: string; updates: Partial<AddOnGroup> }) => {
    return await addOnGroupsDB.update(id, updates);
  }
);

export const deleteAddOnGroup = createAsyncThunk(
  'catalog/deleteAddOnGroup',
  async (id: string) => {
    await addOnGroupsDB.delete(id);
    return id;
  }
);

// Add-on Options
export const createAddOnOption = createAsyncThunk(
  'catalog/createAddOnOption',
  async ({ input, storeId }: { input: CreateAddOnOptionInput; storeId: string }) => {
    return await addOnOptionsDB.create(input, storeId);
  }
);

export const updateAddOnOption = createAsyncThunk(
  'catalog/updateAddOnOption',
  async ({ id, updates }: { id: string; updates: Partial<AddOnOption> }) => {
    return await addOnOptionsDB.update(id, updates);
  }
);

export const deleteAddOnOption = createAsyncThunk(
  'catalog/deleteAddOnOption',
  async (id: string) => {
    await addOnOptionsDB.delete(id);
    return id;
  }
);

// Settings
export const fetchCatalogSettings = createAsyncThunk(
  'catalog/fetchSettings',
  async (storeId: string) => {
    return await catalogSettingsDB.getOrCreate(storeId);
  }
);

export const updateCatalogSettings = createAsyncThunk(
  'catalog/updateSettings',
  async ({ storeId, updates }: { storeId: string; updates: Partial<CatalogSettings> }) => {
    return await catalogSettingsDB.update(storeId, updates);
  }
);

// ==================== SLICE ====================

const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    // UI Actions
    setActiveTab: (state, action: PayloadAction<CatalogTab>) => {
      state.ui.activeTab = action.payload;
    },
    setSelectedCategory: (state, action: PayloadAction<string | null>) => {
      state.ui.selectedCategoryId = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.ui.searchQuery = action.payload;
    },
    setViewMode: (state, action: PayloadAction<CatalogViewMode>) => {
      state.ui.viewMode = action.payload;
    },
    setShowInactive: (state, action: PayloadAction<boolean>) => {
      state.ui.showInactive = action.payload;
    },
    toggleCategoryExpanded: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const index = state.ui.expandedCategories.indexOf(id);
      if (index === -1) {
        state.ui.expandedCategories.push(id);
      } else {
        state.ui.expandedCategories.splice(index, 1);
      }
    },
    setExpandedCategories: (state, action: PayloadAction<string[]>) => {
      state.ui.expandedCategories = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },

    // Direct data setters (for live query sync)
    setCategories: (state, action: PayloadAction<ServiceCategory[]>) => {
      state.categories = action.payload;
    },
    setCategoriesWithCounts: (state, action: PayloadAction<CategoryWithCount[]>) => {
      state.categoriesWithCounts = action.payload;
    },
    setServices: (state, action: PayloadAction<MenuService[]>) => {
      state.services = action.payload;
    },
    setVariants: (state, action: PayloadAction<ServiceVariant[]>) => {
      state.variants = action.payload;
    },
    setPackages: (state, action: PayloadAction<ServicePackage[]>) => {
      state.packages = action.payload;
    },
    setAddOnGroups: (state, action: PayloadAction<AddOnGroup[]>) => {
      state.addOnGroups = action.payload;
    },
    setAddOnGroupsWithOptions: (state, action: PayloadAction<AddOnGroupWithOptions[]>) => {
      state.addOnGroupsWithOptions = action.payload;
    },
    setAddOnOptions: (state, action: PayloadAction<AddOnOption[]>) => {
      state.addOnOptions = action.payload;
    },
    setSettings: (state, action: PayloadAction<CatalogSettings | null>) => {
      state.settings = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Categories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch categories';
      })
      .addCase(fetchCategoriesWithCounts.fulfilled, (state, action) => {
        state.categoriesWithCounts = action.payload;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload);
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.categories.findIndex(c => c.id === action.payload!.id);
          if (index !== -1) state.categories[index] = action.payload;
        }
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter(c => c.id !== action.payload);
      })

      // Services
      .addCase(fetchServices.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.loading = false;
        state.services = action.payload;
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch services';
      })
      .addCase(fetchServicesByCategory.fulfilled, (state, action) => {
        // Merge services from this category
        const categoryServices = action.payload;
        const otherServices = state.services.filter(
          s => !categoryServices.some(cs => cs.id === s.id)
        );
        state.services = [...otherServices, ...categoryServices];
      })
      .addCase(createService.fulfilled, (state, action) => {
        state.services.push(action.payload);
      })
      .addCase(updateService.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.services.findIndex(s => s.id === action.payload!.id);
          if (index !== -1) state.services[index] = action.payload;
        }
      })
      .addCase(deleteService.fulfilled, (state, action) => {
        state.services = state.services.filter(s => s.id !== action.payload);
      })
      .addCase(archiveService.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.services.findIndex(s => s.id === action.payload!.id);
          if (index !== -1) state.services[index] = action.payload;
        }
      })

      // Variants
      .addCase(fetchVariants.fulfilled, (state, action) => {
        state.variants = action.payload;
      })
      .addCase(createVariant.fulfilled, (state, action) => {
        state.variants.push(action.payload);
      })
      .addCase(updateVariant.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.variants.findIndex(v => v.id === action.payload!.id);
          if (index !== -1) state.variants[index] = action.payload;
        }
      })
      .addCase(deleteVariant.fulfilled, (state, action) => {
        state.variants = state.variants.filter(v => v.id !== action.payload);
      })

      // Packages
      .addCase(fetchPackages.fulfilled, (state, action) => {
        state.packages = action.payload;
      })
      .addCase(createPackage.fulfilled, (state, action) => {
        state.packages.push(action.payload);
      })
      .addCase(updatePackage.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.packages.findIndex(p => p.id === action.payload!.id);
          if (index !== -1) state.packages[index] = action.payload;
        }
      })
      .addCase(deletePackage.fulfilled, (state, action) => {
        state.packages = state.packages.filter(p => p.id !== action.payload);
      })

      // Add-on Groups
      .addCase(fetchAddOnGroups.fulfilled, (state, action) => {
        state.addOnGroups = action.payload;
      })
      .addCase(fetchAddOnGroupsWithOptions.fulfilled, (state, action) => {
        state.addOnGroupsWithOptions = action.payload;
      })
      .addCase(createAddOnGroup.fulfilled, (state, action) => {
        state.addOnGroups.push(action.payload);
      })
      .addCase(updateAddOnGroup.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.addOnGroups.findIndex(g => g.id === action.payload!.id);
          if (index !== -1) state.addOnGroups[index] = action.payload;
        }
      })
      .addCase(deleteAddOnGroup.fulfilled, (state, action) => {
        state.addOnGroups = state.addOnGroups.filter(g => g.id !== action.payload);
      })

      // Add-on Options
      .addCase(createAddOnOption.fulfilled, (state, action) => {
        state.addOnOptions.push(action.payload);
      })
      .addCase(updateAddOnOption.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.addOnOptions.findIndex(o => o.id === action.payload!.id);
          if (index !== -1) state.addOnOptions[index] = action.payload;
        }
      })
      .addCase(deleteAddOnOption.fulfilled, (state, action) => {
        state.addOnOptions = state.addOnOptions.filter(o => o.id !== action.payload);
      })

      // Settings
      .addCase(fetchCatalogSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      })
      .addCase(updateCatalogSettings.fulfilled, (state, action) => {
        if (action.payload) {
          state.settings = action.payload;
        }
      });
  },
});

// ==================== EXPORTS ====================

export const {
  setActiveTab,
  setSelectedCategory,
  setSearchQuery,
  setViewMode,
  setShowInactive,
  toggleCategoryExpanded,
  setExpandedCategories,
  clearError,
  setCategories,
  setCategoriesWithCounts,
  setServices,
  setVariants,
  setPackages,
  setAddOnGroups,
  setAddOnGroupsWithOptions,
  setAddOnOptions,
  setSettings,
} = catalogSlice.actions;

// ============================================
// SELECTORS - DEPRECATED
// ============================================
// These selectors are no longer functional since catalog was removed from Redux.
// Use the useCatalog hook from src/hooks/useCatalog.ts instead.
// Keeping the reducer export for backward compatibility during migration.

export default catalogSlice.reducer;
