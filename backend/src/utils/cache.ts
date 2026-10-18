// In-memory typed cache with TTL support

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  cachedAt: number;
}

export class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();

  public get<T>(key: string): { value: T; ageSeconds: number } | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return {
      value: entry.value,
      ageSeconds: Math.floor((now - entry.cachedAt) / 1000),
    };
  }

  public set<T>(key: string, value: T, ttlSeconds: number): void {
    const now = Date.now();
    this.store.set(key, {
      value,
      expiresAt: now + ttlSeconds * 1000,
      cachedAt: now,
    });
  }

  public delete(key: string): void {
    this.store.delete(key);
  }

  public clear(): void {
    this.store.clear();
  }
}

export const memoryCache = new MemoryCache();
