# Mango POS Offline V1

Complete salon management system with offline-first architecture.

## Project Structure

```
Mango POS Offline V1/
├── client/           # Frontend React application
├── server/           # Backend Node.js/Express API (to be implemented)
├── shared/           # Shared types, utilities, constants
├── docs/             # Documentation
└── config/           # Configuration files
```

## Quick Start

### Client (Frontend)

```bash
cd client
npm install
npm run dev
```

Visit `http://localhost:5173`

### Building

```bash
cd client
npm run build
```

## Features

✅ **Complete Frontend Application**
- All modules implemented and working
- Offline-first architecture
- IndexedDB for local storage
- Redux Toolkit for state management
- Real-time updates via Socket.io

✅ **Core Modules**
- 📅 Book: Appointment scheduling
- 🏢 Front Desk: Main operations dashboard  
- 🎫 Tickets: Queue management
- 👥 Team: Staff management
- 💰 Pending: Checkout queue
- 💳 Checkout: Payment processing
- 📊 Transactions: History and reporting
- ⚙️ More: Settings and admin

✅ **Infrastructure**
- TypeScript throughout
- Tailwind CSS styling
- Vite build system
- Comprehensive error handling
- Automatic data seeding

## Status

**Frontend**: ✅ Complete and Working
- All components migrated
- All features functional
- Build succeeds
- No TypeScript errors

**Backend**: 🚧 To be implemented
- API endpoints
- Database schema
- Authentication
- Sync service

## Next Steps

1. Implement backend API
2. Add authentication
3. Implement sync service
4. Add comprehensive testing
5. Deploy to production

## Documentation

See `/docs` folder for detailed documentation:
- `ARCHITECTURE.md` - System architecture
- `GETTING_STARTED.md` - Setup instructions
- `CODE_ORGANIZATION.md` - Code structure
- `MIGRATION_GUIDE.md` - Migration from old structure

## License

Private - Mango POS System
