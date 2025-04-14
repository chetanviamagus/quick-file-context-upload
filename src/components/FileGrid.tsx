
import React, { useEffect, useState } from 'react';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { getFilteredFiles } from '@/services/fileService';
import { FileItem } from '@/components/FileUploader';
import { File, Eye, Trash2, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface FileGridProps {
  searchQuery: string;
  onFileSelect: (file: FileItem) => void;
  onFileDelete: (file: FileItem) => void;
  activeFile: FileItem | null;
  className?: string;
}

const ITEMS_PER_PAGE = 12;

export const FileGrid: React.FC<FileGridProps> = ({
  searchQuery,
  onFileSelect,
  onFileDelete,
  activeFile,
  className
}) => {
  const [fileTypes, setFileTypes] = useState<string[]>([]);
  const [selectedFileTypes, setSelectedFileTypes] = useState<string[]>([]);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  const {
    items: files,
    isLoading,
    hasMore,
    loaderRef,
    loadMore,
    reset
  } = useInfiniteScroll<FileItem>();
  
  // Reset when search query changes
  useEffect(() => {
    reset();
    setInitialLoadComplete(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedFileTypes]);
  
  // Load files when component mounts
  useEffect(() => {
    const fetchFiles = async (page: number) => {
      const { files, total } = await getFilteredFiles(
        {
          query: searchQuery,
          fileTypes: selectedFileTypes.length > 0 ? selectedFileTypes : undefined
        },
        { page, limit: ITEMS_PER_PAGE }
      );
      
      if (page === 1) {
        setInitialLoadComplete(true);
      }
      
      return {
        data: files,
        totalCount: total,
        pageSize: ITEMS_PER_PAGE
      };
    };
    
    loadMore(fetchFiles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedFileTypes]);
  
  // Listen for loadmore events
  useEffect(() => {
    const loaderElement = loaderRef.current;
    
    const handleLoadMore = async () => {
      const fetchFiles = async (page: number) => {
        const { files, total } = await getFilteredFiles(
          {
            query: searchQuery,
            fileTypes: selectedFileTypes.length > 0 ? selectedFileTypes : undefined
          },
          { page, limit: ITEMS_PER_PAGE }
        );
        
        return {
          data: files,
          totalCount: total,
          pageSize: ITEMS_PER_PAGE
        };
      };
      
      loadMore(fetchFiles);
    };
    
    loaderElement?.addEventListener('loadmore', handleLoadMore);
    
    return () => {
      loaderElement?.removeEventListener('loadmore', handleLoadMore);
    };
  }, [loadMore, loaderRef, searchQuery, selectedFileTypes]);
  
  // Extract unique file types for filtering
  useEffect(() => {
    const fetchFileTypes = async () => {
      const allFiles = await getFilteredFiles({}, { page: 1, limit: 1000 });
      const types = new Set(allFiles.files.map(file => file.type));
      setFileTypes(Array.from(types));
    };
    
    fetchFileTypes();
  }, []);
  
  const toggleFileType = (type: string) => {
    setSelectedFileTypes(prev => 
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };
  
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
  
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  // Determine the minimum height for the grid container to prevent layout shift
  const gridContainerClass = initialLoadComplete 
    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" 
    : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 min-h-[200px]";
  
  return (
    <div className={cn("space-y-3", className)}>
      {fileTypes.length > 0 && (
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
                onClick={() => toggleFileType(type)}
              >
                {getFileTypeLabel(type)}
              </Badge>
            ))}
          </div>
        </ScrollArea>
      )}
      
      <div className={gridContainerClass}>
        {files.length > 0 ? (
          files.map((file) => (
            <div 
              key={file.id}
              className={cn(
                "flex flex-col p-3 rounded-md cursor-pointer transition-all duration-200 hover:scale-[1.01] border overflow-hidden",
                activeFile?.id === file.id
                  ? 'bg-zinc-800/80 border-blue-500/50 shadow-md'
                  : 'bg-zinc-800/40 border-zinc-800 hover:bg-zinc-800/60'
              )}
              onClick={() => onFileSelect(file)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 overflow-hidden">
                  <File className={cn(
                    "h-4 w-4 flex-shrink-0",
                    file.type === 'application/gzip' && "text-amber-400",
                    file.type === 'application/json' && "text-blue-400",
                    file.type === 'text/plain' && "text-gray-400",
                    file.type === 'application/yaml' && "text-green-400",
                    file.type === 'text/csv' && "text-purple-400"
                  )} />
                  <span className="font-medium text-sm truncate">{file.name}</span>
                </div>
                <Badge variant="outline" className={cn("text-xs", getFileColor(file.type))}>
                  {getFileTypeLabel(file.type)}
                </Badge>
              </div>
              
              <p className="text-xs text-zinc-400 mb-2 line-clamp-2">{file.context}</p>
              
              <div className="mt-auto flex items-center justify-between text-xs text-zinc-500">
                <span>{formatFileSize(file.size)}</span>
                <span>{formatDate(file.lastModified)}</span>
              </div>
              
              <div className="flex justify-end space-x-1 mt-2 opacity-80 hover:opacity-100">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-7 w-7 text-zinc-400 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileSelect(file);
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
                    onFileDelete(file);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full">
            {!initialLoadComplete || isLoading ? (
              <div className="flex justify-center py-6">
                <div className="flex items-center gap-2">
                  <Loader className="h-4 w-4 animate-spin text-zinc-400" />
                  <span className="text-sm text-zinc-400">Loading files...</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-zinc-500">
                  {searchQuery ? `No files matching "${searchQuery}"` : "No files found"}
                </p>
                <p className="text-xs text-zinc-600 mt-1">
                  {searchQuery ? "Try a different search term" : "Upload a file to get started"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Loader reference element */}
      {hasMore && (
        <div
          ref={loaderRef}
          className="flex justify-center py-4"
          style={{ height: '60px' }}
        >
          {isLoading && (
            <div className="flex items-center gap-2">
              <Loader className="h-4 w-4 animate-spin text-zinc-400" />
              <span className="text-sm text-zinc-400">Loading more files...</span>
            </div>
          )}
        </div>
      )}
      
      {!hasMore && files.length > 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-zinc-500">
            Showing all {files.length} files
          </p>
        </div>
      )}
    </div>
  );
};
