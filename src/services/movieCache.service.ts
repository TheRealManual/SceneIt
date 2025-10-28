// Simple in-memory cache for movie data and images
class MovieCacheService {
  private cache: Map<string, any> = new Map();
  private imageCachePromises: Map<string, Promise<void>> = new Map();

  // Cache movie search results
  setCachedMovies(key: string, movies: any[], expiryMs: number = 30000) {
    const cacheEntry = {
      movies,
      timestamp: Date.now(),
      expiryMs
    };
    this.cache.set(key, cacheEntry);
    
    // Auto-expire after specified time
    setTimeout(() => {
      this.cache.delete(key);
    }, expiryMs);
  }

  // Get cached movies if not expired
  getCachedMovies(key: string): any[] | null {
    const cacheEntry = this.cache.get(key);
    
    if (!cacheEntry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() - cacheEntry.timestamp > cacheEntry.expiryMs) {
      this.cache.delete(key);
      return null;
    }
    
    return cacheEntry.movies;
  }

  // Clear specific cache
  clearCache(key: string) {
    this.cache.delete(key);
  }

  // Clear all caches
  clearAllCaches() {
    this.cache.clear();
    this.imageCachePromises.clear();
  }

  // Preload images for movies
  async preloadImages(movies: any[]): Promise<void> {
    const imagePromises = movies.map((movie: any) => {
      const posterUrl = `https://image.tmdb.org/t/p/w500${movie.posterPath}`;
      
      // Return cached promise if already loading/loaded
      if (this.imageCachePromises.has(posterUrl)) {
        return this.imageCachePromises.get(posterUrl)!;
      }
      
      // Create new image preload promise
      const promise = new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Resolve even on error to not block
        img.src = posterUrl;
      });
      
      this.imageCachePromises.set(posterUrl, promise);
      return promise;
    });
    
    await Promise.all(imagePromises);
  }

  // Generate cache key for search
  generateSearchCacheKey(preferences: any, devMode: boolean = false): string {
    if (devMode) {
      return 'random-movies-dev';
    }
    
    // Create a stable key from preferences
    return `search-${JSON.stringify(preferences)}`;
  }
}

export const movieCacheService = new MovieCacheService();
