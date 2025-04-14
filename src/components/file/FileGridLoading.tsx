
import React from 'react';
import { Loader } from 'lucide-react';

interface FileGridLoadingProps {
  message?: string;
  className?: string;
}

export const FileGridLoading: React.FC<FileGridLoadingProps> = ({ 
  message = "Loading files...", 
  className = "" 
}) => {
  return (
    <div className={`flex justify-center py-6 ${className}`}>
      <div className="flex items-center gap-2">
        <Loader className="h-4 w-4 animate-spin text-zinc-400" />
        <span className="text-sm text-zinc-400">{message}</span>
      </div>
    </div>
  );
};
