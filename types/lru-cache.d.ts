declare module 'lru-cache' {
  export class LRUCache<K, V> {
    constructor(options: {
      max?: number;
      ttl?: number;
      updateAgeOnGet?: boolean;
    });
    set(key: K, value: V): void;
    get(key: K): V | undefined;
    delete(key: K): void;
    clear(): void;
    keys(): K[];
    purgeStale(): void;
    readonly size: number;
  }
} 