
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface FileTypeFiltersProps {
  fileTypes: string[];
  selectedFileTypes: string[];
  onToggleFileType: (type: string) => void;
}

export const FileTypeFilters: React.FC<FileTypeFiltersProps> = ({
  fileTypes,
  selectedFileTypes,
  onToggleFileType,
}) => {
  const getFileTypeLabel = (type: string): string => {
    switch (type) {
      case 'application/gzip': return 'Archive';
      case 'application/json': return 'JSON';
      case 'text/plain': return 'Text';
      case 'application/yaml': return 'YAML';
      case 'text/csv': return 'CSV';
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
              "cursor-pointer transition-colors",
              selectedFileTypes.includes(type) ? getFileColor(type) : "hover:bg-zinc-800"
            )}
            onClick={() => onToggleFileType(type)}
          >
            {getFileTypeLabel(type)}
          </Badge>
        ))}
      </div>
    </ScrollArea>
  );
};
