"use client";

import { useState, useEffect, useCallback } from 'react';
import { cacheData, getCachedData, isOnline, formatCacheTime } from '@/lib/offline-cache';

type CacheableTable = 'meals' | 'activities' | 'private_events' | 'profiles';

interface UseOfflineDataResult<T> {
  data: T[];
  isLoading: boolean;
  isOffline: boolean;
  isFromCache: boolean;
  cacheTime: string | null;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching data with offline cache support
 * 
 * @param table - The Supabase table name
 * @param fetchFn - Async function that fetches fresh data from Supabase
 * @param cacheKey - Optional cache key for different views of same table
 * @param deps - Dependencies array for refetching
 */
export function useOfflineData<T>(
  table: CacheableTable,
  fetchFn: () => Promise<T[]>,
  cacheKey: string = 'default',
  deps: React.DependencyList = []
): UseOfflineDataResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);
  const [cacheTime, setCacheTime] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    // First, check if online
    const online = isOnline();
    setIsOffline(!online);
    
    if (online) {
      // Try to fetch fresh data
      try {
        const freshData = await fetchFn();
        setData(freshData);
        setIsFromCache(false);
        setCacheTime(null);
        
        // Cache the fresh data
        await cacheData(table, freshData, cacheKey);
      } catch (err) {
        console.error('Failed to fetch fresh data:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch data'));
        
        // Fall back to cache on fetch error
        const cached = await getCachedData<T>(table, cacheKey);
        if (cached) {
          setData(cached.data);
          setIsFromCache(true);
          setCacheTime(formatCacheTime(cached.timestamp));
        }
      }
    } else {
      // Offline - use cached data
      const cached = await getCachedData<T>(table, cacheKey);
      if (cached) {
        setData(cached.data);
        setIsFromCache(true);
        setCacheTime(formatCacheTime(cached.timestamp));
      } else {
        setData([]);
        setError(new Error('Ingen forbindelse og ingen gemte data'));
      }
    }
    
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, cacheKey, ...deps]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      fetchData(); // Refetch when back online
    };
    
    const handleOffline = () => {
      setIsOffline(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchData]);

  return {
    data,
    isLoading,
    isOffline,
    isFromCache,
    cacheTime,
    error,
    refetch: fetchData,
  };
}
