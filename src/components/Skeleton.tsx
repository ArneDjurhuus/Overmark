'use client';

interface SkeletonProps {
  className?: string;
  height?: string;
  width?: string;
  rounded?: string;
}

export default function Skeleton({ 
  className = '', 
  height = 'h-4', 
  width = 'w-full',
  rounded = 'rounded'
}: SkeletonProps) {
  return (
    <div 
      className={`${height} ${width} ${rounded} bg-gray-200 animate-pulse ${className}`}
      role="status"
      aria-label="Indlæser..."
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="glass rounded-xl p-6 space-y-4">
      <Skeleton height="h-6" width="w-3/4" />
      <Skeleton height="h-4" width="w-full" />
      <Skeleton height="h-4" width="w-5/6" />
      <Skeleton height="h-10" width="w-32" rounded="rounded-lg" />
    </div>
  );
}
