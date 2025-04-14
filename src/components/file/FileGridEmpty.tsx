
import React from 'react';

interface FileGridEmptyProps {
  searchQuery: string;
}

export const FileGridEmpty: React.FC<FileGridEmptyProps> = ({ searchQuery }) => {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16">
      <div className="rounded-full bg-zinc-100 dark:bg-zinc-800 p-4 mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-zinc-500"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      </div>
      <p className="text-base font-medium text-zinc-500">
        {searchQuery ? `No files matching "${searchQuery}"` : "No files found"}
      </p>
      <p className="text-sm text-zinc-400 mt-1">
        {searchQuery ? "Try a different search term" : "Upload a file to get started"}
      </p>
    </div>
  );
};
