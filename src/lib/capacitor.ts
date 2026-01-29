/**
 * Capacitor Plugin Integrations
 * 
 * Provides hooks and utilities for native Capacitor features.
 * These only activate when running in a native context (Android/iOS).
 */

import { useEffect } from 'react';

// Check if running in Capacitor native context
export function isNative(): boolean {
  return typeof window !== 'undefined' && 
         'Capacitor' in window && 
         (window as typeof window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.() === true;
}

/**
 * Initialize Capacitor plugins on app start
 * Call this in your root layout or app component
 */
export async function initializeCapacitor(): Promise<void> {
  if (!isNative()) {
    console.log('Running in web mode - Capacitor plugins not available');
    return;
  }

  try {
    // Dynamically import plugins only in native context
    const { SplashScreen } = await import('@capacitor/splash-screen');
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    const { App } = await import('@capacitor/app');

    // Hide splash screen after app is ready
    await SplashScreen.hide();

    // Configure status bar
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: '#ffffff' });

    // Handle back button (Android)
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        // At root - could show exit confirmation or minimize
        App.minimizeApp();
      }
    });

    // Handle app state changes
    App.addListener('appStateChange', ({ isActive }) => {
      console.log('App state changed. Active:', isActive);
      // Could trigger data refresh when app becomes active
    });

    // Handle deep links
    App.addListener('appUrlOpen', ({ url }) => {
      console.log('App opened with URL:', url);
      handleDeepLink(url);
    });

    console.log('Capacitor plugins initialized');
  } catch (error) {
    console.warn('Failed to initialize Capacitor plugins:', error);
  }
}

/**
 * Handle incoming deep links
 */
function handleDeepLink(url: string): void {
  try {
    const parsedUrl = new URL(url);
    
    // Handle QR code login links
    if (parsedUrl.pathname === '/login' && parsedUrl.searchParams.has('code')) {
      const code = parsedUrl.searchParams.get('code');
      window.location.href = `/login?code=${code}`;
      return;
    }

    // Handle custom scheme (overmark://app/path)
    if (parsedUrl.protocol === 'overmark:') {
      const path = parsedUrl.pathname || '/';
      window.location.href = path;
      return;
    }

    // Default: navigate to the path
    if (parsedUrl.pathname && parsedUrl.pathname !== '/') {
      window.location.href = parsedUrl.pathname + parsedUrl.search;
    }
  } catch (error) {
    console.error('Failed to handle deep link:', error);
  }
}

/**
 * Hook to handle Android back button behavior
 */
export function useBackButton(onBack?: () => boolean | void): void {
  useEffect(() => {
    if (!isNative()) return;

    const handleBackButton = async () => {
      const { App } = await import('@capacitor/app');
      
      App.addListener('backButton', ({ canGoBack }) => {
        // If custom handler returns true, it handled the back
        if (onBack && onBack() === true) {
          return;
        }
        
        // Default behavior
        if (canGoBack) {
          window.history.back();
        } else {
          App.minimizeApp();
        }
      });
    };

    handleBackButton();
  }, [onBack]);
}

/**
 * Hook to handle app becoming active (coming from background)
 */
export function useAppStateChange(onActive?: () => void, onInactive?: () => void): void {
  useEffect(() => {
    if (!isNative()) return;

    const setupListener = async () => {
      const { App } = await import('@capacitor/app');
      
      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          onActive?.();
        } else {
          onInactive?.();
        }
      });
    };

    setupListener();
  }, [onActive, onInactive]);
}

/**
 * Set status bar color dynamically
 */
export async function setStatusBarColor(color: string, isDark: boolean = false): Promise<void> {
  if (!isNative()) return;

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setBackgroundColor({ color });
    await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
  } catch (error) {
    console.warn('Failed to set status bar color:', error);
  }
}
