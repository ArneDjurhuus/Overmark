"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { WifiOff, RefreshCw, Clock } from 'lucide-react';

interface OfflineIndicatorProps {
  isOffline: boolean;
  isFromCache: boolean;
  cacheTime: string | null;
  onRefresh?: () => void;
}

export default function OfflineIndicator({
  isOffline,
  isFromCache,
  cacheTime,
  onRefresh,
}: OfflineIndicatorProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Only show if offline or showing cached data
  const showIndicator = isOffline || isFromCache;

  const handleRefresh = async () => {
    if (onRefresh && !isRefreshing) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
  };

  if (!showIndicator) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={prefersReducedMotion ? {} : { opacity: 0, y: -20 }}
        animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
        exit={prefersReducedMotion ? {} : { opacity: 0, y: -20 }}
        className={`
          fixed top-0 left-0 right-0 z-50 px-4 py-2
          flex items-center justify-center gap-2
          text-sm font-medium
          ${isOffline 
            ? 'bg-amber-500 text-amber-950' 
            : 'bg-blue-500/90 text-white'
          }
          safe-area-inset-top
        `}
      >
        {isOffline ? (
          <>
            <WifiOff className="w-4 h-4" />
            <span>Ingen forbindelse</span>
            {cacheTime && (
              <span className="flex items-center gap-1 ml-2 opacity-80">
                <Clock className="w-3 h-3" />
                <span>Data fra {cacheTime}</span>
              </span>
            )}
          </>
        ) : (
          <>
            <Clock className="w-4 h-4" />
            <span>Viser gemt data fra {cacheTime}</span>
          </>
        )}
        
        {onRefresh && !isOffline && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="ml-2 p-1 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Opdater data"
          >
            <RefreshCw 
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
            />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Simple hook to track online/offline status
 */
export function useOnlineStatus() {
  // Initialize with actual value if in browser, otherwise assume online
  const [isOnline, setIsOnline] = useState(() => 
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
