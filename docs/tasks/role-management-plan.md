# Role Management Module
## Implementation Plan

> **Date:** 2025-12-01
> **Status:** Planning

---

## Problem Statement

Currently, the Team Settings module has:
- **14 hardcoded roles** in `types.ts` as a union type
- **Role labels** in `constants.ts` as static mappings
- **Role default permissions** in `PermissionsSection.tsx`
- **No UI to customize roles** - salon owners cannot:
  - Create custom roles
  - Edit role names/descriptions
  - Configure default permissions per role
  - Delete unused roles

---

## Proposed Solution

Create a **Role Management** settings page that allows:

1. **View all roles** with their default permissions
2. **Create custom roles** with custom names and permissions
3. **Edit existing roles** (name, description, color, default permissions)
4. **Delete custom roles** (with reassignment of members)
5. **System roles protection** (owner, manager cannot be deleted)

---

## Architecture Options

### Option A: Separate Settings Module (Recommended)

Create a new top-level settings page at `/settings/roles` or as a tab within Business Settings.

**Pros:**
- Clean separation of concerns
- Role management is a business-level setting, not team member specific
- Can be accessed by owners/admins from main settings

**Cons:**
- New navigation item needed

### Option B: Add Tab to Team Settings

Add "Roles" as another tab in Team Settings alongside Profile, Services, etc.

**Pros:**
- Keeps team-related settings together
- No new navigation

**Cons:**
- Tab would show when any member selected (awkward UX)
- Role management is business-wide, not per-member

### Recommendation: **Option A** - Separate module in Business Settings

---

## Data Model

### New Type: `RoleDefinition`

```typescript
interface RoleDefinition {
  id: string;                    // Unique ID (e.g., 'owner', 'manager', 'custom_123')
  name: string;                  // Display name (e.g., 'Senior Stylist')
  description: string;           // Role description
  color: {                       // Visual theming
    bg: string;
    text: string;
  };
  isSystem: boolean;             // true for built-in roles (owner, manager)
  isDefault: boolean;            // Default role for new members
  defaultPermissions: {          // Quick access defaults
    canAccessAdminPortal: boolean;
    canAccessReports: boolean;
    canModifyPrices: boolean;
    canProcessRefunds: boolean;
    canDeleteRecords: boolean;
    canManageTeam: boolean;
    canViewOthersCalendar: boolean;
    canBookForOthers: boolean;
    canEditOthersAppointments: boolean;
  };
  detailedPermissions: Permission[]; // 17 detailed permissions
  createdAt: string;
  updatedAt: string;
}
```

### Migration Strategy

1. **Keep existing `StaffRole` type** for backwards compatibility
2. **Add dynamic role support** by allowing `string` type alongside predefined roles
3. **Store roles in IndexedDB** with default system roles seeded on first load
4. **Update team members** to reference role by ID

---

## UI Components

### 1. RoleSettings.tsx (Main Container)
- Role list with add button
- Selected role editor
- Similar layout to Team Settings (list + detail)

### 2. RoleList.tsx
- List of all roles (system + custom)
- Search/filter
- System badge for built-in roles
- Member count per role

### 3. RoleEditor.tsx
- Role name input
- Description textarea
- Color picker
- Quick access permission toggles
- Detailed permissions grid
- Delete button (for custom roles)

### 4. DeleteRoleModal.tsx
- Warning about members with this role
- Reassignment dropdown
- Confirmation

---

## Implementation Tasks

### Phase 1: Types & Data Layer
- [ ] Add `RoleDefinition` interface to types.ts
- [ ] Create `roleSlice.ts` for Redux state
- [ ] Add role operations to database.ts
- [ ] Seed default roles on first load

### Phase 2: UI Components
- [ ] Create `RoleSettings.tsx` main container
- [ ] Create `RoleList.tsx` component
- [ ] Create `RoleEditor.tsx` with permissions UI
- [ ] Create `DeleteRoleModal.tsx`

### Phase 3: Integration
- [ ] Update `PermissionsSection.tsx` to use dynamic roles
- [ ] Update `TeamMemberList.tsx` filter to use dynamic roles
- [ ] Update `AddTeamMember.tsx` role selection
- [ ] Add navigation link from Business Settings

### Phase 4: Testing
- [ ] Test role CRUD operations
- [ ] Test member reassignment on role delete
- [ ] Test backwards compatibility

---

## Default System Roles

| Role | System? | Deletable? | Description |
|------|---------|------------|-------------|
| Owner | Yes | No | Full access to all features |
| Manager | Yes | No | Manage team and operations |
| Senior Stylist | No | Yes | Experienced stylist with reports |
| Stylist | No | Yes | Standard service provider |
| Junior Stylist | No | Yes | Entry-level stylist |
| Apprentice | No | Yes | Training position |
| Receptionist | No | Yes | Front desk operations |
| Assistant | No | Yes | Support role |
| Nail Technician | No | Yes | Nail services specialist |
| Esthetician | No | Yes | Skin care specialist |
| Massage Therapist | No | Yes | Massage services |
| Barber | No | Yes | Barbering specialist |
| Colorist | No | Yes | Hair color specialist |
| Makeup Artist | No | Yes | Makeup services |

---

## Files to Create/Modify

### New Files:
- `src/components/role-settings/RoleSettings.tsx`
- `src/components/role-settings/RoleList.tsx`
- `src/components/role-settings/RoleEditor.tsx`
- `src/components/role-settings/DeleteRoleModal.tsx`
- `src/components/role-settings/types.ts`
- `src/components/role-settings/constants.ts`
- `src/store/slices/roleSlice.ts`
- `src/db/roleOperations.ts`

### Modified Files:
- `src/components/team-settings/types.ts` - Allow dynamic role IDs
- `src/components/team-settings/constants.ts` - Remove hardcoded roles
- `src/components/team-settings/sections/PermissionsSection.tsx` - Use dynamic roles
- `src/components/team-settings/components/TeamMemberList.tsx` - Dynamic filter
- `src/components/team-settings/components/AddTeamMember.tsx` - Dynamic selection

---

## Estimated Effort

| Phase | Tasks | Complexity |
|-------|-------|------------|
| Phase 1 | Types & Data | Medium |
| Phase 2 | UI Components | High |
| Phase 3 | Integration | Medium |
| Phase 4 | Testing | Low |

**Total:** ~600-800 lines of new code

---

## Questions for User

1. Should roles be business-level (shared across locations) or location-specific?
2. Do you want preset "templates" for common salon roles?
3. Should there be a "role hierarchy" for permission inheritance?
4. Where should Role Management be accessed from (Business Settings, Team Settings header, etc.)?

---

*Plan Date: 2025-12-01*
