# 🚀 Complete Setup Instructions

**Mango POS Offline V1 - Production-Ready Setup Guide**

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Database Setup](#database-setup)
4. [Environment Configuration](#environment-configuration)
5. [Installation](#installation)
6. [Development Setup](#development-setup)
7. [Production Build](#production-build)
8. [Troubleshooting](#troubleshooting)

---

## 1️⃣ Prerequisites

### Required Software

#### Node.js & npm
```bash
# Check if installed
node --version  # Should be v18 or higher
npm --version   # Should be v9 or higher

# If not installed, download from:
# https://nodejs.org/
```

#### Git
```bash
# Check if installed
git --version

# If not installed, download from:
# https://git-scm.com/
```

#### Database (Choose One)

**Option A: PostgreSQL** (Recommended)
```bash
# macOS
brew install postgresql@15
brew services start postgresql@15

# Or use Docker
docker run --name mango-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=mango_pos \
  -p 5432:5432 \
  -d postgres:15
```

**Option B: SQL Server**
```bash
# Use Docker
docker run --name mango-sqlserver \
  -e "ACCEPT_EULA=Y" \
  -e "SA_PASSWORD=YourStrong@Passw0rd" \
  -p 1433:1433 \
  -d mcr.microsoft.com/mssql/server:2022-latest
```

### Recommended Tools

- **VS Code** - Code editor
- **Postman** - API testing
- **Docker** - For local database
- **Git** - Version control

---

## 2️⃣ Initial Setup

### Clone/Copy Project

```bash
# Navigate to project root
cd "Mango POS Offline V1"
```

### Verify Structure

You should see:
```
Mango POS Offline V1/
├── client/
├── server/
├── shared/
├── docs/
├── config/
└── scripts/
```

---

## 3️⃣ Database Setup

### PostgreSQL Setup

#### Step 1: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE mango_pos;

# Exit
\q
```

#### Step 2: Configure Connection

Update `server/.env`:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/mango_pos
```

#### Step 3: Run Migrations

```bash
cd server
npm run db:migrate
```

#### Step 4: Seed Database (Optional)

```bash
npm run db:seed
```

### SQL Server Setup

#### Step 1: Create Database

```sql
CREATE DATABASE mango_pos;
```

#### Step 2: Configure Connection

Update `server/.env`:
```env
DATABASE_URL=sqlserver://localhost:1433;database=mango_pos;user=sa;password=YourPassword
```

#### Step 3: Run Migrations

```bash
cd server
npm run db:migrate
```

---

## 4️⃣ Environment Configuration

### Client Configuration

#### Step 1: Copy Environment Template

```bash
cd client
cp .env.example .env
```

#### Step 2: Update Values

Edit `client/.env`:
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
VITE_APP_NAME=Mango POS Offline V1
VITE_ENVIRONMENT=development
```

### Server Configuration

#### Step 1: Copy Environment Template

```bash
cd server
cp .env.example .env
```

#### Step 2: Update Values

Edit `server/.env`:
```env
# Server
PORT=3000
NODE_ENV=development

# Database (PostgreSQL example)
DATABASE_URL=postgresql://postgres:password@localhost:5432/mango_pos

# Authentication (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-this-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-min-32-chars
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Sync
SYNC_INTERVAL=30000

# Logging
LOG_LEVEL=debug
```

**⚠️ IMPORTANT:** Generate secure JWT secrets:
```bash
# Generate random secrets (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use this output for `JWT_SECRET` and `JWT_REFRESH_SECRET`.

---

## 5️⃣ Installation

### Install Client Dependencies

```bash
cd client
npm install
```

### Install Server Dependencies

```bash
cd server
npm install
```

### Generate Prisma Client

```bash
cd server
npm run db:generate
```

---

## 6️⃣ Development Setup

### Start Development Servers

#### Terminal 1: Backend Server

```bash
cd server
npm run dev
```

Server will start at: `http://localhost:3000`

#### Terminal 2: Frontend Client

```bash
cd client
npm run dev
```

Client will start at: `http://localhost:5173`

### Verify Setup

1. **Backend Health Check**
   - Open: `http://localhost:3000/api/health`
   - Should return: `{ "status": "ok" }`

2. **Frontend Application**
   - Open: `http://localhost:5173`
   - Should see Mango POS interface

3. **Database Connection**
   ```bash
   cd server
   npm run db:test
   ```
   - Should show successful connection

---

## 7️⃣ Production Build

### Build Client

```bash
cd client
npm run build
```

Output will be in: `client/dist/`

### Build Server

```bash
cd server
npm run build
```

Output will be in: `server/dist/`

### Start Production Server

```bash
cd server
npm start
```

---

## 8️⃣ Troubleshooting

### Issue: Port Already in Use

**Solution:**
```bash
# Find process using port 3000
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)

# Or change PORT in .env
```

### Issue: Database Connection Failed

**Solutions:**

1. **Check Database is Running**
   ```bash
   # PostgreSQL
   pg_isready
   
   # SQL Server
   # Check Docker container
   docker ps
   ```

2. **Verify Connection String**
   - Check `DATABASE_URL` in `server/.env`
   - Verify credentials
   - Check host/port

3. **Test Connection**
   ```bash
   cd server
   npm run db:test
   ```

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
# Regenerate Prisma client
cd server
npm run db:generate

# Check types
npm run type-check
```

### Issue: Prisma Client Not Generated

**Solution:**
```bash
cd server
npm run db:generate
```

### Issue: CORS Errors

**Solution:**
- Verify `CORS_ORIGIN` in `server/.env` matches client URL
- Default: `http://localhost:5173`

### Issue: JWT Token Errors

**Solution:**
- Ensure `JWT_SECRET` and `JWT_REFRESH_SECRET` are set
- They must be at least 32 characters
- Generate secure secrets (see Environment Configuration)

---

## 📚 Next Steps

1. ✅ **Verify Installation**
   - Run health checks
   - Test database connection
   - Open frontend application

2. 📖 **Read Documentation**
   - [Architecture Overview](./ARCHITECTURE.md)
   - [Development Guide](./DEVELOPMENT.md)
   - [API Documentation](./API.md)

3. 🛠️ **Start Developing**
   - Review code structure
   - Create your first feature
   - Write tests

---

## ✅ Verification Checklist

- [ ] Node.js v18+ installed
- [ ] Database installed and running
- [ ] Environment variables configured
- [ ] Dependencies installed (client & server)
- [ ] Prisma client generated
- [ ] Database migrations run
- [ ] Development servers start successfully
- [ ] Frontend accessible at `http://localhost:5173`
- [ ] Backend accessible at `http://localhost:3000`
- [ ] Database connection successful

---

## 🆘 Need Help?

- Check [Known Issues](./KNOWN_ISSUES.md)
- Review documentation in `docs/`
- Check console/logs for error messages
- Create an issue in the repository

---

**Setup Complete! 🎉**

You're now ready to develop Mango POS Offline V1.

