
import React, { useEffect, useState, useRef } from 'react';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { getFilteredFiles } from '@/services/fileService';
import { FileItem } from '@/components/FileUploader';
import { cn } from '@/lib/utils';
import { FileCard } from '@/components/file/FileItem';
import { FileTypeFilters } from '@/components/file/FileTypeFilters';
import { FileGridLoading } from '@/components/file/FileGridLoading';
import { FileGridEmpty } from '@/components/file/FileGridEmpty';
import { Loader } from 'lucide-react';

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
  const [allFiles, setAllFiles] = useState<FileItem[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
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
    loadMoreDelay: 500
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
  
  // Get all files for counting purposes
  useEffect(() => {
    const fetchAllFiles = async () => {
      try {
        const allFiles = await getFilteredFiles({}, { page: 1, limit: 1000 });
        setAllFiles(allFiles.files);
      } catch (error) {
        console.error('Error fetching all files:', error);
      }
    };
    
    fetchAllFiles();
  }, []);
  
  // Extract unique file types for filtering
  useEffect(() => {
    if (allFiles.length > 0) {
      const types = new Set(allFiles.map(file => file.type));
      setFileTypes(Array.from(types));
    }
  }, [allFiles]);
  
  const toggleFileType = (type: string) => {
    setSelectedFileTypes(prev => 
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };
  
  // Setup intersection observer for infinite scrolling
  useEffect(() => {
    if (!scrollContainerRef.current || !hasMore || isLoading) return;
    
    const container = scrollContainerRef.current;
    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoading) {
        const fetchMoreFiles = async (page: number) => {
          try {
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
        
        loadMore(fetchMoreFiles);
      }
    }, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    });
    
    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    
    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [hasMore, isLoading, loadMore, loaderRef, searchQuery, selectedFileTypes]);
  
  return (
    <div className={cn("space-y-3", className)}>
      {/* File type filters */}
      <FileTypeFilters 
        fileTypes={fileTypes} 
        selectedFileTypes={selectedFileTypes} 
        onToggleFileType={toggleFileType}
        allFiles={allFiles}
      />
      
      {/* Grid of files */}
      <div 
        ref={scrollContainerRef}
        className="grid grid-cols-1 md:grid-cols-3 gap-3 min-h-[300px] max-h-[300px] overflow-auto"
      >
        {files.length > 0 ? (
          <>
            {files.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                isActive={activeFile?.id === file.id}
                onSelect={onFileSelect}
                onDelete={onFileDelete}
              />
            ))}
            
            {/* Loading indicator at the bottom for infinite scroll */}
            {hasMore && (
              <div 
                ref={loaderRef}
                className={cn(
                  "col-span-full flex justify-center py-2",
                  isLoading ? "opacity-100" : "opacity-0"
                )}
              >
                <Loader className="h-4 w-4 animate-spin text-zinc-400" />
              </div>
            )}
          </>
        ) : (!initialLoadComplete || isLoading) ? (
          <FileGridLoading className="col-span-full" />
        ) : (
          <FileGridEmpty searchQuery={searchQuery} />
        )}
      </div>
      
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
