
import React from 'react';

interface FileGridEmptyProps {
  searchQuery: string;
}

export const FileGridEmpty: React.FC<FileGridEmptyProps> = ({ searchQuery }) => {
  return (
    <div className="col-span-full text-center py-8">
      <p className="text-sm text-zinc-500">
        {searchQuery ? `No files matching "${searchQuery}"` : "No files found"}
      </p>
      <p className="text-xs text-zinc-600 mt-1">
        {searchQuery ? "Try a different search term" : "Upload a file to get started"}
      </p>
    </div>
  );
};
