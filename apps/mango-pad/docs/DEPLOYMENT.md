# Deployment

Mango Pad can be deployed as a web application, iOS app, or Android app.

## Web Deployment

### Production Build

```bash
# Build for production
pnpm build

# Preview the build locally
pnpm preview
```

The build outputs to the `dist/` directory.

### Static Hosting

Deploy the `dist/` folder to any static hosting provider:

- **Vercel**: Connect your repo or `vercel --prod`
- **Netlify**: Drag & drop `dist/` or connect repo
- **AWS S3 + CloudFront**: Upload to S3, configure CloudFront distribution
- **Nginx/Apache**: Serve `dist/` as static files

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name pad.yoursalon.com;
    root /var/www/mango-pad/dist;
    index index.html;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Environment Configuration

For production deployments, set environment variables before building:

```bash
VITE_DEFAULT_SALON_ID=your-salon-id \
VITE_DEFAULT_MQTT_URL=wss://mqtt.yoursalon.com:8884 \
pnpm build
```

Or create a `.env.production` file:

```env
VITE_DEFAULT_SALON_ID=your-salon-id
VITE_DEFAULT_MQTT_URL=wss://mqtt.yoursalon.com:8884
```

---

## iOS Deployment (Capacitor)

### Prerequisites

- macOS with Xcode 14+
- Apple Developer account
- CocoaPods installed

### Setup

1. **Install Capacitor**

```bash
pnpm add @capacitor/core @capacitor/ios
pnpm add -D @capacitor/cli
npx cap init "Mango Pad" "com.mangobiz.pad"
```

2. **Add iOS Platform**

```bash
npx cap add ios
```

3. **Configure capacitor.config.ts**

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mangobiz.pad',
  appName: 'Mango Pad',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  ios: {
    contentInset: 'always',
    allowsLinkPreview: false
  }
};

export default config;
```

### Build & Deploy

```bash
# Build web assets
pnpm build

# Sync to iOS project
npx cap sync ios

# Open in Xcode
npx cap open ios
```

In Xcode:
1. Select your team in Signing & Capabilities
2. Connect your iPad
3. Select your device as target
4. Click Run (⌘R)

### App Store Deployment

1. Archive the app: **Product → Archive**
2. Distribute: **Distribute App → App Store Connect**
3. Submit for review in App Store Connect

### iPad-Specific Settings

In Xcode, update `Info.plist`:

```xml
<!-- Lock to iPad only -->
<key>UIDeviceFamily</key>
<array>
    <integer>2</integer>
</array>

<!-- Support all orientations -->
<key>UISupportedInterfaceOrientations~ipad</key>
<array>
    <string>UIInterfaceOrientationPortrait</string>
    <string>UIInterfaceOrientationPortraitUpsideDown</string>
    <string>UIInterfaceOrientationLandscapeLeft</string>
    <string>UIInterfaceOrientationLandscapeRight</string>
</array>

<!-- Full screen display -->
<key>UIStatusBarHidden</key>
<true/>
<key>UIViewControllerBasedStatusBarAppearance</key>
<false/>
```

---

## Android Deployment (Capacitor)

### Prerequisites

- Android Studio (latest)
- Android SDK 21+
- Java 17+

### Setup

1. **Add Android Platform**

```bash
npx cap add android
```

2. **Update capacitor.config.ts**

```typescript
const config: CapacitorConfig = {
  // ... existing config
  android: {
    allowMixedContent: true,
    webContentsDebuggingEnabled: false // set to true for debugging
  }
};
```

### Build & Deploy

```bash
# Build web assets
pnpm build

# Sync to Android project
npx cap sync android

# Open in Android Studio
npx cap open android
```

In Android Studio:
1. Connect your Android tablet via USB
2. Enable USB debugging on the device
3. Select your device in the device dropdown
4. Click Run (Shift+F10)

### Play Store Deployment

1. Build signed APK/AAB:
   - **Build → Generate Signed Bundle / APK**
   - Choose AAB for Play Store
   - Create or use existing keystore

2. Upload to Google Play Console

3. Submit for review

### Android-Specific Settings

Update `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest>
    <application
        android:allowBackup="false"
        android:fullBackupContent="false"
        android:theme="@style/AppTheme.NoActionBar">
        
        <activity
            android:name=".MainActivity"
            android:screenOrientation="fullSensor"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:exported="true">
            <!-- ... -->
        </activity>
    </application>
</manifest>
```

Update `android/app/src/main/res/values/styles.xml` for fullscreen:

```xml
<style name="AppTheme.NoActionBar" parent="Theme.AppCompat.NoActionBar">
    <item name="android:windowFullscreen">true</item>
    <item name="android:windowContentOverlay">@null</item>
</style>
```

---

## Kiosk Mode

For unattended tablet deployments, configure kiosk mode to prevent users from exiting the app.

### iOS (Guided Access)

1. Go to **Settings → Accessibility → Guided Access**
2. Enable Guided Access
3. Set a passcode
4. Open Mango Pad
5. Triple-click Home/Side button to start Guided Access

### Android (Lock Task Mode)

For dedicated devices, use Android's Lock Task Mode:

1. Set the device as Device Owner (requires setup wizard or MDM)
2. Add to `MainActivity.java`:

```java
@Override
protected void onResume() {
    super.onResume();
    startLockTask();
}
```

3. Whitelist the app:

```bash
adb shell dpm set-device-owner com.mangobiz.pad/.DeviceAdminReceiver
adb shell dpm set-lock-task-packages com.mangobiz.pad
```

---

## MQTT Broker Setup

### Local Broker (Mosquitto)

Install Mosquitto on your Store App machine:

```bash
# macOS
brew install mosquitto

# Ubuntu/Debian
sudo apt install mosquitto mosquitto-clients

# Start broker
mosquitto -c /etc/mosquitto/mosquitto.conf
```

Configure WebSocket listener in `mosquitto.conf`:

```conf
listener 1883
protocol mqtt

listener 9001
protocol websockets

allow_anonymous true
```

### Cloud Broker (Production)

For production, use a managed MQTT broker:

- **HiveMQ Cloud** (Free tier available)
- **AWS IoT Core**
- **Azure IoT Hub**
- **EMQX Cloud**

Example HiveMQ configuration:

```
VITE_DEFAULT_MQTT_URL=wss://your-cluster.hivemq.cloud:8884/mqtt
```

---

## Pre-Deployment Checklist

- [ ] Salon ID configured
- [ ] MQTT broker URL configured and tested
- [ ] Logo uploaded
- [ ] Brand colors set
- [ ] Tip suggestions customized
- [ ] Promotional slides created
- [ ] Payment timeout appropriate for terminal
- [ ] Tested complete payment flow
- [ ] Tested split payment flow
- [ ] Tested offline/reconnection behavior
- [ ] High contrast mode tested (if needed)
- [ ] Device locked to app (kiosk mode)
- [ ] Screen auto-lock disabled
- [ ] Device always powered (plugged in)

---

## Troubleshooting

### MQTT Connection Fails

1. Verify broker URL includes `ws://` or `wss://` prefix
2. Check if broker allows WebSocket connections
3. Verify firewall allows WebSocket port (typically 1883 or 8884)
4. Check Salon ID matches between POS and Pad

### Signature Not Working

1. Ensure device supports touch events
2. Check signature canvas is visible (not behind overlay)
3. Verify touch-action CSS not blocking gestures

### App Crashes on Launch

1. Clear localStorage: `localStorage.removeItem('mango-pad-config')`
2. Check browser console for errors
3. Verify all dependencies installed: `pnpm install`

### Payment Timeout Too Fast

1. Increase paymentTimeout in settings (default 60 seconds)
2. Consider network latency to payment terminal
3. Check terminal response time in your payment processor dashboard
