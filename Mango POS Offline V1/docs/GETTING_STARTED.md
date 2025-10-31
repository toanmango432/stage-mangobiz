# 🚀 Getting Started Guide

Complete setup instructions for Mango POS Offline V1.

---

## 📋 Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
   - Download: [https://nodejs.org/](https://nodejs.org/)
   - Verify: `node --version`

2. **npm** (comes with Node.js)
   - Verify: `npm --version`

3. **Git**
   - Download: [https://git-scm.com/](https://git-scm.com/)
   - Verify: `git --version`

### Recommended Tools

- **VS Code** - Code editor
- **Postman** - API testing
- **Docker** - For local database (optional)

---

## 🔧 Initial Setup

### Step 1: Install Dependencies

```bash
# Install client dependencies
cd "Mango POS Offline V1/client"
npm install

# Install server dependencies
cd ../server
npm install
```

### Step 2: Environment Configuration

#### Client Environment

Create `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=Mango POS Offline V1
VITE_ENVIRONMENT=development
VITE_SOCKET_URL=http://localhost:3000
```

#### Server Environment

Create `server/.env`:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/mango_pos
# Or for SQL Server:
# DATABASE_URL="sqlserver://localhost:1433;database=mango_pos;user=sa;password=YourPassword"

# Server
PORT=3000
NODE_ENV=development

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Sync
SYNC_INTERVAL=30000

# Logging
LOG_LEVEL=debug
```

### Step 3: Database Setup

#### Option A: PostgreSQL (Recommended)

```bash
# Install PostgreSQL locally or use Docker
docker run --name mango-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=mango_pos \
  -p 5432:5432 \
  -d postgres:15

# Run migrations
cd server
npm run db:migrate

# Seed database (optional)
npm run db:seed
```

#### Option B: SQL Server

```bash
# Install SQL Server locally or use Docker
docker run --name mango-sqlserver \
  -e "ACCEPT_EULA=Y" \
  -e "SA_PASSWORD=YourStrong@Passw0rd" \
  -p 1433:1433 \
  -d mcr.microsoft.com/mssql/server:2022-latest

# Update DATABASE_URL in .env
# Run migrations
cd server
npm run db:migrate
```

### Step 4: Start Development Servers

#### Terminal 1: Frontend

```bash
cd "Mango POS Offline V1/client"
npm run dev
```

Frontend will be available at: `http://localhost:5173`

#### Terminal 2: Backend

```bash
cd "Mango POS Offline V1/server"
npm run dev
```

Backend API will be available at: `http://localhost:3000`

---

## ✅ Verification

### Test Frontend

1. Open browser to `http://localhost:5173`
2. You should see the Mango POS login/app interface
3. Check browser console for any errors

### Test Backend

1. Open browser/Postman to `http://localhost:3000/api/health`
2. Should return: `{ "status": "ok" }`

### Test Database Connection

```bash
cd server
npm run db:test
```

---

## 🔍 Common Issues

### Issue: Port Already in Use

**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or change PORT in .env
```

### Issue: Database Connection Failed

**Solutions:**
1. Verify database is running
2. Check DATABASE_URL in `.env`
3. Verify credentials are correct
4. Check firewall/network settings

### Issue: Module Not Found

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: TypeScript Errors

**Solution:**
```bash
# Regenerate types
npm run build
```

---

## 📚 Next Steps

1. Read [Architecture Overview](./ARCHITECTURE.md)
2. Review [Development Guide](./DEVELOPMENT.md)
3. Check [API Documentation](./API.md)
4. Explore the codebase structure

---

## 🆘 Need Help?

- Check [Known Issues](./KNOWN_ISSUES.md)
- Review documentation in `docs/`
- Create an issue in the repository

---

**Happy Coding! 🎉**

