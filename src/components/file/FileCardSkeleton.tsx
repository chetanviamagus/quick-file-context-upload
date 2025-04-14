
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const FileCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-md transition-shadow bg-card">
      <div className="aspect-video relative">
        <Skeleton className="absolute inset-0 w-full h-full" />
      </div>
      <div className="p-3 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex items-center justify-between mt-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-7 w-16 rounded-md" />
        </div>
      </div>
    </div>
  );
};
