import React from 'react';
import { FileItem } from '@/components/FileUploader';
import { File, Eye, Trash2, CheckCircle2, Loader2, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FileUploadStatus } from '@/types/file';

interface FileCardProps {
  file: FileItem;
  isActive: boolean;
  onSelect: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
}

export const FileCard: React.FC<FileCardProps> = ({
  file,
  isActive,
  onSelect,
  onDelete,
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
  
  const formatFileSize = (bytes: number): string => {
    if (bytes >= 1000000) {
      return `${(bytes / 1000000).toFixed(2)} MB`;
    }
    return `${(bytes / 1000).toFixed(2)} KB`;
  };

  const renderStatusIcon = (status: FileUploadStatus) => {
    switch (status) {
      case FileUploadStatus.FILE_UPLOAD_STATUS_IN_PROGRESS:
        return <Loader2 className="h-3.5 w-3.5 text-amber-500 animate-spin" />;
      case FileUploadStatus.FILE_UPLOAD_STATUS_COMPLETE:
        return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
      case FileUploadStatus.FILE_UPLOAD_STATUS_FAILED:
        return <AlertCircle className="h-3.5 w-3.5 text-red-500" />;
      default:
        return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  return (
    <div 
      className={cn(
        "flex items-center justify-between p-3 rounded-md cursor-pointer transition-all duration-200 hover:scale-[1.01] border",
        isActive
          ? 'bg-zinc-800/80 border-blue-500/50 shadow-md'
          : 'bg-zinc-800/40 border-zinc-800 hover:bg-zinc-800/60'
      )}
      onClick={() => onSelect(file)}
    >
      <div className="flex items-center gap-3 min-w-0">
        <File className={cn(
          "h-4 w-4 flex-shrink-0",
          file.type === 'application/gzip' && "text-amber-400",
          file.type === 'application/json' && "text-blue-400",
          file.type === 'text/plain' && "text-gray-400",
          file.type === 'application/yaml' && "text-green-400",
          file.type === 'text/csv' && "text-purple-400"
        )} />
        
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{file.name}</span>
            <Badge variant="outline" className={cn("text-xs", getFileColor(file.type))}>
              {getFileTypeLabel(file.type)}
            </Badge>
            {renderStatusIcon(file.status)}
          </div>
          
          <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
            <span>{formatFileSize(file.size)}</span>
            <span className="text-zinc-600">•</span>
            <span className="truncate">{file.context}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-1 ml-2">
        <Button 
          variant="ghost" 
          size="icon"
          className="h-7 w-7 text-zinc-400 hover:text-white"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(file);
          }}
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-7 w-7 text-zinc-400 hover:text-red-400"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(file);
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};
