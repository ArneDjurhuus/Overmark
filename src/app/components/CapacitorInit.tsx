"use client";

import { useEffect } from 'react';
import { initializeCapacitor } from '@/lib/capacitor';

/**
 * Client component that initializes Capacitor plugins.
 * Add this to the root layout to enable native features.
 */
export function CapacitorInit() {
  useEffect(() => {
    // Initialize Capacitor when the app loads
    initializeCapacitor();
  }, []);

  // This component doesn't render anything
  return null;
}
