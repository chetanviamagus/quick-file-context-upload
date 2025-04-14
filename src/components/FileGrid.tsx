
import React, { useEffect, useState } from 'react';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { getFilteredFiles } from '@/services/fileService';
import { FileItem } from '@/components/FileUploader';
import { cn } from '@/lib/utils';
import { FileCard } from '@/components/file/FileItem';
import { FileTypeFilters } from '@/components/file/FileTypeFilters';
import { FileGridLoading } from '@/components/file/FileGridLoading';
import { FileGridEmpty } from '@/components/file/FileGridEmpty';

interface FileGridProps {
  searchQuery: string;
  onFileSelect: (file: FileItem) => void;
  onFileDelete: (file: FileItem) => void;
  activeFile: FileItem | null;
  className?: string;
}

const ITEMS_PER_PAGE = 9; // Display 9 cards at a time

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
  } = useInfiniteScroll<FileItem>({
    threshold: 200,
    initialPage: 1,
    loadMoreDelay: 500 // Increased delay to avoid too many requests
  });
  
  // Reset when search query or file types changes
  useEffect(() => {
    setInitialLoadComplete(false);
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedFileTypes]);
  
  // Load files when component mounts or filters change
  useEffect(() => {
    const fetchFiles = async (page: number) => {
      try {
        console.log(`Fetching page ${page} with ${ITEMS_PER_PAGE} items per page`);
        
        const { files, total } = await getFilteredFiles(
          {
            query: searchQuery,
            fileTypes: selectedFileTypes.length > 0 ? selectedFileTypes : undefined
          },
          { page, limit: ITEMS_PER_PAGE }
        );
        
        // Debug
        console.log(`Fetched ${files.length} files. Total: ${total}`);
        
        if (page === 1) {
          setInitialLoadComplete(true);
        }
        
        return {
          data: files,
          totalCount: total,
          pageSize: ITEMS_PER_PAGE
        };
      } catch (error) {
        console.error('Error fetching files:', error);
        return {
          data: [],
          totalCount: 0,
          pageSize: ITEMS_PER_PAGE
        };
      }
    };
    
    loadMore(fetchFiles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedFileTypes]);
  
  // Listen for loadmore events for infinite scrolling
  useEffect(() => {
    if (!loaderRef.current || !hasMore) return;
    
    const loaderElement = loaderRef.current;
    
    const handleLoadMore = async () => {
      if (isLoading) return; // Prevent multiple simultaneous requests
      
      const fetchFiles = async (page: number) => {
        try {
          console.log(`Loading more: page ${page}`);
          
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
        } catch (error) {
          console.error('Error fetching more files:', error);
          return {
            data: [],
            totalCount: 0,
            pageSize: ITEMS_PER_PAGE
          };
        }
      };
      
      loadMore(fetchFiles);
    };
    
    loaderElement.addEventListener('loadmore', handleLoadMore);
    
    return () => {
      loaderElement.removeEventListener('loadmore', handleLoadMore);
    };
  }, [loadMore, loaderRef, searchQuery, selectedFileTypes, isLoading, hasMore]);
  
  // Extract unique file types for filtering
  useEffect(() => {
    const fetchFileTypes = async () => {
      try {
        const allFiles = await getFilteredFiles({}, { page: 1, limit: 1000 });
        const types = new Set(allFiles.files.map(file => file.type));
        setFileTypes(Array.from(types));
      } catch (error) {
        console.error('Error fetching file types:', error);
        setFileTypes([]);
      }
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
  
  // Debug
  useEffect(() => {
    console.log('Files state:', {
      filesLength: files.length,
      isLoading,
      initialLoadComplete,
      hasFiles: files.length > 0
    });
  }, [files, isLoading, initialLoadComplete]);
  
  return (
    <div className={cn("space-y-3", className)}>
      {/* File type filters */}
      <FileTypeFilters 
        fileTypes={fileTypes} 
        selectedFileTypes={selectedFileTypes} 
        onToggleFileType={toggleFileType} 
      />
      
      {/* Grid of files */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 min-h-[300px] max-h-[300px] overflow-auto">
        {files.length > 0 ? (
          files.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              isActive={activeFile?.id === file.id}
              onSelect={onFileSelect}
              onDelete={onFileDelete}
            />
          ))
        ) : (!initialLoadComplete || isLoading) ? (
          <FileGridLoading className="col-span-full" />
        ) : (
          <FileGridEmpty searchQuery={searchQuery} />
        )}
      </div>
      
      {/* Loader reference element for infinite scrolling */}
      {hasMore && (
        
          {isLoading && (
      <div ref={loaderRef} className="flex justify-center py-4">
            <FileGridLoading message="Loading more files..." showSkeletons={false} />
        </div>  )}
        
      )}
      
      {/* End of list message */}
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
