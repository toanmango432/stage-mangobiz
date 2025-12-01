# Team Module - Phase 1 Implementation Plan

## Overview
Implement Redux integration and IndexedDB persistence for the Team Settings module.

## Current State
- Team Settings UI exists with 7 sections (Profile, Services, Schedule, Permissions, Commission, Online Booking, Notifications)
- Comprehensive types defined in `src/components/team-settings/types.ts`
- Basic `Staff` type and `staffSlice` exist but are minimal
- UI currently uses local state (mock data) - needs Redux connection

## Phase 1 Tasks

### 1. Update Types
- [ ] 1.1 Create `src/types/teamSettings.ts` - move/consolidate team settings types
- [ ] 1.2 Update `src/types/index.ts` to export new types

### 2. Update IndexedDB Schema
- [ ] 2.1 Add `teamMemberSettings` table to `src/db/schema.ts`
- [ ] 2.2 Bump database version with migration

### 3. Create Database Operations
- [ ] 3.1 Add `teamSettingsDB` operations to `src/db/database.ts`
  - getAll, getById, create, update, delete
  - getByStatus (active/inactive/archived)

### 4. Create Redux Slice
- [ ] 4.1 Create `src/store/slices/teamSettingsSlice.ts`
  - State: members, ui state, loading, error
  - Actions: CRUD for team members
  - Actions: Update individual sections (profile, permissions, etc.)
  - Selectors: getAllMembers, getActiveMember, getMemberById

### 5. Create Async Thunks
- [ ] 5.1 Add thunks to teamSettingsSlice
  - fetchAllTeamMembers
  - fetchTeamMemberById
  - createTeamMember
  - updateTeamMember
  - updateTeamMemberSection (profile, permissions, etc.)
  - archiveTeamMember
  - deleteTeamMember

### 6. Update Store Configuration
- [ ] 6.1 Add teamSettings reducer to `src/store/index.ts`

### 7. Create Custom Hooks
- [ ] 7.1 Create `src/hooks/useTeamSettings.ts`
  - useTeamMembers() - list all members
  - useTeamMember(id) - single member
  - useTeamMemberActions() - CRUD operations

### 8. Connect UI to Redux
- [ ] 8.1 Update `TeamSettings.tsx` - use Redux instead of local state
- [ ] 8.2 Update `TeamMemberList.tsx` - connect to Redux
- [ ] 8.3 Update section components to dispatch Redux actions
  - ProfileSection
  - ServicesSection
  - ScheduleSection
  - PermissionsSection
  - CommissionSection
  - OnlineBookingSection
  - NotificationsSection

### 9. Seed Data
- [ ] 9.1 Update `src/db/seed.ts` with sample team members

### 10. Testing
- [ ] 10.1 Test CRUD operations
- [ ] 10.2 Test offline persistence
- [ ] 10.3 Test UI updates on state changes

## Dependencies
- Existing staff module (will be extended, not replaced)
- Services module (for service assignment)

## Files to Create
1. `src/types/teamSettings.ts`
2. `src/store/slices/teamSettingsSlice.ts`
3. `src/hooks/useTeamSettings.ts`

## Files to Modify
1. `src/db/schema.ts` - add teamMemberSettings table
2. `src/db/database.ts` - add teamSettingsDB operations
3. `src/store/index.ts` - add reducer
4. `src/types/index.ts` - export types
5. `src/components/team-settings/TeamSettings.tsx` - Redux connection
6. `src/components/team-settings/components/TeamMemberList.tsx` - Redux connection
7. `src/db/seed.ts` - sample data

## Review
_To be filled after implementation_
