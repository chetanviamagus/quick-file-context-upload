
import React from 'react';
import { Loader } from 'lucide-react';
import { FileCardSkeleton } from './FileCardSkeleton';

interface FileGridLoadingProps {
  message?: string;
  className?: string;
  showSkeletons?: boolean;
  skeletonCount?: number;
}

export const FileGridLoading: React.FC<FileGridLoadingProps> = ({ 
  message = "Loading files...", 
  className = "",
  showSkeletons = true,
  skeletonCount = 9
}) => {
  if (showSkeletons) {
    return (
      <div className={`space-y-3 w-full ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Array(skeletonCount).fill(0).map((_, index) => (
            <FileCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className={`flex justify-center py-6 ${className}`}>
      <div className="flex items-center gap-2">
        <Loader className="h-4 w-4 animate-spin text-zinc-400" />
        <span className="text-sm text-zinc-400">{message}</span>
      </div>
    </div>
  );
};
