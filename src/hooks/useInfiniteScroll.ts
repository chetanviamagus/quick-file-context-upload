
import { useCallback, useEffect, useState, useRef } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number;
  initialPage?: number;
  loadMoreDelay?: number;
}

export function useInfiniteScroll<T>({
  threshold = 200,
  initialPage = 1,
  loadMoreDelay = 300
}: UseInfiniteScrollOptions = {}) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);
  
  const loadMore = useCallback(async (fetchFn: (page: number) => Promise<{ data: T[], totalCount: number, pageSize: number }>) => {
    if (isFetchingRef.current || !hasMore) return;
    
    try {
      isFetchingRef.current = true;
      setIsLoading(true);
      setError(null);
      
      const result = await fetchFn(page);
      
      setItems(prevItems => [...prevItems, ...result.data]);
      
      // Check if we have more items to load
      const totalPages = Math.ceil(result.totalCount / result.pageSize);
      setHasMore(page < totalPages);
      
      // Increment page for next fetch
      setPage(prevPage => prevPage + 1);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred while loading more items'));
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [page, hasMore]);
  
  const reset = useCallback(() => {
    setItems([]);
    setPage(initialPage);
    setHasMore(true);
    setError(null);
  }, [initialPage]);
  
  // Observer for intersection detection
  useEffect(() => {
    if (!loaderRef.current) return;
    
    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries;
        if (entry.isIntersecting && !isFetchingRef.current && hasMore) {
          // Add a small delay to avoid rapid firing
          setTimeout(() => {
            loaderRef.current?.dispatchEvent(new CustomEvent('loadmore'));
          }, loadMoreDelay);
        }
      },
      { 
        rootMargin: `0px 0px ${threshold}px 0px` 
      }
    );
    
    observer.observe(loaderRef.current);
    
    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [hasMore, threshold, loadMoreDelay]);
  
  return {
    items,
    setItems,
    page,
    isLoading,
    hasMore,
    error,
    loaderRef,
    loadMore,
    reset
  };
}
