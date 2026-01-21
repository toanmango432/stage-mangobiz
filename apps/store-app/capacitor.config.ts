import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mangobiz.pos',
  appName: 'Mango POS',
  webDir: 'dist',
  server: {
    // Enable live reload in development
    // Uncomment and set to your local IP for device debugging:
    // url: 'http://192.168.1.x:5173',
    // cleartext: true,
    androidScheme: 'https',
  },
  ios: {
    // iOS-specific configuration
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    // Enable Face ID usage
    // Note: NSFaceIDUsageDescription must be set in Info.plist
  },
  android: {
    // Android-specific configuration
    // Enable fingerprint/biometric usage
    // Note: USE_BIOMETRIC permission must be in AndroidManifest.xml
  },
  plugins: {
    // Plugin configurations will be added here
    // BiometricAuth plugin config will be added in US-010
  },
};

export default config;
