# Check-In App Deployment Guide

> Complete deployment instructions for the Mango Check-In kiosk application.

## Prerequisites

- Node.js 18+ and pnpm
- Supabase project with required tables
- MQTT broker (optional, for real-time updates)
- Target device: Tablet (7-10 inch) with modern browser

## Environment Configuration

### Required Variables

Create a `.env` file in the `apps/check-in/` directory:

```bash
# Supabase Configuration (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Store Configuration (Required)
VITE_STORE_ID=your-store-uuid
VITE_DEVICE_ID=checkin-kiosk-01

# MQTT Configuration (Optional)
VITE_MQTT_URL=wss://mqtt.your-domain.com:8883
VITE_MQTT_USERNAME=checkin-device
VITE_MQTT_PASSWORD=secure-password

# Feature Flags
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_SMS_NOTIFICATIONS=true
VITE_ENABLE_ANALYTICS=true

# Development
VITE_DEV_MODE=false
```

### Environment Variable Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key |
| `VITE_STORE_ID` | ✅ | Store UUID for this kiosk |
| `VITE_DEVICE_ID` | ✅ | Unique device identifier |
| `VITE_MQTT_URL` | ❌ | MQTT broker WebSocket URL |
| `VITE_ENABLE_OFFLINE_MODE` | ❌ | Enable IndexedDB caching (default: true) |
| `VITE_ENABLE_SMS_NOTIFICATIONS` | ❌ | Enable SMS via Edge Function (default: true) |
| `VITE_DEV_MODE` | ❌ | Enable dev features (default: false) |

## Build Process

### Development Build

```bash
cd apps/check-in
pnpm install
pnpm dev
```

Opens at `http://localhost:5173`

### Production Build

```bash
pnpm build
```

Output in `dist/` directory:
- `index.html` - Entry point
- `assets/` - JS, CSS, and static files

### Build Verification

```bash
# Type check
pnpm tsc --noEmit

# Lint
pnpm lint

# Run tests
pnpm test

# Preview production build
pnpm preview
```

## Deployment Options

### Option 1: Static Hosting (Recommended)

Deploy to any static hosting provider:

**Vercel:**
```bash
vercel --prod
```

**Netlify:**
```bash
netlify deploy --prod --dir=dist
```

**AWS S3 + CloudFront:**
```bash
aws s3 sync dist/ s3://your-bucket-name/
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### Option 2: Self-Hosted (Nginx)

```nginx
server {
    listen 80;
    server_name checkin.your-salon.com;
    root /var/www/checkin/dist;
    
    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### Option 3: Capacitor (Native App)

For Android/iOS tablet deployment:

```bash
# Install Capacitor
pnpm add @capacitor/core @capacitor/cli

# Initialize
npx cap init "Mango Check-In" com.mangobiz.checkin

# Add platforms
npx cap add android
npx cap add ios

# Build and sync
pnpm build
npx cap sync

# Open in IDE
npx cap open android  # Android Studio
npx cap open ios      # Xcode
```

## Supabase Setup

### Required Tables

```sql
-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  is_blocked BOOLEAN DEFAULT false,
  is_vip BOOLEAN DEFAULT false,
  preferences JSONB DEFAULT '{}',
  loyalty_info JSONB DEFAULT '{"points": 0, "pointsToNextReward": 100}',
  visit_summary JSONB DEFAULT '{"visitCount": 0}',
  tags JSONB DEFAULT '[]',
  notes JSONB DEFAULT '[]',
  sync_status TEXT DEFAULT 'synced',
  sync_version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services table
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES service_categories(id),
  price DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  thumbnail_url TEXT
);

-- Service categories
CREATE TABLE service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0
);

-- Staff/technicians
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  display_name TEXT,
  photo_url TEXT,
  status TEXT DEFAULT 'available',
  service_ids UUID[] DEFAULT '{}',
  estimated_wait_minutes INTEGER
);

-- Check-ins
CREATE TABLE checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_in_number TEXT NOT NULL,
  store_id UUID NOT NULL,
  client_id UUID REFERENCES clients(id),
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  services JSONB NOT NULL,
  technician_preference TEXT NOT NULL,
  guests JSONB DEFAULT '[]',
  party_preference TEXT,
  status TEXT DEFAULT 'waiting',
  queue_position INTEGER DEFAULT 0,
  estimated_wait_minutes INTEGER DEFAULT 0,
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  called_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  source TEXT DEFAULT 'kiosk',
  device_id TEXT NOT NULL,
  sync_status TEXT DEFAULT 'synced'
);

-- Appointments (for QR check-in)
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  client_name TEXT,
  client_phone TEXT,
  services JSONB,
  technician_id UUID REFERENCES staff(id),
  technician_name TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled',
  qr_code TEXT UNIQUE
);
```

### Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

-- Clients: Store can only access own clients
CREATE POLICY "Store access clients" ON clients
  FOR ALL USING (store_id = current_setting('app.store_id')::uuid);

-- Check-ins: Store can only access own check-ins
CREATE POLICY "Store access checkins" ON checkins
  FOR ALL USING (store_id = current_setting('app.store_id')::uuid);

-- Services/Staff: Public read access
CREATE POLICY "Public read services" ON services FOR SELECT USING (true);
CREATE POLICY "Public read staff" ON staff FOR SELECT USING (true);
```

## Kiosk Mode Configuration

### Chrome Kiosk Mode (Recommended)

```bash
# Linux/macOS
google-chrome --kiosk --disable-translate --noerrdialogs \
  --disable-infobars --no-first-run --fast --fast-start \
  --disable-pinch --overscroll-history-navigation=0 \
  "https://checkin.your-salon.com"

# Windows
chrome.exe --kiosk --disable-translate --noerrdialogs ^
  --disable-infobars --no-first-run ^
  "https://checkin.your-salon.com"
```

### Android Kiosk Mode

1. Build with Capacitor
2. Use Android Enterprise (fully managed device)
3. Set as single-app kiosk in device policy

### iPad Kiosk Mode

1. Build with Capacitor
2. Enable Guided Access in Settings
3. Or use MDM solution for kiosk lockdown

## Offline Mode

### How It Works

1. **Service Worker** - Caches static assets (configured by Vite)
2. **IndexedDB** - Stores services, technicians, and pending check-ins
3. **Sync Queue** - Queues operations when offline
4. **Auto-sync** - Processes queue when connection restored

### Testing Offline

1. Load the app normally
2. Open DevTools → Network → Offline
3. Perform check-in (stored locally)
4. Go back online
5. Data syncs automatically

## Monitoring & Logging

### Analytics Events

The app tracks these events (configure analytics endpoint):
- `checkin_started` - User begins check-in
- `phone_entered` - Phone lookup performed
- `services_selected` - Services chosen
- `technician_selected` - Staff preference set
- `guest_added` - Guest added to party
- `checkin_completed` - Check-in successful
- `checkin_abandoned` - User left without completing

### Error Tracking

Errors are logged to console. For production, integrate:
- Sentry
- LogRocket
- Custom logging endpoint

## Troubleshooting

### Build Issues

```bash
# Clear cache
rm -rf node_modules/.vite
pnpm install

# Check TypeScript errors
pnpm tsc --noEmit
```

### Offline Not Working

1. Check IndexedDB is not disabled
2. Verify service worker is registered
3. Check browser storage quota

### MQTT Not Connecting

1. Verify WebSocket URL is correct (`wss://` not `mqtt://`)
2. Check firewall allows WebSocket connections
3. Verify credentials if authentication required

### Supabase Errors

1. Check environment variables are set
2. Verify RLS policies allow access
3. Check Supabase logs for errors

## Security Checklist

Before going live:

- [ ] Remove hardcoded credentials from code
- [ ] Set proper CORS headers on Supabase
- [ ] Enable RLS on all tables
- [ ] Configure rate limiting
- [ ] Set secure headers (CSP, HSTS, etc.)
- [ ] Use HTTPS only
- [ ] Review admin PIN (change from default 1234)
- [ ] Test input sanitization

## Performance Checklist

- [ ] Bundle size < 500KB gzipped (currently ~91KB)
- [ ] Page load < 2 seconds
- [ ] Lighthouse score ≥ 90
- [ ] Test on actual tablet hardware
- [ ] Verify touch responsiveness

---

*Last updated: January 2026*
