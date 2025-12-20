# FrontDeskSettings.tsx Refactoring Plan

## Goal
Split the 678-line FrontDeskSettings.tsx into smaller, focused components for better maintainability and testability.

## Analysis

### Current Structure
The FrontDeskSettings.tsx component currently handles:
1. **State Management**: Redux integration, local UI state, dialog states
2. **Desktop Navigation**: Sidebar with 5 sections (lines 406-457)
3. **Mobile Navigation**: Accordion-style navigation for compact view (lines 318-401)
4. **Content Rendering**: Conditionally renders section components based on active section (lines 460-513)
5. **Dialog Management**: Import confirmation dialog (lines 617-643), Reset confirmation dialog (lines 646-671)
6. **Import/Export Logic**: File handling, validation, export generation (lines 126-206)
7. **Focus Trap & Keyboard Handling**: Accessibility features (lines 207-232)
8. **Footer Actions**: Reset, Export, Import, Cancel, Save buttons (lines 519-590)

### Proposed Component Structure

#### 1. **SettingsNavigation.tsx** (~80 lines)
- Desktop sidebar navigation
- Navigation items configuration
- Active section indicator
- Clean interface for section management

#### 2. **SettingsMobileAccordion.tsx** (~100 lines)
- Mobile accordion-style navigation
- Section expansion/collapse logic
- Wraps section components with error boundaries
- Responsive to screen size

#### 3. **SettingsContent.tsx** (~90 lines)
- Main content area for desktop view
- Conditionally renders active section
- Error boundary wrapping
- Clean separation from navigation

#### 4. **SettingsDialogs.tsx** (~120 lines)
- Import confirmation dialog
- Reset confirmation dialog
- Reusable dialog component structure
- Portal rendering

#### 5. **SettingsFooter.tsx** (~80 lines)
- Reset, Export, Import buttons
- Cancel and Save buttons
- Unsaved changes indicator
- Action handlers passed as props

#### 6. **FrontDeskSettings.tsx** (~250 lines)
- Main orchestrator component
- Redux state management
- Import/Export logic
- Keyboard and focus management
- Template setup modal
- Composes all sub-components

## Tasks

### Phase 1: Create Supporting Components
- [ ] Create `SettingsFooter.tsx` - Footer with action buttons
- [ ] Create `SettingsDialogs.tsx` - Confirmation dialogs
- [ ] Create `SettingsNavigation.tsx` - Desktop sidebar navigation
- [ ] Create `SettingsMobileAccordion.tsx` - Mobile accordion view
- [ ] Create `SettingsContent.tsx` - Desktop content area

### Phase 2: Refactor Main Component
- [ ] Refactor `FrontDeskSettings.tsx` to use new sub-components
- [ ] Extract import/export logic into custom hook or utilities if needed
- [ ] Verify all functionality is preserved
- [ ] Test responsive behavior (desktop and mobile views)

### Phase 3: Testing & Validation
- [ ] Test desktop navigation and section switching
- [ ] Test mobile accordion view
- [ ] Test import/export functionality
- [ ] Test reset confirmation
- [ ] Test keyboard navigation and focus trap
- [ ] Verify Redux integration works correctly
- [ ] Check for any TypeScript errors

## Design Principles

1. **Single Responsibility**: Each component handles one specific concern
2. **Props Interface**: Clean, typed interfaces for all components
3. **Reusability**: Components can be tested and modified independently
4. **Maintainability**: Logical grouping makes future changes easier
5. **No Breaking Changes**: External API of FrontDeskSettings remains the same

## Expected Benefits

- **Reduced Complexity**: Main component goes from 678 to ~250 lines
- **Better Testing**: Each component can be unit tested independently
- **Improved Readability**: Clear separation of concerns
- **Easier Maintenance**: Changes to navigation don't affect dialogs, etc.
- **Better Type Safety**: Smaller components have more focused prop types

---

## Review Section
(To be filled after implementation)
