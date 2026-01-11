# Deployment Guide

This document describes how to deploy the Mango Check-In App to production.

## Prerequisites

- Node.js 18+
- pnpm 8+
- Access to web server or CDN
- SSL certificate (HTTPS required)

## Build for Production

```bash
# Install dependencies
pnpm install

# Build the app
pnpm build
```

The production build is output to the `dist/` directory.

## Output Structure

```
dist/
├── index.html              # Entry HTML
└── assets/
    ├── index-*.css         # Styles (~3 KB gzipped)
    ├── vendor-*.js         # React/Router (~57 KB gzipped)
    ├── icons-*.js          # Lucide icons (~1 KB gzipped)
    ├── index-*.js          # App shell (~2 KB gzipped)
    ├── HomePage-*.js       # Home page chunk
    ├── CheckInPage-*.js    # Check-in page chunk
    └── ClockInPage-*.js    # Clock-in page chunk
```

**Total bundle size: ~66 KB gzipped**

## Deployment Options

### Option 1: Static Hosting (Recommended)

Deploy the `dist/` folder to any static hosting provider:

- **Vercel**: `vercel --prod`
- **Netlify**: Drag and drop `dist/` folder
- **AWS S3 + CloudFront**: Upload to S3, configure CloudFront distribution
- **Firebase Hosting**: `firebase deploy`

### Option 2: Docker

```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

Example `nginx.conf`:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Enable gzip
    gzip on;
    gzip_types text/css application/javascript;

    # SPA routing - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Build and run:

```bash
docker build -t mango-check-in .
docker run -p 8080:80 mango-check-in
```

### Option 3: Capacitor (iOS/Android)

```bash
# Install Capacitor
pnpm add @capacitor/core @capacitor/cli

# Initialize
npx cap init "Mango Check-In" com.mangobiz.checkin

# Add platforms
npx cap add ios
npx cap add android

# Build and sync
pnpm build
npx cap sync

# Open in IDE
npx cap open ios      # Opens Xcode
npx cap open android  # Opens Android Studio
```

## Configuration

### Environment Variables

The app uses build-time environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `/api` |
| `VITE_MQTT_URL` | MQTT broker URL | - |
| `VITE_ANALYTICS_ID` | Analytics tracking ID | - |

Set via `.env.production`:

```env
VITE_API_URL=https://api.mangobiz.com
VITE_MQTT_URL=wss://mqtt.mangobiz.com:8883
VITE_ANALYTICS_ID=UA-XXXXX-Y
```

### Kiosk Mode Configuration

For dedicated kiosk devices:

1. **Chrome Kiosk Mode**
   ```bash
   google-chrome --kiosk --app=https://checkin.yourdomain.com
   ```

2. **iPad Guided Access**
   - Settings → Accessibility → Guided Access → Enable
   - Triple-click home button to start Guided Access

3. **Android Kiosk Mode**
   - Use a third-party kiosk launcher app
   - Enable "Screen Pinning" in Settings

## Health Checks

The app is a static SPA. For health checks:

- Check that `index.html` returns 200
- Or create a `/health` endpoint on your web server

## Monitoring

### Performance Metrics

The app includes a `usePerformance` hook that tracks:

- Time to First Contentful Paint
- Time to Interactive
- Page load duration

Integrate with your analytics provider to capture these metrics.

### Error Tracking

Consider integrating:

- Sentry for error tracking
- LogRocket for session replay
- DataDog for APM

## Security Considerations

1. **HTTPS Required**: The app must be served over HTTPS
2. **CSP Headers**: Configure Content Security Policy
3. **CORS**: Configure backend CORS for API requests
4. **Session Timeout**: Built-in 5-minute inactivity timeout

Example CSP header:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://api.mangobiz.com wss://mqtt.mangobiz.com;
```

## Troubleshooting

### Blank Page After Deploy

- Check browser console for errors
- Verify base path configuration in `vite.config.ts`
- Ensure server serves `index.html` for SPA routes

### Assets Not Loading

- Check asset URLs in network tab
- Verify CDN/hosting path configuration
- Clear browser cache

### Slow Initial Load

- Enable gzip/brotli compression on server
- Verify CDN caching is working
- Check network latency to hosting

## Support

For deployment assistance, contact:
- Email: support@mangobiz.com
- Documentation: https://docs.mangobiz.com
