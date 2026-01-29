/**
 * Offline Data Caching Utility
 * 
 * Uses IndexedDB to cache Supabase data locally for offline access.
 * Shows cached data when network is unavailable, syncs when back online.
 */

const DB_NAME = 'overmark-offline';
const DB_VERSION = 1;

// Define cached tables
type CacheableTable = 'meals' | 'activities' | 'private_events' | 'profiles';

interface CacheEntry<T> {
  data: T[];
  timestamp: number;
  userId?: string;
}

// Open IndexedDB connection
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores for each cacheable table
      const tables: CacheableTable[] = ['meals', 'activities', 'private_events', 'profiles'];
      tables.forEach(table => {
        if (!db.objectStoreNames.contains(table)) {
          db.createObjectStore(table, { keyPath: 'cacheKey' });
        }
      });
      
      // Store for metadata (last sync times, etc.)
      if (!db.objectStoreNames.contains('_meta')) {
        db.createObjectStore('_meta', { keyPath: 'key' });
      }
    };
  });
}

/**
 * Cache data for a specific table
 */
export async function cacheData<T>(
  table: CacheableTable,
  data: T[],
  cacheKey: string = 'default'
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(table, 'readwrite');
    const store = tx.objectStore(table);
    
    const entry: CacheEntry<T> & { cacheKey: string } = {
      cacheKey,
      data,
      timestamp: Date.now(),
    };
    
    store.put(entry);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    
    db.close();
  } catch (error) {
    console.warn('Failed to cache data:', error);
  }
}

/**
 * Get cached data for a specific table
 */
export async function getCachedData<T>(
  table: CacheableTable,
  cacheKey: string = 'default'
): Promise<{ data: T[]; timestamp: number; isStale: boolean } | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(table, 'readonly');
    const store = tx.objectStore(table);
    
    const result = await new Promise<CacheEntry<T> & { cacheKey: string } | undefined>((resolve, reject) => {
      const request = store.get(cacheKey);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    db.close();
    
    if (!result) return null;
    
    // Data is stale if older than 1 hour
    const ONE_HOUR = 60 * 60 * 1000;
    const isStale = Date.now() - result.timestamp > ONE_HOUR;
    
    return {
      data: result.data,
      timestamp: result.timestamp,
      isStale,
    };
  } catch (error) {
    console.warn('Failed to get cached data:', error);
    return null;
  }
}

/**
 * Clear cached data for a specific table or all tables
 */
export async function clearCache(table?: CacheableTable): Promise<void> {
  try {
    const db = await openDB();
    
    if (table) {
      const tx = db.transaction(table, 'readwrite');
      tx.objectStore(table).clear();
      await new Promise<void>((resolve) => {
        tx.oncomplete = () => resolve();
      });
    } else {
      const tables: CacheableTable[] = ['meals', 'activities', 'private_events', 'profiles'];
      for (const t of tables) {
        const tx = db.transaction(t, 'readwrite');
        tx.objectStore(t).clear();
        await new Promise<void>((resolve) => {
          tx.oncomplete = () => resolve();
        });
      }
    }
    
    db.close();
  } catch (error) {
    console.warn('Failed to clear cache:', error);
  }
}

/**
 * Check if we're currently online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Hook for network status with event listeners
 */
export function useNetworkStatus(onOnline?: () => void, onOffline?: () => void): void {
  if (typeof window === 'undefined') return;
  
  window.addEventListener('online', () => {
    console.log('Network: Back online');
    onOnline?.();
  });
  
  window.addEventListener('offline', () => {
    console.log('Network: Gone offline');
    onOffline?.();
  });
}

/**
 * Format cache timestamp for display
 */
export function formatCacheTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('da-DK', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
