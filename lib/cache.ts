/**
 * Simple in-memory cache untuk hasil analisis
 * Key format: `${lat},${lng},${radius},${mode}`
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}

const cache = new Map<string, CacheEntry<any>>();

/**
 * Generate cache key dari parameters analisis
 */
export function generateCacheKey(
  lat: number,
  lng: number,
  radius: number,
  mode: string
): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)},${radius},${mode}`;
}

/**
 * Get dari cache jika masih valid (belum expired)
 */
export function get<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > entry.ttl) {
    cache.delete(key);
    return null;
  }

  return entry.data as T;
}

/**
 * Set ke cache dengan TTL
 * Default TTL: 1 hour (3600000 ms)
 */
export function set<T>(key: string, data: T, ttl: number = 3600000): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

/**
 * Clear specific key atau seluruh cache
 */
export function clear(key?: string): void {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

/**
 * Get cache stats (debug purpose)
 */
export function stats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}
