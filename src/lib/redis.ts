import { memoryCache } from "./memory-cache";

// 扩展内存缓存方法，兼容原Redis接口
export const redisHelper = {
  async get<T>(key: string): Promise<T | null> {
    return memoryCache.get<T>(key);
  },

  async set<T>(
    key: string,
    value: T,
    options?: { ex?: number }
  ): Promise<"OK"> {
    const ttl = options?.ex || 3600; // 默认1小时
    memoryCache.set(key, value, ttl);
    return "OK";
  },

  async del(...keys: string[]): Promise<number> {
    let deleted = 0;
    for (const key of keys) {
      if (memoryCache.delete(key)) {
        deleted++;
      }
    }
    return deleted;
  },

  async keys(pattern: string): Promise<string[]> {
    const allKeys = memoryCache.keys();
    if (pattern === "*") {
      return allKeys;
    }
    // 简单的通配符匹配
    const regex = new RegExp(pattern.replace(/\*/g, ".*"));
    return allKeys.filter(key => regex.test(key));
  },

  // 额外的内存缓存方法
  clear(): void {
    memoryCache.clear();
  },

  has(key: string): boolean {
    return memoryCache.has(key);
  },

  size(): number {
    return memoryCache.size();
  },
};

export default memoryCache;
