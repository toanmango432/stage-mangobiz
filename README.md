# Mango Offline POS Winsurf V1

**Version:** 2.0.0  
**Status:** Active Development  
**Last Updated:** December 1, 2025

Offline-first salon management system with real-time synchronization capabilities.

## Features

- ✅ **Book Module** - Complete appointment calendar with IndexedDB integration
- ✅ **Front Desk** - Operations command center with ticket management
- ✅ **Offline-First** - Full functionality without internet connection
- ✅ **Smart Booking** - AI-powered staff assignment and conflict detection
- ✅ **Redux + IndexedDB** - Robust state management and data persistence
- ✅ **Mobile Responsive** - Optimized for tablets and phones

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS
- **State:** Redux Toolkit
- **Database:** IndexedDB (Dexie.js)
- **UI Components:** Lucide React Icons
- **Testing:** Vitest + Testing Library

## Getting Started

### Prerequisites
- Node.js v20+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Development

See [Workflow Guide](./docs/guides/WORKFLOW_GUIDE.md) for AI-assisted development workflow.

## Documentation

📚 **[Documentation Index](./docs/INDEX.md)** - Complete documentation navigation

### Quick Links

| Category | Key Documents |
|----------|---------------|
| **Architecture** | [Technical Documentation](./docs/architecture/TECHNICAL_DOCUMENTATION.md) • [Data Storage Strategy](./docs/architecture/DATA_STORAGE_STRATEGY.md) |
| **Product** | [PRD v1](./docs/product/Mango%20POS%20PRD%20v1.md) • [Feature Gap Analysis](./docs/product/FEATURE_GAP_ANALYSIS.md) |
| **Guides** | [Workflow Guide](./docs/guides/WORKFLOW_GUIDE.md) • [Deployment](./docs/guides/DEPLOYMENT_INSTRUCTIONS.md) |
| **Modules** | [Book](./docs/modules/book/) • [Front Desk](./docs/modules/frontdesk/) • [Tickets](./docs/modules/tickets/) |

## Project Status

**Completed:**
- ✅ IndexedDB integration
- ✅ Database seeding
- ✅ Customer search
- ✅ Service selection
- ✅ Appointment creation
- ✅ Smart booking features

**In Progress:**
- 🔄 Testing & QA
- 🔄 Edit appointment
- 🔄 Status management

**Planned:**
- ⏳ Drag & drop rescheduling
- ⏳ Backend API integration
- ⏳ Multi-device sync

---

**Built with Windsurf & Cursor AI**
