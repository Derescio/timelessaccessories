import { prisma } from '@/lib/prisma';

// In-memory cache for geographical data
const cache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function getCacheKey(type: string, params: Record<string, any>): string {
  return `${type}:${JSON.stringify(params)}`;
}

function isExpired(entry: CacheEntry<any>): boolean {
  return Date.now() - entry.timestamp > CACHE_TTL;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

function getCache<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  
  if (!entry || isExpired(entry)) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

/**
 * Get countries with caching
 */
export async function getCachedCountries(params: {
  region?: string;
  search?: string;
  hasStates?: boolean;
  limit?: number;
}) {
  const cacheKey = getCacheKey('countries', params);
  const cached = getCache(cacheKey);
  
  if (cached) {
    return cached;
  }

  const where: any = { isActive: true };
  
  if (params.region) {
    where.region = params.region;
  }
  
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { native: { contains: params.search, mode: 'insensitive' } },
      { iso2: { equals: params.search.toUpperCase() } },
      { iso3: { equals: params.search.toUpperCase() } }
    ];
  }

  if (params.hasStates !== undefined) {
    where.hasStates = params.hasStates;
  }

  const countries = await prisma.country.findMany({
    where,
    select: {
      id: true,
      name: true,
      iso2: true,
      iso3: true,
      emoji: true,
      phoneCode: true,
      hasStates: true,
      region: true,
      subregion: true,
      capital: true,
      currency: true,
      currencySymbol: true,
      native: true,
    },
    orderBy: { name: 'asc' },
    take: params.limit || undefined,
  });

  setCache(cacheKey, countries);
  return countries;
}

/**
 * Get states with caching
 */
export async function getCachedStates(params: {
  countryId: number;
  search?: string;
  hasCities?: boolean;
  limit?: number;
}) {
  const cacheKey = getCacheKey('states', params);
  const cached = getCache(cacheKey);
  
  if (cached) {
    return cached;
  }

  const where: any = {
    countryId: params.countryId,
    isActive: true,
  };
  
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { stateCode: { contains: params.search, mode: 'insensitive' } }
    ];
  }

  if (params.hasCities !== undefined) {
    where.hasCities = params.hasCities;
  }

  const states = await prisma.state.findMany({
    where,
    select: {
      id: true,
      name: true,
      stateCode: true,
      hasCities: true,
      latitude: true,
      longitude: true,
      country: {
        select: {
          id: true,
          name: true,
          iso2: true,
          emoji: true,
        }
      }
    },
    orderBy: { name: 'asc' },
    take: params.limit || undefined,
  });

  setCache(cacheKey, states);
  return states;
}

/**
 * Get cities with caching
 */
export async function getCachedCities(params: {
  countryId: number;
  stateId: number;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const cacheKey = getCacheKey('cities', params);
  const cached = getCache(cacheKey);
  
  if (cached) {
    return cached;
  }

  const where: any = {
    countryId: params.countryId,
    stateId: params.stateId,
    isActive: true,
  };
  
  if (params.search) {
    where.name = {
      contains: params.search,
      mode: 'insensitive',
    };
  }

  const cities = await prisma.city.findMany({
    where,
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      country: {
        select: {
          id: true,
          name: true,
          iso2: true,
          emoji: true,
        }
      },
      state: {
        select: {
          id: true,
          name: true,
          stateCode: true,
        }
      }
    },
    orderBy: { name: 'asc' },
    skip: params.offset || 0,
    take: params.limit || 100,
  });

  // Get total count for pagination
  const totalCount = await prisma.city.count({ where });

  const result = {
    cities,
    totalCount,
    hasMore: (params.offset || 0) + cities.length < totalCount,
  };

  setCache(cacheKey, result);
  return result;
}

/**
 * Get regions with caching
 */
export async function getCachedRegions(withCounts: boolean = false) {
  const cacheKey = getCacheKey('regions', { withCounts });
  const cached = getCache(cacheKey);
  
  if (cached) {
    return cached;
  }

  let result;

  if (withCounts) {
    const regions = await prisma.country.groupBy({
      by: ['region'],
      where: {
        isActive: true,
        region: { not: null },
      },
      _count: { region: true },
      orderBy: { region: 'asc' },
    });

    result = regions.map(region => ({
      name: region.region,
      countryCount: region._count.region,
    }));
  } else {
    const regions = await prisma.country.findMany({
      where: {
        isActive: true,
        region: { not: null },
      },
      select: { region: true },
      distinct: ['region'],
      orderBy: { region: 'asc' },
    });

    result = regions
      .map(r => r.region)
      .filter(Boolean)
      .sort();
  }

  setCache(cacheKey, result);
  return result;
}

/**
 * Clear geographical cache
 */
export function clearGeographicalCache() {
  cache.clear();
}

/**
 * Clear specific cache entries
 */
export function clearCacheByPattern(pattern: string) {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
} 