# 🚀 Quick Migration Instructions

**How to reorganize your existing codebase into Mango POS Offline V1**

---

## ⚡ Quick Start

### Option 1: Manual Migration (Recommended)

Follow the detailed guides:
1. **[Code Organization Guide](./docs/CODE_ORGANIZATION.md)** - See where everything goes
2. **[Migration Guide](./docs/MIGRATION_GUIDE.md)** - Step-by-step instructions

### Option 2: Gradual Migration

1. **Keep existing codebase working**
2. **Create new structure** (already done ✅)
3. **Gradually move features** one at a time
4. **Test each feature** after moving

---

## 📋 Migration Checklist

### Core Setup ✅
- [x] New folder structure created
- [x] Configuration files created
- [x] Documentation created

### Next Steps
- [ ] Copy core systems (database, API, store)
- [ ] Organize features (appointments, tickets, staff, etc.)
- [ ] Organize shared code (components, hooks, utils)
- [ ] Update all imports
- [ ] Test everything
- [ ] Update documentation

---

## 🗺️ Migration Map

| Old Location | New Location |
|-------------|--------------|
| `src/db/` | `client/src/core/db/` |
| `src/api/` | `client/src/core/api/` |
| `src/store/index.ts` | `client/src/core/store/` |
| `src/store/slices/appointmentsSlice.ts` | `client/src/features/appointments/store/` |
| `src/store/slices/ticketsSlice.ts` | `client/src/features/tickets/store/` |
| `src/store/slices/staffSlice.ts` | `client/src/features/staff/store/` |
| `src/components/Book/*` | `client/src/features/appointments/components/` |
| `src/components/TurnTracker/*` | `client/src/features/tickets/components/TurnTracker/` |
| `src/components/StaffManagement/*` | `client/src/features/staff/components/StaffManagement/` |
| `src/components/layout/*` | `client/src/shared/components/layout/` |
| `src/types/Ticket.ts` | `client/src/features/tickets/types.ts` |
| `src/types/appointment.ts` | `client/src/features/appointments/types.ts` |
| `src/hooks/useSync.ts` | `client/src/shared/hooks/useSync.ts` |

---

## 📖 Detailed Guides

- **[Getting Started](./docs/GETTING_STARTED.md)** - Initial setup
- **[Setup Instructions](./docs/SETUP_INSTRUCTIONS.md)** - Complete setup guide
- **[Architecture](./docs/ARCHITECTURE.md)** - System architecture
- **[Development](./docs/DEVELOPMENT.md)** - Development workflow
- **[Code Organization](./docs/CODE_ORGANIZATION.md)** - File organization
- **[Migration Guide](./docs/MIGRATION_GUIDE.md)** - Migration steps

---

## 🎯 Key Principles

1. **Feature-Based** - Code organized by feature
2. **Self-Contained** - Features include their dependencies
3. **Shared Code** - Reusable code in `shared/`
4. **Core Systems** - Infrastructure in `core/`

---

## 🚀 Ready to Start?

1. Review [Code Organization Guide](./docs/CODE_ORGANIZATION.md)
2. Follow [Migration Guide](./docs/MIGRATION_GUIDE.md)
3. Test after each migration step
4. Update documentation as you go

---

**Good luck with your migration! 🎉**

