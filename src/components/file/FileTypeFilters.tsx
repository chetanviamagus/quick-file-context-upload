
import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface FileTypeFiltersProps {
  fileTypes: string[];
  selectedFileTypes: string[];
  onToggleFileType: (type: string) => void;
  allFiles?: { type: string }[];
}

export const FileTypeFilters: React.FC<FileTypeFiltersProps> = ({
  fileTypes,
  selectedFileTypes,
  onToggleFileType,
  allFiles = [],
}) => {
  const [fileCounts, setFileCounts] = useState<Record<string, number>>({});
  
  // Calculate file counts for each file type
  useEffect(() => {
    if (allFiles.length === 0) return;
    
    const counts: Record<string, number> = {};
    
    allFiles.forEach(file => {
      if (file.type) {
        counts[file.type] = (counts[file.type] || 0) + 1;
      }
    });
    
    setFileCounts(counts);
  }, [allFiles]);

  const getFileTypeLabel = (type: string): string => {
    switch (type) {
      case 'application/gzip': return 'Archive';
      case 'application/json': return 'JSON';
      case 'text/plain': return 'Text';
      case 'application/yaml': return 'YAML';
      case 'text/csv': return 'CSV';
      case 'application/pdf': return 'PDF';
      default: return type.split('/')[1] || type;
    }
  };
  
  const getFileColor = (type: string): string => {
    switch (type) {
      case 'application/gzip': return 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30';
      case 'application/json': return 'bg-blue-500/20 text-blue-500 hover:bg-blue-500/30';
      case 'text/plain': return 'bg-gray-500/20 text-gray-500 hover:bg-gray-500/30';
      case 'application/yaml': return 'bg-green-500/20 text-green-500 hover:bg-green-500/30';
      case 'text/csv': return 'bg-purple-500/20 text-purple-500 hover:bg-purple-500/30';
      case 'application/pdf': return 'bg-red-500/20 text-red-500 hover:bg-red-500/30';
      default: return 'bg-zinc-500/20 text-zinc-400 hover:bg-zinc-500/30';
    }
  };

  if (fileTypes.length === 0) return null;

  return (
    <ScrollArea className="whitespace-nowrap pb-2">
      <div className="flex space-x-2">
        {fileTypes.map(type => (
          <Badge
            key={type}
            variant="outline"
            className={cn(
              "cursor-pointer transition-colors flex items-center gap-1.5",
              selectedFileTypes.includes(type) ? getFileColor(type) : "hover:bg-zinc-800"
            )}
            onClick={() => onToggleFileType(type)}
          >
            <span>{getFileTypeLabel(type)}</span>
            {fileCounts[type] && (
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full",
                selectedFileTypes.includes(type) 
                  ? "bg-black/20" 
                  : "bg-zinc-700"
              )}>
                {fileCounts[type]}
              </span>
            )}
          </Badge>
        ))}
      </div>
    </ScrollArea>
  );
};
