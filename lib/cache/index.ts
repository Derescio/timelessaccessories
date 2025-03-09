import { Redis } from '@upstash/redis';
import { Product, Prisma } from '@prisma/client';

// Types for cache layers
type CacheLayer = 'memory' | 'redis' | 'cdn';

interface CacheConfig {
  memory: {
    ttl: number;
    max: number;
  };
  redis: {
    ttl: number;
  };
}

interface CacheValue<T = unknown> {
  data: T;
  timestamp: number;
}

// Default cache configuration
const DEFAULT_CONFIG: CacheConfig = {
  memory: {
    ttl: 1000 * 60 * 5, // 5 minutes
    max: 500,
  },
  redis: {
    ttl: 1000 * 60 * 60, // 1 hour
  },
};

// Initialize Redis client if URL is available
const redis = process.env.UPSTASH_REDIS_URL
  ? Redis.fromEnv()
  : null;

// Memory cache instance using Map as a fallback
const memoryCache = new Map<string, CacheValue<unknown>>();

// Cache key generator
export function generateCacheKey(
  model: string,
  operation: string,
  args?: Record<string, unknown>
): string {
  return `${model}:${operation}:${args ? JSON.stringify(args) : ''}`;
}

// Multi-layer cache implementation
export class CacheManager {
  private static instance: CacheManager;

  private constructor() {}

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  // Get data from cache layers
  async get<T>(key: string, layers: CacheLayer[] = ['memory', 'redis']): Promise<T | null> {
    // Check memory cache first
    if (layers.includes('memory')) {
      const memoryResult = memoryCache.get(key);
      if (memoryResult && Date.now() - memoryResult.timestamp < DEFAULT_CONFIG.memory.ttl) {
        return memoryResult.data as T;
      } else if (memoryResult) {
        // Remove expired item
        memoryCache.delete(key);
      }
    }

    // Check Redis cache
    if (layers.includes('redis') && redis) {
      try {
        const redisResult = await redis.get<CacheValue<T>>(key);
        if (redisResult) {
          // Update memory cache
          memoryCache.set(key, redisResult);
          return redisResult.data;
        }
      } catch (error) {
        console.error('Redis cache error:', error);
      }
    }

    return null;
  }

  // Set data in cache layers
  async set<T>(
    key: string,
    value: T,
    layers: CacheLayer[] = ['memory', 'redis']
  ): Promise<void> {
    const cacheValue: CacheValue<T> = {
      data: value,
      timestamp: Date.now(),
    };

    // Set in memory cache
    if (layers.includes('memory')) {
      // Clean up old entries if we're at the limit
      if (memoryCache.size >= DEFAULT_CONFIG.memory.max) {
        const oldestKey = Array.from(memoryCache.entries())
          .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
        memoryCache.delete(oldestKey);
      }
      memoryCache.set(key, cacheValue);
    }

    // Set in Redis cache
    if (layers.includes('redis') && redis) {
      try {
        await redis.set(key, cacheValue, {
          ex: Math.floor(DEFAULT_CONFIG.redis.ttl / 1000), // Convert to seconds
        });
      } catch (error) {
        console.error('Redis cache error:', error);
      }
    }
  }

  // Invalidate cache in all layers
  async invalidate(pattern: string): Promise<void> {
    // Clear memory cache
    for (const key of memoryCache.keys()) {
      if (key.startsWith(pattern)) {
        memoryCache.delete(key);
      }
    }

    // Clear Redis cache
    if (redis) {
      try {
        const keys = await redis.keys(pattern + '*');
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } catch (error) {
        console.error('Redis cache invalidation error:', error);
      }
    }
  }

  // Get cache statistics
  async getStats(): Promise<{
    memory: { size: number; itemCount: number };
    redis?: { size: number; itemCount: number };
  }> {
    const stats = {
      memory: {
        size: memoryCache.size,
        itemCount: memoryCache.size,
      },
    };

    if (redis) {
      try {
        const stats = {
          memory: {
            size: memoryCache.size,
            itemCount: memoryCache.size,
          },
          redis: {
            size: 0,
            itemCount: await redis.dbsize(),
          },
        };
        return stats;
      } catch (error) {
        console.error('Redis stats error:', error);
      }
    }

    return stats;
  }

  // Preload frequently accessed data
  async preloadCache<T>(items: Array<{ key: string; value: T }>): Promise<void> {
    for (const { key, value } of items) {
      await this.set(key, value);
    }
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();

// Helper function to wrap database queries with cache
export async function withCache<T>(
  key: string,
  query: () => Promise<T>,
  options: {
    ttl?: number;
    layers?: CacheLayer[];
  } = {}
): Promise<T> {
  const cache = CacheManager.getInstance();
  const layers = options.layers || ['memory', 'redis'];

  // Try to get from cache
  const cached = await cache.get<T>(key, layers);
  if (cached) {
    return cached;
  }

  // Execute query
  const result = await query();

  // Cache the result
  await cache.set(key, result, layers);

  return result;
}

// Product-specific cache helpers
export const productCache = {
  async getProduct(productId: string): Promise<Product | null> {
    return withCache(
      generateCacheKey('product', 'findUnique', { productId }),
      async () => {
        // Your actual database query here
        return null;
      }
    );
  },

  async getProducts(args?: Prisma.ProductFindManyArgs): Promise<Product[]> {
    return withCache(
      generateCacheKey('product', 'findMany', args),
      async () => {
        // Your actual database query here
        return [];
      }
    );
  },

  async invalidateProduct(productId: string): Promise<void> {
    const cache = CacheManager.getInstance();
    await cache.invalidate(`product:${productId}`);
  },
}; 