
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
    if (isFetchingRef.current) {
      console.log("Already fetching, skipping request");
      return;
    }
    
    try {
      isFetchingRef.current = true;
      setIsLoading(true);
      setError(null);
      
      console.log(`Executing fetch for page ${page}`);
      const result = await fetchFn(page);
      
      // Only update items if we got valid data
      if (Array.isArray(result.data)) {
        setItems(prevItems => {
          // If we're on the first page, replace items, otherwise append
          if (page === initialPage) {
            console.log(`Setting initial ${result.data.length} items`);
            return [...result.data];
          } else {
            console.log(`Appending ${result.data.length} items to existing ${prevItems.length}`);
            return [...prevItems, ...result.data];
          }
        });
        
        // Check if we have more items to load
        const totalItems = result.totalCount;
        const loadedItems = (page === initialPage ? 0 : items.length) + result.data.length;
        const hasMoreItems = loadedItems < totalItems;
        
        console.log(`Loaded items: ${loadedItems}, Total items: ${totalItems}, Has more: ${hasMoreItems}`);
        setHasMore(hasMoreItems);
        
        // Increment page for next fetch
        if (hasMoreItems) {
          setPage(prevPage => prevPage + 1);
        }
      } else {
        console.warn("Invalid data format received:", result.data);
      }
    } catch (err) {
      console.error("Error loading items:", err);
      setError(err instanceof Error ? err : new Error('An error occurred while loading more items'));
    } finally {
      setIsLoading(false);
      // Use setTimeout to prevent immediate re-triggering
      setTimeout(() => {
        isFetchingRef.current = false;
      }, 100);
    }
  }, [page, initialPage, items.length]);
  
  const reset = useCallback(() => {
    console.log("Resetting infinite scroll state");
    setItems([]);
    setPage(initialPage);
    setHasMore(true);
    setError(null);
    isFetchingRef.current = false;
  }, [initialPage]);
  
  // Observer for intersection detection
  useEffect(() => {
    if (!loaderRef.current || !hasMore) return;
    
    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries;
        if (entry.isIntersecting && !isFetchingRef.current) {
          console.log("Loader element is intersecting, triggering loadmore");
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
