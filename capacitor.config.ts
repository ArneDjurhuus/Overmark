import type { CapacitorConfig } from '@capacitor/cli';

// Check if running in development mode
const isDev = process.env.NODE_ENV === 'development';

const config: CapacitorConfig = {
  appId: 'dk.overmarksgaarden.intra',
  appName: 'Overmarksgården Intra',
  webDir: 'out',
  
  // Development: live reload from Next.js dev server
  // Production: serve from bundled static files
  server: isDev ? {
    url: 'http://10.0.2.2:3000', // Android emulator localhost alias
    cleartext: true,
  } : undefined,
  
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: isDev,
    backgroundColor: '#ffffff',
  },
  
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#ffffff',
    },
    App: {
      // Handle app lifecycle events
    },
  },
};

export default config;
